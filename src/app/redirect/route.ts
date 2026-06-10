import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getUtilisateurByEmail } from '@/services/neon/utilisateurs'

export async function GET(request: Request) {
  const base = new URL(request.url).origin
  const { userId } = await auth()
  if (!userId) return NextResponse.redirect(`${base}/sign-in`)

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const utilisateur = email ? await getUtilisateurByEmail(email) : null
  if (!utilisateur) return NextResponse.redirect(`${base}/espace/profil/completer`)
  if (utilisateur.role.includes('Admin') || utilisateur.role.includes('Super-Admin')) return NextResponse.redirect(`${base}/gestion`)
  if (utilisateur.role.includes('Examinateur')) return NextResponse.redirect(`${base}/reviewer`)
  return NextResponse.redirect(`${base}/espace`)
}
