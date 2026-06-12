/**
 * Owner Bot — provision restaurant workspace, recipes, and launch menu
 * from iterum_test_plan.json + optional RBP business_plan.json.
 *
 * Usage:
 *   npm run serve:test
 *   npm run owner-bot:provision
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const {
  loadLocalEnv,
  loadTestPlan,
  delay,
  trySignIn,
  waitForProjectManager
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
const FORCE_NEW = process.env.OWNER_BOT_FORCE_NEW_PROJECT === 'true';

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Runs in the browser on dashboard.html after sign-in.
 */
async function provisionInBrowser(page, plan) {
  const ready = await waitForProjectManager(page);
  if (!ready) {
    throw new Error('projectManager not ready — open dashboard after sign-in');
  }

  return page.evaluate(
    async ({ restaurant, menu, forceNew }) => {
      const pm = window.projectManager;
      const udm = window.userDataManager;
      const uid =
        pm.currentUserId ||
        udm?.userId ||
        window.authManager?.currentUser?.userId ||
        window.authManager?.currentUser?.id;

      if (!uid) {
        throw new Error('No user id after sign-in');
      }

      const slug = (restaurant.name || 'restaurant')
        .replace(/[^a-z0-9]+/gi, '_')
        .toLowerCase()
        .slice(0, 28);

      let project = null;
      if (!forceNew) {
        project = pm.projects.find(
          p =>
            p &&
            !p.isArchived &&
            (p.name === restaurant.name ||
              (Array.isArray(p.tags) && p.tags.includes('owner-bot')))
        );
      }

      if (project) {
        pm.setCurrentProject(project.id);
      } else {
        project = pm.createProject({
          name: restaurant.name,
          description: [
            restaurant.type,
            restaurant.location,
            restaurant.openingDate ? `Opens ${restaurant.openingDate}` : ''
          ]
            .filter(Boolean)
            .join(' · '),
          type: 'restaurant',
          icon: '🍽️',
          tags: ['owner-bot', 'rbp'],
          cuisineType: restaurant.cuisineType,
          location: restaurant.location,
          openingDate: restaurant.openingDate
        });
      }

      const skipCategories = new Set(['spice level', 'modifier']);
      const menuSource = Array.isArray(menu) ? menu : [];
      const sellable = menuSource.filter(item => {
        if (!item || !item.name) return false;
        const cat = String(item.category || '').toLowerCase();
        if (skipCategories.has(cat)) return false;
        return Number(item.price) > 0 || cat === 'sides' || cat === 'beverages';
      });

      const recipes = [];
      const menuRows = [];
      const now = new Date().toISOString();

      sellable.forEach((item, index) => {
        const recipeId = `rbp_${slug}_r${item.id != null ? item.id : index + 1}`;
        const foodCost = Number(item.cogs) || 0;
        const price = Number(item.price) || 0;
        const margin =
          price > 0 ? Math.round(((price - foodCost) / price) * 1000) / 10 : null;

        const recipe = {
          id: recipeId,
          title: item.name,
          name: item.name,
          category: item.category || 'Menu',
          status: 'published',
          projectId: project.id,
          project: project.id,
          userId: uid,
          servings: 1,
          yield: item.quantity || '1 serving',
          ingredients: [],
          instructions: [
            `Standard prep for ${item.name}.`,
            'Verify heat level and plating before service.'
          ],
          notes: `Provisioned from Restaurant Business Planner. Target COGS $${foodCost.toFixed(2)}.`,
          cost: foodCost,
          source: 'owner-bot-provision',
          lastModified: now
        };
        recipes.push(recipe);

        menuRows.push({
          id: `rbp_${slug}_m${item.id != null ? item.id : index + 1}`,
          name: item.name,
          category: item.category || 'Menu',
          price,
          foodCost,
          marginPercent: margin,
          recipeId,
          recipeName: item.name,
          projectId: project.id,
          status: 'active',
          description: item.quantity || ''
        });
      });

      function mergeById(existing, incoming) {
        const map = new Map((existing || []).map(row => [row.id, row]));
        incoming.forEach(row => map.set(row.id, row));
        return Array.from(map.values());
      }

      if (udm && typeof udm.saveData === 'function') {
        const existing = udm.loadData('recipes') || [];
        udm.saveData('recipes', mergeById(existing, recipes));
      } else {
        const key = `recipes_${uid}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify(mergeById(existing, recipes)));
        localStorage.setItem('recipes', JSON.stringify(mergeById(existing, recipes)));
      }

      const menuId = `menu_${project.id}_launch`;
      const menuPayload = {
        menu: {
          id: menuId,
          name: `${restaurant.name} — Launch Menu`,
          projectId: project.id,
          status: 'active',
          updatedAt: now
        },
        items: menuRows,
        updatedAt: now
      };
      localStorage.setItem(`menu_data_${project.id}`, JSON.stringify(menuPayload));

      const menusKey = `menus_${uid}`;
      const menusList = JSON.parse(localStorage.getItem(menusKey) || '[]');
      const menuEntry = {
        id: menuId,
        name: menuPayload.menu.name,
        projectId: project.id,
        itemCount: menuRows.length,
        updatedAt: now
      };
      const idx = menusList.findIndex(m => m.id === menuId);
      if (idx >= 0) menusList[idx] = menuEntry;
      else menusList.push(menuEntry);
      localStorage.setItem(menusKey, JSON.stringify(menusList));

      try {
        localStorage.setItem('active_project', project.id);
        localStorage.setItem('active_project_name', project.name);
        localStorage.setItem('active_project_id', project.id);
        localStorage.setItem(`iterum_current_project_user_${uid}`, project.id);
      } catch (e) {
        void e;
      }

      document.dispatchEvent(
        new CustomEvent('projectChanged', {
          bubbles: true,
          detail: { projectId: project.id, project, userId: uid }
        })
      );

      return {
        projectId: project.id,
        projectName: project.name,
        recipeCount: recipes.length,
        menuItemCount: menuRows.length,
        menuId,
        menuName: menuPayload.menu.name,
        skippedMenuRows: menuSource.length - sellable.length
      };
    },
    {
      restaurant: plan.restaurant,
      menu: plan.menu,
      forceNew: FORCE_NEW
    }
  );
}

async function runProvision() {
  ensureOutputDir();
  const plan = loadTestPlan();
  const restaurantName = plan.restaurant?.name || 'Restaurant';

  console.log('Owner Bot — provision restaurant, menu, recipes\n');
  console.log(`Restaurant: ${restaurantName}`);
  console.log(`Menu items in plan: ${(plan.menu || []).length}`);
  if (plan._rbpLinked) console.log(`RBP: ${plan._rbpLinked}`);

  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  const report = { steps: [] };
  try {
    const signedIn = await trySignIn(
      page,
      BASE_URL,
      TEST_EMAIL,
      TEST_PASSWORD,
      {
        addTest: (name, status, details) => {
          report.steps.push({ name, status, details });
          console.log(`${status} ${name}: ${details}`);
        }
      }
    );
    if (!signedIn) {
      process.exitCode = 1;
      return;
    }

    await page.goto(`${BASE_URL}/dashboard.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });
    await delay(3000);

    console.log('\nProvisioning workspace, recipes, and menu...');
    const result = await provisionInBrowser(page, plan);
    console.log('\nProvisioned:');
    console.log(`  Workspace: ${result.projectName} (${result.projectId})`);
    console.log(`  Recipes:   ${result.recipeCount}`);
    console.log(`  Menu:      ${result.menuName} — ${result.menuItemCount} items`);
    if (result.skippedMenuRows) {
      console.log(`  Skipped:   ${result.skippedMenuRows} modifier/spice rows`);
    }

    await page.goto(`${BASE_URL}/menu-builder.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });
    await delay(2500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'provision_menu_builder.png'),
      fullPage: true
    });

    await page.goto(`${BASE_URL}/recipe-library.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });
    await delay(2500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'provision_recipe_library.png'),
      fullPage: true
    });

    const outPath = path.join(OUTPUT_DIR, 'provision_result.json');
    fs.writeFileSync(
      outPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          restaurant: plan.restaurant,
          result,
          steps: report.steps
        },
        null,
        2
      )
    );
    console.log(`\nSaved: ${outPath}`);
    console.log('\nNext: npm run owner-bot:run — to verify the full owner walkthrough.');
  } catch (err) {
    console.error('Provision failed:', err.message);
    process.exitCode = 1;
  } finally {
    await delay(1000);
    await browser.close();
  }
}

runProvision();
