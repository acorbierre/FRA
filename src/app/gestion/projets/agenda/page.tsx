import { getAllJalons, getVersementsForAgenda } from '@/services/neon/jalons'
import AgendaTabs from './agenda-tabs'

export default async function AgendaPage() {
  const [jalonsRaw, versements] = await Promise.all([getAllJalons(), getVersementsForAgenda()])
  // Les jalons type='versement' sont remplacés par les versements lus directement
  const jalons = [...jalonsRaw.filter(j => j.type !== 'versement'), ...versements]

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Agenda financier</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Jalons de versements, rapports et comités</p>
      </div>

      <AgendaTabs jalons={jalons} />
    </div>
  )
}
