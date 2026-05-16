import { NextRequest, NextResponse } from 'next/server'
import { verifyInviteToken, createSessionToken, SESSION_COOKIE } from '@/lib/auth'
import { createChercheur, getChercheurByEmail } from '@/services/neon'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, prenom, nom, telephone, laboratoire, bio } = body

    // Validate invite token
    let email: string
    try {
      const payload = await verifyInviteToken(token)
      email = payload.email
    } catch {
      return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 401 })
    }

    // Prevent duplicate registration
    const existing = await getChercheurByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'Un compte existe déjà pour cet email.' }, { status: 409 })
    }

    // Create chercheur in Neon
    const chercheur = await createChercheur({
      prenom: prenom.trim(),
      nom: nom.trim(),
      email,
      telephone: telephone?.trim(),
      bio: bio?.trim(),
      laboratoire: laboratoire?.trim(),
    })

    // Create session cookie
    const sessionToken = await createSessionToken(chercheur.id)

    const response = NextResponse.json({ chercheurId: chercheur.id }, { status: 201 })
    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
