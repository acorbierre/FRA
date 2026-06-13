import Anthropic from '@anthropic-ai/sdk'
import type { Lab } from '@/data/alzheimer-labs'

const client = new Anthropic()

interface Publication {
  title: string
  year: number
  citations: number
}

export async function POST(req: Request) {
  const body = await req.json()
  const lab: Lab = body.lab
  const publications: Publication[] = body.publications ?? []

  const topicsList      = lab.topics?.map(t => t.name).join(', ') ?? '—'
  const pubsList        = publications
    .slice(0, 10)
    .map(p => `- ${p.title} (${p.year}${p.citations ? `, ${p.citations} citations` : ''})`)
    .join('\n')
  const specializationStr =
    lab.alzPubCount && lab.worksCount
      ? `${Math.round((lab.alzPubCount / lab.worksCount) * 100)} %`
      : '—'
  const impactScore =
    lab.citedByCount && lab.worksCount
      ? Math.round(lab.citedByCount / lab.worksCount)
      : null
  const collabsList =
    lab.topCollabs && lab.topCollabs.length > 0
      ? lab.topCollabs.map(c => `${c.nom} (${c.count} pub. communes)`).join(', ')
      : null

  const prompt = `Tu es un expert scientifique travaillant pour la Fondation pour la Recherche sur Alzheimer (FRA), qui finance des projets de recherche sur la maladie d'Alzheimer et les maladies neurodégénératives.

Analyse la pertinence de ce laboratoire pour un financement FRA. Réponds EXACTEMENT dans ce format, sans introduction ni conclusion hors format. Sois ultra-concis : 1 phrase max par point.

IMPORTANT : les données de citations et de spécialisation peuvent être absentes (données non disponibles dans la source, pas absence réelle). Ne pénalise jamais les critères marqués "données non disponibles" — ignore-les simplement. En revanche, le réseau de co-publications est un signal fort : un labo qui co-publie régulièrement avec des spécialistes Alzheimer reconnus est pertinent même si sa spécialisation propre est faible.

## Points forts
2 points maximum, 1 phrase chacun.

## Points faibles
2 points maximum, 1 phrase chacun.

## Bilan
1 phrase. Conclus avec la mention en gras : **Fort intérêt**, **Intérêt modéré** ou **Hors périmètre**.

**Laboratoire :** ${lab.name} (${lab.city}, ${lab.country})
**Publications Alzheimer :** ${lab.alzPubCount ?? '—'}
**Score d'impact :** ${impactScore ? `${impactScore} citations/publication` : 'données non disponibles'}
**Spécialisation Alzheimer :** ${specializationStr !== '—' ? `${specializationStr} des publications` : 'données non disponibles'}
**Réseau de co-publications Alzheimer :** ${collabsList ?? 'données non disponibles'}
**Domaines de recherche :** ${topicsList}
**Publications récentes :**
${pubsList || '— Aucune disponible'}`

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      const stream = client.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 280,
        messages: [{ role: 'user', content: prompt }],
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
