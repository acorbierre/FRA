import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

// Load .env.local
const env = readFileSync('.env.local', 'utf-8')
for (const line of env.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const sql = neon(process.env.DATABASE_URL)
const BASE_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`
const HEADERS = { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` }

const TABLES = {
  labos:         process.env.AIRTABLE_TABLE_LABOS,
  appels:        process.env.AIRTABLE_TABLE_APPELS,
  chercheurs:    process.env.AIRTABLE_TABLE_CHERCHEURS,
  candidatures:  process.env.AIRTABLE_TABLE_CANDIDATURES,
  projets:       process.env.AIRTABLE_TABLE_PROJETS,
  conventions:   process.env.AIRTABLE_TABLE_CONVENTIONS,
  versements:    process.env.AIRTABLE_TABLE_VERSEMENTS,
  rapports:      process.env.AIRTABLE_TABLE_RAPPORTS,
}

async function fetchAll(tableId) {
  const records = []
  let offset = null
  do {
    const url = new URL(`${BASE_URL}/${tableId}`)
    if (offset) url.searchParams.set('offset', offset)
    const res = await fetch(url, { headers: HEADERS })
    const data = await res.json()
    if (!res.ok) throw new Error(`Airtable error: ${JSON.stringify(data.error)}`)
    records.push(...data.records)
    offset = data.offset ?? null
  } while (offset)
  return records
}

function v(val) { return val ?? null }
function arr(val) { return val ?? [] }

