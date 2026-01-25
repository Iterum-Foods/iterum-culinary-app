/**
 * Enhanced Search System for Iterum R&D Chef Notebook
 * Provides advanced search, filtering, and search suggestions
 */

class EnhancedSearchSystem {
    constructor() {
        this.searchIndex = new Map();
        this.filters = {
            ingredients: [],
            difficulty: [],
            time: null,
            cuisine: [],
            dietary: [],
            equipment: [],
            tags: [],
            dateRange: null
        };
        this.savedSearches = this.loadSavedSearches();
        this.searchHistory = this.loadSearchHistory();
        this.debounceTimer = null;
        this.init();
    }

    /**
     * Initialize search system
     */
    init() {
        this.buildSearchIndex();
        this.setupEventListeners();
        this.injectStyles();
    }

    /**
     * Build search index from all data
     */
    buildSearchIndex() {
        // Index recipes
        const recipes = this.getAllRecipes();
        recipes.forEach(recipe => {
            this.indexRecipe(recipe);
        });

        // Index ingredients
        const ingredients = this.getAllIngredients();
        ingredients.forEach(ingredient => {
            this.indexIngredient(ingredient);
        });

        // Index equipment
        const equipment = this.getAllEquipment();
        equipment.forEach(item => {
            this.indexEquipment(item);
        });
    }

    /**
     * Index a recipe for search
     */
    indexRecipe(recipe) {
        const searchableText = [
            recipe.name,
            recipe.description,
            recipe.instructions?.join(' '),
            recipe.ingredients?.map(i => i.name).join(' '),
            recipe.tags?.join(' '),
            recipe.cuisine,
            recipe.difficulty
        ].filter(Boolean).join(' ').toLowerCase();

        this.searchIndex.set(`recipe_${recipe.id}`, {
            type: 'recipe',
            id: recipe.id,
            data: recipe,
            searchableText,
            tags: recipe.tags || [],
            difficulty: recipe.difficulty,
            cuisine: recipe.cuisine,
            time: recipe.cookingTime,
            ingredients: recipe.ingredients?.map(i => i.name) || [],
            dietary: recipe.dietaryRestrictions || []
        });
    }

    /**
     * Index an ingredient for search
     */
    indexIngredient(ingredient) {
        const searchableText = [
            ingredient.name,
            ingredient.description,
            ingredient.category,
            ingredient.allergens?.join(' '),
            ingredient.substitutions?.join(' ')
        ].filter(Boolean).join(' ').toLowerCase();

        this.searchIndex.set(`ingredient_${ingredient.id}`, {
            type: 'ingredient',
            id: ingredient.id,
            data: ingredient,
            searchableText,
            category: ingredient.category,
            allergens: ingredient.allergens || [],
            substitutions: ingredient.substitutions || []
        });
    }

    /**
     * Index equipment for search
     */
    indexEquipment(equipment) {
        const searchableText = [
            equipment.name,
            equipment.description,
            equipment.category,
            equipment.brand,
            equipment.model
        ].filter(Boolean).join(' ').toLowerCase();

        this.searchIndex.set(`equipment_${equipment.id}`, {
            type: 'equipment',
            id: equipment.id,
            data: equipment,
            searchableText,
            category: equipment.category,
            status: equipment.status
        });
    }

    /**
     * Perform advanced search
     */
    search(query, filters = {}, options = {}) {
        const {
            type = 'all',
            limit = 50,
            sortBy = 'relevance',
            sortOrder = 'desc'
        } = options;

        // Combine query with filters
        const searchFilters = { ...this.filters, ...filters };
        
        // Get searchable items
        let items = Array.from(this.searchIndex.values());
        
        // Filter by type
        if (type !== 'all') {
            items = items.filter(item => item.type === type);
        }

        // Apply text search
        if (query && query.trim()) {
            const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
            items = items.filter(item => {
                return searchTerms.every(term => 
                    item.searchableText.includes(term) ||
                    item.tags?.some(tag => tag.toLowerCase().includes(term))
                );
            });
        }

        // Apply filters
        items = this.applyFilters(items, searchFilters);

        // Sort results
        items = this.sortResults(items, sortBy, sortOrder);

        // Limit results
        items = items.slice(0, limit);

        // Add search to history
        if (query) {
            this.addToSearchHistory(query);
        }

        return {
            results: items,
            total: items.length,
            query,
            filters: searchFilters,
            suggestions: this.generateSuggestions(query)
        };
    }

