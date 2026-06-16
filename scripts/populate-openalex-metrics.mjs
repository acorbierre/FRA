/**
 * Script one-shot : enrichit les labs HAL français avec les métriques OpenAlex
 * (works_count, cited_by_count) en matchant via l'ID HAL dans l'API OpenAlex.
 *
 * Usage :
 *   cd ~/Desktop/CLAUDE-AI/fra
 *   node --env-file=.env.local scripts/populate-openalex-metrics.mjs
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const DELAY_MS = 200
const EMAIL    = 'contact@fra-recherche.org'

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// Étape 1 : récupère le ROR de la structure HAL
async function getRorFromHal(halNumericId) {
  const url = `https://api.archives-ouvertes.fr/ref/structure/?q=docid:${halNumericId}&fl=ror_s&rows=1&wt=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HAL HTTP ${res.status}`)
  const data = await res.json()
  return data.response?.docs?.[0]?.ror_s ?? null
}

// Étape 2 : récupère works_count et cited_by_count depuis OpenAlex via ROR
async function getOpenAlexByRor(ror) {
  const url = `https://api.openalex.org/institutions/${encodeURIComponent(ror)}?mailto=${EMAIL}`
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

async function main() {
  const rows = await sql`
    SELECT id, nom
    FROM carte_laboratoires
    WHERE source = 'hal'
      AND pays = 'FR'
      AND cited_by_count = 0
    ORDER BY alz_pub_count DESC NULLS LAST
  `

  console.log(`${rows.length} labs HAL français à enrichir`)

  let ok = 0, noRor = 0, noOA = 0, err = 0

  for (const row of rows) {
    const halNumericId = row.id.replace('hal_', '')

    try {
      const ror = await getRorFromHal(halNumericId)
      await sleep(DELAY_MS)

      if (!ror) {
        process.stdout.write('·')
        noRor++
        continue
      }

      const inst = await getOpenAlexByRor(ror)
      await sleep(DELAY_MS)

      if (!inst) {
        process.stdout.write('○')
        noOA++
        continue
      }

      const worksCount   = inst.works_count    ?? 0
      const citedByCount = inst.cited_by_count ?? 0

      await sql`
        UPDATE carte_laboratoires
        SET
          works_count    = GREATEST(works_count, ${worksCount}),
          cited_by_count = ${citedByCount}
        WHERE id = ${row.id}
      `
      console.log(`  [ok] ${row.nom} — works: ${worksCount}, cit: ${citedByCount}`)
      ok++
    } catch (e) {
      console.error(`  [err] ${row.nom} : ${e.message}`)
      err++
    }
  }

  console.log(`\nTerminé — enrichis: ${ok}, sans ROR: ${noRor}, ROR non trouvé OA: ${noOA}, erreurs: ${err}`)
}

main().catch(e => { console.error(e); process.exit(1) })
