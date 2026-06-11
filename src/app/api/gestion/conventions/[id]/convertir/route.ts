import { getConventions, updateConventionProjetId, updateConventionStatut } from '@/services/neon/conventions'
import { getCandidatureById } from '@/services/neon/candidatures'
import { createProjet } from '@/services/neon/projets'
import { createVersement } from '@/services/neon/versements'
import { createJalon } from '@/services/neon/jalons'
interface VersementInput { montant: number; datePrevue: string }

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json() as { versements: VersementInput[] }

  const conventions = await getConventions()
  const convention = conventions.find(c => c.id === id)
  if (!convention) return Response.json({ error: 'Convention introuvable' }, { status: 404 })
  if (convention.projetId) return Response.json({ error: 'Un projet existe déjà pour cette convention' }, { status: 400 })
  if (!convention.candidatureId) return Response.json({ error: 'Convention sans candidature liée' }, { status: 400 })

  const candidature = await getCandidatureById(convention.candidatureId)

  // Créer le projet
  const projet = await createProjet({
    titre: candidature.titre,
    montantAccorde: convention.montantTotal,
    candidatureId: convention.candidatureId,
  })

  // Créer versements + jalons correspondants (1 versement = 1 jalon de type 'versement')
  const valides = body.versements
    .map((v, i) => ({ ...v, numero: i + 1 }))
    .filter(v => v.montant > 0 && v.datePrevue)

  await Promise.all(valides.flatMap(v => [
    createVersement({ conventionId: id, numero: v.numero, montant: v.montant, datePrevue: v.datePrevue }),
    createJalon({ projetId: projet.id, type: 'versement', label: `Versement ${v.numero}`, montant: v.montant, datePrevue: v.datePrevue }),
  ]))

  // Marquer la convention comme terminée
  await updateConventionProjetId(id, projet.id)
  await updateConventionStatut(id, 'Terminée')

  return Response.json({ projet })
}
