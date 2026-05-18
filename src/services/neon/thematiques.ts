import { cache } from 'react'
import { sql } from '@/lib/db'

export type Thematique = {
  id: number
  label: string
  ordre: number
}

export const getThematiques = cache(async (): Promise<Thematique[]> => {
  const rows = await sql`SELECT id, label, ordre FROM thematiques ORDER BY ordre, id`
  return rows.map(r => ({ id: Number(r.id), label: String(r.label), ordre: Number(r.ordre) }))
})

export async function createThematique(label: string): Promise<void> {
  const rows = await sql`SELECT COALESCE(MAX(ordre), -1) + 1 AS next_ordre FROM thematiques`
  const ordre = Number(rows[0].next_ordre)
  await sql`INSERT INTO thematiques (label, ordre) VALUES (${label.trim()}, ${ordre})`
}

export async function deleteThematique(id: number): Promise<void> {
  await sql`DELETE FROM thematiques WHERE id = ${id}`
}

export async function updateThematiqueLabel(id: number, label: string): Promise<void> {
  await sql`UPDATE thematiques SET label = ${label.trim()} WHERE id = ${id}`
}
