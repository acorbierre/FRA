import { z } from 'zod'

// Le driver Neon retourne les colonnes timestamp/date PostgreSQL
// tantôt comme string ISO, tantôt comme objets Date JavaScript.
// Ce helper normalise les deux cas en string avant validation Zod.
const toIsoString = (v: unknown) => v instanceof Date ? v.toISOString() : v

export const dbDate     = z.preprocess(toIsoString, z.string())
export const dbDateNull = z.preprocess(toIsoString, z.string().nullable())
export const dbDateOpt  = z.preprocess(toIsoString, z.string().nullish())
