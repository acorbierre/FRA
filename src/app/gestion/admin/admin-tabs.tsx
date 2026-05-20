'use client'

import { useState } from 'react'
import { Users, Microscope, Settings } from 'lucide-react'
import type { AppSettings } from '@/services/neon/settings'
import type { Thematique } from '@/services/neon/thematiques'
import AppelsPanel from './appels-panel'
import ResourcesPanel from './resources-panel'

const TABS = [
  { id: 'Utilisateurs',    label: 'Utilisateurs',    icon: Users },
  { id: 'Appels à projets', label: 'Appels à projets', icon: Microscope },
  { id: 'Ressources',      label: 'Ressources',       icon: Settings },
] as const
type Tab = typeof TABS[number]['id']

interface Props {
  usersPanel: React.ReactNode
  settings: AppSettings
  thematiques: Thematique[]
}

export default function AdminTabs({ usersPanel, settings, thematiques }: Props) {
  const [tab, setTab] = useState<Tab>('Utilisateurs')

  return (
    <div className="space-y-6">
      <div className="flex gap-6 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 pb-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              tab === id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'Utilisateurs' && usersPanel}
      {tab === 'Appels à projets' && <AppelsPanel settings={settings} thematiques={thematiques} />}
      {tab === 'Ressources' && <ResourcesPanel />}
    </div>
  )
}
