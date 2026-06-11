/**
 * Owner Agent — AI-guided "day in the life" walkthrough for Iterum Owner Bot.
 * Uses OpenAI-compatible chat API when OPENAI_API_KEY is set; otherwise scripted persona.
 */
const fs = require('fs');
const path = require('path');

const AI_ENABLED =
  process.env.OWNER_BOT_AI === '1' ||
  process.env.OWNER_BOT_AI === 'true' ||
  Boolean(process.env.OPENAI_API_KEY);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL = (
  process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
).replace(/\/$/, '');
const AI_MODEL = process.env.OWNER_BOT_AI_MODEL || 'gpt-4o-mini';
const MAX_STEPS_PER_SCENARIO =
  parseInt(process.env.OWNER_BOT_AI_MAX_STEPS || '5', 10) || 5;

const ALLOWED_PATH_PREFIXES = [
  '/',
  '/index.html',
  '/signin.html',
  '/dashboard.html',
  '/menu-builder.html',
  '/recipe-library.html',
  '/recipe-developer.html',
  '/archive-hub.html',
  '/mobile-compliance.html',
  '/project-hub.html',
  '/ingredients.html',
  '/vendor-management.html',
  '/data-backup-center.html'
];

function isAgentEnabled() {
  return AI_ENABLED;
}

function buildPersona(testPlan) {
  const r = testPlan.restaurant || {};
  const menuCount = Array.isArray(testPlan.menu) ? testPlan.menu.length : 0;
  return (
    testPlan.ownerAgent?.persona ||
    `You are ${r.name || 'the owner'} — owner-operator in ${r.location || 'your city'}. ` +
      `You run a ${r.type || 'restaurant'} opening ${r.openingDate || 'soon'}. ` +
      `You worry about health compliance without enterprise software, need menus/recipes organized (${menuCount} items in plan), ` +
      `and insist on exporting your own data. You are busy, practical, and speak like a real operator—not a QA tester.`
  );
}

function defaultScenarios(testPlan) {
  if (Array.isArray(testPlan.ownerAgent?.scenarios) && testPlan.ownerAgent.scenarios.length) {
    return testPlan.ownerAgent.scenarios;
  }
  return [
    {
      id: 'morning_open',
      title: 'Monday 9am — open the kitchen',
      goal: 'Check dashboard for today’s ops, HACCP, and workspace banner before service.',
      startPath: '/dashboard.html',
      pillar: 'run'
    },
    {
      id: 'line_check',
      title: 'Pre-service — line log on phone',
      goal: 'Use mobile shift tools for temperature/sanitizer rhythm like your crew would.',
      startPath: '/mobile-compliance.html',
      pillar: 'run'
    },
    {
      id: 'menu_work',
      title: 'Tuesday — menu & recipe work',
      goal: 'Review recipe library and menu builder before weekend LTO push.',
      startPath: '/recipe-library.html',
      pillar: 'develop'
    },
    {
      id: 'weekly_archive',
      title: 'Friday — backup & archive',
      goal: 'Confirm data is saved per workspace and download a backup you control.',
      startPath: '/archive-hub.html',
      pillar: 'archive'
    },
    {
      id: 'team_setup',
      title: 'Hiring week — add crew to workspace',
      goal: 'Open project hub team area to see how you’d onboard line staff.',
      startPath: '/project-hub.html#team',
      pillar: 'run'
    }
  ];
}

async function capturePageContext(page) {
  return page.evaluate(() => {
    const visible = el => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const headings = [...document.querySelectorAll('h1, h2, h3')]
      .filter(visible)
      .slice(0, 8)
      .map(h => h.innerText.trim().replace(/\s+/g, ' '))
      .filter(Boolean);
    const interactives = [...document.querySelectorAll('a[href], button, [role="button"]')]
      .filter(visible)
      .slice(0, 28)
      .map(el => ({
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 72),
        href: el.getAttribute('href') || null
      }))
      .filter(x => x.text || x.href);
    const banner = document.querySelector('.iterum-workspace-banner, [data-workspace-save-indicator]');
    return {
      url: location.href,
      pathname: location.pathname,
      title: document.title,
      headings,
      workspaceBanner: banner ? (banner.innerText || '').trim().slice(0, 200) : null,
      bodyPreview: (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 2400),
      interactives
    };
  });
}

