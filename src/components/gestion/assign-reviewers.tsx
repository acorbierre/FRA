'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { User, CheckCircle2, Send, Loader2 } from 'lucide-react'
import type { Utilisateur } from '@/types'
import type { Evaluation } from '@/services/neon/evaluations'

interface Props {
  candidatureId: string
  reviewers: Utilisateur[]
  evaluations: Evaluation[]
}

function ReviewerCombobox({
  slotLabel,
  selected,
  onSelect,
  reviewers,
  excludeId,
  evaluation,
  locked,
}: {
  slotLabel: string
  selected: Utilisateur | null
  onSelect: (r: Utilisateur | null) => void
  reviewers: Utilisateur[]
  excludeId?: string
  evaluation?: Evaluation
  locked: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = reviewers
    .filter(r => r.id !== excludeId)
    .filter(r => r.nomComplet.toLowerCase().includes(query.toLowerCase()))

  const soumise = evaluation?.statut === 'Soumise'

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{slotLabel}</p>
      <div className="relative">
        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          value={selected ? selected.nomComplet : query}
          onChange={e => { if (!locked) { setQuery(e.target.value); onSelect(null); setOpen(true) } }}
          onFocus={() => !locked && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          readOnly={locked}
          placeholder="Rechercher un examinateur…"
          className={`w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring ${locked ? 'cursor-default' : ''}`}
        />
        {selected && !soumise && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            En attente
          </span>
        )}
        {open && filtered.length > 0 && !locked && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filtered.map(r => (
              <button
                key={r.id}
                type="button"
                onMouseDown={() => { onSelect(r); setQuery(''); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors cursor-pointer"
              >
                {r.nomComplet}
              </button>
            ))}
          </div>
        )}
      </div>
      {selected && soumise && (
        <p className="text-xs text-green-600">✓ Note reçue — {evaluation?.noteFinale}/20</p>
      )}
    </div>
  )
}

export default function AssignReviewers({ candidatureId, reviewers, evaluations }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const findReviewer = (idx: number) => {
    const ev = evaluations[idx]
    return ev ? (reviewers.find(r => r.id === ev.reviewerId) ?? null) : null
  }

  const [reviewer1, setReviewer1] = useState<Utilisateur | null>(findReviewer(0))
  const [reviewer2, setReviewer2] = useState<Utilisateur | null>(findReviewer(1))

  const hasSubmitted = evaluations.some(e => e.statut === 'Soumise')
  const selectedIds = [reviewer1?.id, reviewer2?.id].filter(Boolean) as string[]
  const currentIds = evaluations.map(e => e.reviewerId).sort()
  const changed = JSON.stringify([...selectedIds].sort()) !== JSON.stringify(currentIds)

  async function handleSubmit() {
    setSaved(false)
    await fetch(`/api/gestion/candidature/${candidatureId}/reviewers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewerIds: selectedIds }),
    })
    setSaved(true)
    startTransition(() => router.refresh())
  }

  if (reviewers.length === 0)
    return <p className="text-sm text-muted-foreground">Aucun examinateur disponible.</p>

  return (
    <div className="space-y-5">
      <ReviewerCombobox
        slotLabel="Examinateur 1"
        selected={reviewer1}
        onSelect={r => { setReviewer1(r); setSaved(false) }}
        reviewers={reviewers}
        excludeId={reviewer2?.id}
        evaluation={evaluations.find(e => e.reviewerId === reviewer1?.id)}
        locked={hasSubmitted && evaluations.some(e => e.reviewerId === reviewer1?.id)}
      />
      <ReviewerCombobox
        slotLabel="Examinateur 2"
        selected={reviewer2}
        onSelect={r => { setReviewer2(r); setSaved(false) }}
        reviewers={reviewers}
        excludeId={reviewer1?.id}
        evaluation={evaluations.find(e => e.reviewerId === reviewer2?.id)}
        locked={hasSubmitted && evaluations.some(e => e.reviewerId === reviewer2?.id)}
      />

      <div className="flex items-center gap-3 pt-1">
        {hasSubmitted ? (
          <p className="text-xs text-muted-foreground">Assignation verrouillée — une note a déjà été reçue.</p>
        ) : (
          <>
            <button
              onClick={handleSubmit}
              disabled={pending || !changed || selectedIds.length === 0}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {pending ? 'Transmission…' : 'Transmettre aux examinateurs'}
            </button>
            {saved && !changed && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Transmis
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
