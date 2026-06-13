import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { put } from '@vercel/blob'
import { getUtilisateurByEmail, updateUtilisateurPhoto } from '@/services/neon'

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) return NextResponse.json({ error: 'Email introuvable.' }, { status: 400 })
    const utilisateur = await getUtilisateurByEmail(email)
    if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable.' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Image invalide.' }, { status: 400 })
    }

    const blob = await put(`avatars/${utilisateur.id}.jpg`, file, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: true,
    })

    await updateUtilisateurPhoto(utilisateur.id, blob.url)
    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error('[photo PATCH]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
