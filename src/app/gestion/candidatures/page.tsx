import { getAllCandidatures, getAllUtilisateurs } from '@/services/neon'
import { getAppSettings } from '@/services/neon/settings'
import CandidaturesTabs from './candidatures-tabs'

export default async function CandidaturesPage() {
  const [candidatures, utilisateurs, settings] = await Promise.all([
    getAllCandidatures(),
    getAllUtilisateurs(),
    getAppSettings(),
  ])
  const utilisateurMap = Object.fromEntries(utilisateurs.map(u => [u.id, u.nomComplet]))
  const actives = candidatures.filter(c => c.statut !== 'Brouillon')

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Candidatures</h1>
        <p className="page-subtitle">{actives.length} candidature{actives.length > 1 ? 's' : ''}</p>
      </div>
      <CandidaturesTabs
        candidatures={actives}
        chercheurMap={utilisateurMap}
        statutColors={settings.statut_colors}
        statutLabelsGestion={settings.statut_labels_gestion}
      />
    </div>
  )
}
