import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getChercheurByEmail, updateChercheur } from '@/services/neon'

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) return NextResponse.json({ error: 'Email introuvable.' }, { status: 400 })
    const chercheur = await getChercheurByEmail(email)
    if (!chercheur) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 })

    const { prenom, nom, telephone, laboratoire, bio } = await request.json()

    const updated = await updateChercheur(chercheur.id, { prenom, nom, telephone, bio, laboratoire })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[profil PATCH]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
