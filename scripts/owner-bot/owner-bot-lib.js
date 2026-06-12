/**
 * Shared helpers for Owner Bot scripts.
 */
const fs = require('fs');
const path = require('path');

function loadLocalEnv() {
  const envPath = path.join(__dirname, '.env.owner-bot');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function loadJson(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadTestPlan(testPlanPath) {
  const plan = loadJson(
    testPlanPath || path.join(__dirname, 'iterum_test_plan.json')
  );
  if (!plan) {
    throw new Error(`Test plan not found: ${testPlanPath}`);
  }
  const rbpPath = process.env.RBP_BUSINESS_PLAN_PATH;
  const rbp = loadJson(rbpPath);
  if (rbp) {
    if (rbp.restaurant) plan.restaurant = { ...plan.restaurant, ...rbp.restaurant };
    if (Array.isArray(rbp.menu) && rbp.menu.length) plan.menu = rbp.menu;
    plan._rbpLinked = rbpPath;
  }
  return plan;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function trySignIn(page, baseUrl, email, password, report) {
  if (!email || !password) {
    report?.addTest?.(
      'User authentication',
      '❌',
      'Set ITERUM_TEST_EMAIL and ITERUM_TEST_PASSWORD'
    );
    return false;
  }

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await delay(1500);

  const emailField = page.locator('#signin-email').first();
  if (!(await emailField.isVisible({ timeout: 3000 }).catch(() => false))) {
    await page.goto(`${baseUrl}/signin.html`, { waitUntil: 'domcontentloaded' });
    await delay(1000);
  }

  const emailInput = page.locator('#signin-email').first();
  if (!(await emailInput.isVisible({ timeout: 5000 }).catch(() => false))) {
    report?.addTest?.('User authentication', '❌', 'Sign-in form not found');
    return false;
  }

  await emailInput.fill(email);
  await page.locator('#signin-password').first().fill(password);
  await page.locator('#signin-btn, button[type="submit"]').first().click();
  await delay(5000);

  report?.addTest?.('User authentication', '✅', `Signed in as ${email}`);
  return true;
}

async function waitForProjectManager(page, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = await page.evaluate(() => {
      return Boolean(
        window.projectManager &&
          Array.isArray(window.projectManager.projects) &&
          window.projectManager.currentUserId
      );
    });
    if (ready) return true;
    await delay(400);
  }
  return false;
}

module.exports = {
  loadLocalEnv,
  loadJson,
  loadTestPlan,
  delay,
  trySignIn,
  waitForProjectManager
};
