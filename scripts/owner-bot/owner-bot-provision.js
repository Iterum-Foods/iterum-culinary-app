/**
 * Owner Bot — provision restaurant workspace, recipes, and launch menu
 * from iterum_test_plan.json + optional RBP business_plan.json.
 *
 * Usage:
 *   npm run serve:test
 *   npm run owner-bot:provision
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const {
  loadLocalEnv,
  loadTestPlan,
  delay,
  trySignIn
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
const FORCE_NEW = process.env.OWNER_BOT_FORCE_NEW_PROJECT === 'true';

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Runs in the signed-in user's browser via project-hub import (shared rbp-provision.js).
 */
async function provisionInBrowser(page) {
  const forceQs = FORCE_NEW ? '&forceNew=1' : '';
  await page.goto(
    `${BASE_URL}/project-hub.html?importRestaurant=hotchix&owner_bot=1${forceQs}`,
    { waitUntil: 'domcontentloaded', timeout: 45000 }
  );

  await page.waitForFunction(
    () => {
      const status = document.documentElement.getAttribute('data-rbp-provision-done');
      return status === 'ok' || status === 'error' || status === 'cancelled';
    },
    { timeout: 60000 }
  );

  const outcome = await page.evaluate(() => ({
    status: document.documentElement.getAttribute('data-rbp-provision-done'),
    detail: document.documentElement.getAttribute('data-rbp-provision-detail')
  }));

  if (outcome.status !== 'ok') {
    throw new Error(
      `provision failed: ${outcome.status}${outcome.detail ? ` (${outcome.detail})` : ''}`
    );
  }

  return page.evaluate(async () => {
    const pm = window.projectManager;
    const projectId = document.documentElement.getAttribute('data-rbp-provision-detail');
    const project = pm?.projects?.find(p => p.id === projectId);
    const menuRaw = projectId
      ? localStorage.getItem(`menu_data_${projectId}`)
      : null;
    const menuPayload = menuRaw ? JSON.parse(menuRaw) : null;
    const recipes = window.userDataManager?.loadData('recipes') || [];
    const projectRecipes = recipes.filter(
      r => r && (r.projectId === projectId || r.project === projectId)
    );
    return {
      projectId,
      projectName: project?.name || 'Hot Chix Boston',
      recipeCount: projectRecipes.length,
      menuItemCount: menuPayload?.items?.length || 0,
      menuId: menuPayload?.menu?.id,
      menuName: menuPayload?.menu?.name,
      skippedMenuRows: 0
    };
  });
}

async function runProvision() {
  ensureOutputDir();
  const plan = loadTestPlan();
  const restaurantName = plan.restaurant?.name || 'Restaurant';

  console.log('Owner Bot — provision restaurant, menu, recipes\n');
  console.log(`Restaurant: ${restaurantName}`);
  console.log(`Menu items in plan: ${(plan.menu || []).length}`);
  if (plan._rbpLinked) console.log(`RBP: ${plan._rbpLinked}`);

  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  const report = { steps: [] };
  try {
    const signedIn = await trySignIn(
      page,
      BASE_URL,
      TEST_EMAIL,
      TEST_PASSWORD,
      {
        addTest: (name, status, details) => {
          report.steps.push({ name, status, details });
          console.log(`${status} ${name}: ${details}`);
        }
      }
    );
    if (!signedIn) {
      process.exitCode = 1;
      return;
    }

    console.log('\nProvisioning workspace, recipes, and menu (project-hub import)...');
    const result = await provisionInBrowser(page);
    console.log('\nProvisioned:');
    console.log(`  Workspace: ${result.projectName} (${result.projectId})`);
    console.log(`  Recipes:   ${result.recipeCount}`);
    console.log(`  Menu:      ${result.menuName} — ${result.menuItemCount} items`);
    if (result.skippedMenuRows) {
      console.log(`  Skipped:   ${result.skippedMenuRows} modifier/spice rows`);
    }

    await page.goto(`${BASE_URL}/menu-builder.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });
    await delay(2500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'provision_menu_builder.png'),
      fullPage: true
    });

    await page.goto(`${BASE_URL}/recipe-library.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });
    await delay(2500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'provision_recipe_library.png'),
      fullPage: true
    });

    const outPath = path.join(OUTPUT_DIR, 'provision_result.json');
    fs.writeFileSync(
      outPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          restaurant: plan.restaurant,
          result,
          steps: report.steps
        },
        null,
        2
      )
    );
    console.log(`\nSaved: ${outPath}`);
    console.log('\nNext: npm run owner-bot:run — to verify the full owner walkthrough.');
  } catch (err) {
    console.error('Provision failed:', err.message);
    process.exitCode = 1;
  } finally {
    await delay(1000);
    await browser.close();
  }
}

runProvision();
