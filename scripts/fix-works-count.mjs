/**
 * Restaure works_count depuis HAL pour les 5 labs dont il a été écrasé à 0.
 * Usage : node --env-file=.env.local scripts/fix-works-count.mjs
 */

import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)

const DELAY = 300
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

const LABS = [
  'hal_454310',
  'hal_487601',
  'hal_184332',
  'hal_1051091',
  'hal_41228',
]

async function getTotalPubsFromHal(halDocId) {
  const url = `https://api.archives-ouvertes.fr/search/?q=*:*&fq=labStructId_i:${halDocId}&rows=0&wt=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HAL ${res.status}`)
  const data = await res.json()
  return data.response?.numFound ?? 0
}

async function main() {
  for (const labId of LABS) {
    const halDocId = labId.replace('hal_', '')
    try {
      const worksCount = await getTotalPubsFromHal(halDocId)
      await sql`UPDATE carte_laboratoires SET works_count = ${worksCount} WHERE id = ${labId}`
      console.log(`  [ok] ${labId} → works_count = ${worksCount}`)
      await sleep(DELAY)
    } catch (e) {
      console.error(`  [err] ${labId} : ${e.message}`)
    }
  }
  console.log('\nTerminé.')
}

main().catch(e => { console.error(e); process.exit(1) })
