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
vi.mock('@/services/neon/candidatures', () => ({
  countCandidaturesRecues: vi.fn().mockResolvedValue(0),
}))
vi.mock('@/components/layout/gestion-sidebar', () => ({ default: () => null }))
vi.mock('@/components/layout/app-topbar', () => ({ default: () => null }))
vi.mock('@/components/layout/chat-provider', () => ({
  ChatProvider: ({ children }: { children: unknown }) => children,
}))

import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getChercheurByEmail } from '@/services/neon/chercheurs'
import GestionLayout from '@/app/gestion/layout'

function mockUser(email: string, role: string[]) {
  vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as never)
  vi.mocked(clerkClient).mockResolvedValue({
    users: { getUser: vi.fn().mockResolvedValue({ emailAddresses: [{ emailAddress: email }] }) },
  } as never)
  vi.mocked(getChercheurByEmail).mockResolvedValue({ role } as never)
}

beforeEach(() => vi.clearAllMocks())

describe('accès /gestion', () => {
  it('non connecté → redirigé vers /sign-in', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never)
    await GestionLayout({ children: null }).catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/sign-in')
  })

  it('candidat → redirigé vers /espace', async () => {
    mockUser('candidat@test.com', ['Candidat'])
    await GestionLayout({ children: null }).catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/espace')
  })

  it('examinateur → redirigé vers /espace', async () => {
    mockUser('exam@test.com', ['Examinateur'])
    await GestionLayout({ children: null }).catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/espace')
  })

  it('admin → accès autorisé', async () => {
    mockUser('admin@test.com', ['Admin'])
    await GestionLayout({ children: null })
    expect(redirect).not.toHaveBeenCalled()
  })

  it('super-admin → accès autorisé', async () => {
    mockUser('superadmin@test.com', ['Super-Admin'])
    await GestionLayout({ children: null })
    expect(redirect).not.toHaveBeenCalled()
  })
})
