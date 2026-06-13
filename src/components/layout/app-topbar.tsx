'use client'

import { Globe } from 'lucide-react'
import NotificationBell from './notification-bell'

interface Props {
  title: string
  showBell?: boolean
}

export default function AppTopbar({ title, showBell }: Props) {
  return (
    <header className="fixed top-0 left-60 right-0 h-16 z-40 bg-[#fbfbfb] flex items-center justify-between px-8">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      <div className="flex items-center gap-3">
        {showBell && <NotificationBell />}
        <a href="/carto" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Cartographie">
          <Globe className="size-4" />
        </a>
      </div>
    </header>
  )
}
