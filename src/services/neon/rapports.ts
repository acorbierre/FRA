import { z } from 'zod'
import { sql } from '@/lib/db'
import { dbDateOpt } from './schema-helpers'
import type { Rapport } from '@/types'

const RapportSchema = z.object({
  id:              z.string(),
  reference:       z.string(),
  type:            z.enum(["Rapport d'étape", 'Rapport final scientifique', 'Rapport final financier']),
  date_attendue:   dbDateOpt,
  date_soumission: dbDateOpt,
  date_reception:  dbDateOpt,
  statut:          z.enum(['Attendu', 'Soumis', 'Reçu', 'Validé']).nullish(),
  fichier:         z.array(z.object({ url: z.string(), filename: z.string() })).nullish(),
  notes:           z.string().nullish(),
  en_retard:       z.string().nullish(),
  projet_id:       z.string().nullish(),
  versement_id:    z.string().nullish(),
})

function mapRow(r: Record<string, unknown>): Rapport {
  const row = RapportSchema.parse(r)
  return {
    id:             row.id,
    reference:      row.reference,
    type:           row.type,
    dateAttendue:   row.date_attendue ?? undefined,
    dateSoumission: row.date_soumission ?? undefined,
    dateReception:  row.date_reception ?? undefined,
    statut:         row.statut ?? 'Attendu',
    fichier:        row.fichier ?? undefined,
    notes:          row.notes ?? undefined,
    enRetard:       row.en_retard ?? undefined,
    projetId:       row.projet_id ?? undefined,
    versementId:    row.versement_id ?? undefined,
  }
}

export async function getRapports(): Promise<Rapport[]> {
  const rows = await sql`SELECT * FROM rapports`
  return rows.map(mapRow)
}

export async function getRapportsAttendus(): Promise<Rapport[]> {
  const rows = await sql`SELECT * FROM rapports WHERE statut = 'Attendu'`
  return rows.map(mapRow)
}

export async function updateRapportStatut(id: string, statut: Rapport['statut']): Promise<Rapport> {
  const rows = await sql`UPDATE rapports SET statut = ${statut} WHERE id = ${id} RETURNING *`
  return mapRow(rows[0])
}
