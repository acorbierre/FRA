import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))
vi.mock('@/services/neon/chercheurs', () => ({
  getChercheurByEmail: vi.fn(),
}))

import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getChercheurByEmail } from '@/services/neon/chercheurs'
import Home from '@/app/page'

function mockUser(email: string, role: string[]) {
  vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as never)
  vi.mocked(clerkClient).mockResolvedValue({
    users: { getUser: vi.fn().mockResolvedValue({ emailAddresses: [{ emailAddress: email }] }) },
  } as never)
  vi.mocked(getChercheurByEmail).mockResolvedValue({ role } as never)
}

beforeEach(() => vi.clearAllMocks())

describe('routing page racine /', () => {
  it('non connecté → /sign-in', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never)
    await Home().catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/sign-in')
  })

  it('admin → /gestion', async () => {
    mockUser('admin@test.com', ['Admin'])
    await Home().catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/gestion')
  })

  it('super-admin → /gestion', async () => {
    mockUser('superadmin@test.com', ['Super-Admin'])
    await Home().catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/gestion')
  })

  it('examinateur → /reviewer', async () => {
    mockUser('exam@test.com', ['Examinateur'])
    await Home().catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/reviewer')
  })

  it('candidat → /espace', async () => {
    mockUser('candidat@test.com', ['Candidat'])
    await Home().catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/espace')
  })

  it('utilisateur sans rôle → /espace', async () => {
    mockUser('inconnu@test.com', [])
    await Home().catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/espace')
  })
})
