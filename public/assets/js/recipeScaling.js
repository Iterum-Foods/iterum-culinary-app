// Recipe Scaling System for Iterum R&D Chef Notebook
// Handles recipe scaling, unit conversions, and scaling history

class RecipeScaler {
    constructor() {
        this.originalIngredients = [];
        this.scaledIngredients = [];
        this.scalingHistory = [];
        this.currentScalingFactor = 1;
        this.originalServings = 0;
        this.targetServings = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadScalingHistory();
    }
    
    setupEventListeners() {
        // Scale recipe button
        const scaleBtn = document.getElementById('scale-recipe-btn');
        if (scaleBtn) {
            scaleBtn.addEventListener('click', () => this.scaleRecipe());
        }
        
        // Apply scaling button
        const applyBtn = document.getElementById('apply-scaling-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyScaling());
        }
        
        // Reset scaling button
        const resetBtn = document.getElementById('reset-scaling-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetToOriginal());
        }
        
        // Print scaled recipe button
        const printBtn = document.getElementById('print-scaled-recipe-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => this.printScaledRecipe());
        }
        
        // Target servings input
        const targetServings = document.getElementById('target-servings');
        if (targetServings) {
            targetServings.addEventListener('input', () => this.updateScalingPreview());
        }
    }
    
    // Load original recipe data for scaling
    loadRecipeForScaling(recipe) {
        this.originalIngredients = [...recipe.ingredients];
        this.originalServings = recipe.servings || 4;
        
        // Set original servings in the form
        const originalServingsInput = document.getElementById('original-servings');
        if (originalServingsInput) {
            originalServingsInput.value = this.originalServings;
        }
        
        // Set target servings to original (no scaling initially)
        const targetServingsInput = document.getElementById('target-servings');
        if (targetServingsInput) {
            targetServingsInput.value = this.originalServings;
        }
        
        // Hide scaling results initially
        this.hideScalingResults();
    }
    
    // Scale recipe based on target servings
    scaleRecipe() {
        const targetServingsInput = document.getElementById('target-servings');
        if (!targetServingsInput) return;
        
        this.targetServings = parseInt(targetServingsInput.value);
        
        if (!this.targetServings || this.targetServings < 1) {
            this.showNotification('Please enter a valid number of servings', 'error');
            return;
        }
        
        if (this.targetServings === this.originalServings) {
            this.showNotification('Target servings same as original - no scaling needed', 'info');
            return;
        }
        
        this.currentScalingFactor = this.targetServings / this.originalServings;
        this.scaledIngredients = this.scaleIngredients(this.originalIngredients, this.currentScalingFactor);
        
        this.displayScalingResults();
        this.saveScalingHistory();
    }
    
    // Scale ingredients with intelligent unit handling
    scaleIngredients(ingredients, scalingFactor) {
        return ingredients.map(ingredient => {
            const scaled = { ...ingredient };
            
            // Scale the quantity
            const originalQuantity = parseFloat(ingredient.amount || ingredient.quantity || 0);
            let scaledQuantity = originalQuantity * scalingFactor;
            
            // Handle unit conversions for common cases
            const unit = ingredient.unit || '';
            const converted = this.convertUnits(scaledQuantity, unit);
            
            scaled.scaledQuantity = converted.quantity;
            scaled.scaledUnit = converted.unit;
            scaled.originalQuantity = originalQuantity;
            scaled.originalUnit = unit;
            scaled.scalingFactor = scalingFactor;
            
            return scaled;
        });
    }
    
