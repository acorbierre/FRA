'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, NotebookPen, BriefcaseBusiness, Microscope, Users, FlaskConical, BarChart2, Settings, Sparkles, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import AppSidebarBrand from './app-sidebar-brand'
import AppSidebarSignout from './app-sidebar-signout'

const NAV_SECTIONS = [
  {
    label: 'Gestion et suivi',
    items: [
      { href: '/gestion/candidatures',   label: 'Candidatures',        icon: NotebookPen },
      { href: '/gestion/conventions',    label: 'Conventions',          icon: BriefcaseBusiness },
      { href: '/gestion/suivi',          label: 'Projets de recherche', icon: Microscope },
      { href: '/gestion/projets/agenda', label: 'Agenda financier',     icon: CalendarDays },
    ],
  },
  {
    label: 'Consultation',
    items: [
      { href: '/gestion/activite',          label: 'Activité de la FRA',  icon: BarChart2 },
      { href: '/gestion/chercheurs-labos',  label: 'Chercheurs & labos',  icon: Users },
      { href: '/gestion/projets',           label: 'Projets financés',    icon: Microscope, exact: true },
    ],
  },
]

const NAV_BOTTOM = [
  { href: '/gestion/chat',  label: 'Chat IA', icon: Sparkles },
  { href: '/gestion/admin', label: 'Admin',   icon: Settings },
]

interface Props { nbCandidaturesRecues: number }

export default function GestionSidebar({ nbCandidaturesRecues }: Props) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 z-40 bg-white border-r border-border flex flex-col">
      <AppSidebarBrand />

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <Link
          href="/gestion"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
            pathname === '/gestion'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Home className="size-4 shrink-0" />
          Accueil
        </Link>

        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, exact }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    (exact ? pathname === href : pathname.startsWith(href))
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {href === '/gestion/candidatures' && nbCandidaturesRecues > 0 && (
                    <span className="ml-auto size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                      {nbCandidaturesRecues}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-border space-y-0.5 shrink-0">
        {NAV_BOTTOM.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </div>

      <AppSidebarSignout />
    </aside>
  )
}
