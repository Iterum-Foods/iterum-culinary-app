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
const {
  runStockFlow,
  verifyInventoryPage
} = require('./owner-bot-stock-flow');

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

function writeReport(report, ok) {
  const mdPath = path.join(OUTPUT_DIR, 'stock_flow_report.md');
  const htmlPath = path.join(OUTPUT_DIR, 'stock_flow_report.html');
  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    ok,
    steps: report.steps
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'stock_flow_results.json'),
    JSON.stringify(payload, null, 2)
  );

  const rows = report.steps
    .map(s => `| ${s.name} | ${s.status} | ${s.details.replace(/\|/g, '\\|')} |`)
    .join('\n');

  fs.writeFileSync(mdPath, `# Stock flow (ingredients + inventory)\n\n${rows}\n`);

  fs.writeFileSync(
    htmlPath,
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Stock flow</title></head><body>
<h1>Stock flow</h1><table border="1" cellpadding="8"><tr><th>Step</th><th>Status</th><th>Details</th></tr>
${report.steps
  .map(
    s =>
      `<tr><td>${escapeHtml(s.name)}</td><td>${s.status}</td><td>${escapeHtml(s.details)}</td></tr>`
  )
  .join('')}
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

    const flowOpts = { outputDir: OUTPUT_DIR, screenshot: true };
    const flowOk = await runStockFlow(page, BASE_URL, report, flowOpts);
    const verifyOk = flowOk
      ? await verifyInventoryPage(page, BASE_URL, report, flowOpts)
      : false;
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
