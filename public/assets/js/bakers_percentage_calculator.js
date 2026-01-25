/**
 * Baker's Percentage Calculator for Professional Recipe Scaling
 * Provides accurate scaling for larger batches using baker's percentage method
 * Version: 1.0
 */

class BakersPercentageCalculator {
    constructor() {
        this.baseIngredient = 'flour'; // Default base ingredient (100%)
        this.ingredients = new Map();
        this.scalingFactors = {
            small: 0.5,   // 50% batch
            normal: 1.0,  // 100% batch (original)
            large: 2.0,   // 200% batch
            xlarge: 4.0,  // 400% batch
            custom: 1.0   // Custom scaling factor
        };
        this.conversionFactors = {
            // Weight conversions to grams (base unit)
            'g': 1,
            'kg': 1000,
            'oz': 28.3495,
            'lb': 453.592,
            'cup_flour': 120,
            'cup_sugar': 200,
            'cup_butter': 227,
            'cup_liquid': 240,
            'tbsp': 15,
            'tsp': 5
        };
    }

    /**
     * Set the base ingredient (typically flour at 100%)
     */
    setBaseIngredient(ingredientName, amount, unit = 'g') {
        this.baseIngredient = ingredientName;
        const baseWeight = this.convertToGrams(amount, unit);
        this.ingredients.set(ingredientName, {
            name: ingredientName,
            originalAmount: amount,
            originalUnit: unit,
            weightInGrams: baseWeight,
            percentage: 100,
            category: 'flour',
            isBase: true
        });
        
        // Recalculate all percentages
        this.recalculatePercentages();
        
        console.log(`🍞 Base ingredient set: ${ingredientName} (${amount}${unit}) = 100%`);
    }

    /**
     * Add an ingredient with its amount and unit
     */
    addIngredient(name, amount, unit = 'g', category = 'other') {
        const weightInGrams = this.convertToGrams(amount, unit);
        const baseWeight = this.getBaseWeight();
        const percentage = baseWeight > 0 ? (weightInGrams / baseWeight) * 100 : 0;

        this.ingredients.set(name, {
            name: name,
            originalAmount: amount,
            originalUnit: unit,
            weightInGrams: weightInGrams,
            percentage: percentage,
            category: category,
            isBase: false
        });

        console.log(`📝 Added ingredient: ${name} (${amount}${unit}) = ${percentage.toFixed(1)}%`);
    }

    /**
     * Update ingredient percentage and recalculate weight
     */
    updatePercentage(ingredientName, percentage) {
        if (!this.ingredients.has(ingredientName)) {
            console.warn(`⚠️ Ingredient not found: ${ingredientName}`);
            return;
        }

        const ingredient = this.ingredients.get(ingredientName);
        const baseWeight = this.getBaseWeight();
        const newWeight = (percentage / 100) * baseWeight;

        ingredient.percentage = percentage;
        ingredient.weightInGrams = newWeight;
        ingredient.originalAmount = this.convertFromGrams(newWeight, ingredient.originalUnit);

        this.ingredients.set(ingredientName, ingredient);
        console.log(`🔄 Updated ${ingredientName}: ${percentage}% = ${ingredient.originalAmount.toFixed(2)}${ingredient.originalUnit}`);
    }

    /**
     * Scale entire recipe by factor or target amount
     */
    scaleRecipe(scalingType, value = 1.0, targetUnit = 'g') {
        let scaleFactor;

        switch (scalingType) {
            case 'factor':
                scaleFactor = value;
                break;
            case 'target_amount':
                // Scale based on desired amount of base ingredient
                const baseWeight = this.getBaseWeight();
                const targetWeight = this.convertToGrams(value, targetUnit);
                scaleFactor = targetWeight / baseWeight;
                break;
            case 'batch_count':
                // Scale based on number of batches
                scaleFactor = value;
                break;
            case 'percentage':
                // Scale based on percentage (e.g., 150% = 1.5x)
                scaleFactor = value / 100;
                break;
            default:
                console.warn(`⚠️ Unknown scaling type: ${scalingType}`);
                return null;
        }

        const scaledRecipe = new Map();
        
        for (const [name, ingredient] of this.ingredients) {
            const scaledWeight = ingredient.weightInGrams * scaleFactor;
            const scaledAmount = this.convertFromGrams(scaledWeight, ingredient.originalUnit);
            
            scaledRecipe.set(name, {
                ...ingredient,
                scaledAmount: scaledAmount,
                scaledWeight: scaledWeight,
                scaleFactor: scaleFactor
            });
        }

        console.log(`📏 Recipe scaled by factor: ${scaleFactor.toFixed(2)}x`);
        return scaledRecipe;
    }

