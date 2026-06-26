// @ts-check
const { test, expect } = require('@playwright/test');

const MOCK_USER = {
  userId: 'e2e_beverage',
  email: 'e2e-beverage@test.local',
  name: 'E2E Beverage'
};

const PROJECT_ID = 'e2e_beverage_project';

function mockSessionInit() {
  return `
    localStorage.setItem('session_active', 'true');
    localStorage.setItem('current_user', ${JSON.stringify(JSON.stringify(MOCK_USER))});
    localStorage.setItem('iterum_operator_profile', JSON.stringify({
      roleKey: 'chef_leadership',
      scope: 'single_restaurant',
      features: {}
    }));
    const project = {
      id: '${PROJECT_ID}',
      name: 'E2E Beverage Bar',
      type: 'restaurant',
      isArchived: false
    };
    localStorage.setItem('iterum_current_project', project.id);
    localStorage.setItem('active_project', project.id);
    localStorage.setItem('iterum_projects_user_${MOCK_USER.userId}', JSON.stringify([project]));
    localStorage.setItem('iterum_current_project_user_${MOCK_USER.userId}', project.id);
  `;
}

test.describe('Beverage menu development', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(mockSessionInit());
  });

  test('menu builder loads beverage stack', async ({ page }) => {
    await page.goto('/menu-builder.html');
    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            Boolean(window.MenuPlanFormat && window.MenuBeverageHelper)
        )
      )
      .toBeTruthy();
  });

  test('create cocktail menu shows quick-add bar and sections', async ({
    page
  }) => {
    await page.goto('/menu-builder.html');
    await page.waitForFunction(() => window.openCreateMenuModal);

    await page.evaluate(() => {
      window.createNewMenuWithOptions(
        'E2E Cocktail Menu',
        'Playwright test',
        false,
        { menuType: 'cocktails' }
      );
    });

    await expect(page.locator('#mb-beverage-quick-bar')).toBeVisible();
    await expect(page.locator('[data-bev-quick="cocktail"]')).toBeVisible();
    await expect(page.locator('#mb-active-menu-title')).toContainText(
      'E2E Cocktail Menu'
    );

    const categories = await page.evaluate(() => {
      const menu = window.currentSelectedMenu;
      return menu?.categories || [];
    });
    expect(categories).toContain('Signature Cocktails');
    expect(categories).toContain('Classics');
  });

  test('quick-add cocktail saves menu item', async ({ page }) => {
    await page.goto('/menu-builder.html');
    await page.waitForFunction(
      () => window.MenuBeverageHelper && window.createNewMenuWithOptions
    );

    await page.evaluate(() => {
      window.createNewMenuWithOptions('E2E Quick Cocktail', '', false, {
        menuType: 'cocktails'
      });
    });

    await page.locator('[data-bev-quick="cocktail"]').click();
    await expect(page.locator('#beverage-quick-add-modal')).toBeVisible();
    await page.locator('#bev-name').fill('E2E Negroni');
    await page.locator('#bev-price').fill('17');
    await page.locator('#bev-build').fill('1 oz gin\n1 oz campari\n1 oz vermouth');
    await page
      .locator('#beverage-quick-add-modal .btn-primary')
      .last()
      .click();

    await expect
      .poll(async () =>
        page.evaluate(() => window.currentSelectedMenu?.items?.length || 0)
      )
      .toBeGreaterThan(0);

    const item = await page.evaluate(() => {
      const m = window.currentSelectedMenu;
      return m?.items?.[0];
    });
    expect(item?.name).toBe('E2E Negroni');
    expect(item?.beverageKind).toBe('cocktail');
    expect(Number(item?.price)).toBe(17);
  });

  test('wine and beer menu formats use correct sections', async ({ page }) => {
    await page.goto('/menu-builder.html');
    await page.waitForFunction(() => window.MenuPlanFormat);

    const wineSections = await page.evaluate(() =>
      window.MenuPlanFormat.previewSectionsForType('wine')
    );
    const beerSections = await page.evaluate(() =>
      window.MenuPlanFormat.previewSectionsForType('beer')
    );

    expect(wineSections).toContain('Sparkling');
    expect(wineSections).toContain('Red');
    expect(beerSections).toContain('On Draft');
    expect(beerSections).toContain('Bottles & Cans');
  });

  test('full bar menu opens kind picker on generic add', async ({ page }) => {
    await page.goto('/menu-builder.html');
    await page.waitForFunction(() => window.MenuBeverageHelper);

    await page.evaluate(() => {
      window.createNewMenuWithOptions('E2E Full Bar', '', false, {
        menuType: 'bar-full'
      });
    });

    await page.evaluate(() => {
      window.MenuBeverageHelper.openQuickAdd({});
    });

    await expect(page.locator('.mb-bev-kind-btn')).toHaveCount(4);
    await expect(page.locator('[data-bev-kind="wine"]')).toBeVisible();
    await expect(page.locator('[data-bev-kind="mocktail"]')).toBeVisible();
  });
});
