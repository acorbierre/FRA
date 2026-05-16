import { z } from 'zod'
import { sql } from '@/lib/db'
import { dbDate, dbDateOpt } from './schema-helpers'

export interface Evaluation {
  id: string
  candidatureId: string
  reviewerId: string
  noteExperience: number | null
  noteQuestion: number | null
  noteMethodes: number | null
  noteFinale: number | null
  commentaire: string | null
  statut: 'En attente' | 'Soumise'
  submittedAt: string | null
  createdAt: string
  // joined
  reviewerNom?: string
  reviewerEmail?: string
}

const EvaluationSchema = z.object({
  id:             z.string(),
  candidature_id: z.string(),
  reviewer_id:    z.string(),
  note_experience: z.coerce.number().nullable(),
  note_question:  z.coerce.number().nullable(),
  note_methodes:  z.coerce.number().nullable(),
  note_finale:    z.coerce.number().nullable(),
  commentaire:    z.string().nullable(),
  statut:         z.enum(['En attente', 'Soumise']).nullish(),
  submitted_at:   dbDateOpt,
  created_at:     dbDate,
  reviewer_nom:   z.string().nullish(),
  reviewer_email: z.string().nullish(),
})

function mapRow(r: Record<string, unknown>): Evaluation {
  const row = EvaluationSchema.parse(r)
  return {
    id:             row.id,
    candidatureId:  row.candidature_id,
    reviewerId:     row.reviewer_id,
    noteExperience: row.note_experience,
    noteQuestion:   row.note_question,
    noteMethodes:   row.note_methodes,
    noteFinale:     row.note_finale,
    commentaire:    row.commentaire,
    statut:         row.statut ?? 'En attente',
    submittedAt:    row.submitted_at ? new Date(row.submitted_at).toISOString() : null,
    createdAt:      new Date(row.created_at).toISOString(),
    reviewerNom:    row.reviewer_nom ?? undefined,
    reviewerEmail:  row.reviewer_email ?? undefined,
  }
}

export async function getEvaluationsByCandidature(candidatureId: string): Promise<Evaluation[]> {
  const rows = await sql`
    SELECT e.*, c.nom_complet AS reviewer_nom, c.email AS reviewer_email
    FROM evaluations e
    LEFT JOIN utilisateurs c ON c.id = e.reviewer_id
    WHERE e.candidature_id = ${candidatureId}
    ORDER BY e.created_at
  `
  return rows.map(mapRow)
}

export async function getEvaluationsByReviewer(reviewerId: string): Promise<Evaluation[]> {
  const rows = await sql`
    SELECT e.*
    FROM evaluations e
    WHERE e.reviewer_id = ${reviewerId}
    ORDER BY e.created_at DESC
  `
  return rows.map(mapRow)
}

export async function assignReviewers(candidatureId: string, reviewerIds: string[]): Promise<void> {
  await sql`DELETE FROM evaluations WHERE candidature_id = ${candidatureId}`
  for (const reviewerId of reviewerIds) {
    const id = crypto.randomUUID()
    await sql`
      INSERT INTO evaluations (id, candidature_id, reviewer_id)
      VALUES (${id}, ${candidatureId}, ${reviewerId})
    `
  }
}

export async function submitEvaluation(
  id: string,
  data: { noteExperience: number; noteQuestion: number; noteMethodes: number; commentaire?: string }
): Promise<Evaluation> {
  const noteFinale = Math.round(((data.noteExperience + data.noteQuestion + data.noteMethodes) / 3) * 10) / 10
  const rows = await sql`
    UPDATE evaluations SET
      note_experience = ${data.noteExperience},
      note_question   = ${data.noteQuestion},
      note_methodes   = ${data.noteMethodes},
      note_finale     = ${noteFinale},
      commentaire     = ${data.commentaire ?? null},
      statut          = 'Soumise',
      submitted_at    = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return mapRow(rows[0])
}
