/**
 * Ingredient Validator
 * Validates ingredient references and ensures data consistency
 */

class IngredientValidator {
  /**
   * Get all ingredients from storage
   */
  static getAllIngredients() {
    if (window.ingredientsManager) {
      return window.ingredientsManager.getAllIngredients();
    }
    return JSON.parse(
      localStorage.getItem('ingredients_database') || 
      localStorage.getItem('ingredients') || 
      '[]'
    );
  }
  
  /**
   * Check if ingredient ID exists in database
   * @param {string} ingredientId - Ingredient ID to validate
   * @returns {boolean}
   */
  static validateIngredientId(ingredientId) {
    if (!ingredientId) return false;
    
    const ingredients = this.getAllIngredients();
    return ingredients.some(ing => ing.id === ingredientId);
  }
  
  /**
   * Get ingredient by ID
   * @param {string} ingredientId - Ingredient ID
   * @returns {Object|null} Ingredient object or null
   */
  static getIngredientById(ingredientId) {
    if (!ingredientId) return null;
    
    const ingredients = this.getAllIngredients();
    return ingredients.find(ing => ing.id === ingredientId) || null;
  }
  
  /**
   * Validate recipe ingredients
   * @param {Object} recipe - Recipe object
   * @returns {Object} { valid, invalid, missing }
   */
  static validateRecipeIngredients(recipe) {
    if (!recipe || !recipe.ingredients || !Array.isArray(recipe.ingredients)) {
      return { valid: [], invalid: [], missing: [], allValid: false };
    }
    
    const valid = [];
    const invalid = [];
    const missing = [];
    
    recipe.ingredients.forEach(ing => {
      if (!ing.ingredientId) {
        missing.push({
          ingredient: ing.name || ing.ingredient || 'Unknown',
          issue: 'Missing ingredientId'
        });
      } else if (!this.validateIngredientId(ing.ingredientId)) {
        invalid.push({
          ingredient: ing.name || ing.ingredient || 'Unknown',
          ingredientId: ing.ingredientId,
          issue: 'ingredientId not found in database'
        });
      } else {
        valid.push(ing);
      }
    });
    
    return {
      valid,
      invalid,
      missing,
      allValid: invalid.length === 0 && missing.length === 0
    };
  }
  
  /**
   * Validate inventory items
   * @param {Array} inventory - Inventory items array
   * @returns {Object} { valid, invalid, missing }
   */
  static validateInventoryItems(inventory = null) {
    if (!inventory) {
      inventory = window.inventoryManager?.getInventory() || [];
    }
    
    if (!Array.isArray(inventory)) {
      return { valid: [], invalid: [], missing: [], allValid: false };
    }
    
    const valid = [];
    const invalid = [];
    const missing = [];
    
    inventory.forEach(item => {
      if (!item.ingredientId) {
        missing.push({
          item: item.ingredientName || item.name || 'Unknown',
          issue: 'Missing ingredientId'
        });
      } else if (!this.validateIngredientId(item.ingredientId)) {
        invalid.push({
          item: item.ingredientName || item.name || 'Unknown',
          ingredientId: item.ingredientId,
          issue: 'ingredientId not found in database'
        });
      } else {
        valid.push(item);
      }
    });
    
    return {
      valid,
      invalid,
      missing,
      allValid: invalid.length === 0 && missing.length === 0
    };
  }
  
  /**
   * Validate all recipes
   * @returns {Object} Validation results
   */
  static validateAllRecipes() {
    const recipes = JSON.parse(
      localStorage.getItem('iterum_recipes') || 
      localStorage.getItem('recipes') || 
      '[]'
    );
    
    const results = {
      total: recipes.length,
      allValid: 0,
      hasIssues: 0,
      recipes: []
    };
    
    recipes.forEach(recipe => {
      const validation = this.validateRecipeIngredients(recipe);
      results.recipes.push({
        id: recipe.id,
        name: recipe.name || recipe.title,
        ...validation
      });
      
      if (validation.allValid) {
        results.allValid++;
      } else {
        results.hasIssues++;
      }
    });
    
    return results;
  }
  
  /**
   * Validate all inventory
   * @returns {Object} Validation results
   */
  static validateAllInventory() {
    const validation = this.validateInventoryItems();
    
    return {
      total: validation.valid.length + validation.invalid.length + validation.missing.length,
      valid: validation.valid.length,
      invalid: validation.invalid.length,
      missing: validation.missing.length,
      allValid: validation.allValid,
      details: validation
    };
  }
  
  /**
   * Fix orphaned references (attempts to match by name)
   * @param {Object} item - Recipe ingredient or inventory item
   * @returns {Object|null} Matched ingredient or null
   */
  static fixOrphanedReference(item) {
    if (!item) return null;
    
    const ingredients = this.getAllIngredients();
    const name = item.name || item.ingredient || item.ingredientName;
    
    if (!name) return null;
    
    // Try exact match
    let match = ingredients.find(ing => 
      ing.name.toLowerCase() === name.toLowerCase()
    );
    
    if (match) return match;
    
    // Try partial match
    match = ingredients.find(ing => 
      ing.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(ing.name.toLowerCase())
    );
    
    return match || null;
  }
  
  /**
   * Generate validation report
   * @returns {Object} Complete validation report
   */
  static generateReport() {
    const ingredientValidation = window.IngredientIdGenerator?.validateAll() || { total: 0 };
    const recipeValidation = this.validateAllRecipes();
    const inventoryValidation = this.validateAllInventory();
    
    return {
      timestamp: new Date().toISOString(),
      ingredients: {
        total: ingredientValidation.total || 0,
        valid: ingredientValidation.valid?.length || 0,
        invalid: ingredientValidation.invalid?.length || 0,
        stats: ingredientValidation.stats || {}
      },
      recipes: {
        total: recipeValidation.total,
        allValid: recipeValidation.allValid,
        hasIssues: recipeValidation.hasIssues
      },
      inventory: {
        total: inventoryValidation.total,
        valid: inventoryValidation.valid,
        invalid: inventoryValidation.invalid,
        missing: inventoryValidation.missing,
        allValid: inventoryValidation.allValid
      },
      overall: {
        allValid: 
          (ingredientValidation.invalid?.length || 0) === 0 &&
          recipeValidation.hasIssues === 0 &&
          inventoryValidation.allValid
      }
    };
  }
}

// Make available globally
window.IngredientValidator = IngredientValidator;

console.log('✅ Ingredient Validator loaded');
