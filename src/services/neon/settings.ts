import { cache } from 'react'
import { sql } from '@/lib/db'
import {
  STATUT_COLORS,
  STATUT_LABELS,
  STATUT_LABELS_GESTION,
  EVALUATION_COLORS,
  EVALUATION_LABELS,
} from '@/lib/config'

export type AppSettings = {
  statut_colors: Record<string, string>
  statut_labels: Record<string, string>
  statut_labels_gestion: Record<string, string>
  projet_colors: Record<string, string>
  projet_labels: Record<string, string>
  evaluation_colors: Record<string, string>
  evaluation_labels: Record<string, string>
}

const DEFAULTS: AppSettings = {
  statut_colors: { ...STATUT_COLORS },
  statut_labels: { ...STATUT_LABELS },
  statut_labels_gestion: { ...STATUT_LABELS_GESTION },
  projet_colors: {
    'En cours': 'bg-blue-100 text-blue-800',
    'Terminé':  'bg-green-600 text-white',
    'Suspendu': 'bg-orange-50 text-orange-700',
  },
  projet_labels: {
    'En cours': 'En cours',
    'Terminé':  'Terminé',
    'Suspendu': 'Suspendu',
  },
  evaluation_colors: { ...EVALUATION_COLORS },
  evaluation_labels: { ...EVALUATION_LABELS },
}

export const getAppSettings = cache(async (): Promise<AppSettings> => {
  try {
    const rows = await sql`SELECT key, value FROM settings`
    const db: Partial<AppSettings> = {}
    for (const row of rows) {
      if (row.key in DEFAULTS) {
        (db as Record<string, unknown>)[row.key] = row.value
      }
    }
    return { ...DEFAULTS, ...db }
  } catch {
    return DEFAULTS
  }
})

export async function updateSetting(key: keyof AppSettings, value: Record<string, string>) {
  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `
}
