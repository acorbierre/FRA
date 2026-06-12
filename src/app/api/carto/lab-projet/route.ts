import { getProjetByLaboNeonId } from '@/services/neon/projets'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const neonId = searchParams.get('neonId')
  if (!neonId) return Response.json({ projet: null })
  const projet = await getProjetByLaboNeonId(neonId)
  if (!projet) return Response.json({ projet: null })
  return Response.json({
    projet: {
      id: projet.id,
      titre: projet.titre,
      statut: projet.statut,
      montantAccorde: projet.montantAccorde,
      dateDebut: projet.dateDebut,
      dateFinPrevue: projet.dateFinPrevue,
    },
  })
}
