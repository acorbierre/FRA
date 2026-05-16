import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getChercheurByEmail } from '@/services/neon/chercheurs'

export default async function Home() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const chercheur = email ? await getChercheurByEmail(email) : null
  const isAdmin = chercheur?.role.some(r => r === 'Admin' || r === 'Super-Admin')

  redirect(isAdmin ? '/gestion' : '/espace')
}
