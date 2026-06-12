/**
 * Owner Bot — HACCP + temperature log checks for restaurant projects.
 *
 * Usage:
 *   npm run serve:test
 *   npm run owner-bot:compliance
 */
const { chromium } = require('playwright');
const path = require('path');
const {
  loadLocalEnv,
  delay,
  trySignIn
} = require('./owner-bot-lib');
const { ensureHotChixReady } = require('./owner-bot-workflows');

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

const SKIP_COMPLIANCE =
  process.env.OWNER_BOT_SKIP_COMPLIANCE === 'true' ||
  process.env.OWNER_BOT_SKIP_COMPLIANCE === '1';

class MiniReport {
  constructor() {
    this.tests = [];
    this.issues = [];
  }
  addTest(name, status, details = '') {
    this.tests.push({ name, status, details });
    console.log(`${status} ${name}: ${details}`);
  }
  addIssue(severity, feature, description) {
    this.issues.push({ severity, feature, description });
    console.log(`[${severity}] ${feature}: ${description}`);
  }
}

async function screenshot(page, name) {
  const file = path.join(OUTPUT_DIR, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`Screenshot: ${file}`);
}

async function runFirestoreComplianceBootstrap(page, baseUrl, projectId) {
  const qs = projectId
    ? `compliance_run=1&projectId=${encodeURIComponent(projectId)}`
    : 'compliance_run=1&restaurant=Hot%20Chix';
  await page.goto(`${baseUrl}/dashboard.html?${qs}#temperature`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  await page.waitForFunction(
    () => {
      const s = document.documentElement.getAttribute('data-compliance-done');
      return s === 'ok' || s === 'warn' || s === 'error';
    },
    { timeout: 90000 }
  );

  return page.evaluate(() => ({
    status: document.documentElement.getAttribute('data-compliance-done'),
    detail: document.documentElement.getAttribute('data-compliance-detail')
  }));
}

async function checkDashboardUi(page, report) {
  const tempCard = page.locator('#temperature');
  const haccpCard = page.locator('#haccp');
  const tempVisible = await tempCard.isVisible({ timeout: 8000 }).catch(() => false);
  const haccpVisible = await haccpCard.isVisible({ timeout: 5000 }).catch(() => false);

  const unitRows = await page.locator('#refrigeration-unit-list li').count();
  const sanRows = await page.locator('#sanitizer-location-list li').count();

  const ok = tempVisible && haccpVisible && unitRows > 0 && sanRows > 0;
  report.addTest(
    'Compliance: dashboard HACCP UI',
    ok ? '✅' : tempVisible && haccpVisible ? '⚠️' : '❌',
    `temp units: ${unitRows}, sanitizer stations: ${sanRows}`
  );
  return ok;
}

async function checkMobileCompliance(page, baseUrl, report, projectId) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/mobile-compliance.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });
  await delay(3500);

  const appVisible = await page
    .locator('#app-panel')
    .isVisible({ timeout: 10000 })
    .catch(() => false);
  if (!appVisible) {
    report.addTest('Compliance: mobile shift app', '⚠️', 'Not signed in on shift app');
    await page.setViewportSize({ width: 1400, height: 900 });
    return false;
  }

  if (projectId) {
    const picker = page.locator('#project-picker');
    if (await picker.isVisible({ timeout: 3000 }).catch(() => false)) {
      await picker.selectOption({ value: projectId }).catch(() => {});
      await delay(1200);
    }
  }

  await page.locator('[data-hub-tab="temps"]').first().click();
  await delay(1000);
  await page.locator('#panel-section-temps').waitFor({ state: 'visible', timeout: 8000 });

  const fridgeCount = await page.locator('#fridge-list li').count();
  const sanCount = await page.locator('#san-list li').count();
  const todayLog = await page.locator('#temp-log-today li, #temp-log-today .mc-log-line').count();
  const hasFridgeSection = await page
    .locator('#panel-fridge')
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  const mobileStats = await page.evaluate(() => {
    return { projectId: localStorage.getItem('iterum_current_project') };
  });

  const ok = hasFridgeSection && fridgeCount > 0;
  report.addTest(
    'Compliance: mobile temp & HACCP',
    ok ? '✅' : hasFridgeSection ? '⚠️' : '❌',
    `${fridgeCount} coolers, ${sanCount} sanitizer stations, ${todayLog} temp log lines today · workspace ${mobileStats.projectId || 'n/a'}`
  );

  await page.setViewportSize({ width: 1400, height: 900 });
  return ok;
}

