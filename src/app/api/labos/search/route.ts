import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ville = searchParams.get('ville')?.trim()
  const q     = searchParams.get('q')?.trim()

  if (!q || q.length < 2) return NextResponse.json([])

  const rows = ville && ville.length > 1
    ? await sql`
        SELECT id, nom, ville
        FROM carte_laboratoires
        WHERE ville ILIKE ${`%${ville}%`}
          AND nom ILIKE ${`%${q}%`}
        ORDER BY alz_pub_count DESC NULLS LAST
        LIMIT 10
      `
    : await sql`
        SELECT id, nom, ville
        FROM carte_laboratoires
        WHERE nom ILIKE ${`%${q}%`}
        ORDER BY alz_pub_count DESC NULLS LAST
        LIMIT 10
      `

  return NextResponse.json(rows)
}
