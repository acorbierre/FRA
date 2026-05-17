'use client'

import Link from 'next/link'
import { Database, Network, Users, GitBranch, ExternalLink, Clock } from 'lucide-react'

type ResourceCard = {
  icon: React.ElementType
  title: string
  description: string
  badge?: string
  href?: string
  external?: boolean
  soon?: boolean
}

const RESOURCES: ResourceCard[] = [
  {
    icon: Network,
    title: 'Schéma de données',
    description: 'Diagramme interactif des tables et relations de la base de données.',
    href: '/gestion/schema',
  },
  {
    icon: Database,
    title: 'Console Neon',
    description: 'Accès direct à la base de données PostgreSQL (requêtes, branches, monitoring).',
    href: 'https://console.neon.tech',
    external: true,
  },
  {
    icon: Users,
    title: 'Dashboard Clerk',
    description: 'Gestion des utilisateurs, sessions actives et configuration de l\'authentification.',
    href: 'https://dashboard.clerk.com',
    external: true,
  },
  {
    icon: GitBranch,
    title: 'User flow',
    description: 'Cinématique UX croisée Admin / Candidat / Examinateur.',
    badge: 'FigJam',
    soon: true,
  },
]

function Card({ card }: { card: ResourceCard }) {
  const Icon = card.icon

  const inner = (
    <div
      className={`group relative flex flex-col gap-3 rounded-xl border p-5 transition-colors ${
        card.soon
          ? 'border-border bg-muted/30 cursor-default'
          : 'border-border bg-white hover:border-primary/40 hover:shadow-sm cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex size-10 items-center justify-center rounded-lg ${
            card.soon ? 'bg-muted text-muted-foreground' : 'bg-primary/8 text-primary'
          }`}
        >
          <Icon className="size-5" />
        </div>
        <div className="flex items-center gap-1.5">
          {card.badge && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {card.badge}
            </span>
          )}
          {card.soon ? (
            <Clock className="size-3.5 text-muted-foreground/50" />
          ) : card.external ? (
            <ExternalLink className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          ) : null}
        </div>
      </div>

      <div>
        <p className={`text-sm font-semibold ${card.soon ? 'text-muted-foreground' : 'text-foreground'}`}>
          {card.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
          {card.description}
        </p>
      </div>

    </div>
  )

  if (card.soon || !card.href) return inner

  if (card.external) {
    return (
      <a href={card.href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    )
  }

  return <Link href={card.href}>{inner}</Link>
}

export default function ResourcesPanel() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Accès centralisé aux outils techniques et de conception du projet.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {RESOURCES.map(card => (
          <Card key={card.title} card={card} />
        ))}
      </div>
    </div>
  )
}
