import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createChercheur, getChercheurByEmail } from '@/services/neon'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress

    if (!email) {
      return NextResponse.json({ error: 'Email introuvable.' }, { status: 400 })
    }

    // Prevent duplicate profile
    const existing = await getChercheurByEmail(email)
    if (existing) {
      return NextResponse.json({ chercheurId: existing.id })
    }

    const { prenom, nom, telephone, laboratoire, bio } = await request.json()

    const chercheur = await createChercheur({
      prenom: prenom.trim(),
      nom: nom.trim(),
      email,
      telephone: telephone?.trim(),
      bio: bio?.trim(),
      laboratoire: laboratoire?.trim(),
    })

    return NextResponse.json({ chercheurId: chercheur.id }, { status: 201 })
  } catch (err) {
    console.error('[complete-profile]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
