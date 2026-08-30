import { defineConfig, devices } from '@playwright/test'

// Auth (Google OAuth via Supabase) isn't mockable without real credentials, so
// these tests cover unauthenticated flows (landing page, sign-in redirect).
// Extend with an authenticated storageState once a test Supabase user exists.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Reuses your already-running `npm run dev` server if there is one, otherwise
  // starts one for the test run.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
