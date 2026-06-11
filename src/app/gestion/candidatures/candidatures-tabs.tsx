'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, FlaskConical, Scan, Users, Dna, Shield, Microscope, type LucideIcon } from 'lucide-react'
import type { Candidature } from '@/types'

function getThematiqueIcon(label?: string | null): LucideIcon {
  const l = (label ?? '').toLowerCase()
  if (l.includes('biomarqu'))                                                return FlaskConical
  if (l.includes('imagerie'))                                                return Scan
  if (l.includes('cohorte'))                                                 return Users
  if (l.includes('génétique') || l.includes('genetique'))                    return Dna
  if (l.includes('barrière') || l.includes('barriere') || l.includes('hémato') || l.includes('hemato')) return Shield
  return Microscope
}

function ThematiqueAvatar({ label }: { label?: string | null }) {
  const Icon = getThematiqueIcon(label)
  return <Icon className="shrink-0 size-5 text-muted-foreground" />
}

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
  statutColors: Record<string, string>
  statutLabelsGestion: Record<string, string>
}

export default function CandidaturesTabs({ candidatures, chercheurMap, statutColors, statutLabelsGestion }: Props) {
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
        <div className="space-y-2">
          {filtered.map(c => {
            const meta = [
              c.utilisateurId ? (chercheurMap[c.utilisateurId] ?? null) : null,
              c.budgetDemande ? `${c.budgetDemande.toLocaleString('fr-FR')} €` : null,
              c.dureeMois ? `${c.dureeMois} mois` : null,
            ].filter(Boolean).join(' · ')

            return (
              <div key={c.id} className="relative rounded-xl bg-background px-7 py-5 flex flex-col gap-3 shadow-[0_0_14px_rgba(0,0,0,0.07)]">
                <Link href={`/gestion/candidatures/${c.id}`} className="absolute inset-0 rounded-xl" />

                {/* Ligne 1 : pill statut */}
                <div className="pointer-events-none">
                  <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${statutColors[c.statut] ?? 'bg-zinc-100 text-zinc-700'}`}>
                    {statutLabelsGestion[c.statut] ?? c.statut}
                  </span>
                </div>

                {/* Ligne 2 : icône + titre/meta + chevron */}
                <div className="flex items-start gap-6">
                  <div className="mt-0.5"><ThematiqueAvatar label={c.thematique} /></div>
                  <div className="flex-1 min-w-0 pointer-events-none">
                    <p className="font-heading font-medium text-base leading-snug mb-1">{c.titre}</p>
                    {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground/40 shrink-0 mt-1" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
