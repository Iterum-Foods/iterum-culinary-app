/**
 * Enrich Hot Chix Boston recipes for prep lists and recipe developer workflows.
 */
(function () {
  'use strict';

  const RESTAURANT_NAME = 'Hot Chix Boston';
  const SLUG = 'hot_chix_boston';

  const RECIPE_ENRICHMENTS = {
    [`rbp_${SLUG}_r1`]: {
      servings: 4,
      prepTime: 45,
      cookTime: 20,
      station: 'Hot Line',
      ingredients: [
        { name: 'Chicken thigh', quantity: '32', unit: 'oz' },
        { name: 'Buttermilk', quantity: '2', unit: 'cups' },
        { name: 'All-purpose flour', quantity: '3', unit: 'cups' },
        { name: 'Cayenne pepper', quantity: '2', unit: 'tbsp' },
        { name: 'Paprika', quantity: '1', unit: 'tbsp' },
        { name: 'Brioche bun', quantity: '4', unit: 'each' },
        { name: 'Pickle chips', quantity: '1', unit: 'cup' }
      ],
      instructions: [
        'Brine chicken 4–12 hours in buttermilk.',
        'Dredge in seasoned flour; rest 10 minutes.',
        'Fry at 325°F until 165°F internal.',
        'Toss in Nashville hot oil; build on toasted bun with pickles.'
      ],
      prepItems: [
        {
          name: 'Nashville hot oil',
          description: 'Oil + cayenne + paprika finish for sandwich toss',
          status: 'needs-development'
        }
      ]
    },
    [`rbp_${SLUG}_r4`]: {
      servings: 6,
      prepTime: 30,
      cookTime: 15,
      station: 'Hot Line',
      ingredients: [
        { name: 'Chicken tenders', quantity: '18', unit: 'oz' },
        { name: 'Buttermilk', quantity: '1.5', unit: 'cups' },
        { name: 'Seasoned flour', quantity: '2', unit: 'cups' },
        { name: 'Nashville hot oil', quantity: '0.5', unit: 'cup' }
      ],
      instructions: [
        'Brine tenders 2–4 hours.',
        'Dredge and fry at 350°F until crisp and 165°F.',
        'Toss in hot oil; hold for service.'
      ],
      prepItems: []
    },
    [`rbp_${SLUG}_r7`]: {
      servings: 8,
      prepTime: 20,
      cookTime: 25,
      station: 'Hot Line',
      ingredients: [
        { name: 'Elbow macaroni', quantity: '1', unit: 'lb' },
        { name: 'Cheddar cheese', quantity: '12', unit: 'oz' },
        { name: 'Whole milk', quantity: '2', unit: 'cups' },
        { name: 'Butter', quantity: '4', unit: 'oz' }
      ],
      instructions: [
        'Cook pasta al dente; drain.',
        'Make cheese sauce; fold in pasta.',
        'Hold hot; refresh every 2 hours.'
      ],
      prepItems: []
    }
  };

  function mergeById(existing, incoming) {
    const map = new Map((existing || []).map(row => [row.id, row]));
    incoming.forEach(row => map.set(row.id, { ...(map.get(row.id) || {}), ...row }));
    return Array.from(map.values());
  }

  function findHotchixProject(pm) {
    return (pm?.projects || []).find(
      p =>
        p &&
        !p.isArchived &&
        (p.name === RESTAURANT_NAME ||
          (Array.isArray(p.tags) && p.tags.includes('owner-bot')))
    );
  }

  function resolveUserId(pm) {
    return (
      pm?.currentUserId ||
      window.userDataManager?.userId ||
      window.authManager?.currentUser?.userId ||
      window.authManager?.currentUser?.id ||
      null
    );
  }

  /**
   * Add ingredients, instructions, and projected covers for meaningful prep plans.
   */
  function iterumEnrichHotchixRecipes() {
    const pm = window.projectManager;
    const uid = resolveUserId(pm);
    if (!pm || !uid) {
      throw new Error('not_signed_in');
    }

    const project = findHotchixProject(pm);
    if (!project) {
      throw new Error('hotchix_project_missing');
    }

    pm.setCurrentProject(project.id);

    const udm = window.userDataManager;
    const recipeKey = udm ? null : `recipes_${uid}`;
    let recipes = udm
      ? udm.loadData('recipes') || []
      : JSON.parse(localStorage.getItem(recipeKey) || '[]');

    let enrichedCount = 0;
    recipes = recipes.map(recipe => {
      if (!recipe || recipe.projectId !== project.id) return recipe;
      const patch = RECIPE_ENRICHMENTS[recipe.id];
      if (!patch) return recipe;
      enrichedCount += 1;
      const prepItems = (patch.prepItems || []).map((item, i) => ({
        id: item.id || `prep_${recipe.id}_${i}`,
        name: item.name,
        description: item.description || '',
        status: item.status || 'needs-development',
        createdAt: new Date().toISOString()
      }));
      return {
        ...recipe,
        ...patch,
        prepItems,
        status: recipe.status === 'published' ? 'published' : 'in-progress',
        lastModified: new Date().toISOString(),
        source: 'rbp-develop-seed'
      };
    });

    if (udm && typeof udm.saveData === 'function') {
      udm.saveData('recipes', recipes);
    } else {
      localStorage.setItem(recipeKey, JSON.stringify(recipes));
      localStorage.setItem('recipes', JSON.stringify(recipes));
    }

    if (window.universalRecipeManager?.saveRecipeLibrary) {
      const library = window.universalRecipeManager.getRecipeLibrary();
      window.universalRecipeManager.saveRecipeLibrary(
        mergeById(library, recipes.filter(r => r.projectId === project.id))
      );
    }

    const menuRaw = localStorage.getItem(`menu_data_${project.id}`);
    let menuPayload = menuRaw ? JSON.parse(menuRaw) : null;
    let coversUpdated = 0;
    if (menuPayload && Array.isArray(menuPayload.items)) {
      menuPayload.items = menuPayload.items.map(item => {
        if (!item || item.projectedCovers) return item;
        coversUpdated += 1;
        const cat = String(item.category || '').toLowerCase();
        const covers =
          cat === 'sandwiches' || cat === 'mains' || cat === 'combos' ? 60 : 40;
        return { ...item, projectedCovers: covers, prepStation: 'Hot Line' };
      });
      menuPayload.updatedAt = new Date().toISOString();
      localStorage.setItem(`menu_data_${project.id}`, JSON.stringify(menuPayload));
    }

    document.documentElement.setAttribute('data-rbp-develop-done', 'ok');
    document.documentElement.setAttribute(
      'data-rbp-develop-detail',
      JSON.stringify({ projectId: project.id, enrichedCount, coversUpdated })
    );

    return {
      projectId: project.id,
      projectName: project.name,
      enrichedCount,
      coversUpdated,
      recipeIds: Object.keys(RECIPE_ENRICHMENTS)
    };
  }

  async function iterumPrepareHotchixForDevelop(options) {
    const opts = options || {};
    let project = findHotchixProject(window.projectManager);
    if (!project && typeof window.iterumProvisionHotchixBoston === 'function') {
      await window.iterumProvisionHotchixBoston({
        forceNew: !!opts.forceNew,
        syncCloud: opts.syncCloud !== false
      });
    }
    return iterumEnrichHotchixRecipes();
  }

  window.iterumEnrichHotchixRecipes = iterumEnrichHotchixRecipes;
  window.iterumPrepareHotchixForDevelop = iterumPrepareHotchixForDevelop;
  window.iterumHotchixSandwichRecipeId = `rbp_${SLUG}_r1`;
})();
