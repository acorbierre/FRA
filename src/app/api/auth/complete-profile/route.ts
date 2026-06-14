import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createUtilisateur, getUtilisateurByEmail, updateUtilisateur } from '@/services/neon'

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

    const { prenom, nom, telephone, laboratoire, bio, carteLabId } = await request.json()

    const existing = await getUtilisateurByEmail(email)
    if (existing) {
      // User pre-created by admin — update with completed profile
      await updateUtilisateur(existing.id, {
        prenom: prenom.trim(),
        nom: nom.trim(),
        telephone: telephone?.trim(),
        laboratoire: laboratoire?.trim(),
        bio: bio?.trim(),
        carteLabId: carteLabId ?? null,
      })
      return NextResponse.json({ utilisateurId: existing.id })
    }

    const utilisateur = await createUtilisateur({
      prenom: prenom.trim(),
      nom: nom.trim(),
      email,
      telephone: telephone?.trim(),
      bio: bio?.trim(),
      laboratoire: laboratoire?.trim(),
      carteLabId: carteLabId ?? null,
    })

    return NextResponse.json({ utilisateurId: utilisateur.id }, { status: 201 })
  } catch (err) {
    console.error('[complete-profile]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
