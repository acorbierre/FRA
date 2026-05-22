import { NextResponse } from 'next/server'
import { createCalendarEvent } from '@/lib/microsoft-calendar'

export async function GET() {
  const start = new Date()
  start.setDate(start.getDate() + 1) // demain
  start.setHours(10, 0, 0, 0)

  const end = new Date(start)
  end.setHours(10, 30, 0, 0)

  const event = await createCalendarEvent({
    title: '🔔 Test FRA — Rappel rapport d\'étape',
    description: 'Ceci est un événement de test créé depuis le POC FRA.',
    startDate: start,
    endDate: end,
    reminderMinutes: 60,
  })

  return NextResponse.json({ ok: true, eventId: event.id, webLink: event.webLink })
}
