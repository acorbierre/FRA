import { getConventions } from '@/services/neon'
import StatutSelect from '@/components/gestion/statut-select'
import type { Convention } from '@/types'

const CONVENTION_STATUTS: Convention['statut'][] = ['En cours', 'Terminée', 'Résiliée']

export default async function ConventionsPage() {
  const conventions = await getConventions()

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Conventions</h1>
        <p className="page-subtitle">{conventions.length} convention{conventions.length > 1 ? 's' : ''}</p>
      </div>

      <div className="rounded-xl bg-background shadow-[0_0_14px_rgba(0,0,0,0.07)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wide bg-muted/40">
              <th className="px-6 py-3 font-medium">Numéro</th>
              <th className="px-4 py-3 font-medium">Montant total</th>
              <th className="px-4 py-3 font-medium">Date signature</th>
              <th className="px-4 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {conventions.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Aucune convention</td></tr>
            )}
            {conventions.map(c => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-3 font-medium">{c.numeroConvention}</td>
                <td className="px-4 py-3 tabular-nums">{(c.montantTotal ?? 0).toLocaleString('fr-FR')} €</td>
                <td className="px-4 py-3 text-muted-foreground">{c.dateSignature ?? '—'}</td>
                <td className="px-4 py-3">
                  <StatutSelect id={c.id} statut={c.statut} options={CONVENTION_STATUTS} endpoint="convention" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
