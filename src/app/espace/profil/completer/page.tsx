import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUtilisateurByEmail } from '@/services/neon'
import CompleterProfilForm from './completer-form'

export default async function CompleterProfilPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const utilisateur = email ? await getUtilisateurByEmail(email) : null

  // Already complete — redirect to app
  if (utilisateur?.laboratoireDeclaratif) redirect('/espace')

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h1 className="page-title">Bienvenue</h1>
          <p className="page-subtitle">Complétez votre profil pour accéder à votre espace candidat.</p>
        </div>
        <CompleterProfilForm prenom={utilisateur?.prenom} nom={utilisateur?.nom} />
      </div>
    </main>
  )
}
