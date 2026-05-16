import { getAllChercheurs, getLaboratoires } from '@/services/neon'
import ChercheurLabosTabs from './tabs'

export default async function ChercheurLabosPage() {
  const [tous, labos] = await Promise.all([
    getAllChercheurs(),
    getLaboratoires(),
  ])
  const chercheurs = tous.filter(c => !c.role.includes('Admin') && !c.role.includes('Super-Admin'))

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Chercheurs & laboratoires</h1>
        <p className="page-subtitle">{chercheurs.length} chercheur{chercheurs.length > 1 ? 's' : ''} · {labos.length} laboratoire{labos.length > 1 ? 's' : ''}</p>
      </div>

      <ChercheurLabosTabs chercheurs={chercheurs} labos={labos} />
    </div>
  )
}
