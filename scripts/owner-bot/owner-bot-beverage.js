/**
 * Owner Bot — beverage menu development (cocktails, wine, beer, mocktails).
 *
 * Usage:
 *   npm run serve:test
 *   npm run owner-bot:beverage
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const {
  loadLocalEnv,
  delay,
  trySignIn,
  waitForProjectManager
} = require('./owner-bot-lib');

loadLocalEnv();

const OUTPUT_DIR =
  process.env.OWNER_BOT_OUTPUT || path.join(__dirname, 'output');
const BASE_URL = (process.env.ITERUM_BASE_URL || 'http://localhost:8080').replace(
  /\/$/,
  ''
);
const HEADLESS = process.env.OWNER_BOT_HEADLESS === 'true';
const TEST_EMAIL = process.env.ITERUM_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.ITERUM_TEST_PASSWORD || '';

const PROJECT_ID = 'bot_beverage_bar';

class MiniReport {
  constructor() {
    this.tests = [];
  }
  addTest(name, status, details = '') {
    this.tests.push({ name, status, details });
    console.log(`${status} ${name}: ${details}`);
  }
}

async function ensureBarProject(page) {
  await page.evaluate(
    ({ projectId }) => {
      const user = window.authManager?.currentUser;
      const uid = user?.userId || user?.id || 'owner_bot';
      const project = {
        id: projectId,
        name: 'Bot — Beverage Bar',
        type: 'restaurant',
        isArchived: false,
        tags: ['owner-bot', 'beverage']
      };
      localStorage.setItem('iterum_current_project', projectId);
      localStorage.setItem('active_project', projectId);
      localStorage.setItem('active_project_name', project.name);
      localStorage.setItem(`iterum_current_project_user_${uid}`, projectId);
      localStorage.setItem(
        `iterum_projects_user_${uid}`,
        JSON.stringify([project])
      );
      if (window.projectManager) {
        window.projectManager.projects = [project];
        window.projectManager.currentProject = project;
        if (window.projectManager.setCurrentProject) {
          window.projectManager.setCurrentProject(projectId);
        }
      }
      document.dispatchEvent(
        new CustomEvent('projectChanged', {
          bubbles: true,
          detail: { projectId, project, userId: uid }
        })
      );
    },
    { projectId: PROJECT_ID }
  );
}

async function waitForBeverageStack(page) {
  return page
    .waitForFunction(
      () =>
        window.MenuPlanFormat &&
        window.MenuBeverageHelper &&
        typeof window.createNewMenuWithOptions === 'function',
      { timeout: 45000 }
    )
    .then(() => true)
    .catch(() => false);
}

async function addDrinkViaHelper(page, menuName, kind, form) {
  return page.evaluate(
    async ({ menuName, kind, form }) => {
      const user = window.authManager?.currentUser;
      const uid = user?.userId || user?.id;
      const menus = JSON.parse(localStorage.getItem(`menus_${uid}`) || '[]');
      const menu = menus.find(m => m.name === menuName);
      if (!menu) {
        return { ok: false, reason: 'menu_not_found' };
      }
      window.currentSelectedMenu = menu;
      if (window.enhancedMenuManager) {
        window.enhancedMenuManager.currentMenu = menu;
        window.enhancedMenuManager.menuItems = menu.items || [];
      }
      const item = window.MenuBeverageHelper.buildMenuItem(kind, form);
      await window.enhancedMenuManager.addMenuItem(item, true);
      const updated = JSON.parse(localStorage.getItem(`menus_${uid}`) || '[]');
      const after = updated.find(m => m.id === menu.id);
      return {
        ok: true,
        itemCount: after?.items?.length || 0,
        lastItem: after?.items?.[after.items.length - 1]?.name
      };
    },
    { menuName, kind, form }
  );
}

async function createBeverageMenu(page, name, menuType) {
  return page.evaluate(
    ({ name, menuType }) => {
      if (typeof window.createNewMenuWithOptions !== 'function') {
        return { ok: false, reason: 'create_fn_missing' };
      }
      window.createNewMenuWithOptions(name, 'Owner bot beverage test', false, {
        menuType
      });
      const user = window.authManager?.currentUser;
      const uid = user?.userId || user?.id;
      const menus = JSON.parse(localStorage.getItem(`menus_${uid}`) || '[]');
      const menu = menus.find(m => m.name === name);
      return {
        ok: Boolean(menu),
        menuType: menu?.menuType,
        categories: menu?.categories || [],
        sections: (menu?.categories || []).length
      };
    },
    { name, menuType }
  );
}

async function runUiCocktailAdd(page) {
  const quickBar = page.locator('#mb-beverage-quick-bar');
  const visible = await quickBar.isVisible({ timeout: 5000 }).catch(() => false);
  if (!visible) {
    return { ok: false, reason: 'quick_bar_hidden' };
  }

  await page.locator('[data-bev-quick="cocktail"]').click();
  await page.locator('#beverage-quick-add-modal').waitFor({
    state: 'visible',
    timeout: 8000
  });
  await page.locator('#bev-name').fill('Bot UI Negroni');
  await page.locator('#bev-price').fill('17');
  await page.locator('#bev-build').fill('1 oz gin\n1 oz campari\n1 oz sweet vermouth');
  await page.locator('#bev-glass').fill('Rocks');
  await page.locator('#bev-garnish').fill('Orange peel');
  await page
    .locator('#beverage-quick-add-modal .btn-primary')
    .last()
    .click();
  await delay(2500);

  const count = await page.evaluate(() => {
    const menu = window.currentSelectedMenu;
    return menu?.items?.length || 0;
  });
  return { ok: count > 0, itemCount: count };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const report = new MiniReport();
  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  try {
    const signedIn = await trySignIn(
      page,
      BASE_URL,
      TEST_EMAIL,
      TEST_PASSWORD,
      report
    );
    if (!signedIn) {
      process.exitCode = 1;
      return;
    }

    console.log('\n=== Beverage menu development ===\n');

    await page.goto(`${BASE_URL}/menu-builder.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await delay(3000);
    await ensureBarProject(page);
    await waitForProjectManager(page);

    const stackReady = await waitForBeverageStack(page);
    report.addTest(
      'Beverage: menu plan stack',
      stackReady ? '✅' : '❌',
      stackReady ? 'MenuPlanFormat + MenuBeverageHelper loaded' : 'scripts missing'
    );
    if (!stackReady) {
      process.exitCode = 1;
      return;
    }

    const cocktailMenuName = 'Bot — Cocktail Menu';
    const created = await createBeverageMenu(page, cocktailMenuName, 'cocktails');
    report.addTest(
      'Beverage: create cocktail menu',
      created.ok ? '✅' : '❌',
      created.ok
        ? `${created.sections} sections · ${created.categories.join(', ')}`
        : created.reason || 'failed'
    );

    await delay(800);
    const quickVisible = await page.evaluate(() => {
      const bar = document.getElementById('mb-beverage-quick-bar');
      window.MenuBeverageHelper?.updateQuickBarVisibility?.();
      return bar && !bar.hidden;
    });
    report.addTest(
      'Beverage: quick-add bar',
      quickVisible ? '✅' : '❌',
      quickVisible ? 'visible for cocktail menu' : 'hidden'
    );

    const cocktailAdd = await addDrinkViaHelper(page, cocktailMenuName, 'cocktail', {
      name: 'Bot Old Fashioned',
      price: '16',
      section: 'Signature Cocktails',
      build: '2 oz bourbon\n0.25 oz demerara\n2 dashes bitters',
      glass: 'Rocks',
      method: 'Stir',
      garnish: 'Orange peel'
    });
    report.addTest(
      'Beverage: add cocktail',
      cocktailAdd.ok ? '✅' : '❌',
      cocktailAdd.ok
        ? `${cocktailAdd.itemCount} items · last: ${cocktailAdd.lastItem}`
        : cocktailAdd.reason || 'failed'
    );

    const wineMenuName = 'Bot — Wine List';
    await createBeverageMenu(page, wineMenuName, 'wine');
    const wineAdd = await addDrinkViaHelper(page, wineMenuName, 'wine', {
      name: 'Sancerre — Pascal Jolivet',
      price: '15',
      section: 'White',
      producer: 'Pascal Jolivet',
      varietal: 'Sauvignon Blanc',
      region: 'Loire Valley',
      vintage: '2023',
      pourSize: '6 oz'
    });
    report.addTest(
      'Beverage: add wine',
      wineAdd.ok ? '✅' : '❌',
      wineAdd.ok ? wineAdd.lastItem : wineAdd.reason || 'failed'
    );

    const barMenuName = 'Bot — Full Bar';
    await createBeverageMenu(page, barMenuName, 'bar-full');
    await delay(600);
    await page.evaluate(name => {
      const user = window.authManager?.currentUser;
      const uid = user?.userId || user?.id;
      const menus = JSON.parse(localStorage.getItem(`menus_${uid}`) || '[]');
      const idx = menus.findIndex(m => m.name === name);
      if (idx >= 0 && typeof window.selectMenuToEdit === 'function') {
        window.selectMenuToEdit(idx);
      }
    }, barMenuName);
    await delay(1200);

    const uiAdd = await runUiCocktailAdd(page);
    report.addTest(
      'Beverage: UI quick-add cocktail',
      uiAdd.ok ? '✅' : '❌',
      uiAdd.ok ? `${uiAdd.itemCount} items on full bar menu` : uiAdd.reason || 'failed'
    );

    const beerAdd = await addDrinkViaHelper(page, barMenuName, 'beer', {
      name: "Jack's Abby House Lager",
      price: '9',
      section: 'Beer',
      brewery: "Jack's Abby",
      style: 'Lager',
      format: 'Draft',
      abv: '5.2'
    });
    report.addTest(
      'Beverage: add beer',
      beerAdd.ok ? '✅' : '❌',
      beerAdd.ok ? beerAdd.lastItem : beerAdd.reason || 'failed'
    );

    const mockAdd = await addDrinkViaHelper(page, barMenuName, 'mocktail', {
      name: 'Cucumber Cooler',
      price: '12',
      section: 'Zero-Proof',
      build: '2 oz cucumber juice\n1 oz lime\nTop soda',
      glass: 'Collins',
      method: 'Build',
      garnish: 'Cucumber ribbon'
    });
    report.addTest(
      'Beverage: add mocktail',
      mockAdd.ok ? '✅' : '❌',
      mockAdd.ok ? mockAdd.lastItem : mockAdd.reason || 'failed'
    );

    const stubCheck = await page.evaluate(() => {
      const stubs = JSON.parse(localStorage.getItem('recipe_stubs') || '[]');
      const barStubs = stubs.filter(
        s =>
          (s.tags || []).some(t => /cocktail|wine|beer|mocktail/i.test(t)) ||
          s.category === 'beverage' ||
          s.glass ||
          s.producer ||
          s.brewery
      );
      return { total: stubs.length, beverageLike: barStubs.length };
    });
    report.addTest(
      'Beverage: recipe stubs',
      stubCheck.beverageLike >= 3 ? '✅' : stubCheck.beverageLike ? '⚠️' : '❌',
      `${stubCheck.beverageLike} bar stubs (${stubCheck.total} total)`
    );

    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'beverage_menu_development.png'),
      fullPage: true
    });

    const failed = report.tests.filter(t => t.status === '❌').length;
    const warn = report.tests.filter(t => t.status === '⚠️').length;
    console.log(
      `\nDone: ${report.tests.length} checks, ${failed} failed, ${warn} warnings`
    );
    if (failed) process.exitCode = 1;
  } finally {
    await delay(500);
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
