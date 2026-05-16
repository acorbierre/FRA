import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getChercheurByEmail, getCandidaturesByChercheur } from '@/services/neon'
import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { APPEL_ANNEE, FIELD_LABELS, STATUT_COLORS, STATUT_LABELS } from '@/lib/config'
import type { Candidature } from '@/types'

export default async function CandidaturePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const chercheur = email ? await getChercheurByEmail(email) : null
  if (!chercheur) redirect('/espace/profil/completer')
  const chercheurId = chercheur.id

  const candidatures = await getCandidaturesByChercheur(chercheurId)
  if (candidatures.length === 0) redirect('/espace/candidature/nouvelle')

  const c = candidatures[0]
  const statut = c.statut ?? 'Brouillon'

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Ma candidature</h1>
        <p className="page-subtitle">Appel à projets {APPEL_ANNEE}</p>
      </div>

      {statut === 'Soumise' && (
        <div className="rounded-lg bg-green-100 border border-green-200 px-4 py-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          Votre candidature a bien été transmise.
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
          <CardTitle className="text-base leading-snug">{c.titre}</CardTitle>
          <span className={`shrink-0 rounded-full px-3.5 py-1 text-sm font-medium ${STATUT_COLORS[statut]}`}>
            {STATUT_LABELS[statut]}
          </span>
        </CardHeader>
        {statut === 'Brouillon' && (
          <CardContent className="pb-0">
            <a href="/espace/candidature/nouvelle" className="btn-primary inline-flex">
              Continuer ma candidature
            </a>
          </CardContent>
        )}
        <CardContent className="space-y-4 text-sm">

          <Field label={FIELD_LABELS.thematique} value={c.thematique} />
          <Field label="Résumé" value={c.resume} multiline />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Budget demandé" value={c.budgetDemande ? `${c.budgetDemande.toLocaleString('fr-FR')} €` : '—'} />
            <Field label="Durée" value={`${c.dureeMois} mois`} />
          </div>

          {c.partenaires && <Field label="Partenaires" value={c.partenaires} multiline />}
          <Field label="Description" value={c.description} multiline />

        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={multiline ? 'whitespace-pre-wrap text-foreground' : 'text-foreground'}>{value}</p>
    </div>
  )
}
