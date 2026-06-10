import { auth, clerkClient } from '@clerk/nextjs/server'
import { getAllUtilisateurs } from '@/services/neon/utilisateurs'
import { getAppSettings } from '@/services/neon/settings'
import { getThematiques } from '@/services/neon/thematiques'
import UsersPanel from './users-panel'
import AdminTabs from './admin-tabs'

export default async function AdminPage() {
  const { userId } = await auth()
  const client = await clerkClient()
  const clerkUser = userId ? await client.users.getUser(userId) : null
  const currentUserEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? ''

  const [users, settings, thematiques] = await Promise.all([
    getAllUtilisateurs(),
    getAppSettings(),
    getThematiques(),
  ])

  // Check which users already have a Clerk account
  const emails = users.map(u => u.email).filter(Boolean)
  const clerkUsers = emails.length
    ? await client.users.getUserList({ emailAddress: emails, limit: 500 })
    : { data: [] }
  const registeredEmails = new Set(
    clerkUsers.data.flatMap(u => u.emailAddresses.map(e => e.emailAddress))
  )

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Administration</h1>
        <p className="page-subtitle">Gestion des utilisateurs et des accès</p>
      </div>
      <AdminTabs
        usersPanel={<UsersPanel users={users} currentUserEmail={currentUserEmail} registeredEmails={registeredEmails} />}
        settings={settings}
        thematiques={thematiques}
      />
    </div>
  )
}
