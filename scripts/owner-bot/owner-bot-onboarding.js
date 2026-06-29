/**
 * Owner Bot — onboarding audit: sign-up → operator setup → new project.
 *
 * Usage:
 *   npm run serve:test          # terminal 1 (or set ITERUM_BASE_URL to prod)
 *   npm run owner-bot:onboarding
 *
 * Modes:
 *   Default — sign in with ITERUM_TEST_EMAIL, clear operator profile, run setup flow.
 *   OWNER_BOT_SIGNUP=true — create a fresh Firebase account (uses +timestamp email alias).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const {
  loadLocalEnv,
  delay,
  trySignIn,
  trySignUp,
  clearOperatorProfile,
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
const USE_SIGNUP = process.env.OWNER_BOT_SIGNUP === 'true';
const PROJECT_NAME =
  process.env.OWNER_BOT_PROJECT_NAME ||
  `Bot Bistro ${new Date().toISOString().slice(0, 10)}`;

class OnboardingReport {
  constructor() {
    this.steps = [];
    this.issues = [];
    this.uxNotes = [];
    this.startTime = new Date();
  }

  addStep(name, status, details = '') {
    this.steps.push({ name, status, details, at: new Date().toISOString() });
    console.log(`${status} ${name}: ${details}`);
  }

  /** Alias for owner-bot-lib helpers that call addTest */
  addTest(name, status, details = '') {
    this.addStep(name, status, details);
  }

  addIssue(severity, area, description) {
    this.issues.push({ severity, area, description });
    console.log(`[${severity}] ${area}: ${description}`);
  }

  addUxNote(note) {
    this.uxNotes.push(note);
    console.log(`  UX → ${note}`);
  }
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function signupEmail() {
  if (process.env.OWNER_BOT_SIGNUP_EMAIL) {
    return process.env.OWNER_BOT_SIGNUP_EMAIL;
  }
  const base = TEST_EMAIL || 'ownerbot@test.iterum.local';
  const at = base.indexOf('@');
  if (at < 1) return `ownerbot+${Date.now()}@test.local`;
  const local = base.slice(0, at);
  const domain = base.slice(at + 1);
  return `${local}+onboard${Date.now()}@${domain}`;
}

