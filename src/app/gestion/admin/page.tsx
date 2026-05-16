import { auth, clerkClient } from '@clerk/nextjs/server'
import { getAllChercheurs } from '@/services/neon/chercheurs'
import UsersPanel from './users-panel'

export default async function AdminPage() {
  const { userId } = await auth()
  const client = await clerkClient()
  const clerkUser = userId ? await client.users.getUser(userId) : null
  const currentUserEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? ''

  const users = await getAllChercheurs()

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
      <UsersPanel users={users} currentUserEmail={currentUserEmail} registeredEmails={registeredEmails} />
    </div>
  )
}
