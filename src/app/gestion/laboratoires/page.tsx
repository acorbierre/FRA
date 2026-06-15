import { getLaboratoires } from '@/services/neon'
import LaboratoiresListe from './laboratoires-list'
import { PageHeader } from '@/components/ui/page-header'
import { PageContainer } from '@/components/ui/page-container'

export default async function LaboratoiresPage() {
  const labos = await getLaboratoires()

  return (
    <PageContainer>
      <PageHeader title="Laboratoires" subtitle={`${labos.length} laboratoire${labos.length > 1 ? 's' : ''}`} />
      <LaboratoiresListe labos={labos} />
    </PageContainer>
  )
}
