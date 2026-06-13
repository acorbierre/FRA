import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { updateCandidature } from '@/services/neon'
import { createNotification } from '@/services/neon/notifications'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  try {
    const updated = await updateCandidature(id, body)
    if (body.statut === 'Soumise') {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      await createNotification(
        'candidature_soumise',
        `Nouvelle candidature reçue${updated.titre ? ` — ${updated.titre}` : ''}`,
        id,
        clerkUser.hasImage ? clerkUser.imageUrl : undefined,
      )
    }
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