async function runComplianceWorkflows(page, baseUrl, report, options = {}) {
  if (SKIP_COMPLIANCE) {
    report.addTest('Compliance workflows', '⚠️', 'Skipped (OWNER_BOT_SKIP_COMPLIANCE)');
    return null;
  }
  if (!options.signedIn) {
    report.addTest('Compliance workflows', '⚠️', 'Skipped — not signed in');
    return null;
  }

  console.log('\n=== PHASE 3.6: HACCP & temperature logs (restaurant) ===\n');

  const seed = await ensureHotChixReady(page, baseUrl, report);
  const projectId = seed?.projectId || options.projectId;

  const bootstrapResult = await runFirestoreComplianceBootstrap(page, baseUrl, projectId);
  let detail = {};
  try {
    detail = JSON.parse(bootstrapResult.detail || '{}');
  } catch (e) {
    void e;
  }

  const verify = detail.verify || {};
  const bootstrap = detail.bootstrap || {};

  if (bootstrapResult.status === 'error') {
    report.addTest(
      'Compliance: Firestore bootstrap',
      '❌',
      bootstrapResult.detail || 'failed'
    );
    report.addIssue('MAJOR', 'HACCP', 'Could not bootstrap temp/sanitizer for restaurant project');
    return null;
  }

  report.addTest(
    'Compliance: Firestore bootstrap',
    bootstrapResult.status === 'ok' ? '✅' : '⚠️',
    `${bootstrap.units || 0} units, ${bootstrap.locations || 0} stations · logged temp: ${bootstrap.tempLogged ? 'yes' : 'no'}, san: ${bootstrap.sanLogged ? 'yes' : 'no'}`
  );

  const projectOk =
    verify.unitsForProject > 0 &&
    verify.locationsForProject > 0 &&
    verify.tempsProjectToday > 0 &&
    verify.sansProjectToday > 0;

  report.addTest(
    'Compliance: project-scoped logs today',
    projectOk ? '✅' : '⚠️',
    `temp ${verify.tempsProjectToday || 0}/${verify.tempsToday || 0} · sanitizer ${verify.sansProjectToday || 0}/${verify.sansToday || 0} · unscoped temp ${verify.tempsUnscopedToday || 0}`
  );

  if ((verify.tempsUnscopedToday || 0) > 0 || (verify.sansUnscopedToday || 0) > 0) {
    report.addIssue(
      'MINOR',
      'HACCP project scope',
      "Some today's readings lack projectId — they won't filter correctly per restaurant"
    );
  }

  await delay(2000);
  await checkDashboardUi(page, report);
  if (options.screenshot) {
    await options.screenshot('step_compliance_dashboard.png');
  }

  await checkMobileCompliance(page, baseUrl, report, projectId || verify.projectId);
  if (options.screenshot) {
    await options.screenshot('step_compliance_mobile.png');
  }

  return { bootstrap, verify, projectId: projectId || verify.projectId };
}

async function main() {
  const report = new MiniReport();
  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  try {
    const signedIn = await trySignIn(page, BASE_URL, TEST_EMAIL, TEST_PASSWORD, report);
    if (!signedIn) {
      process.exitCode = 1;
      return;
    }
    await runComplianceWorkflows(page, BASE_URL, report, {
      signedIn: true,
      screenshot: name => screenshot(page, name)
    });
    const failed = report.tests.filter(t => t.status === '❌').length;
    if (failed) process.exitCode = 1;
  } finally {
    await delay(800);
    await browser.close();
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runComplianceWorkflows };
