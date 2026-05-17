'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Jalon, JalonType } from '@/services/neon/jalons'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export const TYPE_CONFIG: Record<JalonType, { label: string; color: string; dot: string }> = {
  versement: { label: 'Versement',  color: 'bg-primary/15 text-primary border-primary/20',         dot: 'bg-primary' },
  rapport:   { label: 'Rapport',    color: 'bg-amber-50 text-amber-700 border-amber-200',            dot: 'bg-amber-500' },
  comite:    { label: 'Comité',     color: 'bg-blue-50 text-blue-700 border-blue-200',               dot: 'bg-blue-500' },
  autre:     { label: 'Autre',      color: 'bg-muted text-muted-foreground border-border',           dot: 'bg-muted-foreground' },
}

const STATUT_CONFIG = {
  prevu:     '',
  realise:   'opacity-50 line-through',
  en_retard: 'ring-1 ring-red-400',
}

interface Props { jalons: Jalon[] }

export default function AgendaCalendar({ jalons }: Props) {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<Jalon | null>(null)

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Grille du mois
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  // Lundi = 0
  const startOffset = (firstDay.getDay() + 6) % 7
  const totalCells  = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
    ...Array(totalCells - startOffset - lastDay.getDate()).fill(null),
  ]

  function jalonsForDay(day: number): Jalon[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return jalons.filter(j => j.datePrevue.slice(0, 10) === dateStr)
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold">{MOIS[month]} {year}</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()) }}
            className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted transition-colors cursor-pointer">
            Aujourd'hui
          </button>
          <button onClick={prev} className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"><ChevronLeft className="size-4" /></button>
          <button onClick={next} className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"><ChevronRight className="size-4" /></button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {(Object.entries(TYPE_CONFIG) as [JalonType, typeof TYPE_CONFIG[JalonType]][]).map(([type, cfg]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', cfg.dot)} />
            {cfg.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 ml-2">
          <span className="size-2 rounded-full bg-red-400 ring-1 ring-red-400" />
          En retard
        </span>
      </div>

      {/* Grille */}
      <div className="rounded-xl overflow-hidden border border-border">
        {/* En-têtes jours */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {JOURS.map(j => (
            <div key={j} className="py-2 text-center text-xs font-medium text-muted-foreground">{j}</div>
          ))}
        </div>

        {/* Cellules */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border bg-background">
          {cells.map((day, i) => {
            const events = day ? jalonsForDay(day) : []
            return (
              <div key={day?.toISOString() ?? `cell-${i}`} className={cn('min-h-[90px] p-1.5', !day && 'bg-muted/20')}>
                {day && (
                  <>
                    <span className={cn(
                      'inline-flex size-6 items-center justify-center rounded-full text-xs mb-1',
                      isToday(day) ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground'
                    )}>
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {events.slice(0, 3).map(j => (
                        <button
                          key={j.id}
                          onClick={() => setSelected(j)}
                          className={cn(
                            'w-full text-left text-[11px] px-1.5 py-0.5 rounded border truncate cursor-pointer transition-opacity hover:opacity-80',
                            TYPE_CONFIG[j.type].color,
                            STATUT_CONFIG[j.statut]
                          )}
                        >
                          {j.label}
                        </button>
                      ))}
                      {events.length > 3 && (
                        <p className="text-[10px] text-muted-foreground pl-1">+{events.length - 3}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Popover détail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative bg-card rounded-xl shadow-xl p-5 w-80 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className={cn('inline-block text-xs px-2 py-0.5 rounded-full border', TYPE_CONFIG[selected.type].color)}>
                  {TYPE_CONFIG[selected.type].label}
                </span>
                <p className="font-medium text-sm">{selected.label}</p>
                {selected.projetTitre && <p className="text-xs text-muted-foreground">{selected.projetTitre}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">✕</button>
            </div>
            <div className="text-sm space-y-1.5 border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date prévue</span>
                <span>{new Date(selected.datePrevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              {selected.montant && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant</span>
                  <span className="font-medium">{selected.montant.toLocaleString('fr-FR')} €</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut</span>
                <span className={cn('text-xs font-medium',
                  selected.statut === 'realise' ? 'text-green-600' :
                  selected.statut === 'en_retard' ? 'text-red-600' : 'text-muted-foreground'
                )}>
                  {selected.statut === 'realise' ? 'Réalisé' : selected.statut === 'en_retard' ? 'En retard' : 'Prévu'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
