import { getConventions, updateConventionProjetId, updateConventionStatut } from '@/services/neon/conventions'
import { getCandidatureById } from '@/services/neon/candidatures'
import { createProjet } from '@/services/neon/projets'
import { createVersement } from '@/services/neon/versements'
import { createJalon } from '@/services/neon/jalons'
import { sql } from '@/lib/db'

interface VersementInput { montant: number; datePrevue: string }

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json() as {
    versements?: VersementInput[]
    generateOnly?: boolean
    signOnly?: boolean
  }

  const conventions = await getConventions()
  const convention = conventions.find(c => c.id === id)
  if (!convention) return Response.json({ error: 'Convention introuvable' }, { status: 404 })
  if (!convention.candidatureId) return Response.json({ error: 'Convention sans candidature liée' }, { status: 400 })

  // ── Étape 1 : enregistrement des versements ──────────────────────────────
  if (body.generateOnly) {
    const valides = (body.versements ?? [])
      .map((v, i) => ({ ...v, numero: i + 1 }))
      .filter(v => v.montant > 0 && v.datePrevue)

    // Idempotent : supprime les versements existants avant de recréer
    await sql`DELETE FROM versements WHERE convention_id = ${id}`

    await Promise.all(valides.map(v =>
      createVersement({ conventionId: id, numero: v.numero, montant: v.montant, datePrevue: v.datePrevue })
    ))

    return Response.json({ ok: true })
  }

  // ── Étape 2 : signature → création du projet ─────────────────────────────
  if (convention.projetId) return Response.json({ error: 'Un projet existe déjà pour cette convention' }, { status: 400 })

  const candidature = await getCandidatureById(convention.candidatureId)

  const projet = await createProjet({
    titre: candidature.titre,
    montantAccorde: convention.montantTotal,
    candidatureId: convention.candidatureId,
  })

  // Créer les jalons à partir des versements déjà enregistrés
  const versementsRows = await sql`SELECT * FROM versements WHERE convention_id = ${id} ORDER BY numero`
  await Promise.all(versementsRows.map((v: Record<string, unknown>) =>
    createJalon({ projetId: projet.id, type: 'versement', label: `Versement ${v.numero}`, montant: Number(v.montant), datePrevue: String(v.date_prevue) })
  ))

  await updateConventionProjetId(id, projet.id)
  await updateConventionStatut(id, 'Terminée')

  return Response.json({ projet })
}
