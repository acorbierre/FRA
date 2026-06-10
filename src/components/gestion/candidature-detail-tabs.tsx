'use client'

import { useState } from 'react'
import CandidatureTimeline from '@/components/gestion/candidature-timeline'
import EvaluationTab from '@/components/gestion/evaluation-tab'
import type { Candidature, Utilisateur } from '@/types'
import type { Evaluation } from '@/services/neon/evaluations'
import { FIELD_LABELS } from '@/lib/config'
import { cn } from '@/lib/utils'

interface Props {
  candidature: Candidature
  chercheurNom?: string | null
  reviewers: Utilisateur[]
  evaluations: Evaluation[]
  statutColors: Record<string, string>
  statutLabelsGestion: Record<string, string>
}

type Tab = 'dossier' | 'evaluation'

export default function CandidatureDetailTabs({ candidature: c, chercheurNom, reviewers, evaluations, statutColors, statutLabelsGestion }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('dossier')
  const statut = c.statut ?? 'Brouillon'
  const nbSoumises = evaluations.filter(e => e.statut === 'Soumise').length

  return (
    <div style={{ filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.09))' }}>
      {/* Tab bar */}
      <div className="flex items-end gap-1">
        {(['dossier', 'evaluation'] as Tab[]).map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative cursor-pointer',
                isActive
                  ? 'bg-card -mb-px z-10 text-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {tab === 'dossier' ? 'Dossier' : (
                <span className="flex items-center gap-1.5">
                  Évaluation
                  <span className="text-xs text-muted-foreground font-normal">({nbSoumises}/2 reçues)</span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content panel */}
      <div className={cn(
        'bg-card rounded-b-xl divide-y divide-border',
        activeTab === 'dossier' ? 'rounded-tr-xl' : 'rounded-tl-xl'
      )}>
        {activeTab === 'dossier' && (
          <>
            <div className="px-8 py-6 flex items-center gap-8">
              <div className="space-y-1.5 shrink-0">
                <span className={`inline-block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium ${statutColors[statut] ?? 'bg-zinc-100 text-zinc-700'}`}>
                  {statutLabelsGestion[statut] ?? statut}
                </span>
                <p className="font-heading text-base font-medium leading-snug">{c.titre}</p>
                {chercheurNom && <p className="text-sm text-muted-foreground">{chercheurNom}</p>}
              </div>
              <div className="flex-1 min-w-0">
                <CandidatureTimeline statut={statut} dateSoumission={c.dateSoumission} />
              </div>
            </div>

            <div className="px-8 py-6 space-y-5 text-sm">
              <Field label={FIELD_LABELS.thematique} value={c.thematique} />
              <Field label="Résumé" value={c.resume} multiline />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Budget demandé" value={c.budgetDemande ? `${c.budgetDemande.toLocaleString('fr-FR')} €` : '—'} />
                <Field label="Durée" value={c.dureeMois ? `${c.dureeMois} mois` : '—'} />
              </div>
              {c.partenaires && <Field label="Partenaires" value={c.partenaires} multiline />}
              <Field label="Description" value={c.description} multiline />
            </div>
          </>
        )}

        {activeTab === 'evaluation' && (
          <EvaluationTab
            candidatureId={c.id}
            reviewers={reviewers}
            evaluations={evaluations}
            nbSoumises={nbSoumises}
          />
        )}
      </div>
    </div>
  )
}

function Field({ label, value, multiline }: { label: string; value?: string | null; multiline?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={multiline ? 'whitespace-pre-wrap text-foreground' : 'text-foreground'}>{value ?? '—'}</p>
    </div>
  )
}
