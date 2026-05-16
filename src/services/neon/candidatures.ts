import { z } from 'zod'
import { sql } from '@/lib/db'
import { dbDateOpt } from './schema-helpers'
import type { Candidature } from '@/types'

const CandidatureSchema = z.object({
  id:               z.string(),
  titre:            z.string().nullish(),
  thematique:       z.string().nullish(),
  resume:           z.string().nullish(),
  description:      z.string().nullish(),
  budget_demande:   z.coerce.number().nullish(),
  duree_mois:       z.coerce.number().nullish(),
  partenaires:      z.string().nullish(),
  created_at:       dbDateOpt,
  date_soumission:  dbDateOpt,
  statut:           z.enum(['Brouillon', 'Soumise', 'Envoyée au CS', 'En évaluation', 'En délibération CS', 'Retenue', 'Refusée']).nullish(),
  chercheur_id:     z.string().nullish(),
  appel_a_projet_id: z.string().nullish(),
})

function mapRow(r: Record<string, unknown>): Candidature {
  const row = CandidatureSchema.parse(r)
  return {
    id:             row.id,
    titre:          row.titre ?? '',
    thematique:     row.thematique ?? '',
    resume:         row.resume ?? '',
    description:    row.description ?? '',
    budgetDemande:  row.budget_demande ?? 0,
    dureeMois:      row.duree_mois ?? 0,
    partenaires:    row.partenaires ?? undefined,
    dateCreation:   row.created_at ? new Date(row.created_at).toISOString() : undefined,
    dateSoumission: row.date_soumission ?? undefined,
    statut:         row.statut ?? 'Brouillon',
    chercheurId:    row.chercheur_id ?? undefined,
    appelAProjetId: row.appel_a_projet_id ?? undefined,
  }
}

export async function getCandidaturesByChercheur(chercheurId: string): Promise<Candidature[]> {
  const rows = await sql`SELECT * FROM candidatures WHERE chercheur_id = ${chercheurId}`
  return rows.map(mapRow)
}

export async function getCandidatureById(id: string): Promise<Candidature> {
  const rows = await sql`SELECT * FROM candidatures WHERE id = ${id}`
  if (!rows[0]) throw new Error(`Candidature ${id} not found`)
  return mapRow(rows[0])
}

export async function countCandidaturesRecues(): Promise<number> {
  const rows = await sql`SELECT COUNT(*)::int AS count FROM candidatures WHERE statut = 'Soumise'`
  return rows[0]?.count ?? 0
}

export async function getAllCandidatures(): Promise<Candidature[]> {
  const rows = await sql`SELECT * FROM candidatures ORDER BY created_at DESC`
  return rows.map(mapRow)
}

export async function createBrouillonCandidature(chercheurId: string): Promise<Candidature> {
  const id = crypto.randomUUID()
  const rows = await sql`
    INSERT INTO candidatures (id, statut, chercheur_id)
    VALUES (${id}, 'Brouillon', ${chercheurId})
    RETURNING *
  `
  return mapRow(rows[0])
}

export async function createCandidature(data: {
  titre: string
  thematique: string
  resume: string
  description: string
  budgetDemande: number
  dureeMois: number
  partenaires?: string
  chercheurId: string
  appelAProjetId?: string
}): Promise<Candidature> {
  const id = crypto.randomUUID()
  const rows = await sql`
    INSERT INTO candidatures (id, titre, thematique, resume, description, budget_demande, duree_mois, partenaires, statut, chercheur_id, appel_a_projet_id)
    VALUES (
      ${id}, ${data.titre}, ${data.thematique}, ${data.resume}, ${data.description},
      ${data.budgetDemande}, ${data.dureeMois}, ${data.partenaires ?? null},
      'Soumise', ${data.chercheurId},
      ${data.appelAProjetId ?? null}
    )
    RETURNING *
  `
  return mapRow(rows[0])
}

export async function deleteCandidature(id: string): Promise<void> {
  await sql`DELETE FROM candidatures WHERE id = ${id}`
}

export async function updateCandidature(
  id: string,
  data: Partial<Omit<Candidature, 'id'>>
): Promise<Candidature> {
  const rows = await sql`SELECT * FROM candidatures WHERE id = ${id}`
  if (!rows[0]) throw new Error(`Candidature ${id} not found`)
  const c = mapRow(rows[0])

  const updated = await sql`
    UPDATE candidatures SET
      titre          = ${data.titre          ?? c.titre},
      thematique     = ${data.thematique     ?? c.thematique},
      resume         = ${data.resume         ?? c.resume},
      description    = ${data.description    ?? c.description},
      budget_demande = ${data.budgetDemande  ?? c.budgetDemande},
      duree_mois     = ${data.dureeMois      ?? c.dureeMois},
      partenaires    = ${data.partenaires    ?? c.partenaires ?? null},
      statut         = ${data.statut         ?? c.statut},
      date_soumission= ${data.dateSoumission ?? c.dateSoumission ?? null}
    WHERE id = ${id}
    RETURNING *
  `
  return mapRow(updated[0])
}
