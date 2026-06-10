import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getUtilisateurByEmail, getCandidatureById, getEvaluationsByReviewer } from '@/services/neon'
import { updateCandidature } from '@/services/neon'
import { APPEL_ANNEE, FIELD_LABELS } from '@/lib/config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import EvaluationForm from '@/components/reviewer/evaluation-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ReviewerCandidaturePage({ params }: { params: Promise<{ candidatureId: string }> }) {
  const { candidatureId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const utilisateur = email ? await getUtilisateurByEmail(email) : null
  if (!utilisateur) redirect('/sign-in')
  const reviewerId = utilisateur.id

  const [c, evaluations] = await Promise.all([
    getCandidatureById(candidatureId).catch(() => null),
    getEvaluationsByReviewer(reviewerId),
  ])

  if (!c) notFound()

  // Vérifie que cette candidature est bien assignée à ce reviewer
  const evaluation = evaluations.find(e => e.candidatureId === candidatureId)
  if (!evaluation) redirect('/reviewer')

  // Premier accès → passe en "En évaluation"
  if (c.statut === 'Envoyée au CS') {
    await updateCandidature(candidatureId, { statut: 'En évaluation' })
  }

  return (
    <div className="max-w-3xl space-y-6">

      <div className="flex items-center gap-4">
        <Link href="/reviewer" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="page-title">Candidature</h1>
          <p className="page-subtitle">Appel à projets {APPEL_ANNEE}</p>
        </div>
      </div>

      {/* Candidature */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base leading-snug">{c.titre}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Field label={FIELD_LABELS.thematique} value={c.thematique} />
          <Field label="Résumé" value={c.resume} multiline />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Budget demandé" value={c.budgetDemande ? `${c.budgetDemande.toLocaleString('fr-FR')} €` : '—'} />
            <Field label="Durée" value={c.dureeMois ? `${c.dureeMois} mois` : '—'} />
          </div>
          {c.partenaires && <Field label="Partenaires" value={c.partenaires} multiline />}
          <Field label="Description" value={c.description} multiline />
        </CardContent>
      </Card>

      {/* Grille d'évaluation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {evaluation.noteFinale !== null
              ? <>Mon évaluation : {Number(evaluation.noteFinale).toFixed(1)}<span className="font-normal text-muted-foreground text-sm">/20</span></>
              : 'Mon évaluation'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EvaluationForm evaluation={evaluation} />
        </CardContent>
      </Card>

    </div>
  )
}

function Field({ label, value, multiline }: { label: string; value?: string | null; multiline?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={multiline ? 'whitespace-pre-wrap text-foreground' : 'text-foreground'}>{value ?? '—'}</p>
    </div>
  )
}
