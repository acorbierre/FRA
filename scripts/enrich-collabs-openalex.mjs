/**
 * Enrichit top_collabs pour les labs OpenAlex (source='openalex')
 * Utilise l'openalex_id déjà en base — pas de match par nom.
 *
 * Usage : node --env-file=.env.local scripts/enrich-collabs-openalex.mjs
 */

import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)

const HEADERS = { 'User-Agent': 'mailto:contact@fra-recherche.org' }
const DELAY   = 300

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function getTopCollabs(openAlexId) {
  const url =
    `https://api.openalex.org/works` +
    `?filter=institutions.id:${openAlexId},default.search:alzheimer` +
    `&per-page=50&select=authorships&sort=publication_year:desc`
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`)
  const data = await res.json()
  const works = data.results ?? []

  const counts = new Map()
  for (const work of works) {
    const seen = new Set()
    for (const authorship of work.authorships ?? []) {
      for (const inst of authorship.institutions ?? []) {
        if (!inst.id || inst.id === `https://openalex.org/${openAlexId}` || seen.has(inst.id)) continue
        seen.add(inst.id)
        const cur = counts.get(inst.id) ?? { nom: inst.display_name ?? '?', count: 0 }
        cur.count++
        counts.set(inst.id, cur)
      }
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([id, { nom, count }]) => ({ id: id.split('/').pop(), nom, count }))
}

async function main() {
  const labs = await sql`
    SELECT id, openalex_id FROM carte_laboratoires
    WHERE source = 'openalex' AND openalex_id IS NOT NULL
    ORDER BY alz_pub_count DESC NULLS LAST
  `
  console.log(`${labs.length} labs OpenAlex à enrichir\n`)

  let ok = 0, empty = 0, err = 0

  for (let i = 0; i < labs.length; i++) {
    const lab = labs[i]
    try {
      const collabs = await getTopCollabs(lab.openalex_id)
      await sleep(DELAY)

      if (collabs.length === 0) {
        process.stdout.write('·')
        empty++
        continue
      }

      await sql`
        UPDATE carte_laboratoires
        SET top_collabs = ${JSON.stringify(collabs)}::jsonb
        WHERE id = ${lab.id}
      `
      process.stdout.write('✓')
      ok++
    } catch (e) {
      process.stdout.write('✗')
      err++
    }

    if ((i + 1) % 50 === 0) {
      console.log(`\n  ${i + 1}/${labs.length}`)
    }
  }

  console.log(`\n\nTerminé — ok: ${ok}, sans collabs: ${empty}, erreurs: ${err}`)
}

main().catch(e => { console.error(e); process.exit(1) })
