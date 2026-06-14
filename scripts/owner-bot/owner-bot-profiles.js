/**
 * Owner Bot — test each project profile / persona pillar paths.
 *
 * Usage:
 *   npm run serve:test
 *   npm run owner-bot:profiles
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const {
  loadLocalEnv,
  delay,
  trySignIn
} = require('./owner-bot-lib');

loadLocalEnv();

const profiles = require('../../tests/fixtures/project-profiles.json');
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
  }
  addTest(name, status, details = '') {
    this.tests.push({ name, status, details });
    console.log(`${status} ${name}: ${details}`);
  }
}

async function setMockProject(page, profile) {
  await page.evaluate(
    ({ projectType, label, id }) => {
      const uid = 'owner_bot_profile';
      localStorage.setItem(
        'iterum_operator_profile',
        JSON.stringify({
          roleKey: 'chef_leadership',
          scope: 'single_restaurant',
          features: {}
        })
      );
      const project = {
        id,
        name: `Bot — ${label}`,
        type: projectType,
        isArchived: false,
        tags: projectType === 'restaurant' ? ['owner-bot'] : []
      };
      localStorage.setItem('iterum_current_project', project.id);
      localStorage.setItem('active_project', project.id);
      localStorage.setItem('active_project_name', project.name);
      localStorage.setItem(`iterum_current_project_user_${uid}`, project.id);
      localStorage.setItem(
        `iterum_projects_user_${uid}`,
        JSON.stringify([project])
      );
      if (window.projectManager) {
        window.projectManager.projects = [project];
        window.projectManager.currentProject = project;
        window.projectManager.setCurrentProject(project.id);
      }
      document.dispatchEvent(
        new CustomEvent('projectChanged', {
          bubbles: true,
          detail: { projectId: project.id, project, userId: uid }
        })
      );
    },
    {
      projectType: profile.projectType,
      label: profile.label,
      id: `bot_profile_${profile.id}`
    }
  );
}

async function checkIdentity(page, profile) {
  const personaMap = { A: 'owner', B: 'chef', C: 'cook' };
  const expectedPersona = personaMap[profile.persona] || 'chef';
  const expectedPillar = profile.primaryPillar;

  const attrs = await page.evaluate(() => {
    const el = document.querySelector('[data-workspace-identity]');
    if (!el) return null;
    return {
      persona: el.getAttribute('data-persona'),
      pillar: el.getAttribute('data-pillar'),
      text: (el.textContent || '').slice(0, 200)
    };
  });

  if (!attrs) {
    return { ok: true, detail: 'identity strip n/a on page', skipped: true };
  }
  const ok =
    attrs.persona === expectedPersona && attrs.pillar === expectedPillar;
  return {
    ok,
    detail: `persona=${attrs.persona} pillar=${attrs.pillar}`
  };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

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

    console.log('\n=== Project profile matrix ===\n');

    for (const profile of profiles) {
      console.log(`\n— ${profile.label} (${profile.projectType}) —`);
      await setMockProject(page, profile);

      for (const entry of profile.paths) {
        const url = `${BASE_URL}${entry.path}`;
        try {
          const res = await page.goto(url.split('#')[0], {
            waitUntil: 'domcontentloaded',
            timeout: 60000
          });
          if (url.includes('#')) {
            await page.evaluate(hash => {
              window.location.hash = hash.replace(/^[^#]*/, '').replace(/^#/, '#');
            }, url);
            await delay(800);
          }
          await delay(1500);
          await setMockProject(page, profile);
          await page
            .evaluate(() => {
              if (typeof window.iterumRenderWorkspaceIdentity === 'function') {
                window.iterumRenderWorkspaceIdentity();
              }
            })
            .catch(() => {});
          await delay(400);
          const ok = res && res.ok();
          const identity = await checkIdentity(page, profile);
          const slug = entry.path.replace(/\//g, '').replace('.html', '') || 'page';
          await page.screenshot({
            path: path.join(
              OUTPUT_DIR,
              `profile_${profile.id}_${slug}.png`
            ),
            fullPage: true
          });
          const identityOk = identity.skipped || identity.ok;
          report.addTest(
            `Profile ${profile.id}: ${entry.path}`,
            ok && identityOk ? '✅' : ok ? '⚠️' : '❌',
            `${identity.detail}${ok ? '' : ' · HTTP fail'}`
          );
        } catch (err) {
          report.addTest(
            `Profile ${profile.id}: ${entry.path}`,
            '❌',
            err.message
          );
        }
      }
    }

    const failed = report.tests.filter(t => t.status === '❌').length;
    const warn = report.tests.filter(t => t.status === '⚠️').length;
    console.log(`\nDone: ${report.tests.length} checks, ${failed} failed, ${warn} warnings`);
    if (failed) process.exitCode = 1;
  } finally {
    await delay(500);
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
