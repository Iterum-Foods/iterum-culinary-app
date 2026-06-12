/**
 * Owner Bot — prep lists + recipe developer only (after provision).
 *
 * Usage:
 *   npm run serve:test
 *   npm run owner-bot:develop
 */
const { chromium } = require('playwright');
const path = require('path');
const {
  loadLocalEnv,
  loadTestPlan,
  delay,
  trySignIn
} = require('./owner-bot-lib');
const { runDevelopWorkflows } = require('./owner-bot-workflows');

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
  }
}

async function screenshot(page, name) {
  const file = path.join(OUTPUT_DIR, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`Screenshot: ${file}`);
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
    loadTestPlan();
    await runDevelopWorkflows(page, BASE_URL, report, {
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

main().catch(err => {
  console.error(err);
  process.exit(1);
});
