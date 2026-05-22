import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'No code' }, { status: 400 })

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    code,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`,
    grant_type: 'authorization_code',
  })

  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    }
  )

  const data = await res.json()

  if (!res.ok) {
    console.error('[Microsoft OAuth] Erreur token:', data)
    return NextResponse.json({ error: data }, { status: 400 })
  }

  const expiresAt = new Date(Date.now() + data.expires_in * 1000)
  console.log('[OAuth callback] expires_in:', data.expires_in, 'expiresAt:', expiresAt)
  console.log('[OAuth callback] has refresh_token:', !!data.refresh_token)

  await sql`
    INSERT INTO microsoft_tokens (user_id, access_token, refresh_token, expires_at, updated_at)
    VALUES ('admin', ${data.access_token}, ${data.refresh_token ?? null}, ${expiresAt}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
  `

  console.log('[OAuth callback] Token saved in DB')
  return NextResponse.json({ ok: true, message: 'Authentification Microsoft réussie !' })
}
