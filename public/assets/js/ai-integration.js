/**
 * AI Integration for Iterum R&D Chef Notebook
 * Handles AI-powered recipe and menu parsing, creation, and enhancement
 */

class AIIntegration {
    constructor() {
        this.apiBase = '/api/ai';
        this.isEnabled = false;
        this.providers = {};
        this.init();
    }

    /**
     * Initialize AI integration
     */
    async init() {
        try {
            console.log('🤖 Initializing AI Integration...');
            
            // Check AI status
            const status = await this.checkAIStatus();
            this.isEnabled = status.ai_enabled;
            this.providers = status.providers;
            
            if (this.isEnabled) {
                console.log('✅ AI Integration enabled');
                this.setupEventListeners();
                this.updateUI();
            } else {
                console.log('⚠️ AI Integration disabled');
                this.showAIDisabledMessage();
            }
            
        } catch (error) {
            console.error('❌ AI Integration initialization failed:', error);
            this.showAIError(error);
        }
    }

    /**
     * Check AI system status
     */
    async checkAIStatus() {
        try {
            const response = await fetch(`${this.apiBase}/status`);
            if (!response.ok) {
                throw new Error(`AI status check failed: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('AI status check failed:', error);
            return { ai_enabled: false, providers: {} };
        }
    }

    /**
     * Setup event listeners for AI features
     */
    setupEventListeners() {
        // AI Recipe Parsing
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-ai-action="parse-recipe"]')) {
                this.handleRecipeParsing(e);
            }
            if (e.target.matches('[data-ai-action="enhance-recipe"]')) {
                this.handleRecipeEnhancement(e);
            }
            if (e.target.matches('[data-ai-action="create-recipe"]')) {
                this.handleRecipeCreation(e);
            }
            if (e.target.matches('[data-ai-action="parse-menu"]')) {
                this.handleMenuParsing(e);
            }
            if (e.target.matches('[data-ai-action="generate-variations"]')) {
                this.handleRecipeVariations(e);
            }
            if (e.target.matches('[data-ai-action="suggest-improvements"]')) {
                this.handleRecipeImprovements(e);
            }
        });

        // AI-enhanced file upload
        const fileInputs = document.querySelectorAll('input[type="file"][data-ai-enhanced]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleAIFileUpload(e);
            });
        });

        console.log('✅ AI event listeners setup complete');
    }

    /**
     * Update UI to show AI features
     */
    updateUI() {
        // Add AI buttons to recipe forms
        this.addAIButtonsToRecipeForms();
        
        // Add AI buttons to menu forms
        this.addAIButtonsToMenuForms();
        
        // Update file upload inputs
        this.updateFileUploadInputs();
        
        // Add AI status indicator
        this.addAIStatusIndicator();
    }

    /**
     * Add AI buttons to recipe forms
     */
    addAIButtonsToRecipeForms() {
        const recipeForms = document.querySelectorAll('.recipe-form, #recipe-form');
        
        recipeForms.forEach(form => {
            // Check if AI buttons already exist
            if (form.querySelector('[data-ai-action]')) return;
            
            const buttonContainer = form.querySelector('.form-actions, .button-group') || form;
            
            // AI Parse Text button
            const parseButton = this.createAIButton(
                'parse-recipe',
                '🤖 AI Parse Text',
                'Parse recipe text with AI for enhanced accuracy'
            );
            
            // AI Enhance button
            const enhanceButton = this.createAIButton(
                'enhance-recipe',
                '✨ AI Enhance',
                'Enhance existing recipe with AI insights'
            );
            
            // AI Create button
            const createButton = this.createAIButton(
                'create-recipe',
                '🎨 AI Create',
                'Create new recipe with AI assistance'
            );
            
            buttonContainer.appendChild(parseButton);
            buttonContainer.appendChild(enhanceButton);
            buttonContainer.appendChild(createButton);
        });
    }

    /**
     * Add AI buttons to menu forms
     */
    addAIButtonsToMenuForms() {
        const menuForms = document.querySelectorAll('.menu-form, #menu-form');
        
        menuForms.forEach(form => {
            // Check if AI buttons already exist
            if (form.querySelector('[data-ai-action]')) return;
            
            const buttonContainer = form.querySelector('.form-actions, .button-group') || form;
            
            // AI Parse Menu button
            const parseButton = this.createAIButton(
                'parse-menu',
                '🤖 AI Parse Menu',
                'Parse menu text with AI for enhanced accuracy'
            );
            
            buttonContainer.appendChild(parseButton);
        });
    }

    /**
     * Update file upload inputs with AI enhancement
     */
    updateFileUploadInputs() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach(input => {
            if (!input.hasAttribute('data-ai-enhanced')) {
                input.setAttribute('data-ai-enhanced', 'true');
                
                // Add AI processing option
                const container = input.closest('.file-upload-container') || input.parentElement;
                if (container && !container.querySelector('.ai-processing-option')) {
                    const aiOption = document.createElement('div');
                    aiOption.className = 'ai-processing-option mt-2';
                    aiOption.innerHTML = `
                        <label class="flex items-center">
                            <input type="checkbox" checked class="mr-2" data-ai-process="true">
                            <span class="text-sm text-gray-600">🤖 Use AI for enhanced parsing</span>
                        </label>
                    `;
                    container.appendChild(aiOption);
                }
            }
        });
    }

    /**
     * Add AI status indicator
     */
    addAIStatusIndicator() {
        const header = document.querySelector('header, .header, .navbar');
        if (header && !header.querySelector('.ai-status-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'ai-status-indicator flex items-center text-sm';
            indicator.innerHTML = `
                <span class="mr-2">🤖 AI:</span>
                <span class="text-green-600 font-medium">Enabled</span>
            `;
            
            const userInfo = header.querySelector('.user-info, .user-profile');
            if (userInfo) {
                userInfo.appendChild(indicator);
            } else {
                header.appendChild(indicator);
            }
        }
    }

    /**
     * Create AI button
     */
    createAIButton(action, text, tooltip) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ai-button bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors';
        button.setAttribute('data-ai-action', action);
        button.setAttribute('title', tooltip);
        button.textContent = text;
        
        return button;
    }

    /**
     * Handle recipe parsing
     */
    async handleRecipeParsing(event) {
        event.preventDefault();
        
        const form = event.target.closest('form');
        const textArea = form.querySelector('textarea[name="recipe_text"], textarea[name="text"]');
        
        if (!textArea || !textArea.value.trim()) {
            this.showError('Please enter recipe text to parse');
            return;
        }
        
        try {
            this.showLoading('Parsing recipe with AI...');
            
            const response = await fetch(`${this.apiBase}/recipe/parse-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    text: textArea.value
                })
            });
            
