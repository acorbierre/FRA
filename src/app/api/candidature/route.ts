import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getChercheurByEmail, createCandidature } from '@/services/neon'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress
    const chercheur = email ? await getChercheurByEmail(email) : null
    if (!chercheur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    const chercheurId = chercheur.id

    const body = await req.json()
    const { titre, thematiqueId, resume, description, budgetDemande, dureeMois, partenaires } = body

    if (!titre || !thematiqueId || !resume || !description || !budgetDemande || !dureeMois) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    const candidature = await createCandidature({
      titre,
      thematiqueId: Number(thematiqueId),
      resume,
      description,
      budgetDemande: Number(budgetDemande),
      dureeMois: Number(dureeMois),
      partenaires: partenaires || undefined,
      chercheurId,
    })

    return NextResponse.json(candidature)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/candidature]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
