import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { id } = await params
    const { prenom, nom, email, role } = await req.json()
    if (!prenom || !nom || !email || !role) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    const nomComplet = `${prenom.trim()} ${nom.trim()}`
    const rows = await sql`
      UPDATE utilisateurs
      SET prenom = ${prenom.trim()}, nom = ${nom.trim()}, nom_complet = ${nomComplet},
          email = ${email.trim().toLowerCase()}, role = ARRAY[${role}]::text[]
      WHERE id = ${id}
      RETURNING *
    `
    if (!rows[0]) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (err) {
    console.error('[admin PATCH]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { id } = await params

    // Get email before deleting from Neon
    const rows = await sql`SELECT email FROM utilisateurs WHERE id = ${id}`
    const email = rows[0]?.email as string | undefined

    await sql`DELETE FROM utilisateurs WHERE id = ${id}`

    // Also delete from Clerk if the user exists there
    if (email) {
      try {
        const client = await clerkClient()
        const clerkUsers = await client.users.getUserList({ emailAddress: [email] })
        if (clerkUsers.data[0]) {
          await client.users.deleteUser(clerkUsers.data[0].id)
        }
      } catch {
        // Not fatal — user may not have signed up yet
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin DELETE]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
