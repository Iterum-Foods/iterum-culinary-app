/**
 * Vendor Price Comparator
 * Compares vendor prices with different units and normalizes for accurate cost calculation
 */

class VendorPriceComparator {
    constructor() {
        this.unitConverter = window.unitConverter;
    }

    /**
     * Add vendor price to ingredient
     */
    addVendorPrice(ingredientId, vendorPrice) {
        // vendorPrice format: { vendor: 'Vendor Name', price: 10.99, unit: 'lb', date: '2024-01-01' }
        
        const ingredients = JSON.parse(localStorage.getItem('ingredients_database') || '[]');
        const ingredient = ingredients.find(ing => ing.id === ingredientId);

        if (!ingredient) {
            console.error('Ingredient not found:', ingredientId);
            return false;
        }

        // Initialize vendor prices array if needed
        if (!ingredient.vendorPrices) {
            ingredient.vendorPrices = [];
        }

        // Add or update vendor price
        const existingIndex = ingredient.vendorPrices.findIndex(
            vp => vp.vendor === vendorPrice.vendor && vp.unit === vendorPrice.unit
        );

        if (existingIndex >= 0) {
            // Update existing
            ingredient.vendorPrices[existingIndex] = {
                ...ingredient.vendorPrices[existingIndex],
                ...vendorPrice,
                lastUpdated: new Date().toISOString()
            };
        } else {
            // Add new
            ingredient.vendorPrices.push({
                ...vendorPrice,
                dateAdded: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            });
        }

        // Update best price
        this.updateBestPrice(ingredient);

        // Save
        localStorage.setItem('ingredients_database', JSON.stringify(ingredients));
        localStorage.setItem('ingredients', JSON.stringify(ingredients));

        return true;
    }

    /**
     * Update best price for ingredient based on all vendor prices
     */
    updateBestPrice(ingredient) {
        if (!ingredient.vendorPrices || ingredient.vendorPrices.length === 0) {
            return;
        }

        // Get base unit
        const baseUnit = ingredient.unit || ingredient.default_unit || 'g';

        // Normalize all prices to base unit
        const normalized = ingredient.vendorPrices.map(vp => ({
            ...vp,
            normalizedPrice: this.unitConverter.convertPrice(vp.price, vp.unit, baseUnit)
        })).filter(vp => vp.normalizedPrice !== null);

        if (normalized.length === 0) return;

        // Find best (lowest) price
        normalized.sort((a, b) => a.normalizedPrice - b.normalizedPrice);
        const best = normalized[0];

        // Update ingredient cost to best price
        ingredient.cost = best.normalizedPrice;
        ingredient.bestPrice = {
            vendor: best.vendor,
            price: best.price,
            unit: best.unit,
            normalizedPrice: best.normalizedPrice,
            baseUnit: baseUnit,
            date: best.lastUpdated || best.dateAdded
        };

        // Store comparison data
        ingredient.priceComparison = {
            vendorCount: normalized.length,
            priceRange: {
                min: normalized[0].normalizedPrice,
                max: normalized[normalized.length - 1].normalizedPrice,
                difference: normalized[normalized.length - 1].normalizedPrice - normalized[0].normalizedPrice,
                percentSavings: ((normalized[normalized.length - 1].normalizedPrice - normalized[0].normalizedPrice) / normalized[normalized.length - 1].normalizedPrice * 100).toFixed(1)
            },
            allPrices: normalized
        };
    }

    /**
     * Compare prices for an ingredient across all vendors
     */
    compareIngredientPrices(ingredient) {
        if (!ingredient.vendorPrices || ingredient.vendorPrices.length === 0) {
            return null;
        }

        const baseUnit = ingredient.unit || ingredient.default_unit || 'g';
        const comparison = this.unitConverter.comparePrices(
            ingredient.vendorPrices.map(vp => ({
                price: vp.price,
                unit: vp.unit,
                vendor: vp.vendor
            }))
        );

        return {
            ingredientName: ingredient.name,
            baseUnit,
            comparison,
            bestPrice: ingredient.bestPrice
        };
    }

    /**
     * Get best vendor for an ingredient
     */
    getBestVendor(ingredient) {
        if (!ingredient.bestPrice) {
            this.updateBestPrice(ingredient);
        }

        return ingredient.bestPrice;
    }

    /**
     * Calculate recipe cost with vendor price comparison
     */
    calculateRecipeCostWithVendors(recipe, ingredients) {
        if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
            return null;
        }

        const costs = [];
        let totalCost = 0;

        recipe.ingredients.forEach(recipeIngredient => {
            // Find ingredient in database
            const ingredient = ingredients.find(ing => 
                ing.id === recipeIngredient.id || 
                ing.name.toLowerCase() === recipeIngredient.name.toLowerCase()
            );

            if (!ingredient) {
                costs.push({
                    name: recipeIngredient.name,
                    quantity: recipeIngredient.quantity,
                    unit: recipeIngredient.unit,
                    cost: null,
                    error: 'Ingredient not found in database'
                });
                return;
            }

            // Calculate cost using unit converter
            const costData = this.unitConverter.calculateIngredientCost(
                ingredient,
                recipeIngredient.quantity,
                recipeIngredient.unit
            );

            if (costData) {
                costs.push({
                    ...costData,
                    vendor: ingredient.bestPrice?.vendor || 'Default',
                    vendorPrice: ingredient.bestPrice?.price || ingredient.cost,
                    vendorUnit: ingredient.bestPrice?.unit || ingredient.unit
                });
                totalCost += costData.totalCost;
            } else {
                costs.push({
                    name: recipeIngredient.name,
                    quantity: recipeIngredient.quantity,
                    unit: recipeIngredient.unit,
                    cost: null,
                    error: 'Unit conversion failed'
                });
            }
        });

        return {
            recipeName: recipe.name || recipe.title,
            totalCost,
            perServing: recipe.servings ? totalCost / recipe.servings : null,
            ingredientCosts: costs,
            breakdown: costs.map(c => c.breakdown || `${c.name}: ${c.error || 'N/A'}`)
        };
    }
}

// Create global instance
window.vendorPriceComparator = new VendorPriceComparator();

console.log('💰 Vendor Price Comparator loaded');