async function screenshot(page, name) {
  const file = path.join(OUTPUT_DIR, name);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function readPageState(page) {
  return page.evaluate(() => {
    const profileRaw = localStorage.getItem('iterum_operator_profile');
    let profile = null;
    try {
      profile = profileRaw ? JSON.parse(profileRaw) : null;
    } catch (e) {
      profile = null;
    }
    const projects = window.projectManager?.projects || [];
    const nonMaster = projects.filter(p => p && p.id && p.id !== 'master');
    const activeId =
      localStorage.getItem('iterum_current_project') ||
      localStorage.getItem('userCurrentProjectKey') ||
      window.projectManager?.currentProject?.id ||
      '';
    const select = document.getElementById('default-project-select');
    const selectOptions = select
      ? Array.from(select.options).map(o => ({
          value: o.value,
          text: o.textContent
        }))
      : [];
    const restaurantNameField = document.getElementById('setup-restaurant-name');
    return {
      url: location.href,
      pathname: location.pathname.replace(/^\//, ''),
      hasProfile: !!profile,
      profileRole: profile?.roleKey || null,
      featureCount: profile?.features
        ? Object.values(profile.features).filter(Boolean).length
        : null,
      projectCount: projects.length,
      nonMasterCount: nonMaster.length,
      nonMasterNames: nonMaster.map(p => p.name || p.id),
      activeProjectId: activeId,
      isMasterActive: activeId === 'master' || !activeId,
      setupSelectOptions: selectOptions,
      hasRestaurantNameField: !!restaurantNameField,
      restaurantNameFieldVisible:
        restaurantNameField && restaurantNameField.offsetParent !== null,
      projectManagerReady: !!(
        window.projectManager && window.projectManager.currentUserId
      )
    };
  });
}

async function auditSetupPage(page, report) {
  await waitForProjectManager(page, 20000);
  const state = await readPageState(page);
  report.addStep(
    'Setup page loaded',
    state.pathname.includes('setup.html') ? '✅' : '❌',
    state.pathname
  );

  report.addStep(
    'Inline restaurant create',
    state.hasRestaurantNameField && state.restaurantNameFieldVisible ? '✅' : '❌',
    state.hasRestaurantNameField
      ? 'Restaurant name field present on setup'
      : 'Missing #setup-restaurant-name — P0 inline create not wired'
  );

  if (!state.hasRestaurantNameField) {
    report.addIssue(
      'CRITICAL',
      'Setup → project gap',
      'Setup page has no inline restaurant name field.'
    );
  }

  if (state.nonMasterCount === 0 && !state.restaurantNameFieldVisible) {
    report.addIssue(
      'MAJOR',
      'Active workspace',
      'No restaurant workspace and no create field visible before setup completes.'
    );
  }

  const realOptions = state.setupSelectOptions.filter(o => o.value);
  const hasMasterInList = realOptions.some(
    o => /master/i.test(o.text || '') || o.value === 'master'
  );

  if (realOptions.length > 0) {
    report.addStep(
      'Setup workspace picker',
      hasMasterInList ? '⚠️' : '✅',
      `${realOptions.length} option(s): ${realOptions.map(o => o.text?.trim()).join(', ')}`
    );
  }

  if (hasMasterInList) {
    report.addIssue(
      'MAJOR',
      'Setup project list',
      'Master Project appears in workspace picker — should be hidden.'
    );
  }

  return state;
}

async function completeSetupForm(page, report, projectName) {
  await waitForProjectManager(page, 20000);
  await page.locator('input[name="scope"][value="single_restaurant"]').check();
  await page.locator('input[name="roleKey"][value="chef_leadership"]').check();

  const nameField = page.locator('#setup-restaurant-name');
  if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await nameField.fill(projectName);
    report.addStep('Fill restaurant name', '✅', projectName);
  }

  await screenshot(page, 'onboarding_01_setup_filled.png');

  const navPromise = page
    .waitForURL(/dashboard\.html|setup\.html|project-hub/, { timeout: 25000 })
    .catch(() => null);

  await page.locator('#setup-submit').click();
  await delay(2000);
  await navPromise;

  const after = await readPageState(page);
  const saved = after.hasProfile && after.profileRole === 'chef_leadership';
  const restaurantCreated =
    after.nonMasterCount > 0 &&
    !after.isMasterActive &&
    after.nonMasterNames.some(n =>
      (n || '').toLowerCase().includes(projectName.toLowerCase().slice(0, 8))
    );

  report.addStep(
    'Setup submit',
    saved ? '✅' : '❌',
    saved
      ? `Profile saved; landed on ${after.pathname}; ${after.featureCount} features on`
      : `Profile missing or wrong role; url=${after.pathname}`
  );

  report.addStep(
    'Restaurant created in setup',
    restaurantCreated ? '✅' : '❌',
    restaurantCreated
      ? `Active: ${after.nonMasterNames.join(', ')} (id ${after.activeProjectId})`
      : `Still on master=${after.isMasterActive}; workspaces: ${after.nonMasterNames.join(', ') || 'none'}`
  );

  if (!restaurantCreated) {
    report.addIssue(
      'MAJOR',
      'Setup create restaurant',
      'Submitting setup did not create and activate a restaurant workspace.'
    );
  }

  if (saved && after.featureCount > 10) {
    report.addIssue(
      'MINOR',
      'Pilot features',
      `${after.featureCount} modules enabled — pilot preset should be ~9.`
    );
  }

  if (after.pathname.includes('setup.html')) {
    const err = await page
      .locator('#setup-error:not(.hidden)')
      .textContent()
      .catch(() => '');
    report.addIssue('CRITICAL', 'Setup submit', err || 'Still on setup.html after submit');
  }

  return { after, restaurantCreated };
}

async function createProjectViaModal(page, report, projectName) {
  await page.goto(`${BASE_URL}/project-hub.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });
  await delay(2000);

  const pmReady = await waitForProjectManager(page, 25000);
  report.addStep(
    'Project hub — manager ready',
    pmReady ? '✅' : '❌',
    pmReady ? 'projectManager loaded' : 'projectManager timeout'
  );
  if (!pmReady) {
    report.addIssue('CRITICAL', 'Project hub', 'projectManager not available');
    return null;
  }

  await screenshot(page, 'onboarding_02_project_hub_before.png');

  const beforeCount = await page.evaluate(
    () =>
      (window.projectManager?.projects || []).filter(p => p.id !== 'master')
        .length
  );

  await page.locator('button.btn.btn-primary', { hasText: 'New Project' }).click();
  await page.locator('#new-project-name').waitFor({ state: 'visible', timeout: 8000 });
  await page.locator('#new-project-name').fill(projectName);
  await page.locator('#new-project-desc').fill('Owner bot onboarding test workspace');

  await screenshot(page, 'onboarding_03_create_modal.png');
  await page.locator('#create-project-form button[type="submit"]').click();
  await delay(2500);

  const after = await page.evaluate(name => {
    const projects = (window.projectManager?.projects || []).filter(
      p => p && p.id !== 'master'
    );
    const match = projects.find(
      p => (p.name || '').toLowerCase() === name.toLowerCase()
    );
    const activeId =
      localStorage.getItem('iterum_current_project') ||
      window.projectManager?.currentProject?.id ||
      '';
    return {
      count: projects.length,
      created: !!match,
      createdId: match?.id || null,
      activeProjectId: activeId,
      activeName: window.projectManager?.currentProject?.name || activeId
    };
  }, projectName);

  report.addStep(
    'Create restaurant project',
    after.created ? '✅' : '❌',
    after.created
      ? `"${projectName}" (${after.createdId}); active=${after.activeName}`
      : `Project not found after modal submit (had ${beforeCount}, now ${after.count})`
  );

  if (after.created && after.activeProjectId !== after.createdId) {
    report.addIssue(
      'MINOR',
      'Project activation',
      `Created "${projectName}" but active project is ${after.activeProjectId} — user may not realize workspace switched.`
    );
    report.addUxNote(
      'After creating first restaurant, auto-switch active workspace and show a one-time "You\'re now in …" banner.'
    );
  }

  await screenshot(page, 'onboarding_04_project_hub_after.png');
  return after;
}

async function auditDashboard(page, report) {
  await page.goto(`${BASE_URL}/dashboard.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });
  await delay(2500);

  const dash = await page.evaluate(() => {
    const checklist = document.getElementById('menu-launch-checklist-dashboard');
    const identity = document.querySelector('[data-workspace-identity]');
    return {
      hasChecklist: !!checklist,
      checklistVisible: checklist ? checklist.offsetParent !== null : false,
      identityText: (identity?.textContent || '').trim().slice(0, 120),
      title: document.title
    };
  });

  report.addStep(
    'Dashboard post-onboarding',
    dash.title ? '✅' : '⚠️',
    dash.identityText || dash.title || 'dashboard'
  );

  if (!dash.hasChecklist) {
    report.addIssue(
      'MINOR',
      'Dashboard',
      'Menu launch checklist (#menu-launch-checklist-dashboard) not found on dashboard.'
    );
    report.addUxNote(
      'Menu launch checklist not present on dashboard — Day 0 owners miss a guided golden path.'
    );
  } else if (!dash.checklistVisible) {
    report.addIssue(
      'MINOR',
      'Dashboard',
      'Menu launch checklist exists but is hidden for this role/workspace.'
    );
  }

  await screenshot(page, 'onboarding_05_dashboard.png');
}

