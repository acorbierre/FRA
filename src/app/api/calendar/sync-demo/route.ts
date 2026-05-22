import { NextResponse } from 'next/server'
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/microsoft-calendar'
import { sql } from '@/lib/db'

const DEMO_JALON_ID = 'demo-jalon-dupont'

export async function POST() {
  // Supprimer l'ancien event Outlook si existant
  const rows = await sql`SELECT calendar_event_id FROM jalons WHERE id = ${DEMO_JALON_ID}`
  const oldEventId = rows[0]?.calendar_event_id
  if (oldEventId) await deleteCalendarEvent(oldEventId)

  const start = new Date(Date.now() + 16 * 60 * 1000)
  const end = new Date(start.getTime() + 30 * 60 * 1000)

  const event = await createCalendarEvent({
    title: '🔬 Rappel Rapport d\'étape Laboratoire Dupont',
    description: 'Rappel automatique généré depuis le Calendrier Financier FRA.',
    startDate: start,
    endDate: end,
    reminderMinutes: 15,
  })

  await sql`UPDATE jalons SET calendar_event_id = ${event.id} WHERE id = ${DEMO_JALON_ID}`

  return NextResponse.json({ ok: true, eventId: event.id })
}
