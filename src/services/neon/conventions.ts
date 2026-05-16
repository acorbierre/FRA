import { z } from 'zod'
import { sql } from '@/lib/db'
import { dbDateOpt } from './schema-helpers'
import type { Convention } from '@/types'

const ConventionSchema = z.object({
  id:               z.string(),
  numero_convention: z.string(),
  date_signature:   dbDateOpt,
  montant_total:    z.coerce.number().nullish(),
  statut:           z.enum(['En cours', 'Terminée', 'Résiliée']).nullish(),
  projet_id:        z.string().nullish(),
})

function mapRow(r: Record<string, unknown>): Convention {
  const row = ConventionSchema.parse(r)
  return {
    id:               row.id,
    numeroConvention: row.numero_convention,
    dateSignature:    row.date_signature ?? undefined,
    montantTotal:     row.montant_total ?? 0,
    statut:           row.statut ?? 'En cours',
    projetId:         row.projet_id ?? undefined,
  }
}

export async function getConventions(): Promise<Convention[]> {
  const rows = await sql`SELECT * FROM conventions`
  return rows.map(mapRow)
}

export async function updateConventionStatut(id: string, statut: Convention['statut']): Promise<Convention> {
  const rows = await sql`UPDATE conventions SET statut = ${statut} WHERE id = ${id} RETURNING *`
  return mapRow(rows[0])
}
