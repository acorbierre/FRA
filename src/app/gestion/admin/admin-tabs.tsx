'use client'

import { useState } from 'react'
import type { AppSettings } from '@/services/neon/settings'
import type { Thematique } from '@/services/neon/thematiques'
import AppelsPanel from './appels-panel'
import ResourcesPanel from './resources-panel'

const TABS = ['Utilisateurs', 'Appels à projets', 'Ressources'] as const
type Tab = typeof TABS[number]

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
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              tab === t
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Utilisateurs' && usersPanel}
      {tab === 'Appels à projets' && <AppelsPanel settings={settings} thematiques={thematiques} />}
      {tab === 'Ressources' && <ResourcesPanel />}
    </div>
  )
}
