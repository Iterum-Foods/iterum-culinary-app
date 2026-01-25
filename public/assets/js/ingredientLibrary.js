// Ingredient Library Management System for Iterum R&D Chef Notebook
// Handles ingredient CRUD operations, search, filtering, and management

class IngredientLibrary {
    constructor() {
        this.ingredients = [];
        this.categories = [];
        this.units = [];
        this.currentView = 'grid';
        this.currentFilters = {
            search: '',
            category: '',
            unit: '',
            sort: 'name'
        };
        this.displayMode = 'all';
        
        this.init();
    }
    
    init() {
        this.initializeCategories();
        this.initializeUnits();
        this.setupEventListeners();
        this.loadIngredients();
        this.loadDefaultIngredientDatabase();
    }
    
    initializeCategories() {
        this.categories = [
            'Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Spices',
            'Bakery', 'Beverages', 'Frozen', 'Canned', 'Dried'
        ];
    }
    
    initializeUnits() {
        this.units = [
            'g', 'kg', 'ml', 'L', 'cup', 'tbsp', 'tsp', 'each', 'oz', 'lb'
        ];
    }
    
    setupEventListeners() {
        // Add ingredient button
        const addIngredientBtn = document.getElementById('add-ingredient-btn');
        if (addIngredientBtn) {
            addIngredientBtn.addEventListener('click', () => this.showIngredientForm());
        }
        
        // Add first ingredient button
        const addFirstIngredientBtn = document.getElementById('add-first-ingredient');
        if (addFirstIngredientBtn) {
            addFirstIngredientBtn.addEventListener('click', () => this.showIngredientForm());
        }
        
        // URL import ingredient button
        const urlImportBtn = document.getElementById('url-import-ingredient-btn');
        if (urlImportBtn) {
            urlImportBtn.addEventListener('click', () => this.showURLImportModal());
        }
        
        // Import/Export buttons
        const importCsvBtn = document.getElementById('import-ingredients-csv');
        if (importCsvBtn) {
            importCsvBtn.addEventListener('click', () => this.importFromCSV());
        }
        
        const exportBtn = document.getElementById('export-ingredients');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportIngredients());
        }
        
        // Add via link button
        const addViaLinkBtn = document.getElementById('add-ingredient-via-link');
        if (addViaLinkBtn) {
            addViaLinkBtn.addEventListener('click', () => this.showAddViaLinkModal());
        }
        
        // Edit all items button
        const editAllBtn = document.getElementById('edit-all-ingredients');
        if (editAllBtn) {
            editAllBtn.addEventListener('click', () => this.showEditAllModal());
        }
        
        // Search and filters
        const searchInput = document.getElementById('ingredient-search');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => this.filterIngredients(), 300));
        }
        
        const categoryFilter = document.getElementById('ingredient-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterIngredients());
        }
        
        const unitFilter = document.getElementById('ingredient-unit-filter');
        if (unitFilter) {
            unitFilter.addEventListener('change', () => this.filterIngredients());
        }
        
        const sortSelect = document.getElementById('ingredient-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.sortIngredients());
        }
        
        // View mode buttons
        const viewButtons = ['ingredient-grid-view', 'ingredient-list-view', 'ingredient-table-view'];
        viewButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => this.changeViewMode(id));
            }
        });
        
        // Display options
        const displayOptions = document.getElementById('ingredient-display-options');
        if (displayOptions) {
            displayOptions.addEventListener('change', () => this.changeDisplayMode());
        }
        
        // Category filter buttons
        const categoryButtons = [
            'show-all-ingredients', 'show-produce', 'show-dairy', 'show-meat',
            'show-seafood', 'show-pantry', 'show-spices'
        ];
        categoryButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => this.filterByCategory(id));
            }
        });
        
        // Clear filters
        const clearFiltersBtn = document.getElementById('clear-ingredient-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
        
        // Form handling
        const ingredientForm = document.getElementById('ingredient-form');
        if (ingredientForm) {
            ingredientForm.addEventListener('submit', (e) => this.saveIngredient(e));
        }
        
        const cancelFormBtn = document.getElementById('cancel-ingredient-form');
        if (cancelFormBtn) {
            cancelFormBtn.addEventListener('click', () => this.hideIngredientForm());
        }
    }
    
    async loadIngredients() {
        try {
            const token = localStorage.getItem('iterum_auth_token');
            const userId = (window.userDataManager && window.userDataManager.getCurrentUserId) ? window.userDataManager.getCurrentUserId() : (JSON.parse(localStorage.getItem('current_user')||'{}').id || null);
            if (!token) {
                console.log('No auth token, loading from localStorage');
                this.loadFromLocalStorage();
                return;
            }
            let url = '/api/data/ingredients';
            if (userId) url += `?user_id=${encodeURIComponent(userId)}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.ingredients = data.ingredients || [];
                    // Also store categories for UI
                    this.categories = data.categories || this.categories;
                } else {
                    this.ingredients = data.ingredients || data || [];
                }
                this.updateIngredientCount();
                this.displayIngredients();
            } else {
                console.log('Failed to load from API, using localStorage');
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading ingredients:', error);
            this.loadFromLocalStorage();
        }
    }
    
    loadFromLocalStorage() {
        // Use user-specific file storage first, fallback to localStorage
        if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
            const userId = window.userDataManager.getCurrentUserId();
            const filename = `user_${userId}_ingredients.json`;
            this.ingredients = window.userDataManager.loadUserFile(filename) || [];
            console.log(`🥬 Loaded ${this.ingredients.length} ingredients from user file`);
        } else {
            // Fallback to global storage for backward compatibility
            this.ingredients = JSON.parse(localStorage.getItem('iterum_ingredients') || '[]');
            console.log(`🥬 Loaded ${this.ingredients.length} ingredients from localStorage`);
        }
        this.updateIngredientCount();
        this.displayIngredients();
    }
    
    async saveIngredient(event) {
        event.preventDefault();
        
        const formData = this.getFormData();
        if (!formData.name) {
            alert('Please enter an ingredient name');
            return;
        }
        
        try {
            const token = localStorage.getItem('iterum_auth_token');
            let savedIngredient;
            const userId = (window.userDataManager && window.userDataManager.getCurrentUserId) ? window.userDataManager.getCurrentUserId() : (JSON.parse(localStorage.getItem('current_user')||'{}').id || null);
            if (token) {
                // Save to backend
                const response = await fetch('/api/ingredients/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...formData,
                        user_id: userId
                    })
                });
                
                if (response.ok) {
                    savedIngredient = await response.json();
                } else {
                    throw new Error('Failed to save to backend');
                }
            } else {
                // Save to localStorage
                savedIngredient = {
                    id: Date.now(),
                    ...formData,
                    created_at: new Date().toISOString()
                };
                this.ingredients.push(savedIngredient);
                this.saveToLocalStorage();
            }
            
            this.hideIngredientForm();
            this.displayIngredients();
            this.updateIngredientCount();
            
            // Show success message
            this.showNotification('Ingredient saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving ingredient:', error);
            this.showNotification('Failed to save ingredient', 'error');
        }
    }
    
    getFormData() {
        const name = document.getElementById('ingredient-name')?.value.trim() || '';
        const category = document.getElementById('ingredient-category')?.value || '';
        const unit = document.getElementById('ingredient-unit')?.value || '';
        const description = document.getElementById('ingredient-description')?.value.trim() || '';
        
        // Get vendor information
        const primaryVendor = document.getElementById('ingredient-primary-vendor')?.value.trim() || '';
        const alternateVendors = document.getElementById('ingredient-alternate-vendors')?.value.trim() || '';
        const vendorSKU = document.getElementById('ingredient-vendor-sku')?.value.trim() || '';
        const unitPrice = parseFloat(document.getElementById('ingredient-unit-price')?.value) || 0;
        const packSize = document.getElementById('ingredient-pack-size')?.value.trim() || '';
        const leadTime = document.getElementById('ingredient-lead-time')?.value.trim() || '';
        const minimumOrder = document.getElementById('ingredient-minimum-order')?.value.trim() || '';
        
        // Get allergens
        const allergenCheckboxes = document.querySelectorAll('#ingredient-form input[type="checkbox"]:checked');
        const allergens = Array.from(allergenCheckboxes).map(cb => cb.value);
        
        // Get nutritional info
        const nutritionalInfo = {
            calories: parseFloat(document.getElementById('nutrition-calories')?.value) || 0,
            protein: parseFloat(document.getElementById('nutrition-protein')?.value) || 0,
            carbs: parseFloat(document.getElementById('nutrition-carbs')?.value) || 0,
            fat: parseFloat(document.getElementById('nutrition-fat')?.value) || 0,
            fiber: parseFloat(document.getElementById('nutrition-fiber')?.value) || 0,
            sugar: parseFloat(document.getElementById('nutrition-sugar')?.value) || 0,
            sodium: parseFloat(document.getElementById('nutrition-sodium')?.value) || 0,
            iron: parseFloat(document.getElementById('nutrition-iron')?.value) || 0
        };
        
        // Vendor information object
        const vendorInfo = {
            primaryVendor: primaryVendor,
            alternateVendors: alternateVendors ? alternateVendors.split(',').map(v => v.trim()) : [],
            vendorSKU: vendorSKU,
            unitPrice: unitPrice,
            packSize: packSize,
            leadTime: leadTime,
            minimumOrder: minimumOrder
        };
        
        return {
            name,
            category,
            default_unit: unit,
            description,
            allergens,
            nutritional_info: nutritionalInfo,
            vendor_info: vendorInfo,
            primaryVendor: primaryVendor  // For easy access and sorting
        };
    }
    
    showIngredientForm(ingredient = null) {
        const form = document.getElementById('ingredient-form');
        if (!form) return;
        
        // Clear form
        form.reset();
        
        // Populate form if editing
        if (ingredient) {
            document.getElementById('ingredient-name').value = ingredient.name || '';
            document.getElementById('ingredient-category').value = ingredient.category || '';
            document.getElementById('ingredient-unit').value = ingredient.default_unit || '';
            document.getElementById('ingredient-description').value = ingredient.description || '';
            
            // Set allergens
            const allergens = ingredient.allergens || [];
            document.querySelectorAll('#ingredient-form input[type="checkbox"]').forEach(cb => {
                cb.checked = allergens.includes(cb.value);
            });
            
            // Set nutritional info
            const nutrition = ingredient.nutritional_info || {};
            document.getElementById('nutrition-calories').value = nutrition.calories || '';
            document.getElementById('nutrition-protein').value = nutrition.protein || '';
            document.getElementById('nutrition-carbs').value = nutrition.carbs || '';
            document.getElementById('nutrition-fat').value = nutrition.fat || '';
            document.getElementById('nutrition-fiber').value = nutrition.fiber || '';
            document.getElementById('nutrition-sugar').value = nutrition.sugar || '';
            document.getElementById('nutrition-sodium').value = nutrition.sodium || '';
            document.getElementById('nutrition-iron').value = nutrition.iron || '';
        }
        
        form.classList.remove('hidden');
        form.scrollIntoView({ behavior: 'smooth' });
    }
    
    hideIngredientForm() {
        const form = document.getElementById('ingredient-form');
        if (form) {
            form.classList.add('hidden');
        }
    }
    
    filterIngredients() {
        const searchTerm = document.getElementById('ingredient-search').value.toLowerCase();
        const categoryFilter = document.getElementById('ingredient-category-filter').value;
        const unitFilter = document.getElementById('ingredient-unit-filter').value;
        
        this.currentFilters.search = searchTerm;
        this.currentFilters.category = categoryFilter;
        this.currentFilters.unit = unitFilter;
        
        this.displayIngredients();
    }
    
    filterByCategory(buttonId) {
        const categoryMap = {
            'show-all-ingredients': '',
            'show-produce': 'Produce',
            'show-dairy': 'Dairy',
            'show-meat': 'Meat',
            'show-seafood': 'Seafood',
            'show-pantry': 'Pantry',
            'show-spices': 'Spices'
        };
        
        const category = categoryMap[buttonId] || '';
        document.getElementById('ingredient-category-filter').value = category;
        this.currentFilters.category = category;
        this.displayIngredients();
    }
    
    sortIngredients() {
        const sortBy = document.getElementById('ingredient-sort').value;
        this.currentFilters.sort = sortBy;
        this.displayIngredients();
    }
    
    changeViewMode(buttonId) {
        const viewMap = {
            'ingredient-grid-view': 'grid',
            'ingredient-list-view': 'list',
            'ingredient-table-view': 'table'
        };
        
        this.currentView = viewMap[buttonId] || 'grid';
        
        // Update button styles
        document.querySelectorAll('#ingredient-grid-view, #ingredient-list-view, #ingredient-table-view').forEach(btn => {
            btn.classList.remove('bg-blue-100', 'text-blue-700', 'border-2', 'border-blue-200');
            btn.classList.add('bg-gray-100', 'text-gray-700');
        });
        
        const activeBtn = document.getElementById(buttonId);
        if (activeBtn) {
            activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
            activeBtn.classList.add('bg-blue-100', 'text-blue-700', 'border-2', 'border-blue-200');
        }
        
        this.displayIngredients();
    }
    
    changeDisplayMode() {
        const displayOptions = document.getElementById('ingredient-display-options');
        this.displayMode = displayOptions.value;
        this.displayIngredients();
    }
    
    clearFilters() {
        document.getElementById('ingredient-search').value = '';
        document.getElementById('ingredient-category-filter').value = '';
        document.getElementById('ingredient-unit-filter').value = '';
        document.getElementById('ingredient-sort').value = 'name';
        
        this.currentFilters = {
            search: '',
            category: '',
            unit: '',
            sort: 'name'
        };
        
        this.displayIngredients();
    }
    
    displayIngredients() {
        const container = document.getElementById('ingredient-library-container');
        const noResults = document.getElementById('no-ingredients');
        
        if (!container) return;
        
        // Filter ingredients
        let filteredIngredients = this.ingredients.filter(ingredient => {
            const matchesSearch = !this.currentFilters.search || 
                ingredient.name.toLowerCase().includes(this.currentFilters.search) ||
                (ingredient.description && ingredient.description.toLowerCase().includes(this.currentFilters.search));
            
            const matchesCategory = !this.currentFilters.category || 
                ingredient.category === this.currentFilters.category;
            
            const matchesUnit = !this.currentFilters.unit || 
                ingredient.default_unit === this.currentFilters.unit;
            
            return matchesSearch && matchesCategory && matchesUnit;
        });
        
        // Sort ingredients
        filteredIngredients.sort((a, b) => {
            switch (this.currentFilters.sort) {
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'category':
                    return (a.category || '').localeCompare(b.category || '');
                case 'unit':
                    return (a.default_unit || '').localeCompare(b.default_unit || '');
                case 'date':
                    return new Date(b.created_at) - new Date(a.created_at);
                default:
                    return a.name.localeCompare(b.name);
            }
        });
        
        // Show/hide no results message
        if (filteredIngredients.length === 0) {
            container.innerHTML = '';
            if (noResults) noResults.classList.remove('hidden');
            return;
        }
        
        if (noResults) noResults.classList.add('hidden');
        
        // Display based on view mode
        switch (this.currentView) {
            case 'grid':
                container.innerHTML = this.renderGridView(filteredIngredients);
                break;
            case 'list':
                container.innerHTML = this.renderListView(filteredIngredients);
                break;
            case 'table':
                container.innerHTML = this.renderTableView(filteredIngredients);
                break;
        }
        
        // Add event listeners to ingredient cards
        this.addIngredientCardListeners();
    }
    
    renderGridView(ingredients) {
        return ingredients.map(ingredient => `
            <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer ingredient-card" data-id="${ingredient.id}">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-lg font-semibold text-gray-800">${ingredient.name}</h3>
                    <span class="text-sm text-gray-500">${ingredient.default_unit || 'N/A'}</span>
                </div>
                
                ${ingredient.category ? `<div class="text-sm text-gray-600 mb-2">📂 ${ingredient.category}</div>` : ''}
                
                ${ingredient.description ? `<p class="text-sm text-gray-700 mb-3">${ingredient.description}</p>` : ''}
                
                ${this.renderNutritionalInfo(ingredient)}
                ${this.renderAllergenInfo(ingredient)}
                
                <div class="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
                    <span class="text-xs text-gray-500">ID: ${ingredient.id}</span>
                    <div class="flex gap-2">
                        <button class="edit-ingredient bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm" data-id="${ingredient.id}">
                            ✏️ Edit
                        </button>
                        <button class="delete-ingredient bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" data-id="${ingredient.id}">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    renderListView(ingredients) {
        return ingredients.map(ingredient => `
            <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer ingredient-card" data-id="${ingredient.id}">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-800">${ingredient.name}</h3>
                        <div class="flex items-center gap-4 text-sm text-gray-600">
                            ${ingredient.category ? `<span>📂 ${ingredient.category}</span>` : ''}
                            ${ingredient.default_unit ? `<span>📏 ${ingredient.default_unit}</span>` : ''}
                            <span>🆔 ${ingredient.id}</span>
                        </div>
                        ${ingredient.description ? `<p class="text-sm text-gray-700 mt-2">${ingredient.description}</p>` : ''}
                    </div>
                    <div class="flex gap-2">
                        <button class="edit-ingredient bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm" data-id="${ingredient.id}">
                            ✏️ Edit
                        </button>
                        <button class="delete-ingredient bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" data-id="${ingredient.id}">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    renderTableView(ingredients) {
        const headers = ['Name', 'Category', 'Unit', 'Description', 'Allergens', 'Actions'];
        
        return `
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            ${headers.map(header => `<th class="px-4 py-3 text-left text-sm font-medium text-gray-700">${header}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${ingredients.map(ingredient => `
                            <tr class="border-t border-gray-200 hover:bg-gray-50 ingredient-card" data-id="${ingredient.id}">
                                <td class="px-4 py-3">
                                    <div class="font-medium text-gray-800">${ingredient.name}</div>
                                    <div class="text-sm text-gray-500">ID: ${ingredient.id}</div>
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600">${ingredient.category || 'N/A'}</td>
                                <td class="px-4 py-3 text-sm text-gray-600">${ingredient.default_unit || 'N/A'}</td>
                                <td class="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">${ingredient.description || 'N/A'}</td>
                                <td class="px-4 py-3 text-sm text-gray-600">
                                    ${this.renderAllergenBadges(ingredient)}
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex gap-2">
                                        <button class="edit-ingredient bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm" data-id="${ingredient.id}">
                                            ✏️ Edit
                                        </button>
                                        <button class="delete-ingredient bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" data-id="${ingredient.id}">
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    renderNutritionalInfo(ingredient) {
        if (this.displayMode !== 'all' && this.displayMode !== 'nutritional') return '';
        
        const nutrition = ingredient.nutritional_info || {};
        if (!nutrition.calories && !nutrition.protein && !nutrition.carbs && !nutrition.fat) return '';
        
        return `
            <div class="mb-3 p-3 bg-green-50 rounded-lg">
                <h4 class="text-sm font-medium text-green-800 mb-2">📊 Nutrition (per 100g)</h4>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    ${nutrition.calories ? `<div>🔥 ${nutrition.calories} cal</div>` : ''}
                    ${nutrition.protein ? `<div>💪 ${nutrition.protein}g protein</div>` : ''}
                    ${nutrition.carbs ? `<div>🌾 ${nutrition.carbs}g carbs</div>` : ''}
                    ${nutrition.fat ? `<div>🥑 ${nutrition.fat}g fat</div>` : ''}
                </div>
            </div>
        `;
    }
    
    renderAllergenInfo(ingredient) {
        if (this.displayMode !== 'all' && this.displayMode !== 'allergens') return '';
        
        const allergens = ingredient.allergens || [];
        if (allergens.length === 0) return '';
        
        return `
            <div class="mb-3">
                <h4 class="text-sm font-medium text-red-800 mb-2">⚠️ Allergens</h4>
                ${this.renderAllergenBadges(ingredient)}
            </div>
        `;
    }
    
    renderAllergenBadges(ingredient) {
        const allergens = ingredient.allergens || [];
        if (allergens.length === 0) return '<span class="text-sm text-gray-500">None</span>';
        
        return allergens.map(allergen => 
            `<span class="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-1 mb-1">${allergen}</span>`
        ).join('');
    }
    
    addIngredientCardListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-ingredient').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const ingredient = this.ingredients.find(i => i.id === id);
                if (ingredient) {
                    this.showIngredientForm(ingredient);
                }
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-ingredient').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.deleteIngredient(id);
            });
        });
        
        // Card clicks for viewing details
        document.querySelectorAll('.ingredient-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                const ingredient = this.ingredients.find(i => i.id === id);
                if (ingredient) {
                    this.showIngredientDetails(ingredient);
                }
            });
        });
    }
    
    async deleteIngredient(id) {
        if (!confirm('Are you sure you want to delete this ingredient?')) return;
        
        try {
            const token = localStorage.getItem('iterum_auth_token');
            
            if (token) {
                // Delete from backend
                const response = await fetch(`/api/ingredients/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to delete from backend');
                }
            }
            
            // Remove from local array
            this.ingredients = this.ingredients.filter(i => i.id !== id);
            this.saveToLocalStorage();
            
            this.displayIngredients();
            this.updateIngredientCount();
            this.showNotification('Ingredient deleted successfully!', 'success');
            
        } catch (error) {
            console.error('Error deleting ingredient:', error);
            this.showNotification('Failed to delete ingredient', 'error');
        }
    }
    
    showIngredientDetails(ingredient) {
        // Create a modal to show ingredient details
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center p-6 border-b">
                    <h2 class="text-2xl font-bold text-gray-800">${ingredient.name}</h2>
                    <button class="text-gray-500 hover:text-gray-700 text-2xl font-bold" onclick="this.closest('.fixed').remove()">&times;</button>
                </div>
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
                            <div class="space-y-2">
                                <div><strong>Category:</strong> ${ingredient.category || 'N/A'}</div>
                                <div><strong>Default Unit:</strong> ${ingredient.default_unit || 'N/A'}</div>
                                <div><strong>ID:</strong> ${ingredient.id}</div>
                                <div><strong>Created:</strong> ${new Date(ingredient.created_at).toLocaleDateString()}</div>
                            </div>
                            ${ingredient.description ? `
                                <div class="mt-4">
                                    <strong>Description:</strong>
                                    <p class="text-gray-700 mt-1">${ingredient.description}</p>
                                </div>
                            ` : ''}
                        </div>
                        <div>
                            ${this.renderNutritionalInfo(ingredient)}
                            ${this.renderAllergenInfo(ingredient)}
                        </div>
                    </div>
                    <div class="flex gap-3 mt-6 pt-6 border-t">
                        <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg" onclick="ingredientLibrary.showIngredientForm(${JSON.stringify(ingredient).replace(/"/g, '&quot;')}); this.closest('.fixed').remove();">
                            ✏️ Edit Ingredient
                        </button>
                        <button class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg" onclick="this.closest('.fixed').remove();">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    updateIngredientCount() {
        const countElement = document.getElementById('ingredient-count');
        if (countElement) {
            countElement.textContent = `${this.ingredients.length} ingredients`;
        }
    }
    
    saveToLocalStorage() {
        // Use user-specific file storage first, fallback to localStorage
        if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
            const userId = window.userDataManager.getCurrentUserId();
            const filename = `user_${userId}_ingredients.json`;
            window.userDataManager.saveUserFile(filename, this.ingredients);
            console.log(`💾 Saved ${this.ingredients.length} ingredients to user file`);
        } else {
            // Fallback to global storage for backward compatibility
            localStorage.setItem('iterum_ingredients', JSON.stringify(this.ingredients));
            console.log(`💾 Saved ${this.ingredients.length} ingredients to localStorage`);
        }
    }
    
    loadDefaultIngredientDatabase() {
        // Check if user data manager is handling initialization
        if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
            // User data manager handles default ingredients, so just load current user's ingredients
            this.loadFromLocalStorage();
            return;
        }
        
        // Fallback: Check if we've already loaded the default database
        if (localStorage.getItem('default_ingredients_loaded') === 'true') {
            return;
        }
        
        // Load the comprehensive ingredient database
        const defaultIngredients = [
            // Produce
            { id: 1, name: "All-Purpose Flour", category: "Pantry", default_unit: "g", description: "Standard baking flour", allergens: ["gluten"], nutritional_info: { protein: 10, carbs: 76, fat: 1, calories: 364 }, created_at: new Date().toISOString() },
            { id: 2, name: "Granulated Sugar", category: "Pantry", default_unit: "g", description: "Sweetener", allergens: [], nutritional_info: { carbs: 100, calories: 387 }, created_at: new Date().toISOString() },
            { id: 3, name: "Salt", category: "Pantry", default_unit: "g", description: "Basic seasoning", allergens: [], nutritional_info: { sodium: 38758 }, created_at: new Date().toISOString() },
            { id: 4, name: "Black Pepper", category: "Pantry", default_unit: "g", description: "Spice, freshly ground preferred", allergens: [], nutritional_info: { calories: 251 }, created_at: new Date().toISOString() },
            { id: 5, name: "Unsalted Butter", category: "Dairy", default_unit: "g", description: "For baking and cooking", allergens: ["dairy"], nutritional_info: { fat: 81, calories: 717 }, created_at: new Date().toISOString() },
            { id: 6, name: "Large Eggs", category: "Dairy", default_unit: "each", description: "Binding and leavening agent", allergens: ["eggs"], nutritional_info: { protein: 12.5, calories: 70 }, created_at: new Date().toISOString() },
            { id: 7, name: "Whole Milk", category: "Dairy", default_unit: "ml", description: "Dairy base", allergens: ["dairy"], nutritional_info: { protein: 3.4, calories: 42 }, created_at: new Date().toISOString() },
            { id: 8, name: "Olive Oil", category: "Oils/Fats", default_unit: "ml", description: "Cooking and finishing oil", allergens: [], nutritional_info: { fat: 100, calories: 884 }, created_at: new Date().toISOString() },
            { id: 9, name: "Garlic", category: "Produce", default_unit: "cloves", description: "Aromatic, pungent", allergens: [], nutritional_info: { calories: 149 }, created_at: new Date().toISOString() },
            { id: 10, name: "Onion", category: "Produce", default_unit: "each", description: "Aromatic base", allergens: [], nutritional_info: { calories: 40 }, created_at: new Date().toISOString() },
            { id: 11, name: "Chicken Breast", category: "Protein", default_unit: "g", description: "Lean protein, versatile", allergens: [], nutritional_info: { protein: 31, calories: 165 }, created_at: new Date().toISOString() },
            { id: 12, name: "Ground Beef", category: "Protein", default_unit: "g", description: "Versatile meat, high fat content", allergens: [], nutritional_info: { protein: 26, fat: 15, calories: 250 }, created_at: new Date().toISOString() },
            { id: 13, name: "Basmati Rice", category: "Grains", default_unit: "g", description: "Long-grain, aromatic", allergens: [], nutritional_info: { carbs: 78, calories: 345 }, created_at: new Date().toISOString() },
            { id: 14, name: "Pasta (Spaghetti)", category: "Grains", default_unit: "g", description: "Durum wheat, basic noodle", allergens: ["gluten"], nutritional_info: { carbs: 71, protein: 13, calories: 371 }, created_at: new Date().toISOString() },
            { id: 15, name: "Tomatoes", category: "Produce", default_unit: "each", description: "Fresh, juicy", allergens: [], nutritional_info: { calories: 18 }, created_at: new Date().toISOString() },
            { id: 16, name: "Potatoes (Russet)", category: "Produce", default_unit: "each", description: "Starchy, good for mashing/frying", allergens: [], nutritional_info: { carbs: 37, calories: 161 }, created_at: new Date().toISOString() },
            { id: 17, name: "Carrots", category: "Produce", default_unit: "each", description: "Root vegetable, sweet", allergens: [], nutritional_info: { carbs: 9, calories: 41 }, created_at: new Date().toISOString() },
            { id: 18, name: "Celery", category: "Produce", default_unit: "stalks", description: "Aromatic, crisp", allergens: [], nutritional_info: { calories: 6 }, created_at: new Date().toISOString() },
            { id: 19, name: "Bell Pepper (Green)", category: "Produce", default_unit: "each", description: "Crunchy, mild flavor", allergens: [], nutritional_info: { calories: 20 }, created_at: new Date().toISOString() },
            { id: 20, name: "Lemon", category: "Produce", default_unit: "each", description: "Citrus, acidic", allergens: [], nutritional_info: { calories: 17 }, created_at: new Date().toISOString() },
            { id: 21, name: "Lime", category: "Produce", default_unit: "each", description: "Citrus, tart", allergens: [], nutritional_info: { calories: 20 }, created_at: new Date().toISOString() },
            { id: 22, name: "Cilantro", category: "Herbs", default_unit: "g", description: "Fresh herb, bright flavor", allergens: [], nutritional_info: { calories: 23 }, created_at: new Date().toISOString() },
            { id: 23, name: "Parsley", category: "Herbs", default_unit: "g", description: "Fresh herb, earthy flavor", allergens: [], nutritional_info: { calories: 36 }, created_at: new Date().toISOString() },
            { id: 24, name: "Thyme", category: "Herbs", default_unit: "g", description: "Aromatic herb, woody stems", allergens: [], nutritional_info: { calories: 101 }, created_at: new Date().toISOString() },
            { id: 25, name: "Rosemary", category: "Herbs", default_unit: "g", description: "Aromatic herb, strong flavor", allergens: [], nutritional_info: { calories: 131 }, created_at: new Date().toISOString() },
            { id: 26, name: "Bay Leaf", category: "Herbs", default_unit: "each", description: "Aromatic, used whole", allergens: [], nutritional_info: { calories: 313 }, created_at: new Date().toISOString() },
            { id: 27, name: "Cumin (Ground)", category: "Spices", default_unit: "g", description: "Earthy, warm spice", allergens: [], nutritional_info: { calories: 375 }, created_at: new Date().toISOString() },
            { id: 28, name: "Coriander (Ground)", category: "Spices", default_unit: "g", description: "Citrusy, mild spice", allergens: [], nutritional_info: { calories: 298 }, created_at: new Date().toISOString() },
            { id: 29, name: "Paprika", category: "Spices", default_unit: "g", description: "Mild chili powder", allergens: [], nutritional_info: { calories: 282 }, created_at: new Date().toISOString() },
            { id: 30, name: "Chili Powder", category: "Spices", default_unit: "g", description: "Spicy, blend of chili peppers", allergens: [], nutritional_info: { calories: 282 }, created_at: new Date().toISOString() },
            { id: 31, name: "Oregano", category: "Herbs", default_unit: "g", description: "Mediterranean herb, pungent", allergens: [], nutritional_info: { calories: 265 }, created_at: new Date().toISOString() },
            { id: 32, name: "Basil", category: "Herbs", default_unit: "g", description: "Sweet, aromatic herb", allergens: [], nutritional_info: { calories: 22 }, created_at: new Date().toISOString() },
            { id: 33, name: "Ginger", category: "Produce", default_unit: "g", description: "Pungent, spicy root", allergens: [], nutritional_info: { calories: 80 }, created_at: new Date().toISOString() },
            { id: 34, name: "Soy Sauce", category: "Condiments", default_unit: "ml", description: "Umami, salty", allergens: ["soy"], nutritional_info: { sodium: 879, calories: 53 }, created_at: new Date().toISOString() },
            { id: 35, name: "Vinegar (White)", category: "Condiments", default_unit: "ml", description: "Acidic, sharp", allergens: [], nutritional_info: { calories: 18 }, created_at: new Date().toISOString() },
            { id: 36, name: "Balsamic Vinegar", category: "Condiments", default_unit: "ml", description: "Sweet, tangy", allergens: [], nutritional_info: { calories: 88 }, created_at: new Date().toISOString() },
            { id: 37, name: "Dijon Mustard", category: "Condiments", default_unit: "g", description: "Sharp, tangy", allergens: [], nutritional_info: { calories: 66 }, created_at: new Date().toISOString() },
            { id: 38, name: "Honey", category: "Sweeteners", default_unit: "g", description: "Natural sweetener", allergens: [], nutritional_info: { carbs: 82, calories: 304 }, created_at: new Date().toISOString() },
            { id: 39, name: "Maple Syrup", category: "Sweeteners", default_unit: "ml", description: "Natural sweetener, distinct flavor", allergens: [], nutritional_info: { carbs: 67, calories: 260 }, created_at: new Date().toISOString() },
            { id: 40, name: "Bread (Sourdough)", category: "Baked Goods", default_unit: "slices", description: "Tangy, chewy", allergens: ["gluten"], nutritional_info: { carbs: 49, protein: 9, calories: 289 }, created_at: new Date().toISOString() },
            { id: 41, name: "Cheddar Cheese", category: "Dairy", default_unit: "g", description: "Hard cheese, sharp flavor", allergens: ["dairy"], nutritional_info: { protein: 25, fat: 33, calories: 403 }, created_at: new Date().toISOString() },
            { id: 42, name: "Parmesan Cheese", category: "Dairy", default_unit: "g", description: "Hard, salty, umami", allergens: ["dairy"], nutritional_info: { protein: 38, fat: 29, calories: 431 }, created_at: new Date().toISOString() },
            { id: 43, name: "Yogurt (Plain)", category: "Dairy", default_unit: "g", description: "Tangy, creamy dairy product", allergens: ["dairy"], nutritional_info: { protein: 10, calories: 59 }, created_at: new Date().toISOString() },
            { id: 44, name: "Milk (Almond)", category: "Dairy Alternatives", default_unit: "ml", description: "Plant-based milk", allergens: ["nuts"], nutritional_info: { calories: 17 }, created_at: new Date().toISOString() },
            { id: 45, name: "Tofu", category: "Protein", default_unit: "g", description: "Plant-based protein, absorbs flavors", allergens: ["soy"], nutritional_info: { protein: 8, calories: 76 }, created_at: new Date().toISOString() },
            { id: 46, name: "Lentils (Brown)", category: "Legumes", default_unit: "g", description: "Earthy, hearty", allergens: [], nutritional_info: { protein: 9, carbs: 20, calories: 116 }, created_at: new Date().toISOString() },
            { id: 47, name: "Black Beans", category: "Legumes", default_unit: "g", description: "Earthy, versatile", allergens: [], nutritional_info: { protein: 8, carbs: 23, calories: 132 }, created_at: new Date().toISOString() },
            { id: 48, name: "Chickpeas", category: "Legumes", default_unit: "g", description: "Nutty, versatile legume", allergens: [], nutritional_info: { protein: 9, carbs: 27, calories: 164 }, created_at: new Date().toISOString() },
            { id: 49, name: "Quinoa", category: "Grains", default_unit: "g", description: "Complete protein, nutty", allergens: [], nutritional_info: { protein: 4, carbs: 22, calories: 120 }, created_at: new Date().toISOString() },
            { id: 50, name: "Oats (Rolled)", category: "Grains", default_unit: "g", description: "Whole grain, breakfast staple", allergens: [], nutritional_info: { protein: 13, carbs: 68, calories: 389 }, created_at: new Date().toISOString() }
        ];
        
        // Add default ingredients to the existing list
        this.ingredients = [...this.ingredients, ...defaultIngredients];
        
        // Save to localStorage
        this.saveToLocalStorage();
        
        // Mark as loaded
        localStorage.setItem('default_ingredients_loaded', 'true');
        
        // Update display
        this.displayIngredients();
        this.updateIngredientCount();
        
        console.log(`Loaded ${defaultIngredients.length} default ingredients`);
    }
    
    async loadDefaultIngredientDatabase() {
        // Check if we already have ingredients loaded
        if (this.ingredients.length > 0) {
            console.log('Ingredients already loaded, skipping default database');
            return;
        }
        
        try {
            // Try to load from the CSV file
            const response = await fetch('Ingredient Database-Sheet1.csv.txt');
            if (response.ok) {
                const csvText = await response.text();
                const ingredients = this.parseCSVToIngredients(csvText);
                
                if (ingredients.length > 0) {
                    console.log(`Loaded ${ingredients.length} ingredients from default database`);
                    this.ingredients = ingredients;
                    this.saveToLocalStorage();
                    this.displayIngredients();
                    this.updateIngredientCount();
                    this.showNotification(`Loaded ${ingredients.length} ingredients from database!`, 'success');
                }
            }
        } catch (error) {
            console.log('Could not load default ingredient database:', error);
            // Fall back to some basic ingredients if CSV fails
            this.loadBasicIngredients();
        }
    }
    
    parseCSVToIngredients(csvText) {
        const lines = csvText.split('\n');
        const ingredients = [];
        
        // Skip header line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Split by comma, but handle quoted values
            const values = this.parseCSVLine(line);
            
            if (values.length >= 3 && values[0]) {
                const ingredient = {
                    id: Date.now() + i,
                    name: values[0].trim(),
                    default_unit: values[1].trim() || 'grams',
                    category: values[2].trim() || 'Pantry',
                    description: values[3] ? values[3].trim() : '',
                    nutritional_info: this.parseNutritionalInfo(values[4]),
                    allergens: this.parseAllergens(values[10]),
                    created_at: new Date().toISOString()
                };
                
                ingredients.push(ingredient);
            }
        }
        
        return ingredients;
    }
    
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current);
        return values;
    }
    
    parseNutritionalInfo(nutritionText) {
        if (!nutritionText) return {};
        
        const nutrition = {};
        const parts = nutritionText.split(',');
        
        parts.forEach(part => {
            const trimmed = part.trim();
            if (trimmed.includes(':')) {
                const [key, value] = trimmed.split(':').map(s => s.trim());
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    nutrition[key.toLowerCase()] = numValue;
                }
            } else if (trimmed.includes('calories')) {
                const match = trimmed.match(/(\d+)/);
                if (match) {
                    nutrition.calories = parseInt(match[1]);
                }
            } else if (trimmed.includes('protein')) {
                const match = trimmed.match(/(\d+(?:\.\d+)?)/);
                if (match) {
                    nutrition.protein = parseFloat(match[1]);
                }
            } else if (trimmed.includes('fat')) {
                const match = trimmed.match(/(\d+(?:\.\d+)?)/);
                if (match) {
                    nutrition.fat = parseFloat(match[1]);
                }
            } else if (trimmed.includes('sodium')) {
                const match = trimmed.match(/(\d+)/);
                if (match) {
                    nutrition.sodium = parseInt(match[1]);
                }
            }
        });
        
        return nutrition;
    }
    
    parseAllergens(allergenText) {
        if (!allergenText) return [];
        
        const allergens = [];
        const allergenTextLower = allergenText.toLowerCase();
        
        if (allergenTextLower.includes('gluten')) allergens.push('gluten');
        if (allergenTextLower.includes('dairy')) allergens.push('dairy');
        if (allergenTextLower.includes('nuts')) allergens.push('nuts');
        if (allergenTextLower.includes('eggs')) allergens.push('eggs');
        if (allergenTextLower.includes('soy')) allergens.push('soy');
        if (allergenTextLower.includes('shellfish')) allergens.push('shellfish');
        if (allergenTextLower.includes('fish')) allergens.push('fish');
        if (allergenTextLower.includes('sulfites')) allergens.push('sulfites');
        
        return allergens;
    }
    
    loadBasicIngredients() {
        // Fallback basic ingredients if CSV loading fails
        const basicIngredients = [
            {
                id: 1,
                name: 'All-Purpose Flour',
                default_unit: 'grams',
                category: 'Pantry',
                description: 'Standard baking flour',
                nutritional_info: { protein: 10, calories: 364 },
                allergens: ['gluten'],
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Granulated Sugar',
                default_unit: 'grams',
                category: 'Pantry',
                description: 'Sweetener',
                nutritional_info: { calories: 387 },
                allergens: [],
                created_at: new Date().toISOString()
            },
            {
                id: 3,
                name: 'Salt',
                default_unit: 'grams',
                category: 'Pantry',
                description: 'Basic seasoning',
                nutritional_info: { sodium: 38758 },
                allergens: [],
                created_at: new Date().toISOString()
            },
            {
                id: 4,
                name: 'Unsalted Butter',
                default_unit: 'grams',
                category: 'Dairy',
                description: 'For baking and cooking',
                nutritional_info: { fat: 81, calories: 717 },
                allergens: ['dairy'],
                created_at: new Date().toISOString()
            },
            {
                id: 5,
                name: 'Large Eggs',
                default_unit: 'each',
                category: 'Dairy',
                description: 'Binding and leavening agent',
                nutritional_info: { protein: 12.5, calories: 70 },
                allergens: ['eggs'],
                created_at: new Date().toISOString()
            },
            {
                id: 6,
                name: 'Whole Milk',
                default_unit: 'ml',
                category: 'Dairy',
                description: 'Dairy base',
                nutritional_info: { protein: 3.4, calories: 42 },
                allergens: ['dairy'],
                created_at: new Date().toISOString()
            },
            {
                id: 7,
                name: 'Olive Oil',
                default_unit: 'ml',
                category: 'Oils/Fats',
                description: 'Cooking and finishing oil',
                nutritional_info: { fat: 100, calories: 884 },
                allergens: [],
                created_at: new Date().toISOString()
            },
            {
                id: 8,
                name: 'Garlic',
                default_unit: 'cloves',
                category: 'Produce',
                description: 'Aromatic, pungent',
                nutritional_info: { calories: 149 },
                allergens: [],
                created_at: new Date().toISOString()
            },
            {
                id: 9,
                name: 'Onion',
                default_unit: 'each',
                category: 'Produce',
                description: 'Aromatic base',
                nutritional_info: { calories: 40 },
                allergens: [],
                created_at: new Date().toISOString()
            },
            {
                id: 10,
                name: 'Black Pepper',
                default_unit: 'grams',
                category: 'Pantry',
                description: 'Spice, freshly ground preferred',
                nutritional_info: { calories: 251 },
                allergens: [],
                created_at: new Date().toISOString()
            }
        ];
        
        this.ingredients = basicIngredients;
        this.saveToLocalStorage();
        this.displayIngredients();
        this.updateIngredientCount();
        console.log('Loaded basic ingredients as fallback');
    }
    
    importFromCSV() {
        // Create file input for CSV import
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processCSVFile(file);
            }
        };
        input.click();
    }
    
    processCSVFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            const importedIngredients = [];
            
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',').map(v => v.trim());
                    const ingredient = {};
                    
                    headers.forEach((header, index) => {
                        if (values[index]) {
                            ingredient[header.toLowerCase().replace(/\s+/g, '_')] = values[index];
                        }
                    });
                    
                    if (ingredient.name) {
                        importedIngredients.push({
                            id: Date.now() + i,
                            name: ingredient.name,
                            category: ingredient.category || '',
                            default_unit: ingredient.unit || ingredient.default_unit || '',
                            description: ingredient.description || '',
                            allergens: ingredient.allergens ? ingredient.allergens.split(';') : [],
                            nutritional_info: {},
                            created_at: new Date().toISOString()
                        });
                    }
                }
            }
            
            this.ingredients.push(...importedIngredients);
            this.saveToLocalStorage();
            this.displayIngredients();
            this.updateIngredientCount();
            
            this.showNotification(`Imported ${importedIngredients.length} ingredients successfully!`, 'success');
        };
        reader.readAsText(file);
    }
    
    exportIngredients() {
        const csvContent = this.convertToCSV(this.ingredients);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ingredients_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showNotification('Ingredients exported successfully!', 'success');
    }
    
    convertToCSV(ingredients) {
        const headers = ['Name', 'Category', 'Default Unit', 'Description', 'Allergens', 'Created At'];
        const rows = ingredients.map(ingredient => [
            ingredient.name,
            ingredient.category || '',
            ingredient.default_unit || '',
            ingredient.description || '',
            (ingredient.allergens || []).join(';'),
            ingredient.created_at || ''
        ]);
        
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    showAddViaLinkModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div class="flex justify-between items-center p-6 border-b">
                    <h2 class="text-xl font-bold text-gray-800">Add Ingredient via Link</h2>
                    <button class="text-gray-500 hover:text-gray-700 text-2xl font-bold" onclick="this.closest('.fixed').remove()">&times;</button>
                </div>
                <div class="p-6">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Ingredient Link</label>
                        <input type="url" id="ingredient-link" placeholder="https://example.com/ingredient" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <p class="text-sm text-gray-500 mt-1">Paste a link to an ingredient page (e.g., grocery store, recipe site)</p>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Or Quick Add</label>
                        <div class="grid grid-cols-2 gap-2">
                            <button class="quick-add-btn bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded text-sm" data-ingredient="Fresh Basil">
                                🌿 Fresh Basil
                            </button>
                            <button class="quick-add-btn bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded text-sm" data-ingredient="Extra Virgin Olive Oil">
                                🫒 EVOO
                            </button>
                            <button class="quick-add-btn bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded text-sm" data-ingredient="Sea Salt">
                                🧂 Sea Salt
                            </button>
                            <button class="quick-add-btn bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded text-sm" data-ingredient="Black Pepper">
                                🌶️ Black Pepper
                            </button>
                            <button class="quick-add-btn bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded text-sm" data-ingredient="Garlic">
                                🧄 Garlic
                            </button>
                            <button class="quick-add-btn bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded text-sm" data-ingredient="Onion">
                                🧅 Onion
                            </button>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button id="process-link-btn" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                            🔗 Process Link
                        </button>
                        <button class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg" onclick="this.closest('.fixed').remove()">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const processBtn = modal.querySelector('#process-link-btn');
        processBtn.addEventListener('click', () => this.processIngredientLink(modal));
        
        // Quick add buttons
        modal.querySelectorAll('.quick-add-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const ingredientName = btn.dataset.ingredient;
                this.quickAddIngredient(ingredientName);
                modal.remove();
            });
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    async processIngredientLink(modal) {
        const linkInput = modal.querySelector('#ingredient-link');
        const link = linkInput.value.trim();
        
        if (!link) {
            this.showNotification('Please enter a valid link', 'error');
            return;
        }
        
        try {
            // Show loading state
            const processBtn = modal.querySelector('#process-link-btn');
            processBtn.textContent = '🔄 Processing...';
            processBtn.disabled = true;
            
            // Simulate processing (in a real app, you'd fetch the page and extract data)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Extract ingredient name from URL (basic implementation)
            const url = new URL(link);
            const pathParts = url.pathname.split('/').filter(part => part.length > 0);
            const ingredientName = pathParts[pathParts.length - 1]
                .replace(/-/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
            
            // Add the ingredient
            this.quickAddIngredient(ingredientName, link);
            
            modal.remove();
            this.showNotification(`Added ingredient from link: ${ingredientName}`, 'success');
            
        } catch (error) {
            console.error('Error processing link:', error);
            this.showNotification('Failed to process link. Please try manual entry.', 'error');
            
            // Reset button
            const processBtn = modal.querySelector('#process-link-btn');
            processBtn.textContent = '🔗 Process Link';
            processBtn.disabled = false;
        }
    }
    
    quickAddIngredient(name, sourceLink = null) {
        const newIngredient = {
            id: Date.now(),
            name: name,
            category: this.guessCategory(name),
            default_unit: this.guessUnit(name),
            description: sourceLink ? `Added from: ${sourceLink}` : `Quick added: ${name}`,
            allergens: this.guessAllergens(name),
            nutritional_info: {},
            created_at: new Date().toISOString()
        };
        
        this.ingredients.push(newIngredient);
        this.saveToLocalStorage();
        this.displayIngredients();
        this.updateIngredientCount();
        
        this.showNotification(`Added: ${name}`, 'success');
    }
    
    guessCategory(name) {
        const nameLower = name.toLowerCase();
        
        if (nameLower.includes('milk') || nameLower.includes('cheese') || nameLower.includes('yogurt') || nameLower.includes('cream')) return 'Dairy';
        if (nameLower.includes('chicken') || nameLower.includes('beef') || nameLower.includes('pork') || nameLower.includes('lamb')) return 'Protein';
        if (nameLower.includes('fish') || nameLower.includes('salmon') || nameLower.includes('tuna') || nameLower.includes('shrimp')) return 'Seafood';
        if (nameLower.includes('flour') || nameLower.includes('sugar') || nameLower.includes('salt') || nameLower.includes('oil')) return 'Pantry';
        if (nameLower.includes('basil') || nameLower.includes('thyme') || nameLower.includes('rosemary') || nameLower.includes('oregano')) return 'Herbs';
        if (nameLower.includes('cumin') || nameLower.includes('paprika') || nameLower.includes('cinnamon') || nameLower.includes('pepper')) return 'Spices';
        if (nameLower.includes('tomato') || nameLower.includes('onion') || nameLower.includes('garlic') || nameLower.includes('carrot')) return 'Produce';
        if (nameLower.includes('bread') || nameLower.includes('cake') || nameLower.includes('cookie')) return 'Baked Goods';
        if (nameLower.includes('wine') || nameLower.includes('beer') || nameLower.includes('juice')) return 'Beverages';
        
        return 'Pantry'; // Default
    }
    
    guessUnit(name) {
        const nameLower = name.toLowerCase();
        
        if (nameLower.includes('oil') || nameLower.includes('vinegar') || nameLower.includes('sauce') || nameLower.includes('milk')) return 'ml';
        if (nameLower.includes('flour') || nameLower.includes('sugar') || nameLower.includes('salt') || nameLower.includes('spice')) return 'g';
        if (nameLower.includes('onion') || nameLower.includes('tomato') || nameLower.includes('potato') || nameLower.includes('apple')) return 'each';
        if (nameLower.includes('basil') || nameLower.includes('parsley') || nameLower.includes('cilantro')) return 'g';
        
        return 'g'; // Default
    }
    
    guessAllergens(name) {
        const nameLower = name.toLowerCase();
        const allergens = [];
        
        if (nameLower.includes('flour') || nameLower.includes('bread') || nameLower.includes('pasta')) allergens.push('gluten');
        if (nameLower.includes('milk') || nameLower.includes('cheese') || nameLower.includes('yogurt') || nameLower.includes('cream')) allergens.push('dairy');
        if (nameLower.includes('nut') || nameLower.includes('almond') || nameLower.includes('peanut')) allergens.push('nuts');
        if (nameLower.includes('egg')) allergens.push('eggs');
        if (nameLower.includes('soy')) allergens.push('soy');
        if (nameLower.includes('fish') || nameLower.includes('salmon') || nameLower.includes('tuna')) allergens.push('fish');
        if (nameLower.includes('shellfish') || nameLower.includes('shrimp') || nameLower.includes('crab')) allergens.push('shellfish');
        
        return allergens;
    }
    
    showEditAllModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                <div class="flex justify-between items-center p-6 border-b">
                    <h2 class="text-xl font-bold text-gray-800">Edit All Ingredients (${this.ingredients.length})</h2>
                    <button class="text-gray-500 hover:text-gray-700 text-2xl font-bold" onclick="this.closest('.fixed').remove()">&times;</button>
                </div>
                <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div class="mb-4 flex gap-2">
                        <button id="save-all-changes" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                            💾 Save All Changes
                        </button>
                        <button id="bulk-category-change" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                            📂 Bulk Category Change
                        </button>
                        <button id="bulk-unit-change" class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg">
                            📏 Bulk Unit Change
                        </button>
                        <button id="delete-selected" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">
                            🗑️ Delete Selected
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="edit-all-ingredients-grid">
                        ${this.ingredients.map(ingredient => this.renderEditIngredientCard(ingredient)).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const saveBtn = modal.querySelector('#save-all-changes');
        saveBtn.addEventListener('click', () => this.saveAllIngredientChanges(modal));
        
        const bulkCategoryBtn = modal.querySelector('#bulk-category-change');
        bulkCategoryBtn.addEventListener('click', () => this.showBulkCategoryModal(modal));
        
        const bulkUnitBtn = modal.querySelector('#bulk-unit-change');
        bulkUnitBtn.addEventListener('click', () => this.showBulkUnitModal(modal));
        
        const deleteSelectedBtn = modal.querySelector('#delete-selected');
        deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedIngredients(modal));
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    renderEditIngredientCard(ingredient) {
        return `
            <div class="bg-gray-50 rounded-lg p-4 border" data-id="${ingredient.id}">
                <div class="flex items-center gap-2 mb-3">
                    <input type="checkbox" class="ingredient-select" data-id="${ingredient.id}">
                    <h3 class="font-semibold text-gray-800">${ingredient.name}</h3>
                </div>
                <div class="space-y-2">
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Category</label>
                        <select class="edit-category w-full text-sm border rounded px-2 py-1" data-id="${ingredient.id}">
                            <option value="">Select Category</option>
                            ${this.categories.map(cat => `<option value="${cat}" ${ingredient.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                        <select class="edit-unit w-full text-sm border rounded px-2 py-1" data-id="${ingredient.id}">
                            <option value="">Select Unit</option>
                            ${this.units.map(unit => `<option value="${unit}" ${ingredient.default_unit === unit ? 'selected' : ''}>${unit}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <textarea class="edit-description w-full text-sm border rounded px-2 py-1" rows="2" data-id="${ingredient.id}">${ingredient.description || ''}</textarea>
                    </div>
                </div>
            </div>
        `;
    }
    
    saveAllIngredientChanges(modal) {
        const changes = [];
        
        // Collect all changes
        modal.querySelectorAll('.edit-category').forEach(select => {
            const id = parseInt(select.dataset.id);
            const ingredient = this.ingredients.find(i => i.id === id);
            if (ingredient && ingredient.category !== select.value) {
                ingredient.category = select.value;
                changes.push(`${ingredient.name}: category updated`);
            }
        });
        
        modal.querySelectorAll('.edit-unit').forEach(select => {
            const id = parseInt(select.dataset.id);
            const ingredient = this.ingredients.find(i => i.id === id);
            if (ingredient && ingredient.default_unit !== select.value) {
                ingredient.default_unit = select.value;
                changes.push(`${ingredient.name}: unit updated`);
            }
        });
        
        modal.querySelectorAll('.edit-description').forEach(textarea => {
            const id = parseInt(textarea.dataset.id);
            const ingredient = this.ingredients.find(i => i.id === id);
            if (ingredient && ingredient.description !== textarea.value) {
                ingredient.description = textarea.value;
                changes.push(`${ingredient.name}: description updated`);
            }
        });
        
        // Save changes
        this.saveToLocalStorage();
        this.displayIngredients();
        
        modal.remove();
        this.showNotification(`Saved ${changes.length} changes`, 'success');
    }
    
    showBulkCategoryModal(parentModal) {
        const selectedIds = this.getSelectedIngredientIds(parentModal);
        if (selectedIds.length === 0) {
            this.showNotification('Please select ingredients first', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div class="p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Bulk Category Change (${selectedIds.length} items)</h3>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">New Category</label>
                        <select id="bulk-category-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Select Category</option>
                            ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                    </div>
                    <div class="flex gap-3">
                        <button id="apply-bulk-category" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                            Apply
                        </button>
                        <button class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg" onclick="this.closest('.fixed').remove()">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const applyBtn = modal.querySelector('#apply-bulk-category');
        applyBtn.addEventListener('click', () => {
            const newCategory = modal.querySelector('#bulk-category-select').value;
            if (!newCategory) {
                this.showNotification('Please select a category', 'error');
                return;
            }
            
            selectedIds.forEach(id => {
                const ingredient = this.ingredients.find(i => i.id === id);
                if (ingredient) {
                    ingredient.category = newCategory;
                }
            });
            
            this.saveToLocalStorage();
            this.displayIngredients();
            modal.remove();
            parentModal.remove();
            this.showNotification(`Updated category for ${selectedIds.length} ingredients`, 'success');
        });
    }
    
    showBulkUnitModal(parentModal) {
        const selectedIds = this.getSelectedIngredientIds(parentModal);
        if (selectedIds.length === 0) {
            this.showNotification('Please select ingredients first', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div class="p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Bulk Unit Change (${selectedIds.length} items)</h3>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">New Unit</label>
                        <select id="bulk-unit-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Select Unit</option>
                            ${this.units.map(unit => `<option value="${unit}">${unit}</option>`).join('')}
                        </select>
                    </div>
                    <div class="flex gap-3">
                        <button id="apply-bulk-unit" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                            Apply
                        </button>
                        <button class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg" onclick="this.closest('.fixed').remove()">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const applyBtn = modal.querySelector('#apply-bulk-unit');
        applyBtn.addEventListener('click', () => {
            const newUnit = modal.querySelector('#bulk-unit-select').value;
            if (!newUnit) {
                this.showNotification('Please select a unit', 'error');
                return;
            }
            
            selectedIds.forEach(id => {
                const ingredient = this.ingredients.find(i => i.id === id);
                if (ingredient) {
                    ingredient.default_unit = newUnit;
                }
            });
            
            this.saveToLocalStorage();
            this.displayIngredients();
            modal.remove();
            parentModal.remove();
            this.showNotification(`Updated unit for ${selectedIds.length} ingredients`, 'success');
        });
    }
    
    deleteSelectedIngredients(parentModal) {
        const selectedIds = this.getSelectedIngredientIds(parentModal);
        if (selectedIds.length === 0) {
            this.showNotification('Please select ingredients first', 'error');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} ingredients?`)) {
            return;
        }
        
        this.ingredients = this.ingredients.filter(i => !selectedIds.includes(i.id));
        this.saveToLocalStorage();
        this.displayIngredients();
        this.updateIngredientCount();
        
        parentModal.remove();
        this.showNotification(`Deleted ${selectedIds.length} ingredients`, 'success');
    }
    
    getSelectedIngredientIds(modal) {
        const checkboxes = modal.querySelectorAll('.ingredient-select:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));
    }
    
    showURLImportModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        modal.id = 'url-import-modal';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-t-lg">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold">🌐 Import Ingredient from URL</h2>
                        <button onclick="this.closest('.fixed').remove()" class="text-white hover:text-green-200 text-2xl font-bold">
                            ×
                        </button>
                    </div>
                    <p class="text-green-100 mt-2">Import ingredient data by pasting a URL from Wikipedia, nutrition databases, or other sources</p>
                </div>
                
                <div class="p-6">
                    <div class="mb-6">
                        <label for="ingredient-url" class="block text-gray-700 text-sm font-bold mb-2">
                            Ingredient URL
                        </label>
                        <input type="url" id="ingredient-url" placeholder="https://en.wikipedia.org/wiki/Tomato" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                        <p class="text-gray-600 text-sm mt-2">
                            📚 <strong>Supported sources:</strong> Wikipedia, USDA nutrition databases, and general food websites
                        </p>
                    </div>
                    
                    <div class="flex gap-3 mb-6">
                        <button onclick="ingredientLibrary.previewURLImport()" 
                                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                            🔍 Preview Data
                        </button>
                        <button onclick="ingredientLibrary.importFromURL()" 
                                class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
                            ✅ Import Ingredient
                        </button>
                    </div>
                    
                    <div id="url-import-preview" class="hidden">
                        <h3 class="text-lg font-semibold text-gray-700 mb-3">Preview Data</h3>
                        <div id="preview-content" class="bg-gray-50 p-4 rounded-lg border">
                            <!-- Preview content will be loaded here -->
                        </div>
                    </div>
                    
                    <div id="url-import-status" class="mt-4">
                        <!-- Status messages will appear here -->
                    </div>
                    
                    <div class="mt-6 pt-4 border-t">
                        <h3 class="text-lg font-semibold text-gray-700 mb-3">Example URLs</h3>
                        <div class="space-y-2 text-sm">
                            <button onclick="document.getElementById('ingredient-url').value='https://en.wikipedia.org/wiki/Tomato'" 
                                    class="block w-full text-left text-blue-600 hover:text-blue-800 underline">
                                https://en.wikipedia.org/wiki/Tomato
                            </button>
                            <button onclick="document.getElementById('ingredient-url').value='https://en.wikipedia.org/wiki/Basil'" 
                                    class="block w-full text-left text-blue-600 hover:text-blue-800 underline">
                                https://en.wikipedia.org/wiki/Basil
                            </button>
                            <button onclick="document.getElementById('ingredient-url').value='https://en.wikipedia.org/wiki/Avocado'" 
                                    class="block w-full text-left text-blue-600 hover:text-blue-800 underline">
                                https://en.wikipedia.org/wiki/Avocado
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    async previewURLImport() {
        const url = document.getElementById('ingredient-url').value.trim();
        const statusDiv = document.getElementById('url-import-status');
        const previewDiv = document.getElementById('url-import-preview');
        const previewContent = document.getElementById('preview-content');
        
        if (!url) {
            this.showURLImportStatus('Please enter a URL', 'error');
            return;
        }
        
        try {
            this.showURLImportStatus('⏳ Fetching ingredient data from URL...', 'info');
            
            const token = localStorage.getItem('iterum_auth_token');
            const response = await fetch('/api/ingredients/preview-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${token}`
                },
                body: `url=${encodeURIComponent(url)}`
            });
            
            const result = await response.json();
            
            if (result.success) {
                const data = result.preview_data;
                previewContent.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-semibold text-gray-700 mb-2">Basic Information</h4>
                            <p><strong>Name:</strong> ${data.name || 'Not found'}</p>
                            <p><strong>Category:</strong> ${data.category || 'Not found'}</p>
                            <p><strong>Default Unit:</strong> ${data.default_unit || 'Not found'}</p>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-700 mb-2">Additional Data</h4>
                            <p><strong>Description:</strong> ${data.description ? data.description.substring(0, 100) + '...' : 'Not found'}</p>
                            <p><strong>Allergens:</strong> ${data.allergens && data.allergens.length > 0 ? data.allergens.join(', ') : 'None detected'}</p>
                        </div>
                    </div>
                    ${Object.keys(data.nutritional_info || {}).length > 0 ? `
                        <div class="mt-4">
                            <h4 class="font-semibold text-gray-700 mb-2">Nutritional Information</h4>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                ${Object.entries(data.nutritional_info).map(([key, value]) => 
                                    `<div class="bg-white p-2 rounded border"><strong>${key}:</strong> ${value}</div>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}
                `;
                previewDiv.classList.remove('hidden');
                this.showURLImportStatus('✅ Preview generated successfully!', 'success');
            } else {
                this.showURLImportStatus(`❌ Error: ${result.detail || 'Failed to fetch ingredient data'}`, 'error');
                previewDiv.classList.add('hidden');
            }
        } catch (error) {
            this.showURLImportStatus(`❌ Network error: ${error.message}`, 'error');
            previewDiv.classList.add('hidden');
        }
    }
    
    async importFromURL() {
        const url = document.getElementById('ingredient-url').value.trim();
        
        if (!url) {
            this.showURLImportStatus('Please enter a URL', 'error');
            return;
        }
        
        try {
            this.showURLImportStatus('⏳ Importing ingredient from URL...', 'info');
            
            const token = localStorage.getItem('iterum_auth_token');
            const response = await fetch('/api/ingredients/import-from-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${token}`
                },
                body: `url=${encodeURIComponent(url)}`
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showURLImportStatus(`✅ Successfully imported "${result.ingredient.name}"!`, 'success');
                
                // Add to local ingredients array
                const newIngredient = {
                    id: result.ingredient.id,
                    name: result.ingredient.name,
                    category: result.ingredient.category,
                    default_unit: result.ingredient.default_unit || 'piece',
                    description: result.ingredient.description,
                    nutritional_info: result.scraped_data.nutritional_info || {},
                    allergens: result.scraped_data.allergens || [],
                    is_active: true,
                    created_at: new Date().toISOString(),
                    source_url: result.source_url
                };
                
                this.ingredients.unshift(newIngredient);
                
                // Update display
                this.updateIngredientCount();
                this.displayIngredients();
                this.saveToLocalStorage();
                
                // Close modal after success
                setTimeout(() => {
                    document.getElementById('url-import-modal').remove();
                }, 2000);
                
            } else {
                if (result.existing_ingredient) {
                    this.showURLImportStatus(`⚠️ Ingredient "${result.existing_ingredient.name}" already exists in your library`, 'warning');
                } else {
                    this.showURLImportStatus(`❌ Error: ${result.message || 'Failed to import ingredient'}`, 'error');
                }
            }
        } catch (error) {
            this.showURLImportStatus(`❌ Network error: ${error.message}`, 'error');
        }
    }
    
    showURLImportStatus(message, type) {
        const statusDiv = document.getElementById('url-import-status');
        const colors = {
            success: 'bg-green-100 border-green-500 text-green-700',
            error: 'bg-red-100 border-red-500 text-red-700',
            warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
            info: 'bg-blue-100 border-blue-500 text-blue-700'
        };
        
        statusDiv.innerHTML = `
            <div class="p-4 border-l-4 rounded ${colors[type] || colors.info}">
                ${message}
            </div>
        `;
    }
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

// Initialize ingredient library when DOM is loaded
let ingredientLibrary;
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on a page that needs ingredient library
    if (document.getElementById('ingredient-library-container') || 
        document.getElementById('existing-ingredients-container') || 
        document.querySelector('.ingredient-card') ||
        window.location.pathname.includes('ingredient')) {
        ingredientLibrary = new IngredientLibrary();
    }
}); 

// Create global instance
window.ingredientLibrary = new IngredientLibrary();

// Helper to get current user ID (simplified for master project)
function getCurrentUserId() {
    return 'master'; // Always use master project
} 