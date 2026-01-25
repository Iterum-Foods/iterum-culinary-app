/**
 * Quick Dish Creator for Menu Builder
 * Provides inline recipe creation within the menu builder workflow
 */

class QuickDishCreator {
    constructor() {
        this.currentDish = null;
        this.ingredients = [];
        this.instructions = [];
        this.templates = this.loadDishTemplates();
        this.ingredientSuggestions = this.loadIngredientSuggestions();
        this.init();
    }

    /**
     * Initialize the Quick Dish Creator
     */
    init() {
        console.log('🍽️ Initializing Quick Dish Creator...');
        this.setupEventListeners();
    }

    /**
     * Show the Quick Dish Creator modal
     */
    showCreator(dishData = null) {
        console.log('🎨 Showing Quick Dish Creator...');
        
        // If dishData provided, we're editing an existing dish idea
        this.currentDish = dishData || {
            name: '',
            category: '',
            price: null,
            description: '',
            ingredients: [],
            instructions: [],
            prepTime: null,
            cookTime: null,
            servings: 4,
            difficulty: 'medium',
            cuisine: '',
            tags: []
        };

        this.renderCreatorModal();
        this.loadDishData();
    }

    /**
     * Render the Quick Dish Creator modal
     */
    renderCreatorModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'quick-dish-creator-modal';
        
