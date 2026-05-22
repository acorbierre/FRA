import { sql } from '@/lib/db'

async function getAccessToken(): Promise<string> {
  const rows = await sql`
    SELECT access_token, refresh_token, expires_at
    FROM microsoft_tokens
    WHERE user_id = 'admin'
    LIMIT 1
  `

  if (!rows.length) throw new Error('Aucun token Microsoft en base')

  const { access_token, refresh_token, expires_at } = rows[0]

  // Si le token est expiré, on le rafraîchit
  if (new Date(expires_at) < new Date()) {
    return refreshAccessToken(refresh_token)
  }

  return access_token
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: 'Calendars.ReadWrite offline_access',
  })

  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    }
  )

  const text = await res.text()
  if (!text) throw new Error('Refresh token échoué: réponse vide — re-authentification requise')
  const data = JSON.parse(text)
  if (!res.ok) throw new Error(`Refresh token échoué: ${JSON.stringify(data)} — re-authentification requise`)

  const expiresAt = new Date(Date.now() + data.expires_in * 1000)

  await sql`
    UPDATE microsoft_tokens SET
      access_token = ${data.access_token},
      refresh_token = ${data.refresh_token ?? refreshToken},
      expires_at = ${expiresAt},
      updated_at = NOW()
    WHERE user_id = 'admin'
  `

  return data.access_token
}

export async function createCalendarEvent({
  title,
  description,
  startDate,
  endDate,
  reminderMinutes = 1440, // 24h avant par défaut
}: {
  title: string
  description?: string
  startDate: Date
  endDate: Date
  reminderMinutes?: number
}) {
  const token = await getAccessToken()

  const event = {
    subject: title,
    body: {
      contentType: 'HTML',
      content: description ?? '',
    },
    start: {
      dateTime: startDate.toISOString(),
      timeZone: 'Europe/Paris',
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'Europe/Paris',
    },
    isReminderOn: true,
    reminderMinutesBeforeStart: reminderMinutes,
  }

  const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })

  const text = await res.text()
  console.log('[Graph] status:', res.status, 'body:', text)
  if (!text) throw new Error(`Erreur création événement: réponse vide (status ${res.status})`)
  const data = JSON.parse(text)
  if (!res.ok) throw new Error(`Erreur création événement: ${JSON.stringify(data)}`)

  return data
}

export async function deleteCalendarEvent(eventId: string) {
  const token = await getAccessToken()

  const res = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok && res.status !== 404) {
    throw new Error(`Erreur suppression événement: ${res.status}`)
  }
}
