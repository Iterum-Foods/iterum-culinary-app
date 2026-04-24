// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Smoke', () => {
  test('landing / index loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Iterum/i);
  });

  test('sign-in page loads', async ({ page }) => {
    await page.goto('/signin.html');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('dashboard HTML is served', async ({ page }) => {
    const res = await page.goto('/dashboard.html');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('menu builder page loads', async ({ page }) => {
    const res = await page.goto('/menu-builder.html');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('mobile compliance (line log) page loads', async ({ page }) => {
    const res = await page.goto('/mobile-compliance.html');
    expect(res?.ok()).toBeTruthy();
    await expect(page).toHaveTitle(/Shift|Iterum/i);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /what you need for your shift/i
      })
    ).toBeVisible();
  });

  test('project hub page loads', async ({ page }) => {
    const res = await page.goto('/project-hub.html');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('vendor management page loads', async ({ page }) => {
    const res = await page.goto('/vendor-management.html');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('h1')).toContainText(/Vendor/i);
    await expect(page.locator('body')).toContainText(
      /workspace price overrides/i
    );
  });

  test('workspace setup page loads', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('session_active', 'true');
      localStorage.setItem(
        'current_user',
        JSON.stringify({ name: 'Smoke Test', email: 'smoke@test.local' })
      );
    });
    const res = await page.goto('/setup.html');
    expect(res?.ok()).toBeTruthy();
    await expect(
      page.getByRole('heading', { name: /set up your workspace/i })
    ).toBeVisible();
    await expect(page.getByText(/first 10 minutes/i)).toBeVisible();
  });
});
