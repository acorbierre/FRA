import { assertAdmin } from '@/lib/assert-admin'
import { NextResponse } from 'next/server'
import { assignReviewers, updateCandidature } from '@/services/neon'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { reviewerIds } = await req.json()

  if (!Array.isArray(reviewerIds) || reviewerIds.length === 0 || reviewerIds.length > 2) {
    return NextResponse.json({ error: '1 ou 2 reviewers requis' }, { status: 400 })
  }

  try {
    await assignReviewers(id, reviewerIds)
    await updateCandidature(id, { statut: 'Envoyée au CS' })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
