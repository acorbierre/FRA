import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const DELAY      = 250  // ms entre requêtes HAL
const BATCH_SIZE = 5    // labos traités en parallèle
const TOP_N      = 6    // nombre de co-labs à stocker

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

interface CoLab {
  id:    string
  nom:   string
  count: number
}

async function fetchCollabs(halDocId: string): Promise<CoLab[]> {
  // 1. Publications Alzheimer du labo + facet co-labos
  const facetUrl =
    'https://api.archives-ouvertes.fr/search/' +
    `?q=alzheimer&fq=labStructId_i:${halDocId}` +
    `&rows=0&facet=true&facet.field=labStructId_i` +
    `&facet.mincount=2&facet.limit=${TOP_N + 5}&wt=json`

  const facetRes  = await fetch(facetUrl)
  if (!facetRes.ok) return []
  const facetData = await facetRes.json()

  const vals = facetData.facet_counts?.facet_fields?.labStructId_i ?? []
  const candidates: { id: string; count: number }[] = []
  for (let i = 0; i < vals.length; i += 2) {
    const id = String(vals[i]), count = Number(vals[i + 1])
    if (id !== halDocId && id && count > 0) candidates.push({ id, count })
  }
  if (candidates.length === 0) return []

  // 2. Noms des co-labos
  const ids      = candidates.map(c => c.id).join(' OR ')
  const structRes = await fetch(
    `https://api.archives-ouvertes.fr/ref/structure/?q=docid:(${ids})` +
    `&fl=docid,name_s,acronym_s&rows=${TOP_N + 5}&wt=json`
  )
  if (!structRes.ok) return []
  const structData = await structRes.json()
  const structs    = structData.response?.docs ?? []

  return candidates.slice(0, TOP_N).map(c => {
    const s   = structs.find((s: any) => String(s.docid) === c.id)
    const nom = s?.acronym_s ?? s?.name_s ?? `HAL:${c.id}`
    return { id: c.id, nom, count: c.count }
  })
}

export async function POST() {
  try {
    // Récupérer tous les labs HAL en base
    const rows = await sql`
      SELECT id FROM carte_laboratoires
      WHERE source = 'hal'
      ORDER BY alz_pub_count DESC
    `
    const labs = rows.map((r: any) => r.id as string) // ex: "hal_476572"

    console.log(`[enrich-collabs] ${labs.length} labs HAL à enrichir`)

    let enriched = 0, skipped = 0

    for (let i = 0; i < labs.length; i += BATCH_SIZE) {
      const batch = labs.slice(i, i + BATCH_SIZE)

      await Promise.all(batch.map(async labId => {
        const halDocId = labId.replace('hal_', '')
        const collabs  = await fetchCollabs(halDocId)

        if (collabs.length === 0) { skipped++; return }

        await sql`
          UPDATE carte_laboratoires
          SET top_collabs = ${JSON.stringify(collabs)}
          WHERE id = ${labId}
        `
        enriched++
      }))

      await sleep(DELAY)
      if ((i + BATCH_SIZE) % 50 === 0) {
        console.log(`[enrich-collabs] ${Math.min(i + BATCH_SIZE, labs.length)}/${labs.length}`)
      }
    }

    return NextResponse.json({ ok: true, enriched, skipped })

  } catch (err: any) {
    console.error('[enrich-collabs]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
