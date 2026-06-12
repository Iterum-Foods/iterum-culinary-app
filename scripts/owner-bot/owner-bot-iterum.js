/**
 * Iterum Culinary — Owner Bot (mirrors Restaurant Business Planner owner_bot_v2.js)
 *
 * Phased owner workflow: auth → structure → three pillars → test plan validation → report.
 *
 * Usage:
 *   npm run serve:test          # terminal 1
 *   npm run owner-bot           # terminal 2
 *
 * Env:
 *   ITERUM_BASE_URL             default http://localhost:8080
 *   ITERUM_TEST_EMAIL           required for signed-in phases
 *   ITERUM_TEST_PASSWORD        required for signed-in phases
 *   ITERUM_TEST_PLAN            path to iterum_test_plan.json
 *   RBP_BUSINESS_PLAN_PATH      optional — merge restaurant/menu from RBP business_plan.json
 *   OWNER_BOT_HEADLESS          true | false (default false)
 *   OWNER_BOT_OUTPUT            output dir (default scripts/owner-bot/output)
 *   OWNER_BOT_AI                true — prefer LLM when OPENAI_API_KEY set
 *   OPENAI_API_KEY              enables LLM owner persona (optional)
 *   OPENAI_BASE_URL             default https://api.openai.com/v1
 *   OWNER_BOT_AI_MODEL          default gpt-4o-mini
 *   OWNER_BOT_SKIP_AGENT        true — skip Phase 3b walkthrough
 */
const fs = require('fs');
const path = require('path');

/** Load scripts/owner-bot/.env.owner-bot (gitignored) — no extra deps */
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
loadLocalEnv();

const { chromium } = require('playwright');
const {
  runOwnerDayWalkthrough,
  renderAgentHtml,
  isAgentEnabled
} = require('./owner-agent');
const { runDevelopWorkflows } = require('./owner-bot-workflows');
const { runComplianceWorkflows } = require('./owner-bot-compliance');

const ROOT = path.join(__dirname, '..', '..');
const OUTPUT_DIR =
  process.env.OWNER_BOT_OUTPUT ||
  path.join(__dirname, 'output');
const TEST_PLAN_PATH =
  process.env.ITERUM_TEST_PLAN ||
  path.join(__dirname, 'iterum_test_plan.json');

