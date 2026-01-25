/**
 * Multi-Recipe Boundary Detector
 * Intelligently splits documents containing multiple recipes
 */

class MultiRecipeDetector {
    constructor() {
        // Recipe title patterns
        this.titlePatterns = [
            // Title case or ALL CAPS at start of line
            /^([A-Z][A-Za-z\s,'&-]{5,60})$/,
            // Numbered recipes
            /^\d+\.\s*([A-Z][A-Za-z\s,'&-]{5,60})$/,
            // Recipe: Title format
            /^Recipe:\s*(.+)$/i,
            // --- Title --- format
            /^[-=]{3,}\s*(.+)\s*[-=]{3,}$/,
        ];

        // Section headers that indicate recipe start
        this.sectionHeaders = [
            'ingredients', 'ingredient list', 'what you need',
            'instructions', 'directions', 'method', 'steps', 'preparation',
            'servings', 'serves', 'yield', 'makes',
            'prep time', 'cook time', 'total time'
        ];

        // Recipe boundary indicators
        this.boundaryMarkers = [
            '---', '===', '***', '___',
            'Recipe:', 'RECIPE:',
            '◆', '●', '■'
        ];
    }

    /**
     * Main detection function - splits text into individual recipes
     */
    detectRecipes(text) {
        console.log('🔍 Multi-Recipe Detector: Analyzing document...');
        
        const lines = this.preprocessText(text);
        const recipes = [];
        let currentRecipe = [];
        let recipeCount = 0;
        let confidence = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const nextLine = lines[i + 1] || '';
            const prevLine = lines[i - 1] || '';

            // Check if this is a recipe boundary
            if (this.isRecipeBoundary(line, prevLine, nextLine, currentRecipe.length)) {
                // Save current recipe if it has content
                if (currentRecipe.length > 10) { // Minimum lines for valid recipe
                    const recipeText = currentRecipe.join('\n');
                    const parsed = this.parseRecipe(recipeText, recipeCount);
                    
                    if (parsed.title && (parsed.ingredients.length > 0 || parsed.instructions.length > 0)) {
                        recipes.push(parsed);
                        recipeCount++;
                        console.log(`  ✅ Recipe ${recipeCount}: ${parsed.title}`);
                    }
                }
                
                // Start new recipe (but don't include the boundary line)
                currentRecipe = this.isTitleLine(line) ? [line] : [];
            } else {
                currentRecipe.push(line);
            }
        }

        // Don't forget the last recipe
        if (currentRecipe.length > 10) {
            const recipeText = currentRecipe.join('\n');
            const parsed = this.parseRecipe(recipeText, recipeCount);
            
            if (parsed.title && (parsed.ingredients.length > 0 || parsed.instructions.length > 0)) {
                recipes.push(parsed);
                recipeCount++;
                console.log(`  ✅ Recipe ${recipeCount}: ${parsed.title}`);
            }
        }

        console.log(`✅ Detected ${recipes.length} recipes in document`);
        return recipes;
    }

    /**
     * Preprocess text
     */
    preprocessText(text) {
        // Normalize line breaks
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Split into lines and trim
        let lines = text.split('\n').map(line => line.trim());
        
        return lines;
    }

    /**
     * Check if a line is a recipe boundary
     */
    isRecipeBoundary(line, prevLine, nextLine, currentRecipeLength) {
        // Explicit boundary markers
        for (const marker of this.boundaryMarkers) {
            if (line.startsWith(marker) || line === marker.repeat(3)) {
                return true;
            }
        }

        // Empty lines followed by a title after sufficient content
        if (!line && currentRecipeLength > 15) {
            if (this.isTitleLine(nextLine)) {
                return true;
            }
        }

        // Multiple consecutive empty lines
        if (!line && !prevLine && nextLine && currentRecipeLength > 10) {
            return true;
        }

        // Title pattern at start of new section after content
        if (currentRecipeLength > 15 && this.isTitleLine(line)) {
            // Check if previous recipe seems complete
            if (this.seemsComplete(currentRecipeLength)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if a line looks like a recipe title
     */
    isTitleLine(line) {
        if (!line || line.length < 5 || line.length > 80) return false;

        // Try each title pattern
        for (const pattern of this.titlePatterns) {
            if (pattern.test(line)) {
                return true;
            }
        }

        // Title case check (first letter caps, reasonable length)
        if (line[0] === line[0].toUpperCase() && 
            line.length < 60 && 
            !line.match(/^\d/) &&
            !this.sectionHeaders.some(h => line.toLowerCase().includes(h))) {
            return true;
        }

        return false;
    }

    /**
     * Check if current recipe seems complete
     */
    seemsComplete(lineCount) {
        return lineCount > 15; // Minimum lines for a reasonable recipe
    }

    /**
     * Parse individual recipe from text block
     */
    parseRecipe(text, index) {
        const lines = text.split('\n').filter(l => l.trim());
        
        const recipe = {
            id: `recipe_${Date.now()}_${index}`,
            title: '',
            description: '',
            ingredients: [],
            instructions: [],
            servings: null,
            prepTime: null,
            cookTime: null,
            totalTime: null,
            cuisine: '',
            difficulty: 'Medium',
            tags: [],
            notes: '',
            source: 'Bulk Import',
            createdAt: new Date().toISOString(),
            isComplete: false
        };

        let section = 'title'; // title, ingredients, instructions, notes
        let ingredientIndex = 0;
        let instructionIndex = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lowerLine = line.toLowerCase();

            // Extract title (first non-empty line)
            if (!recipe.title && line.length > 3 && line.length < 100) {
                recipe.title = this.cleanTitle(line);
                continue;
            }

            // Detect time information
            const timeInfo = this.extractTime(line);
            if (timeInfo.prepTime) recipe.prepTime = timeInfo.prepTime;
            if (timeInfo.cookTime) recipe.cookTime = timeInfo.cookTime;
            if (timeInfo.totalTime) recipe.totalTime = timeInfo.totalTime;

            // Detect servings
            const servings = this.extractServings(line);
            if (servings) recipe.servings = servings;

            // Section detection
            if (this.isIngredientsHeader(lowerLine)) {
                section = 'ingredients';
                continue;
            }
            
            if (this.isInstructionsHeader(lowerLine)) {
                section = 'instructions';
                continue;
            }

            if (lowerLine.includes('note') && lowerLine.length < 20) {
                section = 'notes';
                continue;
            }

            // Parse based on current section
            if (section === 'ingredients') {
                const ingredient = this.parseIngredientLine(line);
                if (ingredient) {
                    recipe.ingredients.push({
                        raw: line,
                        ...ingredient,
                        order: ingredientIndex++
                    });
                }
            } else if (section === 'instructions') {
                const instruction = this.parseInstructionLine(line);
                if (instruction) {
                    recipe.instructions.push({
                        text: instruction,
                        stepNumber: instructionIndex++
                    });
                }
            } else if (section === 'notes') {
                recipe.notes += line + ' ';
            } else if (section === 'title' && !this.isIngredientsHeader(lowerLine) && !this.isInstructionsHeader(lowerLine)) {
                // Might be description
                if (line.length > 15 && !recipe.description) {
                    recipe.description = line;
                }
            }
        }

        // Clean up
        recipe.notes = recipe.notes.trim();
        
        // Check completeness
        recipe.isComplete = recipe.title && 
                           recipe.ingredients.length > 0 && 
                           recipe.instructions.length > 0;

        // Auto-categorize
        recipe.category = this.guessCategory(recipe.title, recipe.ingredients);
        
        // Generate tags
        recipe.tags = this.generateTags(recipe);

        return recipe;
    }

    /**
     * Check if line is ingredients header
     */
    isIngredientsHeader(lowerLine) {
        return lowerLine.includes('ingredient') || 
               lowerLine.includes('what you need') ||
               lowerLine === 'ingredients:' ||
               lowerLine === 'ingredients';
    }

    /**
     * Check if line is instructions header
     */
    isInstructionsHeader(lowerLine) {
        return lowerLine.includes('instruction') ||
               lowerLine.includes('direction') ||
               lowerLine.includes('method') ||
               lowerLine.includes('preparation') ||
               lowerLine.includes('steps') ||
               lowerLine === 'instructions:' ||
               lowerLine === 'directions:' ||
               lowerLine === 'method:';
    }

    /**
     * Clean title
     */
    cleanTitle(title) {
        return title
            .replace(/^Recipe:\s*/i, '')
            .replace(/^\d+\.\s*/, '')
            .replace(/^[-=*#]+\s*/, '')
            .replace(/\s*[-=*#]+$/, '')
            .trim();
    }

    /**
     * Parse ingredient line
     */
    parseIngredientLine(line) {
        // Remove bullets, numbers
        let cleaned = line.replace(/^[-•*○●◦▪→]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        
        if (!cleaned || cleaned.length < 2) return null;

        // Try to parse quantity and unit
        const parsed = this.parseIngredientDetails(cleaned);
        
        return {
            text: cleaned,
            quantity: parsed.quantity,
            unit: parsed.unit,
            ingredient: parsed.ingredient,
            preparation: parsed.preparation
        };
    }

    /**
     * Parse ingredient details (quantity, unit, name)
     */
    parseIngredientDetails(text) {
        const result = {
            quantity: null,
            unit: null,
            ingredient: text,
            preparation: null
        };

        // Pattern: "2 cups flour" or "1/2 cup milk"
        const pattern = /^(\d+(?:\/\d+)?(?:\.\d+)?)\s*([a-z]+)?\s+(.+)$/i;
        const match = text.match(pattern);

        if (match) {
            result.quantity = match[1];
            result.unit = match[2] || '';
            
            // Split on comma to get preparation
            const remaining = match[3];
            if (remaining.includes(',')) {
                const parts = remaining.split(',');
                result.ingredient = parts[0].trim();
                result.preparation = parts.slice(1).join(',').trim();
            } else {
                result.ingredient = remaining.trim();
            }
        }

        return result;
    }

    /**
     * Parse instruction line
     */
    parseInstructionLine(line) {
        // Remove bullets, numbers
        let cleaned = line.replace(/^[-•*○●◦▪→]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        
        if (!cleaned || cleaned.length < 5) return null;
        
        return cleaned;
    }

    /**
     * Extract time information
     */
    extractTime(line) {
        const result = {
            prepTime: null,
            cookTime: null,
            totalTime: null
        };

        const lowerLine = line.toLowerCase();

        // Prep time
        const prepMatch = lowerLine.match(/prep(?:\s+time)?:?\s*(\d+)\s*(min|hour|hr)/i);
        if (prepMatch) {
            result.prepTime = parseInt(prepMatch[1]) * (prepMatch[2].startsWith('h') ? 60 : 1);
        }

        // Cook time
        const cookMatch = lowerLine.match(/cook(?:\s+time)?:?\s*(\d+)\s*(min|hour|hr)/i);
        if (cookMatch) {
            result.cookTime = parseInt(cookMatch[1]) * (cookMatch[2].startsWith('h') ? 60 : 1);
        }

        // Total time
        const totalMatch = lowerLine.match(/total(?:\s+time)?:?\s*(\d+)\s*(min|hour|hr)/i);
        if (totalMatch) {
            result.totalTime = parseInt(totalMatch[1]) * (totalMatch[2].startsWith('h') ? 60 : 1);
        }

        return result;
    }

    /**
     * Extract servings
     */
    extractServings(line) {
        const lowerLine = line.toLowerCase();
        
        // Pattern: "Servings: 4" or "Serves 4" or "Yield: 4 servings"
        const patterns = [
            /servings?:?\s*(\d+)/,
            /serves?:?\s*(\d+)/,
            /yield:?\s*(\d+)/,
            /makes?:?\s*(\d+)/
        ];

        for (const pattern of patterns) {
            const match = lowerLine.match(pattern);
            if (match) {
                return parseInt(match[1]);
            }
        }

        return null;
    }

    /**
     * Guess recipe category
     */
    guessCategory(title, ingredients) {
        const text = (title + ' ' + ingredients.map(i => i.ingredient || '').join(' ')).toLowerCase();

        const categories = [
            { name: 'Appetizers', keywords: ['appetizer', 'starter', 'dip', 'spread', 'bruschetta'] },
            { name: 'Salads', keywords: ['salad', 'slaw', 'greens'] },
            { name: 'Soups', keywords: ['soup', 'stew', 'chowder', 'bisque', 'broth'] },
            { name: 'Pasta', keywords: ['pasta', 'spaghetti', 'linguine', 'noodle'] },
            { name: 'Seafood', keywords: ['fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'scallop'] },
            { name: 'Beef', keywords: ['beef', 'steak', 'burger', 'ribeye', 'sirloin'] },
            { name: 'Poultry', keywords: ['chicken', 'turkey', 'duck'] },
            { name: 'Pork', keywords: ['pork', 'bacon', 'ham', 'sausage'] },
            { name: 'Vegetarian', keywords: ['vegetarian', 'veggie', 'tofu', 'tempeh'] },
            { name: 'Desserts', keywords: ['dessert', 'cake', 'cookie', 'pie', 'tart', 'ice cream', 'chocolate'] },
            { name: 'Breads', keywords: ['bread', 'roll', 'biscuit', 'muffin', 'scone'] },
            { name: 'Breakfast', keywords: ['breakfast', 'pancake', 'waffle', 'omelet', 'eggs'] }
        ];

        for (const cat of categories) {
            if (cat.keywords.some(kw => text.includes(kw))) {
                return cat.name;
            }
        }

        return 'Main Dishes';
    }

    /**
     * Generate tags from recipe
     */
    generateTags(recipe) {
        const tags = [];
        const allText = (recipe.title + ' ' + recipe.description + ' ' + 
                        recipe.ingredients.map(i => i.ingredient || '').join(' ')).toLowerCase();

        // Dietary tags
        if (allText.includes('vegan')) tags.push('vegan');
        if (allText.includes('vegetarian')) tags.push('vegetarian');
        if (allText.includes('gluten free') || allText.includes('gluten-free')) tags.push('gluten-free');
        if (allText.includes('dairy free') || allText.includes('dairy-free')) tags.push('dairy-free');
        if (allText.includes('keto')) tags.push('keto');
        if (allText.includes('paleo')) tags.push('paleo');

        // Cooking methods
        if (allText.includes('grill')) tags.push('grilled');
        if (allText.includes('bake') || allText.includes('baked')) tags.push('baked');
        if (allText.includes('fry') || allText.includes('fried')) tags.push('fried');
        if (allText.includes('roast')) tags.push('roasted');
        if (allText.includes('slow cook')) tags.push('slow-cooked');

        // Time-based
        if (recipe.totalTime && recipe.totalTime <= 30) tags.push('quick');
        if (recipe.totalTime && recipe.totalTime >= 120) tags.push('slow');

        // Add category as tag
        if (recipe.category) tags.push(recipe.category.toLowerCase());

        return [...new Set(tags)];
    }

    /**
     * Parse a single recipe
     */
    parseRecipe(text, index) {
        // Use existing parser logic but return structured format
        const lines = text.split('\n').filter(l => l.trim());
        
        const recipe = {
            id: `recipe_${Date.now()}_${index}`,
            title: '',
            description: '',
            ingredients: [],
            instructions: [],
            servings: null,
            prepTime: null,
            cookTime: null,
            totalTime: null,
            cuisine: '',
            difficulty: 'Medium',
            category: '',
            tags: [],
            notes: '',
            source: 'Bulk Import',
            createdAt: new Date().toISOString(),
            isComplete: false,
            rawText: text
        };

        let section = 'title';
        let ingredientCount = 0;
        let instructionCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lowerLine = line.toLowerCase();

            // First substantial line is title
            if (!recipe.title && line.length > 3) {
                recipe.title = this.cleanTitle(line);
                continue;
            }

            // Extract metadata
            const timeInfo = this.extractTime(line);
            if (timeInfo.prepTime) recipe.prepTime = timeInfo.prepTime;
            if (timeInfo.cookTime) recipe.cookTime = timeInfo.cookTime;
            if (timeInfo.totalTime) recipe.totalTime = timeInfo.totalTime;

            const servings = this.extractServings(line);
            if (servings) recipe.servings = servings;

            // Section detection
            if (this.isIngredientsHeader(lowerLine)) {
                section = 'ingredients';
                continue;
            }
            
            if (this.isInstructionsHeader(lowerLine)) {
                section = 'instructions';
                continue;
            }

            // Parse content
            if (section === 'ingredients') {
                const ingredient = this.parseIngredientLine(line);
                if (ingredient) {
                    recipe.ingredients.push(ingredient);
                    ingredientCount++;
                }
            } else if (section === 'instructions') {
                const instruction = this.parseInstructionLine(line);
                if (instruction) {
                    recipe.instructions.push({
                        text: instruction,
                        stepNumber: instructionCount + 1
                    });
                    instructionCount++;
                }
            } else if (section === 'title' && recipe.title && !recipe.description && line.length > 15) {
                recipe.description = line;
            }
        }

        // Calculate total time if not provided
        if (!recipe.totalTime && recipe.prepTime && recipe.cookTime) {
            recipe.totalTime = recipe.prepTime + recipe.cookTime;
        }

        // Check completeness
        recipe.isComplete = !!(recipe.title && 
                              recipe.ingredients.length > 0 && 
                              recipe.instructions.length > 0);

        // Auto-categorize
        recipe.category = this.guessCategory(recipe.title, recipe.ingredients);
        
        // Generate tags
        recipe.tags = this.generateTags(recipe);

        return recipe;
    }

    /**
     * Calculate confidence score for detected recipe
     */
    scoreRecipe(recipe) {
        let score = 0;
        const issues = [];

        // Title (20 points)
        if (recipe.title && recipe.title.length > 5) {
            score += 20;
        } else {
            issues.push('Missing or weak title');
        }

        // Ingredients (30 points)
        if (recipe.ingredients.length >= 5) {
            score += 30;
        } else if (recipe.ingredients.length > 0) {
            score += recipe.ingredients.length * 6;
            issues.push('Few ingredients (less than 5)');
        } else {
            issues.push('No ingredients found');
        }

        // Instructions (30 points)
        if (recipe.instructions.length >= 3) {
            score += 30;
        } else if (recipe.instructions.length > 0) {
            score += recipe.instructions.length * 10;
            issues.push('Few instructions (less than 3)');
        } else {
            issues.push('No instructions found');
        }

        // Metadata (20 points)
        if (recipe.servings) score += 5;
        if (recipe.prepTime) score += 5;
        if (recipe.cookTime) score += 5;
        if (recipe.description) score += 5;

        return {
            score: Math.min(score, 100),
            isGood: score >= 70,
            isComplete: recipe.isComplete,
            issues: issues
        };
    }
}

// Export for use
window.MultiRecipeDetector = MultiRecipeDetector;
console.log('✅ Multi-Recipe Detector loaded');

