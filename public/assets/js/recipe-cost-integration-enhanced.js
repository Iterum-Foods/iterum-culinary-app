/**
 * Enhanced Recipe Cost Integration
 * Integrates ingredients with vendor pricing into recipe costing
 * Works with recipes, prep lists, and menu items
 */

class RecipeCostIntegrationEnhanced {
    constructor() {
        this.costCalculator = window.costCalculator;
        this.unitConverter = window.unitConverter;
        this.vendorComparator = window.vendorPriceComparator;
        this.ingredientSelector = window.ingredientSelector;
    }

    /**
     * Calculate recipe cost with enhanced ingredient integration
     */
    async calculateRecipeCost(recipe) {
        if (!this.costCalculator) {
            console.error('Cost calculator not available');
            return null;
        }

        // Refresh ingredient prices
        this.costCalculator.loadIngredientPrices();

        // Calculate cost
        const costData = this.costCalculator.calculateRecipeCost(recipe);

        // Enhance with ingredient details
        if (costData.ingredientCosts) {
            costData.ingredientCosts = await Promise.all(
                costData.ingredientCosts.map(async (ingCost) => {
                    // Find ingredient in database
                    const ingredient = await this.findIngredient(ingCost.name);
                    
                    if (ingredient) {
                        return {
                            ...ingCost,
                            ingredientId: ingredient.id,
                            ingredient: ingredient,
                            vendor: ingCost.vendor || ingredient.bestPrice?.vendor || ingredient.supplier,
                            bestPrice: ingredient.bestPrice,
                            vendorPrices: ingredient.vendorPrices
                        };
                    }
                    
                    return ingCost;
                })
            );
        }

        return costData;
    }

    /**
     * Find ingredient by name
     */
    async findIngredient(name) {
        if (!this.ingredientSelector || !this.ingredientSelector.initialized) {
            await this.ingredientSelector.init();
        }

        return this.ingredientSelector.getIngredientByName(name);
    }

    /**
     * Calculate prep list cost
     */
    async calculatePrepListCost(prepList) {
        if (!prepList.components || !Array.isArray(prepList.components)) {
            return null;
        }

        let totalCost = 0;
        const componentCosts = [];

        for (const component of prepList.components) {
            if (component.ingredients && Array.isArray(component.ingredients)) {
                for (const ing of component.ingredients) {
                    const cost = await this.calculateIngredientCostForPrep(
                        ing.name || ing.ingredient,
                        ing.quantity || ing.amount,
                        ing.unit
                    );
                    
                    totalCost += cost.totalCost;
                    componentCosts.push({
                        component: component.name,
                        ...cost
                    });
                }
            }
        }

        return {
            totalCost: totalCost.toFixed(2),
            componentCosts,
            prepDate: prepList.prepDate || prepList.date
        };
    }

    /**
     * Calculate ingredient cost for prep list
     */
    async calculateIngredientCostForPrep(name, quantity, unit) {
        const ingredient = await this.findIngredient(name);
        
        if (!ingredient) {
            return {
                name,
                quantity,
                unit,
                totalCost: 0,
                error: 'Ingredient not found'
            };
        }

        // Use unit converter to calculate cost
        if (this.unitConverter) {
            const costData = this.unitConverter.calculateIngredientCost(ingredient, quantity, unit);
            
            if (costData) {
                return {
                    name: ingredient.name,
                    quantity,
                    unit,
                    totalCost: costData.totalCost,
                    costPerBaseUnit: costData.costPerBaseUnit,
                    baseUnit: costData.baseUnit,
                    vendor: ingredient.bestPrice?.vendor || ingredient.supplier
                };
            }
        }

        // Fallback to cost calculator
        if (this.costCalculator) {
            const costData = this.costCalculator.calculateIngredientCost(name, quantity, unit);
            return {
                name,
                quantity,
                unit,
                totalCost: costData.cost || 0,
                pricePerUnit: costData.pricePerUnit,
                vendor: costData.vendor
            };
        }

        return {
            name,
            quantity,
            unit,
            totalCost: 0,
            error: 'No costing system available'
        };
    }

    /**
     * Calculate menu item plate cost
     */
    async calculateMenuItemCost(menuItem) {
        if (!menuItem.recipeId && !menuItem.recipe) {
            return null;
        }

        // Get recipe
        let recipe = menuItem.recipe;
        
        if (!recipe && menuItem.recipeId) {
            if (window.universalRecipeManager) {
                recipe = window.universalRecipeManager.getRecipeById(menuItem.recipeId);
            } else {
                const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
                recipe = recipes.find(r => r.id === menuItem.recipeId);
            }
        }

        if (!recipe) {
            return null;
        }

        // Calculate recipe cost
        const recipeCost = await this.calculateRecipeCost(recipe);

        if (!recipeCost) {
            return null;
        }

        // Calculate plate cost (divide by servings)
        const servings = recipe.servings || 1;
        const plateCost = parseFloat(recipeCost.costPerServing || recipeCost.costPerYieldUnit || 0);

        // Calculate profit margin if price is set
        const price = menuItem.price || parseFloat(menuItem.price) || 0;
        const profit = price > 0 ? price - plateCost : 0;
        const margin = price > 0 ? (profit / price * 100) : 0;

        return {
            menuItem: menuItem.name || menuItem.title,
            plateCost: plateCost.toFixed(2),
            price: price.toFixed(2),
            profit: profit.toFixed(2),
            margin: margin.toFixed(1),
            recipeCost: recipeCost,
            ingredientBreakdown: recipeCost.ingredientCosts
        };
    }
}

// Create global instance
window.recipeCostIntegration = new RecipeCostIntegrationEnhanced();

console.log('💰 Enhanced Recipe Cost Integration loaded');