    // Convert units to more practical measurements
    convertUnits(quantity, unit) {
        const conversions = {
            // Weight conversions
            'g': (qty) => {
                if (qty >= 1000) return { quantity: (qty / 1000).toFixed(2), unit: 'kg' };
                if (qty >= 453.592) return { quantity: (qty / 453.592).toFixed(2), unit: 'lb' };
                return { quantity: qty.toFixed(1), unit: 'g' };
            },
            'kg': (qty) => {
                if (qty >= 2.20462) return { quantity: (qty * 2.20462).toFixed(2), unit: 'lb' };
                return { quantity: qty.toFixed(2), unit: 'kg' };
            },
            'lb': (qty) => {
                if (qty >= 16) return { quantity: (qty / 16).toFixed(2), unit: 'oz' };
                return { quantity: qty.toFixed(2), unit: 'lb' };
            },
            
            // Volume conversions
            'ml': (qty) => {
                if (qty >= 1000) return { quantity: (qty / 1000).toFixed(2), unit: 'L' };
                if (qty >= 236.588) return { quantity: (qty / 236.588).toFixed(2), unit: 'cup' };
                if (qty >= 14.7868) return { quantity: (qty / 14.7868).toFixed(2), unit: 'tbsp' };
                if (qty >= 4.92892) return { quantity: (qty / 4.92892).toFixed(2), unit: 'tsp' };
                return { quantity: qty.toFixed(1), unit: 'ml' };
            },
            'L': (qty) => {
                if (qty >= 4.22675) return { quantity: (qty * 4.22675).toFixed(2), unit: 'cup' };
                return { quantity: qty.toFixed(2), unit: 'L' };
            },
            'cup': (qty) => {
                if (qty >= 16) return { quantity: (qty * 16).toFixed(2), unit: 'tbsp' };
                if (qty >= 48) return { quantity: (qty * 48).toFixed(2), unit: 'tsp' };
                return { quantity: qty.toFixed(2), unit: 'cup' };
            },
            'tbsp': (qty) => {
                if (qty >= 3) return { quantity: (qty / 3).toFixed(2), unit: 'tbsp' };
                return { quantity: qty.toFixed(1), unit: 'tbsp' };
            },
            'tsp': (qty) => {
                if (qty >= 3) return { quantity: (qty / 3).toFixed(2), unit: 'tbsp' };
                return { quantity: qty.toFixed(1), unit: 'tsp' };
            }
        };
        
        const converter = conversions[unit.toLowerCase()];
        if (converter) {
            return converter(quantity);
        }
        
        // Default: just scale the quantity
        return { quantity: quantity.toFixed(2), unit: unit };
    }
    
    // Display scaling results
    displayScalingResults() {
        const resultsDiv = document.getElementById('scaling-results');
        const ingredientsList = document.getElementById('scaled-ingredients-list');
        
        if (!resultsDiv || !ingredientsList) return;
        
        // Show results container
        resultsDiv.classList.remove('hidden');
        
        // Display scaled ingredients
        ingredientsList.innerHTML = '';
        
        this.scaledIngredients.forEach(ingredient => {
            const ingredientDiv = document.createElement('div');
            ingredientDiv.className = 'flex justify-between items-center p-2 bg-gray-50 rounded';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'font-medium text-gray-800';
            nameSpan.textContent = ingredient.name;
            
            const quantitySpan = document.createElement('span');
            quantitySpan.className = 'text-sm text-gray-600';
            
            if (ingredient.scaledQuantity !== ingredient.originalQuantity) {
                quantitySpan.innerHTML = `
                    <span class="line-through text-gray-400">${ingredient.originalQuantity} ${ingredient.originalUnit}</span>
                    <span class="ml-2 font-semibold text-green-600">→ ${ingredient.scaledQuantity} ${ingredient.scaledUnit}</span>
                `;
            } else {
                quantitySpan.textContent = `${ingredient.scaledQuantity} ${ingredient.scaledUnit}`;
            }
            
            ingredientDiv.appendChild(nameSpan);
            ingredientDiv.appendChild(quantitySpan);
            ingredientsList.appendChild(ingredientDiv);
        });
        
        // Add scaling summary
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400';
        summaryDiv.innerHTML = `
            <p class="text-sm text-blue-800">
                <strong>Scaling Factor:</strong> ${this.currentScalingFactor.toFixed(2)}x 
                (${this.originalServings} → ${this.targetServings} servings)
            </p>
        `;
        ingredientsList.appendChild(summaryDiv);
    }
    
