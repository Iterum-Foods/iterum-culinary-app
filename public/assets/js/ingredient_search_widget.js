/**
 * Ingredient Search Widget for Recipe and Menu Creation
 * Provides a searchable dropdown to select from preloaded ingredients
 */

class IngredientSearchWidget {
    constructor(options = {}) {
        this.containerId = options.containerId || 'ingredient-search-widget';
        this.onSelect = options.onSelect || this.defaultOnSelect.bind(this);
        this.placeholder = options.placeholder || 'Search ingredients...';
        this.maxResults = options.maxResults || 10;
        this.showCategories = options.showCategories !== false;
        this.showDetails = options.showDetails !== false;
        
        this.ingredients = [];
        this.categories = [];
        this.isLoading = false;
        this.searchTimeout = null;
        
        this.init();
    }
    
    async init() {
        this.createWidget();
        await this.loadIngredients();
        this.setupEventListeners();
    }
    
    createWidget() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container with ID ${this.containerId} not found`);
            return;
        }
        
        container.innerHTML = `
            <div class="ingredient-search-widget">
                <div class="search-input-container">
                    <input 
                        type="text" 
                        id="${this.containerId}-input" 
                        class="ingredient-search-input" 
                        placeholder="${this.placeholder}"
                        autocomplete="off"
                    >
                    <div class="search-loading" id="${this.containerId}-loading" style="display: none;">
                        <div class="spinner"></div>
                    </div>
                </div>
                
                ${this.showCategories ? `
                <div class="category-filter" id="${this.containerId}-categories" style="display: none;">
                    <div class="category-chips"></div>
                </div>
                ` : ''}
                
                <div class="search-results" id="${this.containerId}-results" style="display: none;">
                    <div class="results-list"></div>
                </div>
                
                <div class="no-results" id="${this.containerId}-no-results" style="display: none;">
                    <p>No ingredients found. Try a different search term.</p>
                </div>
            </div>
        `;
        
        this.addStyles();
    }
    
    addStyles() {
        if (document.getElementById('ingredient-search-widget-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'ingredient-search-widget-styles';
        styles.textContent = `
            .ingredient-search-widget {
                position: relative;
                width: 100%;
                max-width: 400px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .search-input-container {
                position: relative;
                display: flex;
                align-items: center;
            }
            
            .ingredient-search-input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                font-size: 14px;
                transition: border-color 0.2s ease;
                outline: none;
                background: white;
            }
            
            .ingredient-search-input:focus {
                border-color: #2e7d32;
                box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
            }
            
            .search-loading {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
            }
            
            .spinner {
                width: 16px;
                height: 16px;
                border: 2px solid #e1e5e9;
                border-top: 2px solid #2e7d32;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .category-filter {
                margin-top: 8px;
                padding: 8px 0;
            }
            
