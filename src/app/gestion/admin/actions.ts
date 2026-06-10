'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { getUtilisateurByEmail } from '@/services/neon/utilisateurs'
import { updateSetting, type AppSettings } from '@/services/neon/settings'
import { createThematique, deleteThematique, getThematiques, updateThematiqueLabel, type Thematique } from '@/services/neon/thematiques'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const { userId } = await auth()
  if (!userId) throw new Error('Non authentifié')
  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const utilisateur = email ? await getUtilisateurByEmail(email) : null
  const isAdmin = utilisateur?.role?.includes('Admin') || utilisateur?.role?.includes('Super-Admin')
  if (!isAdmin) throw new Error('Accès refusé')
}

export async function addThematiqueAction(label: string): Promise<Thematique[]> {
  await assertAdmin()
  await createThematique(label)
  revalidatePath('/gestion', 'layout')
  return getThematiques()
}

export async function updateThematiqueLabelAction(id: number, label: string): Promise<Thematique[]> {
  await assertAdmin()
  await updateThematiqueLabel(id, label)
  revalidatePath('/gestion', 'layout')
  return getThematiques()
}

export async function deleteThematiqueAction(id: number): Promise<Thematique[]> {
  await assertAdmin()
  await deleteThematique(id)
  revalidatePath('/gestion', 'layout')
  return getThematiques()
}

export async function saveAppearanceSettings(
  key: keyof AppSettings,
  value: Record<string, string>
) {
  await assertAdmin()
  await updateSetting(key, value)
  revalidatePath('/gestion', 'layout')
}
