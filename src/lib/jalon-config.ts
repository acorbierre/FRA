import type { JalonType } from './config'

export const TYPE_CONFIG: Record<JalonType, { label: string; color: string; dot: string }> = {
  versement: { label: 'Versement', color: 'bg-primary/15 text-primary border-primary/20',       dot: 'bg-primary' },
  rapport:   { label: 'Rapport',   color: 'bg-amber-50 text-amber-700 border-amber-200',         dot: 'bg-amber-500' },
  comite:    { label: 'Comité',    color: 'bg-blue-50 text-blue-700 border-blue-200',             dot: 'bg-blue-500' },
  autre:     { label: 'Autre',     color: 'bg-muted text-muted-foreground border-border',         dot: 'bg-muted-foreground' },
}
