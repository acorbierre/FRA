'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Loader2, Users, BarChart2 } from 'lucide-react'
import AssignReviewers from '@/components/gestion/assign-reviewers'
import type { Utilisateur } from '@/types'
import type { Evaluation } from '@/services/neon/evaluations'
import { cn } from '@/lib/utils'

interface Props {
  candidatureId: string
  reviewers: Utilisateur[]
  evaluations: Evaluation[]
  nbSoumises: number
  statut: string
  onAccepted?: () => void
}

export default function EvaluationTab({ candidatureId, reviewers, evaluations, nbSoumises, statut, onAccepted }: Props) {
  const router = useRouter()
  const [eval1, eval2] = evaluations
  const note1 = eval1?.noteFinale ?? null
  const note2 = eval2?.noteFinale ?? null
  const moyenne = note1 !== null && note2 !== null
    ? Math.round(((note1 + note2) / 2) * 10) / 10
    : note1 ?? note2 ?? null
  const [noteFinale, setNoteFinale] = useState<string>(moyenne !== null ? String(moyenne) : '')
  const [loading, setLoading] = useState<'refuser' | 'accepter' | null>(null)
  const pret = nbSoumises === 2
  const decided = statut === 'Retenue' || statut === 'Refusée'

  async function changerStatut(statut: 'Retenue' | 'Refusée') {
    const label = statut === 'Retenue' ? 'accepter' : 'refuser'
    if (!confirm(`Confirmer : ${label} cette candidature ?`)) return
    setLoading(statut === 'Retenue' ? 'accepter' : 'refuser')
    try {
      const res = await fetch(`/api/gestion/candidature/${candidatureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }),
      })
      if (res.ok) {
        router.refresh()
        if (statut === 'Retenue') onAccepted?.()
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="px-10 py-8 grid grid-cols-2 divide-x divide-border items-start">

      {/* Bloc 1 : Évaluations indépendantes */}
      <div className="pr-10 space-y-4">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-5">
          <Users className="size-5 text-muted-foreground" />
        </div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-sm font-semibold">Évaluations indépendantes</h2>
          <span className="text-xs text-muted-foreground tabular-nums">{nbSoumises}/2 reçues</span>
        </div>

        <AssignReviewers candidatureId={candidatureId} reviewers={reviewers} evaluations={evaluations} />
      </div>

      {/* Bloc 2 : Note finale */}
      <div className="pl-10 space-y-4 flex flex-col">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-5">
          <BarChart2 className="size-5 text-muted-foreground" />
        </div>
        <h2 className="font-heading text-sm font-semibold mb-5">Note finale</h2>

        <div className="space-y-2 text-sm flex-1">
          <NoteRow
            label={eval1?.reviewerNom?.split(' ')[0] ?? 'Examinateur 1'}
            note={note1}
            soumise={eval1?.statut === 'Soumise'}
          />
          <NoteRow
            label={eval2?.reviewerNom?.split(' ')[0] ?? 'Examinateur 2'}
            note={note2}
            soumise={eval2?.statut === 'Soumise'}
          />
          <div className={cn('pt-2 border-t border-border flex items-center justify-between gap-3', !pret && 'opacity-40')}>
            <span className="font-medium text-foreground">Moyenne</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0} max={20} step={0.5}
                value={noteFinale}
                onChange={e => setNoteFinale(e.target.value)}
                disabled={!pret}
                className="w-14 rounded-md border border-border bg-background px-2 py-1 text-center text-sm font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed"
              />
              <span className="text-muted-foreground">/20</span>
            </div>
          </div>
        </div>

        {!pret && (
          <p className="text-xs text-muted-foreground text-center">
            En attente des {2 - nbSoumises} évaluation{2 - nbSoumises > 1 ? 's' : ''} manquante{2 - nbSoumises > 1 ? 's' : ''}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => changerStatut('Refusée')}
            disabled={loading !== null || decided}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading === 'refuser' ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
            Refuser
          </button>
          <button
            onClick={() => changerStatut('Retenue')}
            disabled={loading !== null || decided}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading === 'accepter' ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}

function NoteRow({ label, note, soumise }: { label: string; note: number | null; soumise: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {!soumise && <span className="text-xs text-muted-foreground/60">En attente</span>}
        <span className="tabular-nums font-medium text-foreground">
          {note !== null ? `${note}/20` : '—'}
        </span>
      </div>
    </div>
  )
}
