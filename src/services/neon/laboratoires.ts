import { z } from 'zod'
import { sql } from '@/lib/db'
import type { Laboratoire } from '@/types'

const LaboratoireSchema = z.object({
  id:          z.string(),
  nom:         z.string(),
  institution: z.string().nullish(),
  ville:       z.string().nullish(),
  site_web:    z.string().nullish(),
})

function mapRow(r: Record<string, unknown>): Laboratoire {
  const row = LaboratoireSchema.parse(r)
  const carteLabIdRaw = r.carte_lab_id
  return {
    id:          row.id,
    nom:         row.nom,
    institution: row.institution ?? '',
    ville:       row.ville ?? '',
    siteWeb:     row.site_web ?? undefined,
    carteLabId:  carteLabIdRaw != null ? String(carteLabIdRaw) : undefined,
  }
}

export async function getLaboratoires(): Promise<Laboratoire[]> {
  const rows = await sql`
    SELECT l.*, cl.id AS carte_lab_id
    FROM laboratoires l
    LEFT JOIN carte_laboratoires cl ON cl.labo_neon_id = l.id
    ORDER BY l.nom
  `
  return rows.map(mapRow)
}

export async function getLaboratoireById(id: string): Promise<Laboratoire> {
  const rows = await sql`SELECT * FROM laboratoires WHERE id = ${id}`
  if (!rows[0]) throw new Error(`Laboratoire ${id} not found`)
  return mapRow(rows[0])
}
