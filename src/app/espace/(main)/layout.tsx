import type { Metadata } from 'next'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUtilisateurByEmail, getCandidaturesByUtilisateur } from '@/services/neon'
import Sidebar from '@/components/layout/sidebar'
import AppTopbar from '@/components/layout/app-topbar'

export const metadata: Metadata = { title: 'Espace candidat — FRA' }

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const utilisateur = email ? await getUtilisateurByEmail(email) : null

  if (utilisateur?.role?.some(r => r === 'Admin' || r === 'Super-Admin')) redirect('/gestion')
  if (utilisateur?.role?.some(r => r === 'Examinateur')) redirect('/reviewer')
  if (!utilisateur || !utilisateur.laboratoireDeclaratif) redirect('/espace/profil/completer')

  const candidatures = await getCandidaturesByUtilisateur(utilisateur.id)

  const hasCandidature = candidatures.length > 0
  const photoUrl = utilisateur.photo?.[0]?.url

  return (
    <>
      <Sidebar hasCandidature={hasCandidature} photoUrl={photoUrl} />
      <AppTopbar title="Espace candidat" />
      <main className="ml-60 mt-16 bg-muted/40 min-h-screen p-8">
        {children}
      </main>
    </>
  )
}
