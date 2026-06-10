import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUtilisateurByEmail } from '@/services/neon/utilisateurs'

export default async function Home() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const utilisateur = email ? await getUtilisateurByEmail(email) : null
  const isAdmin    = utilisateur?.role.some(r => r === 'Admin' || r === 'Super-Admin')
  const isReviewer = utilisateur?.role.some(r => r === 'Examinateur')

  redirect(isAdmin ? '/gestion' : isReviewer ? '/reviewer' : '/espace')
}
