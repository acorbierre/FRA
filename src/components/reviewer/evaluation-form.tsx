'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Send, Loader2 } from 'lucide-react'
import type { Evaluation } from '@/services/neon/evaluations'

const CRITERES = [
  { key: 'noteExperience', label: 'Expérience du chercheur et qualité des publications' },
  { key: 'noteQuestion',   label: 'Question de recherche' },
  { key: 'noteMethodes',   label: 'Méthodes employées' },
] as const

interface Props {
  evaluation: Evaluation
}

export default function EvaluationForm({ evaluation }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [notes, setNotes] = useState<Record<string, number | null>>({
    noteExperience: evaluation.noteExperience ?? null,
    noteQuestion:   evaluation.noteQuestion   ?? null,
    noteMethodes:   evaluation.noteMethodes   ?? null,
  })
  const [commentaire, setCommentaire] = useState(evaluation.commentaire ?? '')
  const [submitted, setSubmitted] = useState(evaluation.statut === 'Soumise')

  const vals = [notes.noteExperience, notes.noteQuestion, notes.noteMethodes]
  const allFilled = vals.every(v => v !== null)
  const moyenne = allFilled
    ? Math.round((vals.reduce<number>((a, b) => a + (b ?? 0), 0) / 3) * 10) / 10
    : null

  async function handleSubmit() {
    if (!allFilled) return
    await fetch(`/api/reviewer/evaluation/${evaluation.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        noteExperience: notes.noteExperience,
        noteQuestion:   notes.noteQuestion,
        noteMethodes:   notes.noteMethodes,
        commentaire:    commentaire || undefined,
      }),
    })
    setSubmitted(true)
    startTransition(() => router.refresh())
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          {CRITERES.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium tabular-nums">{notes[key] ?? '—'}<span className="text-muted-foreground">/20</span></span>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-green-100 border border-green-200 px-4 py-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          Votre évaluation a bien été transmise.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Critères */}
      <div className="space-y-7">
        {CRITERES.map(({ key, label }, idx) => {
          const isLast = idx === CRITERES.length - 1
          return (
            <div key={key}>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
              <div className="flex rounded-lg border border-border overflow-hidden mt-2">
                {Array.from({ length: 11 }, (_, i) => i + 10).map((n, idx) => {
                  const selected = notes[key] === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNotes(prev => ({ ...prev, [key]: n }))}
                      className={`flex-1 h-9 text-sm transition-colors cursor-pointer ${
                        idx > 0 ? 'border-l border-border' : ''
                      } ${
                        selected
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'bg-white text-foreground hover:bg-muted/50'
                      }`}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
              {isLast && (
                <p className="font-heading text-base font-semibold mt-6">
                  Moyenne : {moyenne !== null ? moyenne : '—'}<span className="font-normal text-muted-foreground text-sm">/20</span>
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Commentaire */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Commentaire <span className="normal-case font-normal">(optionnel)</span>
        </label>
        <textarea
          value={commentaire}
          onChange={e => setCommentaire(e.target.value)}
          rows={4}
          placeholder="Observations, points forts, réserves…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allFilled || pending}
        className="inline-flex items-center gap-2 h-11 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {pending ? 'Transmission…' : 'Transmettre mon évaluation'}
      </button>
    </div>
  )
}
