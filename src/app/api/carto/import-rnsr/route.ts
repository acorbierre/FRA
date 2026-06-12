import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const RNSR_URL = 'https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/records'
const GEO_URL  = 'https://api-adresse.data.gouv.fr/search'

async function geocodeVille(ville: string, codePostal: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const q = encodeURIComponent(`${ville} ${codePostal} France`)
    const res = await fetch(`${GEO_URL}/?q=${q}&limit=1&type=municipality`)
    const data = await res.json()
    const feat = data.features?.[0]
    if (!feat) return null
    const [lon, lat] = feat.geometry.coordinates
    return { lat, lon }
  } catch {
    return null
  }
}

export async function POST() {
  let offset = 0
  const limit = 100
  let total = 0
  let imported = 0
  let geocoded = 0

  do {
    const url = `${RNSR_URL}?where=panel_erc%20like%20%22Neuroscience%22&limit=${limit}&offset=${offset}&select=numero_national_de_structure,libelle,commune,code_postal,panel_erc,fiche_rnsr`
    const res  = await fetch(url)
    const data = await res.json()

    total = data.total_count
    const records: any[] = data.results ?? []

    for (const r of records) {
      const id        = r.numero_national_de_structure
      const nom       = r.libelle
      const ville     = (r.commune ?? '').replace(/ CEDEX.*$/i, '').trim()
      const cp        = r.code_postal ?? ''
      const panel     = Array.isArray(r.panel_erc) ? r.panel_erc[0] : r.panel_erc
      const url_rnsr  = r.fiche_rnsr ?? null

      const coords = await geocodeVille(ville, cp)
      if (coords) geocoded++

      await sql`
        INSERT INTO carte_laboratoires (id, nom, ville, code_postal, lat, lon, source, panel_erc, url)
        VALUES (
          ${id}, ${nom}, ${ville}, ${cp},
          ${coords?.lat ?? null}, ${coords?.lon ?? null},
          'rnsr', ${panel ?? null}, ${url_rnsr}
        )
        ON CONFLICT (id) DO UPDATE SET
          nom        = EXCLUDED.nom,
          ville      = EXCLUDED.ville,
          lat        = EXCLUDED.lat,
          lon        = EXCLUDED.lon,
          panel_erc  = EXCLUDED.panel_erc,
          url        = EXCLUDED.url
      `
      imported++
    }

    offset += limit
  } while (offset < total)

  return NextResponse.json({ ok: true, total, imported, geocoded })
}
