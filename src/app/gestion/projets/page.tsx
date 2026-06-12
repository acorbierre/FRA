import { getProjets } from '@/services/neon'
import { getAppSettings } from '@/services/neon/settings'
import { getThematiques } from '@/services/neon/thematiques'
import ProjetsListe from './projets-list'

export default async function ProjetsPage() {
  const [allProjets, settings, thematiques] = await Promise.all([
    getProjets(), getAppSettings(), getThematiques(),
  ])
  const projets = allProjets.filter(p => p.statut === 'Terminé')

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Projets financés</h1>
        <p className="page-subtitle">{projets.length} projet{projets.length > 1 ? 's' : ''}</p>
      </div>

      <ProjetsListe
        projets={projets}
        projetColors={settings.projet_colors}
        projetLabels={settings.projet_labels}
        thematiques={thematiques}
      />
    </div>
  )
}
