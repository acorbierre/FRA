'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, ArrowRight, Loader2, CheckCircle2, FileType, Banknote, FileCheck, Wand2 } from 'lucide-react'
import type { Convention } from '@/types'
interface Props {
  candidatureId: string
  convention: Convention | null
  dureeMois?: number | null
}

const STATUT_STYLES: Record<string, string> = {
  'En cours': 'bg-blue-50 text-blue-700',
  'Terminée': 'bg-green-50 text-green-700',
  'Résiliée': 'bg-red-50 text-red-700',
}

interface VersementRow { montant: string; datePrevue: string }

function addMonths(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

const INPUT_CLASS = 'w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

export default function ConventionTab({ candidatureId, convention: initialConvention, dureeMois }: Props) {
  const router = useRouter()
  const [convention, setConvention] = useState<Convention | null>(initialConvention)
  const [loading, setLoading]       = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated]   = useState(false)
  const [converting, setConverting] = useState(false)
  const [done, setDone]             = useState(false)
  const [dateDebut, setDateDebut]   = useState(new Date().toISOString().split('T')[0])

  const [versements, setVersements] = useState<VersementRow[]>([
    { montant: '200000', datePrevue: addMonths(6) },
    { montant: '200000', datePrevue: addMonths(12) },
    { montant: '100000', datePrevue: addMonths(18) },
  ])

  function updateVersement(i: number, field: keyof VersementRow, value: string) {
    setVersements(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v))
  }

  async function handleAccepter() {
    setLoading(true)
    try {
      const res = await fetch(`/api/gestion/candidatures/${candidatureId}/accepter`, { method: 'POST' })
      const data = await res.json()
      setConvention(data.convention)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerer() {
    if (!convention) return
    setGenerating(true)
    try {
      const res = await fetch(`/api/gestion/conventions/${convention.id}/convertir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versements: versements.map(v => ({ montant: parseFloat(v.montant) || 0, datePrevue: v.datePrevue })),
          generateOnly: true,
        }),
      })
      if (res.ok) setGenerated(true)
    } finally {
      setGenerating(false)
    }
  }

  async function handleConvertir() {
    if (!convention) return
    setConverting(true)
    try {
      const res = await fetch(`/api/gestion/conventions/${convention.id}/convertir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signOnly: true, dateDebut }),
      })
      if (res.ok) {
        setDone(true)
        setTimeout(() => router.push('/gestion/suivi'), 1200)
      }
    } finally {
      setConverting(false)
    }
  }

  // Pas encore de convention
  if (!convention) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 text-center">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center">
          <FileText className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-sm">Aucune convention créée</p>
          <p className="text-xs text-muted-foreground mt-1">Saisir la convention pour cette candidature.</p>
        </div>
        <button
          onClick={handleAccepter}
          disabled={loading}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
          Saisir la convention
        </button>
      </div>
    )
  }

  // Convention existante
  return (
    <div className="p-8 space-y-8">
      {/* Carte convention */}
      {convention.projetId ? (
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="size-4" />
          Projet créé — <a href="/gestion/suivi" className="underline underline-offset-2 hover:no-underline">voir le suivi</a>
        </div>
      ) : (
          <div className="flex divide-x divide-border">

              {/* Col 1 : échéancier */}
              <div className="flex-1 pr-8 space-y-4">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-5">
                  <Banknote className="size-5 text-muted-foreground" />
                </div>
                <p className="font-heading font-semibold text-base mb-5">Échéancier de versements</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Date de démarrage</label>
                    <input
                      type="date"
                      value={dateDebut}
                      onChange={e => setDateDebut(e.target.value)}
                      disabled={generated}
                      className={INPUT_CLASS + (generated ? ' opacity-50 cursor-not-allowed' : '')}
                    />
                  </div>
                  {dureeMois && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Durée (candidature)</label>
                      <div className={INPUT_CLASS + ' flex items-center opacity-60 cursor-not-allowed bg-muted'}>
                        {dureeMois} mois
                      </div>
                    </div>
                  )}
                </div>

                {versements.map((v, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      {i === 0 && <label className="text-xs text-muted-foreground mb-1 block">Montant (€)</label>}
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="ex : 15 000"
                          value={v.montant}
                          onChange={e => updateVersement(i, 'montant', e.target.value)}
                          disabled={generated}
                          className={INPUT_CLASS + ' pr-10' + (generated ? ' opacity-50 cursor-not-allowed' : '')}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md pointer-events-none">
                          T{i + 1}
                        </span>
                      </div>
                    </div>
                    <div>
                      {i === 0 && <label className="text-xs text-muted-foreground mb-1 block">Date prévue</label>}
                      <input
                        type="date"
                        value={v.datePrevue}
                        onChange={e => updateVersement(i, 'datePrevue', e.target.value)}
                        disabled={generated}
                        className={INPUT_CLASS + (generated ? ' opacity-50 cursor-not-allowed' : '')}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  {generated ? (
                    <div className="inline-flex items-center gap-2 h-11 px-4 rounded-lg bg-green-100 text-green-700 text-sm font-medium">
                      <CheckCircle2 className="size-4" />
                      Convention Docusign créée
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerer}
                      disabled={generating}
                      className="inline-flex items-center gap-2 h-11 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {generating ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                      {generating ? 'Génération…' : 'Générer la convention'}
                    </button>
                  )}
                </div>
              </div>

              {/* Col 2 : faux doc Docusign */}
                <div className={`flex-1 pl-8 transition-opacity duration-300 ${generated ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-5">
                    <FileCheck className="size-5 text-muted-foreground" />
                  </div>
                  <p className="font-heading font-semibold text-base mb-5">Convention Docusign</p>
                  <div className="relative">
                    {/* Faux document PDF */}
                    <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden select-none">
                      <div className="bg-muted border-b border-border px-3 py-2 flex items-center gap-2">
                        <FileType className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="text-[10px] font-semibold text-muted-foreground tracking-wide">convention.pdf</span>
                      </div>
                      <div className="px-3 py-3 space-y-1.5">
                        <div className="h-1.5 rounded bg-muted w-4/5" />
                        <div className="h-1.5 rounded bg-muted w-full" />
                        <div className="h-1.5 rounded bg-muted w-3/4" />
                        <div className="h-px bg-border my-2" />
                        <div className="h-1.5 rounded bg-muted w-full" />
                        <div className="h-1.5 rounded bg-muted w-4/5" />
                        <div className="h-1.5 rounded bg-muted w-2/3" />
                        <div className="h-px bg-border my-2" />
                        <div className="h-1.5 rounded bg-muted w-full" />
                        <div className="h-1.5 rounded bg-muted w-3/4" />
                        <div className="h-1.5 rounded bg-muted w-3/5" />
                        <div className="h-px bg-border my-2" />
                        <div className="h-1.5 rounded bg-muted w-full" />
                        <div className="h-1.5 rounded bg-muted w-2/3" />
                      </div>
                    </div>

                    {/* Overlay : infos + bouton centrés */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/60 backdrop-blur-[2px] rounded-lg">
                      <div className="text-center">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUT_STYLES[convention.statut ?? 'En cours']}`}>
                          {convention.statut}
                        </span>
                        <p className="font-heading font-semibold text-base mt-2">{convention.numeroConvention}</p>
                      </div>
                      <button
                        onClick={handleConvertir}
                        disabled={converting || done}
                        className="inline-flex items-center gap-2 h-11 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                      >
                        {done
                          ? <><CheckCircle2 className="size-4" /> Projet créé !</>
                          : converting
                          ? <><Loader2 className="size-4 animate-spin" /> Création…</>
                          : <>Convention signée <ArrowRight className="size-4" /></>
                        }
                      </button>
                    </div>
                  </div>
                </div>

            </div>
      )}
    </div>
  )
}
