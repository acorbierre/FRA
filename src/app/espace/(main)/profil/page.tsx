import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUtilisateurByEmail } from '@/services/neon'
import ProfileEditor from './profile-editor'

export default async function ProfilPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const utilisateur = email ? await getUtilisateurByEmail(email) : null
  if (!utilisateur || !utilisateur.laboratoireDeclaratif) redirect('/espace/profil/completer')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Mon profil</h1>
        <p className="text-muted-foreground mt-1">
          Vos informations personnelles et professionnelles.
        </p>
      </div>
      <ProfileEditor utilisateur={utilisateur} />
    </div>
  )
}
