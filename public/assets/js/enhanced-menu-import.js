/**
 * Enhanced Menu Import Handler
 * Adds recipe linking and FOH notes creation to imported menu items
 */

class EnhancedMenuImport {
    constructor() {
        this.importedItems = [];
        this.menuInfo = null;
    }

    /**
     * Show import results with recipe linking options
     */
    showImportResults(items, menuInfo = null) {
        this.importedItems = items;
        this.menuInfo = menuInfo;
        
        const modal = document.getElementById('import-results-modal');
        if (!modal) return;

        // Show menu info if available
        this.displayMenuInfo(menuInfo);
        
        // Show summary
        this.displaySummary(items);
        
        // Show items with recipe linking
        this.displayItems(items);
        
        // Show modal
        modal.style.display = 'block';
    }

    /**
     * Display menu information
     */
    displayMenuInfo(menuInfo) {
        const container = document.getElementById('import-menu-info');
        const display = document.getElementById('menu-info-display');
        
        if (!menuInfo || !display || !container) return;

        display.innerHTML = `
            <div class="form-group">
                <strong>Menu:</strong> ${menuInfo.name || 'Untitled'}
            </div>
            ${menuInfo.description ? `
                <div class="form-group">
                    <strong>Description:</strong> ${menuInfo.description}
                </div>
            ` : ''}
            ${menuInfo.type ? `
                <div class="form-group">
                    <strong>Type:</strong> ${menuInfo.type}
                </div>
            ` : ''}
        `;
        
        container.style.display = 'block';
    }

    /**
     * Display import summary
     */
    displaySummary(items) {
        const container = document.getElementById('import-summary');
        if (!container) return;

        const categories = [...new Set(items.map(i => i.category))];
        const totalItems = items.length;
        const avgPrice = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0) / totalItems || 0;

