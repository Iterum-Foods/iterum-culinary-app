/**
 * Enhanced Ingredients Manager
 * Separates built-in ingredients from user-added products
 */

class IngredientsManagerEnhanced {
  constructor() {
    this.builtInKey = 'base_ingredients_database';
    this.customKey = 'custom_ingredients';
    this.legacyKey = 'ingredients_database';
    this.initialized = false;
  }

  /**
   * Initialize and separate ingredients
   */
  async init() {
    if (this.initialized) {
      return;
    }

    // Load and separate ingredients
    await this.separateIngredients();

    this.initialized = true;
    console.log('✅ Enhanced Ingredients Manager initialized');
  }

  /**
   * Separate built-in ingredients from user-added products
   */
  projectIngredientList() {
    if (window.projectManager?.readProjectList) {
      return window.projectManager.readProjectList('ingredients');
    }
    return null;
  }

  persistProjectIngredients(all) {
    const safe = Array.isArray(all) ? all : [];
    if (window.projectManager?.writeProjectList) {
      window.projectManager.writeProjectList('ingredients', safe);
      return;
    }
    localStorage.setItem(this.legacyKey, JSON.stringify(safe));
    localStorage.setItem('ingredients', JSON.stringify(safe));
  }

  async separateIngredients() {
    if (window.projectManager?.readProjectList) {
      const projectList = window.projectManager.readProjectList('ingredients');
      console.log(`📦 Active project ingredients: ${projectList.length}`);
      return;
    }

    // Load all ingredients from legacy storage
    const allIngredients = JSON.parse(
      localStorage.getItem(this.legacyKey) ||
        localStorage.getItem('ingredients') ||
        '[]'
    );

    if (!Array.isArray(allIngredients) || allIngredients.length === 0) {
      console.log('📦 No ingredients found, will load from base database');
      return;
    }

    // Separate built-in (IDs starting with "ing_" and numeric) from custom
    const builtIn = [];
    const custom = [];

    allIngredients.forEach(ing => {
      // Built-in ingredients have IDs like "ing_001", "ing_002", etc.
      if (ing.id && /^ing_\d+$/.test(ing.id)) {
        builtIn.push(ing);
      } else {
        // Everything else is custom/user-added
        custom.push(ing);
      }
    });

    // Save separated ingredients
    if (builtIn.length > 0) {
      localStorage.setItem(this.builtInKey, JSON.stringify(builtIn));
      console.log(`📚 Separated ${builtIn.length} built-in ingredients`);
    }

    if (custom.length > 0) {
      localStorage.setItem(this.customKey, JSON.stringify(custom));
      console.log(`➕ Separated ${custom.length} custom ingredients`);
    }

    // Keep legacy key for backward compatibility
    localStorage.setItem(this.legacyKey, JSON.stringify(allIngredients));
  }

  /**
   * Get built-in ingredients
   */
  getBuiltInIngredients() {
    const projectList = this.projectIngredientList();
    if (projectList) {
      return projectList.filter(ing => this.isBuiltIn(ing));
    }
    const builtIn = JSON.parse(localStorage.getItem(this.builtInKey) || '[]');

    // If no built-in found, try to load from base database
    if (builtIn.length === 0) {
      const all = JSON.parse(localStorage.getItem(this.legacyKey) || '[]');
      return all.filter(ing => ing.id && /^ing_\d+$/.test(ing.id));
    }

    return builtIn;
  }

  /**
   * Get custom/user-added ingredients
   */
  getCustomIngredients() {
    const projectList = this.projectIngredientList();
    if (projectList) {
      return projectList.filter(ing => !this.isBuiltIn(ing));
    }
    return JSON.parse(localStorage.getItem(this.customKey) || '[]');
  }

  /**
   * Get all ingredients (built-in + custom)
   */
  getAllIngredients() {
    const projectList = this.projectIngredientList();
    if (projectList) {
      return projectList.slice();
    }
    const builtIn = this.getBuiltInIngredients();
    const custom = this.getCustomIngredients();
    return [...builtIn, ...custom];
  }

  /**
   * Add a custom ingredient
   */
  addCustomIngredient(ingredient) {
    // Ensure it's marked as custom
    if (!ingredient.id || /^ing_\d+$/.test(ingredient.id)) {
      // Generate custom ID
      ingredient.id =
        'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Mark as custom
    ingredient.isCustom = true;
    ingredient.dateAdded = ingredient.dateAdded || new Date().toISOString();

    const custom = this.getCustomIngredients();

    // Check for duplicates
    const existing = custom.find(
      ing =>
        ing.name.toLowerCase() === ingredient.name.toLowerCase() &&
        (!ingredient.supplier || ing.supplier === ingredient.supplier)
    );

    if (existing) {
      Object.assign(existing, ingredient);
    } else {
      custom.push(ingredient);
    }

    const builtIn = this.getBuiltInIngredients().filter(
      ing => !custom.some(item => item.id === ing.id)
    );
    this.persistProjectIngredients([...builtIn, ...custom]);

    console.log(`✅ Added custom ingredient: ${ingredient.name}`);
    return ingredient;
  }

  /**
   * Update custom ingredient
   */
  updateCustomIngredient(ingredientId, updates) {
    const all = this.getAllIngredients();
    const index = all.findIndex(ing => ing.id === ingredientId);

    if (index === -1) {
      console.warn(`⚠️ Custom ingredient not found: ${ingredientId}`);
      return false;
    }

    all[index] = {
      ...all[index],
      ...updates,
      lastModified: new Date().toISOString()
    };

    this.persistProjectIngredients(all);

    console.log(`✅ Updated custom ingredient: ${all[index].name}`);
    return true;
  }

  /**
   * Delete custom ingredient
   */
  deleteCustomIngredient(ingredientId) {
    const all = this.getAllIngredients();
    const filtered = all.filter(ing => ing.id !== ingredientId);

    if (filtered.length === all.length) {
      console.warn(`⚠️ Custom ingredient not found: ${ingredientId}`);
      return false;
    }

    this.persistProjectIngredients(filtered);

    console.log(`✅ Deleted custom ingredient: ${ingredientId}`);
    return true;
  }

  /**
   * Update legacy storage (for backward compatibility)
   */
  updateLegacyStorage() {
    this.persistProjectIngredients(this.getAllIngredients());
  }

  /**
   * Check if ingredient is built-in
   */
  isBuiltIn(ingredient) {
    return ingredient.id && /^ing_\d+$/.test(ingredient.id);
  }

  /**
   * Check if ingredient is custom
   */
  isCustom(ingredient) {
    return ingredient.isCustom || !this.isBuiltIn(ingredient);
  }

  /**
   * Get statistics
   */
  getStats() {
    const builtIn = this.getBuiltInIngredients();
    const custom = this.getCustomIngredients();

    return {
      builtIn: builtIn.length,
      custom: custom.length,
      total: builtIn.length + custom.length
    };
  }
}

// Initialize global instance
window.ingredientsManager = new IngredientsManagerEnhanced();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ingredientsManager.init();
  });
} else {
  window.ingredientsManager.init();
}

document.addEventListener('projectChanged', () => {
  if (window.ingredientsManager) {
    window.ingredientsManager.initialized = true;
  }
});

console.log('📦 Enhanced Ingredients Manager loaded');
