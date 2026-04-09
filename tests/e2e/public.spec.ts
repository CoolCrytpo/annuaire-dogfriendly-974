import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

test.describe('Parcours public', () => {
  test('Page d\'accueil charge correctement', async ({ page }) => {
    await page.goto(BASE)
    await expect(page).toHaveTitle(/Dog Friendly 974/)
    await expect(page.getByRole('heading', { name: /lieux dog-friendly/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Consulter l'annuaire/i })).toBeVisible()
  })

  test('Navigation vers l\'annuaire', async ({ page }) => {
    await page.goto(BASE)
    await page.click('text=Annuaire')
    await expect(page).toHaveURL(/\/annuaire/)
    await expect(page.getByRole('heading', { name: /Annuaire dog-friendly/i })).toBeVisible()
  })

  test('Navigation vers la carte', async ({ page }) => {
    await page.goto(BASE)
    await page.click('text=Carte')
    await expect(page).toHaveURL(/\/carte/)
    await expect(page.getByRole('heading', { name: /Carte/i })).toBeVisible()
  })

  test('Page annuaire - filtres fonctionnels', async ({ page }) => {
    await page.goto(`${BASE}/annuaire`)
    const searchInput = page.locator('input[type="search"]')
    await expect(searchInput).toBeVisible()

    // Filtre par politique chien
    const policySelect = page.locator('select[aria-label*="politique chien"]')
    await expect(policySelect).toBeVisible()
    await policySelect.selectOption('allowed')
    await expect(page).toHaveURL(/dog_policy=allowed/)
  })

  test('Responsive mobile - header', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(BASE)
    await expect(page.locator('header')).toBeVisible()
    await expect(page.getByRole('link', { name: /Proposer un lieu/i })).toBeVisible()
  })
})

test.describe('Formulaire de proposition', () => {
  test('Formulaire est accessible', async ({ page }) => {
    await page.goto(`${BASE}/proposer`)
    await expect(page.getByRole('heading', { name: /Proposer un lieu/i })).toBeVisible()
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[name="submitted_name"]')).toBeVisible()
  })

  test('Validation côté client - nom requis', async ({ page }) => {
    await page.goto(`${BASE}/proposer`)
    await page.click('button[type="submit"]')
    // Le nom est requis - le formulaire ne doit pas être soumis
    await expect(page.getByRole('heading', { name: /Proposer un lieu/i })).toBeVisible()
  })
})

test.describe('Pages statiques', () => {
  test('Page Méthodologie', async ({ page }) => {
    await page.goto(`${BASE}/methodologie`)
    await expect(page.getByRole('heading', { name: /Méthodologie/i })).toBeVisible()
    await expect(page.getByText(/principe fondateur/i)).toBeVisible()
  })

  test('Page Contact', async ({ page }) => {
    await page.goto(`${BASE}/contact`)
    await expect(page.getByRole('heading', { name: /Contact/i })).toBeVisible()
  })

  test('Page 404 personnalisée', async ({ page }) => {
    const res = await page.goto(`${BASE}/lieu-qui-nexiste-pas-du-tout`)
    expect(res?.status()).toBe(404)
  })
})
