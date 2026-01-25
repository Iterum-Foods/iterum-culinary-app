/**
 * Comprehensive Food Costing & Inventory Workflow
 * Implements all 4 phases of the cost control system
 * @version 1.0.0
 */

class FoodCostingWorkflow {
    constructor() {
        this.costCalculator = window.costCalculator;
        this.init();
    }

    init() {
        console.log('📊 Food Costing Workflow initialized');
    }

    /**
     * Phase 1: Calculate Cost per Base Unit from Case Pricing
     * Formula: COST PER BASE UNIT = PRICE PER CASE / (CASE SIZE × CONVERSION FACTOR)
     */
    calculateCostPerBaseUnit(pricePerCase, caseSize, conversionFactor) {
        if (!pricePerCase || !caseSize || !conversionFactor || caseSize === 0 || conversionFactor === 0) {
            return 0;
        }
        return pricePerCase / (caseSize * conversionFactor);
    }

    /**
     * Phase 2: Calculate Actual Ingredient Cost with Waste/Trim
     * Formula: ACTUAL INGREDIENT COST = TOTAL INGREDIENT COST × (1 + WASTE %)
     */
    calculateActualIngredientCost(baseCost, wastePercentage) {
        const wasteDecimal = (wastePercentage || 0) / 100;
        return baseCost * (1 + wasteDecimal);
    }

    /**
     * Phase 2: Calculate Cost per Yield Unit
     * Formula: COST PER YIELD UNIT = SUM of all Actual Ingredient Costs / YIELD QUANTITY
     */
    calculateCostPerYieldUnit(actualIngredientCosts, yieldQuantity) {
        const totalActualCost = actualIngredientCosts.reduce((sum, cost) => sum + cost, 0);
        if (!yieldQuantity || yieldQuantity === 0) return 0;
        return totalActualCost / yieldQuantity;
    }

    /**
     * Phase 3: Calculate Food Cost Percentage
     * Formula: FOOD COST % = (Total Recipe Cost / Base Price) × 100
     */
    calculateFoodCostPercentage(recipeCost, salePrice) {
        if (!salePrice || salePrice === 0) return 0;
        return (recipeCost / salePrice) * 100;
    }

    /**
     * Phase 3: Compare Food Cost % to Target
     */
    compareFoodCostToTarget(actualFoodCostPercent, targetFoodCostPercent) {
        const difference = actualFoodCostPercent - targetFoodCostPercent;
        const status = difference > 5 ? 'high' : difference < -5 ? 'low' : 'good';
        
        return {
            actual: actualFoodCostPercent,
            target: targetFoodCostPercent,
            difference: difference,
            status: status,
            message: this.getFoodCostMessage(status, difference)
        };
    }

    getFoodCostMessage(status, difference) {
        switch(status) {
            case 'high':
                return `Food cost is ${difference.toFixed(1)}% above target. Consider increasing price or reducing recipe cost.`;
            case 'low':
                return `Food cost is ${Math.abs(difference).toFixed(1)}% below target. Room for margin improvement or price reduction.`;
            case 'good':
                return `Food cost is within target range (±5%).`;
            default:
                return '';
        }
    }

    /**
     * Phase 4: Calculate Theoretical Usage from Sales Data
     * Uses SUMPRODUCT to multiply units sold by recipe quantities
     */
    calculateTheoreticalUsage(menuItems, salesData, recipeData) {
        const theoreticalUsage = {};
        
        // Iterate through all ingredients
        menuItems.forEach(menuItem => {
            const recipe = recipeData.find(r => r.id === menuItem.recipeId);
            if (!recipe || !recipe.ingredients) return;

            const unitsSold = salesData[menuItem.id] || 0;
            
            recipe.ingredients.forEach(ingredient => {
                const ingredientName = ingredient.name || ingredient.ingredient;
                const quantityNeeded = parseFloat(ingredient.quantity || ingredient.amount) || 0;
                
                if (!theoreticalUsage[ingredientName]) {
                    theoreticalUsage[ingredientName] = 0;
                }
                
                // SUMPRODUCT: units sold × quantity per recipe
                theoreticalUsage[ingredientName] += unitsSold * quantityNeeded;
            });
        });

        return theoreticalUsage;
    }

    /**
     * Phase 4: Calculate Actual Usage from Inventory
     * Formula: ACTUAL USAGE = OPENING INVENTORY + PURCHASES - CLOSING INVENTORY
     */
    calculateActualUsage(openingInventory, purchases, closingInventory) {
        return (openingInventory || 0) + (purchases || 0) - (closingInventory || 0);
    }

    /**
     * Phase 4: Calculate Variance
     * Formula: VARIANCE = ACTUAL USAGE - THEORETICAL USAGE
     */
    calculateVariance(actualUsage, theoreticalUsage) {
        return actualUsage - theoreticalUsage;
    }

    /**
     * Phase 4: Calculate Variance Cost
     * Formula: VARIANCE COST = VARIANCE × COST from MASTER INVENTORY
     */
    calculateVarianceCost(variance, ingredientCost) {
        return variance * ingredientCost;
    }

    /**
     * Phase 4: Complete Variance Analysis
     */
    performVarianceAnalysis(ingredientName, openingInventory, purchases, closingInventory, theoreticalUsage, ingredientCost) {
        const actualUsage = this.calculateActualUsage(openingInventory, purchases, closingInventory);
        const variance = this.calculateVariance(actualUsage, theoreticalUsage);
        const varianceCost = this.calculateVarianceCost(variance, ingredientCost);
        
        return {
            ingredientName: ingredientName,
            actualUsage: actualUsage,
            theoreticalUsage: theoreticalUsage,
            variance: variance,
            varianceCost: varianceCost,
            variancePercentage: theoreticalUsage > 0 ? (variance / theoreticalUsage * 100) : 0,
            status: variance > 0 ? 'overage' : variance < 0 ? 'shortage' : 'exact'
        };
    }

    /**
     * Get recipe cost from Recipe Builder (Phase 3 lookup)
     */
    getRecipeCostFromRecipeBuilder(recipeId) {
        const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
        const recipeIdeas = JSON.parse(localStorage.getItem('recipe_ideas') || '[]');
        const recipeStubs = JSON.parse(localStorage.getItem('recipe_stubs') || '[]');
        
        const allRecipes = [...recipes, ...recipeIdeas, ...recipeStubs];
        const recipe = allRecipes.find(r => r.id === recipeId);
        
        if (!recipe || !this.costCalculator) {
            return null;
        }
        
        // Calculate recipe cost using cost calculator
        return this.costCalculator.calculateRecipeCost(recipe);
    }
}

// Initialize global instance
window.foodCostingWorkflow = new FoodCostingWorkflow();

console.log('📊 Food Costing Workflow System Loaded');

