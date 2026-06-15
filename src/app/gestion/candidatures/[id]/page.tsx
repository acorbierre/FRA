import { getCandidatureById, getUtilisateurById, getUtilisateursByRole, getEvaluationsByCandidature } from '@/services/neon'
import { getConventionByCandidatureId } from '@/services/neon/conventions'
import { getAppSettings } from '@/services/neon/settings'
import { notFound } from 'next/navigation'
import { APPEL_ANNEE } from '@/lib/config'
import { PageContainer } from '@/components/ui/page-container'
import CandidatureDetailTabs from '@/components/gestion/candidature-detail-tabs'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function CandidatureDetailPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<Record<string, string>> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const defaultTab = sp.tab === 'evaluation' ? 'evaluation' : sp.tab === 'convention' ? 'convention' : 'dossier'
  const c = await getCandidatureById(id).catch(() => null)
  if (!c) notFound()

  const [utilisateur, reviewers, evaluations, settings, convention] = await Promise.all([
    c.utilisateurId ? getUtilisateurById(c.utilisateurId).catch(() => null) : Promise.resolve(null),
    getUtilisateursByRole('Examinateur'),
    getEvaluationsByCandidature(id),
    getAppSettings(),
    getConventionByCandidatureId(id),
  ])

  return (
    <PageContainer>

      <div className="flex items-center gap-4">
        <Link href="/gestion/candidatures" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="page-title">Candidature</h1>
          <p className="page-subtitle">Appel à projets {APPEL_ANNEE}</p>
        </div>
      </div>

      <CandidatureDetailTabs
        candidature={c}
        chercheurNom={utilisateur?.nomComplet}
        reviewers={reviewers}
        evaluations={evaluations}
        statutColors={settings.statut_colors}
        statutLabelsGestion={settings.statut_labels_gestion}
        convention={convention}
        defaultTab={defaultTab}
      />

    </PageContainer>
  )
}
