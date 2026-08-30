import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('loads and shows the sign-in entry point', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Queueble' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Log In' })).toBeVisible()
  })

  test('navigates to the Google sign-in page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'Log In' }).first().click()

    await expect(page).toHaveURL(/\/signin$/)
    await expect(page.getByRole('heading', { name: 'Sign in to Queueble' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  })
})

test.describe('Protected routes', () => {
  test('redirects unauthenticated users away from the dashboard', async ({ page }) => {
    await page.goto('/dashboard/home')

    await expect(page).toHaveURL(/\/signin$/)
  })
})
