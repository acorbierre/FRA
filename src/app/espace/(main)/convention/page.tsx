import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUtilisateurByEmail, getCandidaturesByUtilisateur } from '@/services/neon'
import { getConventionByCandidatureId } from '@/services/neon/conventions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const PIECES = [
  'RIB de l\'établissement',
  'Convention signée (à retourner à la FRA)',
  'Accord de l\'établissement de rattachement',
  'CV scientifique du porteur de projet',
  'Budget prévisionnel détaillé',
  'Attestation d\'assurance responsabilité civile',
]

export default async function ConventionEspacePage() {
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

  const convention = await getConventionByCandidatureId(candidature.id)
  if (!convention) redirect('/espace')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/espace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="size-4" /> Tableau de bord
        </Link>
        <h1 className="page-title">Ma convention</h1>
      </div>

      {/* Statut */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <FileText className="size-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">{convention.numeroConvention}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Convention de financement — FRA</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full px-3.5 py-1 text-sm font-medium bg-blue-50 text-blue-700">
            En cours de rédaction
          </span>
        </CardHeader>
        <CardContent className="text-sm space-y-3 pt-0">
          <p className="text-muted-foreground leading-relaxed">
            Votre convention est en cours de rédaction par la FRA. Vous recevrez un email dès qu&apos;elle sera prête à être signée.
          </p>
          {(convention.dateSignature) && (
            <p className="text-sm">
              <span className="text-muted-foreground">Date de signature : </span>
              <span className="font-medium">{fmtDate(convention.dateSignature)}</span>
            </p>
          )}
          {convention.montantTotal && (
            <p className="text-sm">
              <span className="text-muted-foreground">Montant total : </span>
              <span className="font-medium tabular-nums">{convention.montantTotal.toLocaleString('fr-FR')} €</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pièces à fournir */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Pièces à fournir</h2>
        <p className="text-sm text-muted-foreground">Préparez dès maintenant les documents suivants qui vous seront demandés lors de la signature.</p>
        <div className="rounded-xl border border-border divide-y divide-border text-sm">
          {PIECES.map(piece => (
            <div key={piece} className="flex items-center gap-3 px-4 py-3">
              <div className="size-4 rounded border border-border shrink-0" />
              <span>{piece}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
