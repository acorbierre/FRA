// Test de correspondance labos carte_laboratoires <-> PubMed
// Stratégie : numéro d'unité (UMR/UMRS/EA/UPR) en priorité, sinon nom complet
// Usage : node scripts/test-pubmed.mjs
// Requiert DATABASE_URL dans .env.local

import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')
const env = readFileSync(envPath, 'utf8')
for (const line of env.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

// Extrait le numéro d'unité du libellé RNSR
// ex: "UMR 8576 - UGSF - ..."  → "UMR 8576"
// ex: "UMRS 1127 — ..."         → "UMRS 1127"
// ex: "EA 4483 - IMPECS - ..."  → "EA 4483"
function extractUnitNumber(nom) {
  const m = nom.match(/\b(UMR[S]?|EA|UPR|ERL|FRE|GDR|HDR|IFR)\s*(\d{3,5})\b/i)
  return m ? `${m[1].toUpperCase()} ${m[2]}` : null
}

async function queryPubMed(term) {
  const q   = encodeURIComponent(`${term} AND alzheimer[Title/Abstract]`)
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${q}&rettype=count&retmode=json`
  const res  = await fetch(url)
  const data = await res.json()
  return parseInt(data.esearchresult?.count ?? '0', 10)
}

import('@neondatabase/serverless').then(async ({ neon }) => {
  const sql = neon(process.env.DATABASE_URL)

  const labs = await sql`
    SELECT id, nom, ville
    FROM carte_laboratoires
    WHERE lat IS NOT NULL
    ORDER BY fra_funded DESC, id ASC
    LIMIT 20
  `

  console.log(`\n${'─'.repeat(90)}`)
  console.log(`Test PubMed (stratégie UMR+nom) — ${labs.length} labos`)
  console.log(`${'─'.repeat(90)}\n`)
  console.log(`${'Labo'.padEnd(46)} ${'Stratégie'.padEnd(14)} ${'Résultat'}`)
  console.log(`${'─'.repeat(90)}`)

  const DELAY = 400

  let hits = 0

  for (const lab of labs) {
    const unitNum = extractUnitNumber(lab.nom)

    let count    = 0
    let strategy = ''

    try {
      if (unitNum) {
        // Essai 1 : numéro d'unité seul (ex: "UMR 8576"[Affiliation])
        count = await queryPubMed(`"${unitNum}"[Affiliation]`)
        strategy = unitNum
        await new Promise(r => setTimeout(r, DELAY))

        if (count === 0) {
          // Essai 2 : numéro sans espace (ex: "UMR8576")
          const compact = unitNum.replace(' ', '')
          count = await queryPubMed(`"${compact}"[Affiliation]`)
          strategy = count > 0 ? `${compact} (compact)` : unitNum + ' (0)'
          await new Promise(r => setTimeout(r, DELAY))
        }
      }

      if (count === 0) {
        // Essai 3 : nom complet
        count = await queryPubMed(`"${lab.nom}"[Affiliation]`)
        strategy = 'nom complet'
        await new Promise(r => setTimeout(r, DELAY))
      }

      if (count > 0) hits++
      const bar   = count > 0 ? '█'.repeat(Math.min(count, 25)) : '·'
      const label = count > 0 ? `${count} pub.` : 'aucun'
      console.log(`${lab.nom.slice(0, 45).padEnd(46)} ${strategy.slice(0, 13).padEnd(14)} ${bar} ${label}`)

    } catch {
      console.log(`${lab.nom.slice(0, 45).padEnd(46)} ${'erreur'.padEnd(14)} !`)
    }
  }

  console.log(`\n${'─'.repeat(90)}`)
  console.log(`Taux de matching : ${hits}/${labs.length} (${Math.round(hits/labs.length*100)}%)\n`)
  process.exit(0)
})
