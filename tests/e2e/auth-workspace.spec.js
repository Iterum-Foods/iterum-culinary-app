// @ts-check
const { test, expect } = require('@playwright/test');

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test.describe('Authenticated workspace (optional)', () => {
  test.skip(
    !email || !password,
    'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated E2E'
  );

  test('sign-in reaches dashboard or setup', async ({ page }) => {
    await page.goto('/signin.html');
    await page.locator('#signin-email').fill(email);
    await page.locator('#signin-password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL(/\/(dashboard|setup|mobile-compliance)\.html/, {
      timeout: 45000
    });

    const url = page.url();
    expect(url).toMatch(/dashboard|setup|mobile-compliance/);
    await expect(page.locator('body')).toBeVisible();
  });
});
