import { getAllCandidatures, getAllUtilisateurs } from '@/services/neon'
import { getAppSettings } from '@/services/neon/settings'
import CandidaturesTabs from './candidatures-tabs'
import { PageHeader } from '@/components/ui/page-header'
import { PageContainer } from '@/components/ui/page-container'

export default async function CandidaturesPage() {
  const [candidatures, utilisateurs, settings] = await Promise.all([
    getAllCandidatures(),
    getAllUtilisateurs(),
    getAppSettings(),
  ])
  const utilisateurMap = Object.fromEntries(utilisateurs.map(u => [u.id, u.nomComplet]))
  const actives = candidatures.filter(c => c.statut !== 'Brouillon')

  return (
    <PageContainer>
      <PageHeader title="Candidatures" subtitle={`${actives.length} candidature${actives.length > 1 ? 's' : ''}`} />
      <CandidaturesTabs
        candidatures={actives}
        chercheurMap={utilisateurMap}
        statutColors={settings.statut_colors}
        statutLabelsGestion={settings.statut_labels_gestion}
      />
    </PageContainer>
  )
}
