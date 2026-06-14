import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUtilisateurByEmail, getCandidaturesByUtilisateur } from '@/services/neon'
import { getProjetByCandidatureId } from '@/services/neon/projets'
import { getConventionByCandidatureId } from '@/services/neon/conventions'
import { getVersements } from '@/services/neon/versements'
import { getJalonsByProjet } from '@/services/neon/jalons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CalendarDays, Euro, Clock } from 'lucide-react'
import Link from 'next/link'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-foreground">{value ?? '—'}</p>
    </div>
  )
}

const VERSEMENT_LABELS: Record<string, string> = {
  'Prévu':              'Prévu',
  'En attente rapport': 'En attente de rapport',
  'Réalisé':            'Versé',
}

const VERSEMENT_COLORS: Record<string, string> = {
  'Prévu':              'bg-muted text-muted-foreground',
  'En attente rapport': 'bg-amber-50 text-amber-700',
  'Réalisé':            'bg-green-50 text-green-700',
}

export default async function ProjetEspacePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const utilisateur = email ? await getUtilisateurByEmail(email) : null
  if (!utilisateur) redirect('/espace/profil/completer')

  const candidatures = await getCandidaturesByUtilisateur(utilisateur.id)
  const candidature = candidatures.find(c => c.statut === 'Retenue') ?? null
  if (!candidature) redirect('/espace')

  const projet = await getProjetByCandidatureId(candidature.id)
  if (!projet) redirect('/espace')

  const [convention, tousVersements, jalons] = await Promise.all([
    getConventionByCandidatureId(candidature.id),
    getVersements(),
    getJalonsByProjet(projet.id),
  ])

  const versements = tousVersements
    .filter(v => convention && v.conventionId === convention.id)
    .sort((a, b) => a.numero - b.numero)

  const duree = projet.dateDebut && projet.dateFinPrevue
    ? Math.round((new Date(projet.dateFinPrevue).getTime() - new Date(projet.dateDebut).getTime()) / (1000 * 60 * 60 * 24 * 30.5))
    : null

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/espace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="size-4" /> Tableau de bord
        </Link>
        <h1 className="page-title">Mon projet</h1>
      </div>

      {/* Carte principale */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base leading-snug">{projet.titre}</CardTitle>
          {projet.thematique && (
            <p className="text-xs font-medium uppercase tracking-wide text-primary/70 mt-1">{projet.thematique}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <Euro className="size-4 text-muted-foreground" />
              <p className="text-lg font-semibold tabular-nums">{(projet.montantAccorde ?? 0).toLocaleString('fr-FR')} €</p>
              <p className="text-xs text-muted-foreground">Montant accordé</p>
            </div>
            {duree && (
              <div className="flex flex-col gap-1">
                <Clock className="size-4 text-muted-foreground" />
                <p className="text-lg font-semibold">{duree} mois</p>
                <p className="text-xs text-muted-foreground">Durée</p>
              </div>
            )}
            {projet.dateDebut && (
              <div className="flex flex-col gap-1">
                <CalendarDays className="size-4 text-muted-foreground" />
                <p className="text-lg font-semibold">{new Date(projet.dateDebut).getFullYear()}</p>
                <p className="text-xs text-muted-foreground">Année de démarrage</p>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4 space-y-4">
            {projet.dateDebut && <Field label="Date de démarrage" value={fmtDate(projet.dateDebut)} />}
            {projet.dateFinPrevue && <Field label="Fin prévue" value={fmtDate(projet.dateFinPrevue)} />}
            {projet.dimensionInternationale && <Field label="Dimension internationale" value="Oui" />}
          </div>
        </CardContent>
      </Card>

      {/* Versements */}
      {versements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Échéancier de versements</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border -my-1">
            {versements.map(v => (
              <div key={v.id} className="py-3 flex items-center justify-between text-sm gap-3">
                <div>
                  <p className="font-medium">Versement {v.numero}</p>
                  {v.datePrevue && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {v.dateRealisee ? `Versé le ${fmtDate(v.dateRealisee)}` : `Prévu le ${fmtDate(v.datePrevue)}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="tabular-nums font-medium">{v.montant.toLocaleString('fr-FR')} €</p>
                  <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${VERSEMENT_COLORS[v.statut] ?? 'bg-muted text-muted-foreground'}`}>
                    {VERSEMENT_LABELS[v.statut] ?? v.statut}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Jalons */}
      {jalons.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Jalons du projet</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border -my-1">
            {jalons
              .sort((a, b) => a.datePrevue.localeCompare(b.datePrevue))
              .map(j => (
                <div key={j.id} className="py-3 flex items-center justify-between text-sm gap-3">
                  <div>
                    <p className="font-medium">{j.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(j.datePrevue)}</p>
                  </div>
                  <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium shrink-0 ${
                    j.statut === 'realise' ? 'bg-green-50 text-green-700' : 'bg-muted text-muted-foreground'
                  }`}>
                    {j.statut === 'realise' ? 'Réalisé' : 'À venir'}
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
