import { test, expect } from '@playwright/test'

// Helper : connexion via le formulaire Clerk
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function login(page: any, email: string, password: string) {
  await page.goto('/sign-in')
  await page.waitForSelector('input[name="identifier"]', { timeout: 10000 })
  await page.fill('input[name="identifier"]', email)
  await page.click('button[type="submit"]')
  await page.waitForSelector('input[name="password"]', { timeout: 10000 })
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(gestion|espace|reviewer)/, { timeout: 15000 })
}

// Scénario 1 — Non connecté → redirigé vers /sign-in
test('non connecté : redirigé vers /sign-in', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/sign-in/)
})

// Scénario 2 — Admin → redirigé vers /gestion
test('admin : redirigé vers /gestion', async ({ page }) => {
  await login(page, process.env.TEST_ADMIN_EMAIL!, process.env.TEST_ADMIN_PASSWORD!)
  await expect(page).toHaveURL(/\/gestion/)
})

// Scénario 3 — Examinateur → redirigé vers /reviewer
test('examinateur : redirigé vers /reviewer', async ({ page }) => {
  await login(page, process.env.TEST_REVIEWER_EMAIL!, process.env.TEST_REVIEWER_PASSWORD!)
  await expect(page).toHaveURL(/\/reviewer/)
})

// Scénario 4 — Candidat → redirigé vers /espace
test('candidat : redirigé vers /espace', async ({ page }) => {
  await login(page, process.env.TEST_CANDIDAT_EMAIL!, process.env.TEST_CANDIDAT_PASSWORD!)
  await expect(page).toHaveURL(/\/espace/)
})

// Scénario 5 — Candidat ne peut pas accéder à /gestion
test('candidat : accès /gestion refusé', async ({ page }) => {
  await login(page, process.env.TEST_CANDIDAT_EMAIL!, process.env.TEST_CANDIDAT_PASSWORD!)
  await page.goto('/gestion')
  await expect(page).not.toHaveURL(/\/gestion/)
})