'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import Link from 'next/link'
import { useChatMessages, type Message } from '@/components/layout/chat-provider'

function parseContent(text: string): React.ReactNode[] {
  const parts = text.split(/(\[SOURCE:[^\]]+\])/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[SOURCE:([^|]+)\|([^\]]+)\]$/)
    if (match) {
      const [, href, label] = match
      return (
        <Link
          key={href}
          href={href}
          className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          ↗ {label}
        </Link>
      )
    }
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g)
    return boldParts.map((bp, j) => {
      if (bp.startsWith('**') && bp.endsWith('**')) {
        return <strong key={j}>{bp.slice(2, -2)}</strong>
      }
      return bp
    })
  })
}

function AssistantMessage({ content }: { content: string }) {
  const paragraphs = content.split('\n').filter(p => p.trim() !== '')
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground">
      {paragraphs.map((p, i) => (
        <p key={`para-${i}`}>{parseContent(p)}</p>
      ))}
    </div>
  )
}

export default function ChatInterface() {
  const { messages, setMessages, pendingMessage, setPendingMessage } = useChatMessages()
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  useEffect(() => {
    if (!pendingMessage) return
    setPendingMessage(null)
    const userMessage: Message = { role: 'user', content: pendingMessage }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setStreaming(true)
    setStreamingContent('')

    fetch('/api/gestion/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    }).then(async res => {
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value)
        setStreamingContent(full)
      }
      setMessages(prev => [...prev, { role: 'assistant', content: full }])
      setStreamingContent('')
      setStreaming(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit() {
    const trimmed = input.trim()
    if (!trimmed || streaming) return

    const userMessage: Message = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)
    setStreamingContent('')

    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const res = await fetch('/api/gestion/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let full = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      full += decoder.decode(value)
      setStreamingContent(full)
    }

    setMessages(prev => [...prev, { role: 'assistant', content: full }])
    setStreamingContent('')
    setStreaming(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
  }

  return (
    <>
      {/* Zone messages — padding-bottom pour ne pas être masqué par l'input fixe */}
      <div className="-mx-8 -mt-5 overflow-y-auto" style={{ height: 'calc(100vh - 3.5rem - 90px)' }}>
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
          {messages.length === 0 && !streaming && (
            <p className="text-sm text-muted-foreground text-center pt-16">
              Posez une question sur les candidatures, les évaluations ou les chercheurs.
            </p>
          )}

          {messages.map((m, i) => (
            <div key={`msg-${i}`} className={m.role === 'user' ? 'flex justify-end' : ''}>
              {m.role === 'user' ? (
                <div className="max-w-md rounded-2xl bg-zinc-200 px-5 py-3.5 text-sm leading-relaxed text-foreground">
                  {m.content}
                </div>
              ) : (
                <AssistantMessage content={m.content} />
              )}
            </div>
          ))}

          {streaming && streamingContent && (
            <AssistantMessage content={streamingContent} />
          )}

          {streaming && !streamingContent && (
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <span
                  key={`dot-${i}`}
                  className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input fixe en bas */}
      <div className="fixed bottom-0 left-60 right-0 z-30 border-t border-border bg-background px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Posez une question…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-muted/40 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
            style={{ maxHeight: '160px' }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || streaming}
            className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 max-w-3xl mx-auto">
          Entrée pour envoyer · Maj+Entrée pour un saut de ligne
        </p>
      </div>
    </>
  )
}
