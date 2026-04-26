// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Smoke', () => {
  const basicPages = [
    { name: 'landing / index', path: '/', title: /Iterum/i },
    { name: 'dashboard HTML', path: '/dashboard.html' },
    { name: 'menu builder', path: '/menu-builder.html' },
    { name: 'project hub', path: '/project-hub.html' }
  ];

  basicPages.forEach(({ name, path, title }) => {
    test(`${name} loads`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.ok()).toBeTruthy();
      await expect(page.locator('body')).toBeVisible();
      if (title) {
        await expect(page).toHaveTitle(title);
      }
      if (path === '/dashboard.html') {
        await expect(page.locator('body')).toContainText(
          /Operations exceptions/i
        );
      }
    });
  });

  test('sign-in page loads', async ({ page }) => {
    await page.goto('/signin.html');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
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
    await expect(page.locator('#today-panel')).toHaveCount(1);
  });

  test('dashboard checklist deep link opens opening checklist modal', async ({
    page
  }) => {
    const res = await page.goto('/dashboard.html#checklist-opening');
    expect(res?.ok()).toBeTruthy();
    await expect(
      page.locator('.checklist-modal h3', { hasText: /Daily Opening Checklist/i })
    ).toBeVisible();
  });

  test('vendor management page loads', async ({ page }) => {
    const res = await page.goto('/vendor-management.html');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('h1')).toContainText(/Vendor/i);
    await expect(page.locator('body')).toContainText(
      /workspace price overrides/i
    );
  });

  test('spec library page loads', async ({ page }) => {
    const res = await page.goto('/spec-library.html');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('h1')).toContainText(/Spec Library/i);
    await expect(page.locator('body')).toContainText(
      /Central index of product specification links/i
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
