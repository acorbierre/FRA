import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { submitEvaluation } from '@/services/neon'
import { updateCandidature } from '@/services/neon'
import { getUtilisateurByEmail } from '@/services/neon/utilisateurs'
import { createNotification } from '@/services/neon/notifications'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  // Vérifier que l'évaluation appartient bien au reviewer authentifié
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const email = user.emailAddresses[0]?.emailAddress
  const utilisateur = email ? await getUtilisateurByEmail(email) : null
  if (!utilisateur) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 403 })

  const rows = await sql`SELECT reviewer_id FROM evaluations WHERE id = ${id}`
  if (!rows[0]) return NextResponse.json({ error: 'Évaluation introuvable' }, { status: 404 })
  if (rows[0].reviewer_id !== utilisateur.id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await req.json()
  const { noteExperience, noteQuestion, noteMethodes, commentaire } = body

  if ([noteExperience, noteQuestion, noteMethodes].some(n => typeof n !== 'number' || n < 10 || n > 20)) {
    return NextResponse.json({ error: 'Notes invalides (0-20)' }, { status: 400 })
  }

  try {
    const evaluation = await submitEvaluation(id, { noteExperience, noteQuestion, noteMethodes, commentaire })

    // Passe en "En délibération CS" uniquement si tous les examinateurs ont transmis leur note
    const rows = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE statut = 'Soumise')::int AS soumises
      FROM evaluations
      WHERE candidature_id = ${evaluation.candidatureId}
    `
    const { total, soumises } = rows[0] as { total: number; soumises: number }
    if (total > 0 && total === soumises) {
      await updateCandidature(evaluation.candidatureId, { statut: 'En délibération CS' })
    }

    await createNotification(
      'evaluation_transmise',
      `Évaluation transmise par ${utilisateur.nomComplet ?? utilisateur.prenom ?? 'un examinateur'}`,
      evaluation.candidatureId,
      (() => {
        const neonPhoto = utilisateur.photo?.[0]?.url
        if (neonPhoto?.startsWith('http')) return neonPhoto
        return user.hasImage ? user.imageUrl : undefined
      })(),
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
