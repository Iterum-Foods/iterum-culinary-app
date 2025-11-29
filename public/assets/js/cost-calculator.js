/**
 * Cost Calculator System
 * Calculates recipe costs, profit margins, and pricing recommendations
 * @version 1.0.0
 */

class CostCalculator {
    constructor() {
        this.ingredientPrices = {};
        this.overheadPercentage = 0.30; // 30% default overhead
        this.laborCostPerHour = 15; // $15/hour default
        this.init();
    }

    init() {
        console.log('💰 Cost Calculator initialized');
        this.loadIngredientPrices();
    }

    /**
     * Load ingredient prices from localStorage
     * Updated to use enhanced ingredients manager and vendor price comparator
     */
    loadIngredientPrices() {
        try {
            // Use enhanced ingredients manager if available
            let ingredients = [];
            if (window.ingredientsManager) {
                ingredients = window.ingredientsManager.getAllIngredients();
            } else {
                ingredients = JSON.parse(
                    localStorage.getItem('ingredients_database') || 
                    localStorage.getItem('ingredients') || 
                    '[]'
                );
            }

            // Load from ingredients database with vendor prices
            ingredients.forEach(ingredient => {
                const key = ingredient.name.toLowerCase();
                
                // Use best price from vendor comparator if available
                let price = ingredient.cost || 0;
                let unit = ingredient.unit || ingredient.default_unit || 'lb';
                let vendor = ingredient.supplier || 'Default';

                if (ingredient.bestPrice) {
                    // Use normalized best price
                    price = ingredient.bestPrice.normalizedPrice || ingredient.bestPrice.price || price;
                    unit = ingredient.bestPrice.baseUnit || unit;
                    vendor = ingredient.bestPrice.vendor || vendor;
                } else if (ingredient.vendorPrices && ingredient.vendorPrices.length > 0 && window.vendorPriceComparator) {
                    // Calculate best price
                    window.vendorPriceComparator.updateBestPrice(ingredient);
                    if (ingredient.bestPrice) {
                        price = ingredient.bestPrice.normalizedPrice || ingredient.bestPrice.price || price;
                        unit = ingredient.bestPrice.baseUnit || unit;
                        vendor = ingredient.bestPrice.vendor || vendor;
                    }
                }

                // Update or set price
                if (price > 0) {
                    this.ingredientPrices[key] = {
                        name: ingredient.name,
                        price: price,
                        unit: unit,
                        vendor: vendor,
                        ingredientId: ingredient.id,
                        caseSize: ingredient.casePricing?.caseSize,
                        casePricing: ingredient.casePricing
                    };
                }
            });

            // Also load from legacy vendor price lists for backward compatibility
            const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
            vendors.forEach(vendor => {
                if (vendor.priceList) {
                    vendor.priceList.forEach(item => {
                        const key = item.ingredient?.toLowerCase() || item.item?.toLowerCase();
                        if (key && item.price) {
                            // Only use if not already set from ingredients database
                            if (!this.ingredientPrices[key] || item.price < this.ingredientPrices[key].price) {
                                this.ingredientPrices[key] = {
                                    name: item.ingredient || item.item,
                                    price: parseFloat(item.price),
                                    unit: item.unit || 'lb',
                                    vendor: vendor.name,
                                    caseSize: item.caseSize
                                };
                            }
                        }
                    });
                }
            });

            console.log(`💰 Loaded prices for ${Object.keys(this.ingredientPrices).length} ingredients`);
        } catch (error) {
            console.error('Error loading ingredient prices:', error);
        }
    }

    /**
     * Calculate the cost of a single recipe
     * @param {Object} recipe - Recipe object with ingredients array
     * @returns {Object} Cost breakdown
     */
    calculateRecipeCost(recipe) {
        if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
            return this.createEmptyCostBreakdown();
        }

        let totalIngredientCost = 0;
        const ingredientCosts = [];
        let missingPrices = [];

