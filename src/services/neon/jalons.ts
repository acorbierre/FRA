import { z } from 'zod'
import { sql } from '@/lib/db'
import { dbDate, dbDateNull } from './schema-helpers'
import type { JalonType, JalonStatut } from '@/lib/config'

export type { JalonType, JalonStatut }

export interface Jalon {
  id: string
  projetId: string
  projetTitre?: string
  type: JalonType
  label: string
  montant?: number | null
  datePrevue: string
  dateReelle?: string | null
  statut: JalonStatut
  calendarEventId?: string | null
}

function computeStatut(datePrevue: string, dateReelle: string | null): JalonStatut {
  if (dateReelle) return 'realise'
  if (new Date(datePrevue) < new Date()) return 'en_retard'
  return 'prevu'
}

const JalonSchema = z.object({
  id:                z.string(),
  projet_id:         z.string(),
  projet_titre:      z.string().nullish(),
  type:              z.enum(['versement', 'rapport', 'comite', 'autre']),
  label:             z.string(),
  montant:           z.coerce.number().nullable(),
  date_prevue:       dbDate,
  date_reelle:       dbDateNull,
  calendar_event_id: z.string().nullable().optional(),
})

function mapRow(r: Record<string, unknown>): Jalon {
  const row = JalonSchema.parse(r)
  return {
    id:          row.id,
    projetId:    row.projet_id,
    projetTitre: row.projet_titre ?? undefined,
    type:        row.type,
    label:       row.label,
    montant:     row.montant,
    datePrevue:  row.date_prevue,
    dateReelle:  row.date_reelle,
    statut:          computeStatut(row.date_prevue, row.date_reelle),
    calendarEventId: row.calendar_event_id ?? null,
  }
}

export async function getVersementsForAgenda(): Promise<Jalon[]> {
  const rows = await sql`
    SELECT
      v.id, v.numero, v.montant, v.date_prevue, v.date_realisee,
      p.id AS projet_id, p.titre AS projet_titre
    FROM versements v
    LEFT JOIN conventions c ON c.id = v.convention_id
    LEFT JOIN projets p ON p.id = c.projet_id
    WHERE v.date_prevue IS NOT NULL
    ORDER BY v.date_prevue ASC
  `
  return rows.map(r => {
    const datePrevue  = String(r.date_prevue).slice(0, 10)
    const dateReelle  = r.date_realisee ? String(r.date_realisee).slice(0, 10) : null
    return {
      id:          String(r.id),
      projetId:    r.projet_id ? String(r.projet_id) : '',
      projetTitre: r.projet_titre ? String(r.projet_titre) : undefined,
      type:        'versement' as const,
      label:       `Versement ${r.numero}`,
      montant:     r.montant != null ? Number(r.montant) : null,
      datePrevue,
      dateReelle,
      statut:      computeStatut(datePrevue, dateReelle),
      calendarEventId: null,
    }
  })
}

export async function getAllJalons(): Promise<Jalon[]> {
  const rows = await sql`
    SELECT j.*, p.titre AS projet_titre
    FROM jalons j
    LEFT JOIN projets p ON p.id = j.projet_id
    ORDER BY j.date_prevue ASC
  `
  return rows.map(mapRow)
}

export async function getJalonsByProjet(projetId: string): Promise<Jalon[]> {
  const rows = await sql`
    SELECT j.*, p.titre AS projet_titre
    FROM jalons j
    LEFT JOIN projets p ON p.id = j.projet_id
    WHERE j.projet_id = ${projetId}
    ORDER BY j.date_prevue ASC
  `
  return rows.map(mapRow)
}

export async function createJalon(data: {
  projetId: string
  type: JalonType
  label: string
  montant?: number | null
  datePrevue: string
}): Promise<Jalon> {
  const id = crypto.randomUUID()
  const rows = await sql`
    INSERT INTO jalons (id, projet_id, type, label, montant, date_prevue)
    VALUES (${id}, ${data.projetId}, ${data.type}, ${data.label}, ${data.montant ?? null}, ${data.datePrevue})
    RETURNING *
  `
  return mapRow(rows[0])
}

export async function updateJalonDateReelle(id: string, dateReelle: string | null): Promise<void> {
  await sql`UPDATE jalons SET date_reelle = ${dateReelle} WHERE id = ${id}`
}
