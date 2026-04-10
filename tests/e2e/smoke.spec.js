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
    await expect(page.getByRole('heading', { name: /fridge temp/i })).toBeVisible();
  });
});
