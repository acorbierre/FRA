import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { assertAdmin } from '@/lib/assert-admin'
import { getAllCandidatures, getAllChercheurs } from '@/services/neon'
import { getEvaluationsByCandidature } from '@/services/neon/evaluations'
import { getProjets } from '@/services/neon/projets'
import { getLaboratoires } from '@/services/neon/laboratoires'
import { getConventions } from '@/services/neon/conventions'
import { getVersements } from '@/services/neon/versements'
import { getRapports } from '@/services/neon/rapports'

const client = new Anthropic()

async function buildContext(): Promise<string> {
  const [candidatures, chercheurs, projets, laboratoires, conventions, versements, rapports] = await Promise.all([
    getAllCandidatures(),
    getAllChercheurs(),
    getProjets(),
    getLaboratoires(),
    getConventions(),
    getVersements(),
    getRapports(),
  ])

  const evaluationsParCandidature = await Promise.all(
    candidatures.map(c => getEvaluationsByCandidature(c.id))
  )

  const chercheurMap = Object.fromEntries(chercheurs.map(c => [c.id, c]))

  // Candidatures + évaluations
  const candidaturesStr = candidatures.map((c, i) => {
    const evals = evaluationsParCandidature[i]
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
    `- Convention ID:${c.id} | Statut: ${c.statut}${c.montant ? ` | Montant: ${c.montant.toLocaleString('fr-FR')} €` : ''}`
  ).join('\n')

  // Versements
  const versementsStr = versements.map(v =>
    `- Versement ID:${v.id} | Montant: ${v.montant ? `${v.montant.toLocaleString('fr-FR')} €` : '—'} | Statut: ${v.statut ?? '—'}`
  ).join('\n')

  // Rapports
  const rapportsStr = rapports.map(r =>
    `- Rapport ID:${r.id} | Statut: ${r.statut}${r.dateEcheance ? ` | Échéance: ${r.dateEcheance}` : ''}`
  ).join('\n')

  return `## Candidatures (Appel à projets FRA)

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

${rapportsStr}`
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