        // Phase 2: Calculate cost for each ingredient with TRIM/WASTE %
        recipe.ingredients.forEach(ingredient => {
            const costData = this.calculateIngredientCost(
                ingredient.name || ingredient.ingredient,
                ingredient.quantity || ingredient.amount,
                ingredient.unit
            );

            // Phase 2: Apply TRIM/WASTE % to get ACTUAL INGREDIENT COST
            // Formula: ACTUAL INGREDIENT COST = TOTAL INGREDIENT COST × (1 + WASTE %)
            const wastePercentage = parseFloat(ingredient.wastePercentage || ingredient.trimPercentage || ingredient.waste || 0) / 100 || 0;
            const actualIngredientCost = costData.cost * (1 + wastePercentage);
            
            const enrichedCostData = {
                ...costData,
                wastePercentage: wastePercentage * 100, // Store as percentage
                actualCost: actualIngredientCost,
                wasteCost: actualIngredientCost - costData.cost
            };

            ingredientCosts.push(enrichedCostData);
            totalIngredientCost += actualIngredientCost; // Use actual cost with waste factored in

            if (!costData.priceFound) {
                missingPrices.push(ingredient.name || ingredient.ingredient);
            }
        });

        // Calculate additional costs
        const prepTime = this.parseTime(recipe.prepTime || '0');
        const cookTime = this.parseTime(recipe.cookTime || '0');
        const totalTime = prepTime + cookTime;
        const laborCost = (totalTime / 60) * this.laborCostPerHour;

        const subtotal = totalIngredientCost + laborCost;
        const overheadCost = subtotal * this.overheadPercentage;
        const totalCost = subtotal + overheadCost;

        // Phase 2: Calculate COST PER YIELD UNIT
        // Formula: COST PER YIELD UNIT = SUM of all Actual Ingredient Costs / YIELD QUANTITY
        const yieldQuantity = parseInt(recipe.yieldQuantity || recipe.servings || recipe.yield) || 1;
        const costPerYieldUnit = totalCost / yieldQuantity;
        const costPerServing = costPerYieldUnit; // Alias for backward compatibility

        // Calculate recommended pricing (various margins)
        const pricingOptions = this.calculatePricingOptions(costPerServing);

