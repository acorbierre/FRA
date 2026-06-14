import { z } from 'zod'
import { sql } from '@/lib/db'
import type { Utilisateur } from '@/types'

const UtilisateurSchema = z.object({
  id:                     z.string(),
  nom_complet:            z.string(),
  prenom:                 z.string(),
  nom:                    z.string(),
  email:                  z.string(),
  telephone:              z.string().nullish(),
  photo:                  z.array(z.object({ url: z.string() })).nullish(),
  bio:                    z.string().nullish(),
  ville:                  z.string().nullish(),
  contrat:                z.string().nullish(),
  specialite:             z.string().nullish(),
  role:                   z.array(z.string()).nullish(),
  statut_compte:          z.enum(['Invité', 'Actif']).nullish(),
  laboratoire_declaratif: z.string().nullish(),
  laboratoire_id:         z.array(z.string()).nullish(),
  carte_lab_id:           z.string().nullish(),
})

function mapRow(r: Record<string, unknown>): Utilisateur {
  const row = UtilisateurSchema.parse(r)
  return {
    id:                    row.id,
    nomComplet:            row.nom_complet,
    prenom:                row.prenom,
    nom:                   row.nom,
    email:                 row.email,
    telephone:             row.telephone ?? undefined,
    photo:                 row.photo ?? undefined,
    bio:                   row.bio ?? undefined,
    ville:                 row.ville ?? undefined,
    contrat:               row.contrat ?? undefined,
    specialite:            row.specialite ?? undefined,
    role:                  (row.role ?? []) as Utilisateur['role'],
    statutCompte:          row.statut_compte ?? 'Invité',
    laboratoireDeclaratif: row.laboratoire_declaratif ?? undefined,
    laboratoireId:         row.laboratoire_id ?? undefined,
    carteLabId:            row.carte_lab_id ?? undefined,
  }
}

export async function getUtilisateursByRole(role: string): Promise<Utilisateur[]> {
  const rows = await sql`SELECT * FROM utilisateurs WHERE role @> ARRAY[${role}]::text[] ORDER BY nom`
  return rows.map(mapRow)
}

export async function getAllUtilisateurs(): Promise<Utilisateur[]> {
  const rows = await sql`SELECT * FROM utilisateurs ORDER BY nom`
  return rows.map(mapRow)
}

export async function getUtilisateurByEmail(email: string): Promise<Utilisateur | null> {
  const rows = await sql`SELECT * FROM utilisateurs WHERE email = ${email} LIMIT 1`
  return rows[0] ? mapRow(rows[0]) : null
}

export async function getUtilisateurById(id: string): Promise<Utilisateur> {
  const rows = await sql`SELECT * FROM utilisateurs WHERE id = ${id}`
  if (!rows[0]) throw new Error(`Utilisateur ${id} not found`)
  return mapRow(rows[0])
}

export async function createUtilisateur(data: {
  prenom: string
  nom: string
  email: string
  telephone?: string
  bio?: string
  laboratoire?: string
  carteLabId?: string | null
  role?: string
}): Promise<Utilisateur> {
  const id = crypto.randomUUID()
  const nomComplet = `${data.prenom} ${data.nom}`
  const role = data.role ?? 'Candidat'
  const rows = await sql`
    INSERT INTO utilisateurs (id, nom_complet, prenom, nom, email, telephone, bio, laboratoire_declaratif, carte_lab_id, role, statut_compte)
    VALUES (${id}, ${nomComplet}, ${data.prenom}, ${data.nom}, ${data.email}, ${data.telephone ?? null}, ${data.bio ?? null}, ${data.laboratoire ?? null}, ${data.carteLabId ?? null}, ARRAY[${role}]::text[], 'Actif')
    RETURNING *
  `
  return mapRow(rows[0])
}

export async function updateUtilisateurPhoto(id: string, photoUrl: string): Promise<void> {
  await sql`UPDATE utilisateurs SET photo = ${JSON.stringify([{ url: photoUrl }])}::jsonb WHERE id = ${id}`
}

export async function updateUtilisateur(
  id: string,
  data: Partial<Pick<Utilisateur, 'prenom' | 'nom' | 'bio' | 'telephone' | 'ville'> & { laboratoire: string; carteLabId: string | null }>
): Promise<Utilisateur> {
  const rows = await sql`SELECT * FROM utilisateurs WHERE id = ${id}`
  if (!rows[0]) throw new Error(`Utilisateur ${id} not found`)
  const current = mapRow(rows[0])

  const prenom     = data.prenom    ?? current.prenom
  const nom        = data.nom       ?? current.nom
  const bio        = data.bio       !== undefined ? data.bio       : current.bio
  const telephone  = data.telephone !== undefined ? data.telephone : current.telephone
  const ville      = data.ville     !== undefined ? data.ville     : current.ville
  const labo       = data.laboratoire !== undefined ? data.laboratoire : current.laboratoireDeclaratif
  const carteLabId = 'carteLabId' in data ? data.carteLabId : current.carteLabId
  const nomComplet = `${prenom} ${nom}`

  const updated = await sql`
    UPDATE utilisateurs
    SET nom_complet = ${nomComplet}, prenom = ${prenom}, nom = ${nom},
        bio = ${bio ?? null}, telephone = ${telephone ?? null},
        ville = ${ville ?? null},
        laboratoire_declaratif = ${labo ?? null},
        carte_lab_id = ${carteLabId ?? null}
    WHERE id = ${id}
    RETURNING *
  `
  return mapRow(updated[0])
}
