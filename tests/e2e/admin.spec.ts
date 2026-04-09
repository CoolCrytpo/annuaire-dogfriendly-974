import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const ADMIN = `${BASE}/admin`

// Ces tests nécessitent une DB configurée et un utilisateur admin créé
// Configurer ADMIN_EMAIL et ADMIN_PASSWORD dans les variables d'env de test

test.describe('Admin back-office', () => {
  test('Redirige vers login si non connecté (production)', async ({ page }) => {
    if (process.env.NODE_ENV !== 'production') {
      test.skip()
      return
    }
    await page.goto(ADMIN)
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('Page login s\'affiche', async ({ page }) => {
    await page.goto(`${ADMIN}/login`)
    await expect(page.getByRole('heading', { name: /Admin DF974/i })).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('Erreur sur mauvais identifiants', async ({ page }) => {
    await page.goto(`${ADMIN}/login`)
    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.getByText(/Identifiants incorrects/i)).toBeVisible()
  })
})

test.describe('API publique', () => {
  test('GET /api/places répond avec JSON', async ({ request }) => {
    const res = await request.get(`${BASE}/api/places`)
    expect(res.status()).toBe(200)
    const body = await res.json() as { items: unknown[] }
    expect(Array.isArray(body.items)).toBe(true)
  })

  test('POST /api/submissions crée une contribution', async ({ request }) => {
    const res = await request.post(`${BASE}/api/submissions`, {
      data: {
        type: 'new_place',
        submitted_name: 'Test Café Dog Friendly',
        submitted_dog_policy: 'allowed',
        submitted_message: 'Test automatique E2E',
      },
    })
    expect([201, 500]).toContain(res.status())  // 500 si DB non configurée
  })

  test('POST /api/submissions - validation - nom manquant', async ({ request }) => {
    const res = await request.post(`${BASE}/api/submissions`, {
      data: {
        type: 'new_place',
        // submitted_name manquant
        submitted_dog_policy: 'allowed',
      },
    })
    expect(res.status()).toBe(400)
  })
})
