'use client'

import { useState } from 'react'
import UtilisateursListe from '../utilisateurs/utilisateurs-list'
import LaboratoiresListe from '../laboratoires/laboratoires-list'
import type { Utilisateur, Laboratoire } from '@/types'

const TABS = ['Utilisateurs', 'Laboratoires'] as const
type Tab = typeof TABS[number]

interface Props {
  utilisateurs: Utilisateur[]
  labos: Laboratoire[]
}

export default function UtilisateurLabosTabs({ utilisateurs, labos }: Props) {
  const [tab, setTab] = useState<Tab>('Utilisateurs')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              tab === t ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
            <span className="ml-1.5 text-muted-foreground font-normal">
              ({t === 'Utilisateurs' ? utilisateurs.length : labos.length})
            </span>
          </button>
        ))}
      </div>

      {tab === 'Utilisateurs' && <UtilisateursListe utilisateurs={utilisateurs} />}
      {tab === 'Laboratoires' && <LaboratoiresListe labos={labos} />}
    </div>
  )
}
