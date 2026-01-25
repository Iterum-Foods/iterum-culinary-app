/**
 * Smart Menu Parser
 * Advanced menu item detection with AI-like pattern recognition
 */

class SmartMenuParser {
    constructor() {
        // Enhanced price patterns for multiple formats
        this.pricePatterns = [
            /\$(\d+(?:\.\d{2})?)/,                    // $12.50
            /(\d+(?:\.\d{2})?)\s*(?:dollars?|USD)/i,  // 12.50 dollars
            /£(\d+(?:\.\d{2})?)/,                     // £12.50
            /€(\d+(?:\.\d{2})?)/,                     // €12.50
            /(\d+(?:\.\d{2})?)\s*(?:£|pounds?)/i,     // 12.50 pounds
            /(\d+(?:\.\d{2})?)\s*(?:€|euros?)/i,      // 12.50 euros
            /¥(\d+)/,                                  // ¥1200
            /(\d+)\s*(?:¥|yen)/i,                     // 1200 yen
            /₹(\d+(?:\.\d{2})?)/,                     // ₹350
            /(\d+(?:\.\d{2})?)\s*(?:₹|rupees?)/i,     // 350 rupees
            /(\d+)(?:,\d{3})*(?:\.\d{2})?\s*(?:won|₩)/i, // 12,000 won
        ];

        // Category header patterns - more flexible
        this.categoryPatterns = [
            /^#{1,3}\s*(.+)$/,                        // Markdown headers
            /^([A-Z\s&]{3,}):?\s*$/,                  // ALL CAPS
            /^[-=]{3,}\s*(.+)\s*[-=]{3,}$/,          // --- CATEGORY ---
            /^\*\*(.+)\*\*$/,                         // **Category**
            /^(.+):$/,                                // Category:
            /^<(.+)>$/,                               // <Category>
            /^\[(.+)\]$/,                             // [Category]
            /^={2,}\s*(.+)\s*={2,}$/,                // == Category ==
            /^•\s*([A-Z][A-Z\s&]{2,})$/,             // • CATEGORY
        ];

        // Known category names
        this.knownCategories = [
            'appetizers', 'starters', 'small plates', 'shareables',
            'salads', 'soups', 'soup', 'salad',
            'main courses', 'mains', 'entrees', 'entrées', 'main',
            'pasta', 'noodles', 'pasta & noodles',
            'seafood', 'fish', 'shellfish',
            'beef', 'burgers', 'steaks', 'beef & burgers',
            'chicken', 'poultry',
            'pork', 'lamb', 'pork & lamb',
            'pizza', 'pizzas',
            'sandwiches', 'wraps',
            'sides', 'side dishes', 'accompaniments',
            'desserts', 'sweets', 'dessert',
            'beverages', 'drinks', 'cocktails', 'wines', 'beer',
            'breakfast', 'brunch', 'lunch', 'dinner',
            'specials', 'chef specials', 'daily specials',
            'vegetarian', 'vegan', 'gluten free'
        ];

        // Item indicators
        this.itemPrefixes = ['-', '•', '●', '◦', '▪', '*', '→', '➤', '○'];
        
        // Description indicators
        this.descriptionSeparators = [' - ', ' – ', ' — ', ' | ', ' / ', ': '];
    }

