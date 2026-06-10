import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const HEADERS  = { 'User-Agent': 'mailto:contact@fra-recherche.org' }
const DELAY    = 250 // ms entre requêtes
const COUNTRIES = ['fr', 'de', 'gb', 'it', 'es', 'nl', 'be', 'ch']
const PER_PAGE  = 200 // institutions par pays

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function openalexGet(url: string) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`OpenAlex ${res.status} — ${url}`)
  return res.json()
}

export async function POST() {
  try {
    // ── 1. Récupérer les institutions avec publications Alzheimer par pays ──
    const instCounts = new Map<string, number>() // openalex_id → alz_pub_count

    for (const country of COUNTRIES) {
      const url =
        `https://api.openalex.org/works` +
        `?filter=default.search:alzheimer,institutions.country_code:${country}` +
        `&group_by=institutions.id&per-page=${PER_PAGE}`
      const data = await openalexGet(url)
      const groups: { key: string; count: number }[] = data.group_by ?? []

      for (const g of groups) {
        if (!g.key || g.key === 'unknown') continue
        instCounts.set(g.key, (instCounts.get(g.key) ?? 0) + g.count)
      }
      await sleep(DELAY)
    }

    const allIds = [...instCounts.keys()]

    // ── 2. Récupérer les détails en batches de 50 ──
    let upserted = 0
    const BATCH = 50

    for (let i = 0; i < allIds.length; i += BATCH) {
      const batch = allIds.slice(i, i + BATCH)
      const filterIds = batch.map(id => id.split('/').pop()).join('|')

      const data = await openalexGet(
        `https://api.openalex.org/institutions` +
        `?filter=openalex_id:${filterIds}` +
        `&per-page=${BATCH}` +
        `&select=id,display_name,country_code,type,geo,cited_by_count,works_count,topics,homepage_url`
      )
      await sleep(DELAY)

      const institutions: any[] = data.results ?? []

      for (const inst of institutions) {
        const id          = inst.id as string            // ex: https://openalex.org/I154526488
        const shortId     = id.split('/').pop()!         // ex: I154526488
        const nom         = inst.display_name as string
        const pays        = inst.country_code?.toUpperCase() ?? null
        const ville       = inst.geo?.city ?? null
        const lat         = inst.geo?.latitude ?? null
        const lon         = inst.geo?.longitude ?? null
        const url_hp      = inst.homepage_url ?? null
        const cited       = inst.cited_by_count ?? 0
        const worksCount  = inst.works_count ?? 0
        const alzCount    = instCounts.get(id) ?? 0
        const topicsJson  = JSON.stringify(
          (inst.topics ?? []).slice(0, 5).map((t: any) => ({
            id:   t.id,
            name: t.display_name,
            field: t.field?.display_name ?? null,
          }))
        )

        if (!lat || !lon) continue  // pas de géo = pas affiché sur la carte

        await sql`
          INSERT INTO carte_laboratoires
            (id, nom, ville, pays, lat, lon, type, fra_funded, source, url,
             openalex_id, alz_pub_count, cited_by_count, works_count, topics)
          VALUES (
            ${shortId}, ${nom}, ${ville}, ${pays}, ${lat}, ${lon},
            'national', false, 'openalex', ${url_hp},
            ${shortId}, ${alzCount}, ${cited}, ${worksCount}, ${topicsJson}
          )
          ON CONFLICT (id) DO UPDATE SET
            nom           = EXCLUDED.nom,
            ville         = EXCLUDED.ville,
            lat           = EXCLUDED.lat,
            lon           = EXCLUDED.lon,
            alz_pub_count = EXCLUDED.alz_pub_count,
            cited_by_count= EXCLUDED.cited_by_count,
            works_count   = EXCLUDED.works_count,
            topics        = EXCLUDED.topics,
            url           = EXCLUDED.url
        `
        upserted++
      }
    }

    return NextResponse.json({ ok: true, institutions: allIds.length, upserted })

  } catch (err: any) {
    console.error('[import-openalex]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
