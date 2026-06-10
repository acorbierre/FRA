// Migration carte_laboratoires → OpenAlex
// Usage : node scripts/migrate-openalex.mjs
// Requiert DATABASE_URL dans .env.local

import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')
const env = readFileSync(envPath, 'utf8')
for (const line of env.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const { neon } = await import('@neondatabase/serverless')
const sql = neon(process.env.DATABASE_URL)

console.log('\nMigration carte_laboratoires...\n')

// 1. Vider la table (labos bidons RNSR)
await sql`TRUNCATE TABLE carte_laboratoires`
console.log('  ✓ Table vidée')

// 2. Ajouter les colonnes OpenAlex
await sql`ALTER TABLE carte_laboratoires ADD COLUMN IF NOT EXISTS openalex_id TEXT UNIQUE`
await sql`ALTER TABLE carte_laboratoires ADD COLUMN IF NOT EXISTS alz_pub_count INT DEFAULT 0`
await sql`ALTER TABLE carte_laboratoires ADD COLUMN IF NOT EXISTS cited_by_count BIGINT DEFAULT 0`
await sql`ALTER TABLE carte_laboratoires ADD COLUMN IF NOT EXISTS topics JSONB`
console.log('  ✓ Colonnes openalex_id, alz_pub_count, cited_by_count, topics ajoutées')

// 3. Vérifier la structure finale
const cols = await sql`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'carte_laboratoires'
  ORDER BY ordinal_position
`
console.log('\nStructure finale :')
for (const c of cols) console.log(`  ${c.column_name.padEnd(20)} ${c.data_type}`)

console.log('\nMigration terminée.\n')
process.exit(0)
