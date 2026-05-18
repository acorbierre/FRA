'use client'

import { useState } from 'react'
import type { AppSettings } from '@/services/neon/settings'
import type { Thematique } from '@/services/neon/thematiques'
import ThematiquesPanel from './thematiques-panel'
import AppearancePanel from './appearance-panel'

const SUBTABS = ['Thématiques', 'Statuts candidatures', 'Statuts projets'] as const
type SubTab = typeof SUBTABS[number]

interface Props {
  settings: AppSettings
  thematiques: Thematique[]
}

export default function AppelsPanel({ settings, thematiques }: Props) {
  const [subtab, setSubtab] = useState<SubTab>('Thématiques')

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-border">
        {SUBTABS.map(t => (
          <button
            key={t}
            onClick={() => setSubtab(t)}
            className={`pb-2 text-xs font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              subtab === t
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {subtab === 'Thématiques' && <ThematiquesPanel thematiques={thematiques} />}
      {subtab === 'Statuts candidatures' && <AppearancePanel settings={settings} section="candidatures" />}
      {subtab === 'Statuts projets' && <AppearancePanel settings={settings} section="projets" />}
    </div>
  )
}