        modal.innerHTML = `
            <div class="modal-content modal-extra-large">
                <div class="modal-header">
                    <h3>🎨 Quick Dish Creator</h3>
                    <span class="modal-close" onclick="quickDishCreator.closeCreator()">&times;</span>
                </div>
                
                <div class="modal-body">
                    <div class="dish-creator-container">
                        <!-- Basic Information -->
                        <div class="creator-section">
                            <h4 class="section-title">📝 Basic Information</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="dish-name">Dish Name *</label>
                                    <input type="text" id="dish-name" placeholder="Enter dish name..." 
                                           oninput="quickDishCreator.handleDishNameChange()">
                                    <div class="suggestions" id="dish-name-suggestions"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="dish-category">Category *</label>
                                    <select id="dish-category" onchange="quickDishCreator.handleCategoryChange()">
                                        <option value="">Select category...</option>
                                        <option value="appetizer">Appetizer</option>
                                        <option value="soup">Soup</option>
                                        <option value="salad">Salad</option>
                                        <option value="main">Main Course</option>
                                        <option value="side">Side Dish</option>
                                        <option value="dessert">Dessert</option>
                                        <option value="beverage">Beverage</option>
                                        <option value="prep-recipe">Prep Recipe</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="dish-price">Price ($)</label>
                                    <input type="number" id="dish-price" step="0.01" min="0" 
                                           placeholder="0.00" oninput="quickDishCreator.handlePriceChange()">
                                </div>
                                
                                <div class="form-group">
                                    <label for="dish-servings">Servings</label>
                                    <input type="number" id="dish-servings" min="1" value="4" 
                                           oninput="quickDishCreator.handleServingsChange()">
                                </div>
                                
                                <div class="form-group full-width">
                                    <label for="dish-description">Description</label>
                                    <textarea id="dish-description" rows="3" 
                                              placeholder="Brief description of the dish..."></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Recipe Builder (Collapsible) -->
                        <div class="creator-section">
                            <div class="section-header" onclick="quickDishCreator.toggleRecipeBuilder()">
                                <h4 class="section-title">🍳 Quick Recipe Builder</h4>
                                <span class="toggle-icon" id="recipe-toggle-icon">▼</span>
                            </div>
                            
                            <div class="recipe-builder" id="recipe-builder" style="display: none;">
                                <!-- Cuisine & Difficulty -->
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="dish-cuisine">Cuisine</label>
                                        <select id="dish-cuisine">
                                            <option value="">Select cuisine...</option>
                                            <option value="italian">Italian</option>
                                            <option value="asian">Asian</option>
                                            <option value="mexican">Mexican</option>
                                            <option value="american">American</option>
                                            <option value="french">French</option>
                                            <option value="indian">Indian</option>
                                            <option value="mediterranean">Mediterranean</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="dish-difficulty">Difficulty</label>
                                        <select id="dish-difficulty">
                                            <option value="easy">Easy</option>
                                            <option value="medium" selected>Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="dish-prep-time">Prep Time (min)</label>
                                        <input type="number" id="dish-prep-time" min="0" placeholder="15">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="dish-cook-time">Cook Time (min)</label>
                                        <input type="number" id="dish-cook-time" min="0" placeholder="30">
                                    </div>
                                </div>

                                <!-- Ingredients Section -->
                                <div class="ingredients-section">
                                    <div class="section-header">
                                        <h5>🥘 Ingredients</h5>
                                        <button type="button" class="btn btn-sm btn-primary" 
                                                onclick="quickDishCreator.addIngredient()">
                                            + Add Ingredient
                                        </button>
                                    </div>
                                    
                                    <div class="ingredients-list" id="ingredients-list">
                                        <!-- Ingredients will be added here -->
                                    </div>
                                    
                                    <!-- Smart Suggestions -->
                                    <div class="smart-suggestions" id="ingredient-suggestions" style="display: none;">
                                        <h6>💡 Smart Suggestions</h6>
                                        <div class="suggestions-list" id="ingredient-suggestions-list"></div>
                                    </div>
                                </div>

                                <!-- Instructions Section -->
                                <div class="instructions-section">
                                    <div class="section-header">
                                        <h5>📋 Instructions</h5>
                                        <button type="button" class="btn btn-sm btn-primary" 
                                                onclick="quickDishCreator.addInstruction()">
                                            + Add Step
                                        </button>
                                    </div>
                                    
                                    <div class="instructions-list" id="instructions-list">
                                        <!-- Instructions will be added here -->
                                    </div>
                                </div>

                                <!-- Quick Actions -->
                                <div class="quick-actions">
                                    <button type="button" class="btn btn-secondary" 
                                            onclick="quickDishCreator.generateFromTemplate()">
                                        📋 Use Template
                                    </button>
                                    <button type="button" class="btn btn-secondary" 
                                            onclick="quickDishCreator.autoGenerateInstructions()">
                                        🤖 Auto-Generate Instructions
                                    </button>
                                    <button type="button" class="btn btn-secondary" 
                                            onclick="quickDishCreator.calculateNutrition()">
                                        🧮 Calculate Nutrition
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Cost Analysis -->
                        <div class="creator-section" id="cost-analysis-section" style="display: none;">
                            <h4 class="section-title">💰 Cost Analysis</h4>
                            <div class="cost-analysis" id="cost-analysis">
                                <div class="cost-item">
                                    <span>Ingredient Cost:</span>
                                    <span id="ingredient-cost">$0.00</span>
                                </div>
                                <div class="cost-item">
                                    <span>Labor Cost:</span>
                                    <span id="labor-cost">$0.00</span>
                                </div>
                                <div class="cost-item total">
                                    <span>Total Cost:</span>
                                    <span id="total-cost">$0.00</span>
                                </div>
                                <div class="cost-item">
                                    <span>Suggested Price:</span>
                                    <span id="suggested-price">$0.00</span>
                                </div>
                                <div class="cost-item">
                                    <span>Profit Margin:</span>
                                    <span id="profit-margin">0%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <div class="footer-left">
                        <button class="btn btn-secondary" onclick="quickDishCreator.saveAsTemplate()">
                            💾 Save as Template
                        </button>
                    </div>
                    <div class="footer-right">
                        <button class="btn btn-secondary" onclick="quickDishCreator.closeCreator()">
                            Cancel
                        </button>
                        <button class="btn btn-primary" onclick="quickDishCreator.saveAndAddToMenu()">
                            ✅ Add to Menu
                        </button>
                        <button class="btn btn-success" onclick="quickDishCreator.saveAsRecipe()">
                            📚 Save as Recipe
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.addCreatorStyles();
        this.initializeCreator();
    }

    /**
     * Add styles for the Quick Dish Creator
     */
    addCreatorStyles() {
        if (document.getElementById('quick-dish-creator-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'quick-dish-creator-styles';
        styles.textContent = `
            .modal-extra-large {
                max-width: 900px;
                width: 95%;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .dish-creator-container {
                display: flex;
                flex-direction: column;
                gap: 24px;
            }
            
            .creator-section {
                background: #f8fafc;
                border-radius: 12px;
                padding: 20px;
                border: 1px solid #e2e8f0;
            }
            
            .section-title {
                margin: 0 0 16px 0;
                color: #1e293b;
                font-size: 18px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
                padding: 8px 0;
            }
            
            .section-header:hover {
                background: rgba(59, 130, 246, 0.05);
                border-radius: 6px;
                padding: 8px 12px;
                margin: -8px -12px;
            }
            
            .toggle-icon {
                font-size: 12px;
                transition: transform 0.3s ease;
            }
            
            .toggle-icon.rotated {
                transform: rotate(-90deg);
            }
            
            .form-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }
            
