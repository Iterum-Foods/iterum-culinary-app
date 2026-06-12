/**
 * Owner Bot — prep lists + recipe developer workflows (Playwright).
 */
const { delay } = require('./owner-bot-lib');

const SKIP_DEVELOP =
  process.env.OWNER_BOT_SKIP_DEVELOP === 'true' ||
  process.env.OWNER_BOT_SKIP_DEVELOP === '1';

async function ensureHotChixReady(page, baseUrl, report) {
  const developUrl = `${baseUrl}/project-hub.html?importRestaurant=hotchix&rbp_develop=1&owner_bot=1`;
  await page.goto(developUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

  await page.waitForFunction(
    () => {
      const s = document.documentElement.getAttribute('data-rbp-develop-done');
      return s === 'ok' || s === 'error';
    },
    { timeout: 90000 }
  );

  const outcome = await page.evaluate(() => ({
    develop: document.documentElement.getAttribute('data-rbp-develop-done'),
    developDetail: document.documentElement.getAttribute('data-rbp-develop-detail'),
    provision: document.documentElement.getAttribute('data-rbp-provision-done')
  }));

  if (outcome.develop !== 'ok') {
    report.addTest('Develop: Hot Chix seed', '❌', outcome.developDetail || 'enrich failed');
    return null;
  }

  let detail = {};
  try {
    detail = JSON.parse(outcome.developDetail || '{}');
  } catch (e) {
    void e;
  }

  report.addTest(
    'Develop: Hot Chix seed',
    '✅',
    `${detail.enrichedCount || 0} recipes enriched, ${detail.coversUpdated || 0} menu covers`
  );
  return detail;
}

async function runKitchenPrepList(page, baseUrl, report, projectId) {
  await page.goto(`${baseUrl}/kitchen-management.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });
  await delay(2500);

  if (projectId) {
    await page.evaluate(id => {
      if (window.projectManager?.setCurrentProject) {
        window.projectManager.setCurrentProject(id);
      }
    }, projectId);
    await delay(1500);
  }

  const ready = await page
    .waitForFunction(
      () =>
        window.kitchenManagementSystem &&
        typeof window.showPrepList === 'function',
      { timeout: 20000 }
    )
    .catch(() => false);

  if (!ready) {
    report.addTest('Develop: kitchen prep list', '❌', 'Kitchen management not ready');
    return false;
  }

  const prepStats = await page.evaluate(async pid => {
    if (pid && window.projectManager?.setCurrentProject) {
      window.projectManager.setCurrentProject(pid);
    }
    const kms = window.kitchenManagementSystem;
    if (kms?.loadUserData) {
      await kms.loadUserData();
    }
    window.showPrepList();
    const area = document.getElementById('output-area');
    const components = document.querySelectorAll('.prep-component').length;
    const title = document.getElementById('output-title')?.textContent || '';
    const plan = kms?.generateNextDayPrepList?.();
    return {
      active: area?.classList.contains('active'),
      components,
      title,
      menuItems: kms?.currentMenuItems?.length || 0,
      recipes: kms?.currentRecipes?.length || 0,
      planComponents: plan?.components?.length || 0,
      shopping: plan?.shopping?.length || 0
    };
  }, projectId);

  const componentCount = prepStats.components || prepStats.planComponents || 0;
  const ok = prepStats.active && componentCount > 0;
  report.addTest(
    'Develop: kitchen prep list',
    ok ? '✅' : prepStats.menuItems ? '⚠️' : '❌',
    ok
      ? `${componentCount} prep components, ${prepStats.shopping} shopping lines (${prepStats.title.trim()})`
      : `menu items: ${prepStats.menuItems}, components: ${componentCount}`
  );
  return ok;
}

async function runMobileShiftPrepList(page, baseUrl, report, projectId) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/mobile-compliance.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });
  await delay(3000);

  const appVisible = await page
    .locator('#app-panel')
    .isVisible({ timeout: 10000 })
    .catch(() => false);
  if (!appVisible) {
    report.addTest('Develop: mobile prep list', '⚠️', 'Shift app not signed in');
    await page.setViewportSize({ width: 1400, height: 900 });
    return false;
  }

  if (projectId) {
    const picker = page.locator('#project-picker');
    if (await picker.isVisible({ timeout: 3000 }).catch(() => false)) {
      await picker.selectOption({ value: projectId }).catch(async () => {
        await page.evaluate(id => {
          const sel = document.getElementById('project-picker');
          if (sel) {
            sel.value = id;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, projectId);
      });
      await delay(1200);
    }
  }

  await page.locator('[data-hub-tab="lists"]').first().click();
  await delay(800);
  await page.locator('#panel-section-lists').waitFor({ state: 'visible', timeout: 8000 });

  const prepTasks = [
    'Brine chicken thighs (AM)',
    'Mix Nashville hot oil',
    'Portion mac & cheese pans'
  ];

  for (const task of prepTasks) {
    await page.locator('#prep-check-item-input').fill(task);
    await page.locator('#btn-add-prep-item').click();
    await delay(300);
  }

  const itemCount = await page.locator('#prep-checklist-items li').count();
  await page.locator('#btn-save-prep').click();
  await delay(2000);

  const saved = await page.evaluate(() => {
    const items = document.querySelectorAll('#prep-checklist-items li').length;
    const status = document.documentElement.getAttribute('data-mc-prep-saved');
    return { items, status };
  });

  const ok = itemCount >= prepTasks.length;
  report.addTest(
    'Develop: mobile prep list',
    ok ? '✅' : '⚠️',
    `${itemCount} checklist items${saved.status ? ' (saved)' : ''}`
  );

  await page.setViewportSize({ width: 1400, height: 900 });
  return ok;
}

async function runRecipeDeveloper(page, baseUrl, report, recipeId) {
  const editId = recipeId || 'rbp_hot_chix_boston_r1';
  await page.goto(`${baseUrl}/recipe-developer.html?edit=${encodeURIComponent(editId)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });
  await delay(4000);

  const devResult = await page.evaluate(() => {
    const nameEl = document.getElementById('recipe-name');
    const title = nameEl?.value || '';
    if (!title) {
      return { ok: false, reason: 'recipe_not_loaded' };
    }

    if (typeof openAddPrepItemModal === 'function') {
      openAddPrepItemModal();
    }
    const prepName = document.getElementById('prep-item-name');
    const prepNotes = document.getElementById('prep-item-notes');
    if (prepName) {
      prepName.value = 'House pickle chips';
      if (prepNotes) {
        prepNotes.value = 'Overnight quick pickle for sandwich service';
      }
      if (typeof addPrepItem === 'function') {
        addPrepItem();
      }
    }

    const instrContainer = document.getElementById('instructions-container');
    const instrInputs = instrContainer
      ? [...instrContainer.querySelectorAll('textarea, input[type="text"]')]
      : [];
    if (instrInputs.length === 0 && typeof addInstruction === 'function') {
      addInstruction();
    }

    const notes = document.getElementById('sketch-notes');
    if (notes && !notes.value) {
      notes.value = 'Owner bot: verify hot hold time and bun toast standard.';
    }

    let saved = false;
    if (typeof saveRecipe === 'function') {
      saveRecipe();
      saved = true;
    }

    const prepCount = document.querySelectorAll('#prep-items-container [data-prep-item]').length;
    const prepRows = document.querySelectorAll('#prep-items-container > div').length;

    return {
      ok: true,
      title,
      saved,
      prepItems: prepCount || prepRows,
      instructions: instrContainer
        ? instrContainer.querySelectorAll('textarea, input').length
        : 0
    };
  });

  const checks = [
    { name: 'recipe title', locator: page.locator('#recipe-name') },
    { name: 'ingredients section', locator: page.locator('#ingredients-container') },
    { name: 'prep items section', locator: page.locator('#prep-items-container') },
    { name: 'save control', locator: page.getByRole('button', { name: /Save/i }).first() }
  ];

  let missing = 0;
  for (const check of checks) {
    if (!(await check.locator.isVisible({ timeout: 5000 }).catch(() => false))) {
      missing += 1;
    }
  }

  const ok = devResult.ok && missing === 0;
  report.addTest(
    'Develop: recipe developer',
    ok ? '✅' : devResult.ok ? '⚠️' : '❌',
    devResult.ok
      ? `${devResult.title} — prep items: ${devResult.prepItems}, saved: ${devResult.saved}`
      : devResult.reason || 'load failed'
  );
  return ok;
}

async function runDevelopWorkflows(page, baseUrl, report, options = {}) {
  if (SKIP_DEVELOP) {
    report.addTest('Develop workflows', '⚠️', 'Skipped (OWNER_BOT_SKIP_DEVELOP)');
    return;
  }

  if (!options.signedIn) {
    report.addTest('Develop workflows', '⚠️', 'Skipped — not signed in');
    return;
  }

  console.log('\n=== PHASE 3.5: Prep lists & recipe developer ===\n');

  const seed = await ensureHotChixReady(page, baseUrl, report);
  if (!seed?.projectId) {
    report.addIssue('MAJOR', 'Develop', 'Hot Chix workspace not ready for prep/dev tools');
    return;
  }

  await runKitchenPrepList(page, baseUrl, report, seed.projectId);
  if (options.screenshot) {
    await options.screenshot('step_develop_kitchen_prep.png');
  }

  await runMobileShiftPrepList(page, baseUrl, report, seed.projectId);
  if (options.screenshot) {
    await options.screenshot('step_develop_mobile_prep.png');
  }

  await runRecipeDeveloper(page, baseUrl, report, `rbp_hot_chix_boston_r1`);
  if (options.screenshot) {
    await options.screenshot('step_develop_recipe_developer.png');
  }
}

module.exports = {
  SKIP_DEVELOP,
  ensureHotChixReady,
  runKitchenPrepList,
  runMobileShiftPrepList,
  runRecipeDeveloper,
  runDevelopWorkflows
};
