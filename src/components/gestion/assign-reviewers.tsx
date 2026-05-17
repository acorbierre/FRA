'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserCheck } from 'lucide-react'
import type { Chercheur } from '@/types'
import type { Evaluation } from '@/services/neon/evaluations'

interface Props {
  candidatureId: string
  reviewers: Chercheur[]
  evaluations: Evaluation[]
}

export default function AssignReviewers({ candidatureId, reviewers, evaluations }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState<string[]>(evaluations.map(e => e.reviewerId))
  const [saved, setSaved] = useState(false)

  function toggle(id: string) {
    setSaved(false)
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 2 ? [...prev, id] : prev
    )
  }

  async function handleSubmit() {
    await fetch(`/api/gestion/candidature/${candidatureId}/reviewers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewerIds: selected }),
    })
    setSaved(true)
    startTransition(() => router.refresh())
  }

  const changed = JSON.stringify(selected.sort((a, b) => a.localeCompare(b))) !== JSON.stringify(evaluations.map(e => e.reviewerId).sort((a, b) => a.localeCompare(b)))
  const hasSubmitted = evaluations.some(e => e.statut === 'Soumise')

  return (
    <div className="space-y-3 py-2">
      {reviewers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun examinateur disponible.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {reviewers.map(r => {
            const isSelected = selected.includes(r.id)
            const eval_ = evaluations.find(e => e.reviewerId === r.id)
            return (
              <button
                key={r.id}
                onClick={() => !hasSubmitted && toggle(r.id)}
                disabled={hasSubmitted || (!isSelected && selected.length >= 2)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${hasSubmitted ? 'cursor-default opacity-100' : 'cursor-pointer'} disabled:opacity-40 disabled:cursor-not-allowed ${
                  isSelected && eval_?.statut === 'Soumise'
                    ? 'bg-green-50 border-green-300 text-green-800 font-medium'
                    : isSelected
                    ? 'bg-primary/10 border-primary text-primary font-medium'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {isSelected && <UserCheck className="size-3.5" />}
                {r.nomComplet}
                {eval_?.statut === 'Soumise' && (
                  <span className="text-[10px] font-medium bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full">Note reçue</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex items-center gap-3">
          {hasSubmitted ? (
            <p className="text-xs text-muted-foreground">Assignation verrouillée — une note a déjà été reçue.</p>
          ) : (
            <>
              <button
                onClick={handleSubmit}
                disabled={pending || !changed}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {pending ? 'Enregistrement…' : 'Confirmer l\'assignation'}
              </button>
              {saved && !changed && (
                <span className="text-sm text-green-600 font-medium">✓ Assignation enregistrée</span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
