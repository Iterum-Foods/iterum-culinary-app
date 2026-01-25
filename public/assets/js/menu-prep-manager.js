// Menu Prep Manager
// Aggregates menu items, linked recipes, and generates prep plans, shopping lists, and station tasks

class MenuPrepManager {
  constructor() {
    this.defaultStations = ['General', 'Garde Manger', 'Hot Line', 'Pastry', 'Butcher', 'Bar', 'Expo'];
  }

  generatePrepPlan({ projectId = 'master', menu = {}, menuItems = [], recipes = [], serviceDate = new Date() } = {}) {
    const library = recipes.length ? recipes : (window.universalRecipeManager?.getRecipeLibrary?.() || []);
    const plan = {
      projectId,
      menuName: menu.name || 'Current Menu',
      prepDate: this.formatDate(serviceDate),
      generatedDate: new Date().toISOString(),
      restaurant: menu.projectName || menu.name || 'Restaurant',
      menuSummary: [],
      stations: {},
      components: [],
      shopping: [],
      notes: [],
      warnings: []
    };

    const ingredientTotals = new Map();

    const items = Array.isArray(menuItems) ? menuItems : (menu.items || []);

    items.forEach((item) => {
      const summary = this.buildMenuSummary(item);
      const status = window.menuRecipeIntegration?.getRecipeStatus(item.id);
      if (status) {
        summary.recipeStatus = status.status;
        summary.statusLabel = status.label;
        summary.statusIcon = status.icon;
      }

      const recipe = this.resolveRecipeForItem(item, library);
      if (!recipe) {
        summary.recipeStatus = 'no-recipe';
        summary.statusLabel = 'No Recipe';
        summary.statusIcon = '🔴';
        summary.warning = 'No linked recipe';
        plan.warnings.push({ itemId: item.id, name: item.name, type: 'missing-recipe', message: 'No recipe linked to menu item.' });
        plan.menuSummary.push(summary);
        return;
      }

      const covers = Number(item.projectedCovers) || 0;
      const servings = Number(recipe.servings || recipe.yield) || 1;
      const scale = covers > 0 ? covers / servings : 1;
      const station = item.prepStation || recipe.station || this.inferStation(item, recipe);
      summary.recipeStatus = summary.recipeStatus || 'linked';
      summary.station = station;
      summary.recipeId = recipe.id;
      summary.covers = covers;
      summary.portion = item.portionSize || recipe.portionSize || `${servings} servings`;
      summary.notes = item.serviceNotes || '';
      plan.menuSummary.push(summary);

      const instructions = this.extractInstructions(recipe);
      const components = this.buildComponentTasks(item, recipe, scale);
      const priority = this.calculatePriority(item, recipe);

      const stationKey = station || 'General';
      if (!plan.stations[stationKey]) {
        plan.stations[stationKey] = {
          station: stationKey,
          tasks: [],
          totalCovers: 0
        };
      }

      const scaledIngredients = this.scaleIngredients(recipe.ingredients || [], scale, ingredientTotals, stationKey, item.name);

      plan.stations[stationKey].tasks.push({
        menuItemId: item.id,
        recipeId: recipe.id,
        name: item.name,
        covers,
        scale,
        instructions,
        components,
        ingredients: scaledIngredients.detail,
        notes: item.serviceNotes || '',
        priority,
        recipeStatus: summary.recipeStatus
      });
      plan.stations[stationKey].totalCovers += covers;

      plan.components.push({
        componentName: item.name,
        recipeName: recipe.title || recipe.name,
        dailyPar: covers ? `${covers} covers` : 'As needed',
        yield: recipe.yield || `${servings} servings`,
        portionSize: item.portionSize || recipe.portionSize || 'Standard',
        shelfLife: recipe.shelfLife || 'Same Day',
        instructions,
        priority
      });
    });

    plan.shopping = this.convertIngredientTotals(ingredientTotals);
    plan.notes = this.buildNotes(plan);

    return plan;
  }

