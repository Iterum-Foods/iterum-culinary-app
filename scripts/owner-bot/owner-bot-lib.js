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

/** Clear operator profile so post-auth routes to setup.html (simulates first-run). */
async function clearOperatorProfile(page) {
  await page.evaluate(() => {
    try {
      localStorage.removeItem('iterum_operator_profile');
      if (typeof window.clearOperatorProfile === 'function') {
        window.clearOperatorProfile();
      }
    } catch (e) {
      /* ignore */
    }
  });
}

async function trySignUp(page, baseUrl, { name, email, password }, report) {
  if (!email || !password) {
    report?.addTest?.(
      'Sign up',
      '❌',
      'Set email and password (OWNER_BOT_SIGNUP_EMAIL or ITERUM_TEST_EMAIL + OWNER_BOT_SIGNUP=true)'
    );
    return false;
  }

  await page.goto(`${baseUrl}/signin.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });
  await delay(1000);

  const signupTab = page.locator('#tab-signup, [data-tab="signup"]').first();
  if (await signupTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await signupTab.click();
    await delay(400);
  }

  const nameInput = page.locator('#signup-name').first();
  if (!(await nameInput.isVisible({ timeout: 5000 }).catch(() => false))) {
    report?.addTest?.('Sign up', '❌', 'Create-account form not found');
    return false;
  }

  await nameInput.fill(name || 'Owner Bot Test');
  await page.locator('#signup-email').first().fill(email);
  await page.locator('#signup-password').first().fill(password);
  await page.locator('#signup-confirm-password').first().fill(password);
  await page.locator('#signup-btn').first().click();
  await delay(6000);

  const errVisible = await page
    .locator('#signup-password-error.show, #signup-email-error.show')
    .first()
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (errVisible) {
    const errText = await page
      .locator('#signup-password-error, #signup-email-error')
      .first()
      .textContent()
      .catch(() => 'unknown error');
    report?.addTest?.('Sign up', '❌', (errText || '').trim() || 'Sign-up failed');
    return false;
  }

  const url = page.url();
  if (url.includes('signin.html')) {
    report?.addTest?.('Sign up', '⚠️', 'Still on sign-in page — may need email verification');
    return true;
  }

  report?.addTest?.('Sign up', '✅', `Created/signed in as ${email}`);
  return true;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  loadLocalEnv,
  loadJson,
  loadTestPlan,
  delay,
  trySignIn,
  trySignUp,
  clearOperatorProfile,
  waitForProjectManager,
  escapeHtml
};
