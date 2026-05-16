'use client'

import { useState } from 'react'
import Link from 'next/link'
import { STATUT_LABELS_GESTION, STATUT_COLORS } from '@/lib/config'
import CandidatureTimeline from '@/components/gestion/candidature-timeline'
import type { Candidature, Chercheur } from '@/types'

const TABS = ['En cours', 'Retenues', 'Refusées'] as const
type Tab = typeof TABS[number]

const TAB_STATUTS: Record<Tab, string[]> = {
  'En cours':  ['Soumise', 'Envoyée au CS', 'En évaluation', 'En délibération CS'],
  'Retenues':  ['Retenue'],
  'Refusées':  ['Refusée'],
}

interface Props {
  candidatures: Candidature[]
  chercheurMap: Record<string, string>
}

export default function CandidaturesTabs({ candidatures, chercheurMap }: Props) {
  const [tab, setTab] = useState<Tab>('En cours')

  const filtered = candidatures.filter(c => TAB_STATUTS[tab].includes(c.statut))

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {TABS.map(t => {
          const count = candidatures.filter(c => TAB_STATUTS[t].includes(c.statut)).length
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                tab === t ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t} <span className="text-muted-foreground font-normal">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune candidature dans cette catégorie.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="relative rounded-xl bg-background p-6 space-y-4 shadow-[0_0_14px_rgba(0,0,0,0.07)]">
              <Link href={`/gestion/candidatures/${c.id}`} className="absolute inset-0 rounded-xl" />

              {/* 3 colonnes */}
              <div className="flex gap-8 items-start">
                {/* Col 1 : titre + statut */}
                <div className="w-52 shrink-0 space-y-2">
                  <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${STATUT_COLORS[c.statut] ?? 'bg-zinc-100 text-zinc-700'}`}>
                    {STATUT_LABELS_GESTION[c.statut as keyof typeof STATUT_LABELS_GESTION] ?? c.statut}
                  </span>
                  <p className="font-heading text-base font-medium leading-snug">{c.titre}</p>
                  <p className="text-xs text-muted-foreground">{c.thematique ?? '—'}</p>
                </div>

                {/* Col 2 : méta en grille label | valeur */}
                <div className="shrink-0 w-60 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm content-start">
                  <p className="text-xs text-muted-foreground self-center">Candidat</p>
                  <p className="truncate">{c.chercheurId ? (chercheurMap[c.chercheurId] ?? '—') : '—'}</p>
                  <p className="text-xs text-muted-foreground self-center">Financement</p>
                  <p className="tabular-nums">{c.budgetDemande ? `${c.budgetDemande.toLocaleString('fr-FR')} €` : '—'}</p>
                  <p className="text-xs text-muted-foreground self-center">Durée</p>
                  <p>{c.dureeMois ? `${c.dureeMois} mois` : '—'}</p>
                </div>

                {/* Col 3 : timeline */}
                <div className="flex-1 min-w-0">
                  <CandidatureTimeline statut={c.statut} dateSoumission={c.dateSoumission} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
