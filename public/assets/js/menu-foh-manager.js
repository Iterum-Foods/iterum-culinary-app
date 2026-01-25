// Menu FOH Manager
// Generates front-of-house briefing sheets from menu and recipe data

class MenuFOHManager {
  generateSheet({ projectId = 'master', menu = {}, menuItems = [], recipes = [], serviceDate = new Date() } = {}) {
    const library = recipes.length ? recipes : (window.universalRecipeManager?.getRecipeLibrary?.() || []);
    const sheet = {
      projectId,
      menuName: menu.name || 'Menu',
      serviceDate: this.formatDate(serviceDate),
      generatedDate: new Date().toISOString(),
      restaurant: menu.projectName || menu.name || 'Restaurant',
      highlights: [],
      courses: [],
      allergenSummary: {},
      dietarySummary: {},
      warnings: [],
      notes: []
    };

    const items = Array.isArray(menuItems) ? menuItems : (menu.items || []);
    const courseMap = new Map();
    const allergenTotals = new Map();
    const dietaryTotals = new Map();

    items.forEach((item) => {
      const recipe = this.resolveRecipe(item, library);
      const status = window.menuRecipeIntegration?.getRecipeStatus?.(item.id);

      if (!recipe) {
        sheet.warnings.push({
          itemId: item.id,
          name: item.name,
          type: 'no-recipe',
          message: 'No linked recipe. FOH talking points may be incomplete.'
        });
      }

      const talkingPoints = this.buildTalkingPoints(item, recipe);
      const allergens = this.normalizeList(recipe?.allergens || item.allergens);
      const dietary = this.normalizeList(recipe?.dietary || item.dietaryInfo);
      const pairings = this.normalizePairings(recipe?.pairings || recipe?.winePairings || recipe?.beveragePairings);

      allergens.forEach((allergen) => {
        const key = allergen.toLowerCase();
        allergenTotals.set(key, (allergenTotals.get(key) || 0) + 1);
      });

      dietary.forEach((tag) => {
        const key = tag.toLowerCase();
        dietaryTotals.set(key, (dietaryTotals.get(key) || 0) + 1);
      });

      const courseKey = item.category || 'Uncategorized';
      if (!courseMap.has(courseKey)) {
        courseMap.set(courseKey, []);
      }

      courseMap.get(courseKey).push({
        menuItemId: item.id,
        name: item.name,
        description: item.description || recipe?.description || 'Description pending.',
        status,
        talkingPoints,
        allergens,
        dietary,
        serviceNotes: item.serviceNotes || recipe?.serviceNotes || '',
        pairings,
        isSignature: !!item.isSignature,
        isNew: !!item.isNew,
        station: item.prepStation || 'General'
      });

      if (item.isSignature || item.isNew) {
        sheet.highlights.push({
          menuItemId: item.id,
          name: item.name,
          reason: item.isSignature ? 'Signature Dish' : 'New Dish',
          talkingPoints,
          status
        });
      }

      if (!allergens.length) {
        sheet.warnings.push({
          itemId: item.id,
          name: item.name,
          type: 'missing-allergens',
          message: 'Allergen information missing.'
        });
      }

      if (!talkingPoints.length) {
        sheet.warnings.push({
          itemId: item.id,
          name: item.name,
          type: 'missing-talking-points',
          message: 'No talking points found. Add story or service notes.'
        });
      }
    });

    const courses = Array.from(courseMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, items]) => ({ category, items }));

    sheet.courses = courses;
    sheet.allergenSummary = this.mapToObject(allergenTotals);
    sheet.dietarySummary = this.mapToObject(dietaryTotals);
    sheet.notes = this.buildNotes(sheet);

    return sheet;
  }

  resolveRecipe(item, library) {
    if (window.menuRecipeIntegration) {
      const linked = window.menuRecipeIntegration.getRecipeForMenuItem(item.id);
      if (linked) return linked;
    }
    if (item.recipeId) {
      return library.find((recipe) => recipe.id === item.recipeId) || null;
    }
    return null;
  }

  buildTalkingPoints(item, recipe) {
    const points = [];
    const description = item.description || recipe?.description || '';
    if (description) {
      points.push(description);
    }

    const story = recipe?.story || recipe?.originStory || recipe?.history;
    if (story) {
      points.push(story);
    }

    const highlights = recipe?.highlights || recipe?.keyPoints;
    if (Array.isArray(highlights)) {
      highlights.forEach((point) => {
        if (point && typeof point === 'string') {
          points.push(point);
        }
      });
    }

    if (item.isSignature) {
      points.push('Signature dish of the kitchen.');
    }

    if (item.isNew) {
      points.push('New addition to the menu—encourage guests to try it!');
    }

    if (item.serviceNotes) {
      points.push(`Service notes: ${item.serviceNotes}`);
    }

    return [...new Set(points)].filter(Boolean);
  }

  normalizeList(list) {
    if (!list) return [];
    if (Array.isArray(list)) {
      return list.map((item) => item && item.toString().trim()).filter(Boolean);
    }
    if (typeof list === 'string') {
      return list.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
  }

  normalizePairings(pairings) {
    if (!pairings) return [];
    if (Array.isArray(pairings)) {
      return pairings
        .map((p) => {
          if (!p) return '';
          if (typeof p === 'string') return p;
          return p.name || p.title || p.description || '';
        })
        .filter(Boolean);
    }
    if (typeof pairings === 'string') {
      return pairings
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    }
    return [];
  }

  buildNotes(sheet) {
    const notes = [
      'Encourage guests to ask about preparation details and ingredient sourcing.',
      'Highlight signature and new dishes during pre-service brief.',
      'Review allergen information with FOH staff before service.'
    ];

    if (sheet.warnings.length) {
      notes.push('Resolve the warnings above before service if possible.');
    }

    if (Object.keys(sheet.allergenSummary).length) {
      notes.push('Ensure allergen matrix is updated to match this sheet.');
    }

    return notes;
  }

  mapToObject(map) {
    const obj = {};
    map.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  formatDate(date) {
    if (!(date instanceof Date)) {
      const parsed = new Date(date);
      if (!Number.isNaN(parsed.valueOf())) {
        return parsed.toISOString().split('T')[0];
      }
      return date;
    }
    return date.toISOString().split('T')[0];
  }
}

window.menuFOHManager = new MenuFOHManager();
