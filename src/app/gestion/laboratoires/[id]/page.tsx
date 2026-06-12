import { getLaboratoireById, getAllUtilisateurs } from '@/services/neon'
import { sql } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Globe, MapPin, Map } from 'lucide-react'

export default async function LaboratoireFichePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [labo, utilisateurs, carteRows] = await Promise.all([
    getLaboratoireById(id),
    getAllUtilisateurs(),
    sql`SELECT id FROM carte_laboratoires WHERE labo_neon_id = ${id} LIMIT 1`,
  ])
  const carteLabId = carteRows[0]?.id ?? null

  // Membres liés à ce labo (via champ déclaratif — correspondance approximative sur nom)
  const membres = utilisateurs.filter(c =>
    c.laboratoireDeclaratif?.toLowerCase().includes(labo.nom.toLowerCase()) ||
    c.laboratoireId?.includes(id)
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/gestion/laboratoires" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="size-4" /> Laboratoires
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="page-title">{labo.nom}</h1>
          {carteLabId && (
            <Link
              href={`/carto?lab=${carteLabId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Map className="size-3" />
              Voir dans la carto
            </Link>
          )}
        </div>
        <p className="page-subtitle">{labo.institution}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            {labo.ville || '—'}
          </div>
          {labo.siteWeb && (
            <a href={labo.siteWeb} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 text-primary hover:underline">
              <Globe className="size-4 shrink-0" />
              {labo.siteWeb}
            </a>
          )}
        </CardContent>
      </Card>

      {membres.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Membres ({membres.length})</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border -my-1">
            {membres.map(c => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{c.nomComplet}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                </div>
                <div className="flex gap-1">
                  {c.role.map(r => (
                    <span key={r} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