    /**
     * Apply filters to search results
     */
    applyFilters(items, filters) {
        return items.filter(item => {
            // Ingredient filter
            if (filters.ingredients.length > 0) {
                if (item.type === 'recipe') {
                    const recipeIngredients = item.ingredients || [];
                    if (!filters.ingredients.some(filterIngredient => 
                        recipeIngredients.some(recipeIngredient => 
                            recipeIngredient.toLowerCase().includes(filterIngredient.toLowerCase())
                        )
                    )) {
                        return false;
                    }
                }
            }

            // Difficulty filter
            if (filters.difficulty.length > 0) {
                if (item.type === 'recipe' && item.difficulty) {
                    if (!filters.difficulty.includes(item.difficulty)) {
                        return false;
                    }
                }
            }

            // Time filter
            if (filters.time) {
                if (item.type === 'recipe' && item.time) {
                    if (item.time > filters.time) {
                        return false;
                    }
                }
            }

            // Cuisine filter
            if (filters.cuisine.length > 0) {
                if (item.type === 'recipe' && item.cuisine) {
                    if (!filters.cuisine.includes(item.cuisine)) {
                        return false;
                    }
                }
            }

            // Dietary filter
            if (filters.dietary.length > 0) {
                if (item.type === 'recipe' && item.dietary) {
                    if (!filters.dietary.some(diet => 
                        item.dietary.includes(diet)
                    )) {
                        return false;
                    }
                }
            }

            // Equipment filter
            if (filters.equipment.length > 0) {
                if (item.type === 'recipe' && item.data.equipment) {
                    if (!filters.equipment.some(equipment => 
                        item.data.equipment.includes(equipment)
                    )) {
                        return false;
                    }
                }
            }

            // Tags filter
            if (filters.tags.length > 0) {
                if (item.tags) {
                    if (!filters.tags.some(tag => 
                        item.tags.includes(tag)
                    )) {
                        return false;
                    }
                }
            }

            // Date range filter
            if (filters.dateRange) {
                if (item.data.createdAt) {
                    const itemDate = new Date(item.data.createdAt);
                    if (itemDate < filters.dateRange.start || itemDate > filters.dateRange.end) {
                        return false;
                    }
                }
            }

            return true;
        });
    }