            if (!response.ok) {
                throw new Error(`AI parsing failed: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.populateRecipeForm(form, result.recipe);
                this.showSuccess(`Recipe parsed successfully! Confidence: ${(result.confidence * 100).toFixed(1)}%`);
            } else {
                throw new Error('AI parsing failed');
            }
            
        } catch (error) {
            console.error('Recipe parsing failed:', error);
            this.showError(`Recipe parsing failed: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Handle recipe enhancement
     */
    async handleRecipeEnhancement(event) {
        event.preventDefault();
        
        const form = event.target.closest('form');
        const recipeData = this.extractRecipeData(form);
        
        if (!recipeData.title) {
            this.showError('Please enter a recipe title to enhance');
            return;
        }
        
        try {
            this.showLoading('Enhancing recipe with AI...');
            
            const response = await fetch(`${this.apiBase}/recipe/enhance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(recipeData)
            });
            
            if (!response.ok) {
                throw new Error(`AI enhancement failed: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.populateRecipeForm(form, result.enhanced_recipe);
                this.showSuccess('Recipe enhanced with AI insights!');
            } else {
                throw new Error('AI enhancement failed');
            }
            
        } catch (error) {
            console.error('Recipe enhancement failed:', error);
            this.showError(`Recipe enhancement failed: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Handle recipe creation
     */
    async handleRecipeCreation(event) {
        event.preventDefault();
        
        // Show recipe creation modal
        this.showRecipeCreationModal();
    }

    /**
     * Handle menu parsing
     */
    async handleMenuParsing(event) {
        event.preventDefault();
        
        const form = event.target.closest('form');
        const textArea = form.querySelector('textarea[name="menu_text"], textarea[name="text"]');
        
        if (!textArea || !textArea.value.trim()) {
            this.showError('Please enter menu text to parse');
            return;
        }
        
        try {
            this.showLoading('Parsing menu with AI...');
            
            const response = await fetch(`${this.apiBase}/menu/parse-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    text: textArea.value
                })
            });
            
            if (!response.ok) {
                throw new Error(`AI parsing failed: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.populateMenuForm(form, result.menu);
                this.showSuccess(`Menu parsed successfully! Confidence: ${(result.confidence * 100).toFixed(1)}%`);
            } else {
                throw new Error('AI parsing failed');
            }
            
        } catch (error) {
            console.error('Menu parsing failed:', error);
            this.showError(`Menu parsing failed: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Handle AI file upload
     */
    async handleAIFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const aiProcess = event.target.closest('.file-upload-container').querySelector('[data-ai-process]').checked;
        if (!aiProcess) return;
        
        try {
            this.showLoading('Processing file with AI...');
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('file_type', this.determineFileType(file.name));
            
            const response = await fetch(`${this.apiBase}/upload/ai-enhanced`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`AI file processing failed: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.handleAIFileResult(result);
                this.showSuccess(`File processed with AI! Confidence: ${(result.confidence * 100).toFixed(1)}%`);
            } else {
                throw new Error('AI file processing failed');
            }
            
        } catch (error) {
            console.error('AI file processing failed:', error);
            this.showError(`AI file processing failed: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Handle AI file processing result
     */
    handleAIFileResult(result) {
        if (result.file_type === 'recipe') {
            // Find recipe form and populate
            const form = document.querySelector('.recipe-form, #recipe-form');
            if (form) {
                this.populateRecipeForm(form, result.parsed_data);
            }
        } else if (result.file_type === 'menu') {
            // Find menu form and populate
            const form = document.querySelector('.menu-form, #menu-form');
            if (form) {
                this.populateMenuForm(form, result.parsed_data);
            }
        }
    }

    /**
     * Populate recipe form with AI data
     */
    populateRecipeForm(form, recipeData) {
        // Populate basic fields
        this.setFormValue(form, 'title', recipeData.title);
        this.setFormValue(form, 'description', recipeData.description);
        this.setFormValue(form, 'servings', recipeData.servings);
        this.setFormValue(form, 'prep_time', recipeData.prep_time);
        this.setFormValue(form, 'cook_time', recipeData.cook_time);
        this.setFormValue(form, 'difficulty', recipeData.difficulty);
        this.setFormValue(form, 'cuisine', recipeData.cuisine);
        this.setFormValue(form, 'category', recipeData.category);
        
        // Populate ingredients
        if (recipeData.ingredients && recipeData.ingredients.length > 0) {
            this.populateIngredients(form, recipeData.ingredients);
        }
        
        // Populate instructions
        if (recipeData.instructions && recipeData.instructions.length > 0) {
            this.populateInstructions(form, recipeData.instructions);
        }
        
        // Populate tags
        if (recipeData.tags && recipeData.tags.length > 0) {
            this.setFormValue(form, 'tags', recipeData.tags.join(', '));
        }
    }

    /**
     * Populate menu form with AI data
     */
    populateMenuForm(form, menuData) {
        // Populate basic fields
        this.setFormValue(form, 'restaurant_name', menuData.restaurant_name);
        this.setFormValue(form, 'menu_type', menuData.menu_type);
        this.setFormValue(form, 'cuisine_type', menuData.cuisine_type);
        this.setFormValue(form, 'price_range', menuData.price_range);
        
        // Populate menu sections
        if (menuData.sections && menuData.sections.length > 0) {
            this.populateMenuSections(form, menuData.sections);
        }
    }

    /**
     * Populate ingredients in form
     */
    populateIngredients(form, ingredients) {
        const ingredientsContainer = form.querySelector('.ingredients-container, #ingredients');
        if (!ingredientsContainer) return;
        
        // Clear existing ingredients
        ingredientsContainer.innerHTML = '';
        
        ingredients.forEach((ingredient, index) => {
            const ingredientDiv = document.createElement('div');
            ingredientDiv.className = 'ingredient-item flex gap-2 mb-2';
            ingredientDiv.innerHTML = `
                <input type="text" name="ingredient_amount_${index}" placeholder="Amount" 
                       value="${ingredient.amount || ''}" class="flex-1 px-3 py-2 border rounded">
                <input type="text" name="ingredient_unit_${index}" placeholder="Unit" 
                       value="${ingredient.unit || ''}" class="flex-1 px-3 py-2 border rounded">
                <input type="text" name="ingredient_name_${index}" placeholder="Ingredient" 
                       value="${ingredient.name || ''}" class="flex-2 px-3 py-2 border rounded">
                <input type="text" name="ingredient_prep_${index}" placeholder="Preparation" 
                       value="${ingredient.preparation || ''}" class="flex-1 px-3 py-2 border rounded">
            `;
            ingredientsContainer.appendChild(ingredientDiv);
        });
    }

    /**
     * Populate instructions in form
     */
    populateInstructions(form, instructions) {
        const instructionsContainer = form.querySelector('.instructions-container, #instructions');
        if (!instructionsContainer) return;
        
        // Clear existing instructions
        instructionsContainer.innerHTML = '';
        
        instructions.forEach((instruction, index) => {
            const instructionDiv = document.createElement('div');
            instructionDiv.className = 'instruction-item flex gap-2 mb-2';
            instructionDiv.innerHTML = `
                <span class="instruction-number w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">${index + 1}</span>
                <textarea name="instruction_${index}" placeholder="Instruction" 
                          class="flex-1 px-3 py-2 border rounded" rows="2">${instruction.instruction || instruction}</textarea>
            `;
            instructionsContainer.appendChild(instructionDiv);
        });
    }

    /**
     * Populate menu sections in form
     */
    populateMenuSections(form, sections) {
        const sectionsContainer = form.querySelector('.menu-sections-container, #menu-sections');
        if (!sectionsContainer) return;
        
        // Clear existing sections
        sectionsContainer.innerHTML = '';
        
        sections.forEach((section, sectionIndex) => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'menu-section mb-6 p-4 border rounded';
            sectionDiv.innerHTML = `
                <h3 class="text-lg font-semibold mb-2">${section.name}</h3>
                <div class="menu-items">
                    ${section.items.map((item, itemIndex) => `
                        <div class="menu-item mb-3 p-3 bg-gray-50 rounded">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="font-medium">${item.name}</h4>
                                <span class="text-green-600 font-semibold">${item.price || ''}</span>
                            </div>
                            <p class="text-gray-600 text-sm">${item.description || ''}</p>
                            ${item.ingredients ? `<p class="text-xs text-gray-500 mt-1">Ingredients: ${item.ingredients.join(', ')}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
            sectionsContainer.appendChild(sectionDiv);
        });
    }

    /**
     * Set form field value
     */
    setFormValue(form, fieldName, value) {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (field && value) {
            if (field.type === 'checkbox' || field.type === 'radio') {
                field.checked = true;
            } else {
                field.value = value;
            }
        }
    }

    /**
     * Extract recipe data from form
     */
    extractRecipeData(form) {
        const data = {
            title: form.querySelector('[name="title"]')?.value || '',
            description: form.querySelector('[name="description"]')?.value || '',
            servings: form.querySelector('[name="servings"]')?.value || '',
            prep_time: form.querySelector('[name="prep_time"]')?.value || '',
            cook_time: form.querySelector('[name="cook_time"]')?.value || '',
            difficulty: form.querySelector('[name="difficulty"]')?.value || '',
            cuisine: form.querySelector('[name="cuisine"]')?.value || '',
            category: form.querySelector('[name="category"]')?.value || '',
            ingredients: [],
            instructions: []
        };
        
        // Extract ingredients
        const ingredientItems = form.querySelectorAll('.ingredient-item');
        ingredientItems.forEach(item => {
            const amount = item.querySelector('[name^="ingredient_amount"]')?.value || '';
            const unit = item.querySelector('[name^="ingredient_unit"]')?.value || '';
            const name = item.querySelector('[name^="ingredient_name"]')?.value || '';
            const prep = item.querySelector('[name^="ingredient_prep"]')?.value || '';
            
            if (name) {
                data.ingredients.push({ amount, unit, name, preparation: prep });
            }
        });
        
        // Extract instructions
        const instructionItems = form.querySelectorAll('.instruction-item');
        instructionItems.forEach(item => {
            const instruction = item.querySelector('textarea')?.value || '';
            if (instruction) {
                data.instructions.push(instruction);
            }
        });
        
        return data;
    }

    /**
     * Determine file type from filename
     */
    determineFileType(filename) {
        const lower = filename.toLowerCase();
        if (lower.includes('menu') || lower.includes('carta')) {
            return 'menu';
        } else {
            return 'recipe';
        }
    }

    /**
     * Show recipe creation modal
     */
    showRecipeCreationModal() {
        // Create modal HTML
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 class="text-xl font-bold mb-4">🤖 AI Recipe Creation</h2>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Creation Method</label>
                    <div class="space-y-2">
                        <label class="flex items-center">
                            <input type="radio" name="creation_method" value="ingredients" checked class="mr-2">
                            <span>From Ingredients</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="creation_method" value="concept" class="mr-2">
                            <span>From Concept</span>
                        </label>
                    </div>
                </div>
                
                <div id="ingredients-input" class="mb-4">
                    <label class="block text-sm font-medium mb-2">Ingredients (comma-separated)</label>
                    <textarea name="ingredients" placeholder="chicken, rice, vegetables, spices..." 
                              class="w-full px-3 py-2 border rounded" rows="3"></textarea>
                </div>
                
                <div id="concept-input" class="mb-4 hidden">
                    <label class="block text-sm font-medium mb-2">Recipe Concept</label>
                    <textarea name="concept" placeholder="A healthy Mediterranean dish with fresh vegetables..." 
                              class="w-full px-3 py-2 border rounded" rows="3"></textarea>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Cuisine</label>
                        <select name="cuisine" class="w-full px-3 py-2 border rounded">
                            <option value="Any">Any</option>
                            <option value="Italian">Italian</option>
                            <option value="Asian">Asian</option>
                            <option value="Mexican">Mexican</option>
                            <option value="Mediterranean">Mediterranean</option>
                            <option value="American">American</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Difficulty</label>
                        <select name="difficulty" class="w-full px-3 py-2 border rounded">
                            <option value="Easy">Easy</option>
                            <option value="Medium" selected>Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button type="button" id="create-recipe-btn" 
                            class="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded">
                        Create Recipe
                    </button>
                    <button type="button" id="cancel-create-btn" 
                            class="px-4 py-2 border rounded hover:bg-gray-50">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup event listeners
        const methodInputs = modal.querySelectorAll('input[name="creation_method"]');
        const ingredientsDiv = modal.querySelector('#ingredients-input');
        const conceptDiv = modal.querySelector('#concept-input');
        
        methodInputs.forEach(input => {
            input.addEventListener('change', () => {
                if (input.value === 'ingredients') {
                    ingredientsDiv.classList.remove('hidden');
                    conceptDiv.classList.add('hidden');
                } else {
                    ingredientsDiv.classList.add('hidden');
                    conceptDiv.classList.remove('hidden');
                }
            });
        });
        
        modal.querySelector('#create-recipe-btn').addEventListener('click', () => {
            this.handleCreateRecipe(modal);
        });
        
        modal.querySelector('#cancel-create-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    /**
     * Handle recipe creation from modal
     */
    async handleCreateRecipe(modal) {
        const method = modal.querySelector('input[name="creation_method"]:checked').value;
        const cuisine = modal.querySelector('[name="cuisine"]').value;
        const difficulty = modal.querySelector('[name="difficulty"]').value;
        
        try {
            this.showLoading('Creating recipe with AI...');
            
            let response;
            if (method === 'ingredients') {
                const ingredients = modal.querySelector('[name="ingredients"]').value.split(',').map(i => i.trim());
                response = await fetch(`${this.apiBase}/recipe/create-from-ingredients`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Bearer ${this.getAuthToken()}`
                    },
                    body: new URLSearchParams({
                        ingredients: JSON.stringify(ingredients),
                        cuisine,
                        difficulty,
                        servings: '4',
                        dietary: 'None',
                        cook_time: '30-45 minutes'
                    })
                });
            } else {
                const concept = modal.querySelector('[name="concept"]').value;
                response = await fetch(`${this.apiBase}/recipe/create-from-concept`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Bearer ${this.getAuthToken()}`
                    },
                    body: new URLSearchParams({
                        concept,
                        cuisine,
                        difficulty,
                        servings: '4',
                        dietary: 'None',
                        cook_time: '30-45 minutes'
                    })
                });
            }
            
            if (!response.ok) {
                throw new Error(`AI recipe creation failed: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Find recipe form and populate
                const form = document.querySelector('.recipe-form, #recipe-form');
                if (form) {
                    this.populateRecipeForm(form, result.recipe);
                }
                
                // Close modal
                document.body.removeChild(modal);
                
                this.showSuccess('Recipe created with AI!');
            } else {
                throw new Error('AI recipe creation failed');
            }
            
        } catch (error) {
            console.error('Recipe creation failed:', error);
            this.showError(`Recipe creation failed: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Get authentication token
     */
    getAuthToken() {
        return localStorage.getItem('iterum_auth_token') || '';
    }

    /**
     * Show loading indicator
     */
    showLoading(message) {
        // Remove existing loading
        this.hideLoading();
        
        const loading = document.createElement('div');
        loading.id = 'ai-loading';
        loading.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        loading.innerHTML = `
            <div class="flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ${message}
            </div>
        `;
        
        document.body.appendChild(loading);
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loading = document.getElementById('ai-loading');
        if (loading) {
            document.body.removeChild(loading);
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show message
     */
    showMessage(message, type) {
        // Remove existing messages
        const existing = document.querySelectorAll('.ai-message');
        existing.forEach(msg => document.body.removeChild(msg));
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(messageDiv)) {
                document.body.removeChild(messageDiv);
            }
        }, 5000);
    }

    /**
     * Show AI disabled message
     */
    showAIDisabledMessage() {
        const message = document.createElement('div');
        message.className = 'ai-disabled-message bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4';
        message.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">⚠️</span>
                <span>AI features are disabled. Please check your API configuration.</span>
            </div>
        `;
        
        const container = document.querySelector('.main-content, main, .content');
        if (container) {
            container.insertBefore(message, container.firstChild);
        }
    }

    /**
     * Show AI error
     */
    showAIError(error) {
        const message = document.createElement('div');
        message.className = 'ai-error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
        message.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">❌</span>
                <span>AI Integration Error: ${error.message}</span>
            </div>
        `;
        
        const container = document.querySelector('.main-content, main, .content');
        if (container) {
            container.insertBefore(message, container.firstChild);
        }
    }
}

// Initialize AI Integration when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.aiIntegration = new AIIntegration();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIIntegration;
}
