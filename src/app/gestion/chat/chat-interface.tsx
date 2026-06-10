'use client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { SpeechRecognition: any; webkitSpeechRecognition: any } }

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Mic, MicOff } from 'lucide-react'
import Link from 'next/link'
import { useChatMessages, type Message } from '@/components/layout/chat-provider'

function parseContent(text: string): React.ReactNode[] {
  const parts = text.split(/(\[SOURCE:[^\]]+\])/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[SOURCE:([^|\]]+)(?:\|([^\]]*))?\]$/)
    if (match) {
      const [, href, rawLabel] = match
      const label = rawLabel?.trim() || href.split('/').filter(Boolean).pop() || 'Voir'
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
  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let listItems: string[] = []
  let k = 0

  function flushList() {
    if (!listItems.length) return
    blocks.push(
      <ul key={k++} className="space-y-1.5 my-1">
        {listItems.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-foreground">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
            <span>{parseContent(item)}</span>
          </li>
        ))}
      </ul>
    )
    listItems = []
  }

  let tableRows: string[][] = []

  function flushTable() {
    if (!tableRows.length) return
    const [head, ...body] = tableRows
    blocks.push(
      <div key={k++} className="overflow-x-auto my-2">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {head.map((cell, i) => (
                <th key={i} className="text-left px-3 py-2 font-semibold text-foreground border-b border-border bg-muted/40 first:rounded-tl-lg last:rounded-tr-lg">{cell.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 text-foreground/80">{parseContent(cell.trim())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    tableRows = []
  }

  for (const line of lines) {
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList()
      const cells = line.split('|').slice(1, -1)
      if (!cells.every(c => /^[-: ]+$/.test(c))) tableRows.push(cells)
    } else if (line.startsWith('## ')) {
      flushList(); flushTable()
      blocks.push(<p key={k++} className="font-heading font-semibold text-base text-foreground mt-4 mb-2">{parseContent(line.slice(3))}</p>)
    } else if (line.startsWith('### ')) {
      flushList(); flushTable()
      blocks.push(<p key={k++} className="font-semibold text-sm text-foreground mt-3 mb-1.5">{parseContent(line.slice(4))}</p>)
    } else if (line.match(/^[-*] /)) {
      flushTable()
      listItems.push(line.slice(2))
    } else if (line.trim() === '') {
      flushList(); flushTable()
    } else {
      flushList(); flushTable()
      blocks.push(<p key={k++} className="text-sm leading-relaxed text-foreground">{parseContent(line)}</p>)
    }
  }
  flushList(); flushTable()

  return <div className="space-y-2">{blocks}</div>
}

export default function ChatInterface() {
  const { messages, setMessages, pendingMessage, setPendingMessage } = useChatMessages()
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [listening, setListening] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  function toggleVoice() {
    const SpeechRecognition = window.SpeechRecognition || (window as typeof window & { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition
    if (!SpeechRecognition) return

    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.interimResults = false
    recognitionRef.current = recognition

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.onresult = (e: any) => {
      const raw = e.results[0][0].transcript
      const transcript = raw.replace(/\b(fera|f'ra|fra|frat|phra)\b/gi, 'FRA')
      setInput(prev => prev ? `${prev} ${transcript}` : transcript)
      textareaRef.current?.focus()
    }
    recognition.start()
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault()
        toggleVoice()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening])

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
            <AssistantMessage content={streamingContent.replace(/\[SOURCE:[^\]]*$/, '')} />
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
        <div className="max-w-3xl mx-auto flex items-end gap-2 rounded-xl border border-input bg-muted/40 px-3 focus-within:ring-1 focus-within:ring-ring">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Posez une question…"
            rows={1}
            className="flex-1 resize-none bg-transparent py-3 text-sm focus:outline-none leading-relaxed"
            style={{ maxHeight: '160px' }}
          />
          <div className="flex items-center gap-1 py-2 shrink-0">
            <button
              onClick={toggleVoice}
              title={listening ? "Arrêter l'écoute (⌘M)" : 'Dicter une question (⌘M)'}
              className={`size-9 rounded-lg flex items-center justify-center transition-colors ${
                listening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || streaming}
              className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 max-w-3xl mx-auto">
          Entrée pour envoyer · Maj+Entrée pour saut de ligne · ⌘M pour dicter
        </p>
      </div>
    </>
  )
}
