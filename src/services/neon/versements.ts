import { z } from 'zod'
import { sql } from '@/lib/db'
import { dbDateOpt } from './schema-helpers'
import type { Versement } from '@/types'

const VersementSchema = z.object({
  id:            z.string(),
  reference:     z.string(),
  numero:        z.number(),
  montant:       z.coerce.number().nullish(),
  date_prevue:   dbDateOpt,
  date_realisee: dbDateOpt,
  statut:        z.enum(['Prévu', 'En attente rapport', 'Réalisé']).nullish(),
  convention_id: z.string().nullish(),
})

function mapRow(r: Record<string, unknown>): Versement {
  const row = VersementSchema.parse(r)
  return {
    id:           row.id,
    reference:    row.reference,
    numero:       row.numero,
    montant:      row.montant ?? 0,
    datePrevue:   row.date_prevue ?? undefined,
    dateRealisee: row.date_realisee ?? undefined,
    statut:       row.statut ?? 'Prévu',
    conventionId: row.convention_id ?? undefined,
  }
}

export async function getVersements(): Promise<Versement[]> {
  const rows = await sql`SELECT * FROM versements`
  return rows.map(mapRow)
}

export async function createVersement(data: {
  conventionId: string
  numero: number
  montant: number
  datePrevue: string
}): Promise<Versement> {
  const reference = `VIR-${Date.now()}-${data.numero}`
  const rows = await sql`
    INSERT INTO versements (id, reference, numero, montant, date_prevue, statut, convention_id)
    VALUES (gen_random_uuid(), ${reference}, ${data.numero}, ${data.montant}, ${data.datePrevue}, 'Prévu', ${data.conventionId})
    RETURNING *
  `
  return mapRow(rows[0])
}
