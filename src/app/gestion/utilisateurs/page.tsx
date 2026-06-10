import { getAllUtilisateurs } from '@/services/neon'
import UtilisateursListe from './utilisateurs-list'

export default async function UtilisateurPage() {
  const tous = await getAllUtilisateurs()
  const utilisateurs = tous.filter(u => !u.role.includes('Admin') && !u.role.includes('Super-Admin'))

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Utilisateurs</h1>
        <p className="page-subtitle">{utilisateurs.length} membre{utilisateurs.length > 1 ? 's' : ''} enregistré{utilisateurs.length > 1 ? 's' : ''}</p>
      </div>

      <UtilisateursListe utilisateurs={utilisateurs} />
    </div>
  )
}
