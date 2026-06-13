import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUtilisateurByEmail, getEvaluationsByReviewer, getCandidatureById } from '@/services/neon'
import { getAppSettings } from '@/services/neon/settings'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ReviewerPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const utilisateur = email ? await getUtilisateurByEmail(email) : null
  if (!utilisateur) redirect('/sign-in')
  const reviewerId = utilisateur.id

  const [evaluations, settings] = await Promise.all([
    getEvaluationsByReviewer(reviewerId),
    getAppSettings(),
  ])

  const candidatures = await Promise.all(
    evaluations.map(e => getCandidatureById(e.candidatureId).catch(() => null))
  )
  const count = candidatures.filter(Boolean).length

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Bonjour, {utilisateur.prenom}
        </h1>
        <p className="text-muted-foreground mt-1">
          {count === 0
            ? 'Aucune candidature ne vous a encore été assignée.'
            : `${count} candidature${count > 1 ? 's' : ''} à évaluer`}
        </p>
      </div>

      {evaluations.length > 0 && (
        <div className="space-y-4">
          {evaluations.map((e, i) => {
            const c = candidatures[i]
            if (!c) return null
            const soumise = e.statut === 'Soumise'
            return (
              <Card key={e.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-snug">{c.titre}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{c.thematique ?? '—'}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                    settings.evaluation_colors[e.statut] ?? (soumise ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700')
                  }`}>
                    {settings.evaluation_labels[e.statut] ?? (soumise ? 'Évaluation transmise' : 'En attente')}
                  </span>
                </CardHeader>
                <CardContent>
                  {!soumise && (
                    <Link
                      href={`/reviewer/${c.id}`}
                      className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Commencer l'évaluation
                    </Link>
                  )}
                  {soumise && (
                    <Link
                      href={`/reviewer/${c.id}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                    >
                      Voir ma grille
                    </Link>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
