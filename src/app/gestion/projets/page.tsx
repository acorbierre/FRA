import { getProjets } from '@/services/neon'
import ProjetsListe from './projets-list'

export default async function ProjetsPage() {
  const projets = await getProjets()

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Projets financés</h1>
        <p className="page-subtitle">{projets.length} projet{projets.length > 1 ? 's' : ''}</p>
      </div>

      <ProjetsListe projets={projets} />
    </div>
  )
}
