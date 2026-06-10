import { z } from 'zod'

// Le driver Neon retourne les colonnes timestamp/date PostgreSQL
// tantôt comme string ISO, tantôt comme objets Date JavaScript.
// Ce helper normalise les deux cas en string avant validation Zod.
const toIsoString = (v: unknown) => {
  if (!(v instanceof Date)) return v
  const p = (n: number) => String(n).padStart(2, '0')
  return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}T${p(v.getHours())}:${p(v.getMinutes())}:${p(v.getSeconds())}.000`
}

export const dbDate     = z.preprocess(toIsoString, z.string())
export const dbDateNull = z.preprocess(toIsoString, z.string().nullable())
export const dbDateOpt  = z.preprocess(toIsoString, z.string().nullish())
