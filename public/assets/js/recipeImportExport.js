// Recipe Import/Export Utility for Iterum R&D Chef Notebook
// Handles importing and exporting recipes in various formats

class RecipeImportExport {
    constructor() {
        this.supportedFormats = {
            'json': { name: 'JSON', extension: '.json', mimeType: 'application/json' },
            'csv': { name: 'CSV', extension: '.csv', mimeType: 'text/csv' },
            'txt': { name: 'Text', extension: '.txt', mimeType: 'text/plain' }
        };
    }
    
    // Export recipes to various formats
    async exportRecipes(recipes, format = 'json', filename = null) {
        try {
            let content, mimeType, extension;
            
            switch (format.toLowerCase()) {
                case 'json':
                    content = this.exportToJSON(recipes);
                    mimeType = this.supportedFormats.json.mimeType;
                    extension = this.supportedFormats.json.extension;
                    break;
                    
                case 'csv':
                    content = this.exportToCSV(recipes);
                    mimeType = this.supportedFormats.csv.mimeType;
                    extension = this.supportedFormats.csv.extension;
                    break;
                    
                case 'txt':
                    content = this.exportToText(recipes);
                    mimeType = this.supportedFormats.txt.mimeType;
                    extension = this.supportedFormats.txt.extension;
                    break;
                    
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
            
            // Generate filename if not provided
            if (!filename) {
                const date = new Date().toISOString().split('T')[0];
                filename = `recipe-library-${date}${extension}`;
            }
            
            // Create and download file
            this.downloadFile(content, filename, mimeType);
            
            return { success: true, filename, format };
            
        } catch (error) {
            console.error('Export error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Export to JSON format
    exportToJSON(recipes) {
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            totalRecipes: recipes.length,
            recipes: recipes.map(recipe => ({
                id: recipe.id,
                name: recipe.name,
                description: recipe.description,
                category: recipe.category,
                cuisine: recipe.cuisine,
                servings: recipe.servings,
                prep_time: recipe.prep_time,
                cook_time: recipe.cook_time,
                difficulty: recipe.difficulty,
                tags: recipe.tags,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                created_at: recipe.created_at,
                updated_at: recipe.updated_at
            }))
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    // Export to CSV format
    exportToCSV(recipes) {
        const headers = [
            'Name', 'Description', 'Category', 'Cuisine', 'Servings', 
            'Prep Time', 'Cook Time', 'Difficulty', 'Tags', 
            'Ingredients', 'Instructions', 'Created At'
        ];
        
        const rows = recipes.map(recipe => [
            recipe.name,
            recipe.description,
            recipe.category,
            recipe.cuisine,
            recipe.servings,
            recipe.prep_time,
            recipe.cook_time,
            recipe.difficulty,
            recipe.tags.join(';'),
            recipe.ingredients.map(i => `${i.amount} ${i.unit} ${i.name}`).join(';'),
            recipe.instructions.join('|'),
            recipe.created_at
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        
        return csvContent;
    }
    
    // Export to text format
    exportToText(recipes) {
        let textContent = `Recipe Library Export\n`;
        textContent += `Generated: ${new Date().toLocaleString()}\n`;
        textContent += `Total Recipes: ${recipes.length}\n\n`;
        textContent += '='.repeat(50) + '\n\n';
        
        recipes.forEach((recipe, index) => {
            textContent += `${index + 1}. ${recipe.name}\n`;
            textContent += `Category: ${recipe.category}\n`;
            textContent += `Cuisine: ${recipe.cuisine}\n`;
            textContent += `Servings: ${recipe.servings}\n`;
            textContent += `Prep Time: ${recipe.prep_time} min\n`;
            textContent += `Cook Time: ${recipe.cook_time} min\n`;
            textContent += `Difficulty: ${recipe.difficulty}\n`;
            textContent += `Tags: ${recipe.tags.join(', ')}\n\n`;
            
            textContent += `Description:\n${recipe.description}\n\n`;
            
            textContent += `Ingredients:\n`;
            recipe.ingredients.forEach(ingredient => {
                textContent += `- ${ingredient.amount} ${ingredient.unit} ${ingredient.name}\n`;
            });
            textContent += `\n`;
            
            textContent += `Instructions:\n`;
            recipe.instructions.forEach((instruction, i) => {
                textContent += `${i + 1}. ${instruction}\n`;
            });
            textContent += `\n`;
            
            textContent += '-'.repeat(50) + '\n\n';
        });
        
        return textContent;
    }
    
    // Import recipes from various formats
    async importRecipes(file) {
        try {
            const content = await this.readFile(file);
            const filename = file.name.toLowerCase();
            
            let recipes = [];
            
            if (filename.endsWith('.json')) {
                recipes = this.importFromJSON(content);
            } else if (filename.endsWith('.csv')) {
                recipes = this.importFromCSV(content);
            } else if (filename.endsWith('.txt')) {
                recipes = this.importFromText(content);
            } else {
                throw new Error('Unsupported file format');
            }
            
            return { success: true, recipes, count: recipes.length };
            
        } catch (error) {
            console.error('Import error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Import from JSON format
    importFromJSON(content) {
        const data = JSON.parse(content);
        
        if (data.recipes && Array.isArray(data.recipes)) {
            return data.recipes.map(recipe => ({
                id: recipe.id || Date.now() + Math.random(),
                name: recipe.name || 'Imported Recipe',
                description: recipe.description || '',
                category: recipe.category || 'Imported',
                cuisine: recipe.cuisine || 'Unknown',
                servings: recipe.servings || 4,
                prep_time: recipe.prep_time || 0,
                cook_time: recipe.cook_time || 0,
                difficulty: recipe.difficulty || 'Medium',
                tags: recipe.tags || ['Imported'],
                ingredients: recipe.ingredients || [],
                instructions: recipe.instructions || [],
                created_at: recipe.created_at || new Date().toISOString(),
                updated_at: recipe.updated_at || new Date().toISOString()
            }));
        }
        
        throw new Error('Invalid JSON format: missing recipes array');
    }
    
    // Import from CSV format
    importFromCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV file must have at least a header and one data row');
        }
        
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const recipes = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            const recipe = {};
            
            headers.forEach((header, index) => {
                const value = values[index] || '';
                
                switch (header.toLowerCase()) {
                    case 'name':
                        recipe.name = value;
                        break;
                    case 'description':
                        recipe.description = value;
                        break;
                    case 'category':
                        recipe.category = value;
                        break;
                    case 'cuisine':
                        recipe.cuisine = value;
                        break;
                    case 'servings':
                        recipe.servings = parseInt(value) || 4;
                        break;
                    case 'prep time':
                        recipe.prep_time = parseInt(value) || 0;
                        break;
                    case 'cook time':
                        recipe.cook_time = parseInt(value) || 0;
                        break;
                    case 'difficulty':
                        recipe.difficulty = value;
                        break;
                    case 'tags':
                        recipe.tags = value.split(';').filter(t => t.trim());
                        break;
                    case 'ingredients':
                        recipe.ingredients = this.parseIngredientsFromCSV(value);
                        break;
                    case 'instructions':
                        recipe.instructions = value.split('|').filter(i => i.trim());
                        break;
                }
            });
            
            // Set defaults
            recipe.id = Date.now() + Math.random();
            recipe.name = recipe.name || 'Imported Recipe';
            recipe.category = recipe.category || 'Imported';
            recipe.cuisine = recipe.cuisine || 'Unknown';
            recipe.servings = recipe.servings || 4;
            recipe.prep_time = recipe.prep_time || 0;
            recipe.cook_time = recipe.cook_time || 0;
            recipe.difficulty = recipe.difficulty || 'Medium';
            recipe.tags = recipe.tags || ['Imported'];
            recipe.ingredients = recipe.ingredients || [];
            recipe.instructions = recipe.instructions || [];
            recipe.created_at = new Date().toISOString();
            recipe.updated_at = new Date().toISOString();
            
            recipes.push(recipe);
        }
        
        return recipes;
    }
    
    // Import from text format
    importFromText(content) {
        const recipes = [];
        const sections = content.split(/-{50}/);
        
        sections.forEach(section => {
            if (!section.trim()) return;
            
            const recipe = this.parseRecipeFromText(section);
            if (recipe.name) {
                recipes.push(recipe);
            }
        });
        
        return recipes;
    }
    
    // Parse recipe from text section
    parseRecipeFromText(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const recipe = {
            id: Date.now() + Math.random(),
            name: '',
            description: '',
            category: 'Imported',
            cuisine: 'Unknown',
            servings: 4,
            prep_time: 0,
            cook_time: 0,
            difficulty: 'Medium',
            tags: ['Imported'],
            ingredients: [],
            instructions: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        let currentSection = '';
        
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            
            if (line.match(/^\d+\.\s/)) {
                // Recipe title
                recipe.name = line.replace(/^\d+\.\s/, '');
            } else if (line.startsWith('Category:')) {
                recipe.category = line.replace('Category:', '').trim();
            } else if (line.startsWith('Cuisine:')) {
                recipe.cuisine = line.replace('Cuisine:', '').trim();
            } else if (line.startsWith('Servings:')) {
                recipe.servings = parseInt(line.replace('Servings:', '').trim()) || 4;
            } else if (line.startsWith('Prep Time:')) {
                recipe.prep_time = parseInt(line.replace('Prep Time:', '').replace('min', '').trim()) || 0;
            } else if (line.startsWith('Cook Time:')) {
                recipe.cook_time = parseInt(line.replace('Cook Time:', '').replace('min', '').trim()) || 0;
            } else if (line.startsWith('Difficulty:')) {
                recipe.difficulty = line.replace('Difficulty:', '').trim();
            } else if (line.startsWith('Tags:')) {
                recipe.tags = line.replace('Tags:', '').split(',').map(t => t.trim()).filter(t => t);
            } else if (line === 'Description:') {
                currentSection = 'description';
            } else if (line === 'Ingredients:') {
                currentSection = 'ingredients';
            } else if (line === 'Instructions:') {
                currentSection = 'instructions';
            } else if (line.startsWith('- ') && currentSection === 'ingredients') {
                // Parse ingredient line
                const ingredientText = line.replace('- ', '');
                const ingredient = this.parseIngredientFromText(ingredientText);
                recipe.ingredients.push(ingredient);
            } else if (line.match(/^\d+\.\s/) && currentSection === 'instructions') {
                // Parse instruction line
                const instruction = line.replace(/^\d+\.\s/, '');
                recipe.instructions.push(instruction);
            } else if (currentSection === 'description') {
                recipe.description += line + ' ';
            }
        }
        
        recipe.description = recipe.description.trim();
        return recipe;
    }
    
    // Parse ingredient from text
    parseIngredientFromText(text) {
        // Try to parse "amount unit name" format
        const match = text.match(/^(\d+(?:\.\d+)?)\s+(\w+)\s+(.+)$/);
        if (match) {
            return {
                amount: parseFloat(match[1]),
                unit: match[2],
                name: match[3]
            };
        }
        
        // Fallback to just the name
        return {
            amount: 0,
            unit: '',
            name: text
        };
    }
    
    // Parse ingredients from CSV
    parseIngredientsFromCSV(text) {
        if (!text) return [];
        
        return text.split(';').map(ingredientText => {
            const match = ingredientText.match(/^(\d+(?:\.\d+)?)\s+(\w+)\s+(.+)$/);
            if (match) {
                return {
                    amount: parseFloat(match[1]),
                    unit: match[2],
                    name: match[3]
                };
            }
            return {
                amount: 0,
                unit: '',
                name: ingredientText.trim()
            };
        });
    }
    
    // Parse CSV line (handles quoted values)
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    }
    
    // Read file content
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
    
    // Download file
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
    
    // Get supported formats
    getSupportedFormats() {
        return this.supportedFormats;
    }
    
    // Validate recipe data
    validateRecipe(recipe) {
        const errors = [];
        
        if (!recipe.name || recipe.name.trim() === '') {
            errors.push('Recipe name is required');
        }
        
        if (!recipe.ingredients || recipe.ingredients.length === 0) {
            errors.push('At least one ingredient is required');
        }
        
        if (!recipe.instructions || recipe.instructions.length === 0) {
            errors.push('At least one instruction is required');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    // Clean recipe data
    cleanRecipe(recipe) {
        return {
            ...recipe,
            name: recipe.name?.trim() || 'Untitled Recipe',
            description: recipe.description?.trim() || '',
            category: recipe.category?.trim() || 'Uncategorized',
            cuisine: recipe.cuisine?.trim() || 'Unknown',
            servings: Math.max(1, parseInt(recipe.servings) || 4),
            prep_time: Math.max(0, parseInt(recipe.prep_time) || 0),
            cook_time: Math.max(0, parseInt(recipe.cook_time) || 0),
            difficulty: recipe.difficulty || 'Medium',
            tags: Array.isArray(recipe.tags) ? recipe.tags.filter(t => t.trim()) : ['Imported'],
            ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.filter(i => i.name?.trim()) : [],
            instructions: Array.isArray(recipe.instructions) ? recipe.instructions.filter(i => i.trim()) : []
        };
    }
}

// Export for use in other scripts
window.RecipeImportExport = RecipeImportExport; 