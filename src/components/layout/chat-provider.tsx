'use client'

import { createContext, useContext, useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatContextValue {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  return (
    <ChatContext.Provider value={{ messages, setMessages }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatMessages() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatMessages must be used within ChatProvider')
  return ctx
}
