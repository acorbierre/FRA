import { z } from 'zod'
import { sql } from '@/lib/db'
import { dbDateOpt } from './schema-helpers'
import type { Projet } from '@/types'

const ProjetSchema = z.object({
  id:                       z.string(),
  titre:                    z.string(),
  date_debut:               dbDateOpt,
  date_fin_prevue:          dbDateOpt,
  date_fin_reelle:          dbDateOpt,
  montant_accorde:          z.coerce.number().nullish(),
  dimension_internationale: z.boolean().nullish(),
  detail_partenariats:      z.string().nullish(),
  statut:                   z.enum(['En cours', 'Suspendu', 'Terminé']).nullish(),
  candidature_id:           z.string().nullish(),
  photo:                    z.array(z.object({ url: z.string() })).nullish(),
  titre_court:              z.string().nullish(),
})

function mapRow(r: Record<string, unknown>): Projet {
  const row = ProjetSchema.parse(r)
  return {
    id:                      row.id,
    titre:                   row.titre,
    dateDebut:               row.date_debut ?? undefined,
    dateFinPrevue:           row.date_fin_prevue ?? undefined,
    dateFinReelle:           row.date_fin_reelle ?? undefined,
    montantAccorde:          row.montant_accorde ?? 0,
    dimensionInternationale: row.dimension_internationale ?? false,
    detailPartenariats:      row.detail_partenariats ?? undefined,
    statut:                  row.statut ?? 'En cours',
    candidatureId:           row.candidature_id ?? undefined,
    photo:                   row.photo ?? undefined,
    titreCourt:              row.titre_court ?? undefined,
  }
}

export async function getProjets(): Promise<Projet[]> {
  const rows = await sql`SELECT * FROM projets`
  return rows.map(mapRow)
}

export async function getProjetById(id: string): Promise<Projet> {
  const rows = await sql`SELECT * FROM projets WHERE id = ${id}`
  if (!rows[0]) throw new Error(`Projet ${id} not found`)
  return mapRow(rows[0])
}

export async function updateProjetPhoto(id: string, photoUrl: string): Promise<void> {
  await sql`UPDATE projets SET photo = ${JSON.stringify([{ url: photoUrl }])}::jsonb WHERE id = ${id}`
}

export async function updateProjetStatut(id: string, statut: Projet['statut']): Promise<Projet> {
  const rows = await sql`UPDATE projets SET statut = ${statut} WHERE id = ${id} RETURNING *`
  return mapRow(rows[0])
}

export async function updateProjetTitreCourt(id: string, titreCourt: string): Promise<void> {
  await sql`UPDATE projets SET titre_court = ${titreCourt} WHERE id = ${id}`
}

export async function deleteProjet(id: string): Promise<void> {
  await sql`DELETE FROM projets WHERE id = ${id}`
}