    // Apply scaling to the current recipe form
    applyScaling() {
        if (!this.scaledIngredients.length) {
            this.showNotification('No scaling to apply', 'error');
            return;
        }
        
        // Update the ingredients in the form
        this.updateRecipeFormWithScaledIngredients();
        
        // Update servings in the form
        const servingsInput = document.getElementById('recipe-servings');
        if (servingsInput) {
            servingsInput.value = this.targetServings;
        }
        
        this.showNotification(`Recipe scaled to ${this.targetServings} servings!`, 'success');
        this.hideScalingResults();
    }
    
    // Update recipe form with scaled ingredients
    updateRecipeFormWithScaledIngredients() {
        const ingredientsContainer = document.getElementById('ingredients-container');
        if (!ingredientsContainer) return;
        
        // Clear existing ingredients
        ingredientsContainer.innerHTML = '';
        
        // Add scaled ingredients
        this.scaledIngredients.forEach((ingredient, index) => {
            this.addIngredientToForm(ingredient, index);
        });
    }
    
    // Add ingredient to the recipe form
    addIngredientToForm(ingredient, index) {
        const container = document.getElementById('ingredients-container');
        if (!container) return;
        
        const ingredientDiv = document.createElement('div');
        ingredientDiv.className = 'flex gap-2 mb-2';
        ingredientDiv.innerHTML = `
            <input type="text" placeholder="Ingredient name" value="${ingredient.name}" class="notebook-input flex-1">
            <input type="number" placeholder="Amount" value="${ingredient.scaledQuantity}" step="0.01" min="0" class="notebook-input w-24">
            <select class="notebook-input w-24">
                <option value="">Unit</option>
                <option value="g" ${ingredient.scaledUnit === 'g' ? 'selected' : ''}>g</option>
                <option value="kg" ${ingredient.scaledUnit === 'kg' ? 'selected' : ''}>kg</option>
                <option value="ml" ${ingredient.scaledUnit === 'ml' ? 'selected' : ''}>ml</option>
                <option value="L" ${ingredient.scaledUnit === 'L' ? 'selected' : ''}>L</option>
                <option value="cup" ${ingredient.scaledUnit === 'cup' ? 'selected' : ''}>cup</option>
                <option value="tbsp" ${ingredient.scaledUnit === 'tbsp' ? 'selected' : ''}>tbsp</option>
                <option value="tsp" ${ingredient.scaledUnit === 'tsp' ? 'selected' : ''}>tsp</option>
                <option value="each" ${ingredient.scaledUnit === 'each' ? 'selected' : ''}>each</option>
                <option value="lb" ${ingredient.scaledUnit === 'lb' ? 'selected' : ''}>lb</option>
                <option value="oz" ${ingredient.scaledUnit === 'oz' ? 'selected' : ''}>oz</option>
            </select>
            <button type="button" class="remove-ingredient bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm">×</button>
        `;
        
        container.appendChild(ingredientDiv);
        
        // Add event listener to remove button
        const removeBtn = ingredientDiv.querySelector('.remove-ingredient');
        removeBtn.addEventListener('click', () => {
            ingredientDiv.remove();
        });
    }
    
    // Reset to original recipe
    resetToOriginal() {
        this.scaledIngredients = [];
        this.currentScalingFactor = 1;
        
        // Reset target servings to original
        const targetServingsInput = document.getElementById('target-servings');
        if (targetServingsInput) {
            targetServingsInput.value = this.originalServings;
        }
        
        // Restore original ingredients
        this.updateRecipeFormWithOriginalIngredients();
        
        this.hideScalingResults();
        this.showNotification('Recipe reset to original quantities', 'info');
    }
    
    // Update recipe form with original ingredients
    updateRecipeFormWithOriginalIngredients() {
        const ingredientsContainer = document.getElementById('ingredients-container');
        if (!ingredientsContainer) return;
        
        // Clear existing ingredients
        ingredientsContainer.innerHTML = '';
        
        // Add original ingredients
        this.originalIngredients.forEach((ingredient, index) => {
            this.addIngredientToForm(ingredient, index);
        });
    }
    