async function migrateLaboratoires() {
  console.log('→ Laboratoires...')
  const records = await fetchAll(TABLES.labos)
  for (const r of records) {
    const f = r.fields
    await sql`
      INSERT INTO laboratoires (id, nom, institution, ville, site_web)
      VALUES (${r.id}, ${v(f['Nom'])}, ${v(f['Institution'])}, ${v(f['Ville'])}, ${v(f['Site web'])})
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log(`   ${records.length} laboratoires migrés`)
}

async function migrateAppels() {
  console.log('→ Appels à projets...')
  const records = await fetchAll(TABLES.appels)
  for (const r of records) {
    const f = r.fields
    await sql`
      INSERT INTO appels_a_projets (id, titre, annee, date_ouverture, date_cloture, thematiques, budget_total)
      VALUES (${r.id}, ${v(f['Titre'])}, ${v(f['Année'])}, ${v(f['Date ouverture'])}, ${v(f['Date clôture'])}, ${arr(f['Thématiques'])}, ${v(f['Budget total']) ?? 0})
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log(`   ${records.length} appels migrés`)
}

async function migrateChercheurs() {
  console.log('→ Chercheurs...')
  const records = await fetchAll(TABLES.chercheurs)
  for (const r of records) {
    const f = r.fields
    await sql`
      INSERT INTO chercheurs (id, nom_complet, prenom, nom, email, telephone, photo, bio, ville, contrat, specialite, role, statut_compte, laboratoire_declaratif, laboratoire_id)
      VALUES (
        ${r.id}, ${v(f['Nom complet'])}, ${v(f['Prénom'])}, ${v(f['Nom'])}, ${v(f['Email'])},
        ${v(f['Téléphone'])}, ${v(f['Photo']) ? JSON.stringify(f['Photo']) : null},
        ${v(f['Bio'])}, ${v(f['Ville'])}, ${v(f['Contrat'])}, ${v(f['Spécialité'])},
        ${arr(f['Rôle'])}, ${v(f['Statut compte']) ?? 'Invité'},
        ${v(f['Laboratoire (déclaratif)'])}, ${arr(f['Laboratoire'])}
      )
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log(`   ${records.length} chercheurs migrés`)
}

async function migrateCandidatures() {
  console.log('→ Candidatures...')
  const records = await fetchAll(TABLES.candidatures)
  for (const r of records) {
    const f = r.fields
    await sql`
      INSERT INTO candidatures (id, titre, thematique, resume, description, budget_demande, duree_mois, partenaires, created_at, date_soumission, statut, chercheur_id, appel_a_projet_id)
      VALUES (
        ${r.id}, ${v(f['Titre'])}, ${v(f['Thématique'])}, ${v(f['Résumé'])}, ${v(f['Description'])},
        ${v(f['Budget demandé'])}, ${v(f['Durée (mois)'])}, ${v(f['Partenaires'])},
        ${r.createdTime}, ${v(f['Date soumission'])}, ${v(f['Statut']) ?? 'Brouillon'},
        ${arr(f['Chercheur'])}, ${arr(f['Appel à projet'])}
      )
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log(`   ${records.length} candidatures migrées`)
}

async function migrateProjets() {
  console.log('→ Projets...')
  const records = await fetchAll(TABLES.projets)
  for (const r of records) {
    const f = r.fields
    await sql`
      INSERT INTO projets (id, titre, date_debut, date_fin_prevue, date_fin_reelle, montant_accorde, dimension_internationale, detail_partenariats, statut, candidature_id, photo, titre_court)
      VALUES (
        ${r.id}, ${v(f['Titre'])}, ${v(f['Date début'])}, ${v(f['Date fin prévue'])}, ${v(f['Date fin réelle'])},
        ${v(f['Montant accordé']) ?? 0}, ${v(f['Dimension internationale']) ?? false}, ${v(f['Détail partenariats'])},
        ${v(f['Statut']) ?? 'En cours'}, ${arr(f['Candidature'])},
        ${v(f['Photo']) ? JSON.stringify(f['Photo']) : null}, ${v(f['Titre court'])}
      )
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log(`   ${records.length} projets migrés`)
}

async function migrateConventions() {
  console.log('→ Conventions...')
  const records = await fetchAll(TABLES.conventions)
  for (const r of records) {
    const f = r.fields
    await sql`
      INSERT INTO conventions (id, numero_convention, date_signature, montant_total, statut, projet_id)
      VALUES (${r.id}, ${v(f['Numéro convention'])}, ${v(f['Date signature'])}, ${v(f['Montant total']) ?? 0}, ${v(f['Statut']) ?? 'En cours'}, ${arr(f['Projet'])})
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log(`   ${records.length} conventions migrées`)
}

async function migrateVersements() {
  console.log('→ Versements...')
  const records = await fetchAll(TABLES.versements)
  for (const r of records) {
    const f = r.fields
    await sql`
      INSERT INTO versements (id, reference, numero, montant, date_prevue, date_realisee, statut, convention_id)
      VALUES (${r.id}, ${v(f['Référence'])}, ${v(f['Numéro']) ?? 0}, ${v(f['Montant']) ?? 0}, ${v(f['Date prévue'])}, ${v(f['Date réalisée'])}, ${v(f['Statut']) ?? 'Prévu'}, ${arr(f['Convention'])})
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log(`   ${records.length} versements migrés`)
}

async function migrateRapports() {
  console.log('→ Rapports...')
  const records = await fetchAll(TABLES.rapports)
  for (const r of records) {
    const f = r.fields
    await sql`
      INSERT INTO rapports (id, reference, type, date_attendue, date_soumission, date_reception, statut, notes, en_retard, projet_id, versement_id)
      VALUES (
        ${r.id}, ${v(f['Référence'])}, ${v(f['Type'])}, ${v(f['Date attendue'])},
        ${v(f['Date soumission'])}, ${v(f['Date réception'])}, ${v(f['Statut']) ?? 'Attendu'},
        ${v(f['Notes'])}, ${v(f['En retard'])}, ${arr(f['Projet'])}, ${arr(f['Versement'])}
      )
      ON CONFLICT (id) DO NOTHING
    `
  }
  console.log(`   ${records.length} rapports migrés`)
}

async function main() {
  console.log('Migration Airtable → Neon\n')
  try {
    await migrateLaboratoires()
    await migrateAppels()
    await migrateChercheurs()
    await migrateCandidatures()
    await migrateProjets()
    await migrateConventions()
    await migrateVersements()
    await migrateRapports()
    console.log('\n✓ Migration terminée !')
  } catch (err) {
    console.error('\n✗ Erreur :', err.message)
    process.exit(1)
  }
}

main()
