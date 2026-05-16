import { getLaboratoires } from '@/services/neon'
import LaboratoiresListe from './laboratoires-list'

export default async function LaboratoiresPage() {
  const labos = await getLaboratoires()

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Laboratoires</h1>
        <p className="page-subtitle">{labos.length} laboratoire{labos.length > 1 ? 's' : ''}</p>
      </div>

      <LaboratoiresListe labos={labos} />
    </div>
  )
}
