import { getCandidatureById } from '@/services/neon/candidatures'
import { createConvention, getConventionByCandidatureId } from '@/services/neon/conventions'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const existing = await getConventionByCandidatureId(id)
  if (existing) {
    return Response.json({ convention: existing })
  }

  const candidature = await getCandidatureById(id)
  const convention = await createConvention(id, candidature.budgetDemande, candidature.titre)

  return Response.json({ convention })
}
