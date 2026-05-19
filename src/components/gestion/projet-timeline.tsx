'use client'

import { useState, useEffect } from 'react'
import type { Projet } from '@/types'

export interface RapportMarker {
  date: string
  statut: 'Attendu' | 'Soumis' | 'Reçu' | 'Validé'
  reference: string
  type: string
}

export interface VersementMarker {
  datePrevue?: string
  dateRealisee?: string
  statut: 'Prévu' | 'En attente rapport' | 'Réalisé'
  numero: number
  montant: number
}

interface Props {
  dateDebut?: string
  dateFinPrevue?: string
  dateFinReelle?: string
  statut: Projet['statut']
  rapports?: RapportMarker[]
  versements?: VersementMarker[]
}

const RAPPORT_COLORS: Record<string, string> = {
  'Attendu': 'bg-amber-400',
  'Soumis':  'bg-blue-400',
  'Reçu':    'bg-green-400',
  'Validé':  'bg-green-500',
}

const RAPPORT_TEXT: Record<string, string> = {
  'Attendu': 'text-amber-700',
  'Soumis':  'text-blue-700',
  'Reçu':    'text-green-700',
  'Validé':  'text-green-800',
}

function pct(dateStr: string, start: number, total: number): number {
  return Math.min(98, Math.max(2, ((new Date(dateStr).getTime() - start) / total) * 100))
}

function fmtShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function fmtLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ProjetTimeline({
  dateDebut, dateFinPrevue, dateFinReelle, statut,
  rapports = [], versements = [],
}: Props) {
  const [progress, setProgress] = useState(0)
  const [label, setLabel] = useState('')
  const [overdue, setOverdue] = useState(false)
  const [start, setStart] = useState(0)
  const [total, setTotal] = useState(1)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!dateDebut || !dateFinPrevue) return
    const s = new Date(dateDebut).getTime()
    const e = new Date(dateFinPrevue).getTime()
    const t = e - s
    if (t <= 0) return
    const today = Date.now()
    setStart(s)
    setTotal(t)
    const target = Math.min(100, Math.max(0, ((today - s) / t) * 100))
    requestAnimationFrame(() => requestAnimationFrame(() => setProgress(target)))
    if (statut === 'Terminé') {
      const finDate = dateFinReelle ?? dateFinPrevue
      setLabel(`Terminé le ${fmtLong(finDate)}`)
    } else {
      const diff = Math.round((e - today) / (1000 * 60 * 60 * 24))
      if (diff < 0) { setLabel(`Dépassé de ${Math.abs(diff)} j`); setOverdue(true) }
      else if (diff === 0) setLabel("Échéance aujourd'hui")
      else setLabel(`${diff} j restants`)
    }
    setReady(true)
  }, [dateDebut, dateFinPrevue, dateFinReelle, statut])

  if (!dateDebut || !dateFinPrevue) return null

  const hasMarkers = (rapports.length > 0 || versements.length > 0) && ready

  return (
    <div className="rounded-lg bg-muted/20 pt-2.5 pb-2 mt-2 space-y-1">

      {/* Marqueurs rapports */}
      {rapports.length > 0 && ready && (
        <div className="relative h-5">
          {rapports.map((r) => {
            if (!r.date) return null
            const left = pct(r.date, start, total)
            const isLate = r.statut === 'Attendu' && new Date(r.date) < new Date()
            return (
              <div
                key={r.reference}
                className="absolute -translate-x-1/2 group/rmark"
                style={{ left: `${left}%` }}
              >
                {/* Dot */}
                <div className={`size-2.5 rounded-full border-2 border-background shadow-sm ${isLate ? 'bg-red-500' : RAPPORT_COLORS[r.statut]}`} />
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/rmark:block z-50">
                  <div className="rounded-md bg-foreground px-2 py-1 text-xs text-background whitespace-nowrap shadow-md">
                    <span className={`font-medium ${isLate ? 'text-red-300' : ''}`}>{r.reference}</span>
                    <br />
                    <span className="opacity-70">{r.type} · {fmtShort(r.date)}</span>
                    <br />
                    <span className={isLate ? 'text-red-300' : 'opacity-70'}>{isLate ? '⚠ En retard' : r.statut}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Barre de progression */}
      <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/50 transition-all"
          style={{ width: `${progress}%` }}
        />
        {/* Marqueurs versements sur la barre */}
        {versements.map((v, i) => {
          const dateStr = v.dateRealisee ?? v.datePrevue
          if (!dateStr || !ready) return null
          const left = pct(dateStr, start, total)
          return (
            <div
              key={`bar-${v.datePrevue ?? i}`}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${left}%` }}
            />
          )
        })}
      </div>

      {/* Marqueurs versements */}
      {versements.length > 0 && ready && (
        <div className="relative h-5">
          {versements.map((v, i) => {
            const dateStr = v.datePrevue
            if (!dateStr) return null
            const left = pct(dateStr, start, total)
            const done = v.statut === 'Réalisé'
            return (
              <div
                key={v.datePrevue ?? i}
                className="absolute -translate-x-1/2 group/vmark"
                style={{ left: `${left}%` }}
              >
                <div className={`flex items-center justify-center size-4 rounded-full border text-[9px] font-bold shadow-sm ${
                  done
                    ? 'bg-green-100 border-green-400 text-green-700'
                    : 'bg-background border-muted-foreground/30 text-muted-foreground'
                }`}>
                  {done ? '✓' : `V${v.numero}`}
                </div>
                {/* Tooltip */}
                <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 hidden group-hover/vmark:block z-50">
                  <div className="rounded-md bg-foreground px-2 py-1 text-xs text-background whitespace-nowrap shadow-md">
                    <span className="font-medium">Versement {v.numero}</span>
                    <br />
                    <span className="opacity-70">{v.montant.toLocaleString('fr-FR')} € · {fmtShort(dateStr)}</span>
                    <br />
                    <span className={done ? 'text-green-300' : 'opacity-70'}>{v.statut}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Labels dates */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{fmtShort(dateDebut)}</span>
        <span className={overdue && statut !== 'Terminé' ? 'text-destructive font-medium' : ''}>{label}</span>
        <span>{fmtShort(dateFinPrevue)}</span>
      </div>
    </div>
  )
}