function writeReports(report, projectName) {
  const jsonPath = path.join(OUTPUT_DIR, 'onboarding_audit.json');
  const mdPath = path.join(OUTPUT_DIR, 'onboarding_audit.md');
  const htmlPath = path.join(OUTPUT_DIR, 'onboarding_audit.html');

  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    mode: USE_SIGNUP ? 'signup' : 'signin_clear_profile',
    projectName,
    durationSec: (Date.now() - report.startTime) / 1000,
    steps: report.steps,
    issues: report.issues,
    uxNotes: report.uxNotes
  };
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));

  const failed = report.steps.filter(s => s.status === '❌').length;
  const warns = report.steps.filter(s => s.status === '⚠️').length;

  const md = `# Onboarding audit — ${new Date().toISOString().slice(0, 10)}

**URL:** ${BASE_URL}  
**Mode:** ${payload.mode}  
**Test project:** ${projectName}  
**Duration:** ${payload.durationSec.toFixed(1)}s  
**Steps:** ${report.steps.length} (${failed} failed, ${warns} warnings)  
**Issues:** ${report.issues.length}

## Flow steps

| Step | Status | Details |
|------|--------|---------|
${report.steps.map(s => `| ${s.name} | ${s.status} | ${s.details.replace(/\|/g, '\\|')} |`).join('\n')}

## Issues found

${
  report.issues.length
    ? report.issues
        .map(i => `- **[${i.severity}] ${i.area}** — ${i.description}`)
        .join('\n')
    : '_None — flow completed cleanly._'
}

## UX improvement notes

${
  report.uxNotes.length
    ? report.uxNotes.map(n => `- ${n}`).join('\n')
    : '_No extra notes._'
}

## Recommended fixes (priority)

1. **P0** — Create first restaurant during setup (or immediately after), not only from Project hub later.
2. **P0** — Default off Master for new owners; pilot feature preset instead of all-on skip.
3. **P1** — Replace \`prompt()\` / \`alert()\` on project-hub quick-create with the same modal as "New Project".
4. **P1** — Day 0 dashboard card linking to Menu launch checklist + Dish Creator.
5. **P2** — Line role path: waiting-for-access screen when no workspace membership.

Screenshots: \`scripts/owner-bot/output/onboarding_*.png\`
`;

  fs.writeFileSync(mdPath, md);

  const issueRows = report.issues
    .map(
      i =>
        `<tr><td><strong>${escapeHtml(i.severity)}</strong></td><td>${escapeHtml(i.area)}</td><td>${escapeHtml(i.description)}</td></tr>`
    )
    .join('');
  const stepRows = report.steps
    .map(
      s =>
        `<tr><td>${escapeHtml(s.name)}</td><td style="text-align:center">${s.status}</td><td>${escapeHtml(s.details)}</td></tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Onboarding audit</title>
<style>
body{font-family:Inter,system-ui,sans-serif;margin:24px;background:#f0f4f2;color:#1a2e35}
h1{margin:0 0 8px} table{border-collapse:collapse;width:100%;margin:16px 0;background:#fff}
th,td{border:1px solid #e2e8f0;padding:10px;text-align:left;font-size:14px}
th{background:#6b8e6f;color:#fff}
.note{background:#fff;border-left:4px solid #f59e0b;padding:12px;margin:8px 0}
</style></head><body>
<h1>Onboarding audit</h1>
<p>${escapeHtml(BASE_URL)} · ${escapeHtml(payload.mode)} · ${failed} failed / ${warns} warnings</p>
<h2>Steps</h2><table><tr><th>Step</th><th>Status</th><th>Details</th></tr>${stepRows}</table>
<h2>Issues</h2><table><tr><th>Severity</th><th>Area</th><th>Description</th></tr>${issueRows || '<tr><td colspan="3">None</td></tr>'}</table>
<h2>UX notes</h2>
${report.uxNotes.map(n => `<div class="note">${escapeHtml(n)}</div>`).join('') || '<p>None</p>'}
<p>See <code>onboarding_audit.md</code> for recommended fixes.</p>
</body></html>`;
  fs.writeFileSync(htmlPath, html);

  console.log(`\nReports:\n  ${htmlPath}\n  ${mdPath}\n  ${jsonPath}\n`);
}

