import { getAllCandidatures, getAllChercheurs } from '@/services/neon'
import CandidaturesTabs from './candidatures-tabs'

export default async function CandidaturesPage() {
  const [candidatures, chercheurs] = await Promise.all([getAllCandidatures(), getAllChercheurs()])
  const chercheurMap = Object.fromEntries(chercheurs.map(c => [c.id, c.nomComplet]))
  const actives = candidatures.filter(c => c.statut !== 'Brouillon')

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Candidatures</h1>
        <p className="page-subtitle">{actives.length} candidature{actives.length > 1 ? 's' : ''}</p>
      </div>
      <CandidaturesTabs candidatures={actives} chercheurMap={chercheurMap} />
    </div>
  )
}
