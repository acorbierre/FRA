'use client'

import Link from 'next/link'
import { ChevronRight, FlaskConical, Scan, Users, Dna, Shield, Microscope, ClipboardCheck, type LucideIcon } from 'lucide-react'
import type { Candidature } from '@/types'

function TeamsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="17" cy="7" r="2.2" fill="var(--color-primary)" opacity="0.4" />
      <path d="M13.5 13c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2v3h-7v-3z" fill="var(--color-primary)" opacity="0.4" />
      <rect x="3" y="10" width="13" height="10" rx="2" fill="var(--color-primary)" />
      <circle cx="9.5" cy="6.5" r="2.8" fill="var(--color-primary)" />
      <rect x="6" y="13" width="7" height="1.5" rx="0.75" fill="white" />
      <rect x="8.75" y="13" width="1.5" height="5" rx="0.75" fill="white" />
    </svg>
  )
}

function getTeamsUrl(c: Candidature, statutLabel: string) {
  const lines = [
    `📌 Candidature : ${c.titre}`,
    `Statut : ${statutLabel}`,
    ...(c.thematique ? [`Thématique : ${c.thematique}`] : []),
    ...(c.budgetDemande ? [`Budget demandé : ${c.budgetDemande.toLocaleString('fr-FR')} €`] : []),
    ...(c.dureeMois ? [`Durée : ${c.dureeMois} mois`] : []),
  ]
  return `https://teams.microsoft.com/l/chat/0/0?users=&message=${encodeURIComponent(lines.join('\n'))}`
}

function getThematiqueIcon(label?: string | null): LucideIcon {
  const l = (label ?? '').toLowerCase()
  if (l.includes('biomarqu'))                                                return FlaskConical
  if (l.includes('imagerie'))                                                return Scan
  if (l.includes('cohorte'))                                                 return Users
  if (l.includes('génétique') || l.includes('genetique'))                    return Dna
  if (l.includes('barrière') || l.includes('barriere') || l.includes('hémato') || l.includes('hemato')) return Shield
  return Microscope
}

function ThematiqueAvatar({ label }: { label?: string | null }) {
  const Icon = getThematiqueIcon(label)
  return <Icon className="shrink-0 size-5 text-muted-foreground" />
}

interface Props {
  candidatures: Candidature[]
  chercheurMap: Record<string, string>
  statutColors: Record<string, string>
  statutLabelsGestion: Record<string, string>
}

export default function CandidaturesTabs({ candidatures, chercheurMap, statutColors, statutLabelsGestion }: Props) {
  return (
    <div className="space-y-2">
      {candidatures.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune candidature.</p>
      ) : candidatures.map(c => {
            const meta = [
              c.utilisateurId ? (chercheurMap[c.utilisateurId] ?? null) : null,
              c.budgetDemande ? `${c.budgetDemande.toLocaleString('fr-FR')} €` : null,
              c.dureeMois ? `${c.dureeMois} mois` : null,
            ].filter(Boolean).join(' · ')

            return (
              <div key={c.id} className="relative rounded-xl bg-background px-7 py-6 flex flex-col gap-3 shadow-[0_0_14px_rgba(0,0,0,0.07)]">
                <Link href={`/gestion/candidatures/${c.id}`} className="absolute inset-0 rounded-xl" />

                {/* Ligne 1 : pill statut */}
                <div className="pointer-events-none">
                  <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${statutColors[c.statut] ?? 'bg-zinc-100 text-zinc-700'}`}>
                    {statutLabelsGestion[c.statut] ?? c.statut}
                  </span>
                </div>

                {/* Ligne 2 : titre/meta + actions */}
                <div className="flex items-start gap-6">
                  <div className="flex-1 min-w-0 pointer-events-none">
                    <p className="font-medium text-[15px] leading-snug mb-1">{c.titre}</p>
                    {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
                  </div>
                  <div className="relative z-10 flex items-center gap-2 shrink-0">
                    <Link
                      href={`/gestion/candidatures/${c.id}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
                    >
                      <ClipboardCheck className="size-4" />
                      Gérer la candidature
                    </Link>
                    <a
                      href={getTeamsUrl(c, statutLabelsGestion[c.statut] ?? c.statut)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Partager dans Teams"
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <TeamsIcon />
                    </a>
                  </div>
                </div>
              </div>
            )
      })}
    </div>
  )
}
