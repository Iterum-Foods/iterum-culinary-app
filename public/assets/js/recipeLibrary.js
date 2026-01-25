// Recipe Library Management System for Iterum R&D Chef Notebook
// Handles bulk upload, organization, filtering, and management of large recipe collections

// Prevent duplicate loading
if (typeof window.RecipeLibrary !== 'undefined') {
    console.log('RecipeLibrary already loaded, skipping initialization');
} else {
    class RecipeLibrary {
        constructor() {
            this.recipes = [];
            this.categories = [];
            this.cuisines = [];
            this.tags = [];
            this.uploadQueue = [];
            this.processingStatus = {};
            
            this.init();
        }
        
        // Track recipe changes for calendar
        addRecipeChange(action, recipeName, description = '') {
            const change = {
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString(),
                action: action,
                recipeName: recipeName,
                description: description,
                timestamp: new Date().toISOString()
            };
            
            // Save to calendar manager if available
            if (window.calendarManager) {
                window.calendarManager.addRecipeChange(change);
            }
            
            // Also save to localStorage for backup
            let changes = JSON.parse(localStorage.getItem('iterum_recipe_changes') || '[]');
            changes.push(change);
            localStorage.setItem('iterum_recipe_changes', JSON.stringify(changes));
        }
        
        init() {
            this.setupEventListeners();
            this.loadRecipeLibrary();
            this.initializeCategories();
        }
        
        setupEventListeners() {
            // Library organization
            this.setupLibraryControls();
            
            // Import/Export
            const exportBtn = document.getElementById('export-recipe-library');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportRecipeLibrary());
            }
            
            const importBtn = document.getElementById('import-recipe-library');
            if (importBtn) {
                importBtn.addEventListener('click', () => this.importRecipeLibrary());
            }
        }
        
        setupLibraryControls() {
            // Category filter
            const categoryFilter = document.getElementById('recipe-category-filter');
            if (categoryFilter) {
                categoryFilter.addEventListener('change', () => this.filterRecipes());
            }
            
            // Cuisine filter
            const cuisineFilter = document.getElementById('recipe-cuisine-filter');
            if (cuisineFilter) {
                cuisineFilter.addEventListener('change', () => this.filterRecipes());
            }
            
            // Search
            const searchInput = document.getElementById('recipe-library-search');
            if (searchInput) {
                searchInput.addEventListener('input', debounce(() => this.filterRecipes(), 300));
            }
            
            // Sort options
            const sortSelect = document.getElementById('recipe-sort-by');
            if (sortSelect) {
                sortSelect.addEventListener('change', () => this.sortRecipes());
            }
            
            // View mode
            const viewModeBtns = document.querySelectorAll('.view-mode-btn');
            viewModeBtns.forEach(btn => {
                btn.addEventListener('click', () => this.changeViewMode(btn.dataset.mode));
            });
        }
        
        // Initialize default categories and cuisines
        initializeCategories() {
            this.categories = [
                'Appetizers', 'Soups', 'Salads', 'Main Dishes', 'Side Dishes',
                'Desserts', 'Breads', 'Beverages', 'Sauces', 'Snacks',
                'Breakfast', 'Lunch', 'Dinner', 'Holiday', 'Quick & Easy',
                'Slow Cooker', 'Grilling', 'Baking', 'Vegetarian', 'Vegan'
            ];
            
            this.cuisines = [
                'American', 'Italian', 'Mexican', 'Chinese', 'Japanese',
                'Indian', 'Thai', 'French', 'Mediterranean', 'Greek',
                'Spanish', 'German', 'British', 'African', 'Middle Eastern',
                'Caribbean', 'Latin American', 'Asian', 'European', 'Fusion'
            ];
            
            this.tags = [
                'Quick', 'Easy', 'Healthy', 'Gluten-Free', 'Dairy-Free',
                'Low-Carb', 'High-Protein', 'Budget-Friendly', 'Crowd-Pleaser',
                'Make-Ahead', 'Freezer-Friendly', 'One-Pot', '30-Minute',
                'Kid-Friendly', 'Date Night', 'Comfort Food', 'Gourmet'
            ];
        }
        
        // Show bulk upload modal
        showBulkUploadModal() {
            const modal = document.getElementById('bulk-upload-modal');
            if (modal) {
                modal.classList.remove('hidden');
            }
        }
        
        // Handle file upload
        async handleFileUpload(event, inputId) {
            const files = event.target.files;
            if (!files.length) return;
            
            // Add files to upload queue
            for (let file of files) {
                this.uploadQueue.push({
                    file: file,
                    type: inputId,
                    status: 'pending',
                    progress: 0
                });
            }
            
            // Show upload progress
            this.showUploadProgress();
            
            // Process files
            await this.processUploadQueue();
        }
        
        // Process upload queue
        async processUploadQueue() {
            for (let item of this.uploadQueue) {
                try {
                    item.status = 'processing';
                    this.updateUploadProgress();
                    
                    const recipe = await this.parseRecipeFile(item.file, item.type);
                    if (recipe) {
                        this.recipes.push(recipe);
                        this.addRecipeChange('Added', recipe.name, 'Recipe imported from file');
                        item.status = 'completed';
                    } else {
                        item.status = 'failed';
                    }
                    
                    this.updateUploadProgress();
                    
                } catch (error) {
                    console.error('Error processing file:', error);
                    item.status = 'failed';
                    item.error = error.message;
                    this.updateUploadProgress();
                }
            }
            
            // Save recipes and refresh display
            this.saveRecipeLibrary();
            this.displayRecipes();
            this.showUploadComplete();
        }
        
        // Parse recipe file based on type
        async parseRecipeFile(file, type) {
            switch (type) {
                case 'pdf-upload':
                    return await this.parsePDFRecipe(file);
                case 'excel-upload':
                    return await this.parseExcelRecipe(file);
                case 'word-upload':
                    return await this.parseWordRecipe(file);
                case 'text-upload':
                    return await this.parseTextRecipe(file);
                default:
                    throw new Error('Unsupported file type');
            }
        }
        
        // Parse PDF recipe
        async parsePDFRecipe(file) {
            // This would use PDF.js or similar library
            // For now, return a basic structure
            return {
                id: Date.now() + Math.random(),
                name: file.name.replace('.pdf', ''),
                description: 'Imported from PDF',
                ingredients: [],
                instructions: [],
                category: 'Imported',
                cuisine: 'Unknown',
                tags: ['PDF Import'],
                servings: 4,
                prep_time: 0,
                cook_time: 0,
                difficulty: 'Medium',
                source: file.name,
                imported_at: new Date().toISOString()
            };
        }
        
        // Parse Excel recipe
        async parseExcelRecipe(file) {
            // This would use SheetJS or similar library
            return {
                id: Date.now() + Math.random(),
                name: file.name.replace('.xlsx', '').replace('.xls', ''),
                description: 'Imported from Excel',
                ingredients: [],
                instructions: [],
                category: 'Imported',
                cuisine: 'Unknown',
                tags: ['Excel Import'],
                servings: 4,
                prep_time: 0,
                cook_time: 0,
                difficulty: 'Medium',
                source: file.name,
                imported_at: new Date().toISOString()
            };
        }
        
        // Parse Word recipe
        async parseWordRecipe(file) {
            // This would use Mammoth.js or similar library
            return {
                id: Date.now() + Math.random(),
                name: file.name.replace('.docx', '').replace('.doc', ''),
                description: 'Imported from Word',
                ingredients: [],
                instructions: [],
                category: 'Imported',
                cuisine: 'Unknown',
                tags: ['Word Import'],
                servings: 4,
                prep_time: 0,
                cook_time: 0,
                difficulty: 'Medium',
                source: file.name,
                imported_at: new Date().toISOString()
            };
        }
        
        // Parse text recipe
        async parseTextRecipe(file) {
            const text = await file.text();
            
            // Basic text parsing (you can enhance this)
            const lines = text.split('\n').filter(line => line.trim());
            const recipe = {
                id: Date.now() + Math.random(),
                name: file.name.replace('.txt', ''),
                description: '',
                ingredients: [],
                instructions: [],
                category: 'Imported',
                cuisine: 'Unknown',
                tags: ['Text Import'],
                servings: 4,
                prep_time: 0,
                cook_time: 0,
                difficulty: 'Medium',
                source: file.name,
                imported_at: new Date().toISOString()
            };
            
            // Simple parsing logic
            let inIngredients = false;
            let inInstructions = false;
            
            for (let line of lines) {
                line = line.trim();
                if (!line) continue;
                
                if (line.toLowerCase().includes('ingredients')) {
                    inIngredients = true;
                    inInstructions = false;
                    continue;
                }
                
                if (line.toLowerCase().includes('instructions') || line.toLowerCase().includes('directions')) {
                    inIngredients = false;
                    inInstructions = true;
                    continue;
                }
                
                if (inIngredients) {
                    recipe.ingredients.push({ name: line, amount: '', unit: '' });
                } else if (inInstructions) {
                    recipe.instructions.push(line);
                } else {
                    recipe.description += line + ' ';
                }
            }
            
            return recipe;
        }
        
        // Show upload progress
        showUploadProgress() {
            const progressDiv = document.getElementById('upload-progress');
            if (progressDiv) {
                progressDiv.classList.remove('hidden');
            }
        }
        
        // Update upload progress
        updateUploadProgress() {
            const progressBar = document.getElementById('upload-progress-bar');
            const progressText = document.getElementById('upload-progress-text');
            
            if (!progressBar || !progressText) return;
            
            const total = this.uploadQueue.length;
            const completed = this.uploadQueue.filter(item => item.status === 'completed').length;
            const failed = this.uploadQueue.filter(item => item.status === 'failed').length;
            const processing = this.uploadQueue.filter(item => item.status === 'processing').length;
            
            const progress = (completed + failed) / total * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${completed}/${total} completed (${failed} failed)`;
            
            if (completed + failed === total) {
                setTimeout(() => {
                    this.hideUploadProgress();
                }, 2000);
            }
        }
        
        // Hide upload progress
        hideUploadProgress() {
            const progressDiv = document.getElementById('upload-progress');
            if (progressDiv) {
                progressDiv.classList.add('hidden');
            }
        }
        
        // Show upload complete
        showUploadComplete() {
            const completed = this.uploadQueue.filter(item => item.status === 'completed').length;
            const failed = this.uploadQueue.filter(item => item.status === 'failed').length;
            
            if (completed > 0) {
                this.showNotification(`Successfully imported ${completed} recipes!`, 'success');
            }
            
            if (failed > 0) {
                this.showNotification(`${failed} recipes failed to import. Check the console for details.`, 'error');
            }
            
            // Clear upload queue
            this.uploadQueue = [];
        }
        
        // Load recipe library from localStorage
        loadRecipeLibrary() {
            // Use user-specific data manager
            if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
                this.recipes = window.userDataManager.getUserRecipes();
            } else {
                // Fallback to old method
                const currentUser = this.getCurrentUser();
                if (!currentUser) return;
                
                this.recipes = JSON.parse(localStorage.getItem(`recipe_library_${currentUser.id}`) || '[]');
            }
            this.displayRecipes();
        }
        
        // Save recipe library to localStorage
        saveRecipeLibrary() {
            // Use user-specific data manager
            if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
                window.userDataManager.saveUserRecipes(this.recipes);
            } else {
                // Fallback to old method
                const currentUser = this.getCurrentUser();
                if (!currentUser) return;
                
                localStorage.setItem(`recipe_library_${currentUser.id}`, JSON.stringify(this.recipes));
            }
        }
        
        // Display recipes with current filters
        displayRecipes() {
            const container = document.getElementById('recipe-library-container');
            if (!container) return;
            
            const filteredRecipes = this.getFilteredRecipes();
            
            if (filteredRecipes.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <div class="text-6xl mb-4">📚</div>
                        <h3 class="text-xl font-semibold text-gray-700 mb-2">No recipes found</h3>
                        <p class="text-gray-500 mb-4">Try adjusting your filters or upload some recipes</p>
                        <button onclick="recipeLibrary.showBulkUploadModal()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg">
                            Upload Recipes
                        </button>
                    </div>
                `;
                return;
            }
            
            const viewMode = localStorage.getItem('recipe_view_mode') || 'grid';
            container.innerHTML = '';
            
            filteredRecipes.forEach(recipe => {
                const recipeCard = this.createRecipeCard(recipe, viewMode);
                container.appendChild(recipeCard);
            });
            
            // Update recipe count
            const countElement = document.getElementById('recipe-count');
            if (countElement) {
                countElement.textContent = `${filteredRecipes.length} of ${this.recipes.length} recipes`;
            }
        }
        
        // Create recipe card
        createRecipeCard(recipe, viewMode) {
            const card = document.createElement('div');
            
            if (viewMode === 'list') {
                card.className = 'bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow';
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-800 mb-2">${recipe.name}</h3>
                            <p class="text-sm text-gray-600 mb-2">${recipe.description}</p>
                            <div class="flex gap-2 text-xs text-gray-500">
                                <span>${recipe.category}</span>
                                <span>•</span>
                                <span>${recipe.cuisine}</span>
                                <span>•</span>
                                <span>${recipe.servings} servings</span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="edit-recipe bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm" data-id="${recipe.id}">
                                ✏️ Edit
                            </button>
                            <button class="scale-recipe bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm" data-id="${recipe.id}">
                                📏 Scale
                            </button>
                            <button class="delete-recipe bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" data-id="${recipe.id}">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
            } else {
                card.className = 'bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow';
                card.innerHTML = `
                    <div class="mb-3">
                        <h3 class="font-semibold text-gray-800 mb-2">${recipe.name}</h3>
                        <p class="text-sm text-gray-600 mb-3">${recipe.description.substring(0, 100)}${recipe.description.length > 100 ? '...' : ''}</p>
                        <div class="flex gap-2 text-xs text-gray-500 mb-3">
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">${recipe.category}</span>
                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded">${recipe.cuisine}</span>
                        </div>
                        <div class="text-sm text-gray-600">
                            <span>👥 ${recipe.servings} servings</span>
                            <span class="ml-3">⏱️ ${recipe.prep_time + recipe.cook_time} min</span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="edit-recipe bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex-1" data-id="${recipe.id}">
                            ✏️ Edit
                        </button>
                        <button class="scale-recipe bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex-1" data-id="${recipe.id}">
                            📏 Scale
                        </button>
                        <button class="delete-recipe bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" data-id="${recipe.id}">
                            🗑️
                        </button>
                    </div>
                `;
            }
            
            // Add event listeners
            const editBtn = card.querySelector('.edit-recipe');
            const scaleBtn = card.querySelector('.scale-recipe');
            const deleteBtn = card.querySelector('.delete-recipe');
            
            editBtn.addEventListener('click', () => this.editRecipe(recipe.id));
            scaleBtn.addEventListener('click', () => this.scaleRecipe(recipe.id));
            deleteBtn.addEventListener('click', () => this.deleteRecipe(recipe.id));
            
            return card;
        }
        
        // Get filtered recipes
        getFilteredRecipes() {
            let filtered = [...this.recipes];
            
            // Search filter
            const searchTerm = document.getElementById('recipe-library-search')?.value.toLowerCase();
            if (searchTerm) {
                filtered = filtered.filter(recipe => 
                    recipe.name.toLowerCase().includes(searchTerm) ||
                    recipe.description.toLowerCase().includes(searchTerm) ||
                    recipe.category.toLowerCase().includes(searchTerm) ||
                    recipe.cuisine.toLowerCase().includes(searchTerm)
                );
            }
            
            // Category filter
            const categoryFilter = document.getElementById('recipe-category-filter')?.value;
            if (categoryFilter) {
                filtered = filtered.filter(recipe => recipe.category === categoryFilter);
            }
            
            // Cuisine filter
            const cuisineFilter = document.getElementById('recipe-cuisine-filter')?.value;
            if (cuisineFilter) {
                filtered = filtered.filter(recipe => recipe.cuisine === cuisineFilter);
            }
            
            return filtered;
        }
        
        // Filter recipes
        filterRecipes() {
            this.displayRecipes();
        }
        
        // Sort recipes
        sortRecipes() {
            const sortBy = document.getElementById('recipe-sort-by')?.value;
            if (!sortBy) return;
            
            this.recipes.sort((a, b) => {
                switch (sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'category':
                        return a.category.localeCompare(b.category);
                    case 'cuisine':
                        return a.cuisine.localeCompare(b.cuisine);
                    case 'servings':
                        return a.servings - b.servings;
                    case 'time':
                        return (a.prep_time + a.cook_time) - (b.prep_time + b.cook_time);
                    case 'date':
                        return new Date(b.imported_at) - new Date(a.imported_at);
                    default:
                        return 0;
                }
            });
            
            this.displayRecipes();
        }
        
        // Change view mode
        changeViewMode(mode) {
            localStorage.setItem('recipe_view_mode', mode);
            
            // Update active button
            document.querySelectorAll('.view-mode-btn').forEach(btn => {
                btn.classList.remove('bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });
            
            const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
            if (activeBtn) {
                activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
                activeBtn.classList.add('bg-blue-500', 'text-white');
            }
            
            this.displayRecipes();
        }
        
        // Edit recipe
        editRecipe(recipeId) {
            const recipe = this.recipes.find(r => r.id === recipeId);
            if (!recipe) return;
            
            // Populate the recipe form
            this.populateRecipeForm(recipe);
            
            // Show the recipe form modal
            const modal = document.getElementById('recipe-modal');
            if (modal) {
                modal.classList.remove('hidden');
            }
        }
        
        // Scale recipe
        scaleRecipe(recipeId) {
            const recipe = this.recipes.find(r => r.id === recipeId);
            if (!recipe) return;
            
            // Use the existing scaling system
            if (window.recipeScaler) {
                window.recipeScaler.loadRecipeForScaling(recipe);
            }
        }
        
        // Delete recipe
        deleteRecipe(recipeId) {
            if (!confirm('Are you sure you want to delete this recipe?')) return;
            
            const recipe = this.recipes.find(r => r.id === recipeId);
            if (recipe) {
                this.addRecipeChange('Deleted', recipe.name, 'Recipe removed from library');
            }
            
            this.recipes = this.recipes.filter(r => r.id !== recipeId);
            this.saveRecipeLibrary();
            this.displayRecipes();
            
            this.showNotification('Recipe deleted successfully', 'success');
        }
        
        // Export recipe library
        exportRecipeLibrary() {
            const dataStr = JSON.stringify(this.recipes, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `recipe-library-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showNotification('Recipe library exported successfully', 'success');
        }
        
        // Import recipe library
        importRecipeLibrary() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedRecipes = JSON.parse(e.target.result);
                        this.recipes = [...this.recipes, ...importedRecipes];
                        this.saveRecipeLibrary();
                        this.displayRecipes();
                        
                        this.showNotification(`Imported ${importedRecipes.length} recipes successfully`, 'success');
                    } catch (error) {
                        this.showNotification('Error importing recipe library', 'error');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        }
        
        // Populate recipe form
        populateRecipeForm(recipe) {
            document.getElementById('recipe-title').value = recipe.name;
            document.getElementById('recipe-description').value = recipe.description;
            document.getElementById('recipe-category').value = recipe.category;
            document.getElementById('recipe-cuisine').value = recipe.cuisine;
            document.getElementById('recipe-servings').value = recipe.servings;
            document.getElementById('recipe-prep-time').value = recipe.prep_time;
            document.getElementById('recipe-cook-time').value = recipe.cook_time;
            document.getElementById('recipe-difficulty').value = recipe.difficulty;
            
            // Populate ingredients
            const ingredientsContainer = document.getElementById('ingredients-container');
            if (ingredientsContainer) {
                ingredientsContainer.innerHTML = '';
                recipe.ingredients.forEach(ingredient => {
                    this.addIngredientToForm(ingredient);
                });
            }
            
            // Populate instructions
            const instructionsContainer = document.getElementById('instructions-container');
            if (instructionsContainer) {
                instructionsContainer.innerHTML = '';
                recipe.instructions.forEach(instruction => {
                    this.addInstructionToForm(instruction);
                });
            }
        }
        
        // Add ingredient to form
        addIngredientToForm(ingredient) {
            const container = document.getElementById('ingredients-container');
            if (!container) return;
            
            const ingredientDiv = document.createElement('div');
            ingredientDiv.className = 'flex gap-2 mb-2';
            ingredientDiv.innerHTML = `
                <input type="text" placeholder="Ingredient name" value="${ingredient.name}" class="notebook-input flex-1">
                <input type="number" placeholder="Amount" value="${ingredient.amount}" step="0.01" min="0" class="notebook-input w-24">
                <select class="notebook-input w-24">
                    <option value="">Unit</option>
                    <option value="g" ${ingredient.unit === 'g' ? 'selected' : ''}>g</option>
                    <option value="kg" ${ingredient.unit === 'kg' ? 'selected' : ''}>kg</option>
                    <option value="ml" ${ingredient.unit === 'ml' ? 'selected' : ''}>ml</option>
                    <option value="L" ${ingredient.unit === 'L' ? 'selected' : ''}>L</option>
                    <option value="cup" ${ingredient.unit === 'cup' ? 'selected' : ''}>cup</option>
                    <option value="tbsp" ${ingredient.unit === 'tbsp' ? 'selected' : ''}>tbsp</option>
                    <option value="tsp" ${ingredient.unit === 'tsp' ? 'selected' : ''}>tsp</option>
                    <option value="each" ${ingredient.unit === 'each' ? 'selected' : ''}>each</option>
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
        
        // Add instruction to form
        addInstructionToForm(instruction) {
            const container = document.getElementById('instructions-container');
            if (!container) return;
            
            const instructionDiv = document.createElement('div');
            instructionDiv.className = 'mb-3';
            instructionDiv.innerHTML = `
                <textarea placeholder="Instruction step" class="notebook-textarea w-full" rows="2">${instruction}</textarea>
                <button type="button" class="remove-instruction bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm mt-1">Remove</button>
            `;
            
            container.appendChild(instructionDiv);
            
            // Add event listener to remove button
            const removeBtn = instructionDiv.querySelector('.remove-instruction');
            removeBtn.addEventListener('click', () => {
                instructionDiv.remove();
            });
        }
        
        // Get current user
        getCurrentUser() {
            const currentUser = localStorage.getItem('current_user');
            return currentUser ? JSON.parse(currentUser) : null;
        }
        
        // Get all recipes (for external systems)
        getAllRecipes() {
            return this.recipes || [];
        }
        
        // Show notification
        showNotification(message, type = 'info') {
            console.log(`${type.toUpperCase()}: ${message}`);
            
            if (typeof showNotification === 'function') {
                showNotification(message, type);
            } else {
                alert(message);
            }
        }
    }
    
    // --- Unified Recipe Review Logic ---
    class RecipeReviewManager {
        constructor() {
            this.pendingRecipes = [];
            this.selectedRecipes = new Set();
            this.currentFilePreview = null;
            this.init();
        }
        init() {
            this.setupEventListeners();
        }
        setupEventListeners() {
            const reviewBtn = document.getElementById('review-recipes-btn');
            if (reviewBtn) {
                reviewBtn.addEventListener('click', () => this.showPendingReviews());
            }
            const closeBtn = document.getElementById('close-review-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideReviewModal());
            }
            const selectAllBtn = document.getElementById('select-all-recipes');
            if (selectAllBtn) selectAllBtn.addEventListener('click', () => this.selectAllRecipes());
            const clearSelectionBtn = document.getElementById('clear-selection');
            if (clearSelectionBtn) clearSelectionBtn.addEventListener('click', () => this.clearSelection());
            const approveSelectedBtn = document.getElementById('approve-selected-recipes');
            if (approveSelectedBtn) approveSelectedBtn.addEventListener('click', () => this.batchReview('approve'));
            const rejectSelectedBtn = document.getElementById('reject-selected-recipes');
            if (rejectSelectedBtn) rejectSelectedBtn.addEventListener('click', () => this.batchReview('reject'));
        }
        showPendingReviews() {
            const modal = document.getElementById('review-modal');
            if (modal) {
                modal.classList.remove('hidden');
                this.loadPendingReviews();
            }
        }
        hideReviewModal() {
            const modal = document.getElementById('review-modal');
            if (modal) {
                modal.classList.add('hidden');
                this.selectedRecipes.clear();
            }
        }
        async loadPendingReviews() {
            let pendingLocal = [];
            try {
                pendingLocal = JSON.parse(localStorage.getItem('pendingRecipes') || '[]').map(r => ({ ...r, _source: 'Uploaded' }));
            } catch (e) { pendingLocal = []; }
            let pendingDB = [];
            try {
                const response = await fetch('/api/recipes/review/pending');
                if (response.ok) {
                    const data = await response.json();
                    pendingDB = (data.recipes || []).map(r => ({ ...r, _source: 'Database' }));
                }
            } catch (e) { pendingDB = []; }
            this.pendingRecipes = [...pendingLocal, ...pendingDB];
            this.displayPendingReviews();
            this.updateSelectionUI();
        }
        displayPendingReviews() {
            const container = document.getElementById('pending-reviews-container');
            if (!container) return;
            if (this.pendingRecipes.length === 0) {
                container.innerHTML = '<div class="text-center py-12"><div class="text-6xl mb-4">✅</div><h3 class="text-xl font-semibold text-gray-700 mb-2">No recipes pending review</h3><p class="text-gray-500">All uploaded recipes have been reviewed!</p></div>';
                return;
            }
            container.innerHTML = '';
            this.pendingRecipes.forEach((recipe, idx) => {
                const card = document.createElement('div');
                card.className = 'mb-8 p-4 border rounded shadow-sm bg-gray-50';
                card.innerHTML = `
                    <div class="mb-2 flex justify-between items-center">
                      <span class="font-semibold">Source: ${recipe._source}${recipe.sourceFile ? ' (' + recipe.sourceFile + ')' : ''}</span>
                      <span class="text-sm text-red-600">${(!recipe.title && !recipe.name) || !(recipe.ingredients && recipe.ingredients.length) || !(recipe.instructions || recipe.steps) ? 'Missing fields' : 'Ready to approve'}</span>
                    </div>
                    <label class="block font-medium">Title
                      <input type="text" class="mt-1 block w-full border rounded px-2 py-1" value="${recipe.title || recipe.name || ''}" data-field="title" data-idx="${idx}" data-source="${recipe._source}" />
                    </label>
                    <label class="block font-medium mt-2">Ingredients
                      <textarea class="mt-1 block w-full border rounded px-2 py-1" rows="3" data-field="ingredients" data-idx="${idx}" data-source="${recipe._source}">${(recipe.ingredients||[]).map(i=>typeof i==="string"?i:(i.name||'')).join('\n')}</textarea>
                    </label>
                    <label class="block font-medium mt-2">Instructions
                      <textarea class="mt-1 block w-full border rounded px-2 py-1" rows="4" data-field="instructions" data-idx="${idx}" data-source="${recipe._source}">${(recipe.instructions||recipe.steps||[]).join('\n')}</textarea>
                    </label>
                    <div class="mt-3 flex gap-2">
                      <button class="approve-btn px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" data-idx="${idx}" data-source="${recipe._source}" data-id="${recipe.id||''}">Approve</button>
                      <button class="reject-btn px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" data-idx="${idx}" data-source="${recipe._source}" data-id="${recipe.id||''}">Reject</button>
                    </div>
                `;
                container.appendChild(card);
            });
            // Add event listeners for approve/reject and input changes
            container.querySelectorAll('input[data-field], textarea[data-field]').forEach(el => {
                el.addEventListener('input', (e) => {
                    const idx = +el.dataset.idx;
                    const field = el.dataset.field;
                    const source = el.dataset.source;
                    if (source === 'Uploaded') {
                        let pending = JSON.parse(localStorage.getItem('pendingRecipes') || '[]');
                        if (field === 'ingredients' || field === 'instructions') {
                            pending[idx][field] = el.value.split('\n').map(l => l.trim()).filter(Boolean);
                        } else {
                            pending[idx][field] = el.value;
                        }
                        localStorage.setItem('pendingRecipes', JSON.stringify(pending));
                        this.loadPendingReviews();
                    }
                });
            });
            container.querySelectorAll('.approve-btn').forEach(btn => {
                btn.onclick = async () => {
                    const idx = +btn.dataset.idx;
                    const source = btn.dataset.source;
                    const id = btn.dataset.id;
                    if (source === 'Uploaded') {
                        let pending = JSON.parse(localStorage.getItem('pendingRecipes') || '[]');
                        const recipe = pending[idx];
                        const payload = {
                            title: recipe.title || recipe.name,
                            ingredients: (recipe.ingredients||[]).map(i=>typeof i==="string"?{name:i,amount:0,unit:''}:i),
                            instructions: (recipe.instructions||recipe.steps||[]).map(i=>typeof i==="string"?{instruction:i}:i),
                            status: 'pending',
                            author_id: getCurrentUserId(), // Add author_id
                        };
                        const res = await fetch('/api/recipes/', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        if (res.ok) {
                            pending.splice(idx, 1);
                            localStorage.setItem('pendingRecipes', JSON.stringify(pending));
                            this.loadPendingReviews();
                        } else {
                            alert('Failed to save recipe to database.');
                        }
                    } else {
                        const res = await fetch(`/api/recipes/${id}/review`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'approved', author_id: getCurrentUserId() }) // Add author_id
                        });
                        if (res.ok) this.loadPendingReviews();
                        else alert('Failed to approve recipe.');
                    }
                };
            });
            container.querySelectorAll('.reject-btn').forEach(btn => {
                btn.onclick = async () => {
                    const idx = +btn.dataset.idx;
                    const source = btn.dataset.source;
                    const id = btn.dataset.id;
                    if (source === 'Uploaded') {
                        let pending = JSON.parse(localStorage.getItem('pendingRecipes') || '[]');
                        pending.splice(idx, 1);
                        localStorage.setItem('pendingRecipes', JSON.stringify(pending));
                        this.loadPendingReviews();
                    } else {
                        const res = await fetch(`/api/recipes/${id}/review`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'rejected', author_id: getCurrentUserId() }) // Add author_id
                        });
                        if (res.ok) this.loadPendingReviews();
                        else alert('Failed to reject recipe.');
                    }
                };
            });
        }
        selectAllRecipes() {
            this.selectedRecipes = new Set(this.pendingRecipes.map((_, idx) => idx));
            this.updateSelectionUI();
            this.displayPendingReviews();
        }
        clearSelection() {
            this.selectedRecipes.clear();
            this.updateSelectionUI();
            this.displayPendingReviews();
        }
        batchReview(action) {
            const selected = Array.from(this.selectedRecipes);
            if (!selected.length) return;
            selected.forEach(idx => {
                const recipe = this.pendingRecipes[idx];
                if (action === 'approve') {
                    document.querySelectorAll('.approve-btn')[idx].click();
                } else {
                    document.querySelectorAll('.reject-btn')[idx].click();
                }
            });
            this.clearSelection();
        }
        updateSelectionUI() {
            const selectionText = document.getElementById('selection-text');
            if (selectionText) {
                selectionText.textContent = `${this.selectedRecipes.size} of ${this.pendingRecipes.length} recipes selected`;
            }
        }
    }
    
    // --- Bulk Upload Integration: Advanced Backend Parsing ---
    // Helper: Parse and preview uploaded files using backend endpoints
    async function parseAndPreviewFiles(files, previewContainer, progressBar, progressText) {
        let parsedResults = [];
        let completed = 0;
        for (const file of files) {
            let parsedData = null;
            try {
                if (file.type === 'application/pdf') {
                    // PDF: extract text client-side, then send to backend parser
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += content.items.map(item => item.str).join(' ') + '\n';
                    }
                    const response = await fetch('/api/uploads/parse-text', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text })
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    parsedData = await response.json();
                } else if (file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
                    // Excel/CSV: send to backend extract-text endpoint
                    const formData = new FormData();
                    formData.append('file', file);
                    const response = await fetch('/api/uploads/extract-text', {
                        method: 'POST',
                        body: formData
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const result = await response.json();
                    parsedData = result.parsed_data || result;
                } else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
                    // Word: send to backend extract-text endpoint
                    const formData = new FormData();
                    formData.append('file', file);
                    const response = await fetch('/api/uploads/extract-text', {
                        method: 'POST',
                        body: formData
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const result = await response.json();
                    parsedData = result.parsed_data || result;
                } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                    // Text: send to backend parse-text endpoint
                    const text = await file.text();
                    const response = await fetch('/api/uploads/parse-text', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text })
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    parsedData = await response.json();
                } else {
                    throw new Error('Unsupported file type: ' + file.name);
                }
                parsedData.sourceFile = file.name;
                parsedData.status = 'pending';
                parsedResults.push(parsedData);
            } catch (err) {
                parsedResults.push({ error: err.message, sourceFile: file.name });
            }
            completed++;
            if (progressBar && progressText) {
                const percent = Math.round((completed / files.length) * 100);
                progressBar.style.width = percent + '%';
                progressText.textContent = `${completed}/${files.length} completed`;
            }
        }
        // Show preview
        if (previewContainer) {
            previewContainer.innerHTML = parsedResults.map(r => {
                if (r.error) {
                    return `<div class='bg-red-100 border border-red-300 rounded p-2 mb-2'><strong>Error:</strong> ${r.sourceFile}: ${r.error}</div>`;
                }
                return `<div class='bg-green-50 border border-green-200 rounded p-2 mb-2'><strong>${r.title || r.sourceFile}</strong><br>Ingredients: ${r.ingredients ? r.ingredients.length : 0}, Instructions: ${r.instructions ? r.instructions.length : 0}</div>`;
            }).join('');
        }
        return parsedResults;
    }

    // --- Patch RecipeLibrary class to use advanced upload logic ---
    RecipeLibrary.prototype.handleFileUpload = async function(event, inputId) {
        const files = event.target.files;
        if (!files.length) return;
        // Show progress UI
        const progressDiv = document.getElementById('upload-progress');
        const progressBar = document.getElementById('upload-progress-bar');
        const progressText = document.getElementById('upload-progress-text');
        const previewDiv = document.getElementById('upload-preview');
        const previewContainer = document.getElementById('preview-container');
        if (progressDiv) progressDiv.classList.remove('hidden');
        if (previewDiv) previewDiv.classList.remove('hidden');
        // Parse and preview
        const parsedResults = await parseAndPreviewFiles(Array.from(files), previewContainer, progressBar, progressText);
        // Store in localStorage for review
        let pending = JSON.parse(localStorage.getItem('pendingRecipes') || '[]');
        pending = pending.concat(parsedResults.filter(r => !r.error));
        localStorage.setItem('pendingRecipes', JSON.stringify(pending));
        // Hide progress after short delay
        setTimeout(() => { if (progressDiv) progressDiv.classList.add('hidden'); }, 1500);
    };

    // --- Confirm Import Button ---
    const confirmImportBtn = document.getElementById('confirm-upload');
    if (confirmImportBtn) {
        confirmImportBtn.addEventListener('click', () => {
            // Move all pendingRecipes to the main library and clear preview
            let pending = JSON.parse(localStorage.getItem('pendingRecipes') || '[]');
            if (window.recipeLibrary && pending.length) {
                for (const recipe of pending) {
                    window.recipeLibrary.recipes.push(recipe);
                }
                window.recipeLibrary.saveRecipeLibrary();
                window.recipeLibrary.displayRecipes();
            }
            localStorage.setItem('pendingRecipes', '[]');
            const previewDiv = document.getElementById('upload-preview');
            if (previewDiv) previewDiv.classList.add('hidden');
            window.recipeLibrary.showNotification(`Imported ${pending.length} recipes!`, 'success');
        });
    }
    // --- Cancel Import Button ---
    const cancelImportBtn = document.getElementById('cancel-upload');
    if (cancelImportBtn) {
        cancelImportBtn.addEventListener('click', () => {
            const previewDiv = document.getElementById('upload-preview');
            if (previewDiv) previewDiv.classList.add('hidden');
        });
    }
    
    // Utility function for debouncing
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function updateUserInfo() {
        const userInfo = document.getElementById('user-info');
        if (!userInfo) return;
        const username = localStorage.getItem('username');
        userInfo.textContent = username ? username : 'Guest';
    }
    document.addEventListener('DOMContentLoaded', updateUserInfo);
    
    // Initialize recipe library when DOM is loaded
    let recipeLibrary;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            recipeLibrary = new RecipeLibrary();
        });
    } else {
        recipeLibrary = new RecipeLibrary();
    }
    
    // Export for use in other scripts
    window.RecipeLibrary = RecipeLibrary;
    window.recipeLibrary = recipeLibrary;
    window.recipeReviewManager = new RecipeReviewManager();
} 