    /**
     * Sort search results
     */
    sortResults(items, sortBy, sortOrder) {
        return items.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'relevance':
                    // Relevance is already handled by search algorithm
                    comparison = 0;
                    break;
                case 'name':
                    comparison = a.data.name.localeCompare(b.data.name);
                    break;
                case 'date':
                    comparison = new Date(a.data.createdAt || 0) - new Date(b.data.createdAt || 0);
                    break;
                case 'difficulty':
                    const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3, 'Expert': 4 };
                    comparison = (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0);
                    break;
                case 'time':
                    comparison = (a.time || 0) - (b.time || 0);
                    break;
                case 'rating':
                    comparison = (a.data.rating || 0) - (b.data.rating || 0);
                    break;
            }

            return sortOrder === 'desc' ? -comparison : comparison;
        });
    }

    /**
     * Generate search suggestions
     */
    generateSuggestions(query) {
        if (!query || query.length < 2) return [];

        const suggestions = new Set();
        const queryLower = query.toLowerCase();

        // Get suggestions from search index
        this.searchIndex.forEach(item => {
            // Name suggestions
            if (item.data.name.toLowerCase().includes(queryLower)) {
                suggestions.add(item.data.name);
            }

            // Tag suggestions
            if (item.tags) {
                item.tags.forEach(tag => {
                    if (tag.toLowerCase().includes(queryLower)) {
                        suggestions.add(tag);
                    }
                });
            }

            // Ingredient suggestions
            if (item.ingredients) {
                item.ingredients.forEach(ingredient => {
                    if (ingredient.toLowerCase().includes(queryLower)) {
                        suggestions.add(ingredient);
                    }
                });
            }
        });

        // Get suggestions from search history
        this.searchHistory.forEach(historyItem => {
            if (historyItem.toLowerCase().includes(queryLower)) {
                suggestions.add(historyItem);
            }
        });

        return Array.from(suggestions).slice(0, 10);
    }

    /**
     * Add search to history
     */
    addToSearchHistory(query) {
        const trimmedQuery = query.trim();
        if (trimmedQuery.length < 2) return;

        // Remove if already exists
        this.searchHistory = this.searchHistory.filter(item => item !== trimmedQuery);
        
        // Add to beginning
        this.searchHistory.unshift(trimmedQuery);
        
        // Keep only last 50 searches
        this.searchHistory = this.searchHistory.slice(0, 50);
        
        this.saveSearchHistory();
    }

    /**
     * Save search
     */
    saveSearch(name, query, filters) {
        const savedSearch = {
            id: Date.now().toString(),
            name,
            query,
            filters,
            createdAt: new Date().toISOString()
        };

        this.savedSearches.push(savedSearch);
        this.saveSavedSearches();
        
        return savedSearch;
    }

    /**
     * Load saved search
     */
    loadSavedSearch(searchId) {
        const savedSearch = this.savedSearches.find(search => search.id === searchId);
        if (savedSearch) {
            return this.search(savedSearch.query, savedSearch.filters);
        }
        return null;
    }

    /**
     * Delete saved search
     */
    deleteSavedSearch(searchId) {
        this.savedSearches = this.savedSearches.filter(search => search.id !== searchId);
        this.saveSavedSearches();
    }

    /**
     * Get available filter options
     */
    getFilterOptions() {
        const options = {
            difficulties: new Set(),
            cuisines: new Set(),
            dietary: new Set(),
            categories: new Set(),
            tags: new Set()
        };

        this.searchIndex.forEach(item => {
            if (item.difficulty) options.difficulties.add(item.difficulty);
            if (item.cuisine) options.cuisines.add(item.cuisine);
            if (item.dietary) item.dietary.forEach(diet => options.dietary.add(diet));
            if (item.data.category) options.categories.add(item.data.category);
            if (item.tags) item.tags.forEach(tag => options.tags.add(tag));
        });

        return {
            difficulties: Array.from(options.difficulties).sort(),
            cuisines: Array.from(options.cuisines).sort(),
            dietary: Array.from(options.dietary).sort(),
            categories: Array.from(options.categories).sort(),
            tags: Array.from(options.tags).sort()
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input with debouncing
        document.addEventListener('input', (e) => {
            if (e.target.matches('.search-input')) {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.handleSearchInput(e.target);
                }, 300);
            }
        });

        // Filter changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('.search-filter')) {
                this.handleFilterChange(e.target);
            }
        });

        // Search form submission
        document.addEventListener('submit', (e) => {
            if (e.target.matches('.search-form')) {
                e.preventDefault();
                this.handleSearchSubmit(e.target);
            }
        });
    }

    /**
     * Handle search input
     */
    handleSearchInput(input) {
        const query = input.value.trim();
        const suggestionsContainer = document.getElementById('search-suggestions');
        
        if (query.length < 2) {
            if (suggestionsContainer) {
                suggestionsContainer.style.display = 'none';
            }
            return;
        }

        const suggestions = this.generateSuggestions(query);
        this.showSuggestions(suggestions, input);
    }

    /**
     * Show search suggestions
     */
    showSuggestions(suggestions, input) {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (!suggestionsContainer) return;

        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        suggestionsContainer.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" onclick="enhancedSearch.selectSuggestion('${suggestion}', '${input.id}')">
                <span class="suggestion-text">${suggestion}</span>
                <span class="suggestion-type">suggestion</span>
            </div>
        `).join('');

        suggestionsContainer.style.display = 'block';
    }

    /**
     * Select a suggestion
     */
    selectSuggestion(suggestion, inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = suggestion;
            this.performSearch(suggestion);
        }
        
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    /**
     * Handle filter change
     */
    handleFilterChange(filter) {
        const filterType = filter.dataset.filterType;
        const filterValue = filter.value;

        if (filter.multiple) {
            // Handle multiple select
            const selectedValues = Array.from(filter.selectedOptions).map(option => option.value);
            this.filters[filterType] = selectedValues;
        } else {
            // Handle single select
            this.filters[filterType] = filterValue;
        }

        this.performSearch();
    }

    /**
     * Handle search form submission
     */
    handleSearchSubmit(form) {
        const query = form.querySelector('.search-input').value.trim();
        this.performSearch(query);
    }

    /**
     * Fetch directory tree from backend
     */
    async fetchDirectoryTree(path = '.') {
        const res = await fetch(`/api/list_dir?path=${encodeURIComponent(path)}`);
        if (!res.ok) return [];
        return await res.json();
    }

    /**
     * Render the full search interface (modernized)
     */
    async renderSearchInterface(containerId = 'enhanced-search') {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="enhanced-search-main-container" tabindex="0">
                <form class="search-bar-form" aria-label="File search form" onsubmit="return false;">
                    <input type="text" class="search-input" id="file-search-input" placeholder="🔍 Search files..." aria-label="Search files" autocomplete="off" />
                    <button type="button" class="search-btn" id="file-search-btn" title="Search">Search</button>
                </form>
                <div class="search-status-bar" id="search-status-bar" aria-live="polite"></div>
                <div class="search-flex-row">
                    <div class="dir-browser-outer">
                        <div id="directory-browser"></div>
                    </div>
                    <div class="search-results-outer">
                        <div id="search-results"></div>
                    </div>
                </div>
            </div>
        `;
        // Render directory browser
        await this.renderDirectoryBrowser('directory-browser', '.');
        // Setup search bar events
        const input = document.getElementById('file-search-input');
        const btn = document.getElementById('file-search-btn');
        if (input) {
            input.addEventListener('keydown', e => { if (e.key === 'Enter') this.performSearch(input.value); });
        }
        if (btn) {
            btn.onclick = () => this.performSearch(input.value);
        }
        // Initial status
        this.updateStatusBar(0);
    }

    /**
     * Update the status bar with file count and selected folders
     */
    updateStatusBar(fileCount = 0) {
        const bar = document.getElementById('search-status-bar');
        if (!bar) return;
        const folders = this.getSelectedFolders();
        bar.innerHTML = `<span class="status-files">${fileCount} file${fileCount === 1 ? '' : 's'} found</span> | <span class="status-folders" title="Folders being searched">${folders.length} folder${folders.length === 1 ? '' : 's'} selected</span>`;
    }

    /**
     * Render directory browser window (with Select All)
     */
    async renderDirectoryBrowser(containerId = 'directory-browser', rootPath = '.') {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="dir-browser-header">
                <span class="dir-browser-title">📁 Directory Browser</span>
                <button class="dir-clear-btn" title="Clear selection">Clear</button>
            </div>
            <div class="dir-browser-selectall"><label><input type="checkbox" id="dir-select-all" aria-label="Select all folders"> Select All</label></div>
            <div class="dir-browser-tree"><div class="dir-loading"><span class='spinner'></span> Loading folders...</div></div>
        `;
        const treeContainer = container.querySelector('.dir-browser-tree');
        const clearBtn = container.querySelector('.dir-clear-btn');
        const selectAll = container.querySelector('#dir-select-all');
        if (clearBtn) {
            clearBtn.onclick = () => {
                this.selectedFolders = new Set();
                this.renderDirectoryBrowser(containerId, rootPath);
            };
        }
        try {
            const dirs = await this.fetchDirectoryTree(rootPath);
            treeContainer.innerHTML = this.renderDirectoryTree(dirs, rootPath);
            // Add click listeners
            treeContainer.querySelectorAll('.dir-folder').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const path = el.dataset.path;
                    this.toggleFolder(el, path);
                });
            });
            // Add select listeners
            treeContainer.querySelectorAll('.dir-select').forEach(el => {
                el.addEventListener('change', (e) => {
                    this.handleFolderSelect(e.target);
                });
            });
            // Select All logic
            if (selectAll) {
                selectAll.onchange = (e) => {
                    const allChecks = treeContainer.querySelectorAll('.dir-select');
                    allChecks.forEach(cb => { cb.checked = selectAll.checked; this.handleFolderSelect(cb); });
                };
            }
        } catch (err) {
            treeContainer.innerHTML = `<div class='dir-error'>Error loading folders</div>`;
        }
    }

    /**
     * Render directory tree HTML (modernized)
     */
    renderDirectoryTree(dirs, basePath) {
        if (!dirs || dirs.length === 0) return '<div class="dir-empty">No folders found</div>';
        return `<ul class="dir-tree">${dirs.map(dir => `
            <li>
                <label class="dir-label">
                    <input type="checkbox" class="dir-select" data-path="${dir.path}">
                    <span class="dir-icon">${dir.subdirs && dir.subdirs.length > 0 ? '📂' : '📁'}</span>
                    <span class="dir-name">${dir.name}</span>
                </label>
                ${dir.subdirs && dir.subdirs.length > 0 ? `<span class="dir-folder" data-path="${dir.path}" title="Expand/collapse">▶</span><div class="dir-children" style="display:none;"></div>` : ''}
            </li>
        `).join('')}</ul>`;
    }

    /**
     * Toggle folder open/close (modernized)
     */
    async toggleFolder(el, path) {
        const childrenDiv = el.parentElement.querySelector('.dir-children');
        if (!childrenDiv) return;
        if (childrenDiv.style.display === 'none') {
            childrenDiv.innerHTML = '<div class="dir-loading"><span class="spinner"></span> Loading...</div>';
            childrenDiv.style.display = 'block';
            const dirs = await this.fetchDirectoryTree(path);
            childrenDiv.innerHTML = this.renderDirectoryTree(dirs, path);
            // Add listeners recursively
            childrenDiv.querySelectorAll('.dir-folder').forEach(childEl => {
                childEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const childPath = childEl.dataset.path;
                    this.toggleFolder(childEl, childPath);
                });
            });
            childrenDiv.querySelectorAll('.dir-select').forEach(childEl => {
                childEl.addEventListener('change', (e) => {
                    this.handleFolderSelect(e.target);
                });
            });
            el.textContent = '▼';
        } else {
            childrenDiv.style.display = 'none';
            el.textContent = '▶';
        }
    }

    /**
     * Handle folder selection
     */
    handleFolderSelect(checkbox) {
        if (!this.selectedFolders) this.selectedFolders = new Set();
        const path = checkbox.dataset.path;
        if (checkbox.checked) {
            this.selectedFolders.add(path);
        } else {
            this.selectedFolders.delete(path);
        }
    }

    /**
     * Get selected folders for search
     */
    getSelectedFolders() {
        return this.selectedFolders ? Array.from(this.selectedFolders) : ['.'];
    }

    /**
     * Override performSearch to use selected folders
     */
    async performSearch(query = '') {
        const folders = this.getSelectedFolders();
        // Call backend search API
        const params = new URLSearchParams({ query });
        folders.forEach(f => params.append('folders', f));
        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();
        this.displayFileSearchResults(data.results);
    }

    /**
     * Display file search results (modernized, robust)
     */
    displayFileSearchResults(results) {
        const resultsContainer = document.getElementById('search-results');
        this.updateStatusBar(results ? results.length : 0);
        if (!resultsContainer) return;
        if (!results || results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No files found</div>';
            return;
        }
        resultsContainer.innerHTML = results.map(path => {
            const fileName = path.split(/[\\/]/).pop();
            return `<div class="file-result" tabindex="0" title="Open file" aria-label="File result">
                <span class="file-icon">🗎</span>
                <span class="file-name" style="font-weight:bold;">${fileName}</span>
                <span class="file-path">${path}</span>
                <button class="copy-btn" title="Copy path" aria-label="Copy file path" tabindex="0">📋</button>
            </div>`;
        }).join('');
        // Make file results clickable (try to open in new tab if possible)
        resultsContainer.querySelectorAll('.file-result').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('copy-btn')) return;
                const filePath = el.querySelector('.file-path').textContent;
                window.open('file://' + filePath, '_blank');
            });
        });
        // Copy to clipboard
        resultsContainer.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const filePath = btn.parentElement.querySelector('.file-path').textContent;
                navigator.clipboard.writeText(filePath);
                btn.textContent = '✅';
                setTimeout(() => { btn.textContent = '📋'; }, 1200);
            });
        });
    }

    /**
     * Display search results
     */
    displaySearchResults(searchResults) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;

        if (searchResults.results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No results found</h3>
                    <p>Try adjusting your search terms or filters</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = searchResults.results.map(item => 
            this.renderSearchResult(item)
        ).join('');
    }

    /**
     * Render a search result item
     */
    renderSearchResult(item) {
        const typeIcon = {
            recipe: '🍳',
            ingredient: '🥘',
            equipment: '🔧'
        };

        return `
            <div class="search-result-item" data-type="${item.type}" data-id="${item.id}">
                <div class="result-icon">${typeIcon[item.type]}</div>
                <div class="result-content">
                    <h4 class="result-title">${item.data.name}</h4>
                    <p class="result-description">${item.data.description || ''}</p>
                    <div class="result-meta">
                        ${item.type === 'recipe' ? `
                            <span class="result-difficulty">${item.difficulty || 'Unknown'}</span>
                            <span class="result-time">${item.time || 'Unknown'} min</span>
                        ` : ''}
                        ${item.tags ? `
                            <div class="result-tags">
                                ${item.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="result-actions">
                    <button onclick="enhancedSearch.viewItem('${item.type}', '${item.id}')" class="btn-view">View</button>
                    <button onclick="enhancedSearch.editItem('${item.type}', '${item.id}')" class="btn-edit">Edit</button>
                </div>
            </div>
        `;
    }

    /**
     * View an item
     */
    viewItem(type, id) {
        // Navigate to appropriate page
        switch (type) {
            case 'recipe':
                window.location.href = `recipe-review.html?id=${id}`;
                break;
            case 'ingredient':
                window.location.href = `ingredients.html?id=${id}`;
                break;
            case 'equipment':
                window.location.href = `equipment-management.html?id=${id}`;
                break;
        }
    }

    /**
     * Edit an item
     */
    editItem(type, id) {
        // Navigate to edit page
        switch (type) {
            case 'recipe':
                window.location.href = `recipe-developer.html?id=${id}`;
                break;
            case 'ingredient':
                window.location.href = `ingredients.html?edit=${id}`;
                break;
            case 'equipment':
                window.location.href = `equipment-management.html?edit=${id}`;
                break;
        }
    }

    /**
     * Load saved searches from localStorage
     */
    loadSavedSearches() {
        try {
            const saved = localStorage.getItem('savedSearches');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading saved searches:', error);
            return [];
        }
    }

    /**
     * Save searches to localStorage
     */
    saveSavedSearches() {
        try {
            localStorage.setItem('savedSearches', JSON.stringify(this.savedSearches));
        } catch (error) {
            console.error('Error saving searches:', error);
        }
    }

    /**
     * Load search history from localStorage
     */
    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('searchHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading search history:', error);
            return [];
        }
    }

    /**
     * Save search history to localStorage
     */
    saveSearchHistory() {
        try {
            localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    /**
     * Get all recipes (placeholder - implement based on your data structure)
     */
    getAllRecipes() {
        // This should be implemented based on your actual data structure
        return window.recipeLibrary ? window.recipeLibrary.getAllRecipes() : [];
    }

    /**
     * Get all ingredients (placeholder - implement based on your data structure)
     */
    getAllIngredients() {
        // This should be implemented based on your actual data structure
        return window.ingredientLibrary ? window.ingredientLibrary.getAllIngredients() : [];
    }

    /**
     * Get all equipment (placeholder - implement based on your data structure)
     */
    getAllEquipment() {
        // This should be implemented based on your actual data structure
        return window.equipmentManager ? window.equipmentManager.getAllEquipment() : [];
    }

    /**
     * Inject search styles
     */
    injectStyles() {
        const styles = `
            /* Enhanced Search Styles */
            .enhanced-search-main-container { box-shadow: 0 4px 24px rgba(60,60,100,0.08); border: 1.5px solid #e5e7eb; border-radius: 12px; background: #fff; padding: 2em 2em 1.5em 2em; margin: 2em auto; max-width: 1100px; }
            .search-bar-form { display: flex; gap: 0.5em; margin-bottom: 1em; }
            .search-input { flex: 1; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px 0 0 8px; font-size: 16px; transition: border-color 0.2s; background: #f9fafb; }
            .search-input:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.08); }
            .search-btn { background: #4f46e5; color: #fff; border: none; border-radius: 0 8px 8px 0; padding: 0 22px; font-size: 1.1em; font-weight: 600; cursor: pointer; transition: background 0.2s; }
            .search-btn:hover, .search-btn:focus { background: #3730a3; }
            .search-status-bar { font-size: 1em; color: #444; margin-bottom: 1em; background: #f3f4f6; border-radius: 6px; padding: 0.5em 1em; display: flex; gap: 1.5em; align-items: center; }
            .search-flex-row { display: flex; gap: 2em; }
            .dir-browser-outer { min-width: 270px; max-width: 320px; flex: 0 0 320px; }
            .search-results-outer { flex: 1; min-width: 0; }
            /* Directory browser styles */
            .dir-browser-header { display: flex; align-items: center; justify-content: space-between; padding: 0.5em 0.5em 0.5em 0; border-bottom: 1px solid #e5e7eb; background: #f9fafb; border-radius: 8px 8px 0 0; }
            .dir-browser-title { font-weight: 700; font-size: 1.1em; color: #3730a3; letter-spacing: 0.5px; }
            .dir-clear-btn { background: #e0e7ff; color: #3730a3; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.95em; cursor: pointer; transition: background 0.2s; }
            .dir-clear-btn:hover { background: #c7d2fe; }
            .dir-browser-selectall { padding: 0.5em 0.5em 0.5em 0; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
            .dir-browser-tree { max-height: 350px; overflow-y: auto; background: #fff; border-radius: 0 0 8px 8px; }
            .dir-tree { list-style: none; padding-left: 1em; }
            .dir-label { display: flex; align-items: center; gap: 0.5em; cursor: pointer; }
            .dir-icon { font-size: 1.1em; }
            .dir-name { font-size: 1em; color: #22223b; }
            .dir-folder { color: #4f46e5; cursor: pointer; margin-left: 0.5em; font-size: 1em; user-select: none; transition: color 0.2s; }
            .dir-folder:hover { color: #3730a3; }
            .dir-children { margin-left: 1.5em; }
            .dir-loading { color: #888; font-style: italic; display: flex; align-items: center; gap: 0.5em; }
            .dir-empty { color: #aaa; }
            .dir-error { color: #b91c1c; font-weight: 500; }
            .file-result { padding: 10px 0; border-bottom: 1px solid #eee; cursor: pointer; display: flex; align-items: center; gap: 0.7em; transition: background 0.15s; outline: none; }
            .file-result:hover, .file-result:focus { background: #f3f4f6; }
            .file-icon { font-size: 1.1em; }
            .file-name { font-size: 1.08em; color: #22223b; margin-right: 0.5em; }
            .file-path { font-family: monospace; font-size: 0.98em; color: #3730a3; word-break: break-all; opacity: 0.7; }
            .copy-btn { background: #e0e7ff; color: #3730a3; border: none; border-radius: 4px; padding: 2px 8px; font-size: 1em; cursor: pointer; margin-left: 0.5em; transition: background 0.2s; }
            .copy-btn:hover, .copy-btn:focus { background: #c7d2fe; }
            .spinner { display: inline-block; width: 1em; height: 1em; border: 2px solid #c7d2fe; border-top: 2px solid #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

// Initialize enhanced search system when dependencies are ready
function initializeEnhancedSearch() {
    if (window.equipmentManager && typeof window.equipmentManager.getAllEquipment === 'function') {
        const enhancedSearch = new EnhancedSearchSystem();
        window.enhancedSearch = enhancedSearch;
        console.log('✅ Enhanced search system initialized');
    } else {
        console.log('⏳ Waiting for equipmentManager to be available...');
        setTimeout(initializeEnhancedSearch, 100);
    }
}

// Start initialization
initializeEnhancedSearch();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedSearchSystem;
} 