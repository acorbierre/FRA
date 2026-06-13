import { z } from 'zod'
import { sql } from '@/lib/db'
import { dbDateOpt } from './schema-helpers'
import type { Candidature } from '@/types'

const CandidatureSchema = z.object({
  id:               z.string(),
  titre:            z.string().nullish(),
  thematique_id:    z.coerce.number().nullish(),
  thematique_label: z.string().nullish(),
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

const SELECT_WITH_THEMATIQUE = sql`
  SELECT c.*, t.label AS thematique_label
  FROM candidatures c
  LEFT JOIN thematiques t ON c.thematique_id = t.id
`

function mapRow(r: Record<string, unknown>): Candidature {
  const row = CandidatureSchema.parse(r)
  return {
    id:             row.id,
    titre:          row.titre ?? '',
    thematique:     row.thematique_label ?? '',
    thematiqueId:   row.thematique_id ?? undefined,
    resume:         row.resume ?? '',
    description:    row.description ?? '',
    budgetDemande:  row.budget_demande ?? 0,
    dureeMois:      row.duree_mois ?? 0,
    partenaires:    row.partenaires ?? undefined,
    dateCreation:   row.created_at ? new Date(row.created_at).toISOString() : undefined,
    dateSoumission: row.date_soumission ?? undefined,
    statut:         row.statut ?? 'Brouillon',
    utilisateurId:  row.chercheur_id ?? undefined,
    appelAProjetId: row.appel_a_projet_id ?? undefined,
  }
}

export async function getCandidaturesByUtilisateur(utilisateurId: string): Promise<Candidature[]> {
  const rows = await sql`${SELECT_WITH_THEMATIQUE} WHERE c.chercheur_id = ${utilisateurId} ORDER BY c.created_at ASC`
  return rows.map(mapRow)
}

export async function getCandidatureById(id: string): Promise<Candidature> {
  const rows = await sql`${SELECT_WITH_THEMATIQUE} WHERE c.id = ${id}`
  if (!rows[0]) throw new Error(`Candidature ${id} not found`)
  return mapRow(rows[0])
}

export async function countCandidaturesRecues(): Promise<number> {
  const rows = await sql`SELECT COUNT(*)::int AS count FROM candidatures WHERE statut = 'Soumise'`
  return rows[0]?.count ?? 0
}

export async function getAllCandidatures(): Promise<Candidature[]> {
  const rows = await sql`${SELECT_WITH_THEMATIQUE} ORDER BY c.created_at DESC`
  return rows.map(mapRow)
}

export async function createBrouillonCandidature(utilisateurId: string): Promise<Candidature> {
  const id = crypto.randomUUID()
  await sql`INSERT INTO candidatures (id, statut, chercheur_id) VALUES (${id}, 'Brouillon', ${utilisateurId})`
  const rows = await sql`${SELECT_WITH_THEMATIQUE} WHERE c.id = ${id}`
  return mapRow(rows[0])
}

export async function createCandidature(data: {
  titre: string
  thematiqueId: number
  resume: string
  description: string
  budgetDemande: number
  dureeMois: number
  partenaires?: string
  utilisateurId: string
  appelAProjetId?: string
}): Promise<Candidature> {
  const id = crypto.randomUUID()
  await sql`
    INSERT INTO candidatures (id, titre, thematique_id, resume, description, budget_demande, duree_mois, partenaires, statut, chercheur_id, appel_a_projet_id)
    VALUES (
      ${id}, ${data.titre}, ${data.thematiqueId}, ${data.resume}, ${data.description},
      ${data.budgetDemande}, ${data.dureeMois}, ${data.partenaires ?? null},
      'Soumise', ${data.utilisateurId}, ${data.appelAProjetId ?? null}
    )
  `
  const rows = await sql`${SELECT_WITH_THEMATIQUE} WHERE c.id = ${id}`
  return mapRow(rows[0])
}

export async function deleteCandidature(id: string): Promise<void> {
  await sql`DELETE FROM candidatures WHERE id = ${id}`
}

export async function updateCandidature(
  id: string,
  data: Partial<Omit<Candidature, 'id'>>
): Promise<Candidature> {
  const rows = await sql`${SELECT_WITH_THEMATIQUE} WHERE c.id = ${id}`
  if (!rows[0]) throw new Error(`Candidature ${id} not found`)
  const c = mapRow(rows[0])

  await sql`
    UPDATE candidatures SET
      titre          = ${data.titre          ?? c.titre},
      thematique_id  = ${data.thematiqueId   ?? c.thematiqueId ?? null},
      resume         = ${data.resume         ?? c.resume},
      description    = ${data.description    ?? c.description},
      budget_demande = ${data.budgetDemande  ?? c.budgetDemande},
      duree_mois     = ${data.dureeMois      ?? c.dureeMois},
      partenaires    = ${data.partenaires    ?? c.partenaires ?? null},
      statut         = ${data.statut         ?? c.statut},
      date_soumission= ${data.dateSoumission ?? c.dateSoumission ?? null}
    WHERE id = ${id}
  `
  const updated = await sql`${SELECT_WITH_THEMATIQUE} WHERE c.id = ${id}`
  return mapRow(updated[0])
}
