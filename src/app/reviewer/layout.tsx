import type { Metadata } from 'next'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUtilisateurByEmail, getEvaluationsByReviewer, getCandidatureById } from '@/services/neon'
import ReviewerSidebar from '@/components/layout/reviewer-sidebar'
import AppTopbar from '@/components/layout/app-topbar'

export const metadata: Metadata = { title: 'Portail examinateur — Appels à projets' }

export default async function ReviewerLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  if (!email) redirect('/sign-in')
  const utilisateur = await getUtilisateurByEmail(email)
  if (!utilisateur?.role.includes('Examinateur')) redirect('/espace')

  const evaluations = await getEvaluationsByReviewer(utilisateur.id)
  const candidatures = (
    await Promise.all(evaluations.map(e => getCandidatureById(e.candidatureId).catch(() => null)))
  ).filter(Boolean) as { id: string; titre: string }[]

  return (
    <>
      <ReviewerSidebar candidatures={candidatures} photoUrl={utilisateur?.photo?.[0]?.url} />
      <AppTopbar title="Espace Comité Scientifique" />
      <main className="ml-60 mt-16 bg-muted/40 min-h-screen p-8">
        {children}
      </main>
    </>
  )
}