const BASE_URL = (
  process.env.ITERUM_BASE_URL || 'http://localhost:8080'
).replace(/\/$/, '');
const HEADLESS = process.env.OWNER_BOT_HEADLESS === 'true';
const TEST_EMAIL = process.env.ITERUM_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.ITERUM_TEST_PASSWORD || '';
const SKIP_AGENT = process.env.OWNER_BOT_SKIP_AGENT === 'true';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function loadJson(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadTestPlan() {
  const plan = loadJson(TEST_PLAN_PATH);
  if (!plan) {
    throw new Error(`Test plan not found: ${TEST_PLAN_PATH}`);
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

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

class TestReport {
  constructor(meta) {
    this.meta = meta;
    this.tests = [];
    this.issues = [];
    this.startTime = new Date();
  }

  addTest(name, status, details = '') {
    this.tests.push({ name, status, details, timestamp: new Date().toISOString() });
    console.log(`${status} ${name}: ${details}`);
  }

  addIssue(severity, feature, description) {
    this.issues.push({
      severity,
      feature,
      description,
      timestamp: new Date().toISOString()
    });
    console.log(`[${severity}] ${feature}: ${description}`);
  }

  generateReport() {
    const duration = (new Date() - this.startTime) / 1000;
    const passedTests = this.tests.filter(t => t.status === '✅').length;
    const failedTests = this.tests.filter(t => t.status === '❌').length;
    const warningTests = this.tests.filter(t => t.status === '⚠️').length;

    const testRows = this.tests
      .map(
        t =>
          `<tr><td>${escapeHtml(t.name)}</td><td style="text-align:center">${t.status}</td><td>${escapeHtml(t.details)}</td></tr>`
      )
      .join('');

    const issueRows = this.issues
      .map(
        i =>
          `<tr><td><strong>[${escapeHtml(i.severity)}]</strong></td><td>${escapeHtml(i.feature)}</td><td>${escapeHtml(i.description)}</td></tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Iterum Culinary — Owner Bot Report</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 20px; color: #0f172a; }
    .container { background: white; padding: 24px; border-radius: 12px; max-width: 1100px; margin: 0 auto; box-shadow: 0 4px 24px rgba(15,23,42,0.08); }
    .header { background: linear-gradient(135deg, hsl(182 38% 22%), hsl(182 32% 32%)); color: #f8fafc; padding: 24px; border-radius: 8px; margin: -24px -24px 24px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .stat-card { padding: 14px; border-radius: 8px; text-align: center; }
    .passed { background: #d1fae5; border-left: 4px solid #059669; }
    .failed { background: #fee2e2; border-left: 4px solid #dc2626; }
    .warning { background: #fef3c7; border-left: 4px solid #d97706; }
    .neutral { background: #e2e8f0; border-left: 4px solid #334155; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
    th { background: #0f172a; color: white; }
    h2 { border-bottom: 2px solid #0f766e; padding-bottom: 8px; }
    .agent-step { background: #f0fdfa; border-left: 4px solid #0d9488; padding: 12px 16px; margin: 12px 0; border-radius: 6px; }
    .agent-step p { margin: 6px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Iterum Culinary — Owner Bot</h1>
      <p>${escapeHtml(this.meta.restaurantName)} · ${escapeHtml(BASE_URL)}</p>
      <p>${new Date().toLocaleString()} · ${duration.toFixed(1)}s</p>
      ${this.meta.rbpLinked ? `<p>RBP plan linked: ${escapeHtml(this.meta.rbpLinked)}</p>` : ''}
    </div>
    <div class="summary">
      <div class="stat-card passed"><h3>Passed</h3><div style="font-size:28px;font-weight:700">${passedTests}</div></div>
      <div class="stat-card failed"><h3>Failed</h3><div style="font-size:28px;font-weight:700">${failedTests}</div></div>
      <div class="stat-card warning"><h3>Warnings</h3><div style="font-size:28px;font-weight:700">${warningTests}</div></div>
      <div class="stat-card neutral"><h3>Issues</h3><div style="font-size:28px;font-weight:700">${this.issues.length}</div></div>
    </div>
    <h2>Test results</h2>
    <table><thead><tr><th>Test</th><th>Status</th><th>Details</th></tr></thead><tbody>${testRows}</tbody></table>
    ${
      this.issues.length
        ? `<h2>Issues (${this.issues.length})</h2><table><thead><tr><th>Severity</th><th>Feature</th><th>Description</th></tr></thead><tbody>${issueRows}</tbody></table>`
        : '<p><strong>No issues logged.</strong></p>'
    }
    ${this.meta.agentSummary ? renderAgentHtml(this.meta.agentSummary, this.meta.agentJournal) : ''}
    <h2>Restaurant Business Planner</h2>
    <p>Same <code>schemaVersion</code> test plan can drive owner_bot on port 3000 and Iterum on 8080 — link menus and restaurant profile when both apps share an account or API.</p>
  </div>
</body>
</html>`;

    return { summary: { passedTests, failedTests, warningTests, duration }, html };
  }
}

function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function screenshot(page, name) {
  const file = path.join(OUTPUT_DIR, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`Screenshot: ${file}`);
  return file;
}

async function trySignIn(page, report) {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    report.addTest(
      'User authentication',
      '⚠️',
      'Set ITERUM_TEST_EMAIL and ITERUM_TEST_PASSWORD for full owner flow'
    );
    return false;
  }

  const url = `${BASE_URL}/`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await delay(1500);

  const emailField = page.locator('#signin-email').first();
  const onLandingAuth = await emailField.isVisible({ timeout: 3000 }).catch(() => false);

  if (!onLandingAuth) {
    await page.goto(`${BASE_URL}/signin.html`, { waitUntil: 'domcontentloaded' });
    await delay(1000);
  }

  const email = page.locator('#signin-email').first();
  if (!(await email.isVisible({ timeout: 5000 }).catch(() => false))) {
    report.addTest('User authentication', '⚠️', 'Sign-in form not found');
    return false;
  }

  await email.fill(TEST_EMAIL);
  await page.locator('#signin-password').first().fill(TEST_PASSWORD);
  await page.locator('#signin-btn, button[type="submit"]').first().click();
  await delay(5000);

  const bodyText = await page.locator('body').innerText().catch(() => '');
  if (/error|invalid|failed/i.test(bodyText) && !(await page.url()).includes('dashboard')) {
    report.addTest('User authentication', '❌', 'Sign-in may have failed — check credentials');
    report.addIssue('CRITICAL', 'Auth', 'Firebase sign-in failed for owner bot credentials');
    return false;
  }

  report.addTest('User authentication', '✅', `Signed in as ${TEST_EMAIL}`);
  return true;
}

async function ensureMobileSignedIn(page, report) {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    return false;
  }
  await page.goto(`${BASE_URL}/mobile-compliance.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });
  await delay(2500);
  const appPanel = page.locator('#app-panel');
  if (await appPanel.isVisible({ timeout: 4000 }).catch(() => false)) {
    report.addTest('Mobile shift auth', '✅', 'Already signed in on shift app');
    return true;
  }
  const email = page.locator('#auth-email');
  if (!(await email.isVisible({ timeout: 4000 }).catch(() => false))) {
    report.addTest('Mobile shift auth', '⚠️', 'Shift app auth form not found');
    return false;
  }
  await email.fill(TEST_EMAIL);
  await page.locator('#auth-password').fill(TEST_PASSWORD);
  await page.locator('#btn-signin').click();
  await delay(6000);
  const ok = await appPanel.isVisible({ timeout: 10000 }).catch(() => false);
  report.addTest(
    'Mobile shift auth',
    ok ? '✅' : '⚠️',
    ok ? 'Signed in on mobile shift app' : 'Shift app sign-in may have failed'
  );
  return ok;
}

async function visitPath(page, report, label, urlPath, checks, afterGoto) {
  const url = `${BASE_URL}${urlPath}`;
  console.log(`\n→ ${label}: ${url}`);
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await delay(2000);
    if (typeof afterGoto === 'function') {
      await afterGoto(page);
    }
    const ok = res && res.ok();
    if (!ok) {
      report.addTest(`Access: ${label}`, '❌', `HTTP ${res ? res.status() : 'no response'}`);
      report.addIssue('MAJOR', label, `Page failed to load: ${urlPath}`);
      return false;
    }
    for (const check of checks) {
      const visible = await check.locator.isVisible({ timeout: 8000 }).catch(() => false);
      if (!visible) {
        report.addTest(`Access: ${label}`, '⚠️', `Missing: ${check.name}`);
        report.addIssue('MINOR', label, check.name);
      }
    }
    report.addTest(`Access: ${label}`, '✅', urlPath);
    return true;
  } catch (e) {
    report.addTest(`Access: ${label}`, '❌', e.message);
    report.addIssue('MAJOR', label, e.message);
    return false;
  }
}

async function runOwnerBot() {
  ensureOutputDir();
  const testPlan = loadTestPlan();
  const restaurantName = testPlan.restaurant?.name || 'Owner workspace';

  const report = new TestReport({
    restaurantName,
    rbpLinked: testPlan._rbpLinked || null
  });

  console.log('Starting Iterum Culinary Owner Bot\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test plan: ${TEST_PLAN_PATH}`);
  if (testPlan._rbpLinked) console.log(`RBP linked: ${testPlan._rbpLinked}`);
  if (!SKIP_AGENT) {
    console.log(
      `Owner agent: ${isAgentEnabled() && process.env.OPENAI_API_KEY ? 'LLM' : 'scripted persona'}`
    );
  }

  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  try {
    console.log('\n=== PHASE 1: Landing & authentication ===\n');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await delay(2000);
    await screenshot(page, 'step_1_landing.png');

    const whoFor = page.locator('#who-its-for');
    const pillars = page.locator('#pillars');
    if (await whoFor.isVisible({ timeout: 5000 }).catch(() => false)) {
      report.addTest('Landing: Who it is for', '✅', 'ICP section visible');
    } else {
      report.addTest('Landing: Who it is for', '⚠️', '#who-its-for not found');
    }
    if (await pillars.isVisible({ timeout: 3000 }).catch(() => false)) {
      report.addTest('Landing: Three pillars', '✅', 'Develop / Run / Archive on landing');
    } else {
      report.addTest('Landing: Three pillars', '⚠️', '#pillars not found');
    }
    report.addTest('App load', '✅', 'Iterum Culinary reachable');

    const signedIn = await trySignIn(page, report);
    if (signedIn) {
      await ensureMobileSignedIn(page, report);
    }
    await screenshot(page, 'step_2_after_auth.png');

    console.log('\n=== PHASE 2: Navigation structure ===\n');
    const navLinks = await page.locator('a[href]').evaluateAll(els =>
      els
        .map(a => ({ href: a.getAttribute('href'), text: (a.textContent || '').trim() }))
        .filter(x => x.href && x.text && x.text.length < 40)
        .slice(0, 30)
    );
    console.log(`Sample nav links: ${navLinks.map(x => x.text).slice(0, 12).join(', ')}`);
    report.addTest('Structure: nav links', '✅', `${navLinks.length} links sampled`);

    const exp = testPlan.iterumExpectations || {};

    console.log('\n=== PHASE 3: Three pillars (owner paths) ===\n');

    if (signedIn || !TEST_EMAIL) {
      for (const p of exp.develop?.paths || ['/recipe-library.html', '/menu-builder.html']) {
        const name = p.replace(/\//g, '').replace('.html', '') || 'develop';
        await visitPath(page, report, `Develop — ${name}`, p, [
          { name: 'body', locator: page.locator('body') }
        ]);
        await screenshot(page, `step_develop_${name}.png`);
      }

      for (const p of exp.runTheShift?.paths || ['/dashboard.html', '/mobile-compliance.html']) {
        const name = p.replace(/\//g, '').replace('.html', '') || 'shift';
        const checks = [{ name: 'body', locator: page.locator('body') }];
        if (p.includes('dashboard')) {
          checks.push({
            name: 'workspace save indicator',
            locator: page.locator('[data-workspace-save-indicator]')
          });
        }
        if (p.includes('mobile-compliance')) {
          checks.push({
            name: 'project picker',
            locator: page.locator('#project-picker')
          });
          checks.push({
            name: 'workspace context',
            locator: page.locator('#mobile-workspace-context, [data-workspace-save-indicator]')
          });
        }
        await visitPath(page, report, `Run the shift — ${name}`, p, checks);
        await screenshot(page, `step_run_${name}.png`);
      }

      for (const p of exp.archive?.paths || ['/archive-hub.html']) {
        await visitPath(page, report, 'Archive — hub', p, [
          { name: 'archive table', locator: page.locator('#archive-projects-tbody') },
          {
            name: 'archive heading',
            locator: page.getByRole('heading', { level: 1, name: /Archive/i })
          }
        ]);
        await screenshot(page, 'step_archive_hub.png');
      }

      const teamPath = exp.team?.path || '/project-hub.html#team';
      await visitPath(
        page,
        report,
        'Team — project hub',
        teamPath,
        [
          { name: 'team tab panel', locator: page.locator('#hub-tab-team') },
          { name: 'team panel', locator: page.locator('#team-access-panel') },
          { name: 'members table', locator: page.locator('#team-members-tbody') }
        ],
        async p => {
          const teamPanel = p.locator('#hub-tab-team');
          const isHidden = await teamPanel.evaluate(el => el.hasAttribute('hidden')).catch(() => true);
          if (isHidden) {
            await p.locator('[data-hub-section="team"]').click();
            await delay(800);
          }
          await teamPanel.waitFor({ state: 'visible', timeout: 10000 });
          await delay(500);
        }
      );
      await screenshot(page, 'step_team_hub.png');

      await runDevelopWorkflows(page, BASE_URL, report, {
        signedIn,
        screenshot: name => screenshot(page, name)
      });

      await runComplianceWorkflows(page, BASE_URL, report, {
        signedIn,
        screenshot: name => screenshot(page, name)
      });
    } else {
      report.addIssue(
        'MAJOR',
        'Signed-in flows',
        'Skipped pillar pages — provide ITERUM_TEST_EMAIL / ITERUM_TEST_PASSWORD'
      );
    }

    if (!SKIP_AGENT) {
      await runOwnerDayWalkthrough(page, BASE_URL, testPlan, report, {
        outputDir: OUTPUT_DIR,
        screenshotPerScenario: true,
        signedIn,
        maxScenarios: parseInt(process.env.OWNER_BOT_AI_SCENARIOS || '5', 10) || 5
      });
      if (report.meta.agentSummary) {
        report.addTest(
          'Agent walkthrough',
          Number(report.meta.agentSummary.averageUxScore) >= 7 ? '✅' : '⚠️',
          report.meta.agentSummary.headline
        );
      }
    }

    console.log('\n=== PHASE 4: Test plan validation ===\n');
    if (testPlan.restaurant) {
      report.addTest(
        'Plan: restaurant',
        '✅',
        `${testPlan.restaurant.name} (${testPlan.restaurant.location || 'location n/a'})`
      );
    }
    if (Array.isArray(testPlan.menu) && testPlan.menu.length) {
      const sample = testPlan.menu[0];
      report.addTest(
        'Plan: menu',
        '✅',
        `${testPlan.menu.length} items (e.g. ${sample.name} $${sample.price})`
      );
    }
    if (testPlan._rbpLinked) {
      report.addTest('Plan: RBP link', '✅', 'Merged from Restaurant Business Planner JSON');
    }

    console.log('\n=== PHASE 5: Score ===\n');
    const total = report.tests.length || 1;
    const passed = report.tests.filter(t => t.status === '✅').length;
    const score = ((passed / total) * 100).toFixed(1);
    console.log(`Score: ${score}% (${passed}/${total})`);
    if (report.issues.length === 0 && passed >= total * 0.8) {
      report.addTest('Overall', '✅', 'Owner workflow ready for pilot');
    } else if (report.issues.length) {
      report.addTest('Overall', '⚠️', `${report.issues.length} issue(s) — see report`);
    }
  } catch (err) {
    console.error('Bot error:', err);
    report.addTest('Execution', '❌', err.message);
  } finally {
    const result = report.generateReport();
    const htmlPath = path.join(OUTPUT_DIR, 'owner_bot_iterum_report.html');
    const jsonPath = path.join(OUTPUT_DIR, 'owner_bot_iterum_results.json');
    fs.writeFileSync(htmlPath, result.html);
    if (report.meta.agentSummary) {
      const mdPath = path.join(OUTPUT_DIR, 'owner_agent_narrative.md');
      fs.writeFileSync(
        mdPath,
        `# Owner agent narrative\n\n${report.meta.agentSummary.headline}\n\n${report.meta.agentSummary.narrative}\n\n## Blockers\n\n${(report.meta.agentSummary.uniqueBlockers || []).map(b => `- ${b}`).join('\n') || '_none_'}\n`
      );
      console.log(`Narrative: ${mdPath}`);
    }
    fs.writeFileSync(
      jsonPath,
      JSON.stringify(
        {
          app: 'iterum-culinary',
          baseUrl: BASE_URL,
          timestamp: new Date().toISOString(),
          stats: result.summary,
          tests: report.tests,
          issues: report.issues,
          agentJournal: report.meta.agentJournal || null,
          agentSummary: report.meta.agentSummary || null,
          testPlanPath: TEST_PLAN_PATH,
          rbpLinked: testPlan._rbpLinked || null
        },
        null,
        2
      )
    );
    console.log(`\nReport: ${htmlPath}`);
    console.log(`JSON: ${jsonPath}`);
    await delay(1500);
    await browser.close();
  }
}

runOwnerBot().catch(err => {
  console.error(err);
  process.exit(1);
});
