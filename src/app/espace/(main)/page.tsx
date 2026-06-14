import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUtilisateurByEmail, getCandidaturesByUtilisateur } from '@/services/neon'
import { getProjetByCandidatureId } from '@/services/neon/projets'
import { getJalonsByProjet } from '@/services/neon/jalons'
import { getConventionByCandidatureId } from '@/services/neon/conventions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { APPEL_ANNEE } from '@/lib/config'
import { getAppSettings } from '@/services/neon/settings'
import { getEtapesAppelCourant } from '@/services/neon/appels'
import DateBadge from '@/components/ui/date-badge'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Candidature } from '@/types'

export default async function EspacePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const utilisateur = email ? await getUtilisateurByEmail(email) : null
  if (!utilisateur || !utilisateur.laboratoireDeclaratif) redirect('/espace/profil/completer')

  const [candidatures, settings, etapes] = await Promise.all([
    utilisateur ? getCandidaturesByUtilisateur(utilisateur.id) : Promise.resolve([]),
    getAppSettings(),
    getEtapesAppelCourant(parseInt(APPEL_ANNEE)),
  ])
  const candidature = candidatures[0] ?? null

  const projet = candidature ? await getProjetByCandidatureId(candidature.id) : null
  const convention = (!projet && candidature) ? await getConventionByCandidatureId(candidature.id) : null
  const jalons = projet ? await getJalonsByProjet(projet.id) : []

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bonjour, {utilisateur!.prenom}
          </h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue dans votre espace candidat — Appel à projets {APPEL_ANNEE}.
          </p>
        </div>

      {projet ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mon projet</CardTitle>
            <CardDescription className="mt-1">{projet.titre}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/espace/projet" className="btn-primary inline-flex items-center gap-2">
              Rapports et suivi du projet <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      ) : convention ? (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Ma convention</CardTitle>
              <CardDescription className="mt-1">{convention.numeroConvention}</CardDescription>
            </div>
            <span className="shrink-0 rounded-full px-3.5 py-1 text-sm font-medium bg-blue-50 text-blue-700">
              En cours
            </span>
          </CardHeader>
          <CardContent>
            <Link href="/espace/convention" className="btn-primary inline-flex items-center gap-2">
              Gérer ma convention <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Ma candidature</CardTitle>
              <CardDescription className="mt-1">
                {candidature
                  ? candidature.titre
                  : `Vous n'avez pas encore soumis de candidature pour l'appel à projets ${APPEL_ANNEE}.`
                }
              </CardDescription>
            </div>
            {candidature && (
              <span className={`shrink-0 rounded-full px-3.5 py-1 text-sm font-medium ${settings.statut_colors[candidature.statut] ?? 'bg-zinc-100 text-zinc-700'}`}>
                {settings.statut_labels[candidature.statut] ?? candidature.statut}
              </span>
            )}
          </CardHeader>
          <CardContent>
            {candidature ? (
              candidature.statut === 'Brouillon' ? (
                <Link href="/espace/candidature/nouvelle" className="btn-primary">
                  Continuer ma candidature
                </Link>
              ) : (
                <Link href="/espace/candidature" className="btn-primary">
                  Voir ma candidature
                </Link>
              )
            ) : (
              <Link href="/espace/candidature/nouvelle" className="btn-primary">
                Déposer une candidature
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {convention && !projet && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Pièces à préparer</h2>
          <div className="rounded-xl border border-border divide-y divide-border text-sm">
            {[
              'RIB de l\'établissement',
              'Convention signée (à retourner à la FRA)',
              'Accord de l\'établissement de rattachement',
              'CV scientifique du porteur de projet',
              'Budget prévisionnel détaillé',
              'Attestation d\'assurance responsabilité civile',
            ].map(piece => (
              <div key={piece} className="flex items-center gap-3 px-4 py-3">
                <div className="size-4 rounded border border-border shrink-0" />
                <span className="text-foreground">{piece}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>

      {(() => {
        const now = new Date()
        if (projet && jalons.length > 0) {
          const sorted = [...jalons].sort((a, b) => a.datePrevue.localeCompare(b.datePrevue))
          const nextIndex = sorted.findIndex(j => new Date(j.datePrevue) >= now)
          return (
            <div className="space-y-8 mt-14 max-w-2xl">
              <h2 className="text-base font-semibold">Prochaines étapes</h2>
              <div className="relative flex">
                <div className="absolute left-[calc(10%)] right-[calc(10%)] top-[56px] h-px bg-border" />
                {sorted.map((j, i) => {
                  const past = new Date(j.datePrevue) < now || j.statut === 'realise'
                  const isCurrent = i === nextIndex
                  return (
                    <div key={j.id} className={`flex-1 flex flex-col items-center gap-2 px-1 ${past ? 'opacity-40' : ''}`}>
                      <DateBadge dateStr={j.datePrevue} size="sm" />
                      <div className={`w-2.5 h-2.5 rounded-full z-10 shrink-0 ${
                        past      ? 'bg-border' :
                        isCurrent ? 'bg-primary ring-4 ring-primary/20' :
                                    'bg-white border-2 border-border'
                      }`} />
                      <p className={`text-[11px] text-center leading-tight line-clamp-3 mt-0.5 ${
                        isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      }`}>
                        {j.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }
        if (!projet && etapes.length > 0) {
          const nextIndex = etapes.findIndex(e => new Date(e.date_prevue) >= now)
          return (
            <div className="space-y-8 mt-14 max-w-2xl">
              <h2 className="text-base font-semibold">Prochaines étapes</h2>
              <div className="relative flex">
                <div className="absolute left-[calc(10%)] right-[calc(10%)] top-[56px] h-px bg-border" />
                {etapes.map((e, i) => {
                  const past = new Date(e.date_prevue) < now
                  const isCurrent = i === nextIndex
                  return (
                    <div key={e.id} className={`flex-1 flex flex-col items-center gap-2 px-1 ${past ? 'opacity-40' : ''}`}>
                      <DateBadge dateStr={e.date_prevue} size="sm" />
                      <div className={`w-2.5 h-2.5 rounded-full z-10 shrink-0 ${
                        past      ? 'bg-border' :
                        isCurrent ? 'bg-primary ring-4 ring-primary/20' :
                                    'bg-white border-2 border-border'
                      }`} />
                      <p className={`text-[11px] text-center leading-tight line-clamp-3 mt-0.5 ${
                        isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      }`}>
                        {e.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }
        return null
      })()}
    </div>
  )
}
