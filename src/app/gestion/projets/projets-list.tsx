'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Microscope, Globe, Check, Presentation, X, Loader2, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { Projet } from '@/types'
import type { Thematique } from '@/services/neon/thematiques'

interface Props {
  projets: Projet[]
  projetColors: Record<string, string>
  projetLabels: Record<string, string>
  thematiques: Thematique[]
}

const SELECT_CLASS = 'h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground'

export default function ProjetsListe({ projets, projetColors, projetLabels, thematiques }: Props) {
  const [query, setQuery]               = useState('')
  const [annee, setAnnee]               = useState('')
  const [thematique, setThematique]     = useState('')
  const [villeQuery, setVilleQuery]     = useState('')
  const [villeOpen, setVilleOpen]       = useState(false)
  const [statut, setStatut]             = useState('')
  const [internat, setInternat]         = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selected, setSelected]           = useState<Set<string>>(new Set())
  const [exporting, setExporting]         = useState(false)

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelected(new Set())
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/gestion/export/ppt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected] }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `projets-fra-${Date.now()}.pptx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const annees = [...new Set(projets.map(p => p.anneeSelection).filter(Boolean))].sort((a, b) => b! - a!) as number[]
  const villes = [...new Set(projets.map(p => p.ville).filter(Boolean))].sort() as string[]
  const statuts = [...new Set(projets.map(p => p.statut))]

  const filtered = projets.filter(p => {
    if (query && !p.titre.toLowerCase().includes(query.toLowerCase())) return false
    if (annee && p.anneeSelection !== Number(annee)) return false
    if (thematique && String(p.thematiqueId) !== thematique) return false
    if (villeQuery && !p.ville?.toLowerCase().includes(villeQuery.toLowerCase())) return false
    if (statut && p.statut !== statut) return false
    if (internat && !p.dimensionInternationale) return false
    return true
  })

  const hasFilters = annee || thematique || villeQuery || statut || internat

  return (
    <div className="space-y-4">
      {/* Recherche + Export */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher un projet…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <button
          onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
          className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
            selectionMode
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <Presentation className="size-4" />
          Créer une présentation PPT
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={villeQuery}
            onChange={e => { setVilleQuery(e.target.value); setVilleOpen(true) }}
            onFocus={() => setVilleOpen(true)}
            onBlur={() => setTimeout(() => setVilleOpen(false), 150)}
            placeholder="Ville…"
            className={`${SELECT_CLASS} pl-8 w-48`}
          />
          {villeOpen && villes.filter(v => v.toLowerCase().includes(villeQuery.toLowerCase())).length > 0 && (
            <div className="absolute z-10 top-full mt-1 w-full bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {villes
                .filter(v => v.toLowerCase().includes(villeQuery.toLowerCase()))
                .map(v => (
                  <button
                    key={v}
                    type="button"
                    onMouseDown={() => { setVilleQuery(v); setVilleOpen(false) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    {v}
                  </button>
                ))}
            </div>
          )}
        </div>

        <select value={thematique} onChange={e => setThematique(e.target.value)} className={SELECT_CLASS}>
          <option value="">Toutes les thématiques</option>
          {thematiques.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>

        <select value={annee} onChange={e => setAnnee(e.target.value)} className={SELECT_CLASS}>
          <option value="">Toutes les années</option>
          {annees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select value={statut} onChange={e => setStatut(e.target.value)} className={SELECT_CLASS}>
          <option value="">Tous les statuts</option>
          {statuts.map(s => (
            <option key={s} value={s}>{projetLabels[s] ?? s}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <div
            onClick={() => setInternat(v => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors ${internat ? 'bg-primary' : 'bg-muted-foreground/30'}`}
          >
            <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform ${internat ? 'translate-x-4' : ''}`} />
          </div>
          <Globe className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">International</span>
        </label>

        {hasFilters && (
          <button
            onClick={() => { setAnnee(''); setThematique(''); setVilleQuery(''); setStatut(''); setInternat(false) }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun résultat.</p>
      ) : (
        <p className="text-xs text-muted-foreground">{filtered.length} projet{filtered.length > 1 ? 's' : ''}</p>
      )}

      {selectionMode && (
        <p className="text-xs text-muted-foreground">Cliquez sur les projets à inclure dans l'export.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => {
          const isSelected = selected.has(p.id)
          const cardInner = (
            <>
              {/* Photo */}
              <div className="relative h-40 bg-muted shrink-0 overflow-hidden rounded-t-xl">
                {p.photo?.[0]?.url ? (
                  <Image src={p.photo[0].url} alt={p.titre} fill className={`object-cover transition-all duration-200 ${selectionMode && !isSelected ? 'opacity-50' : 'group-hover:scale-105'}`} />
                ) : (
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${selectionMode && !isSelected ? 'opacity-40' : ''}`}>
                    <Microscope className="size-10 text-muted-foreground/30" />
                  </div>
                )}
                {selectionMode && (
                  <div className={`absolute top-2.5 left-2.5 size-7 rounded-md border-2 flex items-center justify-center transition-all shadow-md ${
                    isSelected ? 'bg-primary border-primary text-white scale-110' : 'bg-white border-primary/70'
                  }`}>
                    {isSelected && <Check className="size-4" strokeWidth={3} />}
                  </div>
                )}
                <span className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${projetColors[p.statut] ?? 'bg-zinc-100 text-zinc-700'}`}>
                  {projetLabels[p.statut] ?? p.statut}
                </span>
                {p.dimensionInternationale && (
                  <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/40 backdrop-blur-sm px-2 py-0.5 text-xs text-white flex items-center gap-1">
                    <Globe className="size-3" /> International
                  </span>
                )}
              </div>

              {/* Contenu */}
              <div className={`flex flex-col flex-1 p-4 space-y-1 transition-opacity duration-200 ${selectionMode && !isSelected ? 'opacity-50' : ''}`}>
                {p.thematique && (
                  <p className="text-[0.7rem] font-medium uppercase tracking-wide text-primary/70">{p.thematique}</p>
                )}
                <p className="font-heading text-base font-medium leading-snug line-clamp-2">{p.titre}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {(p.montantAccorde ?? 0).toLocaleString('fr-FR')} €
                  {p.ville && <span className="ml-2">· {p.ville}</span>}
                  {p.anneeSelection && <span className="ml-2">· {p.anneeSelection}</span>}
                </p>
              </div>
            </>
          )

          return (
            <div key={p.id} className={`relative rounded-xl transition-all ${isSelected ? 'ring-2 ring-primary/40 shadow-[0_0_14px_rgba(0,0,0,0.07)]' : 'shadow-[0_0_14px_rgba(0,0,0,0.07)]'}`}>
              {selectionMode ? (
                <button
                  onClick={() => toggleSelect(p.id)}
                  className="group flex flex-col w-full rounded-xl bg-background overflow-hidden text-left cursor-pointer"
                >
                  {cardInner}
                </button>
              ) : (
                <Link href={`/gestion/projets/${p.id}/presentation`} className="group flex flex-col rounded-xl bg-background overflow-hidden">
                  {cardInner}
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Barre sticky mode sélection */}
      {selectionMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-background shadow-[0_8px_32px_rgba(0,0,0,0.16)]">
          <span className="text-sm font-medium text-foreground">
            {selected.size > 0
              ? `${selected.size} projet${selected.size > 1 ? 's' : ''} sélectionné${selected.size > 1 ? 's' : ''}`
              : 'Sélectionnez un ou plusieurs projets'}
          </span>
          <button
            onClick={exitSelectionMode}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Annuler"
          >
            <X className="size-4" />
          </button>
          <div className="w-px h-4 bg-border" />
          <button
            onClick={handleExport}
            disabled={exporting || selected.size === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Presentation className="size-4" />}
            {exporting ? 'Génération…' : 'Exporter en PPT'}
          </button>
        </div>
      )}
    </div>
  )
}
