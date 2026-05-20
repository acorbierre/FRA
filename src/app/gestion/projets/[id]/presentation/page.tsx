import { getProjetById, getCandidatureById } from '@/services/neon'
import { getAppSettings } from '@/services/neon/settings'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Euro, Globe, Users, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import ProjetPhotoUpload from '@/components/gestion/projet-photo-upload'

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function duree(debut?: string, fin?: string): string | null {
  if (!debut || !fin) return null
  const mois = Math.round((new Date(fin).getTime() - new Date(debut).getTime()) / (1000 * 60 * 60 * 24 * 30.5))
  if (mois < 12) return `${mois} mois`
  const annees = Math.floor(mois / 12)
  const reste = mois % 12
  return reste > 0 ? `${annees} an${annees > 1 ? 's' : ''} et ${reste} mois` : `${annees} an${annees > 1 ? 's' : ''}`
}

export default async function ProjetPresentationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [projet, settings] = await Promise.all([getProjetById(id), getAppSettings()])

  const candidatureId = projet.candidatureId?.[0]
  const candidature = candidatureId ? await getCandidatureById(candidatureId).catch(() => null) : null

  const statutColor = settings.projet_colors[projet.statut] ?? 'bg-zinc-100 text-zinc-700'
  const statutLabel = settings.projet_labels[projet.statut] ?? projet.statut
  const dureeProjet = duree(projet.dateDebut, projet.dateFinPrevue)

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link
          href="/gestion/projets"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" /> Projets financés
        </Link>
      </div>

      {/* Photo hero */}
      <div className="relative">
        <ProjetPhotoUpload
          projetId={id}
          titre={projet.titre}
          initialPhotoUrl={projet.photo?.[0]?.url}
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold mb-3 ${statutColor}`}>
            {statutLabel}
          </span>
          <h1 className="text-2xl font-bold text-white leading-snug">{projet.titre}</h1>
          {(projet.thematique ?? candidature?.thematique) && (
            <p className="text-sm text-white/70 mt-1.5">{projet.thematique ?? candidature?.thematique}</p>
          )}
        </div>
      </div>

      {/* Description / résumé */}
      {(projet.description || candidature?.resume) && (
        <div>
          <h2 className="text-base font-semibold mb-2">À propos de ce projet</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {projet.description ?? candidature?.resume}
          </p>
        </div>
      )}

      {/* Chiffres clés */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {projet.montantAccorde > 0 && (
          <Card>
            <CardContent className="pt-4 space-y-1">
              <Euro className="size-4 text-muted-foreground" />
              <p className="text-lg font-semibold tabular-nums">{projet.montantAccorde.toLocaleString('fr-FR')} €</p>
              <p className="text-xs text-muted-foreground">Budget alloué</p>
            </CardContent>
          </Card>
        )}
        {projet.ville && (
          <Card>
            <CardContent className="pt-4 space-y-1">
              <MapPin className="size-4 text-muted-foreground" />
              <p className="text-lg font-semibold">{projet.ville}</p>
              <p className="text-xs text-muted-foreground">Ville</p>
            </CardContent>
          </Card>
        )}
        {dureeProjet && (
          <Card>
            <CardContent className="pt-4 space-y-1">
              <CalendarDays className="size-4 text-muted-foreground" />
              <p className="text-lg font-semibold">{dureeProjet}</p>
              <p className="text-xs text-muted-foreground">Durée du projet</p>
            </CardContent>
          </Card>
        )}
        {projet.dimensionInternationale && (
          <Card>
            <CardContent className="pt-4 space-y-1">
              <Globe className="size-4 text-muted-foreground" />
              <p className="text-lg font-semibold">International</p>
              <p className="text-xs text-muted-foreground">Dimension internationale</p>
            </CardContent>
          </Card>
        )}
        {candidature?.dureeMois && (
          <Card>
            <CardContent className="pt-4 space-y-1">
              <Users className="size-4 text-muted-foreground" />
              <p className="text-lg font-semibold">{candidature.dureeMois} mois</p>
              <p className="text-xs text-muted-foreground">Durée prévue initiale</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dates */}
      {(projet.dateDebut || projet.dateFinPrevue) && (
        <div>
          <h2 className="text-base font-semibold mb-3">Calendrier</h2>
          <div className="flex gap-8 text-sm">
            {projet.dateDebut && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Début</p>
                <p className="mt-0.5">{fmtDate(projet.dateDebut)}</p>
              </div>
            )}
            {projet.dateFinPrevue && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  {projet.dateFinReelle ? 'Fin réelle' : 'Fin prévue'}
                </p>
                <p className="mt-0.5">{fmtDate(projet.dateFinReelle ?? projet.dateFinPrevue)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Partenariats */}
      {projet.detailPartenariats && (
        <div>
          <h2 className="text-base font-semibold mb-2">Partenariats</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {projet.detailPartenariats}
          </p>
        </div>
      )}

      {/* Lien gestion */}
      <div className="pt-2 border-t border-border">
        <Link
          href={`/gestion/projets/${id}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Accéder à la fiche de gestion →
        </Link>
      </div>
    </div>
  )
}