            .form-group.full-width {
                grid-column: 1 / -1;
            }
            
            .form-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 16px;
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                color: #374151;
                font-size: 14px;
            }
            
            .form-group input,
            .form-group select,
            .form-group textarea {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                transition: all 0.3s ease;
                background: white;
            }
            
            .form-group input:focus,
            .form-group select:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .suggestions {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #e5e7eb;
                border-top: none;
                border-radius: 0 0 8px 8px;
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .suggestion-item {
                padding: 10px 12px;
                cursor: pointer;
                border-bottom: 1px solid #f3f4f6;
                transition: background-color 0.2s ease;
            }
            
            .suggestion-item:hover {
                background: #f8fafc;
            }
            
            .suggestion-item:last-child {
                border-bottom: none;
            }
            
            .ingredient-item,
            .instruction-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                margin-bottom: 8px;
            }
            
            .ingredient-item input,
            .instruction-item input {
                flex: 1;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                background: #f8fafc;
            }
            
            .ingredient-item input:focus,
            .instruction-item input:focus {
                background: white;
                border: 1px solid #3b82f6;
            }
            
            .drag-handle {
                cursor: grab;
                color: #9ca3af;
                font-size: 16px;
            }
            
            .drag-handle:active {
                cursor: grabbing;
            }
            
            .remove-btn {
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 6px;
                width: 28px;
                height: 28px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            }
            
            .remove-btn:hover {
                background: #dc2626;
            }
            
            .smart-suggestions {
                background: #f0f9ff;
                border: 1px solid #0ea5e9;
                border-radius: 8px;
                padding: 16px;
                margin-top: 12px;
            }
            
            .smart-suggestions h6 {
                margin: 0 0 12px 0;
                color: #0c4a6e;
                font-size: 14px;
                font-weight: 600;
            }
            
            .suggestions-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .suggestion-tag {
                background: #0ea5e9;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .suggestion-tag:hover {
                background: #0284c7;
                transform: translateY(-1px);
            }
            
            .quick-actions {
                display: flex;
                gap: 12px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            }
            
            .cost-analysis {
                display: grid;
                gap: 12px;
            }
            
            .cost-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: white;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
            }
            
            .cost-item.total {
                background: #f0f9ff;
                border-color: #3b82f6;
                font-weight: 600;
            }
            
            .footer-left,
            .footer-right {
                display: flex;
                gap: 12px;
            }
            
            .footer-right {
                margin-left: auto;
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Initialize the creator with default values
     */
    initializeCreator() {
        // Add initial ingredient and instruction
        this.addIngredient();
        this.addInstruction();
        
        // Setup auto-suggestions
        this.setupAutoSuggestions();
    }

    /**
     * Load dish data into the form
     */
    loadDishData() {
        if (!this.currentDish) return;
        
        // Load basic information
        document.getElementById('dish-name').value = this.currentDish.name || '';
        document.getElementById('dish-category').value = this.currentDish.category || '';
        document.getElementById('dish-price').value = this.currentDish.price || '';
        document.getElementById('dish-servings').value = this.currentDish.servings || 4;
        document.getElementById('dish-description').value = this.currentDish.description || '';
        
        // Load recipe information
        document.getElementById('dish-cuisine').value = this.currentDish.cuisine || '';
        document.getElementById('dish-difficulty').value = this.currentDish.difficulty || 'medium';
        document.getElementById('dish-prep-time').value = this.currentDish.prepTime || '';
        document.getElementById('dish-cook-time').value = this.currentDish.cookTime || '';
        
        // Load ingredients and instructions
        this.loadIngredients();
        this.loadInstructions();
    }

    /**
     * Handle dish name change with suggestions
     */
    handleDishNameChange() {
        const name = document.getElementById('dish-name').value;
        if (name.length > 2) {
            this.showDishNameSuggestions(name);
            this.autoGenerateSuggestions(name);
        } else {
            this.hideSuggestions('dish-name-suggestions');
        }
    }

    /**
     * Handle category change
     */
    handleCategoryChange() {
        const category = document.getElementById('dish-category').value;
        if (category) {
            this.showIngredientSuggestions(category);
        }
    }

    /**
     * Handle price change with cost analysis
     */
    handlePriceChange() {
        const price = parseFloat(document.getElementById('dish-price').value) || 0;
        if (price > 0) {
            this.updateCostAnalysis();
        }
    }

    /**
     * Handle servings change
     */
    handleServingsChange() {
        // Recalculate cost analysis if needed
        this.updateCostAnalysis();
    }

    /**
     * Toggle recipe builder visibility
     */
    toggleRecipeBuilder() {
        const builder = document.getElementById('recipe-builder');
        const icon = document.getElementById('recipe-toggle-icon');
        
        if (builder.style.display === 'none') {
            builder.style.display = 'block';
            icon.classList.remove('rotated');
        } else {
            builder.style.display = 'none';
            icon.classList.add('rotated');
        }
    }

    /**
     * Add ingredient to the list
     */
    addIngredient() {
        const container = document.getElementById('ingredients-list');
        const ingredientIndex = this.ingredients.length;
        
        const ingredientDiv = document.createElement('div');
        ingredientDiv.className = 'ingredient-item';
        ingredientDiv.innerHTML = `
            <span class="drag-handle">⋮⋮</span>
            <input type="text" placeholder="Ingredient name..." 
                   oninput="quickDishCreator.updateIngredient(${ingredientIndex}, 'name', this.value)">
            <input type="text" placeholder="Amount..." 
                   oninput="quickDishCreator.updateIngredient(${ingredientIndex}, 'amount', this.value)">
            <input type="text" placeholder="Unit..." 
                   oninput="quickDishCreator.updateIngredient(${ingredientIndex}, 'unit', this.value)">
            <button type="button" class="remove-btn" onclick="quickDishCreator.removeIngredient(${ingredientIndex})">×</button>
        `;
        
        container.appendChild(ingredientDiv);
        
        this.ingredients.push({
            name: '',
            amount: '',
            unit: '',
            notes: ''
        });
    }

    /**
     * Add instruction to the list
     */
    addInstruction() {
        const container = document.getElementById('instructions-list');
        const instructionIndex = this.instructions.length;
        
        const instructionDiv = document.createElement('div');
        instructionDiv.className = 'instruction-item';
        instructionDiv.innerHTML = `
            <span class="drag-handle">⋮⋮</span>
            <span class="step-number">${instructionIndex + 1}.</span>
            <input type="text" placeholder="Instruction step..." 
                   oninput="quickDishCreator.updateInstruction(${instructionIndex}, this.value)">
            <button type="button" class="remove-btn" onclick="quickDishCreator.removeInstruction(${instructionIndex})">×</button>
        `;
        
        container.appendChild(instructionDiv);
        
        this.instructions.push({
            step: instructionIndex + 1,
            instruction: '',
            time: null
        });
    }

    /**
     * Update ingredient data
     */
    updateIngredient(index, field, value) {
        if (this.ingredients[index]) {
            this.ingredients[index][field] = value;
            this.updateCostAnalysis();
        }
    }

    /**
     * Update instruction data
     */
    updateInstruction(index, value) {
        if (this.instructions[index]) {
            this.instructions[index].instruction = value;
        }
    }

    /**
     * Remove ingredient
     */
    removeIngredient(index) {
        this.ingredients.splice(index, 1);
        this.renderIngredients();
    }

    /**
     * Remove instruction
     */
    removeInstruction(index) {
        this.instructions.splice(index, 1);
        this.renderInstructions();
    }

    /**
     * Render ingredients list
     */
    renderIngredients() {
        const container = document.getElementById('ingredients-list');
        container.innerHTML = '';
        
        this.ingredients.forEach((ingredient, index) => {
            const ingredientDiv = document.createElement('div');
            ingredientDiv.className = 'ingredient-item';
            ingredientDiv.innerHTML = `
                <span class="drag-handle">⋮⋮</span>
                <input type="text" placeholder="Ingredient name..." value="${ingredient.name || ''}"
                       oninput="quickDishCreator.updateIngredient(${index}, 'name', this.value)">
                <input type="text" placeholder="Amount..." value="${ingredient.amount || ''}"
                       oninput="quickDishCreator.updateIngredient(${index}, 'amount', this.value)">
                <input type="text" placeholder="Unit..." value="${ingredient.unit || ''}"
                       oninput="quickDishCreator.updateIngredient(${index}, 'unit', this.value)">
                <button type="button" class="remove-btn" onclick="quickDishCreator.removeIngredient(${index})">×</button>
            `;
            container.appendChild(ingredientDiv);
        });
    }

    /**
     * Render instructions list
     */
    renderInstructions() {
        const container = document.getElementById('instructions-list');
        container.innerHTML = '';
        
        this.instructions.forEach((instruction, index) => {
            const instructionDiv = document.createElement('div');
            instructionDiv.className = 'instruction-item';
            instructionDiv.innerHTML = `
                <span class="drag-handle">⋮⋮</span>
                <span class="step-number">${index + 1}.</span>
                <input type="text" placeholder="Instruction step..." value="${instruction.instruction || ''}"
                       oninput="quickDishCreator.updateInstruction(${index}, this.value)">
                <button type="button" class="remove-btn" onclick="quickDishCreator.removeInstruction(${index})">×</button>
            `;
            container.appendChild(instructionDiv);
        });
    }

    /**
     * Load ingredients from current dish
     */
    loadIngredients() {
        if (this.currentDish.ingredients && this.currentDish.ingredients.length > 0) {
            this.ingredients = [...this.currentDish.ingredients];
        } else {
            this.ingredients = [];
        }
        this.renderIngredients();
    }

    /**
     * Load instructions from current dish
     */
    loadInstructions() {
        if (this.currentDish.instructions && this.currentDish.instructions.length > 0) {
            this.instructions = [...this.currentDish.instructions];
        } else {
            this.instructions = [];
        }
        this.renderInstructions();
    }

    /**
     * Show dish name suggestions
     */
    showDishNameSuggestions(name) {
        const suggestions = this.getDishNameSuggestions(name);
        this.displaySuggestions('dish-name-suggestions', suggestions, (suggestion) => {
            document.getElementById('dish-name').value = suggestion;
            this.autoGenerateSuggestions(suggestion);
            this.hideSuggestions('dish-name-suggestions');
        });
    }

    /**
     * Show ingredient suggestions based on category
     */
    showIngredientSuggestions(category) {
        const suggestions = this.getIngredientSuggestions(category);
        const container = document.getElementById('ingredient-suggestions-list');
        
        if (suggestions.length > 0) {
            container.innerHTML = suggestions.map(ingredient => 
                `<span class="suggestion-tag" onclick="quickDishCreator.addSuggestedIngredient('${ingredient}')">${ingredient}</span>`
            ).join('');
            
            document.getElementById('ingredient-suggestions').style.display = 'block';
        }
    }

    /**
     * Add suggested ingredient
     */
    addSuggestedIngredient(ingredient) {
        this.addIngredient();
        const lastIndex = this.ingredients.length - 1;
        this.ingredients[lastIndex].name = ingredient;
        this.renderIngredients();
    }

    /**
     * Auto-generate suggestions based on dish name
     */
    autoGenerateSuggestions(dishName) {
        const category = this.inferCategory(dishName);
        if (category) {
            document.getElementById('dish-category').value = category;
            this.showIngredientSuggestions(category);
        }
    }

    /**
     * Generate instructions from template
     */
    generateFromTemplate() {
        const category = document.getElementById('dish-category').value;
        const cuisine = document.getElementById('dish-cuisine').value;
        
        if (category && this.templates[category]) {
            const template = this.templates[category];
            this.instructions = [...template.instructions];
            this.renderInstructions();
            
            // Also add suggested ingredients
            if (template.ingredients) {
                template.ingredients.forEach(ingredient => {
                    this.ingredients.push({
                        name: ingredient.name,
                        amount: ingredient.amount || '',
                        unit: ingredient.unit || '',
                        notes: ingredient.notes || ''
                    });
                });
                this.renderIngredients();
            }
        }
    }

    /**
     * Auto-generate instructions based on ingredients
     */
    autoGenerateInstructions() {
        if (this.ingredients.length === 0) {
            alert('Please add ingredients first to auto-generate instructions.');
            return;
        }
        
        const category = document.getElementById('dish-category').value;
        const instructions = this.generateInstructionsFromIngredients(this.ingredients, category);
        
        this.instructions = instructions;
        this.renderInstructions();
    }

    /**
     * Calculate nutrition information
     */
    calculateNutrition() {
        // Placeholder for nutrition calculation
        alert('Nutrition calculation feature coming soon!');
    }

    /**
     * Update cost analysis
     */
    updateCostAnalysis() {
        const ingredientCost = this.calculateIngredientCost();
        const laborCost = this.calculateLaborCost();
        const totalCost = ingredientCost + laborCost;
        const suggestedPrice = totalCost * 3; // 3x markup
        const profitMargin = ((suggestedPrice - totalCost) / suggestedPrice * 100).toFixed(1);
        
        document.getElementById('ingredient-cost').textContent = `$${ingredientCost.toFixed(2)}`;
        document.getElementById('labor-cost').textContent = `$${laborCost.toFixed(2)}`;
        document.getElementById('total-cost').textContent = `$${totalCost.toFixed(2)}`;
        document.getElementById('suggested-price').textContent = `$${suggestedPrice.toFixed(2)}`;
        document.getElementById('profit-margin').textContent = `${profitMargin}%`;
        
        document.getElementById('cost-analysis-section').style.display = 'block';
    }

    /**
     * Save dish as template
     */
    saveAsTemplate() {
        const dishData = this.collectDishData();
        const templates = JSON.parse(localStorage.getItem('dish_templates') || '[]');
        
        templates.push({
            id: Date.now(),
            name: dishData.name,
            category: dishData.category,
            ingredients: dishData.ingredients,
            instructions: dishData.instructions,
            createdAt: new Date().toISOString()
        });
        
        localStorage.setItem('dish_templates', JSON.stringify(templates));
        alert('Dish template saved successfully!');
    }

    /**
     * Save dish and add to menu
     */
    saveAndAddToMenu() {
        const dishData = this.collectDishData();
        
        // Validate required fields
        if (!dishData.name || !dishData.category) {
            alert('Please fill in dish name and category.');
            return;
        }
        
        // Add to menu using existing menu manager
        if (window.menuManager) {
            const menuItem = {
                name: dishData.name,
                description: dishData.description,
                price: dishData.price,
                category: dishData.category,
                ingredients: dishData.ingredients,
                instructions: dishData.instructions,
                prepTime: dishData.prepTime,
                cookTime: dishData.cookTime,
                servings: dishData.servings,
                difficulty: dishData.difficulty,
                cuisine: dishData.cuisine
            };
            
            const category = window.menuManager.ensureDefaultCategory();
            window.menuManager.addItem(category.id, menuItem);
            
            this.closeCreator();
            alert('Dish added to menu successfully!');
        } else {
            alert('Menu manager not available.');
        }
    }

    /**
     * Save dish as full recipe
     */
    saveAsRecipe() {
        const dishData = this.collectDishData();
        
        // Validate required fields
        if (!dishData.name || !dishData.category) {
            alert('Please fill in dish name and category.');
            return;
        }
        
        // Create recipe data
        const recipeData = {
            name: dishData.name,
            description: dishData.description,
            category: dishData.category,
            cuisine: dishData.cuisine,
            difficulty: dishData.difficulty,
            prepTime: dishData.prepTime,
            cookTime: dishData.cookTime,
            servings: dishData.servings,
            ingredients: dishData.ingredients,
            instructions: dishData.instructions,
            tags: [dishData.category, dishData.cuisine].filter(Boolean),
            status: 'draft',
            type: 'dish'
        };
        
        // Save to recipe library
        const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
        const finalRecipe = {
            id: Date.now(),
            ...recipeData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        recipes.push(finalRecipe);
        
        localStorage.setItem('recipes', JSON.stringify(recipes));
        
        // ✅ NEW: Add to universal recipe library
        if (window.universalRecipeManager) {
            window.universalRecipeManager.addToLibrary(finalRecipe, 'quick-dish-creator');
            console.log('📚 Recipe added to universal library from quick dish creator');
        }
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('recipeSaved', {
            detail: { recipe: finalRecipe, source: 'quick-dish-creator' }
        }));
        
        this.closeCreator();
        alert('✅ Recipe saved to library successfully!');
    }

    /**
     * Collect all dish data from the form
     */
    collectDishData() {
        return {
            name: document.getElementById('dish-name').value,
            category: document.getElementById('dish-category').value,
            price: parseFloat(document.getElementById('dish-price').value) || null,
            description: document.getElementById('dish-description').value,
            servings: parseInt(document.getElementById('dish-servings').value) || 4,
            cuisine: document.getElementById('dish-cuisine').value,
            difficulty: document.getElementById('dish-difficulty').value,
            prepTime: parseInt(document.getElementById('dish-prep-time').value) || null,
            cookTime: parseInt(document.getElementById('dish-cook-time').value) || null,
            ingredients: this.ingredients.filter(ing => ing.name.trim()),
            instructions: this.instructions.filter(inst => inst.instruction.trim())
        };
    }

    /**
     * Close the creator modal
     */
    closeCreator() {
        const modal = document.getElementById('quick-dish-creator-modal');
        if (modal) {
            modal.remove();
        }
        
        // Clean up styles
        const styles = document.getElementById('quick-dish-creator-styles');
        if (styles) {
            styles.remove();
        }
        
        this.currentDish = null;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') && e.target.id === 'quick-dish-creator-modal') {
                this.closeCreator();
            }
        });
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('quick-dish-creator-modal')) {
                this.closeCreator();
            }
        });
    }

    /**
     * Load dish templates
     */
    loadDishTemplates() {
        return {
            appetizer: {
                instructions: [
                    { step: 1, instruction: 'Prepare all ingredients and equipment' },
                    { step: 2, instruction: 'Season ingredients as needed' },
                    { step: 3, instruction: 'Cook according to recipe' },
                    { step: 4, instruction: 'Plate and garnish beautifully' }
                ]
            },
            main: {
                instructions: [
                    { step: 1, instruction: 'Preheat cooking equipment' },
                    { step: 2, instruction: 'Prepare and season main protein' },
                    { step: 3, instruction: 'Cook protein to desired doneness' },
                    { step: 4, instruction: 'Prepare accompaniments' },
                    { step: 5, instruction: 'Plate with proper presentation' }
                ]
            },
            dessert: {
                instructions: [
                    { step: 1, instruction: 'Prepare dessert base or batter' },
                    { step: 2, instruction: 'Bake or chill as required' },
                    { step: 3, instruction: 'Prepare garnishes and sauces' },
                    { step: 4, instruction: 'Assemble dessert components' },
                    { step: 5, instruction: 'Finish with final touches' }
                ]
            },
            'prep-recipe': {
                instructions: [
                    { step: 1, instruction: 'Gather and measure all ingredients' },
                    { step: 2, instruction: 'Prepare ingredients as needed (chop, dice, etc.)' },
                    { step: 3, instruction: 'Combine ingredients according to recipe' },
                    { step: 4, instruction: 'Store properly with labels and dates' }
                ]
            }
        };
    }

    /**
     * Load ingredient suggestions
     */
    loadIngredientSuggestions() {
        return {
            appetizer: ['Olive oil', 'Salt', 'Pepper', 'Garlic', 'Herbs', 'Cheese', 'Bread'],
            main: ['Protein', 'Vegetables', 'Rice', 'Pasta', 'Sauce', 'Spices', 'Oil'],
            dessert: ['Sugar', 'Flour', 'Eggs', 'Butter', 'Vanilla', 'Chocolate', 'Fruit'],
            salad: ['Lettuce', 'Tomatoes', 'Cucumber', 'Dressing', 'Cheese', 'Nuts', 'Herbs'],
            soup: ['Stock', 'Vegetables', 'Herbs', 'Spices', 'Cream', 'Meat', 'Pasta'],
            side: ['Potatoes', 'Vegetables', 'Rice', 'Grains', 'Herbs', 'Butter', 'Seasoning'],
            'prep-recipe': ['Salt', 'Pepper', 'Herbs', 'Spices', 'Oil', 'Vinegar', 'Stock']
        };
    }

    /**
     * Get dish name suggestions
     */
    getDishNameSuggestions(name) {
        // Simple suggestion logic - could be enhanced with AI
        const suggestions = [];
        const existingRecipes = JSON.parse(localStorage.getItem('recipes') || '[]');
        
        existingRecipes.forEach(recipe => {
            if (recipe.name.toLowerCase().includes(name.toLowerCase())) {
                suggestions.push(recipe.name);
            }
        });
        
        return suggestions.slice(0, 5);
    }

    /**
     * Get ingredient suggestions for category
     */
    getIngredientSuggestions(category) {
        return this.ingredientSuggestions[category] || [];
    }

    /**
     * Infer category from dish name
     */
    inferCategory(dishName) {
        const name = dishName.toLowerCase();
        if (name.includes('salad')) return 'salad';
        if (name.includes('soup')) return 'soup';
        if (name.includes('cake') || name.includes('pie') || name.includes('dessert')) return 'dessert';
        if (name.includes('appetizer') || name.includes('starter')) return 'appetizer';
        return null;
    }

    /**
     * Generate instructions from ingredients
     */
    generateInstructionsFromIngredients(ingredients, category) {
        // Simple instruction generation - could be enhanced with AI
        const instructions = [
            { step: 1, instruction: 'Gather and prepare all ingredients' },
            { step: 2, instruction: 'Heat cooking equipment and add oil if needed' },
            { step: 3, instruction: 'Cook ingredients according to their cooking times' },
            { step: 4, instruction: 'Season and adjust flavors as needed' },
            { step: 5, instruction: 'Plate and serve immediately' }
        ];
        
        return instructions;
    }

    /**
     * Calculate ingredient cost
     */
    calculateIngredientCost() {
        // Placeholder calculation - would integrate with ingredient database
        return this.ingredients.length * 0.50; // $0.50 per ingredient estimate
    }

    /**
     * Calculate labor cost
     */
    calculateLaborCost() {
        const prepTime = parseInt(document.getElementById('dish-prep-time').value) || 0;
        const cookTime = parseInt(document.getElementById('dish-cook-time').value) || 0;
        const totalTime = prepTime + cookTime;
        const hourlyRate = 15; // $15/hour labor cost
        
        return (totalTime / 60) * hourlyRate;
    }

    /**
     * Display suggestions
     */
    displaySuggestions(containerId, suggestions, onSelect) {
        const container = document.getElementById(containerId);
        if (suggestions.length === 0) {
            this.hideSuggestions(containerId);
            return;
        }
        
        container.innerHTML = suggestions.map(suggestion => 
            `<div class="suggestion-item" onclick="quickDishCreator.selectSuggestion('${containerId}', '${suggestion}', arguments[0])">${suggestion}</div>`
        ).join('');
        
        container.style.display = 'block';
        
        // Store the onSelect callback
        container.onSelect = onSelect;
    }

    /**
     * Select suggestion
     */
    selectSuggestion(containerId, suggestion, callback) {
        const container = document.getElementById(containerId);
        if (container.onSelect) {
            container.onSelect(suggestion);
        }
        this.hideSuggestions(containerId);
    }

    /**
     * Hide suggestions
     */
    hideSuggestions(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.style.display = 'none';
        }
    }

    /**
     * Setup auto-suggestions
     */
    setupAutoSuggestions() {
        // Setup position relative for suggestions
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.style.position = 'relative';
        });
    }
}

// Initialize global instance
window.quickDishCreator = new QuickDishCreator();
