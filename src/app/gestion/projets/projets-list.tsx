'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Microscope, Globe } from 'lucide-react'
import { Input } from '@/components/ui/input'
import ProjetTimeline from '@/components/gestion/projet-timeline'
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
  const [statut, setStatut]             = useState('')
  const [internat, setInternat]         = useState(false)

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
      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Rechercher un projet…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={annee} onChange={e => setAnnee(e.target.value)} className={SELECT_CLASS}>
          <option value="">Toutes les années</option>
          {annees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select value={thematique} onChange={e => setThematique(e.target.value)} className={SELECT_CLASS}>
          <option value="">Toutes les thématiques</option>
          {thematiques.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            list="villes-list"
            value={villeQuery}
            onChange={e => setVilleQuery(e.target.value)}
            placeholder="Ville…"
            className={`${SELECT_CLASS} pl-8 w-36`}
          />
          <datalist id="villes-list">
            {villes.map(v => <option key={v} value={v} />)}
          </datalist>
        </div>

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
          <span className="text-muted-foreground">Dim. internationale</span>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => (
          <Link
            key={p.id}
            href={`/gestion/projets/${p.id}/presentation`}
            className="group flex flex-col rounded-xl bg-background overflow-hidden shadow-[0_0_14px_rgba(0,0,0,0.07)]"
          >
            {/* Photo */}
            <div className="relative h-40 bg-muted shrink-0 overflow-hidden">
              {p.photo?.[0]?.url ? (
                <Image
                  src={p.photo[0].url}
                  alt={p.titre}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Microscope className="size-10 text-muted-foreground/30" />
                </div>
              )}
              <span className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${projetColors[p.statut] ?? 'bg-zinc-100 text-zinc-700'}`}>
                {projetLabels[p.statut] ?? p.statut}
              </span>
              {p.dimensionInternationale && (
                <span className="absolute top-3 left-3 rounded-full bg-black/40 backdrop-blur-sm px-2 py-0.5 text-xs text-white flex items-center gap-1">
                  <Globe className="size-3" /> International
                </span>
              )}
            </div>

            {/* Contenu */}
            <div className="flex flex-col flex-1 p-4 space-y-2">
              <div>
                <p className="font-heading text-base font-medium leading-snug line-clamp-2">
                  {p.titre}
                </p>
                <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                  {(p.montantAccorde ?? 0).toLocaleString('fr-FR')} €
                  {p.ville && <span className="ml-2">· {p.ville}</span>}
                </p>
              </div>

              {p.description && (
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {p.description}
                </p>
              )}

              <div className="mt-auto pt-1">
                <ProjetTimeline
                  dateDebut={p.dateDebut}
                  dateFinPrevue={p.dateFinPrevue}
                  dateFinReelle={p.dateFinReelle}
                  statut={p.statut}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
