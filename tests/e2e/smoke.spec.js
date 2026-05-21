// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Smoke', () => {
  const basicPages = [
    { name: 'landing / index', path: '/', title: /Iterum/i },
    { name: 'dashboard HTML', path: '/dashboard.html' },
    { name: 'menu builder', path: '/menu-builder.html' },
    { name: 'project hub', path: '/project-hub.html' },
    { name: 'equipment management', path: '/equipment-management.html' }
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
      if (path === '/equipment-management.html') {
        await expect(page).toHaveTitle(/Equipment/i);
      }
      if (path === '/project-hub.html') {
        await expect(page.locator('[data-hub-section="team"]')).toHaveCount(1);
        await expect(page.locator('#team-members-tbody')).toHaveCount(1);
      }
    });
  });

  test('project hub team tab deep link', async ({ page }) => {
    await page.goto('/project-hub.html#team');
    await expect(page.locator('#hub-tab-team')).toBeVisible();
    await expect(page.locator('#hub-tab-workspaces')).toBeHidden();
    await expect(page.getByRole('heading', { name: /Team management/i })).toBeVisible();
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
    await expect(page.locator('[data-hub-tab="recipes"]')).toHaveCount(2);
    await expect(page.locator('[data-hub-tab="jobs"]')).toHaveCount(2);
  });

  test('mobile menu panel markup is present', async ({ page }) => {
    await page.goto('/mobile-compliance.html');
    await expect(page.locator('#panel-section-menu')).toHaveCount(1);
    await expect(page.locator('#menu-published-body')).toHaveCount(1);
  });

  test('FOH first shift quick card loads', async ({ page }) => {
    const res = await page.goto('/foh-first-shift.html');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /FOH|first shift/i
    );
    await expect(
      page.getByRole('link', { name: 'Open shift app' })
    ).toBeVisible();
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
    await expect(
      page.locator('#vendor-price-overrides-panel-root')
    ).toHaveCount(1);
  });

  test('recipe library page loads', async ({ page }) => {
    const res = await page.goto('/recipe-library.html');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('h1')).toContainText(/Recipe Library/i);
  });

  test('ingredients page loads', async ({ page }) => {
    const res = await page.goto('/ingredients.html');
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('h1')).toContainText(
      /Master ingredient library/i
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

  test('privacy policy page loads', async ({ page }) => {
    const res = await page.goto('/privacy.html');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();
    await expect(page.locator('body')).toContainText(/Firebase/i);
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
      page.getByRole('heading', { name: /set up your operator profile/i })
    ).toBeVisible();
    await expect(page.getByText(/first 10 minutes/i)).toBeVisible();
  });
});
