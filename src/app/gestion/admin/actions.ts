'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { getChercheurByEmail } from '@/services/neon/chercheurs'
import { updateSetting, type AppSettings } from '@/services/neon/settings'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const { userId } = await auth()
  if (!userId) throw new Error('Non authentifié')
  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const chercheur = email ? await getChercheurByEmail(email) : null
  const isAdmin = chercheur?.role?.includes('Admin') || chercheur?.role?.includes('Super-Admin')
  if (!isAdmin) throw new Error('Accès refusé')
}

export async function saveAppearanceSettings(
  key: keyof AppSettings,
  value: Record<string, string>
) {
  await assertAdmin()
  await updateSetting(key, value)
  revalidatePath('/gestion', 'layout')
}
