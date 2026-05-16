import { getAllChercheurs } from '@/services/neon'
import ChercheursListe from './chercheurs-list'

export default async function ChercheurPage() {
  const tous = await getAllChercheurs()
  const chercheurs = tous.filter(c => !c.role.includes('Admin') && !c.role.includes('Super-Admin'))

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Chercheurs</h1>
        <p className="page-subtitle">{chercheurs.length} membre{chercheurs.length > 1 ? 's' : ''} enregistré{chercheurs.length > 1 ? 's' : ''}</p>
      </div>

      <ChercheursListe chercheurs={chercheurs} />
    </div>
  )
}
