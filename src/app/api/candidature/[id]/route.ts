import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { updateCandidature } from '@/services/neon'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  try {
    const updated = await updateCandidature(id, body)
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
