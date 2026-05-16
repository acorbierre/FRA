'use client'

import { Bell } from 'lucide-react'

interface Props {
  title: string
  showBell?: boolean
}

export default function AppTopbar({ title, showBell }: Props) {
  return (
    <header className="fixed top-0 left-60 right-0 h-16 z-40 bg-[#fbfbfb] flex items-center justify-between px-8">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      {showBell && (
        <button className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <Bell className="size-4" />
        </button>
      )}
    </header>
  )
}
