import { verifyInviteToken } from '@/lib/auth'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ token: string }>
}

export default async function RejoindreTokenPage({ params }: Props) {
  const { token } = await params

  let email: string
  try {
    const payload = await verifyInviteToken(token)
    email = payload.email
  } catch {
    redirect('/rejoindre/lien-expire')
  }

  // Redirect to Clerk sign-up with email pre-filled
  redirect(`/sign-up?email=${encodeURIComponent(email)}`)
}
