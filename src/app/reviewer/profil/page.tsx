import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUtilisateurByEmail } from '@/services/neon'
import ProfileEditor from '@/app/espace/(main)/profil/profile-editor'
import { PageHeader } from '@/components/ui/page-header'
import { PageContainer } from '@/components/ui/page-container'

export default async function ReviewerProfilPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const utilisateur = email ? await getUtilisateurByEmail(email) : null
  if (!utilisateur) redirect('/sign-in')

  return (
    <PageContainer className="max-w-3xl space-y-6">
      <PageHeader title="Mon profil" subtitle="Vos informations personnelles et professionnelles." />
      <ProfileEditor utilisateur={utilisateur} />
    </PageContainer>
  )
}
