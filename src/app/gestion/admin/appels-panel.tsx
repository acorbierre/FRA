'use client'

import { useState } from 'react'
import type { AppSettings } from '@/services/neon/settings'
import type { Thematique } from '@/services/neon/thematiques'
import ThematiquesPanel from './thematiques-panel'
import AppearancePanel from './appearance-panel'

const SUBTABS = ['Thématiques de recherche', 'Statuts candidatures', 'Statuts projets'] as const
type SubTab = typeof SUBTABS[number]

interface Props {
  settings: AppSettings
  thematiques: Thematique[]
}

export default function AppelsPanel({ settings, thematiques }: Props) {
  const [subtab, setSubtab] = useState<SubTab>('Thématiques de recherche')

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {SUBTABS.map(t => (
          <button
            key={t}
            onClick={() => setSubtab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              subtab === t ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {subtab === 'Thématiques de recherche' && <ThematiquesPanel thematiques={thematiques} />}
      {subtab === 'Statuts candidatures' && <AppearancePanel settings={settings} section="candidatures" />}
      {subtab === 'Statuts projets' && <AppearancePanel settings={settings} section="projets" />}
    </div>
  )
}
