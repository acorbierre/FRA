import type { Metadata } from 'next'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUtilisateurByEmail } from '@/services/neon/utilisateurs'
import GestionSidebar from '@/components/layout/gestion-sidebar'
import AppTopbar from '@/components/layout/app-topbar'
import { ChatProvider } from '@/components/layout/chat-provider'
import { countCandidaturesRecues } from '@/services/neon/candidatures'

export const metadata: Metadata = { title: 'Espace gestion — Appels à projets' }

export default async function GestionLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const utilisateur = email ? await getUtilisateurByEmail(email) : null

  const isAdmin = utilisateur?.role.includes('Admin') || utilisateur?.role.includes('Super-Admin')
  if (!isAdmin) redirect('/espace')

  const nbRecues = await countCandidaturesRecues()

  return (
    <ChatProvider>
      <GestionSidebar nbCandidaturesRecues={nbRecues} photoUrl={utilisateur?.photo?.[0]?.url} />
      <AppTopbar title="Espace de gestion" showBell />
      <main className="ml-60 mt-16 bg-[#fbfbfb] min-h-screen px-8 pt-5 pb-8">
        {children}
      </main>
    </ChatProvider>
  )
}
