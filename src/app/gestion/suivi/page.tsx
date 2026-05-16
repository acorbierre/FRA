import { getProjets, getConventions, getRapports, getVersements } from '@/services/neon'
import ProjetTimeline from '@/components/gestion/projet-timeline'
import TitreProjet from '@/components/gestion/titre-projet'
import StatutSelect from '@/components/gestion/statut-select'
import type { Projet, Rapport, Versement } from '@/types'

const PROJET_STATUTS: Projet['statut'][] = ['En cours', 'Suspendu', 'Terminé']

export default async function SuiviPage() {
  const [projets, conventions, rapports, versements] = await Promise.all([
    getProjets(),
    getConventions(),
    getRapports(),
    getVersements(),
  ])

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
        <p className="page-subtitle">{projets.length} projet{projets.length > 1 ? 's' : ''} en gestion</p>
      </div>

      {projets.length === 0
        ? <p className="text-sm text-muted-foreground">Aucun projet.</p>
        : <div className="space-y-3">
            {projets.map(p => {
              const rapportsDuProjet = rapportsParProjet[p.id] ?? []
              const alertes = rapportsDuProjet.filter(r => r.statut === 'Attendu')
              const versementsDuProjet = versementsParProjet[p.id] ?? []
              const duree = dureeProjet(p.dateDebut, p.dateFinPrevue)

              return (
                <div key={p.id} className="rounded-xl bg-background p-4 space-y-3 shadow-[0_0_14px_rgba(0,0,0,0.07)]">
                  <div className="flex items-center gap-6">
                    {/* Titre */}
                    <div className="flex-1 min-w-0">
                      <TitreProjet
                        id={p.id}
                        titre={p.titre}
                        titreCourt={p.titreCourt}
                        href={`/gestion/projets/${p.id}`}
                      />
                    </div>

                    {/* Montant */}
                    <div className="w-32 shrink-0">
                      <p className="text-xs text-muted-foreground">Montant financé</p>
                      <p className="text-sm tabular-nums">{(p.montantAccorde ?? 0).toLocaleString('fr-FR')} €</p>
                    </div>

                    {/* Durée */}
                    <div className="w-24 shrink-0">
                      <p className="text-xs text-muted-foreground">Durée</p>
                      <p className="text-sm">{duree ?? '—'}</p>
                    </div>

                    {/* Alertes */}
                    <div className="shrink-0 w-28 text-right">
                      {alertes.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                          <span>⚠</span>
                          {alertes.length} rapport{alertes.length > 1 ? 's' : ''} attendu{alertes.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </div>

                    {/* Statut — colonne actions */}
                    <div className="shrink-0">
                      <StatutSelect id={p.id} statut={p.statut} options={PROJET_STATUTS} endpoint="projet" />
                    </div>
                  </div>

                  <ProjetTimeline
                    dateDebut={p.dateDebut}
                    dateFinPrevue={p.dateFinPrevue}
                    dateFinReelle={p.dateFinReelle}
                    statut={p.statut}
                    rapports={rapportsDuProjet
                      .filter(r => r.dateAttendue)
                      .map(r => ({ date: r.dateAttendue!, statut: r.statut, reference: r.reference, type: r.type }))}
                    versements={versementsDuProjet
                      .sort((a, b) => a.numero - b.numero)
                      .map(v => ({ datePrevue: v.datePrevue, dateRealisee: v.dateRealisee, statut: v.statut, numero: v.numero, montant: v.montant }))}
                  />
                </div>
              )
            })}
          </div>
      }
    </div>
  )
}
