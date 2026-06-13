import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getNotifications, markNotificationsRead } from '@/services/neon/notifications'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const notifications = await getNotifications()
  return NextResponse.json(notifications)
}

export async function PATCH() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  await markNotificationsRead()
  return NextResponse.json({ ok: true })
}
