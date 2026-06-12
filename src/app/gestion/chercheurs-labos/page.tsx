import { getAllUtilisateurs, getLaboratoires } from '@/services/neon'
import UtilisateurLabosTabs from './tabs'

export default async function UtilisateurLabosPage() {
  const [tous, labos] = await Promise.all([
    getAllUtilisateurs(),
    getLaboratoires(),
  ])
  const utilisateurs = tous.filter(u => !u.role.includes('Admin') && !u.role.includes('Super-Admin'))

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Labos & chercheurs</h1>
        <p className="page-subtitle">{utilisateurs.length} chercheur{utilisateurs.length > 1 ? 's' : ''} · {labos.length} laboratoire{labos.length > 1 ? 's' : ''}</p>
      </div>

      <UtilisateurLabosTabs utilisateurs={utilisateurs} labos={labos} />
    </div>
  )
}
