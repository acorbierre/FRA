'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import AppSidebarBrand from './app-sidebar-brand'
import AppSidebarSignout from './app-sidebar-signout'

interface Props {
  candidatures: { id: string; titre: string }[]
  photoUrl?: string
}

export default function ReviewerSidebar({ candidatures, photoUrl }: Props) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 z-40 bg-white border-r border-border flex flex-col">
      <AppSidebarBrand />
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <Link
          href="/reviewer"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
            pathname === '/reviewer'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Home className="size-4 shrink-0" />
          Accueil
        </Link>

        {candidatures.map((c) => (
          <Link
            key={c.id}
            href={`/reviewer/${c.id}`}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === `/reviewer/${c.id}`
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <FileText className="size-4 shrink-0" />
            <span className="truncate">{c.titre}</span>
          </Link>
        ))}

        <Link
          href="/reviewer/profil"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
            pathname.startsWith('/reviewer/profil')
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <User className="size-4 shrink-0" />
          Mon profil
        </Link>
      </nav>
      <AppSidebarSignout photoUrl={photoUrl} />
    </aside>
  )
}
