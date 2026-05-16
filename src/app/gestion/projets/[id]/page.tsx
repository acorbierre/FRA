import { getProjetById, getConventions, getRapports, getVersements, getCandidatureById } from '@/services/neon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ProjetTimeline from '@/components/gestion/projet-timeline'
import Link from 'next/link'
import { ArrowLeft, FileText, Banknote, NotebookPen, AlertTriangle, Euro, CalendarDays } from 'lucide-react'
import type { Projet } from '@/types'

const STATUT_COLORS: Record<Projet['statut'], string> = {
  'En cours':  'bg-green-50 text-green-700',
  'Suspendu':  'bg-amber-50 text-amber-700',
  'Terminé':   'bg-muted text-muted-foreground',
}

const RAPPORT_STATUT_COLORS: Record<string, string> = {
  'Attendu':  'bg-amber-50 text-amber-700',
  'Soumis':   'bg-blue-50 text-blue-700',
  'Reçu':     'bg-green-50 text-green-700',
  'Validé':   'bg-green-100 text-green-800',
}

const VERSEMENT_STATUT_COLORS: Record<string, string> = {
  'Prévu':              'bg-muted text-muted-foreground',
  'En attente rapport': 'bg-amber-50 text-amber-700',
  'Réalisé':            'bg-green-50 text-green-700',
}

