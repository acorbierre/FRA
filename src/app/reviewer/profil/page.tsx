import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getChercheurByEmail } from '@/services/neon'
import ProfileEditor from '@/app/espace/(main)/profil/profile-editor'

export default async function ReviewerProfilPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const chercheur = email ? await getChercheurByEmail(email) : null
  if (!chercheur) redirect('/sign-in')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Mon profil</h1>
        <p className="page-subtitle">Vos informations personnelles et professionnelles.</p>
      </div>
      <ProfileEditor chercheur={chercheur} />
    </div>
  )
}
