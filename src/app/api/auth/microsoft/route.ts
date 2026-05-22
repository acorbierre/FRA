import { NextResponse } from 'next/server'

const SCOPES = ['Calendars.ReadWrite', 'offline_access']

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`,
    scope: SCOPES.join(' '),
    response_mode: 'query',
  })

  const authUrl = `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params}`

  return NextResponse.redirect(authUrl)
}
