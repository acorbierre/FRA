import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type EvenementType = 'rapport' | 'projet-debut' | 'projet-fin' | 'convention'

export interface CalendarEvent {
  date: string
  label: string
  type: EvenementType
}

interface Props {
  weekDays: { dateStr: string; dayName: string; dayNum: number }[]
  todayStr: string
  events: CalendarEvent[]
  moreHref?: string
}

const TYPE_STYLES: Record<EvenementType, string> = {
  'rapport':      'bg-amber-100 text-amber-800',
  'projet-debut': 'bg-blue-100 text-blue-800',
  'projet-fin':   'bg-green-100 text-green-800',
  'convention':   'bg-primary/10 text-primary',
}

export default function WeekCalendar({ weekDays, todayStr, events, moreHref }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          Événements cette semaine
          {moreHref && (
            <Link href={moreHref} className="ml-auto text-xs font-normal text-muted-foreground hover:text-primary transition-colors">
              Voir plus →
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map(({ dateStr, dayName, dayNum }) => {
            const isToday = dateStr === todayStr
            const dayEvents = events.filter(e => e.date === dateStr)

            return (
              <div
                key={dateStr}
                className={cn(
                  'flex flex-col gap-1.5 min-h-[100px] rounded-lg p-2',
                  isToday ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-muted/30'
                )}
              >
                {/* Day header */}
                <div className="flex flex-col items-center pb-1 border-b border-border/60">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {dayName}
                  </span>
                  <span className={cn(
                    'text-sm font-semibold leading-none mt-1 size-6 flex items-center justify-center rounded-full',
                    isToday
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground'
                  )}>
                    {dayNum}
                  </span>
                </div>

                {/* Events */}
                <div className="flex flex-col gap-1">
                  {dayEvents.map((e, i) => (
                    <span
                      key={i}
                      className={cn(
                        'text-[10px] leading-tight px-1.5 py-1 rounded font-medium break-words',
                        TYPE_STYLES[e.type]
                      )}
                    >
                      {e.label}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/60">
          {(Object.entries(TYPE_STYLES) as [EvenementType, string][]).map(([type, style]) => (
            <span key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn('size-2.5 rounded-sm inline-block', style)} />
              {type === 'rapport'      && 'Rapport'}
              {type === 'projet-debut' && 'Démarrage projet'}
              {type === 'projet-fin'   && 'Fin de projet'}
              {type === 'convention'   && 'Convention'}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
