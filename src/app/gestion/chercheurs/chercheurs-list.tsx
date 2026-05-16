'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, User, Copy, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { Chercheur } from '@/types'
import { rolePillClass, roleLabel } from '@/lib/role-colors'

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={handleCopy}
      title="Copier l'email"
      className="shrink-0 size-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {copied ? <Check className="size-3 text-green-600" /> : <Copy className="size-3" />}
    </button>
  )
}

export default function ChercheursListe({ chercheurs }: { chercheurs: Chercheur[] }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? chercheurs.filter(c =>
        `${c.nom} ${c.prenom} ${c.email} ${c.laboratoireDeclaratif ?? ''} ${c.ville ?? ''}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : chercheurs

  const groups: Record<string, Chercheur[]> = {}
  for (const c of filtered) {
    const letter = (c.nom?.[0] ?? '?').toUpperCase()
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(c)
  }
  const letters = Object.keys(groups).sort()

  return (
    <div className="space-y-6">
      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Rechercher un chercheur…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun résultat pour « {query} ».</p>
      )}

      {/* Liste alphabétique */}
      <div className="rounded-xl bg-background overflow-hidden shadow-[0_0_14px_rgba(0,0,0,0.07)]">
        {letters.map((letter, li) => (
          <div key={letter}>
            {/* Intertitre lettre */}
            <div className={`px-6 py-2 bg-muted/40 border-b border-border ${li > 0 ? 'border-t' : ''}`}>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                {letter}
              </span>
            </div>

            {/* Lignes */}
            {groups[letter].map((c, i) => (
              <div
                key={c.id}
                className={`relative flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group cursor-pointer ${
                  i < groups[letter].length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <Link href={`/gestion/chercheurs/${c.id}`} className="absolute inset-0" aria-label={c.nomComplet} />

                {/* Photo */}
                <div className="size-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                  {c.photo?.[0]?.url ? (
                    <Image src={c.photo[0].url} alt={c.nomComplet} width={48} height={48} className="object-cover" />
                  ) : (
                    <User className="size-5 text-muted-foreground" />
                  )}
                </div>

                {/* Nom + labo */}
                <div className="w-64 shrink-0 min-w-0">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{c.nomComplet}</p>
                  {c.laboratoireDeclaratif && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{c.laboratoireDeclaratif}</p>
                  )}
                </div>

                {/* Rôle */}
                <div className="w-40 shrink-0">
                  {c.role[0] && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${rolePillClass(c.role[0])}`}>
                      {roleLabel(c.role[0])}
                    </span>
                  )}
                </div>

                {/* Contrat + spécialité */}
                <div className="w-24 shrink-0 min-w-0">
                  {c.contrat && (
                    <p className="text-sm text-foreground truncate">{c.contrat}</p>
                  )}
                  {c.specialite && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{c.specialite}</p>
                  )}
                  {!c.contrat && !c.specialite && (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>

                {/* Email + copier */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground truncate">{c.email ?? '—'}</span>
                  {c.email && (
                    <div className="relative z-10">
                      <CopyEmailButton email={c.email} />
                    </div>
                  )}
                </div>

                {/* Ville */}
                <div className="w-40 shrink-0 min-w-0">
                  <span className="text-sm text-muted-foreground truncate block">{c.ville ?? '—'}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
