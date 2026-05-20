'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUp } from 'lucide-react'
import { useChatMessages } from '@/components/layout/chat-provider'

export default function HomeChatInput() {
  const [value, setValue] = useState('')
  const { setPendingMessage } = useChatMessages()
  const router = useRouter()

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed) return
    setPendingMessage(trimmed)
    router.push('/gestion/chat')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border-0 bg-muted px-4 py-2.5 focus-within:ring-1 focus-within:ring-ring">
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Demandez quelque chose à l'IA…"
        className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground"
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0"
      >
        <ArrowUp className="size-3.5" />
      </button>
    </div>
  )
}
