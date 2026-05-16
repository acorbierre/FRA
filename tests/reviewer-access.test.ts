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
vi.mock('@/services/neon', () => ({
  getChercheurByEmail: vi.fn(),
  getEvaluationsByReviewer: vi.fn().mockResolvedValue([]),
  getCandidatureById: vi.fn().mockResolvedValue(null),
}))
vi.mock('@/components/layout/reviewer-sidebar', () => ({ default: () => null }))
vi.mock('@/components/layout/app-topbar', () => ({ default: () => null }))

import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getChercheurByEmail } from '@/services/neon'
import ReviewerLayout from '@/app/reviewer/layout'

function mockUser(email: string, role: string[], id = 'chercheur_1') {
  vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as never)
  vi.mocked(clerkClient).mockResolvedValue({
    users: { getUser: vi.fn().mockResolvedValue({ emailAddresses: [{ emailAddress: email }] }) },
  } as never)
  vi.mocked(getChercheurByEmail).mockResolvedValue({ id, role } as never)
}

beforeEach(() => vi.clearAllMocks())

describe('accès /reviewer', () => {
  it('non connecté → redirigé vers /sign-in', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never)
    await ReviewerLayout({ children: null }).catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/sign-in')
  })

  it('candidat → redirigé vers /espace', async () => {
    mockUser('candidat@test.com', ['Candidat'])
    await ReviewerLayout({ children: null }).catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/espace')
  })

  it('admin → redirigé vers /espace', async () => {
    mockUser('admin@test.com', ['Admin'])
    await ReviewerLayout({ children: null }).catch(() => {})
    expect(redirect).toHaveBeenCalledWith('/espace')
  })

  it('examinateur → accès autorisé', async () => {
    mockUser('exam@test.com', ['Examinateur'])
    await ReviewerLayout({ children: null })
    expect(redirect).not.toHaveBeenCalled()
  })
})
