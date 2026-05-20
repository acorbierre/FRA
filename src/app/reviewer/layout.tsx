import type { Metadata } from 'next'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getChercheurByEmail, getEvaluationsByReviewer, getCandidatureById } from '@/services/neon'
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
  const chercheur = await getChercheurByEmail(email)
  if (!chercheur?.role.includes('Examinateur')) redirect('/espace')

  const evaluations = await getEvaluationsByReviewer(chercheur.id)
  const candidatures = (
    await Promise.all(evaluations.map(e => getCandidatureById(e.candidatureId).catch(() => null)))
  ).filter(Boolean) as { id: string; titre: string }[]

  return (
    <>
      <ReviewerSidebar candidatures={candidatures} photoUrl={chercheur?.photo?.[0]?.url} />
      <AppTopbar title="Espace Comité Scientifique" />
      <main className="ml-60 mt-16 bg-muted/40 min-h-screen p-8">
        {children}
      </main>
    </>
  )
}
