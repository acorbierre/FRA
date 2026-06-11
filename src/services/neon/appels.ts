import { sql } from '@/lib/db'

export interface EtapeAppel {
  id: string
  appel_id: string
  label: string
  date_prevue: string
  ordre: number
}

export async function getEtapesAppelCourant(annee: number): Promise<EtapeAppel[]> {
  const rows = await sql`
    SELECT e.id, e.appel_id, e.label, e.date_prevue, e.ordre
    FROM etapes_appel e
    JOIN appels_a_projets a ON a.id = e.appel_id
    WHERE a.annee = ${annee}
    ORDER BY e.ordre ASC
  `
  return rows as EtapeAppel[]
}
