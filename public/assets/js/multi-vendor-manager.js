/**
 * Multi-Vendor Manager
 * Manages multiple vendors with different pricing for each ingredient
 */

class MultiVendorManager {
  constructor() {
    this.unitConverter = window.unitConverter;
  }

  /**
   * Add vendor to ingredient
   * @param {string} ingredientId - Ingredient ID
   * @param {Object} vendorData - Vendor data
   * @returns {boolean} Success
   */
  addVendor(ingredientId, vendorData) {
    const ingredients = this.getAllIngredients();
    const ingredient = ingredients.find(ing => ing.id === ingredientId);

    if (!ingredient) {
      console.error('Ingredient not found:', ingredientId);
      return false;
    }

    // Initialize vendorPrices array if needed
    if (!ingredient.vendorPrices) {
      ingredient.vendorPrices = [];
    }

    // Validate vendor data
    if (!vendorData.vendor || !vendorData.price || !vendorData.unit) {
      console.error('Invalid vendor data:', vendorData);
      return false;
    }

    // Check if vendor already exists for this unit
    const existingIndex = ingredient.vendorPrices.findIndex(
      vp => vp.vendor === vendorData.vendor && vp.unit === vendorData.unit
    );

    const vendorPrice = {
      vendor: vendorData.vendor,
      price: parseFloat(vendorData.price),
      unit: vendorData.unit,
      sku: vendorData.sku || null,
      minOrder: vendorData.minOrder || null,
      leadTime: vendorData.leadTime || null,
      notes: vendorData.notes || null,
      isPreferred: vendorData.isPreferred || false,
      dateAdded: existingIndex >= 0 ? ingredient.vendorPrices[existingIndex].dateAdded : new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Update existing
      ingredient.vendorPrices[existingIndex] = vendorPrice;
    } else {
      // Add new
      ingredient.vendorPrices.push(vendorPrice);
    }

    // If this is marked as preferred, unmark others
    if (vendorPrice.isPreferred) {
      ingredient.vendorPrices.forEach(vp => {
        if (vp.vendor !== vendorData.vendor || vp.unit !== vendorData.unit) {
          vp.isPreferred = false;
        }
      });
    }

    // Update best price
    this.updateBestPrice(ingredient);

    // Save
    this.saveIngredients(ingredients);

    return true;
  }

  /**
   * Remove vendor from ingredient
   * @param {string} ingredientId - Ingredient ID
   * @param {string} vendor - Vendor name
   * @param {string} unit - Unit (optional, removes all if not specified)
   * @returns {boolean} Success
   */
  removeVendor(ingredientId, vendor, unit = null) {
    const ingredients = this.getAllIngredients();
    const ingredient = ingredients.find(ing => ing.id === ingredientId);

    if (!ingredient || !ingredient.vendorPrices) {
      return false;
    }

    if (unit) {
      // Remove specific vendor/unit combination
      ingredient.vendorPrices = ingredient.vendorPrices.filter(
        vp => !(vp.vendor === vendor && vp.unit === unit)
      );
    } else {
      // Remove all entries for this vendor
      ingredient.vendorPrices = ingredient.vendorPrices.filter(
        vp => vp.vendor !== vendor
      );
    }

    // Update best price
    this.updateBestPrice(ingredient);

    // Save
    this.saveIngredients(ingredients);

    return true;
  }

