// @ts-check
const { test, expect } = require('@playwright/test');
const profiles = require('../fixtures/project-profiles.json');

test.describe('Landing identity (ICP personas)', () => {
  test('who-its-for maps to three personas', async ({ page }) => {
    await page.goto('/#who-its-for');
    await expect(page.locator('#who-its-for')).toBeVisible();
    await expect(page.locator('[data-persona="owner"]')).toContainText(
      /compliant|HACCP/i
    );
    await expect(page.locator('[data-persona="chef"]')).toContainText(
      /launch|menus/i
    );
    await expect(page.locator('[data-persona="cook"]')).toContainText(
      /career|portable/i
    );
  });

  test('three pillars link to develop, run, archive surfaces', async ({
    page
  }) => {
    await page.goto('/#pillars');
    const develop = page.locator('#pillars a[href="recipe-library.html"]');
    const run = page.locator('#pillars a[href="dashboard.html"]');
    const archive = page.locator('#pillars a[href="archive-hub.html"]');
    await expect(develop).toBeVisible();
    await expect(run).toBeVisible();
    await expect(archive).toBeVisible();
  });
});

for (const profile of profiles) {
  test.describe(`Profile: ${profile.label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('session_active', 'true');
        localStorage.setItem(
          'current_user',
          JSON.stringify({
            userId: 'e2e_profile',
            email: 'e2e@test.local',
            name: 'E2E Profile'
          })
        );
        localStorage.setItem(
          'iterum_operator_profile',
          JSON.stringify({
            roleKey: 'chef_leadership',
            scope: 'single_restaurant',
            features: {}
          })
        );
      });
    });

    for (const entry of profile.paths) {
      test(`${entry.path} loads for ${profile.id}`, async ({ page }) => {
        const res = await page.goto(entry.path);
        expect(res?.ok()).toBeTruthy();
        await expect(page.locator('body')).toBeVisible();
        if (entry.expect) {
          await expect(page.locator('body')).toContainText(
            new RegExp(entry.expect, 'i')
          );
        }
      });
    }
  });
}

test.describe('Workspace identity strip (mock project)', () => {
  test('restaurant project shows owner / run identity on archive hub', async ({
    page
  }) => {
    await page.addInitScript(() => {
      const project = {
        id: 'test_restaurant_ws',
        name: 'Test Bistro',
        type: 'restaurant',
        tags: ['owner-bot'],
        isArchived: false
      };
      localStorage.setItem('iterum_current_project', project.id);
      localStorage.setItem('session_active', 'true');
      localStorage.setItem(
        'current_user',
        JSON.stringify({ userId: 'u_test', email: 'test@local.dev' })
      );
      localStorage.setItem(
        'iterum_projects_user_u_test',
        JSON.stringify([project])
      );
      localStorage.setItem('iterum_current_project_user_u_test', project.id);
    });

    await page.goto('/archive-hub.html');
    await page.waitForFunction(
      () => typeof window.iterumRenderWorkspaceIdentity === 'function',
      { timeout: 15000 }
    );
    await page.evaluate(() => window.iterumRenderWorkspaceIdentity());

    const identity = page.locator('[data-workspace-identity]');
    await expect(identity).toBeVisible();
    await expect(identity).toHaveAttribute('data-persona', 'owner');
    await expect(identity).toHaveAttribute('data-pillar', 'run');
    await expect(identity).toContainText(/Compliance|backup|export/i);
  });

  test('restaurant workspace shows operator identity on recipe library', async ({
    page
  }) => {
    await page.addInitScript(() => {
      const project = {
        id: 'test_bistro_ws',
        name: 'Northside Bistro',
        type: 'restaurant',
        isArchived: false
      };
      localStorage.setItem('iterum_current_project', project.id);
      localStorage.setItem('session_active', 'true');
      localStorage.setItem(
        'current_user',
        JSON.stringify({ userId: 'u_bistro', email: 'bistro@local.dev' })
      );
      localStorage.setItem(
        'iterum_projects_user_u_bistro',
        JSON.stringify([project])
      );
      localStorage.setItem('iterum_current_project_user_u_bistro', project.id);
    });

    await page.goto('/recipe-library.html');
    await page.waitForFunction(
      () => typeof window.iterumRenderWorkspaceIdentity === 'function',
      { timeout: 15000 }
    );
    await page.evaluate(() => window.iterumRenderWorkspaceIdentity());

    const identity = page.locator('[data-workspace-identity]');
    await expect(identity).toBeVisible();
    await expect(identity).toHaveAttribute('data-persona', 'owner');
    await expect(identity).toHaveAttribute('data-pillar', 'run');
    await expect(identity).toContainText(/compliance|restaurant/i);
  });
});