function isPathAllowed(urlPath) {
  const p = urlPath.split('?')[0].split('#')[0];
  return ALLOWED_PATH_PREFIXES.some(prefix => p === prefix || p.endsWith(prefix));
}

async function executeAction(page, baseUrl, action, journal) {
  const type = (action.type || 'observe').toLowerCase();
  try {
    if (type === 'observe') {
      return { ok: true, detail: 'Observed current screen' };
    }
    if (type === 'goto' && action.path) {
      const path = action.path.startsWith('/') ? action.path : `/${action.path}`;
      if (!isPathAllowed(path)) {
        return { ok: false, detail: `Blocked path: ${path}` };
      }
      await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await delay(2000);
      return { ok: true, detail: `Navigated to ${path}` };
    }
    if (type === 'click' && action.text) {
      const authModal = page.locator('#auth-guard-modal');
      if (await authModal.isVisible({ timeout: 500 }).catch(() => false)) {
        return {
          ok: false,
          detail: 'Sign-in required — auth guard blocked click (set ITERUM_TEST_EMAIL/PASSWORD)'
        };
      }
      const re = new RegExp(action.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const loc = page.getByRole('link', { name: re }).or(page.getByRole('button', { name: re })).first();
      if (await loc.isVisible({ timeout: 4000 }).catch(() => false)) {
        await loc.click({ timeout: 8000 });
        await delay(1500);
        return { ok: true, detail: `Clicked “${action.text}”` };
      }
      const fallback = page.locator('a, button').filter({ hasText: re }).first();
      if (await fallback.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fallback.click({ timeout: 8000 });
        await delay(1500);
        return { ok: true, detail: `Clicked match for “${action.text}”` };
      }
      return { ok: false, detail: `No control matching “${action.text}”` };
    }
    if (type === 'scroll') {
      await page.mouse.wheel(0, action.pixels || 600);
      await delay(800);
      return { ok: true, detail: 'Scrolled page' };
    }
    return { ok: true, detail: `Unknown action ${type} — skipped` };
  } catch (e) {
    journal.push({ level: 'warn', message: e.message });
    return { ok: false, detail: e.message };
  }
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function callLlm(systemPrompt, userPayload) {
  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(userPayload) }
      ]
    })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(raw);
}

const SYSTEM_PROMPT = `You simulate a restaurant owner using Iterum Culinary in a realistic work session.
Respond ONLY with valid JSON:
{
  "ownerThought": "1-3 sentences in first person — what you're trying to do right now",
  "actions": [ { "type": "observe"|"goto"|"click"|"scroll", "path"?: "/dashboard.html", "text"?: "HACCP", "pixels"?: 500 } ],
  "uxScore": 1-10,
  "blockers": ["short list of confusions or missing features"],
  "wouldUseTomorrow": true|false,
  "done": true|false
}
Rules:
- Max 3 actions per turn. Prefer observe + one click over risky navigation.
- Only use goto paths from the allowed list provided.
- Be honest about confusion (auth, workspace name, missing buttons).
- done=true when the scenario goal feels addressed or you're stuck.`;

async function planWithAi(scenario, persona, context, history, allowedPaths) {
  return callLlm(SYSTEM_PROMPT, {
    persona,
    scenario: { id: scenario.id, title: scenario.title, goal: scenario.goal },
    allowedPaths,
    page: context,
    priorSteps: history.slice(-4)
  });
}

