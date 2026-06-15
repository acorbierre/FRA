import { getProjets, getAllCandidatures, getConventions, getAllUtilisateurs } from '@/services/neon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DonutChart from '@/components/gestion/donut-chart'
import { PageHeader } from '@/components/ui/page-header'
import { PageContainer } from '@/components/ui/page-container'
import { Microscope, Euro, Users, GraduationCap } from 'lucide-react'
import { APPEL_ANNEE } from '@/lib/config'

export default async function ActivitePage() {
  const annee = parseInt(APPEL_ANNEE)

  const [projets, candidatures, conventions, utilisateurs] = await Promise.all([
    getProjets(),
    getAllCandidatures(),
    getConventions(),
    getAllUtilisateurs(),
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

  // KPI 3 — Lauréats (rôle Lauréat)
  const chercheursLaureats = utilisateurs.filter(u => u.role.includes('Lauréat')).length

  // KPI 4 — Doctorants financés (contrat = Doctorant)
  const doctorantsFinances = utilisateurs.filter(u =>
    u.contrat?.toLowerCase().includes('doctorant')
  ).length

  // Donut thématiques — répartition des montants de financement
  const thematiquesMap: Record<string, number> = {}
  for (const p of projets) {
    if (p.thematique && p.montantAccorde) {
      thematiquesMap[p.thematique] = (thematiquesMap[p.thematique] ?? 0) + p.montantAccorde
    }
  }
  const thematiquesData = Object.entries(thematiquesMap)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }))

  // Donut villes
  const villesMap: Record<string, number> = {}
  for (const p of projets) {
    if (p.ville && p.montantAccorde) {
      villesMap[p.ville] = (villesMap[p.ville] ?? 0) + p.montantAccorde
    }
  }
  const villesData = Object.entries(villesMap)
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
    <PageContainer className="max-w-5xl space-y-8">
      <PageHeader title="Activité de la FRA" subtitle={`Bilan de l'appel à projets ${APPEL_ANNEE}`} />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ icon: Icon, value, label, color }) => (
          <Card key={label} className="shadow-none border border-border">
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

      {/* Donuts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-none border border-border">
          <CardHeader>
            <CardTitle className="text-base">Répartition des financements par thématique</CardTitle>
          </CardHeader>
          <CardContent>
            {thematiquesData.length > 0
              ? <DonutChart data={thematiquesData} currency />
              : <p className="text-sm text-muted-foreground">Aucune donnée.</p>
            }
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border">
          <CardHeader>
            <CardTitle className="text-base">Répartition des financements par ville</CardTitle>
          </CardHeader>
          <CardContent>
            {villesData.length > 0
              ? <DonutChart data={villesData} currency warm />
              : <p className="text-sm text-muted-foreground">Aucune donnée.</p>
            }
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
