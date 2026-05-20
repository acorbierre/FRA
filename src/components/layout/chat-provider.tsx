'use client'

import { createContext, useContext, useState } from 'react'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatContextValue {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  pendingMessage: string | null
  setPendingMessage: (msg: string | null) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  return (
    <ChatContext.Provider value={{ messages, setMessages, pendingMessage, setPendingMessage }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatMessages() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatMessages must be used within ChatProvider')
  return ctx
}
