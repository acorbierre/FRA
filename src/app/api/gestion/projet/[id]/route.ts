import { assertAdmin } from '@/lib/assert-admin'
import { NextResponse } from 'next/server'
import { updateProjetStatut, deleteProjet, getChercheurByEmail } from '@/services/neon'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { statut } = await req.json()
  try {
    const updated = await updateProjetStatut(id, statut)
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    await deleteProjet(id)
    return NextResponse.json({ deleted: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
