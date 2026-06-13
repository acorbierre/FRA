import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const DELAY      = 200   // ms entre requêtes HAL
const ALZ_MIN    = 10    // publications Alzheimer minimum
const BATCH      = 50    // structures par batch HAL
const GEO_DELAY  = 150   // ms entre requêtes geocodage
const OA_HEADERS = { 'User-Agent': 'mailto:contact@fra-recherche.org' }
const OA_DELAY   = 300   // ms entre requêtes OpenAlex
const OA_BATCH   = 5     // requêtes OpenAlex parallèles par vague
const SIM_MIN    = 0.30  // seuil similarité nom pour accepter le match OpenAlex

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function halGet(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HAL ${res.status} — ${url}`)
  return res.json()
}

async function geocode(address: string): Promise<{ lat: number; lon: number; city: string } | null> {
  try {
    const res  = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`)
    if (!res.ok) return null
    const data = await res.json()
    const feat = data.features?.[0]
    if (!feat) return null
    const [lon, lat] = feat.geometry.coordinates
    return { lat, lon, city: feat.properties.city ?? feat.properties.municipality ?? null }
  } catch { return null }
}

// Similarité de Jaccard sur les mots significatifs (>3 lettres)
function similarity(a: string, b: string): number {
  const words = (s: string) => new Set(s.toLowerCase().split(/\W+/).filter(w => w.length > 3))
  const wA = words(a), wB = words(b)
  if (!wA.size || !wB.size) return 0
  const inter = [...wA].filter(w => wB.has(w)).length
  return inter / new Set([...wA, ...wB]).size
}

// Cherche un match OpenAlex pour une UMR HAL, retourne cited_by_count + works_count si trouvé
async function matchOpenAlex(name: string, acronym: string | null): Promise<{ citedByCount: number; worksCount: number } | null> {
  const queries = [
    acronym ? `display_name.search:${encodeURIComponent(acronym)}` : null,
    `display_name.search:${encodeURIComponent((name ?? '').split(' ').slice(0, 5).join(' '))}`,
  ].filter(Boolean) as string[]

  for (const q of queries) {
    try {
      const url = `https://api.openalex.org/institutions?filter=${q},country_code:fr&per-page=3&select=display_name,cited_by_count,works_count`
      const res  = await fetch(url, { headers: OA_HEADERS })
      if (!res.ok) continue
      const data  = await res.json()
      const match = (data.results ?? []).find((r: any) => similarity(r.display_name, name ?? '') >= SIM_MIN)
      if (match) return { citedByCount: match.cited_by_count ?? 0, worksCount: match.works_count ?? 0 }
    } catch { /* ignore */ }
  }
  return null
}