            .category-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            
            .category-chip {
                display: inline-flex;
                align-items: center;
                padding: 4px 8px;
                background: #f5f5f5;
                border: 1px solid #ddd;
                border-radius: 16px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .category-chip:hover {
                background: #e8f5e8;
                border-color: #4caf50;
            }
            
            .category-chip.active {
                background: #2e7d32;
                color: white;
                border-color: #2e7d32;
            }
            
            .search-results {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #e1e5e9;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                max-height: 300px;
                overflow-y: auto;
                z-index: 1000;
                margin-top: 4px;
            }
            
            .results-list {
                padding: 8px 0;
            }
            
            .ingredient-result {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                border-bottom: 1px solid #f5f5f5;
            }
            
            .ingredient-result:last-child {
                border-bottom: none;
            }
            
            .ingredient-result:hover {
                background: #f8f9fa;
            }
            
            .ingredient-result.highlighted {
                background: #e8f5e8;
            }
            
            .ingredient-info {
                flex: 1;
                min-width: 0;
            }
            
            .ingredient-name {
                font-weight: 500;
                color: #2e7d32;
                margin-bottom: 2px;
                font-size: 14px;
            }
            
            .ingredient-subtitle {
                font-size: 12px;
                color: #666;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .ingredient-category {
                background: #e8f5e8;
                color: #2e7d32;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
            }
            
            .ingredient-unit {
                color: #888;
                font-size: 11px;
            }
            
            .ingredient-details {
                font-size: 11px;
                color: #999;
                margin-top: 4px;
                display: flex;
                gap: 12px;
            }
            
            .detail-item {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .no-results {
                padding: 24px;
                text-align: center;
                color: #666;
                background: white;
                border: 1px solid #e1e5e9;
                border-radius: 8px;
                margin-top: 4px;
            }
            
            .cost-level-low { color: #4caf50; }
            .cost-level-medium { color: #ff9800; }
            .cost-level-high { color: #f44336; }
            
            .dietary-tags {
                display: flex;
                gap: 4px;
                margin-top: 4px;
                flex-wrap: wrap;
            }
            
            .dietary-tag {
                background: #e3f2fd;
                color: #1976d2;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 500;
            }
            
            .dietary-tag.vegan { background: #e8f5e8; color: #2e7d32; }
            .dietary-tag.gluten-free { background: #fff3e0; color: #f57c00; }
            .dietary-tag.organic { background: #f3e5f5; color: #7b1fa2; }
            .dietary-tag.superfood { background: #e0f2f1; color: #00695c; }
            
            .nutritional-highlight {
                background: #fff9c4;
                color: #f57f17;
                padding: 2px 4px;
                border-radius: 4px;
                font-size: 10px;
                margin-left: 4px;
            }
            
            .advanced-filters {
                margin-top: 8px;
                padding: 12px;
                background: #f8f9fa;
                border-radius: 8px;
                display: none;
            }
            
            .filter-row {
                display: flex;
                gap: 12px;
                margin-bottom: 8px;
                align-items: center;
            }
            
            .filter-select {
                padding: 4px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 12px;
                background: white;
            }
            
            .toggle-filters {
                font-size: 12px;
                color: #666;
                cursor: pointer;
                text-decoration: underline;
                margin-top: 4px;
            }
            
            .toggle-filters:hover {
                color: #2e7d32;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    async loadIngredients() {
        this.setLoading(true);
        
        try {
            const userId = this.getCurrentUserId();
            let url = '/api/data/ingredients';
            if (userId) url += `?user_id=${encodeURIComponent(userId)}`;
            
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.ingredients = data.ingredients || [];
                    this.categories = data.categories || [];
                } else {
                    this.ingredients = data.ingredients || data || [];
                }
                
                if (this.showCategories && this.categories.length > 0) {
                    this.renderCategories();
                }
            } else {
                console.warn('Failed to load ingredients from API');
            }
        } catch (error) {
            console.error('Error loading ingredients:', error);
        } finally {
            this.setLoading(false);
        }
    }
    
    renderCategories() {
        const categoriesContainer = document.getElementById(`${this.containerId}-categories`);
        if (!categoriesContainer) return;
        
        const chipsContainer = categoriesContainer.querySelector('.category-chips');
        chipsContainer.innerHTML = '';
        
        // Add "All" chip
        const allChip = document.createElement('div');
        allChip.className = 'category-chip active';
        allChip.textContent = 'All';
        allChip.dataset.category = '';
        chipsContainer.appendChild(allChip);
        
        // Add category chips
        this.categories.forEach(category => {
            const chip = document.createElement('div');
            chip.className = 'category-chip';
            chip.textContent = category;
            chip.dataset.category = category;
            chipsContainer.appendChild(chip);
        });
        
        categoriesContainer.style.display = 'block';
    }
    
    setupEventListeners() {
        const input = document.getElementById(`${this.containerId}-input`);
        const categoriesContainer = document.getElementById(`${this.containerId}-categories`);
        
        if (input) {
            input.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 300);
            });
            
            input.addEventListener('focus', () => {
                if (input.value.trim()) {
                    this.handleSearch(input.value);
                }
            });
            
            input.addEventListener('blur', () => {
                // Delay hiding results to allow clicks
                setTimeout(() => {
                    this.hideResults();
                }, 200);
            });
            
            input.addEventListener('keydown', (e) => {
                this.handleKeyNavigation(e);
            });
        }
        
        if (categoriesContainer) {
            categoriesContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('category-chip')) {
                    this.handleCategoryFilter(e.target);
                }
            });
        }
    }
    
    async handleSearch(query) {
        if (!query.trim()) {
            this.hideResults();
            return;
        }
        
        this.setLoading(true);
        
        try {
            const userId = this.getCurrentUserId();
            let url = `/api/data/ingredients/search?q=${encodeURIComponent(query)}`;
            if (userId) url += `&user_id=${encodeURIComponent(userId)}`;
            url += `&limit=${this.maxResults}`;
            
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.displayResults(data.results || []);
                } else {
                    this.displayResults([]);
                }
            } else {
                this.displayResults([]);
            }
        } catch (error) {
            console.error('Error searching ingredients:', error);
            this.displayResults([]);
        } finally {
            this.setLoading(false);
        }
    }
    
    handleCategoryFilter(chipElement) {
        // Update active chip
        const allChips = chipElement.parentElement.querySelectorAll('.category-chip');
        allChips.forEach(chip => chip.classList.remove('active'));
        chipElement.classList.add('active');
        
        const category = chipElement.dataset.category;
        const input = document.getElementById(`${this.containerId}-input`);
        
        if (input && input.value.trim()) {
            this.handleSearch(input.value);
        }
    }
    
    displayResults(results) {
        const resultsContainer = document.getElementById(`${this.containerId}-results`);
        const noResultsContainer = document.getElementById(`${this.containerId}-no-results`);
        
        if (results.length === 0) {
            resultsContainer.style.display = 'none';
            noResultsContainer.style.display = 'block';
            return;
        }
        
        noResultsContainer.style.display = 'none';
        
        const resultsList = resultsContainer.querySelector('.results-list');
        resultsList.innerHTML = '';
        
        results.forEach((ingredient, index) => {
            const resultElement = this.createResultElement(ingredient, index);
            resultsList.appendChild(resultElement);
        });
        
        resultsContainer.style.display = 'block';
    }
    
    createResultElement(ingredient, index) {
        const element = document.createElement('div');
        element.className = 'ingredient-result';
        element.dataset.index = index;
        
        const costClass = ingredient.info?.cost_level ? `cost-level-${ingredient.info.cost_level.toLowerCase()}` : '';
        
        // Determine dietary tags
        const dietaryTags = this.getDietaryTags(ingredient);
        
        element.innerHTML = `
            <div class="ingredient-info">
                <div class="ingredient-name">
                    ${ingredient.display_name || ingredient.name}
                    ${ingredient.info?.nutritional_info ? `<span class="nutritional-highlight">💪 ${ingredient.info.nutritional_info.split(',')[0]}</span>` : ''}
                </div>
                <div class="ingredient-subtitle">
                    <span class="ingredient-category">${ingredient.info?.category || ingredient.category || ''}</span>
                    <span class="ingredient-unit">Unit: ${ingredient.info?.unit || ingredient.unit || 'each'}</span>
                </div>
                ${dietaryTags.length > 0 ? `
                <div class="dietary-tags">
                    ${dietaryTags.map(tag => `<span class="dietary-tag ${tag.class}">${tag.label}</span>`).join('')}
                </div>
                ` : ''}
                ${this.showDetails ? `
                <div class="ingredient-details">
                    ${ingredient.info?.seasonality ? `<span class="detail-item">🌱 ${ingredient.info.seasonality}</span>` : ''}
                    ${ingredient.info?.cost_level ? `<span class="detail-item ${costClass}">💰 ${ingredient.info.cost_level}</span>` : ''}
                    ${ingredient.info?.allergen_info ? `<span class="detail-item">⚠️ ${ingredient.info.allergen_info}</span>` : ''}
                    ${ingredient.info?.storage_notes ? `<span class="detail-item">📦 ${ingredient.info.storage_notes.substring(0, 30)}...</span>` : ''}
                </div>
                ` : ''}
            </div>
        `;
        
        element.addEventListener('click', () => {
            this.selectIngredient(ingredient);
        });
        
        return element;
    }
    
    getDietaryTags(ingredient) {
        const tags = [];
        const category = (ingredient.info?.category || ingredient.category || '').toLowerCase();
        const name = (ingredient.name || '').toLowerCase();
        const allergens = (ingredient.info?.allergen_info || ingredient.allergen_info || '').toLowerCase();
        
        // Vegan-friendly tags
        if (category === 'produce' || category === 'nuts & seeds' || category === 'spices' || 
            category === 'alternative' || category === 'superfood' || category === 'fermented') {
            if (!allergens.includes('milk') && !allergens.includes('eggs') && 
                !name.includes('honey') && category !== 'seafood' && category !== 'protein') {
                tags.push({ label: 'Vegan', class: 'vegan' });
            }
        }
        
        // Gluten-free
        if (!allergens.includes('gluten') && !name.includes('wheat') && 
            !name.includes('barley') && !name.includes('rye') && 
            !name.includes('bread') && !name.includes('pasta')) {
            tags.push({ label: 'GF', class: 'gluten-free' });
        }
        
        // Organic indicators
        if (name.includes('organic') || name.includes('raw')) {
            tags.push({ label: 'Organic', class: 'organic' });
        }
        
        // Superfood
        if (category === 'superfood' || name.includes('chia') || name.includes('spirulina') || 
            name.includes('quinoa') || name.includes('kale') || name.includes('acai')) {
            tags.push({ label: 'Superfood', class: 'superfood' });
        }
        
        return tags.slice(0, 3); // Limit to 3 tags to avoid clutter
    }
    
    selectIngredient(ingredient) {
        const input = document.getElementById(`${this.containerId}-input`);
        if (input) {
            input.value = ingredient.display_name || ingredient.name;
        }
        
        this.hideResults();
        this.onSelect(ingredient);
    }
    
    defaultOnSelect(ingredient) {
        console.log('Selected ingredient:', ingredient);
        // Override this method when creating the widget
    }
    
    handleKeyNavigation(event) {
        const results = document.querySelectorAll(`#${this.containerId}-results .ingredient-result`);
        const highlighted = document.querySelector(`#${this.containerId}-results .ingredient-result.highlighted`);
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.highlightNext(results, highlighted);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.highlightPrevious(results, highlighted);
                break;
            case 'Enter':
                event.preventDefault();
                if (highlighted) {
                    highlighted.click();
                }
                break;
            case 'Escape':
                this.hideResults();
                break;
        }
    }
    
    highlightNext(results, current) {
        if (results.length === 0) return;
        
        if (current) {
            current.classList.remove('highlighted');
            const nextIndex = (parseInt(current.dataset.index) + 1) % results.length;
            results[nextIndex].classList.add('highlighted');
        } else {
            results[0].classList.add('highlighted');
        }
    }
    
    highlightPrevious(results, current) {
        if (results.length === 0) return;
        
        if (current) {
            current.classList.remove('highlighted');
            const prevIndex = parseInt(current.dataset.index) - 1;
            const index = prevIndex < 0 ? results.length - 1 : prevIndex;
            results[index].classList.add('highlighted');
        } else {
            results[results.length - 1].classList.add('highlighted');
        }
    }
    
    hideResults() {
        const resultsContainer = document.getElementById(`${this.containerId}-results`);
        const noResultsContainer = document.getElementById(`${this.containerId}-no-results`);
        
        if (resultsContainer) resultsContainer.style.display = 'none';
        if (noResultsContainer) noResultsContainer.style.display = 'none';
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        const loadingElement = document.getElementById(`${this.containerId}-loading`);
        if (loadingElement) {
            loadingElement.style.display = loading ? 'block' : 'none';
        }
    }
    
    getCurrentUserId() {
        try {
            if (window.userDataManager && window.userDataManager.getCurrentUserId) {
                return window.userDataManager.getCurrentUserId();
            }
            
            const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
            return currentUser.id || null;
        } catch (error) {
            return null;
        }
    }
    
    clearSearch() {
        const input = document.getElementById(`${this.containerId}-input`);
        if (input) {
            input.value = '';
        }
        this.hideResults();
    }
    
    getValue() {
        const input = document.getElementById(`${this.containerId}-input`);
        return input ? input.value : '';
    }
    
    setValue(value) {
        const input = document.getElementById(`${this.containerId}-input`);
        if (input) {
            input.value = value;
        }
    }
}

// Usage example:
/*
const ingredientWidget = new IngredientSearchWidget({
    containerId: 'my-ingredient-search',
    placeholder: 'Search for ingredients...',
    maxResults: 15,
    onSelect: (ingredient) => {
        console.log('Selected:', ingredient);
        // Add to recipe ingredients list
        addIngredientToRecipe(ingredient);
    }
});
*/