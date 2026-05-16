import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { assertAdmin } from '@/lib/assert-admin'
import { updateProjetTitreCourt } from '@/services/neon'

const anthropic = new Anthropic()

// Génère une suggestion IA (ne sauvegarde pas)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await params
  const { titre } = await request.json()
  if (!titre) return NextResponse.json({ error: 'titre requis' }, { status: 400 })

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      messages: [{
        role: 'user',
        content: `Tu es un expert en communication scientifique française. Raccourcis ce titre de projet en 7 mots maximum, en français uniquement, en conservant les termes scientifiques clés. Le résultat doit sonner comme un titre scientifique français concis et naturel. Réponds uniquement avec le titre raccourci, sans guillemets, sans ponctuation finale, sans aucun mot dans une autre langue.\n\nExemple : "Étude longitudinale des effets du tabac sur le développement cognitif des adolescents" → "Tabac et développement cognitif chez l'adolescent"\n\nTitre : ${titre}`,
      }],
    })

    const block = message.content[0]
    if (block.type !== 'text') return NextResponse.json({ error: 'Réponse inattendue' }, { status: 500 })

    return NextResponse.json({ suggestion: block.text.trim() })
  } catch (err) {
    console.error('[titre-court suggestion]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// Sauvegarde le titre court validé par l'utilisateur
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { titreCourt } = await request.json()
  if (!titreCourt) return NextResponse.json({ error: 'titreCourt requis' }, { status: 400 })

  try {
    await updateProjetTitreCourt(id, titreCourt)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[titre-court save]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
