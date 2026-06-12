/**
 * Provision a restaurant workspace, recipes, and launch menu from an RBP-style plan.
 * Runs in the signed-in user's browser so workspaces appear in their project list.
 */
(function () {
  'use strict';

  const SKIP_CATEGORIES = new Set(['spice level', 'modifier']);
  const PLAN_URL = 'data/hotchix-boston-plan.json';

  function mergeById(existing, incoming) {
    const map = new Map((existing || []).map(row => [row.id, row]));
    incoming.forEach(row => map.set(row.id, row));
    return Array.from(map.values());
  }

  function resolveUserId(pm) {
    const udm = window.userDataManager;
    return (
      pm?.currentUserId ||
      udm?.userId ||
      window.authManager?.currentUser?.userId ||
      window.authManager?.currentUser?.id ||
      null
    );
  }

  function buildProvisionPayload(plan, options) {
    const restaurant = plan.restaurant || {};
    const forceNew = Boolean(options.forceNew);
    const pm = window.projectManager;
    const uid = resolveUserId(pm);

    if (!pm || !uid) {
      throw new Error('not_signed_in');
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

    const menuSource = Array.isArray(plan.menu) ? plan.menu : [];
    const sellable = menuSource.filter(item => {
      if (!item || !item.name) return false;
      const cat = String(item.category || '').toLowerCase();
      if (SKIP_CATEGORIES.has(cat)) return false;
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

      recipes.push({
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
        source: 'rbp-provision',
        lastModified: now
      });

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

    const udm = window.userDataManager;
    if (udm && typeof udm.saveData === 'function') {
      const existing = udm.loadData('recipes') || [];
      udm.saveData('recipes', mergeById(existing, recipes));
    } else {
      const key = `recipes_${uid}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const merged = mergeById(existing, recipes);
      localStorage.setItem(key, JSON.stringify(merged));
      localStorage.setItem('recipes', JSON.stringify(merged));
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
      skippedMenuRows: menuSource.length - sellable.length,
      recipes,
      menuPayload,
      userId: uid
    };
  }

  async function waitForFirestore(maxMs) {
    const deadline = Date.now() + (maxMs || 8000);
    while (Date.now() < deadline) {
      const fs = window.firestoreSync;
      if (fs?.initialized) return fs;
      await new Promise(r => setTimeout(r, 200));
    }
    return window.firestoreSync?.initialized ? window.firestoreSync : null;
  }

  async function syncProvisionToCloud(result) {
    const fs = await waitForFirestore();
    if (!fs) return { cloud: false, reason: 'firestore_not_ready' };

    try {
      await fs.ensureProjectDoc(result.projectId, {
        name: result.projectName,
        ownerId: result.userId,
        tags: ['owner-bot', 'rbp']
      });
      await fs.saveMenuSnapshot({
        projectId: result.projectId,
        menu: result.menuPayload.menu,
        items: result.menuPayload.items
      });
      await fs.saveRecipeLibrarySnapshot(result.recipes, {
        userId: result.userId
      });
      return { cloud: true };
    } catch (err) {
      console.warn('rbp-provision: cloud sync failed', err);
      return { cloud: false, reason: err.message || 'sync_error' };
    }
  }

  /**
   * @param {object} plan - { restaurant, menu }
   * @param {{ forceNew?: boolean, syncCloud?: boolean }} [options]
   */
  async function iterumProvisionFromPlan(plan, options) {
    const opts = options || {};
    if (!window.projectManager) {
      throw new Error('project_manager_not_ready');
    }
    const result = buildProvisionPayload(plan, opts);
    let cloud = { cloud: false, reason: 'skipped' };
    if (opts.syncCloud !== false) {
      cloud = await syncProvisionToCloud(result);
    }
    return { ...result, cloudSync: cloud };
  }

  async function loadHotchixPlan() {
    const res = await fetch(PLAN_URL, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`plan_fetch_failed:${res.status}`);
    }
    return res.json();
  }

  async function iterumProvisionHotchixBoston(options) {
    const plan = await loadHotchixPlan();
    return iterumProvisionFromPlan(plan, options);
  }

  window.iterumProvisionFromPlan = iterumProvisionFromPlan;
  window.iterumProvisionHotchixBoston = iterumProvisionHotchixBoston;
  window.iterumLoadHotchixPlan = loadHotchixPlan;
})();
