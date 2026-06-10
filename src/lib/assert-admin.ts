import { auth, clerkClient } from '@clerk/nextjs/server'
import { getUtilisateurByEmail } from '@/services/neon/utilisateurs'

export async function assertAdmin(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const email = user.emailAddresses[0]?.emailAddress
  if (!email) return false
  const utilisateur = await getUtilisateurByEmail(email)
  return !!utilisateur?.role.some(r => r === 'Admin' || r === 'Super-Admin')
}
