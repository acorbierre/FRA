'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Check, Loader2 } from 'lucide-react'
import AgendaCalendar from '@/components/gestion/agenda-calendar'
import DateBadge from '@/components/ui/date-badge'
import SyncCalendarButton from '@/components/gestion/sync-calendar-button'
import type { Jalon } from '@/services/neon/jalons'
import { JALON_TYPE_LABELS, JALON_STATUT_LABELS } from '@/lib/config'

const TABS = ['Jalons', 'Agenda'] as const
type Tab = typeof TABS[number]

const STATUT_STYLES: Record<string, string> = {
  prevu:     'bg-blue-50 text-blue-700',
  realise:   'bg-green-50 text-green-700',
  en_retard: 'bg-red-50 text-red-700',
}

function formatDateLong(str: string) {
  return new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatMonthHeader(key: string) {
  const [year, month] = key.split('-')
  const d = new Date(parseInt(year), parseInt(month) - 1, 1)
  const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function getMailtoUrl(j: Jalon) {
  const subject = encodeURIComponent(`Rappel – ${j.label}${j.projetTitre ? ` · ${j.projetTitre}` : ''}`)
  const body = encodeURIComponent(
    `Bonjour,\n\nNous vous contactons au sujet du jalon « ${j.label} »${j.projetTitre ? ` pour le projet ${j.projetTitre}` : ''}, prévu le ${formatDateLong(j.datePrevue)}.\n\nMerci de nous confirmer l'avancement de ce point.\n\nCordialement,\nL'équipe FRA`
  )
  return `mailto:?subject=${subject}&body=${body}`
}

function getTeamsUrl(j: Jalon) {
  const lines = [
    `📌 ${j.label}${j.projetTitre ? ` — ${j.projetTitre}` : ''}`,
    `Échéance : ${formatDateLong(j.datePrevue)}`,
    `Type : ${JALON_TYPE_LABELS[j.type]}`,
    `Statut : ${JALON_STATUT_LABELS[j.statut]}`,
    ...(j.montant != null ? [`Montant : ${j.montant.toLocaleString('fr-FR')} €`] : []),
  ]
  return `https://teams.microsoft.com/l/chat/0/0?message=${encodeURIComponent(lines.join('\n'))}`
}

// ---------------------------------------------------------------------------

function TeamsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Personne secondaire (arrière) */}
      <circle cx="17" cy="7" r="2.2" fill="var(--color-primary)" opacity="0.4" />
      <path d="M13.5 13c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2v3h-7v-3z" fill="var(--color-primary)" opacity="0.4" />
      {/* Carte principale avec T */}
      <rect x="3" y="10" width="13" height="10" rx="2" fill="var(--color-primary)" />
      {/* Personne principale (tête) */}
      <circle cx="9.5" cy="6.5" r="2.8" fill="var(--color-primary)" />
      {/* Lettre T */}
      <rect x="6" y="13" width="7" height="1.5" rx="0.75" fill="white" />
      <rect x="8.75" y="13" width="1.5" height="5" rx="0.75" fill="white" />
    </svg>
  )
}


export default function AgendaTabs({ jalons }: { jalons: Jalon[] }) {
  const [tab, setTab] = useState<Tab>('Jalons')
  const router = useRouter()
  const [versant, setVersant] = useState<string | null>(null)

  async function handleVerse(id: string) {
    setVersant(id)
    try {
      await fetch(`/api/gestion/versements/${id}/realiser`, { method: 'POST' })
      router.refresh()
    } finally {
      setVersant(null)
    }
  }

  const sorted = [...jalons].sort((a, b) => a.datePrevue.localeCompare(b.datePrevue))

  // Group by month (YYYY-MM)
  const grouped: Record<string, Jalon[]> = {}
  for (const j of sorted) {
    const key = j.datePrevue.slice(0, 7)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(j)
  }
  const months = Object.keys(grouped).sort()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                tab === t ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <SyncCalendarButton />
      </div>

      {tab === 'Jalons' && (
        <div className="space-y-6">
          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun jalon enregistré.</p>
          )}
          {months.map(monthKey => (
            <div key={monthKey} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                {formatMonthHeader(monthKey)}
              </h3>
              {grouped[monthKey].map(j => (
                <div key={j.id} className="grid items-center gap-4 p-4 bg-background rounded-xl shadow-[0_0_14px_rgba(0,0,0,0.07)]" style={{ gridTemplateColumns: 'auto 5rem 1fr 22rem' }}>
                  <DateBadge dateStr={j.datePrevue} />
                  <div>
                    {j.statut === 'en_retard' && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">En retard</span>}
                    {j.type === 'versement' && j.statut === 'prevu' && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Prévu</span>}
                    {j.type === 'versement' && j.statut === 'realise' && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">Versé</span>}
                  </div>
                  <div className="min-w-0 flex items-center gap-10">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{j.label}</p>
                      {j.projetTitre && <p className="text-xs text-muted-foreground truncate">{j.projetTitre}</p>}
                    </div>
                    {j.montant != null && (
                      <span className="text-sm tabular-nums shrink-0">{j.montant.toLocaleString('fr-FR')} €</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    {j.type === 'versement' && j.statut !== 'realise' && (
                      <button
                        onClick={() => handleVerse(j.id)}
                        disabled={versant === j.id}
                        title="Marquer comme versé"
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {versant === j.id
                          ? <Loader2 className="size-4 animate-spin" />
                          : <Check className="size-4" />
                        }
                        Versé
                      </button>
                    )}
                    {j.type === 'versement' && (
                      <a
                        href={getMailtoUrl(j)}
                        title="Réclamer rapport par e-mail"
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
                      >
                        <Mail className="size-4" />
                        Réclamer rapport
                      </a>
                    )}
                    {j.type !== 'versement' && (
                      <a
                        href={getMailtoUrl(j)}
                        title="Relancer par e-mail"
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
                      >
                        <Mail className="size-4" />
                        Relancer
                      </a>
                    )}
                    <a
                      href={getTeamsUrl(j)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Partager dans Teams"
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <TeamsIcon />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'Agenda' && (
        <div className="bg-card rounded-xl shadow-[0_0_14px_rgba(0,0,0,0.07)] p-5">
          <AgendaCalendar jalons={jalons} />
        </div>
      )}
    </div>
  )
}
