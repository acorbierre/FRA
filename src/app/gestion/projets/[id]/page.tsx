import { getProjetById, getConventions, getRapports, getVersements, getCandidatureById } from '@/services/neon'
import { getAppSettings } from '@/services/neon/settings'
import { getUtilisateurById } from '@/services/neon/utilisateurs'
import { getLaboratoireById } from '@/services/neon/laboratoires'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ProjetTimeline from '@/components/gestion/projet-timeline'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Euro, CalendarDays, User, FlaskConical, Mail } from 'lucide-react'
import DateBadge from '@/components/ui/date-badge'

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

  const [projet, allConventions, allRapports, allVersements, settings] = await Promise.all([
    getProjetById(id),
    getConventions(),
    getRapports(),
    getVersements(),
    getAppSettings(),
  ])

  const conventions = allConventions.filter(c => c.projetId?.includes(id))
  const rapports    = allRapports.filter(r => r.projetId?.includes(id))

  // Versements regroupés par convention
  const versementsParConvention: Record<string, typeof allVersements> = {}
  for (const conv of conventions) {
    versementsParConvention[conv.id] = allVersements.filter(v => v.conventionId?.includes(conv.id))
  }

  // Candidature liée + chercheur + labo
  const candidatureId = projet.candidatureId
  const candidature = candidatureId ? await getCandidatureById(candidatureId).catch(() => null) : null
  const chercheur = candidature?.utilisateurId
    ? await getUtilisateurById(candidature.utilisateurId).catch(() => null)
    : null
  const labo = chercheur?.laboratoireId?.[0]
    ? await getLaboratoireById(chercheur.laboratoireId[0]).catch(() => null)
    : null

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
    <div className="max-w-5xl space-y-6">
      <div>
        <Link href="/gestion/suivi?tab=projets" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="size-4" /> Suivi des projets
        </Link>
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium mb-2 ${settings.projet_colors[projet.statut] ?? 'bg-zinc-100 text-zinc-700'}`}>
          {settings.projet_labels[projet.statut] ?? projet.statut}
        </span>
        <h1 className="page-title">{projet.titre}</h1>
        {projet.thematique && (
          <p className="text-xs font-medium uppercase tracking-wide text-primary/70 mt-1">{projet.thematique}</p>
        )}
      </div>

      {/* Mini-cartes budget + durée + labo */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 space-y-1">
            <Euro className="size-4 text-muted-foreground" />
            <p className="text-xl font-semibold tabular-nums">{(projet.montantAccorde ?? 0).toLocaleString('fr-FR')} €</p>
            <p className="text-xs text-muted-foreground">Budget alloué</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 space-y-1">
            <CalendarDays className="size-4 text-muted-foreground" />
            <p className="text-xl font-semibold">{dureeProjet ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Durée du projet</p>
          </CardContent>
        </Card>
        <Card className="relative">
          {chercheur && (
            <a
              href={`mailto:${chercheur.email}`}
              title={chercheur.email}
              className="absolute top-4 right-4 p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Mail className="size-3.5" />
            </a>
          )}
          <CardContent className="pt-4 space-y-1">
            <FlaskConical className="size-4 text-muted-foreground" />
            <p className="text-xl font-semibold truncate pr-8">{chercheur?.nomComplet ?? '—'}</p>
            <p className="text-xs text-muted-foreground">
              {(labo?.nom ?? chercheur?.laboratoireDeclaratif) ? (
                chercheur?.carteLabId ? (
                  <><a href={`/carto?lab=${chercheur.carteLabId}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors underline-offset-2 hover:underline">{labo?.nom ?? chercheur.laboratoireDeclaratif}</a>{' · Chercheur principal'}</>
                ) : (
                  <>{labo?.nom ?? chercheur?.laboratoireDeclaratif}{' · Chercheur principal'}</>
                )
              ) : 'Chercheur principal'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
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
            <CardTitle>Candidature liée</CardTitle>
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
            <CardTitle>Conventions ({conventions.length})</CardTitle>
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
                    <div className="space-y-2 mt-2">
                      {verts
                        .sort((a, b) => a.numero - b.numero)
                        .map(v => {
                          const dateStr = v.dateRealisee ?? v.datePrevue
                          return (
                            <div key={v.id} className="flex items-center gap-3 p-3 bg-background rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.06)]">
                              {dateStr && <DateBadge dateStr={dateStr} size="sm" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">Versement {v.numero}</p>
                                <p className="text-xs text-muted-foreground tabular-nums">{v.montant.toLocaleString('fr-FR')} €</p>
                              </div>
                              <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium shrink-0 ${VERSEMENT_STATUT_COLORS[v.statut] ?? 'bg-muted text-muted-foreground'}`}>
                                {v.statut}
                              </span>
                            </div>
                          )
                        })}
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
            <CardTitle>Rapports ({rapports.length})</CardTitle>
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
