'use client'

import { useState } from 'react'
import type { AppSettings } from '@/services/neon/settings'
import AppearancePanel from './appearance-panel'
import ResourcesPanel from './resources-panel'

const TABS = ['Utilisateurs', 'Apparence', 'Ressources'] as const
type Tab = typeof TABS[number]

interface Props {
  usersPanel: React.ReactNode
  settings: AppSettings
}

export default function AdminTabs({ usersPanel, settings }: Props) {
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
      {tab === 'Apparence' && <AppearancePanel settings={settings} />}
      {tab === 'Ressources' && <ResourcesPanel />}
    </div>
  )
}
