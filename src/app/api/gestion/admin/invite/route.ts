import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

const REDIRECT_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/sign-up`
  : 'http://localhost:3000/sign-up'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { emails } = await req.json() as { emails: string[] }
    if (!emails?.length) return NextResponse.json({ error: 'Aucun email fourni' }, { status: 400 })

    const client = await clerkClient()
    const results = await Promise.allSettled(
      emails.map(email =>
        client.invitations.createInvitation({
          emailAddress: email,
          redirectUrl: REDIRECT_URL,
          ignoreExisting: true,
        })
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').map((r, i) => ({
      email: emails[i],
      error: r.status === 'rejected' ? String((r as PromiseRejectedResult).reason) : '',
    }))

    return NextResponse.json({ sent, failed })
  } catch (err) {
    console.error('[admin invite]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
