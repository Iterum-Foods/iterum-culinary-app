/**
 * Unit Converter System
 * Handles conversions between different units of measure for ingredients
 * Supports weight, volume, and count-based conversions
 */

class UnitConverter {
    constructor() {
        // Conversion factors to grams (base unit for weight)
        this.weightConversions = {
            'g': 1,           // gram (base)
            'kg': 1000,       // kilogram
            'oz': 28.3495,    // ounce
            'lb': 453.592,    // pound
            'mg': 0.001       // milligram
        };

        // Conversion factors to milliliters (base unit for volume)
        this.volumeConversions = {
            'ml': 1,          // milliliter (base)
            'l': 1000,        // liter
            'fl oz': 29.5735, // fluid ounce (US)
            'cup': 236.588,   // cup (US)
            'pt': 473.176,    // pint (US)
            'qt': 946.353,    // quart (US)
            'gal': 3785.41,   // gallon (US)
            'tsp': 4.92892,   // teaspoon
            'tbsp': 14.7868   // tablespoon
        };

        // Count-based units (no conversion, just quantity)
        this.countUnits = ['piece', 'each', 'ea', 'bunch', 'head', 'clove', 'sprig', 'leaf'];

        // Unit categories
        this.unitCategories = {
            weight: Object.keys(this.weightConversions),
            volume: Object.keys(this.volumeConversions),
            count: this.countUnits
        };
    }

    /**
     * Get unit category
     */
    getUnitCategory(unit) {
        const normalized = unit.toLowerCase().trim();
        
        if (this.weightConversions[normalized]) return 'weight';
        if (this.volumeConversions[normalized]) return 'volume';
        if (this.countUnits.includes(normalized)) return 'count';
        
        return 'unknown';
    }

    /**
     * Check if units are compatible (same category)
     */
    areCompatible(fromUnit, toUnit) {
        const fromCategory = this.getUnitCategory(fromUnit);
        const toCategory = this.getUnitCategory(toUnit);
        
        return fromCategory === toCategory && fromCategory !== 'unknown';
    }

    /**
     * Convert value from one unit to another
     */
    convert(value, fromUnit, toUnit) {
        if (!value || value === 0) return 0;
        if (fromUnit === toUnit) return value;

        const fromCategory = this.getUnitCategory(fromUnit);
        const toCategory = this.getUnitCategory(toUnit);

        // Can't convert between different categories
        if (fromCategory !== toCategory) {
            console.warn(`⚠️ Cannot convert ${fromUnit} to ${toUnit} - different categories`);
            return null;
        }

        const from = fromUnit.toLowerCase().trim();
        const to = toUnit.toLowerCase().trim();

        if (fromCategory === 'weight') {
            // Convert to grams first, then to target unit
            const grams = value * (this.weightConversions[from] || 1);
            return grams / (this.weightConversions[to] || 1);
        }

        if (fromCategory === 'volume') {
            // Convert to milliliters first, then to target unit
            const ml = value * (this.volumeConversions[from] || 1);
            return ml / (this.volumeConversions[to] || 1);
        }

        if (fromCategory === 'count') {
            // Count units - no conversion, return as-is
            return value;
        }

        return null;
    }

    /**
     * Convert price from vendor unit to base unit
     * Returns cost per base unit
     */
    convertPrice(vendorPrice, vendorUnit, baseUnit) {
        if (!vendorPrice || vendorPrice === 0) return 0;
        if (vendorUnit === baseUnit) return vendorPrice;

        const conversionFactor = this.convert(1, vendorUnit, baseUnit);
        
        if (conversionFactor === null) {
            console.warn(`⚠️ Cannot convert price from ${vendorUnit} to ${baseUnit}`);
            return null;
        }

        // Price per vendor unit * conversion factor = price per base unit
        return vendorPrice * conversionFactor;
    }

    /**
     * Normalize price to a standard unit for comparison
     */
    normalizePrice(price, unit, targetUnit = null) {
        if (!price || price === 0) return { price: 0, unit: unit };

        const category = this.getUnitCategory(unit);
        
        // Default target units by category
        if (!targetUnit) {
            if (category === 'weight') targetUnit = 'g';
            else if (category === 'volume') targetUnit = 'ml';
            else targetUnit = unit; // count units stay as-is
        }

        const convertedPrice = this.convertPrice(price, unit, targetUnit);
        
        return {
            price: convertedPrice !== null ? convertedPrice : price,
            unit: targetUnit,
            originalPrice: price,
            originalUnit: unit
        };
    }

