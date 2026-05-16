import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/assert-admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { dataUrl } = await req.json()
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Image invalide.' }, { status: 400 })
  }
  try {
    await updateProjetPhoto(id, dataUrl)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
