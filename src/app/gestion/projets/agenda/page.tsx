import { getAllJalons } from '@/services/neon/jalons'
import AgendaCalendar from '@/components/gestion/agenda-calendar'
import SyncCalendarButton from '@/components/gestion/sync-calendar-button'

export default async function AgendaPage() {
  const jalons = await getAllJalons()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Agenda financier</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Jalons de versements, rapports et comités</p>
        </div>
        <SyncCalendarButton />
      </div>

      {/* Prochains jalons — TODO: timeline */}

      {/* Calendrier */}
      <div className="bg-card rounded-xl shadow-[0_0_14px_rgba(0,0,0,0.07)] p-5">
        <AgendaCalendar jalons={jalons} />
      </div>
    </div>
  )
}
