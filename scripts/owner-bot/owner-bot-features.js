/**
 * Owner Bot — traverse every feature module and page in iterum_feature_map.json.
 *
 * Usage:
 *   npm run serve:test
 *   npm run owner-bot:features
 *
 * Env:
 *   ITERUM_FEATURE_MAP     path to JSON (default iterum_feature_map.json)
 *   OWNER_BOT_ALL_FEATURES true (default) — enable all modules in operator profile before run
 *   OWNER_BOT_FEATURES_ONLY pilot — only paths where pilotDefault is true
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const {
  loadLocalEnv,
  loadJson,
  delay,
  trySignIn,
  waitForProjectManager,
  escapeHtml
} = require('./owner-bot-lib');

loadLocalEnv();

const OUTPUT_DIR =
  process.env.OWNER_BOT_OUTPUT || path.join(__dirname, 'output');
const MAP_PATH =
  process.env.ITERUM_FEATURE_MAP ||
  path.join(__dirname, 'iterum_feature_map.json');
const BASE_URL = (process.env.ITERUM_BASE_URL || 'http://localhost:8080').replace(
  /\/$/,
  ''
);
const HEADLESS = process.env.OWNER_BOT_HEADLESS === 'true';
const TEST_EMAIL = process.env.ITERUM_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.ITERUM_TEST_PASSWORD || '';
const ALL_FEATURES =
  process.env.OWNER_BOT_ALL_FEATURES !== 'false' &&
  process.env.OWNER_BOT_FEATURES_ONLY !== 'pilot';
const PILOT_ONLY = process.env.OWNER_BOT_FEATURES_ONLY === 'pilot';

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function slugify(str) {
  return String(str || 'page')
    .replace(/[^\w]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48);
}

async function enableAllFeaturesInBrowser(page) {
  await page.evaluate(() => {
    const keys = [
      'menus',
      'recipes',
      'ingredients',
      'kitchen',
      'inventory',
      'vendors',
      'calendar',
      'projects',
      'equipment',
      'production',
      'import_export',
      'photo_studio',
      'scaling',
      'compliance',
      'backup',
      'data_tools'
    ];
    const features = {};
    keys.forEach(k => {
      features[k] = true;
    });
    const profile = {
      scope: 'single_restaurant',
      roleKey: 'chef_leadership',
      label: 'Owner bot — all features',
      features,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('iterum_operator_profile', JSON.stringify(profile));
    if (typeof window.applyAllWorkspaceFeatureVisibility === 'function') {
      window.applyAllWorkspaceFeatureVisibility();
    }
  });
}

async function visitFeaturePath(page, baseUrl, entry, moduleKey) {
  const rawPath = entry.path;
  const [pathname, hashPart] = rawPath.split('#');
  const url = `${baseUrl}${pathname}`;

  const res = await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  if (hashPart) {
    await page.evaluate(h => {
      window.location.hash = h;
    }, hashPart);
    await delay(800);
  }

  await delay(1200);
  await waitForProjectManager(page, 8000).catch(() => false);

  const expectSel = entry.expect || 'body';
  const found = await page
    .locator(expectSel)
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  const title = await page.title().catch(() => '');
  const httpOk = res && res.status() < 400;

  return {
    ok: httpOk && found,
    httpOk,
    found,
    title: title.slice(0, 80),
    status: res ? res.status() : 0
  };
}

function buildMatrixRows(modules, results) {
  return modules
    .map(mod => {
      const modResults = results.filter(r => r.moduleKey === mod.key);
      const passed = modResults.filter(r => r.ok).length;
      const total = modResults.length;
      const status =
        total === 0 ? '—' : passed === total ? '✅' : passed > 0 ? '⚠️' : '❌';
      return {
        key: mod.key,
        label: mod.label,
        pillar: mod.pillar,
        pilotDefault: mod.pilotDefault,
        passed,
        total,
        status
      };
    })
    .filter(row => row.total > 0);
}

function writeReports(report) {
  const jsonPath = path.join(OUTPUT_DIR, 'feature_matrix_results.json');
  const mdPath = path.join(OUTPUT_DIR, 'feature_matrix_report.md');
  const htmlPath = path.join(OUTPUT_DIR, 'feature_matrix_report.html');

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const matrixRows = report.matrix
    .map(
      r =>
        `| ${r.label} (\`${r.key}\`) | ${r.pillar} | ${r.pilotDefault ? 'yes' : 'no'} | ${r.status} | ${r.passed}/${r.total} |`
    )
    .join('\n');

  const detailRows = report.results
    .map(
      r =>
        `| ${r.status} | ${r.moduleLabel} | ${r.label} | \`${r.path}\` | ${escapeHtml(r.detail)} |`
    )
    .join('\n');

  const md = `# Feature matrix — ${report.generatedAt.slice(0, 10)}

**URL:** ${report.baseUrl}  
**Mode:** ${report.mode}  
**Modules:** ${report.matrix.length}  
**Paths:** ${report.results.length} (${report.passed} passed, ${report.failed} failed, ${report.warnings} warnings)

## Module summary

| Module | Pillar | Pilot default | Status | Pass |
|--------|--------|---------------|--------|------|
${matrixRows}

## Every path

| Status | Module | Page | Path | Detail |
|--------|--------|------|------|--------|
${detailRows}

Screenshots: \`scripts/owner-bot/output/feature_*.png\`
`;

  fs.writeFileSync(mdPath, md);

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Feature matrix</title>
<style>
body{font-family:Inter,system-ui,sans-serif;margin:24px;background:#f0f4f2}
table{border-collapse:collapse;width:100%;background:#fff;margin:12px 0}
th,td{border:1px solid #e2e8f0;padding:8px;font-size:13px;text-align:left}
th{background:#6b8e6f;color:#fff}
</style></head><body>
<h1>Iterum feature matrix</h1>
<p>${escapeHtml(report.baseUrl)} · ${report.passed}/${report.results.length} passed</p>
<h2>Modules</h2>
<table><tr><th>Module</th><th>Pillar</th><th>Pilot</th><th>Status</th><th>Pass</th></tr>
${report.matrix
  .map(
    r =>
      `<tr><td>${escapeHtml(r.label)}</td><td>${r.pillar}</td><td>${r.pilotDefault ? 'yes' : 'no'}</td><td>${r.status}</td><td>${r.passed}/${r.total}</td></tr>`
  )
  .join('')}
</table>
<h2>Paths</h2>
<table><tr><th>Status</th><th>Module</th><th>Page</th><th>Path</th><th>Detail</th></tr>
${report.results
  .map(
    r =>
      `<tr><td>${r.status}</td><td>${escapeHtml(r.moduleLabel)}</td><td>${escapeHtml(r.label)}</td><td><code>${escapeHtml(r.path)}</code></td><td>${escapeHtml(r.detail)}</td></tr>`
  )
  .join('')}
</table>
</body></html>`;

  fs.writeFileSync(htmlPath, html);
  console.log(`\nReports:\n  ${htmlPath}\n  ${mdPath}\n  ${jsonPath}\n`);
}

async function main() {
  ensureOutputDir();
  const map = loadJson(MAP_PATH);
  if (!map || !Array.isArray(map.modules)) {
    throw new Error(`Invalid feature map: ${MAP_PATH}`);
  }

  let modules = map.modules;
  if (PILOT_ONLY) {
    modules = modules.filter(m => m.pilotDefault || m.alwaysOn);
  }

  const results = [];
  const miniReport = { addTest: (name, status, details) => console.log(`${status} ${name}: ${details}`) };

  console.log('Owner Bot — feature matrix\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(
    `Coverage: ${PILOT_ONLY ? 'pilot modules only' : ALL_FEATURES ? 'all modules (all features enabled)' : 'current profile'}\n`
  );

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.error('Set ITERUM_TEST_EMAIL and ITERUM_TEST_PASSWORD');
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
    const signedIn = await trySignIn(page, BASE_URL, TEST_EMAIL, TEST_PASSWORD, miniReport);
    if (!signedIn) {
      process.exitCode = 1;
      return;
    }

    if (ALL_FEATURES) {
      await enableAllFeaturesInBrowser(page);
      miniReport.addTest('Operator profile', '✅', 'All feature modules enabled for full matrix');
    }

    await waitForProjectManager(page, 20000);

    console.log('\n=== Feature path matrix ===\n');

    for (const mod of modules) {
      console.log(`\n— ${mod.label} (${mod.key}) —`);
      for (const entry of mod.paths || []) {
        const pathKey = `${mod.key}__${slugify(entry.label || entry.path)}`;
        try {
          const outcome = await visitFeaturePath(page, BASE_URL, entry, mod.key);
          const status = outcome.ok ? '✅' : outcome.httpOk ? '⚠️' : '❌';
          const detail = `HTTP ${outcome.status} · ${outcome.title}`;
          console.log(`  ${status} ${entry.label}: ${detail}`);

          await page.screenshot({
            path: path.join(OUTPUT_DIR, `feature_${pathKey}.png`),
            fullPage: true
          });

          results.push({
            moduleKey: mod.key,
            moduleLabel: mod.label,
            path: entry.path,
            label: entry.label,
            pillar: mod.pillar,
            pilotDefault: !!mod.pilotDefault,
            ok: outcome.ok,
            status,
            detail
          });
        } catch (err) {
          console.log(`  ❌ ${entry.label}: ${err.message}`);
          results.push({
            moduleKey: mod.key,
            moduleLabel: mod.label,
            path: entry.path,
            label: entry.label,
            pillar: mod.pillar,
            pilotDefault: !!mod.pilotDefault,
            ok: false,
            status: '❌',
            detail: err.message
          });
        }
      }
    }

    const passed = results.filter(r => r.ok).length;
    const failed = results.filter(r => r.status === '❌').length;
    const warnings = results.filter(r => r.status === '⚠️').length;

    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      mode: PILOT_ONLY ? 'pilot' : ALL_FEATURES ? 'all_features' : 'profile',
      mapPath: MAP_PATH,
      passed,
      failed,
      warnings,
      matrix: buildMatrixRows(modules, results),
      results
    };

    writeReports(report);

    console.log(
      `\nDone: ${results.length} paths, ${passed} passed, ${failed} failed, ${warnings} warnings`
    );
    if (failed || warnings) process.exitCode = warnings && !failed ? 0 : failed ? 1 : 0;
    if (failed) process.exitCode = 1;
  } finally {
    await delay(300);
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
