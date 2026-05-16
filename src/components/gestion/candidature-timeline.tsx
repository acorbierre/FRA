'use client'

import type { Candidature } from '@/types'

const STAGES: { label: string }[] = [
  { label: 'Réception' },
  { label: 'Envoi au CS' },
  { label: 'Évaluation' },
  { label: 'Délibération CS' },
  { label: 'Notification' },
]

function currentIndex(statut: Candidature['statut']): number {
  if (statut === 'Retenue' || statut === 'Refusée') return 4
  if (statut === 'En délibération CS') return 3
  if (statut === 'En évaluation')      return 2
  if (statut === 'Envoyée au CS')      return 1
  return 0 // Soumise
}

function stageState(statut: Candidature['statut'], i: number): 'done' | 'current' | 'pending' {
  const cur = currentIndex(statut)
  if (i < cur) return 'done'
  if (i === cur) return 'current'
  return 'pending'
}

interface Props {
  statut: Candidature['statut']
  dateSoumission?: string
}

export default function CandidatureTimeline({ statut, dateSoumission }: Props) {
  if (statut === 'Brouillon') return null

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

  const progressPct = (currentIndex(statut) / (STAGES.length - 1)) * 100

  return (
    <div className="relative mt-1">
      {/* Track + progression */}
      <div className="absolute top-[3px] left-0 right-0 h-1 rounded-full bg-muted overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full bg-primary/50" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Dots + labels */}
      <div className="relative flex justify-between">
        {STAGES.map((stage, i) => {
          const state = stageState(statut, i)
          const isFirst = i === 0
          const isLast = i === STAGES.length - 1
          const isVerdict = i === 4

          let dotClass = 'size-2.5 rounded-full border-2 shrink-0 '
          if (isVerdict && statut === 'Retenue')       dotClass += 'bg-green-600 border-green-600'
          else if (isVerdict && statut === 'Refusée')  dotClass += 'bg-orange-400 border-orange-400'
          else if (state === 'done')                   dotClass += 'bg-primary border-primary'
          else if (state === 'current')                dotClass += 'bg-background border-primary'
          else                                         dotClass += 'bg-background border-border'

          return (
            <div
              key={i}
              className={`flex flex-col ${isFirst ? 'items-start' : isLast ? 'items-end' : 'items-center'}`}
            >
              <div className={dotClass} />
              <div className={`mt-1 ${isFirst ? 'text-left' : isLast ? 'text-right' : 'text-center'}`}>
                <p className={`text-xs leading-tight ${
                  state === 'pending' ? 'text-muted-foreground/40' : 'text-muted-foreground'
                }`}>
                  {stage.label}
                </p>
                {i === 0 && dateSoumission && (
                  <p className="text-xs text-muted-foreground/60 tabular-nums">{fmtDate(dateSoumission)}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
