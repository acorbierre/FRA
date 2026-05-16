/** Couleurs des pills par rôle (clé = valeur stockée en base) */
export const ROLE_PILL: Record<string, string> = {
  'Super-Admin': 'bg-purple-100 text-purple-700',
  'Admin':       'bg-purple-100 text-purple-700',
  'Examinateur': 'bg-blue-100 text-blue-700',
  'Candidat':    'bg-zinc-100 text-zinc-700',
  'Lauréat':     'bg-green-100 text-green-700',
}

/** Libellés affichés par rôle (clé = valeur stockée en base) */
export const ROLE_LABEL: Record<string, string> = {
  'Super-Admin': 'Super-Admin',
  'Admin':       'Admin',
  'Examinateur': 'Comité scientifique',
  'Candidat':    'Candidat',
  'Lauréat':     'Lauréat',
}

export function rolePillClass(role: string): string {
  return ROLE_PILL[role] ?? 'bg-zinc-100 text-zinc-700'
}

export function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role
}
