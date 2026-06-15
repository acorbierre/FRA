import { getAllUtilisateurs, getLaboratoires } from '@/services/neon'
import UtilisateurLabosTabs from './tabs'
import { PageHeader } from '@/components/ui/page-header'
import { PageContainer } from '@/components/ui/page-container'

export default async function UtilisateurLabosPage() {
  const [tous, labos] = await Promise.all([
    getAllUtilisateurs(),
    getLaboratoires(),
  ])
  const utilisateurs = tous.filter(u => !u.role.includes('Admin') && !u.role.includes('Super-Admin'))

  return (
    <PageContainer>
      <PageHeader title="Labos & chercheurs" subtitle={`${utilisateurs.length} chercheur${utilisateurs.length > 1 ? 's' : ''} · ${labos.length} laboratoire${labos.length > 1 ? 's' : ''}`} />
      <UtilisateurLabosTabs utilisateurs={utilisateurs} labos={labos} />
    </PageContainer>
  )
}