        return {
            totalCost: totalCost.toFixed(2),
            costPerServing: costPerServing.toFixed(2),
            costPerYieldUnit: costPerYieldUnit.toFixed(2), // Phase 2: Cost per yield unit
            yieldQuantity: yieldQuantity, // Phase 2: Yield quantity
            ingredientCost: totalIngredientCost.toFixed(2), // Phase 2: Actual cost with waste factored in
            laborCost: laborCost.toFixed(2),
            overheadCost: overheadCost.toFixed(2),
            servings: yieldQuantity, // Alias for backward compatibility
            ingredientCosts: ingredientCosts,
            missingPrices: missingPrices,
            pricingOptions: pricingOptions,
            breakdown: {
                ingredients: ((totalIngredientCost / totalCost) * 100).toFixed(1),
                labor: ((laborCost / totalCost) * 100).toFixed(1),
                overhead: ((overheadCost / totalCost) * 100).toFixed(1)
            },
            wasteTotal: ingredientCosts.reduce((sum, ing) => sum + (ing.wasteCost || 0), 0).toFixed(2) // Phase 2: Total waste cost
        };
    }

    /**
     * Calculate cost for a single ingredient
     * Phase 1: Uses COST PER BASE UNIT from case pricing if available
     * Enhanced: Uses vendor price comparator for accurate unit conversion
     * @param {string} name - Ingredient name
     * @param {number} quantity - Quantity needed
     * @param {string} unit - Unit of measurement
     * @returns {Object} Cost data
     */
    calculateIngredientCost(name, quantity, unit) {
        const key = name.toLowerCase();
        let priceData = this.ingredientPrices[key];
        
        // Phase 1: Load from ingredients database to get case pricing
        // Use enhanced ingredients manager if available
        if (!priceData) {
            let ingredients = [];
            if (window.ingredientsManager) {
                ingredients = window.ingredientsManager.getAllIngredients();
            } else {
                ingredients = JSON.parse(localStorage.getItem('ingredients_database') || '[]');
            }
            
            const ingredient = ingredients.find(ing => 
                (ing.name.toLowerCase() === key || (ing.baseName && ing.baseName.toLowerCase() === key)) &&
                !ing.isVariant
            ) || ingredients.find(ing => ing.name.toLowerCase() === key);
            
            if (ingredient) {
                // Update best price if vendor comparator available
                if (window.vendorPriceComparator && ingredient.vendorPrices && ingredient.vendorPrices.length > 0) {
                    window.vendorPriceComparator.updateBestPrice(ingredient);
                }
                
                // Use best price if available
                if (ingredient.bestPrice) {
                    priceData = {
                        name: ingredient.name,
                        price: ingredient.bestPrice.normalizedPrice || ingredient.bestPrice.price,
                        unit: ingredient.bestPrice.baseUnit || ingredient.unit,
                        vendor: ingredient.bestPrice.vendor || ingredient.supplier || 'Unknown',
                        ingredientId: ingredient.id,
                        casePricing: ingredient.casePricing || null
                    };
                } else if (ingredient.cost && ingredient.cost > 0) {
                    // Phase 1: Use calculated cost per base unit
                    priceData = {
                        name: ingredient.name,
                        price: ingredient.cost, // Already calculated as cost per base unit
                        unit: ingredient.unit, // Base unit
                        vendor: ingredient.supplier || 'Unknown',
                        ingredientId: ingredient.id,
                        casePricing: ingredient.casePricing || null
                    };
                } else if (ingredient.casePricing && ingredient.casePricing.pricePerCase > 0) {
                    // Calculate from case pricing if cost not set
                    const casePricing = ingredient.casePricing;
                    let costPerBaseUnit;
                    
                    if (window.unitConverter) {
                        // Use unit converter for accurate calculation
                        const caseUnitInBase = window.unitConverter.convert(
                            casePricing.caseSize,
                            casePricing.caseUnit,
                            ingredient.unit || 'g'
                        );
                        if (caseUnitInBase !== null && caseUnitInBase > 0) {
                            costPerBaseUnit = casePricing.pricePerCase / (caseUnitInBase * (casePricing.conversionFactor || 1));
                        } else {
                            costPerBaseUnit = casePricing.pricePerCase / (casePricing.caseSize * (casePricing.conversionFactor || 1));
                        }
                    } else {
                        costPerBaseUnit = casePricing.pricePerCase / (casePricing.caseSize * (casePricing.conversionFactor || 1));
                    }
                    
                    priceData = {
                        name: ingredient.name,
                        price: costPerBaseUnit,
                        unit: ingredient.unit,
                        vendor: ingredient.supplier || 'Unknown',
                        ingredientId: ingredient.id,
                        casePricing: casePricing
                    };
                }
            }
        }

        if (!priceData) {
            return {
                name: name,
                quantity: quantity,
                unit: unit,
                cost: 0,
                priceFound: false,
                message: 'Price not available'
            };
        }

        // Use unit converter for accurate conversion if available
        let convertedQuantity;
        if (window.unitConverter) {
            convertedQuantity = window.unitConverter.convert(quantity, unit, priceData.unit);
            if (convertedQuantity === null) {
                // Fallback to manual conversion if categories don't match
                convertedQuantity = this.convertUnits(quantity, unit, priceData.unit);
            }
        } else {
            convertedQuantity = this.convertUnits(quantity, unit, priceData.unit);
        }
        
        const cost = convertedQuantity * priceData.price;

        return {
            name: name,
            quantity: quantity,
            unit: unit,
            cost: cost,
            priceFound: true,
            pricePerUnit: priceData.price,
            priceUnit: priceData.unit,
            vendor: priceData.vendor,
            casePricing: priceData.casePricing || null
        };
    }

    /**
     * Convert between different units of measurement
     * @param {number} quantity - Original quantity
     * @param {string} fromUnit - Original unit
     * @param {string} toUnit - Target unit
     * @returns {number} Converted quantity
     */
    convertUnits(quantity, fromUnit, toUnit) {
        if (!quantity || !fromUnit || !toUnit) return quantity || 0;

        fromUnit = fromUnit.toLowerCase();
        toUnit = toUnit.toLowerCase();

        if (fromUnit === toUnit) return quantity;

        // Weight conversions
        const weightConversions = {
            'lb': 1,
            'lbs': 1,
            'pound': 1,
            'pounds': 1,
            'oz': 0.0625,
            'ounce': 0.0625,
            'ounces': 0.0625,
            'g': 0.00220462,
            'gram': 0.00220462,
            'grams': 0.00220462,
            'kg': 2.20462,
            'kilogram': 2.20462,
            'kilograms': 2.20462
        };

        // Volume conversions (to cups)
        const volumeConversions = {
            'cup': 1,
            'cups': 1,
            'c': 1,
            'tbsp': 0.0625,
            'tablespoon': 0.0625,
            'tablespoons': 0.0625,
            'tsp': 0.0208333,
            'teaspoon': 0.0208333,
            'teaspoons': 0.0208333,
            'ml': 0.00422675,
            'milliliter': 0.00422675,
            'milliliters': 0.00422675,
            'l': 4.22675,
            'liter': 4.22675,
            'liters': 4.22675,
            'fl oz': 0.125,
            'fluid ounce': 0.125,
            'fluid ounces': 0.125,
            'qt': 4,
            'quart': 4,
            'quarts': 4,
            'gal': 16,
            'gallon': 16,
            'gallons': 16,
            'pt': 2,
            'pint': 2,
            'pints': 2
        };

        // Try weight conversion
        if (weightConversions[fromUnit] && weightConversions[toUnit]) {
            const inPounds = quantity * weightConversions[fromUnit];
            return inPounds / weightConversions[toUnit];
        }

        // Try volume conversion
        if (volumeConversions[fromUnit] && volumeConversions[toUnit]) {
            const inCups = quantity * volumeConversions[fromUnit];
            return inCups / volumeConversions[toUnit];
        }

        // If conversion not found, return original (units might be the same)
        console.warn(`Cannot convert ${fromUnit} to ${toUnit}`);
        return quantity;
    }

    /**
     * Parse time string to minutes
     * @param {string} timeStr - Time string (e.g., "30 minutes", "1 hour")
     * @returns {number} Total minutes
     */
    parseTime(timeStr) {
        if (!timeStr) return 0;
        
        let minutes = 0;
        const hourMatch = timeStr.match(/(\d+)\s*h/i);
        const minMatch = timeStr.match(/(\d+)\s*m/i);
        
        if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
        if (minMatch) minutes += parseInt(minMatch[1]);
        
        // If no match, try to parse as number
        if (minutes === 0) {
            const num = parseInt(timeStr);
            if (!isNaN(num)) minutes = num;
        }
        
        return minutes;
    }

    /**
     * Calculate pricing options with different profit margins
     * @param {number} cost - Cost per serving
     * @returns {Object} Pricing options
     */
    calculatePricingOptions(cost) {
        return {
            budget: {
                price: (cost * 2).toFixed(2), // 100% markup
                margin: 50,
                profit: (cost).toFixed(2)
            },
            standard: {
                price: (cost * 3).toFixed(2), // 200% markup
                margin: 66.7,
                profit: (cost * 2).toFixed(2)
            },
            premium: {
                price: (cost * 4).toFixed(2), // 300% markup
                margin: 75,
                profit: (cost * 3).toFixed(2)
            },
            luxury: {
                price: (cost * 5).toFixed(2), // 400% markup
                margin: 80,
                profit: (cost * 4).toFixed(2)
            }
        };
    }

    /**
     * Calculate profit margin
     * @param {number} cost - Total cost
     * @param {number} price - Selling price
     * @returns {Object} Profit data
     */
    calculateProfitMargin(cost, price) {
        const profit = price - cost;
        const marginPercentage = ((profit / price) * 100).toFixed(1);
        const markupPercentage = ((profit / cost) * 100).toFixed(1);

        return {
            cost: parseFloat(cost).toFixed(2),
            price: parseFloat(price).toFixed(2),
            profit: profit.toFixed(2),
            marginPercentage: marginPercentage,
            markupPercentage: markupPercentage,
            isViable: marginPercentage >= 30 // At least 30% margin recommended
        };
    }

    /**
     * Get cost comparison across vendors
     * @param {string} ingredientName - Ingredient name
     * @returns {Array} Vendor price comparison
     */
    getVendorComparison(ingredientName) {
        const key = ingredientName.toLowerCase();
        const vendors = JSON.parse(localStorage.getItem('vendors') || '[]');
        const comparison = [];

        vendors.forEach(vendor => {
            if (vendor.priceList) {
                const item = vendor.priceList.find(i => 
                    (i.ingredient?.toLowerCase() === key) || 
                    (i.item?.toLowerCase() === key)
                );

                if (item && item.price) {
                    comparison.push({
                        vendor: vendor.name,
                        price: parseFloat(item.price),
                        unit: item.unit || 'lb',
                        caseSize: item.caseSize,
                        caseCost: item.caseSize ? (parseFloat(item.price) * parseInt(item.caseSize)) : null
                    });
                }
            }
        });

        // Sort by price (lowest first)
        comparison.sort((a, b) => a.price - b.price);

        return comparison;
    }

    /**
     * Update ingredient price
     * @param {string} name - Ingredient name
     * @param {number} price - New price
     * @param {string} unit - Unit of measurement
     * @param {string} vendor - Vendor name
     */
    updateIngredientPrice(name, price, unit, vendor) {
        const key = name.toLowerCase();
        this.ingredientPrices[key] = {
            name: name,
            price: parseFloat(price),
            unit: unit || 'lb',
            vendor: vendor || 'Manual Entry'
        };
        console.log(`💰 Updated price for ${name}: $${price}/${unit}`);
    }

    /**
     * Calculate menu cost (multiple recipes)
     * @param {Array} recipes - Array of recipe objects
     * @returns {Object} Total menu cost
     */
    calculateMenuCost(recipes) {
        let totalCost = 0;
        let totalServings = 0;
        const recipeCosts = [];

        recipes.forEach(recipe => {
            const cost = this.calculateRecipeCost(recipe);
            recipeCosts.push({
                name: recipe.name || recipe.title,
                cost: cost.totalCost,
                costPerServing: cost.costPerServing,
                servings: cost.servings
            });
            totalCost += parseFloat(cost.totalCost);
            totalServings += cost.servings;
        });

        return {
            totalCost: totalCost.toFixed(2),
            totalServings: totalServings,
            averageCostPerServing: (totalCost / totalServings).toFixed(2),
            recipes: recipeCosts,
            recipeCount: recipes.length
        };
    }

    /**
     * Create empty cost breakdown
     * @returns {Object}
     */
    createEmptyCostBreakdown() {
        return {
            totalCost: '0.00',
            costPerServing: '0.00',
            ingredientCost: '0.00',
            laborCost: '0.00',
            overheadCost: '0.00',
            servings: 0,
            ingredientCosts: [],
            missingPrices: [],
            pricingOptions: {
                budget: { price: '0.00', margin: 0, profit: '0.00' },
                standard: { price: '0.00', margin: 0, profit: '0.00' },
                premium: { price: '0.00', margin: 0, profit: '0.00' },
                luxury: { price: '0.00', margin: 0, profit: '0.00' }
            },
            breakdown: {
                ingredients: '0',
                labor: '0',
                overhead: '0'
            }
        };
    }

    /**
     * Create cost summary HTML
     * @param {Object} costData - Cost calculation result
     * @returns {string} HTML string
     */
    createCostSummaryHTML(costData) {
        const hasMissingPrices = costData.missingPrices && costData.missingPrices.length > 0;

        return `
            <div class="cost-summary" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px; border-radius: 12px; margin: 16px 0; border: 1px solid #334155;">
                <!-- Main Cost Display -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-bottom: 20px;">
                    <div style="text-align: center; padding: 16px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3);">
                        <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total Cost</div>
                        <div style="color: #10b981; font-size: 28px; font-weight: bold;">$${costData.totalCost}</div>
                    </div>
                    <div style="text-align: center; padding: 16px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.3);">
                        <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Per Serving</div>
                        <div style="color: #3b82f6; font-size: 28px; font-weight: bold;">$${costData.costPerServing}</div>
                    </div>
                    <div style="text-align: center; padding: 16px; background: rgba(168, 85, 247, 0.1); border-radius: 8px; border: 1px solid rgba(168, 85, 247, 0.3);">
                        <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Servings</div>
                        <div style="color: #a855f7; font-size: 28px; font-weight: bold;">${costData.servings}</div>
                    </div>
                </div>

                <!-- Cost Breakdown -->
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #e2e8f0; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Cost Breakdown</h4>
                    <div style="display: grid; gap: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 6px;">
                            <span style="color: #cbd5e1;">Ingredients (${costData.breakdown.ingredients}%)</span>
                            <span style="color: #10b981; font-weight: bold;">$${costData.ingredientCost}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 6px;">
                            <span style="color: #cbd5e1;">Labor (${costData.breakdown.labor}%)</span>
                            <span style="color: #f59e0b; font-weight: bold;">$${costData.laborCost}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 6px;">
                            <span style="color: #cbd5e1;">Overhead (${costData.breakdown.overhead}%)</span>
                            <span style="color: #ef4444; font-weight: bold;">$${costData.overheadCost}</span>
                        </div>
                    </div>
                </div>

                <!-- Pricing Recommendations -->
                <div>
                    <h4 style="color: #e2e8f0; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">💡 Recommended Pricing</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px;">
                        <div style="padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.3); text-align: center;">
                            <div style="color: #94a3b8; font-size: 11px; margin-bottom: 4px;">Budget</div>
                            <div style="color: #3b82f6; font-size: 18px; font-weight: bold;">$${costData.pricingOptions.budget.price}</div>
                            <div style="color: #64748b; font-size: 10px; margin-top: 2px;">${costData.pricingOptions.budget.margin}% margin</div>
                        </div>
                        <div style="padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3); text-align: center;">
                            <div style="color: #94a3b8; font-size: 11px; margin-bottom: 4px;">Standard</div>
                            <div style="color: #10b981; font-size: 18px; font-weight: bold;">$${costData.pricingOptions.standard.price}</div>
                            <div style="color: #64748b; font-size: 10px; margin-top: 2px;">${costData.pricingOptions.standard.margin.toFixed(1)}% margin</div>
                        </div>
                        <div style="padding: 12px; background: rgba(168, 85, 247, 0.1); border-radius: 8px; border: 1px solid rgba(168, 85, 247, 0.3); text-align: center;">
                            <div style="color: #94a3b8; font-size: 11px; margin-bottom: 4px;">Premium</div>
                            <div style="color: #a855f7; font-size: 18px; font-weight: bold;">$${costData.pricingOptions.premium.price}</div>
                            <div style="color: #64748b; font-size: 10px; margin-top: 2px;">${costData.pricingOptions.premium.margin}% margin</div>
                        </div>
                        <div style="padding: 12px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.3); text-align: center;">
                            <div style="color: #94a3b8; font-size: 11px; margin-bottom: 4px;">Luxury</div>
                            <div style="color: #f59e0b; font-size: 18px; font-weight: bold;">$${costData.pricingOptions.luxury.price}</div>
                            <div style="color: #64748b; font-size: 10px; margin-top: 2px;">${costData.pricingOptions.luxury.margin}% margin</div>
                        </div>
                    </div>
                </div>

                ${hasMissingPrices ? `
                    <div style="margin-top: 16px; padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3);">
                        <div style="color: #fca5a5; font-size: 12px; font-weight: bold; margin-bottom: 6px;">⚠️ Missing Prices:</div>
                        <div style="color: #cbd5e1; font-size: 11px;">${costData.missingPrices.join(', ')}</div>
                        <div style="color: #94a3b8; font-size: 10px; margin-top: 6px;">Add prices in Vendor Management to get accurate costs</div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Create ingredient costs table HTML
     * @param {Array} ingredientCosts - Array of ingredient cost data
     * @returns {string} HTML string
     */
    createIngredientCostsTableHTML(ingredientCosts) {
        if (!ingredientCosts || ingredientCosts.length === 0) {
            return '<p style="color: #94a3b8; text-align: center; padding: 20px;">No ingredient costs to display</p>';
        }

        const rows = ingredientCosts.map(ing => `
            <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 12px; color: #e2e8f0;">${ing.name}</td>
                <td style="padding: 12px; color: #cbd5e1; text-align: center;">${ing.quantity} ${ing.unit}</td>
                <td style="padding: 12px; color: ${ing.priceFound ? '#10b981' : '#ef4444'}; text-align: right; font-weight: bold;">
                    ${ing.priceFound ? '$' + ing.cost.toFixed(2) : 'N/A'}
                </td>
                <td style="padding: 12px; color: #94a3b8; font-size: 11px; text-align: right;">
                    ${ing.priceFound ? `$${ing.pricePerUnit.toFixed(2)}/${ing.priceUnit}` : 'No price'}
                </td>
            </tr>
        `).join('');

        return `
            <div style="overflow-x: auto; margin: 16px 0;">
                <table style="width: 100%; border-collapse: collapse; background: rgba(15, 23, 42, 0.5); border-radius: 8px; overflow: hidden;">
                    <thead>
                        <tr style="background: rgba(51, 65, 85, 0.5);">
                            <th style="padding: 12px; color: #e2e8f0; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Ingredient</th>
                            <th style="padding: 12px; color: #e2e8f0; text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Quantity</th>
                            <th style="padding: 12px; color: #e2e8f0; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Cost</th>
                            <th style="padding: 12px; color: #e2e8f0; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Unit Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }
}

// Initialize global instance
window.costCalculator = new CostCalculator();

console.log('💰 Cost Calculator System Loaded');

