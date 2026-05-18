import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getChercheurByEmail, getCandidaturesByChercheur, createBrouillonCandidature } from '@/services/neon'
import { getThematiques } from '@/services/neon/thematiques'
import CandidatureForm from './candidature-form'

export default async function NouvelleCandidaturePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const chercheur = email ? await getChercheurByEmail(email) : null
  if (!chercheur) redirect('/espace/profil/completer')
  const chercheurId = chercheur.id
  const nomComplet = chercheur.nomComplet

  const [candidatures, thematiques] = await Promise.all([
    getCandidaturesByChercheur(chercheurId),
    getThematiques(),
  ])

  // Déjà une candidature active (non-brouillon) → pas de nouvelle candidature
  const active = candidatures.find(c => c.statut !== 'Brouillon')
  if (active) redirect('/espace/candidature')

  // Brouillon existant → reprendre
  const brouillon = candidatures.find(c => c.statut === 'Brouillon')
  if (brouillon) {
    return <CandidatureForm candidatureId={brouillon.id} defaultValues={brouillon} thematiques={thematiques} />
  }

  // Aucun brouillon → en créer un
  const draft = await createBrouillonCandidature(chercheurId)
  return <CandidatureForm candidatureId={draft.id} thematiques={thematiques} />
}
