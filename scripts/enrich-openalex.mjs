/**
 * Enrichit les labs HAL français avec les données OpenAlex :
 * openalex_id, works_count, cited_by_count, top_collabs
 *
 * Usage : node --env-file=.env.local scripts/enrich-openalex.mjs
 */

import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)

const HEADERS = { 'User-Agent': 'mailto:contact@fra-recherche.org' }
const DELAY   = 250

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function get(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Cherche l'institution OpenAlex correspondant au nom HAL
async function findOpenAlexInstitution(nom) {
  // On prend les 60 premiers chars pour éviter les noms trop longs
  const q = encodeURIComponent(nom.slice(0, 60))
  const data = await get(
    `https://api.openalex.org/institutions?search=${q}&filter=country_code:fr&per-page=1`
  )
  return data.results?.[0] ?? null
}

// Récupère les top collaborateurs sur les publications Alzheimer
async function getTopCollabs(openAlexId) {
  const data = await get(
    `https://api.openalex.org/works` +
    `?filter=institutions.id:${openAlexId},default.search:alzheimer` +
    `&per-page=50&select=authorships&sort=publication_year:desc`
  )
  const works = data.results ?? []

  const counts = new Map()
  for (const work of works) {
    const seen = new Set()
    for (const authorship of work.authorships ?? []) {
      for (const inst of authorship.institutions ?? []) {
        if (!inst.id || inst.id === openAlexId || seen.has(inst.id)) continue
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
    SELECT id, nom FROM carte_laboratoires
    WHERE pays = 'FR' AND lat IS NOT NULL
    ORDER BY alz_pub_count DESC NULLS LAST
  `
  console.log(`${labs.length} labs à enrichir\n`)

  let ok = 0, notFound = 0, err = 0

  for (const lab of labs) {
    const halNumericId = lab.id.replace('hal_', '')
    try {
      // 1. Match OpenAlex par nom
      const inst = await findOpenAlexInstitution(lab.nom)
      await sleep(DELAY)

      if (!inst) {
        process.stdout.write('·')
        notFound++
        continue
      }

      const openAlexId   = inst.id
      const worksCount   = inst.works_count    ?? 0
      const citedByCount = inst.cited_by_count ?? 0

      // 2. Top collabs sur publications Alzheimer
      const topCollabs = await getTopCollabs(openAlexId)
      await sleep(DELAY)

      // 3. Update en base
      await sql`
        UPDATE carte_laboratoires SET
          openalex_id    = ${openAlexId},
          works_count    = ${worksCount},
          cited_by_count = ${citedByCount},
          top_collabs    = ${JSON.stringify(topCollabs)}::jsonb
        WHERE id = ${lab.id}
      `
      console.log(`  [ok] ${lab.nom.slice(0, 50)} — cit: ${citedByCount.toLocaleString('fr-FR')}, collabs: ${topCollabs.length}`)
      ok++
    } catch (e) {
      console.error(`  [err] ${lab.nom.slice(0, 40)} : ${e.message}`)
      err++
    }
  }

  console.log(`\nTerminé — ok: ${ok}, non trouvés: ${notFound}, erreurs: ${err}`)
}

main().catch(e => { console.error(e); process.exit(1) })