  /**
   * Update best price for ingredient
   * @param {Object} ingredient - Ingredient object
   */
  updateBestPrice(ingredient) {
    if (!ingredient.vendorPrices || ingredient.vendorPrices.length === 0) {
      // Use legacy pricing if available
      if (ingredient.avg_price_per_lb) {
        ingredient.cost = ingredient.avg_price_per_lb;
        ingredient.bestPrice = {
          vendor: ingredient.preferred_vendor || ingredient.supplier || 'Default',
          price: ingredient.avg_price_per_lb,
          unit: ingredient.default_unit || 'lb',
          normalizedPrice: ingredient.avg_price_per_lb,
          baseUnit: ingredient.default_unit || 'lb'
        };
      }
      return;
    }

    // Get base unit
    const baseUnit = ingredient.default_unit || ingredient.unit || 'lb';

    // Normalize all prices to base unit
    const normalized = ingredient.vendorPrices.map(vp => {
      try {
        const normalizedPrice = this.unitConverter?.convertPrice(vp.price, vp.unit, baseUnit);
        return {
          ...vp,
          normalizedPrice: normalizedPrice !== null ? normalizedPrice : vp.price
        };
      } catch (e) {
        console.warn('Unit conversion failed for vendor price:', vp);
        return {
          ...vp,
          normalizedPrice: vp.price
        };
      }
    }).filter(vp => vp.normalizedPrice > 0);

    if (normalized.length === 0) return;

    // Find best (lowest) price
    normalized.sort((a, b) => a.normalizedPrice - b.normalizedPrice);
    const best = normalized[0];

    // Check for preferred vendor
    const preferred = normalized.find(vp => vp.isPreferred);
    const selected = preferred || best;

    // Update ingredient cost to best/preferred price
    ingredient.cost = selected.normalizedPrice;
    ingredient.bestPrice = {
      vendor: selected.vendor,
      price: selected.price,
      unit: selected.unit,
      normalizedPrice: selected.normalizedPrice,
      baseUnit: baseUnit,
      date: selected.lastUpdated || selected.dateAdded,
      isPreferred: selected.isPreferred || false
    };

    // Store comparison data
    ingredient.priceComparison = {
      vendorCount: normalized.length,
      priceRange: {
        min: normalized[0].normalizedPrice,
        max: normalized[normalized.length - 1].normalizedPrice,
        difference: normalized[normalized.length - 1].normalizedPrice - normalized[0].normalizedPrice,
        percentSavings: normalized.length > 1 ? 
          ((normalized[normalized.length - 1].normalizedPrice - normalized[0].normalizedPrice) / normalized[normalized.length - 1].normalizedPrice * 100).toFixed(1) : 0
      },
      allPrices: normalized.map(vp => ({
        vendor: vp.vendor,
        price: vp.price,
        unit: vp.unit,
        normalizedPrice: vp.normalizedPrice,
        isPreferred: vp.isPreferred
      }))
    };
  }

  /**
   * Get all vendors for ingredient
   * @param {string} ingredientId - Ingredient ID
   * @returns {Array} Vendor prices array
   */
  getVendors(ingredientId) {
    const ingredients = this.getAllIngredients();
    const ingredient = ingredients.find(ing => ing.id === ingredientId);

    if (!ingredient || !ingredient.vendorPrices) {
      return [];
    }

    return ingredient.vendorPrices;
  }

  /**
   * Get best vendor for ingredient
   * @param {string} ingredientId - Ingredient ID
   * @returns {Object|null} Best vendor price
   */
  getBestVendor(ingredientId) {
    const ingredients = this.getAllIngredients();
    const ingredient = ingredients.find(ing => ing.id === ingredientId);

    if (!ingredient) {
      return null;
    }

    if (!ingredient.bestPrice) {
      this.updateBestPrice(ingredient);
    }

    return ingredient.bestPrice;
  }

  /**
   * Set preferred vendor
   * @param {string} ingredientId - Ingredient ID
   * @param {string} vendor - Vendor name
   * @param {string} unit - Unit
   * @returns {boolean} Success
   */
  setPreferredVendor(ingredientId, vendor, unit) {
    const ingredients = this.getAllIngredients();
    const ingredient = ingredients.find(ing => ing.id === ingredientId);

    if (!ingredient || !ingredient.vendorPrices) {
      return false;
    }

    // Unmark all as preferred
    ingredient.vendorPrices.forEach(vp => {
      vp.isPreferred = false;
    });

    // Mark selected as preferred
    const vendorPrice = ingredient.vendorPrices.find(
      vp => vp.vendor === vendor && vp.unit === unit
    );

    if (vendorPrice) {
      vendorPrice.isPreferred = true;
      this.updateBestPrice(ingredient);
      this.saveIngredients(ingredients);
      return true;
    }

    return false;
  }

  /**
   * Compare prices across vendors
   * @param {string} ingredientId - Ingredient ID
   * @returns {Object} Comparison data
   */
  comparePrices(ingredientId) {
    const ingredients = this.getAllIngredients();
    const ingredient = ingredients.find(ing => ing.id === ingredientId);

    if (!ingredient) {
      return null;
    }

    if (!ingredient.priceComparison) {
      this.updateBestPrice(ingredient);
    }

    return ingredient.priceComparison || null;
  }

  /**
   * Get all ingredients
   */
  getAllIngredients() {
    return JSON.parse(
      localStorage.getItem('ingredients_database') || 
      localStorage.getItem('ingredients') || 
      '[]'
    );
  }

  /**
   * Save ingredients
   */
  saveIngredients(ingredients) {
    localStorage.setItem('ingredients_database', JSON.stringify(ingredients));
    localStorage.setItem('ingredients', JSON.stringify(ingredients));
  }
}

// Create global instance
window.multiVendorManager = new MultiVendorManager();

console.log('🏪 Multi-Vendor Manager loaded');
