import { NextRequest, NextResponse } from 'next/server'
import { createInviteToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  }

  const token = await createInviteToken(email.toLowerCase().trim())
  const url   = `${process.env.NEXT_PUBLIC_APP_URL}/rejoindre/${token}`

  return NextResponse.json({ url })
}