    // Print scaled recipe
    printScaledRecipe() {
        if (!this.scaledIngredients.length) {
            this.showNotification('No scaled recipe to print', 'error');
            return;
        }
        
        const recipeTitle = document.getElementById('recipe-title')?.value || 'Scaled Recipe';
        const recipeDescription = document.getElementById('recipe-description')?.value || '';
        
        const printContent = this.generatePrintContent(recipeTitle, recipeDescription);
        
        // Create print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }
    
    // Generate print content for scaled recipe
    generatePrintContent(title, description) {
        const ingredientsList = this.scaledIngredients.map(ing => 
            `<li>${ing.scaledQuantity} ${ing.scaledUnit} ${ing.name}</li>`
        ).join('');
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title} - Scaled Recipe</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .scaling-info { background: #f0f8ff; padding: 10px; margin: 20px 0; border-radius: 5px; }
                    .ingredients { margin: 20px 0; }
                    .ingredients ul { list-style: none; padding: 0; }
                    .ingredients li { padding: 5px 0; border-bottom: 1px solid #eee; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${title}</h1>
                    <p>${description}</p>
                </div>
                
                <div class="scaling-info">
                    <h3>Recipe Scaling Information</h3>
                    <p><strong>Original Servings:</strong> ${this.originalServings}</p>
                    <p><strong>Scaled Servings:</strong> ${this.targetServings}</p>
                    <p><strong>Scaling Factor:</strong> ${this.currentScalingFactor.toFixed(2)}x</p>
                    <p><strong>Scaled on:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                
                <div class="ingredients">
                    <h3>Scaled Ingredients</h3>
                    <ul>${ingredientsList}</ul>
                </div>
            </body>
            </html>
        `;
    }
    
    // Hide scaling results
    hideScalingResults() {
        const resultsDiv = document.getElementById('scaling-results');
        if (resultsDiv) {
            resultsDiv.classList.add('hidden');
        }
    }
    
    // Update scaling preview as user types
    updateScalingPreview() {
        const targetServingsInput = document.getElementById('target-servings');
        if (!targetServingsInput) return;
        
        const targetServings = parseInt(targetServingsInput.value);
        if (targetServings && targetServings !== this.originalServings) {
            // Show a preview of what the scaling would look like
            const scalingFactor = targetServings / this.originalServings;
            const previewText = `Scaling factor: ${scalingFactor.toFixed(2)}x`;
            
            // You could add a small preview indicator here
        }
    }
    
    // Save scaling history
    saveScalingHistory() {
        const scalingRecord = {
            timestamp: new Date().toISOString(),
            originalServings: this.originalServings,
            targetServings: this.targetServings,
            scalingFactor: this.currentScalingFactor,
            recipeTitle: document.getElementById('recipe-title')?.value || 'Unknown Recipe'
        };
        
        this.scalingHistory.push(scalingRecord);
        
        // Keep only last 50 scaling records
        if (this.scalingHistory.length > 50) {
            this.scalingHistory = this.scalingHistory.slice(-50);
        }
        
        // Save to localStorage
        localStorage.setItem('recipe_scaling_history', JSON.stringify(this.scalingHistory));
    }
    
    // Load scaling history
    loadScalingHistory() {
        const history = localStorage.getItem('recipe_scaling_history');
        if (history) {
            this.scalingHistory = JSON.parse(history);
        }
    }
    
    // Get scaling history
    getScalingHistory() {
        return this.scalingHistory;
    }
    
    // Show notification
    showNotification(message, type = 'info') {
        // Simple notification - you can enhance this
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // You could integrate with your existing notification system
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize recipe scaler when DOM is loaded
let recipeScaler;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        recipeScaler = new RecipeScaler();
    });
} else {
    recipeScaler = new RecipeScaler();
}

// Export for use in other scripts
window.RecipeScaler = RecipeScaler;
window.recipeScaler = recipeScaler; 