export default async function ProjetFichePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [projet, allConventions, allRapports, allVersements] = await Promise.all([
    getProjetById(id),
    getConventions(),
    getRapports(),
    getVersements(),
  ])

  const conventions = allConventions.filter(c => c.projetId?.includes(id))
  const rapports    = allRapports.filter(r => r.projetId?.includes(id))

  // Versements regroupés par convention
  const versementsParConvention: Record<string, typeof allVersements> = {}
  for (const conv of conventions) {
    versementsParConvention[conv.id] = allVersements.filter(v => v.conventionId?.includes(conv.id))
  }

  // Candidature liée
  const candidatureId = projet.candidatureId?.[0]
  const candidature = candidatureId ? await getCandidatureById(candidatureId).catch(() => null) : null

  const today = new Date()

  function duree(debut?: string, fin?: string): string | null {
    if (!debut || !fin) return null
    const mois = Math.round((new Date(fin).getTime() - new Date(debut).getTime()) / (1000 * 60 * 60 * 24 * 30.5))
    if (mois < 12) return `${mois} mois`
    const annees = Math.floor(mois / 12)
    const reste = mois % 12
    return reste > 0 ? `${annees} an${annees > 1 ? 's' : ''} et ${reste} mois` : `${annees} an${annees > 1 ? 's' : ''}`
  }

  const dureeProjet = duree(projet.dateDebut, projet.dateFinPrevue)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/gestion/suivi?tab=projets" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="size-4" /> Suivi des projets
        </Link>
        <div className="flex items-start justify-between gap-3">
          <h1 className="page-title">{projet.titre}</h1>
          <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${STATUT_COLORS[projet.statut]}`}>
            {projet.statut}
          </span>
        </div>
        <ProjetTimeline
          dateDebut={projet.dateDebut}
          dateFinPrevue={projet.dateFinPrevue}
          dateFinReelle={projet.dateFinReelle}
          statut={projet.statut}
          rapports={rapports
            .filter(r => r.dateAttendue)
            .map(r => ({ date: r.dateAttendue!, statut: r.statut, reference: r.reference, type: r.type }))}
          versements={Object.values(versementsParConvention)
            .flat()
            .sort((a, b) => a.numero - b.numero)
            .map(v => ({ datePrevue: v.datePrevue, dateRealisee: v.dateRealisee, statut: v.statut, numero: v.numero, montant: v.montant }))}
        />
      </div>

      {/* Mini-cartes budget + durée */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 space-y-1">
            <Euro className="size-4 text-muted-foreground" />
            <p className="text-xl font-semibold tabular-nums">{(projet.montantAccorde ?? 0).toLocaleString('fr-FR')} €</p>
            <p className="text-xs text-muted-foreground">Budget alloué</p>
          </CardContent>
        </Card>
        {dureeProjet && (
          <Card>
            <CardContent className="pt-4 space-y-1">
              <CalendarDays className="size-4 text-muted-foreground" />
              <p className="text-xl font-semibold">{dureeProjet}</p>
              <p className="text-xs text-muted-foreground">Durée du projet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Infos générales */}
      <Card>
        <CardHeader><CardTitle className="text-base">Informations générales</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Montant accordé" value={`${(projet.montantAccorde ?? 0).toLocaleString('fr-FR')} €`} />
          <Field label="Dimension internationale" value={projet.dimensionInternationale ? 'Oui' : 'Non'} />
          <Field label="Date de début" value={projet.dateDebut ? fmtDate(projet.dateDebut) : '—'} />
          <Field label="Fin prévue" value={projet.dateFinPrevue ? fmtDate(projet.dateFinPrevue) : '—'} />
          {projet.dateFinReelle && <Field label="Fin réelle" value={fmtDate(projet.dateFinReelle)} />}
          {projet.detailPartenariats && (
            <div className="col-span-2">
              <Field label="Partenariats" value={projet.detailPartenariats} multiline />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidature liée */}
      {candidature && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <NotebookPen className="size-4 text-muted-foreground" />
              Candidature liée
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <p className="font-medium truncate">{candidature.titre}</p>
                <p className="text-xs text-muted-foreground">{candidature.thematique}</p>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="tabular-nums font-medium">{(candidature.budgetDemande ?? 0).toLocaleString('fr-FR')} €</p>
                <span className="text-xs rounded-full px-2 py-0.5 font-medium bg-primary/10 text-primary">
                  {candidature.statut}
                </span>
              </div>
            </div>
            {candidature.resume && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{candidature.resume}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conventions + Versements */}
      {conventions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="size-4 text-muted-foreground" />
              Conventions ({conventions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border -my-1">
            {conventions.map(conv => {
              const verts = versementsParConvention[conv.id] ?? []
              return (
                <div key={conv.id} className="py-4 space-y-3">
                  {/* En-tête convention */}
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{conv.numeroConvention}</p>
                      <p className="text-xs text-muted-foreground">
                        {conv.dateSignature ? `Signée le ${fmtDate(conv.dateSignature)}` : 'Non signée'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums font-medium">{(conv.montantTotal ?? 0).toLocaleString('fr-FR')} €</p>
                      <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                        conv.statut === 'En cours' ? 'bg-green-50 text-green-700' : 'bg-muted text-muted-foreground'
                      }`}>{conv.statut}</span>
                    </div>
                  </div>

                  {/* Versements */}
                  {verts.length > 0 && (
                    <div className="ml-3 border-l-2 border-border pl-3 space-y-2">
                      {verts
                        .sort((a, b) => a.numero - b.numero)
                        .map(v => (
                          <div key={v.id} className="flex items-center justify-between text-xs gap-2">
                            <div className="min-w-0">
                              <span className="font-medium text-muted-foreground">V{v.numero}</span>
                              {' · '}
                              <span className="tabular-nums">{v.montant.toLocaleString('fr-FR')} €</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {v.datePrevue && (
                                <span className="text-muted-foreground">
                                  {v.dateRealisee ? fmtDate(v.dateRealisee) : `prévu ${fmtDate(v.datePrevue)}`}
                                </span>
                              )}
                              <span className={`rounded-full px-2 py-0.5 font-medium ${VERSEMENT_STATUT_COLORS[v.statut] ?? 'bg-muted text-muted-foreground'}`}>
                                {v.statut}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Rapports */}
      {rapports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              Rapports ({rapports.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border -my-1">
            {rapports
              .sort((a, b) => (a.dateAttendue ?? '').localeCompare(b.dateAttendue ?? ''))
              .map(r => {
                const enRetard = r.statut === 'Attendu' && r.dateAttendue && new Date(r.dateAttendue) < today
                return (
                  <div key={r.id} className="py-3 flex items-center justify-between text-sm gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium truncate">{r.reference}</p>
                        {enRetard && (
                          <AlertTriangle className="size-3.5 text-destructive shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{r.type}</p>
                      {r.dateAttendue && (
                        <p className={`text-xs mt-0.5 ${enRetard ? 'text-destructive' : 'text-muted-foreground'}`}>
                          Attendu le {fmtDate(r.dateAttendue)}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 text-xs rounded-full px-2 py-0.5 font-medium ${RAPPORT_STATUT_COLORS[r.statut] ?? 'bg-muted text-muted-foreground'}`}>
                      {r.statut}
                    </span>
                  </div>
                )
              })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Field({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={multiline ? 'whitespace-pre-wrap' : ''}>{value}</p>
    </div>
  )
}
