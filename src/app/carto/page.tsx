import EuropeMap from '@/components/carte/europe-map'
import { sql } from '@/lib/db'
import { ExternalLink } from 'lucide-react'
import { InfoSourcesButton } from '@/components/carte/info-sources-button'
import Link from 'next/link'

export const metadata = { title: 'Cartographie des équipes de recherche — FRA' }

export default async function CartePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams
  const initialLabId = sp.lab ?? null
  const rows = await sql`
    SELECT DISTINCT ON (LOWER(nom), ville)
           id, nom, ville, pays, lat, lon, type, fra_funded, labo_neon_id, url,
           alz_pub_count, cited_by_count, works_count, topics, top_collabs
    FROM carte_laboratoires
    WHERE lat IS NOT NULL AND lon IS NOT NULL
    AND pays = 'FR'
    AND (fra_funded = TRUE OR source IN ('openalex', 'hal'))
    ORDER BY LOWER(nom), ville, fra_funded DESC, (cited_by_count > 0) DESC, alz_pub_count DESC NULLS LAST
  `

  const labs = rows.map((r: any) => ({
    id: r.id,
    name: r.nom,
    city: r.ville ?? '',
    country: r.pays ?? 'France',
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    type: r.fra_funded ? 'fra' : (r.type ?? 'national'),
    neonId: r.labo_neon_id ?? null,
    url: r.url ?? null,
    alzPubCount: r.alz_pub_count ?? 0,
    citedByCount: r.cited_by_count ?? 0,
    worksCount: r.works_count ?? 0,
    topics: r.topics ?? [],
    topCollabs: r.top_collabs ?? [],
  }))

  // Enrichir topCollabs avec labId si le co-labo est dans la carto
  const labIdSet = new Set(labs.map(l => l.id))
  for (const lab of labs) {
    lab.topCollabs = (lab.topCollabs ?? []).map((c: { id: string; nom: string; count: number }) => ({
      ...c,
      labId: labIdSet.has(`hal_${c.id}`) ? `hal_${c.id}` : undefined,
    }))
  }

  return (
    <div className="flex-1 relative">
      <EuropeMap labs={labs} initialLabId={initialLabId} />

      <header className="absolute top-0 left-0 right-0 h-[60px] flex items-center justify-between px-4 sm:px-8 pointer-events-none z-10">
        <Link href="/gestion" className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 pointer-events-auto hover:opacity-80 transition-opacity">
          <span className="text-white text-xs font-bold">FRA</span>
        </Link>
        <a
          href="https://openalex.org"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto flex items-center gap-1.5 text-slate-500 text-sm font-medium whitespace-nowrap hover:text-slate-700 hover:underline transition-colors"
        >
          {labs.length} équipes de recherche · Sources HAL · OpenAlex
          <ExternalLink size={12} />
        </a>
        <InfoSourcesButton />
      </header>
    </div>
  )
}
