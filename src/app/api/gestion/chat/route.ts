import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { assertAdmin } from '@/lib/assert-admin'
import { getAllCandidatures, getAllChercheurs } from '@/services/neon'
import { getAllEvaluations } from '@/services/neon/evaluations'
import { getProjets } from '@/services/neon/projets'
import { getLaboratoires } from '@/services/neon/laboratoires'
import { getConventions } from '@/services/neon/conventions'
import { getVersements } from '@/services/neon/versements'
import { getRapports } from '@/services/neon/rapports'
import { getAllJalons } from '@/services/neon/jalons'
import { sql } from '@/lib/db'

const client = new Anthropic()

async function buildContext(): Promise<string> {
  const [candidatures, chercheurs, projets, laboratoires, conventions, versements, rapports, jalons, toutesEvaluations, carteLabs] = await Promise.all([
    getAllCandidatures(),
    getAllChercheurs(),
    getProjets(),
    getLaboratoires(),
    getConventions(),
    getVersements(),
    getRapports(),
    getAllJalons(),
    getAllEvaluations(),
    sql`SELECT nom, ville, pays, type, fra_funded FROM carte_laboratoires ORDER BY fra_funded DESC, nom ASC`,
  ])

  const evalMap = toutesEvaluations.reduce<Record<string, typeof toutesEvaluations>>((acc, e) => {
    ;(acc[e.candidatureId] ??= []).push(e)
    return acc
  }, {})

  const chercheurMap = Object.fromEntries(chercheurs.map(c => [c.id, c]))

  // Candidatures + évaluations
  const candidaturesStr = candidatures.map((c) => {
    const evals = evalMap[c.id] ?? []
    const candidat = c.chercheurId ? chercheurMap[c.chercheurId] : null
    const evalsStr = evals.length > 0
      ? evals.map(e => {
          const reviewer = e.reviewerNom ?? e.reviewerId
          const notes = e.noteFinale !== null
            ? `Moyenne: ${e.noteFinale}/20 (expérience: ${e.noteExperience}, question: ${e.noteQuestion}, méthodes: ${e.noteMethodes})`
            : 'Pas encore noté'
          const commentaire = e.commentaire ? ` — "${e.commentaire}"` : ''
          return `  - ${reviewer} | ${notes}${commentaire}`
        }).join('\n')
      : '  - Aucune évaluation assignée'

    return `### Candidature ID:${c.id}
Titre: ${c.titre ?? '—'}
Candidat: ${candidat?.nomComplet ?? '—'} (${candidat?.email ?? '—'})
Statut: ${c.statut}
Thématique: ${c.thematique ?? '—'}
Budget demandé: ${c.budgetDemande ? `${c.budgetDemande.toLocaleString('fr-FR')} €` : '—'}
Durée: ${c.dureeMois ? `${c.dureeMois} mois` : '—'}
Résumé: ${c.resume ?? '—'}
Partenaires: ${c.partenaires ?? '—'}
Évaluations:
${evalsStr}`
  }).join('\n\n')

  // Chercheurs
  const chercheursStr = chercheurs.map(c =>
    `- ${c.nomComplet} (${c.email}) | Rôles: ${c.role.join(', ')} | Labo: ${c.laboratoireDeclaratif ?? '—'}`
  ).join('\n')

  // Projets financés
  const projetsStr = projets.map(p =>
    `### Projet ID:${p.id}
Titre: ${p.titre}${p.titreCourt ? ` (${p.titreCourt})` : ''}
Thématique: ${p.thematique ?? '—'}
Ville: ${p.ville ?? '—'}
Année sélection: ${p.anneeSelection ?? '—'}
International: ${p.dimensionInternationale ? 'Oui' : 'Non'}
Statut: ${p.statut}
Montant accordé: ${p.montantAccorde ? `${p.montantAccorde.toLocaleString('fr-FR')} €` : '—'}
Début: ${p.dateDebut ?? '—'} | Fin prévue: ${p.dateFinPrevue ?? '—'}${p.dateFinReelle ? ` | Fin réelle: ${p.dateFinReelle}` : ''}`
  ).join('\n\n')

  // Laboratoires
  const laboratoiresStr = laboratoires.map(l =>
    `- ${l.nom}${l.institution ? ` (${l.institution})` : ''}${l.ville ? ` — ${l.ville}` : ''}`
  ).join('\n')

  // Conventions
  const conventionsStr = conventions.map(c =>
    `- Convention ${c.numeroConvention} (ID:${c.id}) | Projet ID: ${c.projetId ?? '—'} | Statut: ${c.statut} | Montant: ${c.montantTotal ? `${c.montantTotal.toLocaleString('fr-FR')} €` : '—'} | Signature: ${c.dateSignature ?? '—'}`
  ).join('\n')

  // Versements
  const versementsStr = versements.map(v =>
    `- ${v.reference} n°${v.numero} (ID:${v.id}) | Convention ID: ${v.conventionId ?? '—'} | Montant: ${v.montant ? `${v.montant.toLocaleString('fr-FR')} €` : '—'} | Statut: ${v.statut ?? '—'} | Prévu: ${v.datePrevue ?? '—'} | Réalisé: ${v.dateRealisee ?? '—'}`
  ).join('\n')

  // Rapports
  const rapportsStr = rapports.map(r =>
    `- ${r.reference} (ID:${r.id}) | Projet ID: ${r.projetId ?? '—'} | Type: ${r.type} | Statut: ${r.statut} | Échéance: ${r.dateAttendue ?? '—'} | Soumis: ${r.dateSoumission ?? '—'} | Reçu: ${r.dateReception ?? '—'}${r.enRetard ? ' | EN RETARD' : ''}${r.notes ? ` | Notes: ${r.notes}` : ''}`
  ).join('\n')

  // Jalons
  const jalonsStr = jalons.map(j =>
    `- Jalon ID:${j.id} | Projet: ${j.projetTitre ?? j.projetId} | Type: ${j.type} | ${j.label} | Prévu: ${j.datePrevue}${j.dateReelle ? ` | Réalisé: ${j.dateReelle}` : ''} | Statut: ${j.statut}${j.montant ? ` | Montant: ${j.montant.toLocaleString('fr-FR')} €` : ''}`
  ).join('\n')

  // Cartographie des labos de recherche
  const carteLabsStr = (carteLabs as any[]).map(l =>
    `- ${l.nom} | ${l.ville}${l.pays && l.pays !== 'France' ? `, ${l.pays}` : ''} | ${l.fra_funded ? 'Soutenu par la FRA' : 'Labo partenaire'}`
  ).join('\n')

  return `## Cartographie des laboratoires de recherche (${(carteLabs as any[]).length} labos)

${carteLabsStr}

## Candidatures (Appel à projets FRA)

${candidaturesStr}

## Chercheurs et membres

${chercheursStr}

## Projets de recherche financés

${projetsStr}

## Laboratoires

${laboratoiresStr}

## Conventions

${conventionsStr}

## Versements

${versementsStr}

## Rapports d'activité

${rapportsStr}

## Jalons

${jalonsStr}`
}

export async function POST(req: Request) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { messages } = await req.json()

  const context = await buildContext()

  const systemPrompt = `Tu es un assistant IA intégré au portail de gestion de la Fondation pour la Recherche (FRA). Tu as accès en temps réel à toutes les données du portail.

Réponds toujours en français, de manière précise et structurée. Utilise des titres en gras pour structurer tes réponses longues.

IMPORTANT — Citations de sources : chaque fois que tu mentionnes une candidature ou un projet spécifique, tu DOIS citer la source avec ce format exactement, placé en fin de phrase ou de paragraphe :
- Pour une candidature : [SOURCE:/gestion/candidatures/ID|Titre court]
- Pour un projet financé : [SOURCE:/gestion/projets/ID/presentation|Titre court]

Remplace ID par l'identifiant exact. Ne génère jamais de sources fictives. Si tu ne sais pas, dis-le.

--- DONNÉES DU PORTAIL ---

${context}`

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      const stream = client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages,
      })
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
