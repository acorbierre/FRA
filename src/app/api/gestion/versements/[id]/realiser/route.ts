import { sql } from '@/lib/db'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const today = new Date().toISOString().slice(0, 10)

  await sql`
    UPDATE versements
    SET statut = 'Réalisé', date_realisee = ${today}
    WHERE id = ${id}
  `

  return Response.json({ ok: true })
}
