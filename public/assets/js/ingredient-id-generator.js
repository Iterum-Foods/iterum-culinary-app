/**
 * Ingredient ID Generator
 * Standardizes ingredient ID generation across the application
 */

class IngredientIdGenerator {
  /**
   * Generate standardized ingredient ID
   * @param {string} source - Source type: 'base', 'usda', 'custom', 'import', 'url'
   * @returns {string} Standardized ingredient ID
   */
  static generate(source = 'custom') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 9);
    
    const prefixes = {
      'base': 'ing',
      'usda': 'usda',
      'custom': 'ing_custom',
      'import': 'ing_import',
      'url': 'ing_url'
    };
    
    const prefix = prefixes[source] || 'ing_custom';
    
    // Base ingredients use numeric format: ing_001, ing_002
    if (source === 'base') {
      // For base ingredients, we'll use the existing format from database
      // This function is mainly for custom ingredients
      return `${prefix}_${timestamp}_${random}`;
    }
    
    return `${prefix}_${timestamp}_${random}`;
  }
  
  /**
   * Parse ingredient ID to determine source
   * @param {string} id - Ingredient ID
   * @returns {Object} { source, type, isValid }
   */
  static parse(id) {
    if (!id || typeof id !== 'string') {
      return { source: 'unknown', type: 'unknown', isValid: false };
    }
    
    // Base ingredients: ing_001, ing_002, etc.
    if (/^ing_\d+$/.test(id)) {
      return { source: 'base', type: 'built-in', isValid: true };
    }
    
    // USDA ingredients: usda_123456
    if (/^usda_\d+$/.test(id)) {
      return { source: 'usda', type: 'usda-api', isValid: true };
    }
    
    // Custom ingredients: ing_custom_timestamp_random
    if (/^ing_custom_\d+_[a-z0-9]+$/.test(id)) {
      return { source: 'custom', type: 'user-added', isValid: true };
    }
    
    // Imported ingredients: ing_import_timestamp_random
    if (/^ing_import_\d+_[a-z0-9]+$/.test(id)) {
      return { source: 'import', type: 'bulk-import', isValid: true };
    }
    
    // URL imported: ing_url_timestamp_random
    if (/^ing_url_\d+_[a-z0-9]+$/.test(id)) {
      return { source: 'url', type: 'url-import', isValid: true };
    }
    
    // Legacy formats (for backward compatibility)
    if (/^ing_\d+_[a-z0-9]+$/.test(id)) {
      return { source: 'custom', type: 'legacy', isValid: true };
    }
    
    return { source: 'unknown', type: 'unknown', isValid: false };
  }
  
  /**
   * Check if ingredient ID is valid
   * @param {string} id - Ingredient ID
   * @returns {boolean}
   */
  static isValid(id) {
    return this.parse(id).isValid;
  }
  
  /**
   * Get all ingredients and validate IDs
   * @returns {Object} { valid, invalid, stats }
   */
  static validateAll() {
    const ingredients = JSON.parse(
      localStorage.getItem('ingredients_database') || 
      localStorage.getItem('ingredients') || 
      '[]'
    );
    
    const valid = [];
    const invalid = [];
    const stats = {
      base: 0,
      usda: 0,
      custom: 0,
      import: 0,
      url: 0,
      unknown: 0
    };
    
    ingredients.forEach(ing => {
      const parsed = this.parse(ing.id);
      if (parsed.isValid) {
        valid.push(ing);
        stats[parsed.source]++;
      } else {
        invalid.push(ing);
        stats.unknown++;
      }
    });
    
    return { valid, invalid, stats, total: ingredients.length };
  }
}

// Make available globally
window.IngredientIdGenerator = IngredientIdGenerator;

console.log('🆔 Ingredient ID Generator loaded');