export async function POST() {
  try {
    // ── 1. Facet HAL : publications Alzheimer par UMR ──────────────────────────
    console.log('[import-hal] étape 1 : facet alzheimer')
    const facetData = await halGet(
      'https://api.archives-ouvertes.fr/search/' +
      '?q=alzheimer&fq=labStructCountry_s:fr' +
      `&rows=0&facet=true&facet.field=labStructId_i&facet.mincount=${ALZ_MIN}&facet.limit=500&wt=json`
    )
    const facetValues: (string | number)[] = facetData.facet_counts?.facet_fields?.labStructId_i ?? []
    const alzCounts = new Map<string, number>()
    for (let i = 0; i < facetValues.length; i += 2) {
      const id = String(facetValues[i]), count = Number(facetValues[i + 1])
      if (id && count > 0) alzCounts.set(id, count)
    }
    const allIds = [...alzCounts.keys()]
    console.log(`[import-hal] ${allIds.length} UMRs trouvées`)
    await sleep(DELAY)

    // ── 2. Détails des structures en batches ───────────────────────────────────
    console.log('[import-hal] étape 2 : détails structures HAL')
    interface HalStruct {
      docid: number; name_s?: string; acronym_s?: string; address_s?: string; rnsr_s?: string | string[]
    }
    const structs: HalStruct[] = []
    for (let i = 0; i < allIds.length; i += BATCH) {
      const ids  = allIds.slice(i, i + BATCH).join(' OR ')
      const data = await halGet(
        `https://api.archives-ouvertes.fr/ref/structure/?q=docid:(${ids})` +
        `&fl=docid,name_s,acronym_s,address_s,rnsr_s&rows=${BATCH}&wt=json`
      )
      structs.push(...(data.response?.docs ?? []))
      await sleep(DELAY)
    }

    // ── 3. Total publications par UMR (requête individuelle → numFound fiable) ──
    console.log('[import-hal] étape 3 : total publications par UMR')
    const totalPubs = new Map<string, number>()
    for (const id of allIds) {
      try {
        const data = await halGet(
          `https://api.archives-ouvertes.fr/search/?q=*:*&fq=labStructId_i:${id}&rows=0&wt=json`
        )
        const n = data.response?.numFound ?? 0
        if (n > 0) totalPubs.set(id, n)
      } catch { /* ignore, totalPubs reste absent → worksCount = 0 */ }
      await sleep(DELAY)
    }

    // ── 4. Enrichissement OpenAlex : cited_by_count + works_count ─────────────
    console.log('[import-hal] étape 4 : match OpenAlex')
    const oaData = new Map<number, { citedByCount: number; worksCount: number }>()
    for (let i = 0; i < structs.length; i += OA_BATCH) {
      const batch = structs.slice(i, i + OA_BATCH)
      await Promise.all(batch.map(async s => {
        const match = await matchOpenAlex(s.name_s ?? '', s.acronym_s ?? null)
        if (match) oaData.set(s.docid, match)
      }))
      await sleep(OA_DELAY)
    }
    console.log(`[import-hal] ${oaData.size}/${structs.length} UMRs matchées dans OpenAlex`)

    // ── 5. Purge + geocodage + upsert ─────────────────────────────────────────
    console.log('[import-hal] étape 5 : purge FR + geocodage + upsert')
    await sql`DELETE FROM carte_laboratoires WHERE pays = 'FR'`

    let upserted = 0, skippedGeo = 0

    for (const s of structs) {
      const halId    = `hal_${s.docid}`
      const nom      = s.name_s ?? null
      const acronym  = s.acronym_s ?? null
      const address  = s.address_s ?? null
      const alzCount = alzCounts.get(String(s.docid)) ?? 0
      const totPubs  = totalPubs.get(String(s.docid)) ?? 0
      const oa       = oaData.get(s.docid)

      if (!address) { skippedGeo++; continue }

      await sleep(GEO_DELAY)
      const geo = await geocode(address)
      if (!geo) { skippedGeo++; continue }

      const label        = acronym ? `${nom} (${acronym})` : nom
      const worksCount   = oa ? Math.max(oa.worksCount, totPubs) : totPubs
      const citedByCount = oa?.citedByCount ?? 0
      const topicsJson   = '[]'

      await sql`
        INSERT INTO carte_laboratoires
          (id, nom, ville, pays, lat, lon, type, fra_funded, source, url,
           openalex_id, alz_pub_count, cited_by_count, works_count, topics)
        VALUES (
          ${halId}, ${label}, ${geo.city}, 'FR', ${geo.lat}, ${geo.lon},
          'national', false, 'hal', null,
          null, ${alzCount}, ${citedByCount}, ${worksCount}, ${topicsJson}
        )
        ON CONFLICT (id) DO UPDATE SET
          nom            = EXCLUDED.nom,
          ville          = EXCLUDED.ville,
          lat            = EXCLUDED.lat,
          lon            = EXCLUDED.lon,
          alz_pub_count  = EXCLUDED.alz_pub_count,
          cited_by_count = EXCLUDED.cited_by_count,
          works_count    = EXCLUDED.works_count,
          source         = 'hal'
      `
      upserted++
    }

    return NextResponse.json({
      ok:            true,
      umr_found:     allIds.length,
      umr_details:   structs.length,
      oa_matched:    oaData.size,
      upserted,
      skipped_geo:   skippedGeo,
    })

  } catch (err: any) {
    console.error('[import-hal]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
