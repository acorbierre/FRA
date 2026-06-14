'use client'

import { useState } from 'react'
import CandidatureTimeline from '@/components/gestion/candidature-timeline'
import EvaluationTab from '@/components/gestion/evaluation-tab'
import ConventionTab from '@/components/gestion/convention-tab'
import type { Candidature, Convention, Utilisateur } from '@/types'
import type { Evaluation } from '@/services/neon/evaluations'
import { FIELD_LABELS } from '@/lib/config'
import { cn } from '@/lib/utils'
import { FileText } from 'lucide-react'

interface Props {
  candidature: Candidature
  chercheurNom?: string | null
  reviewers: Utilisateur[]
  evaluations: Evaluation[]
  statutColors: Record<string, string>
  statutLabelsGestion: Record<string, string>
  convention: Convention | null
  defaultTab?: Tab
}

type Tab = 'dossier' | 'evaluation' | 'convention'

export default function CandidatureDetailTabs({ candidature: c, chercheurNom, reviewers, evaluations, statutColors, statutLabelsGestion, convention, defaultTab = 'dossier' }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)
  const statut = c.statut ?? 'Brouillon'
  const nbSoumises = evaluations.filter(e => e.statut === 'Soumise').length

  const tabLabels: Record<Tab, string> = {
    dossier: 'Dossier',
    evaluation: `Évaluation`,
    convention: 'Convention',
  }

  const visibleTabs: Tab[] = ['dossier', 'evaluation', ...(statut === 'Retenue' ? ['convention' as Tab] : [])]

  return (
    <div style={{ filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.09))' }}>
      {/* Tab bar */}
      <div className="flex items-end gap-1">
        {visibleTabs.map((tab) => {
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
              {tab === 'evaluation'
                ? <span className="flex items-center gap-1.5">Évaluation <span className="text-xs text-muted-foreground font-normal">({nbSoumises}/2)</span></span>
                : tab === 'convention' && convention
                ? <span className="flex items-center gap-1.5">Convention <span className="size-1.5 rounded-full bg-primary inline-block" /></span>
                : tabLabels[tab]
              }
            </button>
          )
        })}
      </div>

      {/* Content panel */}
      <div className={cn(
        'bg-card rounded-b-xl divide-y divide-border',
        activeTab === 'dossier' ? 'rounded-tr-xl' : activeTab === 'convention' ? 'rounded-tl-xl rounded-tr-xl' : 'rounded-tl-xl'
      )}>
        {activeTab === 'dossier' && (
          <>
            <div className="px-8 py-6">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-5">
                <FileText className="size-5 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${statutColors[statut] ?? 'bg-zinc-100 text-zinc-700'}`}>
                  {statutLabelsGestion[statut] ?? statut}
                </span>
              </div>
              <p className="text-base font-medium leading-snug">{c.titre}</p>
              {chercheurNom && <p className="text-sm text-muted-foreground mt-0.5">{chercheurNom}</p>}
              <div className="mt-6">
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
            statut={statut}
            onAccepted={() => setActiveTab('convention')}
          />
        )}

        {activeTab === 'convention' && (
          <ConventionTab
            candidatureId={c.id}
            convention={convention}
            dureeMois={c.dureeMois}
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
