import { sql } from '@/lib/db'

export interface Notification {
  id: string
  type: string
  message: string
  candidatureId: string | null
  avatarUrl: string | null
  read: boolean
  createdAt: string
}

export async function createNotification(
  type: string,
  message: string,
  candidatureId?: string,
  avatarUrl?: string,
): Promise<void> {
  await sql`INSERT INTO notifications (type, message, candidature_id, avatar_url) VALUES (${type}, ${message}, ${candidatureId ?? null}, ${avatarUrl ?? null})`
}

export async function getNotifications(): Promise<Notification[]> {
  const rows = await sql`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 30`
  return rows.map((r: any) => ({
    id:             r.id,
    type:           r.type,
    message:        r.message,
    candidatureId:  r.candidature_id ?? null,
    avatarUrl:      r.avatar_url ?? null,
    read:           r.read,
    createdAt:      r.created_at,
  }))
}

export async function markNotificationsRead(): Promise<void> {
  await sql`UPDATE notifications SET read = true WHERE read = false`
}