function planWithScript(scenario, context, stepIndex) {
  const thoughts = {
    morning_open: [
      'First thing Monday: I need to see if yesterday’s logs are here and which workspace I’m saving to.',
      'I’m looking for HACCP or temperature — that’s what the inspector cares about.',
      'If the workspace banner is wrong, I don’t trust anything I save today.'
    ],
    line_check: [
      'My KM should knock out fridge temps on the line phone before lunch.',
      'If I can’t pick a workspace here, the crew will just use paper again.'
    ],
    menu_work: [
      'Before the LTO I need sandwich specs and food cost — spreadsheet hell is what I’m trying to escape.',
      'Recipe library and menu builder should talk to each other; that’s the whole pitch.'
    ],
    weekly_archive: [
      'Friday habit: export everything. I won’t rely on a vendor holding my menus hostage.',
      'I want to see each location’s counts and hit download backup.'
    ],
    team_setup: [
      'New hire starts Monday — I need to add them to the right store, not Master by accident.',
      'Team page should make UID or invite obvious; I’m not an IT person.'
    ]
  };
  const keys = Object.keys(thoughts);
  const id = keys.includes(scenario.id) ? scenario.id : 'morning_open';
  const thought = thoughts[id][Math.min(stepIndex, thoughts[id].length - 1)];

  const actions = [{ type: 'observe' }];
  const text = (context.bodyPreview || '').toLowerCase();
  if (scenario.pillar === 'run' && /haccp|temperature|checklist/i.test(text)) {
    actions.push({ type: 'click', text: 'HACCP' });
  } else if (scenario.pillar === 'archive' && /backup|download|export/i.test(text)) {
    actions.push({ type: 'click', text: 'backup' });
  } else if (scenario.pillar === 'develop' && /recipe|menu/i.test(text)) {
    actions.push({ type: 'click', text: 'recipe' });
  } else if (/team|member|add/i.test(text) && scenario.id === 'team_setup') {
    actions.push({ type: 'click', text: 'Team' });
  } else {
    actions.push({ type: 'scroll', pixels: 500 });
  }

  const blockers = [];
  if (!context.workspaceBanner && scenario.pillar !== 'archive') {
    blockers.push('Workspace save banner not visible — unclear which store data goes to');
  }
  if (/sign in|welcome back/i.test(text) && !/dashboard|archive|recipe/i.test(context.pathname)) {
    blockers.push('Still on auth/landing — full owner flow needs sign-in');
  }

  return {
    ownerThought: thought,
    actions,
    uxScore: blockers.length ? 6 : 8,
    blockers,
    wouldUseTomorrow: blockers.length < 2,
    done: stepIndex >= 1
  };
}