  buildMenuSummary(item) {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      allergens: item.allergens || [],
      dietaryInfo: item.dietaryInfo || [],
      covers: Number(item.projectedCovers) || 0,
      station: item.prepStation || 'General'
    };
  }

  resolveRecipeForItem(item, library) {
    const recipeIntegration = window.menuRecipeIntegration;
    if (recipeIntegration) {
      const linked = recipeIntegration.getRecipeForMenuItem(item.id);
      if (linked) return linked;
    }
    const recipeId = item.recipeId;
    if (recipeId) {
      return library.find((r) => r.id === recipeId) || null;
    }
    return null;
  }

  scaleIngredients(ingredients, scale, totalsMap, station, menuItemName) {
    const detail = [];
    ingredients.forEach((ingredient) => {
      const parsed = this.parseQuantity(ingredient.amount || ingredient.quantity);
      const unit = ingredient.unit || '';
      const name = ingredient.name || ingredient.ingredientName || 'Unknown Ingredient';
      const scaledQuantity = parsed !== null ? parsed * scale : null;

      detail.push({
        name,
        unit,
        originalAmount: ingredient.amount || ingredient.quantity || '',
        scaledAmount: scaledQuantity,
        notes: ingredient.notes || '',
        station,
        menuItemName
      });

      if (scaledQuantity !== null) {
        const key = `${name}|${unit}`;
        if (!totalsMap.has(key)) {
          totalsMap.set(key, {
            name,
            unit,
            quantity: 0,
            stations: new Set(),
            menuItems: new Set()
          });
        }
        const entry = totalsMap.get(key);
        entry.quantity += scaledQuantity;
        entry.stations.add(station);
        entry.menuItems.add(menuItemName);
      }
    });

    return { detail };
  }

  convertIngredientTotals(totalsMap) {
    const results = [];
    totalsMap.forEach((value) => {
      results.push({
        name: value.name,
        quantity: this.roundQuantity(value.quantity),
        unit: value.unit,
        category: this.inferIngredientCategory(value.name),
        stations: Array.from(value.stations),
        menuItems: Array.from(value.menuItems)
      });
    });

    results.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return results;
  }

  buildComponentTasks(item, recipe, scale) {
    const components = recipe.components || [];
    if (!components.length) return [];

    return components.map((component) => ({
      name: component.name,
      scaledYield: component.yield ? `${component.yield} x ${this.roundQuantity(scale)} ` : null,
      dailyPar: component.dailyPar || item.projectedCovers || 'As needed',
      instructions: this.normalizeComponentInstructions(component.instructions || [])
    }));
  }

  normalizeComponentInstructions(instructions) {
    if (Array.isArray(instructions)) {
      return instructions.map((inst) => (typeof inst === 'string' ? inst : inst.instruction || inst.text || '')).filter(Boolean);
    }
    if (typeof instructions === 'string') {
      return instructions.split('\n').map((line) => line.trim()).filter(Boolean);
    }
    return [];
  }

  extractInstructions(recipe) {
    const instructions = recipe.instructions || [];
    return instructions.map((inst) => (typeof inst === 'string' ? inst : inst.instruction || inst.text || '')).filter(Boolean);
  }

  calculatePriority(item, recipe) {
    const leadHours = Number(item.prepLeadTime) || 0;
    if (leadHours <= 4) return 5;
    if (leadHours <= 8) return 4;
    if (leadHours <= 24) return 3;
    if (leadHours <= 48) return 2;
    return 1;
  }

  inferStation(item, recipe) {
    if (item.category) {
      const lower = item.category.toLowerCase();
      if (lower.includes('salad') || lower.includes('cold')) return 'Garde Manger';
      if (lower.includes('dessert') || lower.includes('pastry')) return 'Pastry';
      if (lower.includes('bar') || lower.includes('drink')) return 'Bar';
    }
    if (recipe.category) {
      const lower = String(recipe.category).toLowerCase();
      if (lower.includes('salad') || lower.includes('cold')) return 'Garde Manger';
      if (lower.includes('dessert') || lower.includes('pastry')) return 'Pastry';
    }
    return 'General';
  }

  parseQuantity(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;

    const str = value.toString().trim();
    if (!str) return null;

    // Match mixed numbers (e.g., 1 1/2), fractions, decimals
    const mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)/);
    if (mixedMatch) {
      const whole = parseInt(mixedMatch[1], 10);
      const numerator = parseInt(mixedMatch[2], 10);
      const denominator = parseInt(mixedMatch[3], 10);
      if (!Number.isNaN(whole) && !Number.isNaN(numerator) && !Number.isNaN(denominator) && denominator !== 0) {
        return whole + numerator / denominator;
      }
    }

    const fractionMatch = str.match(/^(\d+)\/(\d+)/);
    if (fractionMatch) {
      const numerator = parseInt(fractionMatch[1], 10);
      const denominator = parseInt(fractionMatch[2], 10);
      if (!Number.isNaN(numerator) && !Number.isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }

    const decimalMatch = str.match(/^(\d+(?:\.\d+)?)/);
    if (decimalMatch) {
      const number = parseFloat(decimalMatch[1]);
      if (!Number.isNaN(number)) return number;
    }

    return null;
  }

  roundQuantity(value) {
    if (value === null || value === undefined) return null;
    return Math.round(value * 100) / 100;
  }

  inferIngredientCategory(name) {
    if (!name) return 'General';
    const lower = name.toLowerCase();
    if (lower.includes('lettuce') || lower.includes('greens') || lower.includes('herb')) return 'Produce';
    if (lower.includes('fish') || lower.includes('salmon') || lower.includes('tuna')) return 'Seafood';
    if (lower.includes('beef') || lower.includes('pork') || lower.includes('chicken')) return 'Proteins';
    if (lower.includes('cream') || lower.includes('cheese') || lower.includes('milk')) return 'Dairy';
    if (lower.includes('flour') || lower.includes('sugar') || lower.includes('spice')) return 'Dry Goods';
    return 'General';
  }

  buildNotes(plan) {
    const baseNotes = [
      'Verify inventory before starting prep tasks.',
      'Schedule prep to align with station lead times.',
      'Label and date all prepared components.',
      'Coordinate with FOH on specials and 86 list.',
      'Confirm allergen handling procedures for highlighted items.'
    ];

    if (plan.warnings.length) {
      plan.warnings.forEach((warning) => {
        baseNotes.push(`⚠️ ${warning.name || 'Item'}: ${warning.message}`);
      });
    }

    return baseNotes;
  }

  formatDate(date) {
    if (!(date instanceof Date)) return date;
    return date.toISOString().split('T')[0];
  }
}

window.menuPrepManager = new MenuPrepManager();