    /**
     * Compare prices from different vendors (normalize to same unit)
     */
    comparePrices(vendorPrices) {
        // vendorPrices format: [{ price: 10, unit: 'lb', vendor: 'Vendor A' }, ...]
        
        if (!vendorPrices || vendorPrices.length === 0) return [];

        // Group by unit category
        const byCategory = {};
        vendorPrices.forEach(vp => {
            const category = this.getUnitCategory(vp.unit);
            if (!byCategory[category]) byCategory[category] = [];
            byCategory[category].push(vp);
        });

        const comparisons = [];

        // Compare within each category
        Object.keys(byCategory).forEach(category => {
            const prices = byCategory[category];
            
            // Determine standard unit for this category
            const standardUnit = category === 'weight' ? 'g' : 
                                category === 'volume' ? 'ml' : 
                                prices[0].unit;

            // Normalize all prices to standard unit
            const normalized = prices.map(vp => ({
                ...vp,
                normalized: this.normalizePrice(vp.price, vp.unit, standardUnit)
            }));

            // Sort by normalized price
            normalized.sort((a, b) => a.normalized.price - b.normalized.price);

            comparisons.push({
                category,
                standardUnit,
                prices: normalized,
                bestPrice: normalized[0],
                priceRange: {
                    min: normalized[0].normalized.price,
                    max: normalized[normalized.length - 1].normalized.price,
                    difference: normalized[normalized.length - 1].normalized.price - normalized[0].normalized.price,
                    percentDifference: ((normalized[normalized.length - 1].normalized.price - normalized[0].normalized.price) / normalized[0].normalized.price * 100).toFixed(1)
                }
            });
        });

        return comparisons;
    }

    /**
     * Calculate recipe cost using ingredient with vendor pricing
     */
    calculateIngredientCost(ingredient, recipeQuantity, recipeUnit) {
        if (!ingredient || !recipeQuantity) return null;

        // Get base unit from ingredient
        const baseUnit = ingredient.unit || ingredient.default_unit || 'g';
        
        // Convert recipe quantity to base unit
        const recipeQuantityInBase = this.convert(recipeQuantity, recipeUnit, baseUnit);
        
        if (recipeQuantityInBase === null) {
            console.warn(`⚠️ Cannot convert recipe quantity ${recipeQuantity} ${recipeUnit} to base unit ${baseUnit}`);
            return null;
        }

        // Get cost per base unit
        let costPerBaseUnit = ingredient.cost || 0;

        // If we have case pricing, use that
        if (ingredient.casePricing) {
            const { pricePerCase, caseSize, caseUnit, conversionFactor } = ingredient.casePricing;
            
            // Convert case unit to base unit
            const caseSizeInBase = this.convert(caseSize, caseUnit, baseUnit);
            
            if (caseSizeInBase !== null && caseSizeInBase > 0) {
                costPerBaseUnit = pricePerCase / (caseSizeInBase * (conversionFactor || 1));
            }
        }

        // Calculate total cost
        const totalCost = recipeQuantityInBase * costPerBaseUnit;

        return {
            ingredientName: ingredient.name,
            recipeQuantity,
            recipeUnit,
            recipeQuantityInBase,
            baseUnit,
            costPerBaseUnit,
            totalCost,
            breakdown: {
                recipeQuantity: `${recipeQuantity} ${recipeUnit}`,
                convertedToBase: `${recipeQuantityInBase.toFixed(4)} ${baseUnit}`,
                costPerBase: `$${costPerBaseUnit.toFixed(4)}/${baseUnit}`,
                totalCost: `$${totalCost.toFixed(4)}`
            }
        };
    }

    /**
     * Get conversion factor between two units
     */
    getConversionFactor(fromUnit, toUnit) {
        return this.convert(1, fromUnit, toUnit);
    }

    /**
     * Format unit for display
     */
    formatUnit(unit) {
        const formatted = {
            'g': 'g',
            'kg': 'kg',
            'oz': 'oz',
            'lb': 'lb',
            'ml': 'ml',
            'l': 'L',
            'fl oz': 'fl oz',
            'cup': 'cup',
            'pt': 'pt',
            'qt': 'qt',
            'gal': 'gal',
            'tsp': 'tsp',
            'tbsp': 'tbsp',
            'piece': 'piece',
            'each': 'each',
            'ea': 'ea',
            'bunch': 'bunch'
        };

        return formatted[unit.toLowerCase()] || unit;
    }
}

// Create global instance
window.unitConverter = new UnitConverter();

console.log('📏 Unit Converter loaded');

