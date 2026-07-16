// @ts-check
const { test, expect } = require('@playwright/test');

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

async function signIn(page) {
  await page.goto('/signin.html');
  await page.locator('#signin-email').fill(email);
  await page.locator('#signin-password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|setup|mobile-compliance)\.html/, {
    timeout: 45000
  });
}

test.describe('Authenticated workspace (optional)', () => {
  test.skip(
    !email || !password,
    'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated E2E'
  );

  test('sign-in reaches dashboard or setup', async ({ page }) => {
    await signIn(page);
    const url = page.url();
    expect(url).toMatch(/dashboard|setup|mobile-compliance/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('dashboard shows workspace save indicator when signed in', async ({
    page
  }) => {
    await signIn(page);
    await page.goto('/dashboard.html');
    await expect(page.locator('[data-workspace-save-indicator]')).toHaveCount(
      1
    );
    await expect(page.locator('.iterum-workspace-banner')).toContainText(
      /Workspace/i
    );
  });

  test('project hub team tab loads when signed in', async ({ page }) => {
    await signIn(page);
    await page.goto('/project-hub.html#team');
    await expect(page.locator('#hub-tab-team')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Team management/i })
    ).toBeVisible();
  });
});
