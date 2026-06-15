import { getAllUtilisateurs } from '@/services/neon'
import UtilisateursListe from './utilisateurs-list'
import { PageHeader } from '@/components/ui/page-header'
import { PageContainer } from '@/components/ui/page-container'

export default async function UtilisateurPage() {
  const tous = await getAllUtilisateurs()
  const utilisateurs = tous.filter(u => !u.role.includes('Admin') && !u.role.includes('Super-Admin'))

  return (
    <PageContainer>
      <PageHeader title="Utilisateurs" subtitle={`${utilisateurs.length} membre${utilisateurs.length > 1 ? 's' : ''} enregistré${utilisateurs.length > 1 ? 's' : ''}`} />
      <UtilisateursListe utilisateurs={utilisateurs} />
    </PageContainer>
  )
}