    /**
     * Generate baker's percentage formula table
     */
    generateFormula() {
        const formula = {
            baseIngredient: this.baseIngredient,
            ingredients: [],
            totalPercentage: 0,
            yields: this.getRecipeYields()
        };

        for (const [name, ingredient] of this.ingredients) {
            formula.ingredients.push({
                name: ingredient.name,
                percentage: ingredient.percentage,
                category: ingredient.category,
                isBase: ingredient.isBase,
                ratio: ingredient.percentage / 100
            });
            formula.totalPercentage += ingredient.percentage;
        }

        // Sort by category and percentage
        formula.ingredients.sort((a, b) => {
            if (a.isBase) return -1;
            if (b.isBase) return 1;
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            return b.percentage - a.percentage;
        });

        return formula;
    }

    /**
     * Convert ingredient amount to grams
     */
    convertToGrams(amount, unit) {
        const factor = this.conversionFactors[unit.toLowerCase()];
        if (!factor) {
            console.warn(`⚠️ Unknown unit: ${unit}. Assuming grams.`);
            return amount;
        }
        return amount * factor;
    }

    /**
     * Convert grams back to specified unit
     */
    convertFromGrams(grams, targetUnit) {
        const factor = this.conversionFactors[targetUnit.toLowerCase()];
        if (!factor) {
            console.warn(`⚠️ Unknown unit: ${targetUnit}. Returning grams.`);
            return grams;
        }
        return grams / factor;
    }

    /**
     * Get base ingredient weight in grams
     */
    getBaseWeight() {
        for (const ingredient of this.ingredients.values()) {
            if (ingredient.isBase) {
                return ingredient.weightInGrams;
            }
        }
        return 0;
    }

    /**
     * Recalculate all percentages based on current base ingredient
     */
    recalculatePercentages() {
        const baseWeight = this.getBaseWeight();
        if (baseWeight === 0) return;

        for (const [name, ingredient] of this.ingredients) {
            if (!ingredient.isBase) {
                ingredient.percentage = (ingredient.weightInGrams / baseWeight) * 100;
                this.ingredients.set(name, ingredient);
            }
        }
    }

    /**
     * Get recipe yields based on typical portions
     */
    getRecipeYields() {
        const totalWeight = Array.from(this.ingredients.values())
            .reduce((sum, ing) => sum + ing.weightInGrams, 0);
        
        return {
            totalWeight: totalWeight,
            portions: {
                individual: Math.floor(totalWeight / 100), // 100g portions
                bread_loaves: Math.floor(totalWeight / 500), // 500g loaves
                pizza_dough: Math.floor(totalWeight / 250), // 250g pizza dough
                pastry_shells: Math.floor(totalWeight / 50) // 50g pastry shells
            }
        };
    }

    /**
     * Validate recipe balance (for bread/pastry)
     */
    validateRecipe() {
        const formula = this.generateFormula();
        const validation = {
            valid: true,
            warnings: [],
            suggestions: []
        };

        // Check hydration for bread recipes
        const flourPercentage = this.getIngredientPercentage('flour');
        const waterPercentage = this.getIngredientPercentage('water');
        
        if (flourPercentage > 0 && waterPercentage > 0) {
            const hydration = (waterPercentage / flourPercentage) * 100;
            validation.hydration = hydration;
            
            if (hydration < 50) {
                validation.warnings.push('Low hydration: Consider adding more liquid for better texture');
            } else if (hydration > 85) {
                validation.warnings.push('High hydration: Dough may be difficult to handle');
            }
        }

        // Check salt percentage
        const saltPercentage = this.getIngredientPercentage('salt');
        if (saltPercentage < 1.5) {
            validation.warnings.push('Low salt content: Consider increasing for better flavor');
        } else if (saltPercentage > 3) {
            validation.warnings.push('High salt content: May inhibit yeast activity');
        }

        // Check yeast percentage
        const yeastPercentage = this.getIngredientPercentage('yeast');
        if (yeastPercentage > 0) {
            if (yeastPercentage < 0.5) {
                validation.suggestions.push('Low yeast: Longer fermentation time needed');
            } else if (yeastPercentage > 3) {
                validation.warnings.push('High yeast content: May cause over-proofing');
            }
        }

        return validation;
    }

