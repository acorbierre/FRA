import { CalendarDays } from 'lucide-react'
import { getAllJalons } from '@/services/neon/jalons'
import AgendaCalendar, { TYPE_CONFIG } from '@/components/gestion/agenda-calendar'
import { cn } from '@/lib/utils'

export default async function AgendaPage() {
  const jalons = await getAllJalons()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const prochains = jalons
    .filter(j => j.statut !== 'realise')
    .slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-xl font-semibold">Agenda financier</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Jalons de versements, rapports et comités</p>
      </div>

      {/* Prochains jalons */}
      {prochains.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider px-0.5">Prochains jalons</p>
          <div className="grid grid-cols-3 gap-3">
            {prochains.map(j => {
              const cfg = TYPE_CONFIG[j.type]
              const date = new Date(j.datePrevue)
              const isLate = j.statut === 'en_retard'
              return (
                <div
                  key={j.id}
                  className={cn(
                    'rounded-xl border p-4 bg-card space-y-2',
                    isLate ? 'border-red-200' : 'border-border'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border', cfg.color)}>
                      {cfg.label}
                    </span>
                    {isLate && (
                      <span className="text-[10px] font-medium text-red-500">En retard</span>
                    )}
                  </div>
                  <p className="text-sm font-medium leading-snug">{j.label}</p>
                  {j.projetTitre && (
                    <p className="text-xs text-muted-foreground truncate">{j.projetTitre}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <CalendarDays className="size-3 shrink-0" />
                    {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {j.montant && (
                      <span className="ml-auto font-medium text-foreground tabular-nums">
                        {j.montant.toLocaleString('fr-FR')} €
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Calendrier */}
      <div className="bg-card rounded-xl shadow-[0_0_14px_rgba(0,0,0,0.07)] p-5">
        <AgendaCalendar jalons={jalons} />
      </div>
    </div>
  )
}
