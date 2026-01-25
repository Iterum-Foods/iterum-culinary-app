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
        if (this.initialized) return;

        // Load and separate ingredients
        await this.separateIngredients();

        this.initialized = true;
        console.log('✅ Enhanced Ingredients Manager initialized');
    }

    /**
     * Separate built-in ingredients from user-added products
     */
    async separateIngredients() {
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
        return JSON.parse(localStorage.getItem(this.customKey) || '[]');
    }

    /**
     * Get all ingredients (built-in + custom)
     */
    getAllIngredients() {
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
            ingredient.id = 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        // Mark as custom
        ingredient.isCustom = true;
        ingredient.dateAdded = ingredient.dateAdded || new Date().toISOString();

        // Get existing custom ingredients
        const custom = this.getCustomIngredients();

        // Check for duplicates
        const existing = custom.find(ing => 
            ing.name.toLowerCase() === ingredient.name.toLowerCase() &&
            (!ingredient.supplier || ing.supplier === ingredient.supplier)
        );

        if (existing) {
            // Update existing
            Object.assign(existing, ingredient);
        } else {
            // Add new
            custom.push(ingredient);
        }

        // Save custom ingredients
        localStorage.setItem(this.customKey, JSON.stringify(custom));

        // Also update legacy key for compatibility
        this.updateLegacyStorage();

        console.log(`✅ Added custom ingredient: ${ingredient.name}`);
        return ingredient;
    }

    /**
     * Update custom ingredient
     */
    updateCustomIngredient(ingredientId, updates) {
        const custom = this.getCustomIngredients();
        const index = custom.findIndex(ing => ing.id === ingredientId);

        if (index === -1) {
            console.warn(`⚠️ Custom ingredient not found: ${ingredientId}`);
            return false;
        }

        // Update ingredient
        custom[index] = { ...custom[index], ...updates, lastModified: new Date().toISOString() };

        // Save
        localStorage.setItem(this.customKey, JSON.stringify(custom));
        this.updateLegacyStorage();

        console.log(`✅ Updated custom ingredient: ${custom[index].name}`);
        return true;
    }

    /**
     * Delete custom ingredient
     */
    deleteCustomIngredient(ingredientId) {
        const custom = this.getCustomIngredients();
        const filtered = custom.filter(ing => ing.id !== ingredientId);

        if (filtered.length === custom.length) {
            console.warn(`⚠️ Custom ingredient not found: ${ingredientId}`);
            return false;
        }

        localStorage.setItem(this.customKey, JSON.stringify(filtered));
        this.updateLegacyStorage();

        console.log(`✅ Deleted custom ingredient: ${ingredientId}`);
        return true;
    }

    /**
     * Update legacy storage (for backward compatibility)
     */
    updateLegacyStorage() {
        const builtIn = this.getBuiltInIngredients();
        const custom = this.getCustomIngredients();
        const all = [...builtIn, ...custom];

        localStorage.setItem(this.legacyKey, JSON.stringify(all));
        localStorage.setItem('ingredients', JSON.stringify(all)); // Also update old key
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
        return ingredient.isCustom || (!this.isBuiltIn(ingredient));
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

console.log('📦 Enhanced Ingredients Manager loaded');