        container.innerHTML = `
            <div class="file-preview-body">
                <div class="preview-stat">
                    <div class="preview-stat-label">Total Items</div>
                    <div class="preview-stat-value">${totalItems}</div>
                </div>
                <div class="preview-stat">
                    <div class="preview-stat-label">Categories</div>
                    <div class="preview-stat-value">${categories.length}</div>
                </div>
                <div class="preview-stat">
                    <div class="preview-stat-label">Avg Price</div>
                    <div class="preview-stat-value">$${avgPrice.toFixed(2)}</div>
                </div>
            </div>
        `;
    }

    /**
     * Display items with recipe linking options
     */
    displayItems(items) {
        const container = document.getElementById('import-items-list');
        if (!container) return;

        // Load existing menu items from database for mapping
        const existingItems = window.menuItemsDatabase ? window.menuItemsDatabase.getAllItems() : [];

        container.innerHTML = items.map((item, index) => {
            // Initialize mapping state if not set
            if (!item.mappingType) {
                item.mappingType = null; // 'existing' or 'new'
                item.mappedToItemId = null;
            }

            return `
            <div class="parse-item" data-item-index="${index}" style="border: 2px solid var(--iterum-border-light); border-radius: 12px; padding: 20px; margin-bottom: 16px; background: white;">
                <div class="parse-item-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <div class="parse-item-name" style="font-size: 1.2rem; font-weight: 700; color: var(--iterum-text-primary); margin-bottom: 4px;">
                            ${this.escapeHtml(item.name)}
                        </div>
                        ${item.price ? `
                            <div class="parse-item-price" style="font-size: 1.1rem; color: var(--iterum-accent-primary); font-weight: 600;">
                                $${Number(item.price).toFixed(2)}
                            </div>
                        ` : ''}
                        <div class="parse-item-category" style="display: inline-block; padding: 4px 12px; background: var(--iterum-bg-secondary); border-radius: 6px; font-size: 0.875rem; color: var(--iterum-text-tertiary); margin-top: 8px;">
                            ${this.escapeHtml(item.category || 'Uncategorized')}
                        </div>
                    </div>
                </div>
                ${item.description ? `
                    <div class="parse-item-description" style="color: var(--iterum-text-secondary); margin-bottom: 16px; font-size: 0.95rem;">
                        ${this.escapeHtml(item.description)}
                    </div>
                ` : ''}
                
                <!-- Dish Mapping Section -->
                <div style="padding: 16px; background: #f0f9ff; border-radius: 8px; border: 1px solid #bae6fd;">
                    <div style="font-weight: 700; color: #0369a1; margin-bottom: 12px; font-size: 0.9rem;">
                        🗺️ Map to Existing Dish or Create New
                    </div>
                    
                    <!-- Option 1: Map to Existing -->
                    <div style="margin-bottom: 12px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
                            <input type="radio" name="mapping-${index}" value="existing" ${item.mappingType === 'existing' ? 'checked' : ''} 
                                   onchange="enhancedMenuImport.setMappingType(${index}, 'existing')" style="cursor: pointer;">
                            <span style="font-weight: 600; color: var(--iterum-text-primary);">Link to Existing Dish</span>
                        </label>
                        ${item.mappingType === 'existing' ? `
                            <div style="margin-left: 24px; margin-top: 8px;">
                                <input type="text" id="existing-dish-search-${index}" class="form-input" 
                                       placeholder="🔍 Search existing dishes..." 
                                       style="width: 100%; margin-bottom: 8px; padding: 10px;"
                                       onkeyup="enhancedMenuImport.filterExistingDishes(${index}, this.value)">
                                <select id="existing-dish-select-${index}" class="form-select" 
                                        onchange="enhancedMenuImport.setMappedToItem(${index}, this.value)">
                                    <option value="">-- Select existing dish --</option>
                                    ${existingItems.map(existing => `
                                        <option value="${existing.id}" 
                                                data-name="${this.escapeHtml(existing.name).toLowerCase()}" 
                                                data-category="${this.escapeHtml(existing.category || '').toLowerCase()}"
                                                ${item.mappedToItemId === existing.id ? 'selected' : ''}>
                                            ${this.escapeHtml(existing.name)} - ${existing.category} - $${(existing.price || 0).toFixed(2)}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Option 2: Create New -->
                    <div>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
                            <input type="radio" name="mapping-${index}" value="new" ${item.mappingType === 'new' ? 'checked' : ''} 
                                   onchange="enhancedMenuImport.setMappingType(${index}, 'new')" style="cursor: pointer;">
                            <span style="font-weight: 600; color: var(--iterum-text-primary);">Create New Dish</span>
                        </label>
                        ${item.mappingType === 'new' ? `
                            <div style="margin-left: 24px; margin-top: 8px; padding: 12px; background: #fef3c7; border-radius: 6px; border: 1px solid #fbbf24;">
                                <small style="color: #92400e;">
                                    ✅ New dish will be created. Recipe selection required when applying to menu.
                                </small>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${!item.mappingType ? `
                        <div style="margin-top: 12px; padding: 12px; background: #fee2e2; border-radius: 6px; border: 1px solid #fca5a5;">
                            <small style="color: #991b1b;">
                                ⚠️ Please select an option above (Link to Existing or Create New)
                            </small>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        }).join('');

        // Update mapped count
        this.updateMappedCount();
    }

    /**
     * Set mapping type for an item
     */
    setMappingType(index, type) {
        const item = this.importedItems[index];
        if (!item) return;

        item.mappingType = type;
        if (type === 'existing') {
            item.mappedToItemId = null;
        }

        // Re-render to show/hide options
        this.displayItems(this.importedItems);
    }

    /**
     * Set mapped to item ID
     */
    setMappedToItem(index, itemId) {
        const item = this.importedItems[index];
        if (!item) return;

        item.mappedToItemId = itemId;
        this.updateMappedCount();
    }

    /**
     * Update mapped count display
     */
    updateMappedCount() {
        const total = this.importedItems.length;
        const mapped = this.importedItems.filter(item => item.mappingType).length;
        const countEl = document.getElementById('mapped-count');
        if (countEl) {
            countEl.textContent = `${mapped}/${total}`;
        }
    }

    /**
     * Filter existing dishes dropdown by search term
     */
    filterExistingDishes(index, searchTerm) {
        const select = document.getElementById(`existing-dish-select-${index}`);
        if (!select) return;

        const term = searchTerm.toLowerCase().trim();
        const options = select.querySelectorAll('option');

        options.forEach(option => {
            if (option.value === '') {
                // Always show the placeholder option
                option.style.display = '';
                return;
            }

            const name = option.dataset.name || '';
            const category = option.dataset.category || '';
            
            if (!term || name.includes(term) || category.includes(term)) {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        });

        // Reset selection if current selection is hidden
        if (select.value) {
            const selectedOption = select.querySelector(`option[value="${select.value}"]`);
            if (selectedOption && selectedOption.style.display === 'none') {
                select.value = '';
                this.setMappedToItem(index, '');
            }
        }
    }

    /**
     * Link to existing recipe
     */
    linkRecipe(index) {
        const item = this.importedItems[index];
        if (!item) return;

        // TODO: Show recipe selector modal
        console.log('Linking recipe for:', item.name);
        
        // For now, just mark as linked
        const itemElement = document.querySelector(`[data-item-index="${index}"]`);
        if (itemElement) {
            const actionsDiv = itemElement.querySelector('.parse-item-recipe-actions');
            if (actionsDiv) {
                actionsDiv.innerHTML = '<div class="recipe-linked-badge">✓ Recipe Linked</div>';
            }
        }
        
        // Store the link intent
        item.recipeLink = 'existing';
    }

    /**
     * Create new recipe for this item
     */
    createRecipe(index) {
        const item = this.importedItems[index];
        if (!item) return;

        // TODO: Create recipe with item details
        console.log('Creating recipe for:', item.name);
        
        // Mark as creating
        const itemElement = document.querySelector(`[data-item-index="${index}"]`);
        if (itemElement) {
            const actionsDiv = itemElement.querySelector('.parse-item-recipe-actions');
            if (actionsDiv) {
                actionsDiv.innerHTML = '<div class="recipe-linked-badge">✓ Creating Recipe...</div>';
            }
        }
        
        // Store the creation intent
        item.recipeLink = 'new';
        item.needsRecipe = true;
    }

    /**
     * Apply dish mapping results to menu
     */
    async applyDishMappingResults() {
        if (!this.importedItems || this.importedItems.length === 0) {
            alert('No items to apply.');
            return;
        }

        // Validate all items are mapped
        const unmapped = this.importedItems.filter(item => !item.mappingType);
        if (unmapped.length > 0) {
            alert(`⚠️ Please map all dishes before applying.\n\n${unmapped.length} dish(es) still need mapping.`);
            return;
        }

        // Validate existing mappings have selected items
        const invalidExisting = this.importedItems.filter(item => 
            item.mappingType === 'existing' && !item.mappedToItemId
        );
        if (invalidExisting.length > 0) {
            alert(`⚠️ Please select existing dishes for all "Link to Existing" mappings.\n\n${invalidExisting.length} mapping(s) incomplete.`);
            return;
        }

        console.log('📥 Applying dish mappings:', this.importedItems);

        // Get current menu
        const currentMenu = window.currentSelectedMenu || window.enhancedMenuManager?.currentMenu;
        if (!currentMenu) {
            alert('No menu selected. Please select a menu first.');
            return;
        }

        const targetMenuId = currentMenu.id;

        try {
            let linkedCount = 0;
            let createdCount = 0;

            // Process each mapped item
            for (const item of this.importedItems) {
                if (item.mappingType === 'existing') {
                    // Link to existing menu item
                    const existingItem = window.menuItemsDatabase?.getMenuItem(item.mappedToItemId);
                    if (existingItem) {
                        // Link item to this menu
                        window.menuItemsDatabase.linkToMenu(item.mappedToItemId, targetMenuId);
                        
                        // Add to menu's items array
                        if (!currentMenu.items) currentMenu.items = [];
                        if (!currentMenu.items.find(i => i.id === existingItem.id)) {
                            currentMenu.items.push(existingItem);
                        }
                        
                        linkedCount++;
                    }
                } else if (item.mappingType === 'new') {
                    // Create new menu item (will require recipe when added)
                    if (window.enhancedMenuManager) {
                        await window.enhancedMenuManager.addMenuItem({
                            name: item.name,
                            description: item.description || '',
                            category: item.category || 'Main Courses',
                            price: item.price || 0,
                            allergens: item.allergens || [],
                            dietaryInfo: item.dietaryInfo || [],
                            recipeId: null // Will need to be set via recipe creation/selection
                        }, true); // Create recipe automatically
                        
                        createdCount++;
                    }
                }
            }

            // Update menu in user's menus list
            const user = window.authManager?.currentUser;
            if (user) {
                const userId = user.userId || user.id;
                const menuKey = `menus_${userId}`;
                const menus = JSON.parse(localStorage.getItem(menuKey) || '[]');
                const menuIndex = menus.findIndex(m => m.id === targetMenuId);
                if (menuIndex !== -1) {
                    menus[menuIndex] = currentMenu;
                    localStorage.setItem(menuKey, JSON.stringify(menus));
                }
            }

            // Save menu in EnhancedMenuManager
            if (window.enhancedMenuManager) {
                window.enhancedMenuManager.currentMenu = currentMenu;
                window.enhancedMenuManager.menuItems = currentMenu.items || [];
                await window.enhancedMenuManager.saveMenu();
                window.enhancedMenuManager.renderMenuItems();
            }

            // Update display
            if (window.currentSelectedMenu && typeof displayMenuItems === 'function') {
                displayMenuItems(currentMenu);
            }

            this.closeModal();

            if (window.enhancedMenuManager?.showToast) {
                window.enhancedMenuManager.showToast(
                    `✅ Mapped ${this.importedItems.length} dishes! (${linkedCount} linked, ${createdCount} created)`,
                    'success'
                );
            } else {
                alert(`✅ Mapped ${this.importedItems.length} dishes! (${linkedCount} linked, ${createdCount} created)`);
            }

        } catch (error) {
            console.error('❌ Error applying dish mappings:', error);
            alert(`Error: ${error.message || 'Failed to apply dish mappings. Check console for details.'}`);
        }
    }

    /**
     * Apply import results to menu (legacy method - now redirects to mapping)
     */
    async applyResults() {
        // Redirect to dish mapping workflow
        await this.applyDishMappingResults();
    }

    /**
     * Create FOH notes for all imported items
     */
    async createFOHNotes(menuId = null) {
        // Get existing notes or create new list
        const notesKey = `iterum_foh_notes_${this.getCurrentUserId()}_${this.getCurrentProjectId()}`;
        let notes = [];
        
        try {
            const stored = localStorage.getItem(notesKey);
            if (stored) {
                notes = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error loading FOH notes:', e);
        }

        // Create notes for each menu item
        for (const item of this.importedItems) {
            const note = {
                id: Date.now() + Math.random(),
                menuItem: item.name,
                category: item.category,
                price: item.price,
                description: item.description || '',
                allergens: item.allergens || [],
                dietaryInfo: item.dietaryInfo || [],
                ingredients: [],
                prepTime: '',
                cookingTime: '',
                notes: '',
                warnings: '',
                menuId: menuId || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            notes.push(note);
        }

        // Save notes
        try {
            localStorage.setItem(notesKey, JSON.stringify(notes));
            console.log(`Created ${this.importedItems.length} FOH notes`);
        } catch (e) {
            console.error('Error saving FOH notes:', e);
        }
    }

    /**
     * Create recipes for items that need them
     */
    async createRecipes(menuId = null) {
        const itemsNeedingRecipes = this.importedItems.filter(i => i.needsRecipe);
        
        if (itemsNeedingRecipes.length === 0) return;

        // Load existing recipes
        const recipesKey = `iterum_recipes_${this.getCurrentUserId()}_${this.getCurrentProjectId()}`;
        let recipes = [];
        
        try {
            const stored = localStorage.getItem(recipesKey);
            if (stored) {
                recipes = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error loading recipes:', e);
        }

        // Create recipes
        for (const item of itemsNeedingRecipes) {
            const recipe = {
                id: Date.now() + Math.random(),
                name: item.name,
                description: item.description || '',
                category: 'Menu Recipe',
                servings: 1,
                prepTime: '',
                cookTime: '',
                ingredients: [],
                instructions: [],
                allergens: item.allergens || [],
                dietaryInfo: item.dietaryInfo || [],
                menuLinked: true,
                menuItemName: item.name,
                menuId: menuId || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            recipes.push(recipe);
        }

        // Save recipes
        try {
            localStorage.setItem(recipesKey, JSON.stringify(recipes));
            console.log(`Created ${itemsNeedingRecipes.length} recipes`);
        } catch (e) {
            console.error('Error saving recipes:', e);
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('import-results-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Show success message
     */
    showSuccess() {
        // TODO: Use toast notification system
        alert(`✓ Successfully imported ${this.importedItems.length} menu items!`);
    }

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        try {
            const user = (window.userSystem && window.userSystem.getCurrentUser && window.userSystem.getCurrentUser()) || null;
            return user?.id || user?.userId || 'guest';
        } catch {
            return 'guest';
        }
    }

    /**
     * Get current project ID
     */
    getCurrentProjectId() {
        try {
            const stored = localStorage.getItem('iterum_current_project');
            if (stored) {
                const p = JSON.parse(stored);
                return p?.id || p?.projectId || 'master';
            }
            return 'master';
        } catch {
            return 'master';
        }
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
const enhancedMenuImport = new EnhancedMenuImport();
window.enhancedMenuImport = enhancedMenuImport;

