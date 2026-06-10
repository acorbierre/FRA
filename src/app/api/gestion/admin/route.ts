import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createUtilisateur, getUtilisateurByEmail } from '@/services/neon/utilisateurs'

// POST /api/gestion/admin — créer un utilisateur dans Neon
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { prenom, nom, email, role } = await req.json()
    if (!prenom || !nom || !email || !role) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    const existing = await getUtilisateurByEmail(email)
    if (existing) return NextResponse.json({ error: 'Email déjà enregistré' }, { status: 409 })

    const utilisateur = await createUtilisateur({ prenom: prenom.trim(), nom: nom.trim(), email: email.trim().toLowerCase(), role })
    return NextResponse.json(utilisateur, { status: 201 })
  } catch (err) {
    console.error('[admin POST]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/gestion/admin/invite — envoyer invitation(s) Clerk
