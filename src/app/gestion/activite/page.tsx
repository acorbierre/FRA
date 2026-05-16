import { getProjets, getAllCandidatures, getConventions, getAllChercheurs } from '@/services/neon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DonutChart from '@/components/gestion/donut-chart'
import { Microscope, Euro, Users, GraduationCap } from 'lucide-react'
import { APPEL_ANNEE } from '@/lib/config'

export default async function ActivitePage() {
  const annee = parseInt(APPEL_ANNEE)

  const [projets, candidatures, conventions, chercheurs] = await Promise.all([
    getProjets(),
    getAllCandidatures(),
    getConventions(),
    getAllChercheurs(),
  ])

  // KPI 1 — Nouveaux projets de l'année
  const nouveauxProjets = projets.filter(p =>
    p.dateDebut && new Date(p.dateDebut).getFullYear() === annee
  ).length

  // KPI 2 — Fonds attribués cette année (conventions actives liées à des projets démarrés cette année)
  const projetsAnnee = new Set(
    projets.filter(p => p.dateDebut && new Date(p.dateDebut).getFullYear() === annee).map(p => p.id)
  )
  const fondsAttribues = conventions
    .filter(c => c.projetId && projetsAnnee.has(c.projetId))
    .reduce((sum, c) => sum + (c.montantTotal ?? 0), 0)

  // KPI 3 — Chercheurs lauréats (rôle Lauréat)
  const chercheursLaureats = chercheurs.filter(c => c.role.includes('Lauréat')).length

  // KPI 4 — Doctorants financés (contrat = Doctorant)
  const doctorantsFinances = chercheurs.filter(c =>
    c.contrat?.toLowerCase().includes('doctorant')
  ).length

  // Donut thématiques
  const thematiquesMap: Record<string, number> = {}
  for (const c of candidatures) {
    if (c.thematique) thematiquesMap[c.thematique] = (thematiquesMap[c.thematique] ?? 0) + 1
  }
  const thematiquesData = Object.entries(thematiquesMap)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }))

  const kpis = [
    {
      icon: Microscope,
      value: nouveauxProjets,
      label: `nouveau${nouveauxProjets > 1 ? 'x' : ''} projet${nouveauxProjets > 1 ? 's' : ''} de recherche`,
      color: 'text-primary bg-primary/10',
    },
    {
      icon: Euro,
      value: fondsAttribues >= 1_000_000
        ? `${(fondsAttribues / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M€`
        : `${fondsAttribues.toLocaleString('fr-FR')} €`,
      label: 'de fonds attribués',
      color: 'text-green-700 bg-green-50',
    },
    {
      icon: Users,
      value: chercheursLaureats,
      label: `chercheur${chercheursLaureats > 1 ? 's' : ''} soutenu${chercheursLaureats > 1 ? 's' : ''}`,
      color: 'text-blue-700 bg-blue-50',
    },
    {
      icon: GraduationCap,
      value: doctorantsFinances,
      label: `doctorant${doctorantsFinances > 1 ? 's' : ''} financé${doctorantsFinances > 1 ? 's' : ''}`,
      color: 'text-violet-700 bg-violet-50',
    },
  ]

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="page-title">Activité de la FRA</h1>
        <p className="page-subtitle">Bilan de l'appel à projets {APPEL_ANNEE}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ icon: Icon, value, label, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 space-y-3">
              <div className={`size-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{value}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-snug">en {APPEL_ANNEE}</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Donut thématiques */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition des domaines de recherche financés</CardTitle>
        </CardHeader>
        <CardContent>
          {thematiquesData.length > 0
            ? <DonutChart data={thematiquesData} />
            : <p className="text-sm text-muted-foreground">Aucune candidature enregistrée.</p>
          }
        </CardContent>
      </Card>
    </div>
  )
}