async function runScenario(page, baseUrl, scenario, testPlan, report, journal) {
  const persona = buildPersona(testPlan);
  const maxSteps = scenario.maxSteps || MAX_STEPS_PER_SCENARIO;
  const startPath = scenario.startPath || '/dashboard.html';
  const history = [];

  console.log(`\n  🧑‍🍳 Scenario: ${scenario.title}`);
  journal.push({
    type: 'scenario_start',
    id: scenario.id,
    title: scenario.title,
    goal: scenario.goal
  });

  if (isPathAllowed(startPath)) {
    await page.goto(`${baseUrl}${startPath}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await delay(2000);
  }

  for (let step = 0; step < maxSteps; step += 1) {
    const context = await capturePageContext(page);
    let plan;
    try {
      if (OPENAI_API_KEY) {
        plan = await planWithAi(scenario, persona, context, history, ALLOWED_PATH_PREFIXES);
      } else {
        plan = planWithScript(scenario, context, step);
      }
    } catch (e) {
      console.log(`  ⚠️ Agent planner: ${e.message} — using script fallback`);
      plan = planWithScript(scenario, context, step);
    }

    const entry = {
      scenarioId: scenario.id,
      step: step + 1,
      url: context.url,
      ownerThought: plan.ownerThought,
      uxScore: plan.uxScore,
      blockers: plan.blockers || [],
      wouldUseTomorrow: plan.wouldUseTomorrow,
      actions: []
    };

    console.log(`  💭 ${plan.ownerThought}`);
    for (const action of (plan.actions || []).slice(0, 3)) {
      const result = await executeAction(page, baseUrl, action, journal);
      entry.actions.push({ ...action, result: result.detail, ok: result.ok });
      console.log(`     → ${action.type}: ${result.detail}`);
    }

    history.push(entry);
    journal.push({ type: 'step', ...entry });

    if (plan.blockers?.length) {
      plan.blockers.forEach(b => {
        report.addIssue('AGENT', scenario.title, b);
      });
    }

    report.addTest(
      `Agent: ${scenario.title} (step ${step + 1})`,
      plan.uxScore >= 7 ? '✅' : plan.uxScore >= 5 ? '⚠️' : '❌',
      `UX ${plan.uxScore}/10 — ${(plan.blockers || []).join('; ') || 'no blockers'}`
    );

    if (plan.done) break;
  }

  journal.push({ type: 'scenario_end', id: scenario.id });
}

async function runOwnerDayWalkthrough(page, baseUrl, testPlan, report, options = {}) {
  const journal = [];
  const scenarios = (options.scenarios || defaultScenarios(testPlan)).slice(
    0,
    options.maxScenarios || 5
  );

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║ PHASE 3b: AI OWNER AGENT WALKTHROUGH    ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(
    OPENAI_API_KEY
      ? `  Mode: LLM (${AI_MODEL})`
      : '  Mode: scripted persona (set OPENAI_API_KEY for LLM)'
  );

  for (const scenario of scenarios) {
    await runScenario(page, baseUrl, scenario, testPlan, report, journal);
    if (options.screenshotPerScenario) {
      const shot = `agent_${scenario.id}.png`;
      await page.screenshot({
        path: path.join(options.outputDir, shot),
        fullPage: true
      });
      journal.push({ type: 'screenshot', file: shot, scenarioId: scenario.id });
    }
    await delay(1000);
  }

  const summary = buildWalkthroughSummary(journal, testPlan);
  journal.push({ type: 'summary', ...summary });
  report.meta.agentJournal = journal;
  report.meta.agentSummary = summary;

  console.log('\n  📋 Agent summary:', summary.headline);
  return journal;
}

function buildWalkthroughSummary(journal, testPlan) {
  const steps = journal.filter(j => j.type === 'step');
  const scores = steps.map(s => s.uxScore).filter(n => typeof n === 'number');
  const avgUx = scores.length
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : 'n/a';
  const blockers = [...new Set(steps.flatMap(s => s.blockers || []))];
  const wouldUse = steps.filter(s => s.wouldUseTomorrow).length;
  const restaurant = testPlan.restaurant?.name || 'the restaurant';

  return {
    headline: `${restaurant} owner walkthrough — avg UX ${avgUx}/10`,
    scenariosRun: journal.filter(j => j.type === 'scenario_start').length,
    stepsRecorded: steps.length,
    averageUxScore: avgUx,
    uniqueBlockers: blockers,
    wouldUseTomorrowSteps: wouldUse,
    narrative: steps
      .map(s => `**${s.scenarioId}:** ${s.ownerThought}`)
      .join('\n\n')
  };
}

function renderAgentHtml(summary, journal) {
  if (!summary) return '';
  const blockers = (summary.uniqueBlockers || [])
    .map(b => `<li>${escapeHtml(b)}</li>`)
    .join('');
  const steps = (journal || [])
    .filter(j => j.type === 'step')
    .map(
      j => `<div class="agent-step">
        <strong>${escapeHtml(j.scenarioId)} — step ${j.step}</strong>
        <p><em>${escapeHtml(j.ownerThought)}</em></p>
        <p>UX: ${j.uxScore}/10 · ${j.wouldUseTomorrow ? 'Would use again' : 'Needs fixes'}</p>
        ${(j.blockers || []).length ? `<ul>${j.blockers.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
      </div>`
    )
    .join('');

  return `
    <h2>Owner agent walkthrough</h2>
    <p><strong>${escapeHtml(summary.headline)}</strong></p>
    <p>${summary.scenariosRun} scenarios · ${summary.stepsRecorded} steps · LLM: ${OPENAI_API_KEY ? escapeHtml(AI_MODEL) : 'scripted fallback'}</p>
    ${blockers ? `<h3>Blockers</h3><ul>${blockers}</ul>` : ''}
    <h3>Owner narrative</h3>
    ${steps || '<p>No steps recorded.</p>'}
  `;
}

function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = {
  isAgentEnabled,
  capturePageContext,
  runOwnerDayWalkthrough,
  buildWalkthroughSummary,
  renderAgentHtml,
  defaultScenarios
};
