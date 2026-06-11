const MOIS_COURT = ['JANV', 'FÉV', 'MARS', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC']

interface DateBadgeProps {
  dateStr: string
  size?: 'sm' | 'md'
}

export default function DateBadge({ dateStr, size = 'md' }: DateBadgeProps) {
  const d = new Date(dateStr)
  return (
    <div
      className={`shrink-0 rounded-xl flex flex-col items-center justify-center gap-0.5 ${size === 'sm' ? 'w-11 h-11' : 'w-14 h-14'}`}
      style={{ backgroundColor: 'color-mix(in oklch, var(--color-primary) 10%, white)' }}
    >
      <span
        className={`font-semibold tracking-widest ${size === 'sm' ? 'text-[8px]' : 'text-[9px]'}`}
        style={{ color: 'var(--color-primary)' }}
      >
        {MOIS_COURT[d.getMonth()]}
      </span>
      <span
        className={`font-bold leading-none ${size === 'sm' ? 'text-lg' : 'text-2xl'}`}
        style={{ color: 'var(--color-primary)' }}
      >
        {String(d.getDate()).padStart(2, '0')}
      </span>
    </div>
  )
}