    /**
     * Get percentage of specific ingredient
     */
    getIngredientPercentage(searchName) {
        for (const ingredient of this.ingredients.values()) {
            if (ingredient.name.toLowerCase().includes(searchName.toLowerCase())) {
                return ingredient.percentage;
            }
        }
        return 0;
    }

    /**
     * Export recipe as different formats
     */
    exportRecipe(format = 'json') {
        const formula = this.generateFormula();
        const validation = this.validateRecipe();

        switch (format) {
            case 'json':
                return JSON.stringify({ formula, validation }, null, 2);
            
            case 'csv':
                let csv = 'Ingredient,Percentage,Category,Weight(g)\n';
                formula.ingredients.forEach(ing => {
                    const weight = this.ingredients.get(ing.name).weightInGrams;
                    csv += `${ing.name},${ing.percentage.toFixed(1)},${ing.category},${weight.toFixed(1)}\n`;
                });
                return csv;
            
            case 'readable':
                let readable = `Baker's Percentage Formula\n`;
                readable += `========================\n\n`;
                readable += `Base: ${formula.baseIngredient} (100%)\n\n`;
                
                formula.ingredients.forEach(ing => {
                    const weight = this.ingredients.get(ing.name).weightInGrams;
                    readable += `${ing.name.padEnd(20)} ${ing.percentage.toFixed(1).padStart(6)}%  ${weight.toFixed(1).padStart(8)}g\n`;
                });
                
                readable += `\nTotal: ${formula.totalPercentage.toFixed(1)}%\n`;
                readable += `Yield: ${formula.yields.totalWeight.toFixed(0)}g\n`;
                
                if (validation.warnings.length > 0) {
                    readable += `\nWarnings:\n`;
                    validation.warnings.forEach(warning => readable += `• ${warning}\n`);
                }
                
                return readable;
            
            default:
                return formula;
        }
    }

    /**
     * Import recipe from baker's percentage
     */
    importFromPercentages(percentageData, baseAmount = 1000, baseUnit = 'g') {
        this.ingredients.clear();
        
        // Set base ingredient
        if (percentageData.base) {
            this.setBaseIngredient(percentageData.base.name, baseAmount, baseUnit);
        }
        
        // Add other ingredients based on percentages
        if (percentageData.ingredients) {
            percentageData.ingredients.forEach(ing => {
                const amount = (ing.percentage / 100) * baseAmount;
                this.addIngredient(ing.name, amount, baseUnit, ing.category || 'other');
            });
        }
        
        console.log('📥 Recipe imported from baker\'s percentages');
    }

    /**
     * Get scaling recommendations based on equipment/batch size
     */
    getScalingRecommendations() {
        const totalWeight = this.getRecipeYields().totalWeight;
        
        return {
            homeKitchen: {
                description: 'Home Kitchen Batch',
                factor: totalWeight > 2000 ? 0.5 : 1.0,
                reason: totalWeight > 2000 ? 'Large batch - scale down for home equipment' : 'Good size for home kitchen'
            },
            commercial: {
                description: 'Commercial Kitchen Batch',
                factor: totalWeight < 5000 ? 5.0 : 1.0,
                reason: totalWeight < 5000 ? 'Small batch - scale up for efficiency' : 'Good size for commercial production'
            },
            testBatch: {
                description: 'Test Batch',
                factor: 0.25,
                reason: 'Small batch for recipe testing and adjustments'
            }
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BakersPercentageCalculator;
}

// Global availability
if (typeof window !== 'undefined') {
    window.BakersPercentageCalculator = BakersPercentageCalculator;
}