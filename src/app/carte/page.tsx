import EuropeMap from '@/components/carte/europe-map'
import { sql } from '@/lib/db'
import { Settings, ExternalLink } from 'lucide-react'

export const metadata = { title: 'Cartographie des équipes de recherche — FRA' }

export default async function CartePage() {
  const rows = await sql`
    SELECT id, nom, ville, pays, lat, lon, type, fra_funded, labo_neon_id, url
    FROM carte_laboratoires
    WHERE lat IS NOT NULL AND lon IS NOT NULL
    ORDER BY fra_funded DESC, type ASC
  `

  const labs = rows.map((r: any) => ({
    id: r.id,
    name: r.nom,
    city: r.ville,
    country: r.pays ?? 'France',
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    type: r.fra_funded ? 'fra' : (r.type ?? 'national'),
    neonId: r.labo_neon_id ?? null,
    url: r.url ?? null,
  }))

  return (
    <div className="flex-1 relative">
      {/* Carte plein écran */}
      <EuropeMap labs={labs} />

      {/* Topbar flottante sans fond */}
      <header className="absolute top-0 left-0 right-0 h-[60px] flex items-center justify-between px-8 pointer-events-none z-10">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 pointer-events-auto">
          <span className="text-white text-xs font-bold">FRA</span>
        </div>
        <a
          href="https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-structures-recherche-publiques-actives/"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto flex items-center gap-1.5 text-slate-500 text-sm font-medium whitespace-nowrap hover:text-slate-700 hover:underline transition-colors group"
        >
          {labs.length} structures · Source RNSR {new Date().getFullYear()}
          <ExternalLink size={12} />
        </a>
        <a href="/gestion" className="pointer-events-auto text-slate-400 hover:text-slate-600 transition-colors" title="Espace de gestion">
          <Settings size={18} />
        </a>
      </header>
    </div>
  )
}
