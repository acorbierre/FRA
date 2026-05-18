import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { getChercheurByEmail, getCandidaturesByChercheur } from '@/services/neon'
import Sidebar from '@/components/layout/sidebar'
import AppTopbar from '@/components/layout/app-topbar'

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let prenom = 'vous'
  let hasCandidature = false

  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (email) {
      const chercheur = await getChercheurByEmail(email)
      if (chercheur && chercheur.laboratoireDeclaratif) {
        prenom = chercheur.prenom
        const candidatures = await getCandidaturesByChercheur(chercheur.id)
        hasCandidature = candidatures.length > 0
      } else {
        redirect('/espace/profil/completer')
      }
    }
  } catch (e) {
    if (isRedirectError(e)) throw e
  }

  return (
    <>
      <Sidebar hasCandidature={hasCandidature} />
      <AppTopbar title="Espace candidat" />
      <main className="ml-60 mt-16 bg-muted/40 min-h-screen p-8">
        {children}
      </main>
    </>
  )
}
