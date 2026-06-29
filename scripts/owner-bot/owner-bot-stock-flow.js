/**
 * Shared stock-setup flow for owner-bot:stock and owner-bot:onboarding.
 */
const path = require('path');
const { delay } = require('./owner-bot-lib');

const DEFAULT_TEST_ITEMS = [
  {
    name: 'Bot Roma tomatoes',
    category: 'vegetables',
    unit: 'lb',
    qty: 12,
    par: 20,
    reorder: 8
  },
  {
    name: 'Bot chicken thigh',
    category: 'proteins',
    unit: 'lb',
    qty: 25,
    par: 40,
    reorder: 15
  }
];

function reportAdapter(report, stepPrefix) {
  const prefix = stepPrefix ? `${stepPrefix} ` : '';
  return {
    add(name, status, details = '') {
      if (typeof report.addStep === 'function') {
        report.addStep(`${prefix}${name}`, status, details);
      } else if (typeof report.add === 'function') {
        report.add(name, status, details);
      } else if (typeof report.addTest === 'function') {
        report.addTest(name, status, details);
      }
    }
  };
}

async function readPantryState(page) {
  return page.evaluate(() => {
    var custom = 0;
    try {
      if (window.iterumIngredientInventory?.countCustomIngredients) {
        custom = window.iterumIngredientInventory.countCustomIngredients();
      } else {
        var raw = localStorage.getItem('custom_ingredients');
        custom = raw ? JSON.parse(raw).length : 0;
      }
    } catch (e) {
      custom = 0;
    }
    var inv = 0;
    try {
      if (window.iterumIngredientInventory?.getFoodInventoryStats) {
        inv = window.iterumIngredientInventory.getFoodInventoryStats().count;
      } else {
        var invRaw = localStorage.getItem('inventory_items');
        inv = invRaw ? JSON.parse(invRaw).length : 0;
      }
    } catch (e) {
      inv = 0;
    }
    return { customIngredients: custom, inventoryCount: inv };
  });
}

async function runStockFlow(page, baseUrl, report, options = {}) {
  const r = reportAdapter(report, options.stepPrefix);
  const items = options.testItems || DEFAULT_TEST_ITEMS;
  const outputDir = options.outputDir;
  const screenshot = options.screenshot;

  await page.goto(`${baseUrl}/stock-setup.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });
  await delay(1500);

  const hasPage = await page
    .locator('#panel-ingredients')
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  r.add(
    'Stock setup page',
    hasPage ? '✅' : '❌',
    hasPage ? 'stock-setup.html loaded' : 'Page not found'
  );
  if (!hasPage) return false;

  let rows = page.locator('[data-ing-row]');
  let rowCount = await rows.count();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i >= rowCount) {
      await page.locator('#btn-add-row').click();
      await delay(200);
      rows = page.locator('[data-ing-row]');
      rowCount = await rows.count();
    }
    const target = rows.nth(i);
    await target.locator('.ing-name').fill(item.name);
    await target.locator('.ing-cat').selectOption(item.category);
    await target.locator('.ing-unit').selectOption(item.unit);
  }

  if (screenshot && outputDir) {
    await page.screenshot({
      path: path.join(outputDir, screenshot.ingredients || 'stock_01_ingredients.png'),
      fullPage: true
    });
  }

  await page.locator('#btn-save-ingredients').click();
  await delay(1000);

  const onCounts = await page
    .locator('#panel-counts:not(.hidden)')
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  r.add(
    'Opening counts step',
    onCounts ? '✅' : '❌',
    onCounts ? 'Counts panel visible' : 'Did not advance to step 2'
  );
  if (!onCounts) return false;

  const countRows = page.locator('#count-rows [data-ing-id]');
  const countN = await countRows.count();
  for (let i = 0; i < countN; i++) {
    const item = items[i] || items[0];
    const row = countRows.nth(i);
    await row.locator('.cnt-qty').fill(String(item.qty));
    await row.locator('.cnt-par').fill(String(item.par));
    await row.locator('.cnt-reorder').fill(String(item.reorder));
  }

  if (screenshot && outputDir) {
    await page.screenshot({
      path: path.join(outputDir, screenshot.counts || 'stock_02_counts.png'),
      fullPage: true
    });
  }

  await Promise.all([
    page.waitForURL(/dashboard\.html/, { timeout: 20000 }).catch(() => null),
    page.locator('#btn-save-counts').click()
  ]);
  await delay(2000);

  const onDash = page.url().includes('dashboard.html');
  r.add(
    'Stock save → dashboard',
    onDash ? '✅' : '⚠️',
    onDash ? 'Redirected to dashboard' : page.url()
  );

  return onDash;
}

async function verifyInventoryPage(page, baseUrl, report, options = {}) {
  const r = reportAdapter(report, options.stepPrefix);
  const items = options.testItems || DEFAULT_TEST_ITEMS;
  const outputDir = options.outputDir;
  const screenshot = options.screenshot;

  await page.goto(`${baseUrl}/inventory.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });
  await delay(2000);

  const state = await readPantryState(page);
  const probeName = items[0]?.name || 'Bot Roma tomatoes';
  const hasItem = await page
    .locator(`text=${probeName}`)
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  r.add(
    'Inventory list',
    hasItem ? '✅' : '❌',
    `${state.inventoryCount} item(s); "${probeName}" visible=${hasItem}`
  );
  r.add(
    'Custom ingredients',
    state.customIngredients >= items.length ? '✅' : '⚠️',
    `${state.customIngredients} custom ingredient(s)`
  );

  if (screenshot && outputDir) {
    await page.screenshot({
      path: path.join(outputDir, screenshot.inventory || 'stock_03_inventory.png'),
      fullPage: true
    });
  }

  return hasItem && state.inventoryCount >= items.length;
}

async function auditPantryDashboard(page, report, options = {}) {
  const r = reportAdapter(report, options.stepPrefix);

  if (!page.url().includes('dashboard.html')) {
    await page.goto(`${options.baseUrl}/dashboard.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });
    await delay(2000);
  }

  const pantry = await page.evaluate(() => {
    var card = document.getElementById('pantry-starter-card');
    var ready =
      window.iterumIngredientInventory &&
      typeof window.iterumIngredientInventory.isPantryReady === 'function' &&
      window.iterumIngredientInventory.isPantryReady();
    return {
      cardHidden: !card || card.hasAttribute('hidden'),
      pantryReady: !!ready
    };
  });

  r.add(
    'Pantry dashboard card',
    pantry.cardHidden && pantry.pantryReady ? '✅' : '⚠️',
    pantry.pantryReady
      ? 'Pantry complete — starter card hidden'
      : 'Pantry starter card still visible'
  );

  return pantry.pantryReady;
}

module.exports = {
  DEFAULT_TEST_ITEMS,
  runStockFlow,
  verifyInventoryPage,
  auditPantryDashboard,
  readPantryState
};
