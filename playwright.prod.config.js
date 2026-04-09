// @ts-check
/** Prod smoke against Vercel (no local webServer). Usage:
 *   npx playwright test -c playwright.prod.config.js --project=chromium
 */
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL:
      process.env.PROD_URL || 'https://iterum-culinary-app.vercel.app',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
