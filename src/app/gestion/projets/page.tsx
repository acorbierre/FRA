import { getProjets } from '@/services/neon'
import { getAppSettings } from '@/services/neon/settings'
import { getThematiques } from '@/services/neon/thematiques'
import ProjetsListe from './projets-list'
import { PageHeader } from '@/components/ui/page-header'
import { PageContainer } from '@/components/ui/page-container'

export default async function ProjetsPage() {
  const [allProjets, settings, thematiques] = await Promise.all([
    getProjets(), getAppSettings(), getThematiques(),
  ])
  const projets = allProjets.filter(p => p.statut === 'Terminé')

  return (
    <PageContainer>
      <PageHeader title="Projets financés" subtitle={`${projets.length} projet${projets.length > 1 ? 's' : ''}`} />

      <ProjetsListe
        projets={projets}
        projetColors={settings.projet_colors}
        projetLabels={settings.projet_labels}
        thematiques={thematiques}
      />
    </PageContainer>
  )
}
