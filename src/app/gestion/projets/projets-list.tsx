'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Microscope } from 'lucide-react'
import { Input } from '@/components/ui/input'
import ProjetTimeline from '@/components/gestion/projet-timeline'
import type { Projet } from '@/types'

interface Props {
  projets: Projet[]
  projetColors: Record<string, string>
  projetLabels: Record<string, string>
}

export default function ProjetsListe({ projets, projetColors, projetLabels }: Props) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? projets.filter(p => p.titre.toLowerCase().includes(query.toLowerCase()))
    : projets

  return (
    <div className="space-y-6">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Rechercher un projet…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun résultat pour « {query} ».</p>
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
            </div>

            {/* Contenu */}
            <div className="flex flex-col flex-1 p-4 space-y-3">
              <div>
                <p className="font-heading text-base font-medium leading-snug line-clamp-2">
                  {p.titre}
                </p>
                <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                  {(p.montantAccorde ?? 0).toLocaleString('fr-FR')} €
                </p>
              </div>

              <div className="mt-auto">
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
