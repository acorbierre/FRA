'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Building2, MapPin, ChevronRight, Map } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { Laboratoire } from '@/types'

export default function LaboratoiresListe({ labos }: { labos: Laboratoire[] }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? labos.filter(l =>
        `${l.carteNom ?? ''} ${l.nom} ${l.institution} ${l.ville ?? ''}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : labos

  const groups: Record<string, Laboratoire[]> = {}
  for (const l of filtered) {
    const letter = ((l.carteNom ?? l.nom)?.[0] ?? '?').toUpperCase()
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(l)
  }
  const letters = Object.keys(groups).sort((a, b) => a.localeCompare(b))

  return (
    <div className="space-y-6">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Rechercher un laboratoire…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun résultat pour « {query} ».</p>
      )}

      <div className="rounded-xl bg-background overflow-hidden border border-border/60">
        {letters.map((letter, li) => (
          <div key={letter}>
            <div className={`px-6 py-2 bg-muted/40 border-b border-border ${li > 0 ? 'border-t' : ''}`}>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                {letter}
              </span>
            </div>

            {groups[letter].map((l, i) => (
              <Link
                key={l.id}
                href={`/gestion/laboratoires/${l.id}`}
                className={`flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors group ${
                  i < groups[letter].length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="size-4 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors">{l.carteNom ?? l.nom}</p>
                  <p className="text-xs text-muted-foreground truncate">{l.institution}</p>
                </div>

                {l.ville && (
                  <p className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <MapPin className="size-3" />{l.ville}
                  </p>
                )}

                {l.carteLabId && (
                  <a
                    href={`/carto?lab=${l.carteLabId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="relative z-10 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors shrink-0 px-2 py-1 rounded-md hover:bg-muted"
                  >
                    <Map className="size-3" />
                    Carto
                  </a>
                )}
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
