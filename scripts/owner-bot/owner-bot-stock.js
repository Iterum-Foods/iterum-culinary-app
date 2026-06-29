/**
 * Owner Bot — ingredients + food inventory golden path.
 *
 * Usage:
 *   npm run serve:test
 *   npm run owner-bot:stock
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const {
  loadLocalEnv,
  delay,
  trySignIn,
  waitForProjectManager,
  escapeHtml
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

const TEST_ITEMS = [
  { name: 'Bot Roma tomatoes', category: 'vegetables', unit: 'lb', qty: 12, par: 20, reorder: 8 },
  { name: 'Bot chicken thigh', category: 'proteins', unit: 'lb', qty: 25, par: 40, reorder: 15 }
];

class StockReport {
  constructor() {
    this.steps = [];
  }
  add(name, status, details) {
    this.steps.push({ name, status, details });
    console.log(`${status} ${name}: ${details}`);
  }
  addTest(name, status, details) {
    this.add(name, status, details);
  }
}

async function screenshot(page, name) {
  const file = path.join(OUTPUT_DIR, name);
  await page.screenshot({ path: file, fullPage: true });
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

async function runStockFlow(page, report) {
  await page.goto(`${BASE_URL}/stock-setup.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });
  await delay(1500);

  const hasPage = await page
    .locator('#panel-ingredients')
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  report.add(
    'Stock setup page',
    hasPage ? '✅' : '❌',
    hasPage ? 'stock-setup.html loaded' : 'Page not found'
  );
  if (!hasPage) return false;

  const rows = page.locator('[data-ing-row]');
  const rowCount = await rows.count();
  for (let i = 0; i < TEST_ITEMS.length; i++) {
    const item = TEST_ITEMS[i];
    const row = rows.nth(Math.min(i, rowCount - 1));
    if (i >= rowCount) {
      await page.locator('#btn-add-row').click();
      await delay(200);
    }
    const target = rows.nth(i);
    await target.locator('.ing-name').fill(item.name);
    await target.locator('.ing-cat').selectOption(item.category);
    await target.locator('.ing-unit').selectOption(item.unit);
  }

  await screenshot(page, 'stock_01_ingredients.png');
  await page.locator('#btn-save-ingredients').click();
  await delay(1000);

  const onCounts = await page
    .locator('#panel-counts:not(.hidden)')
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  report.add(
    'Step 2 — opening counts',
    onCounts ? '✅' : '❌',
    onCounts ? 'Counts panel visible' : 'Did not advance to step 2'
  );
  if (!onCounts) return false;

  const countRows = page.locator('#count-rows [data-ing-id]');
  const countN = await countRows.count();
  for (let i = 0; i < countN; i++) {
    const item = TEST_ITEMS[i] || TEST_ITEMS[0];
    const row = countRows.nth(i);
    await row.locator('.cnt-qty').fill(String(item.qty));
    await row.locator('.cnt-par').fill(String(item.par));
    await row.locator('.cnt-reorder').fill(String(item.reorder));
  }

  await screenshot(page, 'stock_02_counts.png');

  await Promise.all([
    page.waitForURL(/dashboard\.html/, { timeout: 20000 }).catch(() => null),
    page.locator('#btn-save-counts').click()
  ]);
  await delay(2000);

  const onDash = page.url().includes('dashboard.html');
  report.add(
    'Save & dashboard',
    onDash ? '✅' : '⚠️',
    onDash ? 'Redirected to dashboard' : page.url()
  );

  return onDash;
}

async function verifyInventoryPage(page, report) {
  await page.goto(`${BASE_URL}/inventory.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });
  await delay(2000);

  const state = await readPantryState(page);
  const hasTomato = await page
    .locator('text=Bot Roma tomatoes')
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  report.add(
    'Inventory list',
    hasTomato ? '✅' : '❌',
    `${state.inventoryCount} item(s); tomato row visible=${hasTomato}`
  );
  report.add(
    'Custom ingredients',
    state.customIngredients >= TEST_ITEMS.length ? '✅' : '⚠️',
    `${state.customIngredients} custom ingredient(s)`
  );

  await screenshot(page, 'stock_03_inventory.png');
  return hasTomato && state.inventoryCount >= TEST_ITEMS.length;
}

function writeReport(report, ok) {
  const mdPath = path.join(OUTPUT_DIR, 'stock_flow_report.md');
  const htmlPath = path.join(OUTPUT_DIR, 'stock_flow_report.html');
  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    ok,
    steps: report.steps
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'stock_flow_results.json'), JSON.stringify(payload, null, 2));

  const rows = report.steps
    .map(s => `| ${s.name} | ${s.status} | ${s.details.replace(/\|/g, '\\|')} |`)
    .join('\n');

  fs.writeFileSync(
    mdPath,
    `# Stock flow (ingredients + inventory)\n\n${rows}\n`
  );

  fs.writeFileSync(
    htmlPath,
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Stock flow</title></head><body>
<h1>Stock flow</h1><table border="1" cellpadding="8"><tr><th>Step</th><th>Status</th><th>Details</th></tr>
${report.steps.map(s => `<tr><td>${escapeHtml(s.name)}</td><td>${s.status}</td><td>${escapeHtml(s.details)}</td></tr>`).join('')}
</table></body></html>`
  );
  console.log(`\nReports: ${htmlPath}\n`);
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const report = new StockReport();
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    report.add('Credentials', '❌', 'Set ITERUM_TEST_EMAIL / ITERUM_TEST_PASSWORD');
    writeReport(report, false);
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  page.on('dialog', async d => {
    await d.accept().catch(() => {});
  });

  try {
    const signedIn = await trySignIn(page, BASE_URL, TEST_EMAIL, TEST_PASSWORD, report);
    if (!signedIn) {
      process.exitCode = 1;
      return;
    }
    await waitForProjectManager(page, 15000);

    const flowOk = await runStockFlow(page, report);
    const verifyOk = flowOk ? await verifyInventoryPage(page, report) : false;
    const failed = report.steps.filter(s => s.status === '❌').length;
    writeReport(report, flowOk && verifyOk);
    if (failed || !verifyOk) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
