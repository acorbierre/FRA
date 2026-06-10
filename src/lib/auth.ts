import { SignJWT, jwtVerify } from 'jose'

const inviteSecret  = new TextEncoder().encode(process.env.INVITE_SECRET!)
const sessionSecret = new TextEncoder().encode(process.env.SESSION_SECRET!)

// --- Invitation token (in URL, 7-day expiry) ---

export async function createInviteToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(inviteSecret)
}

export async function verifyInviteToken(token: string): Promise<{ email: string }> {
  const { payload } = await jwtVerify(token, inviteSecret)
  return { email: payload.email as string }
}

// --- Session token (in httpOnly cookie, 30-day expiry) ---

export async function createSessionToken(utilisateurId: string): Promise<string> {
  return new SignJWT({ utilisateurId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(sessionSecret)
}

export async function verifySessionToken(token: string): Promise<{ utilisateurId: string }> {
  const { payload } = await jwtVerify(token, sessionSecret)
  return { utilisateurId: payload.utilisateurId as string }
}

export const SESSION_COOKIE = 'fra_session'