    /**
     * Main parsing function - intelligently detects menu structure
     */
    parseMenuText(text, options = {}) {
        console.log('🔍 Smart Menu Parser: Starting analysis...');
        
        const lines = this.preprocessText(text);
        const items = [];
        let currentCategory = 'Uncategorized';
        let currentItem = null;
        let consecutiveDescriptionLines = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const nextLine = lines[i + 1] || '';

            // Skip empty or very short lines
            if (!line || line.length < 3) continue;

            // Check if this is a category header
            const categoryName = this.detectCategoryHeader(line);
            if (categoryName) {
                console.log(`📂 Category found: ${categoryName}`);
                currentCategory = categoryName;
                consecutiveDescriptionLines = 0;
                
                // Save previous item if exists
                if (currentItem) {
                    items.push(this.finalizeItem(currentItem, options));
                    currentItem = null;
                }
                continue;
            }

            // Check if this looks like a menu item (has price or strong item indicators)
            const priceInfo = this.extractPrice(line);
            const isLikelyItem = this.isLikelyMenuItem(line, nextLine, priceInfo);

            if (isLikelyItem) {
                // Save previous item if exists
                if (currentItem) {
                    items.push(this.finalizeItem(currentItem, options));
                }

                // Start new item
                const itemName = this.extractItemName(line, priceInfo);
                const description = this.extractInlineDescription(line, itemName, priceInfo);

                currentItem = {
                    name: itemName,
                    price: priceInfo.price,
                    category: currentCategory,
                    description: description,
                    rawLine: line,
                    allergens: [],
                    dietaryInfo: []
                };

                consecutiveDescriptionLines = 0;
                console.log(`  🍽️ Menu item: ${itemName}`);

            } else if (currentItem && this.isLikelyDescription(line)) {
                // This line is likely a continuation of the description
                if (consecutiveDescriptionLines < 3) { // Max 3 lines of description
                    const cleaned = this.cleanDescription(line);
                    if (cleaned) {
                        if (currentItem.description) {
                            currentItem.description += ' ' + cleaned;
                        } else {
                            currentItem.description = cleaned;
                        }
                        consecutiveDescriptionLines++;
                    }
                }
            } else {
                // Reset description counter if this doesn't look like a description
                consecutiveDescriptionLines = 0;
            }
        }

        // Add final item
        if (currentItem) {
            items.push(this.finalizeItem(currentItem, options));
        }

