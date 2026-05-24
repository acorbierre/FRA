import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/assert-admin'
import { sql } from '@/lib/db'

export async function GET() {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await sql`SELECT id, keyword FROM carte_keyword_config ORDER BY created_at ASC`
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { keyword } = await req.json()
  if (!keyword?.trim()) return NextResponse.json({ error: 'Keyword requis' }, { status: 400 })
  const [row] = await sql`
    INSERT INTO carte_keyword_config (keyword) VALUES (${keyword.trim().toLowerCase()})
    ON CONFLICT (keyword) DO NOTHING
    RETURNING id, keyword
  `
  return NextResponse.json(row ?? { error: 'Déjà existant' })
}

export async function DELETE(req: Request) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await sql`DELETE FROM carte_keyword_config WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