async function runOnboardingAudit() {
  ensureOutputDir();
  const report = new OnboardingReport();
  const projectName = PROJECT_NAME;
  let dialogCount = 0;

  console.log('Owner Bot — onboarding audit\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Mode: ${USE_SIGNUP ? 'sign-up (new account)' : 'sign-in + clear profile'}\n`);

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    report.addStep(
      'Credentials',
      '❌',
      'Set ITERUM_TEST_EMAIL and ITERUM_TEST_PASSWORD (npm run owner-bot:init)'
    );
    writeReports(report, projectName);
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  page.on('dialog', async dialog => {
    dialogCount += 1;
    const msg = dialog.message().slice(0, 80);
    console.log(`  [dialog] ${dialog.type()}: ${msg}`);
    await dialog.accept().catch(() => {});
  });

  try {
    console.log('=== Phase 1: Auth ===\n');

    if (USE_SIGNUP) {
      const email = signupEmail();
      const ok = await trySignUp(
        page,
        BASE_URL,
        {
          name: 'Owner Bot Onboarding',
          email,
          password: TEST_PASSWORD
        },
        report
      );
      if (!ok) {
        process.exitCode = 1;
        return;
      }
    } else {
      const ok = await trySignIn(page, BASE_URL, TEST_EMAIL, TEST_PASSWORD, report);
      if (!ok) {
        process.exitCode = 1;
        return;
      }
      await clearOperatorProfile(page);
      report.addStep('Clear operator profile', '✅', 'Simulates first-run (routes to setup.html)');
      await page.goto(`${BASE_URL}/dashboard.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });
      await delay(2000);
    }

    const postAuth = await readPageState(page);
    const onSetup =
      postAuth.pathname.includes('setup.html') ||
      (await page.url()).includes('setup.html');

    if (!onSetup && !USE_SIGNUP) {
      await page.goto(`${BASE_URL}/setup.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });
      await delay(1500);
    }

    report.addStep(
      'Post-auth destination',
      (await page.url()).includes('setup.html') ? '✅' : '⚠️',
      page.url().replace(BASE_URL + '/', '')
    );

    if (!(await page.url()).includes('setup.html')) {
      report.addIssue(
        'MAJOR',
        'Routing',
        'New/cleared user did not land on setup.html — onboarding may be skipped silently.'
      );
    }

    console.log('\n=== Phase 2: Operator setup ===\n');
    await auditSetupPage(page, report);
    const setupResult = await completeSetupForm(page, report, projectName);

    if (setupResult.restaurantCreated) {
      console.log('\n=== Phase 3: Create project (skipped — created in setup) ===\n');
      report.addStep(
        'Project hub create',
        '✅',
        'Skipped — restaurant workspace created during setup'
      );
    } else {
      console.log('\n=== Phase 3: Create project ===\n');
      await createProjectViaModal(page, report, projectName);
    }

    console.log('\n=== Phase 4: Dashboard check ===\n');
    await auditDashboard(page, report);

    if (dialogCount >= 2) {
      report.addIssue(
        'MINOR',
        'Project hub UX',
        `${dialogCount} native browser alert(s) during project create — blocks automation and feels dated; use in-app toast/modal.`
      );
    }

    const failed = report.steps.filter(s => s.status === '❌').length;
    const major = report.issues.filter(
      i => i.severity === 'CRITICAL' || i.severity === 'MAJOR'
    ).length;
    if (failed || major) process.exitCode = 1;
  } catch (err) {
    report.addStep('Fatal error', '❌', err.message);
    report.addIssue('CRITICAL', 'Bot', err.message);
    await screenshot(page, 'onboarding_error.png').catch(() => {});
    process.exitCode = 1;
  } finally {
    writeReports(report, projectName);
    await delay(300);
    await browser.close();
  }
}

runOnboardingAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
