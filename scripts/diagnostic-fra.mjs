// Diagnostic labos FRA — analyse les gaps entre la liste FRA et OpenAlex/carte
// Usage : cd ~/Desktop/CLAUDE-AI/fra && node scripts/diagnostic-fra.mjs

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
require('dotenv').config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

const sql   = neon(process.env.DATABASE_URL)
const HDR   = { 'User-Agent': 'mailto:contact@fra-recherche.org' }
const DELAY = 350

const FRA_LABS = [
  'CEA Fontenay-aux-Roses',
  'Institut de NeuroPhysiopathologie, Marseille',
  'Lille Neuroscience & Cognition Inserm',
  'Institut Interdisciplinaire des Neurosciences, Bordeaux',
  'Centre de Biologie Intégrative, Toulouse',
  'CHU Lyon',
  'IGMM Montpellier',
  'Institut Gustave Roussy, Villejuif',
  'Institut des neurosciences, Grenoble',
  'Institut du Cerveau ICM Paris',
]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function oaGet(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: HDR })
    if (res.ok) return res.json()
    if (res.status === 503 || res.status === 429) {
      const wait = (i + 1) * 1500
      console.log(`  ⏳ OpenAlex ${res.status} — retry dans ${wait}ms...`)
      await sleep(wait)
      continue
    }
    throw new Error(`OpenAlex ${res.status} — ${url}`)
  }
  throw new Error(`OpenAlex inaccessible après ${retries} tentatives`)
}

// Récupère alz_pub_count pour une institution via works groupés
async function getAlzCount(oaId) {
  const shortId = oaId.split('/').pop()
  const data = await oaGet(
    `https://api.openalex.org/works` +
    `?filter=default.search:alzheimer,authorships.institutions.id:${shortId}` +
    `&per-page=1`
  )
  await sleep(DELAY)
  return data.meta?.count ?? 0
}

// Recherche une institution dans OpenAlex par nom, retourne top 3 candidats
async function searchInstitution(name) {
  const q = encodeURIComponent(name)
  const data = await oaGet(
    `https://api.openalex.org/institutions?search=${q}&per-page=5` +
    `&select=id,display_name,country_code,type,geo,works_count,topics,lineage`
  )
  await sleep(DELAY)
  return data.results ?? []
}

// Vérifie si un openalex_id est dans notre DB
async function inDB(oaId) {
  const shortId = oaId.split('/').pop()
  const rows = await sql`SELECT id FROM carte_laboratoires WHERE openalex_id = ${shortId} LIMIT 1`
  return rows.length > 0
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('\n🔬 DIAGNOSTIC LABOS FRA\n' + '═'.repeat(60))

const missing   = []
const present   = []
const notFound  = []
const topicFreq = {}

for (const labName of FRA_LABS) {
  console.log(`\n▶ ${labName}`)

  const candidates = await searchInstitution(labName)

  if (!candidates.length) {
    console.log('  ⚠️  Pas trouvé dans OpenAlex')
    notFound.push(labName)
    continue
  }

  // On prend le meilleur candidat (premier résultat)
  const inst     = candidates[0]
  const shortId  = inst.id.split('/').pop()
  const inDb     = await inDB(inst.id)
  const alzCount = await getAlzCount(inst.id)
  const topics   = (inst.topics ?? []).slice(0, 6).map(t => t.display_name)
  const ville    = inst.geo?.city ?? '?'
  const pays     = inst.country_code?.toUpperCase() ?? '?'

  // Autres candidats potentiels
  const others = candidates.slice(1, 3).map(c => `${c.display_name} (${c.country_code?.toUpperCase()})`)

  console.log(`  OpenAlex  : ${inst.display_name} [${shortId}]`)
  console.log(`  Ville/Pays: ${ville}, ${pays} — Type: ${inst.type}`)
  console.log(`  Works     : ${inst.works_count} total — alz_pub_count estimé: ${alzCount}`)
  console.log(`  Dans carte: ${inDb ? '✅ oui' : '❌ non'}`)
  console.log(`  Topics    : ${topics.join(', ') || '(aucun)'}`)
  if (others.length) console.log(`  Autres candid.: ${others.join(' | ')}`)

  // Raison d'exclusion probable
  if (!inDb) {
    const COVERED = ['FR','DE','GB','IT','ES','NL','BE','CH']
    const reasons = []
    if (!COVERED.includes(pays))        reasons.push(`pays hors périmètre (${pays})`)
    if (alzCount === 0)                  reasons.push('0 pub "alzheimer" détectée')
    else if (alzCount < 3)               reasons.push(`alz_pub_count faible (${alzCount})`)
    if (inst.type === 'healthcare')      reasons.push('type healthcare (hôpital)')
    if (reasons.length === 0)            reasons.push('potentiellement dans le top 200 mais non remonté ?')
    console.log(`  ⚡ Cause probable : ${reasons.join(' + ')}`)
    missing.push({ name: labName, oaName: inst.display_name, shortId, alzCount, pays, type: inst.type, topics, reasons })
  } else {
    present.push(labName)
  }

  // Agrégation topics
  for (const t of topics) {
    topicFreq[t] = (topicFreq[t] ?? 0) + 1
  }
}

// ── Synthèse ──────────────────────────────────────────────────────────────────

console.log('\n\n' + '═'.repeat(60))
console.log('📊 SYNTHÈSE\n')
console.log(`✅ Dans la carte  : ${present.length}`)
console.log(`❌ Manquants      : ${missing.length}`)
console.log(`⚠️  Non trouvés OA : ${notFound.length}`)

if (missing.length) {
  console.log('\n🔍 Causes d\'exclusion :')
  const causeCounts = {}
  for (const m of missing) {
    for (const r of m.reasons) {
      const key = r.replace(/\(.*?\)/g, '').trim()
      causeCounts[key] = (causeCounts[key] ?? 0) + 1
    }
  }
  for (const [cause, n] of Object.entries(causeCounts).sort((a,b) => b[1]-a[1])) {
    console.log(`  • ${cause.padEnd(45)} ×${n}`)
  }
}

if (Object.keys(topicFreq).length) {
  console.log('\n🏷️  Topics OpenAlex les plus fréquents (tous labos) :')
  const sorted = Object.entries(topicFreq).sort((a,b) => b[1]-a[1]).slice(0, 15)
  for (const [topic, n] of sorted) {
    const bar = '█'.repeat(n)
    console.log(`  ${bar.padEnd(10)} ×${n}  ${topic}`)
  }
}

if (notFound.length) {
  console.log('\n⚠️  Labos introuvables dans OpenAlex (problème de nom ?) :')
  for (const n of notFound) console.log(`  • ${n}`)
}

console.log('\n' + '═'.repeat(60) + '\n')
process.exit(0)
