import { getProjets, getConventions, getRapports, getVersements } from '@/services/neon'
import { getAppSettings } from '@/services/neon/settings'
import TitreProjet from '@/components/gestion/titre-projet'
import Link from 'next/link'
import { Mail, FlaskConical, Scan, Users, Dna, Shield, Microscope, type LucideIcon } from 'lucide-react'
import type { Projet, Rapport, Versement } from '@/types'

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

function getThematiqueIcon(label?: string | null): LucideIcon {
  const l = (label ?? '').toLowerCase()
  if (l.includes('biomarqu'))                          return FlaskConical
  if (l.includes('imagerie'))                          return Scan
  if (l.includes('cohorte'))                           return Users
  if (l.includes('génétique') || l.includes('genetique')) return Dna
  if (l.includes('barrière') || l.includes('barriere') || l.includes('hémato') || l.includes('hemato')) return Shield
  return Microscope
}

function ThematiqueAvatar({ label }: { label?: string | null }) {
  const Icon = getThematiqueIcon(label)
  return <Icon className="shrink-0 size-5 text-muted-foreground" />
}

function getMailtoUrl(p: Projet) {
  const subject = encodeURIComponent(`Contact – ${p.titre}`)
  const body = encodeURIComponent(
    `Bonjour,\n\nNous vous contactons au sujet du projet « ${p.titre} »${p.ville ? ` (${p.ville})` : ''}.\n\nCordialement,\nL'équipe FRA`
  )
  return `mailto:?subject=${subject}&body=${body}`
}

function getTeamsUrl(p: Projet, versePct: number, verse: number) {
  const lines = [
    `📌 Projet : ${p.titre}`,
    ...(p.thematique ? [`Thématique : ${p.thematique}`] : []),
    ...(p.ville ? [`Ville : ${p.ville}`] : []),
    ...(p.montantAccorde ? [`Montant accordé : ${p.montantAccorde.toLocaleString('fr-FR')} €`] : []),
    ...(p.montantAccorde && verse > 0 ? [`Versé : ${verse.toLocaleString('fr-FR')} € (${versePct} %)`] : []),
    ...(p.dateDebut && p.dateFinPrevue ? [`Période : ${new Date(p.dateDebut).toLocaleDateString('fr-FR')} → ${new Date(p.dateFinPrevue).toLocaleDateString('fr-FR')}`] : []),
  ]
  return `https://teams.microsoft.com/l/chat/0/0?message=${encodeURIComponent(lines.join('\n'))}`
}

export default async function SuiviPage() {
  const [projets, conventions, rapports, versements, settings] = await Promise.all([
    getProjets(),
    getConventions(),
    getRapports(),
    getVersements(),
    getAppSettings(),
  ])

  const projetsEnCours = projets.filter(p => p.statut === 'En cours')
  projetsEnCours.sort((a, b) => {
    if (a.dateDebut && b.dateDebut) return b.dateDebut.localeCompare(a.dateDebut)
    if (a.dateDebut) return 1
    if (b.dateDebut) return -1
    return (b.anneeSelection ?? 0) - (a.anneeSelection ?? 0)
  })

  // Rapports groupés par projet
  const rapportsParProjet: Record<string, Rapport[]> = {}
  for (const r of rapports) {
    for (const pid of r.projetId ?? []) {
      if (!rapportsParProjet[pid]) rapportsParProjet[pid] = []
      rapportsParProjet[pid].push(r)
    }
  }

  // Versements groupés par projet (via conventions)
  const versementsParProjet: Record<string, Versement[]> = {}
  for (const p of projets) {
    const convsDuProjet = conventions.filter(c => c.projetId?.includes(p.id))
    versementsParProjet[p.id] = versements.filter(v =>
      convsDuProjet.some(c => v.conventionId?.includes(c.id))
    )
  }

  function dureeProjet(debut?: string, fin?: string): string | null {
    if (!debut || !fin) return null
    const mois = Math.round((new Date(fin).getTime() - new Date(debut).getTime()) / (1000 * 60 * 60 * 24 * 30.5))
    if (mois < 12) return `${mois} mois`
    const annees = Math.floor(mois / 12)
    const reste = mois % 12
    return reste > 0 ? `${annees} an${annees > 1 ? 's' : ''} et ${reste} mois` : `${annees} an${annees > 1 ? 's' : ''}`
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Suivi des projets</h1>
        <p className="page-subtitle">{projetsEnCours.length} projet{projetsEnCours.length > 1 ? 's' : ''} en gestion</p>
      </div>

      {projetsEnCours.length === 0
        ? <p className="text-sm text-muted-foreground">Aucun projet.</p>
        : <div className="space-y-3">
            {projetsEnCours.map(p => {
              const rapportsDuProjet = rapportsParProjet[p.id] ?? []
              const alertes = rapportsDuProjet.filter(r => r.statut === 'Attendu')
              const versementsDuProjet = versementsParProjet[p.id] ?? []
              const duree = dureeProjet(p.dateDebut, p.dateFinPrevue)

              const meta = [
                p.montantAccorde ? `${p.montantAccorde.toLocaleString('fr-FR')} €` : null,
                duree,
              ].filter(Boolean).join(' · ')

              const verse = versementsDuProjet
                .filter(v => v.statut === 'Réalisé')
                .reduce((sum, v) => sum + (v.montant ?? 0), 0)
              const versePct = p.montantAccorde > 0 ? Math.min(100, Math.round((verse / p.montantAccorde) * 100)) : 0

              return (
                <div key={p.id} className="relative rounded-xl bg-background px-7 py-6 flex flex-col gap-3 shadow-[0_0_14px_rgba(0,0,0,0.07)]">
                  <Link href={`/gestion/projets/${p.id}`} className="absolute inset-0 rounded-xl" />

                  {/* Ligne 1 : pill statut + alertes */}
                  <div className="flex items-center gap-2 pointer-events-none">
                    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${settings.projet_colors[p.statut] ?? 'bg-zinc-100 text-zinc-700'}`}>
                      {settings.projet_labels[p.statut] ?? p.statut}
                    </span>
                    {alertes.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                        <span>⚠</span>
                        {alertes.length} rapport{alertes.length > 1 ? 's' : ''} attendu{alertes.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Ligne 2 : icône + titre/meta + actions */}
                  <div className="flex items-start gap-6">
                    <div className="flex-1 min-w-0 pointer-events-none">
                      <div className="relative z-10 mb-1">
                        <TitreProjet
                          id={p.id}
                          titre={p.titre}
                          titreCourt={p.titreCourt}
                          href={`/gestion/projets/${p.id}`}
                        />
                      </div>
                      {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
                    </div>

                    <div className="relative z-10 flex items-center gap-3 shrink-0">
                    {p.montantAccorde > 0 && (
                      <div className="flex flex-col gap-2 mr-6">
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${versePct}%`, background: versePct === 100 ? '#16a34a' : 'var(--color-primary)' }} />
                        </div>
                        <p className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                          {Math.round(verse / 1000)} k€ versés sur {Math.round(p.montantAccorde / 1000)} k€ <span className="font-medium" style={{ color: versePct === 100 ? '#16a34a' : undefined }}>({versePct} %)</span>
                        </p>
                      </div>
                    )}
                    <a
                      href={getMailtoUrl(p)}
                      title="Contacter le labo par e-mail"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
                    >
                      <Mail className="size-4" />
                      Contacter le labo
                    </a>
                    <a
                      href={getTeamsUrl(p, versePct, verse)}
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
      }
    </div>
  )
}
