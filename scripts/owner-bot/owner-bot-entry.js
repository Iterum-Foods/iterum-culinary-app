/**
 * Owner Bot — entry funnel UI audit: landing → sign-in → dashboard.
 *
 * Usage:
 *   ITERUM_BASE_URL=https://iterum-culinary-app.vercel.app npm run owner-bot:entry
 *   npm run serve:test && npm run owner-bot:entry
 *
 * Env:
 *   OWNER_BOT_ENTRY_MOBILE=true   — also audit landing at 390×844
 *   OWNER_BOT_ENTRY_FRESH=true    — clear operator profile before sign-in (first-run path)
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const {
  loadLocalEnv,
  delay,
  trySignIn,
  clearOperatorProfile,
  waitForProjectManager,
  escapeHtml
} = require('./owner-bot-lib');
const {
  createUiCollector,
  runDomUiAudit,
  mergeCollectorIssues,
  writeEntryReports
} = require('./owner-bot-ui-lib');

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
const MOBILE_AUDIT = process.env.OWNER_BOT_ENTRY_MOBILE !== 'false';
const FRESH_PROFILE = process.env.OWNER_BOT_ENTRY_FRESH === 'true';

class EntryReport {
  constructor() {
    this.steps = [];
    this.issues = [];
    this.uxNotes = [];
    this.startTime = Date.now();
  }

  addStep(name, status, details = '') {
    this.steps.push({ name, status, details, at: new Date().toISOString() });
    console.log(`${status} ${name}: ${details}`);
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

async function screenshot(page, name) {
  const file = path.join(OUTPUT_DIR, name);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function auditDom(report, page, area, collector) {
  const dom = await runDomUiAudit(page);
  dom.issues.forEach(i => report.addIssue(i.severity, area, i.message));
  dom.notes.forEach(n => report.addUxNote(`${area}: ${n}`));

  if (dom.h1Count === 0) {
    report.addIssue('MINOR', area, 'No H1 on page — hurts SEO and screen reader structure');
  } else if (dom.h1Count > 1) {
    report.addIssue('MINOR', area, `${dom.h1Count} H1 elements — should usually be one per page`);
  }

  const drained = collector.drain();
  mergeCollectorIssues(report, area, drained);
  return dom;
}

async function auditLanding(page, report) {
  const collector = createUiCollector(page);
  await page.goto(`${BASE_URL}/`, {
    waitUntil: 'networkidle',
    timeout: 60000
  });
  await delay(1500);

  const checks = [
    { id: '#who-its-for', name: 'Who it is for (ICP)' },
    { id: '#pillars', name: 'Three pillars section' },
    { id: '#signin-email', name: 'Landing sign-in email field' },
    { id: '#signin-password', name: 'Landing sign-in password field' },
    { id: '#signin-btn', name: 'Sign-in submit button' }
  ];

  for (const c of checks) {
    const visible = await page
      .locator(c.id)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    report.addStep(
      `Landing: ${c.name}`,
      visible ? '✅' : '❌',
      visible ? c.id : `Missing or hidden ${c.id}`
    );
    if (!visible) {
      report.addIssue('MAJOR', 'Landing', `${c.name} not visible on index`);
    }
  }

  const heroLink = page.locator('a.hero-link-explore, a[href="#pillars"]').first();
  if (await heroLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    await heroLink.click();
    await delay(600);
    const pillarsInView = await page.evaluate(() => {
      const el = document.getElementById('pillars');
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    });
    report.addStep(
      'Landing: pillars anchor',
      pillarsInView ? '✅' : '⚠️',
      pillarsInView ? 'See pillars link scrolls to #pillars' : 'Anchor click did not bring pillars into view'
    );
  }

  const signupTab = page.locator('[data-tab="signup"], #tab-signup').first();
  if (await signupTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await signupTab.click();
    await delay(400);
    const signupVisible = await page
      .locator('#signup-email, #signup-name')
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    report.addStep(
      'Landing: sign-up tab',
      signupVisible ? '✅' : '❌',
      signupVisible ? 'Create account form toggles' : 'Sign-up tab did not reveal form'
    );
    await page.locator('[data-tab="signin"], #tab-signin').first().click().catch(() => {});
    await delay(300);
  }

  await auditDom(report, page, 'Landing', collector);
  await screenshot(page, 'entry_01_landing.png');
}

async function auditSigninPage(page, report) {
  const collector = createUiCollector(page);
  await page.goto(`${BASE_URL}/signin.html`, {
    waitUntil: 'networkidle',
    timeout: 60000
  });
  await delay(1200);

  const hasForm = await page
    .locator('#signin-email')
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  report.addStep(
    'Sign-in page',
    hasForm ? '✅' : '❌',
    hasForm ? 'Dedicated signin.html loads' : 'signin.html missing auth form'
  );

  if (!hasForm) {
    report.addIssue('CRITICAL', 'Sign-in page', '#signin-email not found on signin.html');
  }

  const title = await page.title();
  if (!/sign|iterum/i.test(title)) {
    report.addIssue('MINOR', 'Sign-in page', `Unexpected page title: ${title}`);
  }

  await auditDom(report, page, 'Sign-in page', collector);
  await screenshot(page, 'entry_02_signin.png');
}

async function auditPostSignIn(page, report) {
  const url = page.url();
  const pathAfter = url.replace(BASE_URL, '').replace(/^\//, '') || '/';
  const onDashboard = pathAfter.includes('dashboard.html');
  const onSetup = pathAfter.includes('setup.html');

  report.addStep(
    'Post sign-in route',
    onDashboard || onSetup ? '✅' : '⚠️',
    pathAfter
  );

  if (!onDashboard && !onSetup && !pathAfter.includes('project-hub')) {
    report.addIssue(
      'MAJOR',
      'Auth routing',
      `After sign-in, landed on ${pathAfter} — expected dashboard, setup, or project-hub`
    );
    report.addUxNote(
      'After successful sign-in, send owners to dashboard (or setup if first-run) — avoid leaving them on landing.'
    );
  }

  if (onSetup) {
    report.addUxNote('First-run user correctly routed to setup.html after sign-in.');
  }
}

async function auditDashboard(page, report) {
  const collector = createUiCollector(page);
  if (!page.url().includes('dashboard.html')) {
    await page.goto(`${BASE_URL}/dashboard.html`, {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    await delay(2500);
  }

  await waitForProjectManager(page, 20000);

  const dash = await page.evaluate(() => {
    const chip = document.getElementById('header-project-chip');
    const saveRoot = document.querySelector('[data-workspace-save-indicator]');
    const nav = document.getElementById('unified-sidebar-nav');
    const checklist = document.getElementById('menu-launch-checklist-dashboard');
    const pantry = document.getElementById('pantry-starter-card');
    const title = document.getElementById('dash-header-title');
    const cta = document.getElementById('dash-header-primary-cta');
    const mobileMenu = document.getElementById('dash-menu-toggle');
    return {
      titleText: (title?.textContent || '').trim(),
      chipText: (chip?.textContent || '').trim(),
      isMasterChip: /master project/i.test(chip?.textContent || ''),
      hasSaveIndicator: !!saveRoot,
      saveText: (saveRoot?.textContent || '').trim().slice(0, 100),
      hasNav: !!nav,
      navLinkCount: nav ? nav.querySelectorAll('a[href]').length : 0,
      hasChecklist: !!checklist,
      checklistVisible: checklist ? checklist.offsetParent !== null : false,
      hasPantry: !!pantry,
      pantryHidden: pantry ? pantry.hasAttribute('hidden') : true,
      pantryReady:
        window.iterumIngredientInventory &&
        typeof window.iterumIngredientInventory.isPantryReady === 'function' &&
        window.iterumIngredientInventory.isPantryReady(),
      ctaText: (cta?.textContent || '').replace(/\s+/g, ' ').trim(),
      hasMobileMenu: !!mobileMenu,
      projectCount: (window.projectManager?.projects || []).filter(
        p => p && p.id !== 'master'
      ).length,
      activeId:
        localStorage.getItem('iterum_current_project') ||
        window.projectManager?.currentProject?.id ||
        ''
    };
  });

  report.addStep(
    'Dashboard: header',
    dash.titleText ? '✅' : '❌',
    dash.titleText || 'Missing #dash-header-title'
  );

  report.addStep(
    'Dashboard: sidebar nav',
    dash.hasNav && dash.navLinkCount >= 5 ? '✅' : '⚠️',
    dash.hasNav ? `${dash.navLinkCount} nav links` : 'Unified sidebar missing'
  );

  const sidebarUi = await page.evaluate(() => {
    const sidebar = document.querySelector('.unified-nav-sidebar');
    const nav = document.getElementById('unified-sidebar-nav');
    const footer = sidebar?.querySelector('.sidebar-footer');
    const active = sidebar?.querySelector('.nav-link.active');
    const wrapper = document.querySelector('.main-content-wrapper');
    const main = document.querySelector('.main-content-area');
    const offset = getComputedStyle(document.body).getPropertyValue('--iterum-sidebar-offset').trim();
    const sidebarRect = sidebar?.getBoundingClientRect();
    const mainRect = main?.getBoundingClientRect();
    const gap =
      sidebarRect && mainRect ? Math.round(mainRect.left - sidebarRect.right) : null;
    return {
      hasSidebar: !!sidebar,
      sidebarWidth: sidebarRect ? Math.round(sidebarRect.width) : 0,
      offset: offset,
      contentGapPx: gap,
      footerVisible: footer ? footer.getBoundingClientRect().height > 20 : false,
      activeLink: active ? (active.textContent || '').trim().slice(0, 40) : '',
      navScrollable:
        nav && nav.scrollHeight > nav.clientHeight + 8 ? 'scroll' : 'fits',
      collapsed: sidebar?.classList.contains('is-collapsed') || false
    };
  });

  report.addStep(
    'Dashboard: sidebar layout',
    sidebarUi.hasSidebar && sidebarUi.contentGapPx === 0 ? '✅' : '⚠️',
    sidebarUi.hasSidebar
      ? `rail ${sidebarUi.sidebarWidth}px · offset ${sidebarUi.offset || 'n/a'} · gap ${sidebarUi.contentGapPx}px`
      : 'No .unified-nav-sidebar'
  );

  if (sidebarUi.contentGapPx != null && sidebarUi.contentGapPx > 2) {
    report.addIssue(
      'MAJOR',
      'Sidebar layout',
      `Gap of ${sidebarUi.contentGapPx}px between sidebar and dashboard content — check margin-left / width calc`
    );
  }

  report.addStep(
    'Dashboard: sidebar footer',
    sidebarUi.footerVisible ? '✅' : '⚠️',
    sidebarUi.footerVisible ? 'Project + account footer pinned' : 'Sidebar footer not visible'
  );

  report.addStep(
    'Dashboard: active nav item',
    /dashboard/i.test(sidebarUi.activeLink) ? '✅' : '⚠️',
    sidebarUi.activeLink || 'No active .nav-link on dashboard'
  );

  report.addStep(
    'Dashboard: nav scroll region',
    sidebarUi.navScrollable === 'fits' || sidebarUi.navScrollable === 'scroll' ? '✅' : '⚠️',
    sidebarUi.navScrollable === 'scroll'
      ? 'Nav list scrolls inside sidebar (footer stays put)'
      : 'Nav fits without scroll'
  );

  report.addStep(
    'Dashboard: workspace chip',
    dash.chipText ? '✅' : '❌',
    dash.chipText || 'No project chip'
  );

  if (dash.isMasterChip && dash.projectCount > 0) {
    report.addIssue(
      'MAJOR',
      'Dashboard',
      'Workspace chip shows "Master Project" but user has restaurant workspace(s) — confusing default'
    );
    report.addUxNote(
      'Auto-select the owner\'s restaurant workspace on dashboard load instead of Master Project.'
    );
  }

  report.addStep(
    'Dashboard: save indicator',
    dash.hasSaveIndicator ? '✅' : '⚠️',
    dash.saveText || 'data-workspace-save-indicator missing'
  );

  report.addStep(
    'Dashboard: primary CTA',
    dash.ctaText ? '✅' : '⚠️',
    dash.ctaText || 'No header CTA'
  );

  report.addStep(
    'Dashboard: menu launch checklist',
    dash.hasChecklist ? (dash.checklistVisible ? '✅' : '⚠️') : '⚠️',
    dash.hasChecklist
      ? dash.checklistVisible
        ? 'Visible for this role'
        : 'Present but hidden'
      : '#menu-launch-checklist-dashboard not found'
  );

  const pantryOk = !dash.hasPantry
    ? false
    : dash.pantryReady && dash.pantryHidden
      ? 'complete'
      : !dash.pantryHidden
        ? 'visible'
        : 'hidden_unknown';
  report.addStep(
    'Dashboard: pantry starter',
    !dash.hasPantry
      ? '⚠️'
      : pantryOk === 'complete'
        ? '✅'
        : pantryOk === 'visible'
          ? '✅'
          : '⚠️',
    !dash.hasPantry
      ? '#pantry-starter-card not in DOM'
      : pantryOk === 'complete'
        ? 'Pantry complete — card correctly hidden'
        : pantryOk === 'visible'
          ? 'Stock your kitchen card visible (Day 0)'
          : 'Pantry card hidden but pantry not marked ready'
  );

  if (pantryOk === 'hidden_unknown') {
    report.addIssue(
      'MINOR',
      'Dashboard',
      'Pantry starter card is hidden before ingredients + inventory are set up'
    );
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await delay(800);

  const globalToggleVisible = await page
    .locator('#iterum-mobile-nav-toggle')
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  const dashToggleVisible = await page
    .locator('#dash-menu-toggle')
    .isVisible({ timeout: 1000 })
    .catch(() => false);

  report.addStep(
    'Dashboard: mobile nav control (390px)',
    globalToggleVisible || dashToggleVisible ? '✅' : '❌',
    globalToggleVisible
      ? '#iterum-mobile-nav-toggle visible'
      : dashToggleVisible
        ? '#dash-menu-toggle visible'
        : 'No mobile menu toggle visible at 390px'
  );

  if (globalToggleVisible || dashToggleVisible) {
    const toggle = globalToggleVisible
      ? page.locator('#iterum-mobile-nav-toggle')
      : page.locator('#dash-menu-toggle');
    try {
      await toggle.click({ timeout: 10000 });
    } catch (clickErr) {
      await toggle.click({ force: true, timeout: 5000 }).catch(() => {});
      report.addUxNote(
        `Mobile nav toggle needed force-click — check overlay/z-index (${clickErr.message.slice(0, 80)})`
      );
    }
    await delay(600);
    const navOpen = await page.evaluate(() => {
      const sidebar = document.querySelector('.unified-nav-sidebar');
      return sidebar ? sidebar.classList.contains('mobile-open') : false;
    });
    report.addStep(
      'Dashboard: mobile nav opens',
      navOpen ? '✅' : '❌',
      navOpen ? 'Sidebar mobile-open at 390px' : 'Toggle click did not open sidebar'
    );
    if (!navOpen) {
      report.addIssue('MAJOR', 'Dashboard mobile', 'Mobile menu toggle does not open sidebar');
    }
  } else {
    report.addIssue(
      'MAJOR',
      'Dashboard mobile',
      'Mobile navigation toggle not visible — users cannot open the sidebar on phone'
    );
  }

  await page.setViewportSize({ width: 1400, height: 900 });
  await delay(400);

  await auditDom(report, page, 'Dashboard', collector);
  await screenshot(page, 'entry_03_dashboard.png');
}

async function auditLandingMobile(page, report) {
  if (!MOBILE_AUDIT) return;
  const collector = createUiCollector(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await delay(1200);

  const signinVisible = await page
    .locator('#signin-email')
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  report.addStep(
    'Landing mobile: sign-in form',
    signinVisible ? '✅' : '⚠️',
    signinVisible ? 'Auth form visible at 390px' : 'Sign-in fields not visible on mobile — may be below fold'
  );

  if (!signinVisible) {
    report.addUxNote(
      'On mobile, sign-in form may be far below hero — consider sticky CTA or moving auth above fold.'
    );
  }

  await auditDom(report, page, 'Landing (mobile)', collector);
  await screenshot(page, 'entry_04_landing_mobile.png');
  await page.setViewportSize({ width: 1400, height: 900 });
}

async function runEntryAudit() {
  ensureOutputDir();
  const report = new EntryReport();
  let dialogCount = 0;

  console.log('Owner Bot — entry funnel UI audit\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Fresh profile: ${FRESH_PROFILE}\n`);

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    report.addStep(
      'Credentials',
      '❌',
      'Set ITERUM_TEST_EMAIL and ITERUM_TEST_PASSWORD (npm run owner-bot:init)'
    );
    writeEntryReports(report, {
      outputDir: OUTPUT_DIR,
      baseUrl: BASE_URL,
      mode: 'missing-credentials',
      escapeHtml
    });
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  page.on('dialog', async dialog => {
    dialogCount += 1;
    report.addIssue(
      'MINOR',
      'Native dialog',
      `${dialog.type()}: ${dialog.message().slice(0, 120)}`
    );
    await dialog.accept().catch(() => {});
  });

  try {
    console.log('=== Phase 1: Landing ===\n');
    await auditLanding(page, report);
    await auditLandingMobile(page, report);

    console.log('\n=== Phase 2: Sign-in page ===\n');
    await auditSigninPage(page, report);

    console.log('\n=== Phase 3: Sign in ===\n');
    const signedIn = await trySignIn(page, BASE_URL, TEST_EMAIL, TEST_PASSWORD, {
      addTest: (n, s, d) => report.addStep(n, s, d)
    });
    if (!signedIn) {
      process.exitCode = 1;
      return;
    }

    if (FRESH_PROFILE) {
      await clearOperatorProfile(page);
      report.addStep('Clear profile', '✅', 'Simulates first-run');
      await page.goto(`${BASE_URL}/dashboard.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });
      await delay(2000);
    }

    await auditPostSignIn(page, report);
    await screenshot(page, 'entry_02b_after_auth.png');

    console.log('\n=== Phase 4: Dashboard ===\n');
    await auditDashboard(page, report);

    if (dialogCount > 0) {
      report.addUxNote(
        `${dialogCount} native alert/confirm during entry — replace with in-app toasts for polish.`
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
    await screenshot(page, 'entry_error.png').catch(() => {});
    process.exitCode = 1;
  } finally {
    writeEntryReports(report, {
      outputDir: OUTPUT_DIR,
      baseUrl: BASE_URL,
      mode: FRESH_PROFILE ? 'signin-fresh-profile' : 'signin-returning',
      escapeHtml
    });
    await delay(300);
    await browser.close();
  }
}

runEntryAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
