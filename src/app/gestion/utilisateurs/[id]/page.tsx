import { getUtilisateurById } from '@/services/neon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, User } from 'lucide-react'
import { rolePillClass, roleLabel } from '@/lib/role-colors'

export default async function UtilisateurFichePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await getUtilisateurById(id)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/gestion/utilisateurs" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="size-4" /> Utilisateurs
        </Link>

        <div className="flex items-center gap-5">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {c.photo?.[0]?.url ? (
              <Image src={c.photo[0].url} alt={c.nomComplet} width={64} height={64} className="object-cover" />
            ) : (
              <User className="size-7 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="page-title">{c.nomComplet}</h1>
            <div className="flex gap-1.5 mt-1.5">
              {c.role.map(r => (
                <span key={r} className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${rolePillClass(r)}`}>
                  {roleLabel(r)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Coordonnées</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Mail className="size-4 shrink-0" />{c.email}
          </a>
          {c.telephone && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-4 shrink-0" />{c.telephone}
            </p>
          )}
        </CardContent>
      </Card>

      {c.laboratoireDeclaratif && (
        <Card>
          <CardHeader><CardTitle className="text-base">Laboratoire</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">{c.laboratoireDeclaratif}</CardContent>
        </Card>
      )}

      {c.bio && (
        <Card>
          <CardHeader><CardTitle className="text-base">Présentation</CardTitle></CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap text-muted-foreground">{c.bio}</CardContent>
        </Card>
      )}
    </div>
  )
}
