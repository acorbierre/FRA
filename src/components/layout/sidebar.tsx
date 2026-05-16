'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import AppSidebarBrand from './app-sidebar-brand'
import AppSidebarSignout from './app-sidebar-signout'

const NAV_BASE = [
  { href: '/espace',        label: 'Accueil',    icon: Home },
  { href: '/espace/profil', label: 'Mon profil', icon: User },
]

const NAV_CANDIDATURE = { href: '/espace/candidature', label: 'Ma candidature', icon: FileText }

interface Props { hasCandidature: boolean }

export default function Sidebar({ hasCandidature }: Props) {
  const pathname = usePathname()

  const nav = hasCandidature
    ? [NAV_BASE[0], NAV_CANDIDATURE, NAV_BASE[1]]
    : NAV_BASE

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 z-40 bg-white border-r border-border flex flex-col">
      <AppSidebarBrand />
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <AppSidebarSignout />
    </aside>
  )
}
