import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getChercheurByEmail, getCandidaturesByChercheur } from '@/services/neon'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { APPEL_ANNEE } from '@/lib/config'
import { getAppSettings } from '@/services/neon/settings'
import Link from 'next/link'
import type { Candidature } from '@/types'

export default async function EspacePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const chercheur = email ? await getChercheurByEmail(email) : null
  if (!chercheur) redirect('/espace/profil/completer')

  const [candidatures, settings] = await Promise.all([
    chercheur ? getCandidaturesByChercheur(chercheur.id) : Promise.resolve([]),
    getAppSettings(),
  ])
  const candidature = candidatures[0] ?? null

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Bonjour, {chercheur!.prenom}
        </h1>
        <p className="text-muted-foreground mt-1">
          Bienvenue dans votre espace candidat — Appel à projets {APPEL_ANNEE}.
        </p>
      </div>

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
    </div>
  )
}