        console.log(`✅ Parsed ${items.length} menu items`);
        return items;
    }

    /**
     * Preprocess text - clean and normalize
     */
    preprocessText(text) {
        // Normalize line breaks
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Remove excessive whitespace
        text = text.replace(/[ \t]+/g, ' ');
        
        // Split into lines and trim
        let lines = text.split('\n').map(line => line.trim());
        
        // Remove empty lines but preserve structure
        lines = lines.filter(line => line.length > 0);
        
        return lines;
    }

    /**
     * Detect if a line is a category header
     */
    detectCategoryHeader(line) {
        // Try pattern matching
        for (const pattern of this.categoryPatterns) {
            const match = line.match(pattern);
            if (match) {
                const categoryName = (match[1] || match[0]).trim();
                // Verify it's a known category or looks like one
                if (this.isKnownCategory(categoryName) || this.looksLikeCategoryName(categoryName)) {
                    return this.normalizeCategory(categoryName);
                }
            }
        }

        // Check for known categories without pattern
        const cleanLine = line.toLowerCase().replace(/[^\w\s]/g, '').trim();
        if (this.isKnownCategory(cleanLine)) {
            return this.normalizeCategory(line);
        }

        return null;
    }

    /**
     * Check if text matches known category
     */
    isKnownCategory(text) {
        const clean = text.toLowerCase().replace(/[^\w\s]/g, '').trim();
        return this.knownCategories.some(cat => 
            clean === cat || clean.includes(cat) || cat.includes(clean)
        );
    }

    /**
     * Check if text looks like a category name
     */
    looksLikeCategoryName(text) {
        // Short, mostly uppercase, no price, descriptive
        if (text.length > 30) return false;
        if (this.extractPrice(text).price) return false;
        
        const uppercaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
        if (uppercaseRatio > 0.5 && text.length < 25) return true;
        
        return false;
    }

    /**
     * Normalize category name
     */
    normalizeCategory(name) {
        return name
            .replace(/[#*\-=\[\]<>:]/g, '')
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Extract price from text - tries multiple formats
     */
    extractPrice(text) {
        for (const pattern of this.pricePatterns) {
            const match = text.match(pattern);
            if (match) {
                const priceText = match[0];
                const priceValue = parseFloat(match[1] || match[0].replace(/[^\d.]/g, ''));
                return {
                    price: priceValue,
                    text: priceText,
                    position: match.index
                };
            }
        }
        return { price: null, text: '', position: -1 };
    }

    /**
     * Determine if a line is likely a menu item
     */
    isLikelyMenuItem(line, nextLine, priceInfo) {
        // Has a price - very likely an item
        if (priceInfo.price) return true;

        // Starts with a bullet or dash
        if (this.itemPrefixes.some(prefix => line.startsWith(prefix))) return true;

        // Short line followed by a longer descriptive line (possible name + description)
        if (line.length < 50 && nextLine && nextLine.length > line.length && !this.extractPrice(nextLine).price) {
            return true;
        }

        // Contains food keywords
        if (this.containsFoodKeywords(line)) return true;

        // Line before a price on next line
        if (nextLine && this.extractPrice(nextLine).price && !this.containsFoodKeywords(nextLine)) {
            return true;
        }

        return false;
    }

    /**
     * Check if text contains food-related keywords
     */
    containsFoodKeywords(text) {
        const foodKeywords = [
            'grilled', 'fried', 'baked', 'roasted', 'sautéed', 'braised', 'steamed',
            'fresh', 'organic', 'homemade', 'house', 'signature',
            'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'lamb',
            'pasta', 'rice', 'noodles', 'salad', 'soup', 'sandwich', 'burger',
            'served with', 'topped with', 'accompanied by'
        ];

        const lowerText = text.toLowerCase();
        return foodKeywords.some(keyword => lowerText.includes(keyword));
    }

    /**
     * Extract item name from line
     */
    extractItemName(line, priceInfo) {
        let name = line;

        // Remove bullet points
        for (const prefix of this.itemPrefixes) {
            if (name.startsWith(prefix)) {
                name = name.substring(prefix.length).trim();
                break;
            }
        }

        // Remove price
        if (priceInfo.text) {
            name = name.replace(priceInfo.text, '').trim();
        }

        // Remove description separator if at end
        for (const sep of this.descriptionSeparators) {
            if (name.includes(sep)) {
                const parts = name.split(sep);
                name = parts[0].trim();
                break;
            }
        }

        // Clean up
        name = name.replace(/\.{2,}$/, '').trim(); // Remove trailing dots
        name = name.replace(/\s{2,}/g, ' '); // Remove excessive spaces

        return name;
    }

    /**
     * Extract inline description (same line as item name)
     */
    extractInlineDescription(line, itemName, priceInfo) {
        let remaining = line;

        // Remove item name
        remaining = remaining.replace(itemName, '').trim();

        // Remove price
        if (priceInfo.text) {
            remaining = remaining.replace(priceInfo.text, '').trim();
        }

        // Remove bullet if present
        for (const prefix of this.itemPrefixes) {
            remaining = remaining.replace(prefix, '').trim();
        }

        // Check for description separator
        for (const sep of this.descriptionSeparators) {
            if (remaining.startsWith(sep)) {
                remaining = remaining.substring(sep.length).trim();
                break;
            }
        }

        return this.cleanDescription(remaining);
    }

    /**
     * Check if a line looks like a description
     */
    isLikelyDescription(line) {
        // Not too long, not too short
        if (line.length < 10 || line.length > 200) return false;

        // Doesn't start with bullet
        if (this.itemPrefixes.some(prefix => line.startsWith(prefix))) return false;

        // Doesn't have a price
        if (this.extractPrice(line).price) return false;

        // Contains descriptive words
        const descriptiveWords = ['served', 'with', 'topped', 'accompanied', 'includes', 'contains', 'made', 'fresh', 'our'];
        const lowerLine = line.toLowerCase();
        if (descriptiveWords.some(word => lowerLine.includes(word))) return true;

        // Starts with lowercase (continuation)
        if (line[0] === line[0].toLowerCase() && line[0] !== line[0].toUpperCase()) return true;

        return false;
    }

    /**
     * Clean up description text
     */
    cleanDescription(text) {
        if (!text) return '';

        // Remove bullets
        for (const prefix of this.itemPrefixes) {
            text = text.replace(new RegExp(`^\\${prefix}\\s*`), '');
        }

        // Remove parentheses with single letters (dietary indicators handled separately)
        text = text.replace(/\([A-Z]{1,3}\)/g, '').trim();

        // Clean up whitespace
        text = text.replace(/\s{2,}/g, ' ').trim();

        // Remove trailing punctuation if it's just dots
        text = text.replace(/\.{2,}$/, '').trim();

        return text;
    }

    /**
     * Finalize item - extract additional metadata
     */
    finalizeItem(item, options) {
        // Extract dietary info if option enabled
        if (options.detectDietary !== false) {
            item.dietaryInfo = this.extractDietaryInfo(item.rawLine + ' ' + item.description);
        }

        // Extract allergens
        item.allergens = this.extractAllergens(item.rawLine + ' ' + item.description);

        // Auto-categorize if needed
        if (options.autoCategorize && item.category === 'Uncategorized') {
            item.category = this.autoCategorize(item.name, item.description);
        }

        // Clean up
        delete item.rawLine;
        item.description = item.description || '';

        return item;
    }

    /**
     * Extract dietary information
     */
    extractDietaryInfo(text) {
        const dietary = [];
        const lowerText = text.toLowerCase();

        const patterns = {
            'Vegetarian': /\b(vegetarian|veggie|v\b)/i,
            'Vegan': /\b(vegan|vg\b)/i,
            'Gluten-Free': /\b(gluten[\s-]?free|gf\b)/i,
            'Dairy-Free': /\b(dairy[\s-]?free|df\b)/i,
            'Nut-Free': /\b(nut[\s-]?free|nf\b)/i,
            'Keto': /\b(keto|ketogenic)/i,
            'Paleo': /\bpaleo\b/i,
            'Low-Carb': /\b(low[\s-]?carb)/i
        };

        for (const [name, pattern] of Object.entries(patterns)) {
            if (pattern.test(text)) {
                dietary.push(name);
            }
        }

        return dietary;
    }

    /**
     * Extract allergen information
     */
    extractAllergens(text) {
        const allergens = [];
        const lowerText = text.toLowerCase();

        const allergenList = [
            { name: 'Dairy', keywords: ['milk', 'cheese', 'cream', 'butter', 'dairy'] },
            { name: 'Nuts', keywords: ['nuts', 'almond', 'walnut', 'peanut', 'cashew', 'pecan'] },
            { name: 'Shellfish', keywords: ['shellfish', 'shrimp', 'lobster', 'crab', 'oyster'] },
            { name: 'Fish', keywords: ['fish', 'salmon', 'tuna', 'cod', 'halibut'] },
            { name: 'Eggs', keywords: ['egg', 'eggs'] },
            { name: 'Soy', keywords: ['soy', 'tofu', 'edamame'] },
            { name: 'Wheat', keywords: ['wheat', 'flour', 'bread', 'pasta'] },
            { name: 'Gluten', keywords: ['gluten', 'barley', 'rye'] }
        ];

        for (const allergen of allergenList) {
            if (allergen.keywords.some(keyword => lowerText.includes(keyword))) {
                allergens.push(allergen.name);
            }
        }

        return [...new Set(allergens)]; // Remove duplicates
    }

    /**
     * Auto-categorize item based on name and description
     */
    autoCategorize(name, description) {
        const text = (name + ' ' + description).toLowerCase();

        const categoryRules = [
            { category: 'Appetizers', keywords: ['appetizer', 'starter', 'small plate', 'tapas', 'bruschetta', 'wings', 'nachos'] },
            { category: 'Soups & Salads', keywords: ['soup', 'salad', 'chowder', 'bisque', 'gazpacho', 'caesar'] },
            { category: 'Pasta & Noodles', keywords: ['pasta', 'spaghetti', 'linguine', 'fettuccine', 'ravioli', 'noodle', 'ramen'] },
            { category: 'Seafood', keywords: ['fish', 'seafood', 'salmon', 'tuna', 'cod', 'halibut', 'mahi', 'sea bass', 'shrimp', 'scallop'] },
            { category: 'Beef & Burgers', keywords: ['beef', 'steak', 'burger', 'ribeye', 'filet', 'sirloin', 'brisket'] },
            { category: 'Poultry', keywords: ['chicken', 'turkey', 'duck', 'poultry'] },
            { category: 'Pork & Lamb', keywords: ['pork', 'lamb', 'ribs', 'chop', 'bacon'] },
            { category: 'Pizza', keywords: ['pizza', 'flatbread'] },
            { category: 'Sandwiches & Wraps', keywords: ['sandwich', 'wrap', 'panini', 'sub', 'hoagie'] },
            { category: 'Desserts', keywords: ['dessert', 'cake', 'ice cream', 'pie', 'tart', 'brownie', 'cookie', 'cheesecake', 'chocolate', 'sweet'] },
            { category: 'Beverages', keywords: ['drink', 'beverage', 'cocktail', 'wine', 'beer', 'juice', 'soda', 'coffee', 'tea'] }
        ];

        for (const rule of categoryRules) {
            if (rule.keywords.some(keyword => text.includes(keyword))) {
                return rule.category;
            }
        }

        return 'Main Courses';
    }
}

// Export for use in menu builder
window.SmartMenuParser = SmartMenuParser;
console.log('✅ Smart Menu Parser loaded');

