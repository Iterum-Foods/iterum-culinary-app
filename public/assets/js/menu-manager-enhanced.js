/**
 * Enhanced Menu Manager with Recipe Integration
 * Complete menu management system with automatic recipe creation
 */

class EnhancedMenuManager {
  constructor() {
    this.currentMenu = null;
    this.menuItems = [];
    this.storageKey = 'menu_data';
    this.init();
  }

  async init() {
    console.log('🍽️ Enhanced Menu Manager initialized');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupAfterDOMReady();
      });
    } else {
      // DOM is already ready
      this.setupAfterDOMReady();
    }
  }

  async setupAfterDOMReady() {
    await this.loadMenu();
    // Use setTimeout to ensure all elements are rendered
    setTimeout(() => {
      this.setupEventListeners();
      this.setupFormHandlers();
    }, 100);
  }

  /**
   * Setup form handlers for menu item forms
   */
  setupFormHandlers() {
    // Handle add menu item form submission
    const addForm = document.getElementById('add-menu-item-form');
    if (addForm && !addForm.hasAttribute('data-handler-attached')) {
      addForm.setAttribute('data-handler-attached', 'true');
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleAddMenuItemForm(e);
      });
      console.log('✅ Add menu item form handler attached');
    }

    // Handle edit menu item form submission
    const editForm = document.getElementById('edit-menu-item-form');
    if (editForm && !editForm.hasAttribute('data-handler-attached')) {
      editForm.setAttribute('data-handler-attached', 'true');
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleEditMenuItemForm(e);
      });
      console.log('✅ Edit menu item form handler attached');
    }
  }

  /**
   * Handle add menu item form submission
   */
  async handleAddMenuItemForm(event) {
    const form = event.target;
    const formData = new FormData(form);
    
    // Get form values
    const createRecipe = document.getElementById('item-create-recipe')?.checked || false;
    const recipeId = document.getElementById('item-recipe-link')?.value || '';
    
    // AUTO-CREATE RECIPE: If no recipe is selected, automatically create one
    // The checkbox is optional - if no recipe is linked, we create one automatically
    const shouldCreateRecipe = createRecipe || !recipeId;

    try {
      // Prepare item data
      const itemData = {
        name: formData.get('name'),
        description: formData.get('description') || '',
        category: formData.get('category') || 'Main Courses',
        price: parseFloat(formData.get('price')) || 0,
        targetFoodCost: parseFloat(formData.get('targetFoodCost')) || 30,
        recipeId: shouldCreateRecipe ? null : recipeId, // Will be created if shouldCreateRecipe is true
        allergens: formData.get('allergens') ? formData.get('allergens').split(',').map(a => a.trim()) : [],
        dietaryInfo: formData.get('dietaryInfo') ? formData.get('dietaryInfo').split(',').map(d => d.trim()) : []
      };

      // Add menu item (will automatically create recipe if no recipe is linked)
      await this.addMenuItem(itemData, shouldCreateRecipe);

      // Close modal
      const modal = document.getElementById('add-menu-item-modal');
      if (modal) {
        modal.style.display = 'none';
      }
      
      // Reset form
      form.reset();
      
      // Update display
      if (window.currentSelectedMenu && typeof displayMenuItems === 'function') {
        displayMenuItems({
          ...window.currentSelectedMenu,
          items: this.menuItems
        });
      }

    } catch (error) {
      console.error('❌ Error adding menu item:', error);
      alert(`Error: ${error.message || 'Failed to add menu item. Please try again.'}`);
    }
  }

  /**
   * Handle edit menu item form submission
   */
  async handleEditMenuItemForm(event) {
    const form = event.target;
    const formData = new FormData(form);
    const itemId = window._editingItemId;
    
    if (!itemId) {
      alert('Error: Menu item ID not found');
      return;
    }

    const recipeId = document.getElementById('edit-item-recipe-link')?.value || '';
    
    // VALIDATION: Recipe is required
    if (!recipeId) {
      alert('⚠️ Recipe Required: Please select a recipe for this menu item');
      return;
    }

    try {
      const item = this.menuItems.find(i => i.id === itemId);
      if (!item) {
        throw new Error('Menu item not found');
      }

      // Update item data
      item.name = formData.get('name');
      item.description = formData.get('description') || '';
      item.category = formData.get('category') || 'Main Courses';
      item.price = parseFloat(formData.get('price')) || 0;
      item.targetFoodCost = parseFloat(formData.get('targetFoodCost')) || 30;
      item.recipeId = recipeId; // REQUIRED
      item.updatedAt = new Date().toISOString();

      // Update in database if available
      if (window.menuItemsDatabase) {
        const dbItem = window.menuItemsDatabase.getMenuItem(itemId);
        if (dbItem) {
          dbItem.name = item.name;
          dbItem.description = item.description;
          dbItem.category = item.category;
          dbItem.price = item.price;
          dbItem.targetFoodCost = item.targetFoodCost;
          dbItem.recipeId = item.recipeId; // REQUIRED
          
          // Get recipe name if available
          if (item.recipeId && !dbItem.recipeName) {
            try {
              const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
              const recipeIdeas = JSON.parse(localStorage.getItem('recipe_ideas') || '[]');
              const recipeStubs = JSON.parse(localStorage.getItem('recipe_stubs') || '[]');
              const allRecipes = [...recipes, ...recipeIdeas, ...recipeStubs];
              const recipe = allRecipes.find(r => (r.id || r._id) === item.recipeId);
              if (recipe) {
                dbItem.recipeName = recipe.name || recipe.title;
              }
            } catch (error) {
              console.warn('Could not load recipe name:', error);
            }
          }
          
          dbItem.updatedAt = item.updatedAt;
          window.menuItemsDatabase.saveMenuItem(dbItem); // Use saveMenuItem to ensure validation
        } else {
          // Item not in database yet, add it
          window.menuItemsDatabase.saveMenuItem({
            ...item,
            menuIds: [this.currentMenu?.id].filter(Boolean),
            userId: this.getCurrentUserId(),
            projectId: this.getCurrentProjectId()
          });
        }
      }

      // Save menu
      await this.saveMenu();

      // Also update in user menus list
      if (window.currentSelectedMenu) {
        const user = window.authManager?.currentUser;
        if (user) {
          const userId = user.userId || user.id;
          const menuKey = `menus_${userId}`;
          const menus = JSON.parse(localStorage.getItem(menuKey) || '[]');
          const menuIndex = menus.findIndex(m => m.id === this.currentMenu?.id);
          if (menuIndex !== -1) {
            menus[menuIndex].items = this.menuItems;
            localStorage.setItem(menuKey, JSON.stringify(menus));
          }
        }
      }

      // Close modal
      const modal = document.getElementById('edit-menu-item-modal');
      if (modal) {
        modal.style.display = 'none';
      }
      
      // Clear editing ID
      window._editingItemId = null;

      // Refresh display
      this.renderMenuItems();
      if (window.currentSelectedMenu && typeof displayMenuItems === 'function') {
        displayMenuItems({
          ...window.currentSelectedMenu,
          items: this.menuItems
        });
      }

      this.showToast('✅ Menu item updated!', 'success');

    } catch (error) {
      console.error('❌ Error updating menu item:', error);
      alert(`Error: ${error.message || 'Failed to update menu item. Please try again.'}`);
    }
  }

  /**
   * Load menu data from local storage or Firestore
   */
  async loadMenu() {
    const projectId = this.getCurrentProjectId();
    const menuKey = `${this.storageKey}_${projectId}`;
    let hasLocal = false;

    const storedMenu = localStorage.getItem(menuKey);
    if (storedMenu) {
      try {
        const parsed = JSON.parse(storedMenu);
        this.currentMenuData = parsed;
        this.currentMenu = parsed?.menu || null;
        this.menuItems = Array.isArray(parsed?.items) ? parsed.items : [];
        hasLocal = true;
      } catch (error) {
        console.warn('⚠️ Unable to parse local menu store, ignoring.', error);
      }
    }

    if (!hasLocal) {
      const legacyKey = `menu_${this.getCurrentUserId?.() || ''}`;
      const legacyMenu = localStorage.getItem(legacyKey);
      if (legacyMenu) {
        try {
          const parsedLegacy = JSON.parse(legacyMenu);
          this.currentMenuData = { menu: parsedLegacy, items: parsedLegacy?.items || [] };
          this.currentMenu = parsedLegacy;
          this.menuItems = parsedLegacy?.items || [];
          hasLocal = true;
        } catch (error) {
          console.warn('⚠️ Unable to parse legacy menu store, ignoring.', error);
        }
      }
    }

    let remoteSnapshot = null;
    if (window.firestoreSync?.fetchLatestMenuSnapshot) {
      remoteSnapshot = await window.firestoreSync.fetchLatestMenuSnapshot(projectId).catch((error) => {
        console.warn('⚠️ Menu snapshot fetch skipped:', error?.message || error);
        return null;
      });
    }

    if (remoteSnapshot) {
      const remoteUpdatedAt = Date.parse(remoteSnapshot.updatedAt || remoteSnapshot.syncedAt || 0);
      const localUpdatedAt = Date.parse(this.currentMenu?.updatedAt || this.currentMenuData?.menu?.updatedAt || 0);

      if (!hasLocal || (remoteUpdatedAt && remoteUpdatedAt > localUpdatedAt)) {
        this.currentMenuData = {
          menu: remoteSnapshot.menu || null,
          items: Array.isArray(remoteSnapshot.items) ? remoteSnapshot.items : [],
        };
        this.currentMenu = this.currentMenuData.menu;
        this.menuItems = this.currentMenuData.items;

        localStorage.setItem(menuKey, JSON.stringify(this.currentMenuData));

        if (remoteSnapshot.links && window.menuRecipeIntegration?.storageKey) {
          localStorage.setItem(window.menuRecipeIntegration.storageKey, JSON.stringify(remoteSnapshot.links));
        }

        console.log('☁️ Menu loaded from Firestore snapshot');
      }
    }

    this.renderMenuItems();
  }

  /**
   * Initialize new menu
   */
  initializeNewMenu() {
    const projectId = this.getCurrentProjectId();
    this.currentMenu = {
      id: `menu_${Date.now()}`,
      name: 'New Menu',
      description: '',
      version: '1.0',
      projectId: projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.menuItems = [];
  }

  /**
   * Save menu data
   */
  async saveMenu() {
    const projectId = this.getCurrentProjectId();
    const menuKey = `${this.storageKey}_${projectId}`;
    
    const data = {
      menu: this.currentMenu,
      items: this.menuItems
    };
    
    localStorage.setItem(menuKey, JSON.stringify(data));
    console.log('💾 Menu saved:', this.menuItems.length, 'items');
    
    // Analytics
    if (window.analyticsTracker) {
      window.analyticsTracker.trackCustomEvent('menu_saved', {
        items_count: this.menuItems.length,
        project: projectId
      });
    }

    await this.syncToCloud();

    window.dispatchEvent(new CustomEvent('menuWorkflowUpdated', {
      detail: {
        projectId,
        menuId: this.currentMenu?.id || null,
        itemCount: this.menuItems.length
      }
    }));
  }

  async syncToCloud(options = {}) {
    if (!window.firestoreSync?.saveMenuSnapshot) {
      return false;
    }

    const projectId = this.getCurrentProjectId();
    try {
      await window.firestoreSync.saveMenuSnapshot({
        projectId,
        menu: this.currentMenu,
        items: this.menuItems,
        links: window.menuRecipeIntegration?.getMenuRecipeLinks?.() || {},
        userId: options.userId
      });
      return true;
    } catch (error) {
      console.warn('⚠️ Menu cloud sync skipped:', error.message || error);
      return false;
    }
  }

  /**
   * Add menu item (with recipe integration)
   */
  async addMenuItem(itemData, createRecipe = true, options = {}) {
    const {
      skipSave = false,
      skipRender = false,
      skipToast = false
    } = options;

    try {
      // Create menu item
      const menuItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: itemData.name,
        description: itemData.description || '',
        category: itemData.category || 'Main Courses',
        price: parseFloat(itemData.price) || 0,
        targetFoodCost: parseFloat(itemData.targetFoodCost) || 30, // Phase 3: Default 30%
        recipeId: itemData.recipeId || null, // Phase 3: Link to recipe for automatic costing
        allergens: itemData.allergens || [],
        dietaryInfo: itemData.dietaryInfo || [],
        projectedCovers: itemData.projectedCovers || 0,
        portionSize: itemData.portionSize || '',
        prepStation: itemData.prepStation || 'General',
        prepLeadTime: itemData.prepLeadTime || 0,
        serviceNotes: itemData.serviceNotes || '',
        spiceLevel: itemData.spiceLevel || 'mild',
        isSignature: itemData.isSignature || false,
        isNew: itemData.isNew || false,
        isSeasonal: itemData.isSeasonal || false,
        availability: itemData.availability || {
          daysAvailable: ['all'],
          mealPeriods: ['dinner']
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: this.getCurrentProjectId()
      };

      // AUTO-CREATE RECIPE: If no recipe is linked, automatically create one
      // This ensures every menu item always has a recipe
      if (!menuItem.recipeId) {
        console.log('📝 No recipe linked - automatically creating recipe draft for:', menuItem.name);
        if (window.menuRecipeIntegration) {
          const recipe = await window.menuRecipeIntegration.createRecipeStubForMenuItem(menuItem);
          if (recipe && recipe.id) {
            menuItem.recipeId = recipe.id;
            menuItem.recipeName = recipe.title || recipe.name || menuItem.name;
            menuItem.recipeLinkStatus = 'auto-created';
            console.log('✅ Auto-created recipe:', recipe.id);
          }
        } else {
          console.warn('⚠️ menuRecipeIntegration not available - recipe will not be created');
          throw new Error('Unable to create recipe. Please ensure menu recipe integration is available.');
        }
      }

      // Save to Menu Items Database (recipe is now created above)
      if (window.menuItemsDatabase && menuItem.recipeId) {
        try {
          const dbItem = {
            ...menuItem,
            menuIds: [this.currentMenu?.id].filter(Boolean),
            userId: this.getCurrentUserId(),
            projectId: this.getCurrentProjectId()
          };
          const savedItem = window.menuItemsDatabase.saveMenuItem(dbItem);
          menuItem.id = savedItem.id; // Use database ID
          console.log('✅ Menu item saved to database');
        } catch (error) {
          console.error('❌ Error saving to menu items database:', error);
          // Don't throw - continue with adding to menu
        }
      }

      // Add to menu
      this.menuItems.push(menuItem);

      // Show success message
      if (!skipToast) {
        if (menuItem.recipeLinkStatus === 'auto-created') {
          this.showToast(`✅ Menu item added! Recipe draft automatically created.`, 'success');
        } else if (menuItem.recipeId) {
          this.showToast(`✅ Menu item added!`, 'success');
        }
      }
        if (!skipToast) {
          this.showToast(`✅ Menu item "${menuItem.name}" added!`, 'success');
        }
      }

      // Save menu
      if (!skipSave) {
        await this.saveMenu();
        
        // Also update the menu in the user's menus list if we have a selected menu
        if (window.currentSelectedMenu) {
          const user = window.authManager?.currentUser;
          if (user) {
            const userId = user.userId || user.id;
            const menuKey = `menus_${userId}`;
            const menus = JSON.parse(localStorage.getItem(menuKey) || '[]');
            
            // Find and update the menu in the list
            const menuIndex = menus.findIndex(m => m.id === this.currentMenu?.id);
            if (menuIndex !== -1) {
              menus[menuIndex] = {
                ...this.currentMenu,
                items: this.menuItems
              };
              localStorage.setItem(menuKey, JSON.stringify(menus));
              console.log('✅ Updated menu in user menus list');
            }
          }
        }
      }

      // Refresh display
      if (!skipRender) {
        this.renderMenuItems();
        
        // Also update the displayMenuItems view if it exists
        if (typeof displayMenuItems === 'function' && this.currentMenu) {
          displayMenuItems(this.currentMenu);
        }
      }

      // Analytics
      if (window.analyticsTracker) {
        window.analyticsTracker.trackCustomEvent('menu_item_added', {
          item_name: menuItem.name,
          category: menuItem.category,
          has_recipe: createRecipe
        });
      }

      return menuItem;

    } catch (error) {
      console.error('Error adding menu item:', error);
      if (!skipToast) {
        this.showToast('❌ Error adding menu item', 'error');
      }
      throw error;
    }
  }

  async createMenuFromImport(importData = {}) {
    const projectId = this.getCurrentProjectId();
    const now = new Date().toISOString();

    this.currentMenu = {
      id: `menu_${Date.now()}`,
      name: importData.name || 'Imported Menu',
      description: importData.description || '',
      type: importData.type || 'imported',
      projectId,
      createdAt: now,
      updatedAt: now,
      source: 'import'
    };

    this.menuItems = [];
    await this.saveMenu();

    if (Array.isArray(importData.items) && importData.items.length) {
      for (const item of importData.items) {
        await this.addMenuItem({
          name: item.name,
          description: item.description || '',
          category: item.category || 'Main Courses',
          price: item.price || 0,
          allergens: item.allergens || [],
          dietaryInfo: item.dietaryInfo || [],
          prepStation: item.prepStation || 'General'
        }, true, { skipSave: true, skipRender: true, skipToast: true });
      }
    }

    await this.saveMenu();
    this.renderMenuItems();
    this.showToast(`✅ Created "${this.currentMenu.name}" with ${this.menuItems.length} items!`, 'success');
    return this.currentMenu;
  }

  /**
   * Update menu item
   */
  async updateMenuItem(itemId, updates) {
    const index = this.menuItems.findIndex(item => item.id === itemId);
    
    if (index === -1) {
      console.error('Menu item not found:', itemId);
      return;
    }

    // Update item
    this.menuItems[index] = {
      ...this.menuItems[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Update linked recipe
    if (window.menuRecipeIntegration) {
      await window.menuRecipeIntegration.updateRecipeFromMenuItem(this.menuItems[index]);
    }

    await this.saveMenu();
    this.renderMenuItems();
    
    this.showToast('✅ Menu item updated', 'success');
  }

  /**
   * Delete menu item
   */
  async deleteMenuItem(itemId, deleteRecipe = false) {
    const item = this.menuItems.find(i => i.id === itemId);
    
    if (!item) {
      return;
    }

    // Confirm deletion
    const message = deleteRecipe 
      ? `Delete "${item.name}" and its recipe?`
      : `Delete "${item.name}"? (Recipe will be kept)`;
      
    if (!confirm(message)) {
      return;
    }

    // Remove from array
    this.menuItems = this.menuItems.filter(i => i.id !== itemId);

    // Handle recipe
    if (window.menuRecipeIntegration) {
      await window.menuRecipeIntegration.deleteRecipeForMenuItem(itemId, !deleteRecipe);
    }

    await this.saveMenu();
    this.renderMenuItems();
    
    this.showToast('✅ Menu item deleted', 'success');
  }

  /**
   * Render menu items
   */
  renderMenuItems() {
    const container = document.getElementById('menu-items-grid');
    
    if (!container) {
      console.warn('Menu items container not found');
      return;
    }

    if (this.menuItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🍽️</div>
          <h3>No Menu Items Yet</h3>
          <p>Add your first menu item to get started</p>
          <button class="btn btn-primary" onclick="window.showAddItemModal()">
            ➕ Add Menu Item
          </button>
        </div>
      `;
      return;
    }

    // Group by category
    const itemsByCategory = {};
    for (const item of this.menuItems) {
      const category = item.category || 'Uncategorized';
      if (!itemsByCategory[category]) {
        itemsByCategory[category] = [];
      }
      itemsByCategory[category].push(item);
    }

    // Render categories
    let html = '';
    for (const [category, items] of Object.entries(itemsByCategory)) {
      html += `
        <div class="menu-category">
          <div class="menu-category-header">
            <h3>${category}</h3>
            <span class="menu-category-count">${items.length} items</span>
          </div>
          <div class="menu-category-items">
            ${items.map(item => this.renderMenuItem(item)).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Update statistics
    this.updateStatistics();
  }

  /**
   * Render single menu item card
   */
  renderMenuItem(item) {
    const recipeStatus = window.menuRecipeIntegration 
      ? window.menuRecipeIntegration.getRecipeStatus(item.id)
      : null;

    const costData = window.menuRecipeIntegration 
      ? window.menuRecipeIntegration.calculateFoodCostPercent(item)
      : null;

    const badges = [];
    if (item.isSignature) badges.push('<span class="menu-badge badge-signature">⭐ Signature</span>');
    if (item.isNew) badges.push('<span class="menu-badge badge-new">🆕 New</span>');
    if (item.isSeasonal) badges.push('<span class="menu-badge badge-seasonal">🍂 Seasonal</span>');

    return `
      <div class="menu-item-card" data-item-id="${item.id}">
        <div class="menu-item-header">
          <div class="menu-item-title-section">
            <h4 class="menu-item-title">${item.name}</h4>
            <div class="menu-item-price">$${item.price.toFixed(2)}</div>
          </div>
          ${badges.length > 0 ? `<div class="menu-item-badges">${badges.join('')}</div>` : ''}
        </div>

        <div class="menu-item-description">
          ${item.description || '<em>No description</em>'}
        </div>

        ${recipeStatus ? `
          <div class="menu-item-recipe-status">
            <span class="recipe-status-badge" style="color: ${recipeStatus.color}">
              ${recipeStatus.icon} ${recipeStatus.label}
            </span>
            ${costData ? `
              <span class="recipe-cost-info ${costData.isOverTarget ? 'cost-warning' : costData.isGood ? 'cost-good' : ''}">
                ${costData.percent}% food cost
                ${costData.isOverTarget ? '⚠️' : costData.isGood ? '✅' : ''}
              </span>
            ` : ''}
          </div>
        ` : ''}

        <div class="menu-item-meta">
          ${item.allergens && item.allergens.length > 0 ? `
            <span class="menu-item-allergens">⚠️ ${item.allergens.join(', ')}</span>
          ` : ''}
          ${item.dietaryInfo && item.dietaryInfo.length > 0 ? `
            <span class="menu-item-dietary">🥗 ${item.dietaryInfo.join(', ')}</span>
          ` : ''}
        </div>

        <div class="menu-item-meta" style="margin-top: 8px;">
          <span class="menu-item-station">👩‍🍳 Station: ${item.prepStation || 'General'}</span>
          ${item.projectedCovers ? `<span class="menu-item-covers">🍽️ Covers: ${item.projectedCovers}</span>` : ''}
        </div>

        ${item.serviceNotes ? `
          <div class="menu-item-service-notes">
            <strong>Service Notes:</strong> ${item.serviceNotes}
          </div>
        ` : ''}
 
        <div class="menu-item-actions">
          ${this.renderRecipeActionButtons(item, recipeStatus)}
          <button class="btn btn-secondary btn-sm" onclick="window.enhancedMenuManager.showEditItemModal('${item.id}')">
            ✏️ Edit
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.enhancedMenuManager.deleteMenuItem('${item.id}')">
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  renderRecipeActionButtons(item, recipeStatus) {
    if (recipeStatus && recipeStatus.recipeId) {
      return `
        <div class="menu-recipe-actions">
          <button class="btn btn-primary btn-sm" onclick="window.menuRecipeIntegration.openRecipeInDeveloper('${recipeStatus.recipeId}')">
            ${recipeStatus.icon} ${recipeStatus.action}
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.menuRecipeIntegration.promptRecipeLink('${item.id}')">
            🔄 Relink
          </button>
        </div>
      `;
    }

    return `
      <div class="menu-recipe-actions">
        <button class="btn btn-primary btn-sm" onclick="window.enhancedMenuManager.createRecipeForItem('${item.id}')">
          ➕ Create Recipe
        </button>
        <button class="btn btn-secondary btn-sm" onclick="window.menuRecipeIntegration.promptRecipeLink('${item.id}')">
          🔗 Link Existing
        </button>
      </div>
    `;
  }

  /**
   * Update menu statistics
   */
  updateStatistics() {
    if (!window.menuRecipeIntegration) {
      return;
    }

    const stats = window.menuRecipeIntegration.getMenuStatistics(this.menuItems);

    const statsContainer = document.getElementById('menu-statistics');
    if (statsContainer) {
      const completionRate = stats.totalItems > 0 
        ? Math.round((stats.withRecipes / stats.totalItems) * 100) 
        : 0;

      statsContainer.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.totalItems}</div>
            <div class="stat-label">Total Items</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.withRecipes}/${stats.totalItems}</div>
            <div class="stat-label">With Recipes</div>
            <div class="stat-progress">
              <div class="stat-progress-bar" style="width: ${completionRate}%"></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.averageFoodCost}%</div>
            <div class="stat-label">Avg Food Cost</div>
          </div>
          <div class="stat-card ${stats.overTargetCount > 0 ? 'stat-warning' : ''}">
            <div class="stat-value">${stats.overTargetCount}</div>
            <div class="stat-label">Over Target</div>
          </div>
        </div>
      `;
    }
  }

  /**
   * Show add item modal
   */
  showAddItemModal() {
    const modal = document.getElementById('add-menu-item-modal');
    if (modal) {
      // Reset form
      const form = document.getElementById('add-menu-item-form');
      if (form) {
        form.reset();
      }
      
      // Populate recipe select if not already done
      if (typeof populateRecipeSelects === 'function') {
        populateRecipeSelects();
      }
      
      // Reset recipe option toggle
      const createCheckbox = document.getElementById('item-create-recipe');
      const recipeSelect = document.getElementById('item-recipe-link');
      if (createCheckbox && recipeSelect) {
        createCheckbox.checked = false;
        recipeSelect.disabled = false;
        recipeSelect.required = true;
      }
      
      modal.style.display = 'flex';
    }
  }

  /**
   * Show edit item modal
   */
  showEditItemModal(itemId) {
    const item = this.menuItems.find(i => i.id === itemId);
    if (!item) {
      return;
    }

    // Store item ID for update
    window._editingItemId = itemId;

    // Populate form
    document.getElementById('edit-item-name').value = item.name;
    document.getElementById('edit-item-description').value = item.description || '';
    document.getElementById('edit-item-category').value = item.category;
    document.getElementById('edit-item-price').value = item.price;
    
    // Populate recipe select (REQUIRED)
    const recipeSelect = document.getElementById('edit-item-recipe-link');
    if (recipeSelect) {
      // Populate recipes if needed
      if (typeof populateRecipeSelects === 'function') {
        populateRecipeSelects();
      }
      recipeSelect.value = item.recipeId || '';
      recipeSelect.required = true;
    }
    
    // Populate target food cost
    const targetFoodCostInput = document.getElementById('edit-item-target-food-cost');
    if (targetFoodCostInput) {
      targetFoodCostInput.value = item.targetFoodCost || 30;
    }
    
    const coversInput = document.getElementById('edit-item-covers');
    if (coversInput) coversInput.value = item.projectedCovers || '';
    const portionInput = document.getElementById('edit-item-portion');
    if (portionInput) portionInput.value = item.portionSize || '';
    const stationSelect = document.getElementById('edit-item-station');
    if (stationSelect) stationSelect.value = item.prepStation || 'General';
    const leadInput = document.getElementById('edit-item-lead');
    if (leadInput) leadInput.value = item.prepLeadTime || '';
    const serviceNotesInput = document.getElementById('edit-item-service-notes');
    if (serviceNotesInput) serviceNotesInput.value = item.serviceNotes || '';
 
    // Show modal
    const modal = document.getElementById('edit-menu-item-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  /**
   * Create recipe for existing menu item
   */
  async createRecipeForItem(itemId) {
    const item = this.menuItems.find(i => i.id === itemId);
    if (!item) {
      return;
    }

    if (!window.menuRecipeIntegration) {
      this.showToast('❌ Recipe integration not available', 'error');
      return;
    }

    try {
      const recipe = await window.menuRecipeIntegration.createRecipeStubForMenuItem(item);
      item.recipeId = recipe.id;
      await this.saveMenu();
      this.renderMenuItems();
      
      // Ask if they want to develop it now
      if (confirm('Recipe created! Would you like to develop it now?')) {
        window.menuRecipeIntegration.openRecipeInDeveloper(recipe.id);
      }
    } catch (error) {
      console.error('Error creating recipe:', error);
      this.showToast('❌ Error creating recipe', 'error');
    }
  }

  /**
   * Apply imported items
   */
  async applyImportedItems(items) {
    for (const item of items) {
      await this.addMenuItem(item, true);
    }
    
    this.showToast(`✅ Imported ${items.length} menu items with recipes!`, 'success');
  }

  /**
   * Export menu as JSON
   */
  exportMenu() {
    const data = {
      menu: this.currentMenu,
      items: this.menuItems,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu-${this.currentMenu.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast('✅ Menu exported!', 'success');
  }

  /**
   * Download template
   */
  downloadTemplate() {
    const template = `Menu Template

# Category: Appetizers

Item Name, Description, Price
Bruschetta, Fresh tomatoes on toasted bread, 8.99
Calamari, Crispy fried squid with marinara, 12.99

# Category: Main Courses

Item Name, Description, Price
Grilled Salmon, Atlantic salmon with lemon butter, 24.99
Ribeye Steak, 12oz ribeye with garlic butter, 32.99

# Category: Desserts

Item Name, Description, Price
Tiramisu, Classic Italian dessert, 7.99
Chocolate Cake, Rich chocolate cake with ganache, 6.99
`;

    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'menu-template.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast('✅ Template downloaded!', 'success');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Add item form
    const addForm = document.getElementById('add-menu-item-form');
    if (addForm && !addForm.hasAttribute('data-handler-attached')) {
      addForm.setAttribute('data-handler-attached', 'true');
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleAddMenuItemForm(e);
      });
      console.log('✅ Add menu item form handler attached');
    }

    // Edit item form
    const editForm = document.getElementById('edit-menu-item-form');
    if (editForm && !editForm.hasAttribute('data-handler-attached')) {
      editForm.setAttribute('data-handler-attached', 'true');
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleEditMenuItemForm(e);
      });
      console.log('✅ Edit menu item form handler attached');
    }
  }

  /**
   * Handle add menu item form submission
   * REQUIRES: Recipe (either select existing or create new)
   */
  async handleAddMenuItemForm(event) {
    const form = event.target;
    const formData = new FormData(form);
    
    // Get recipe requirement
    const createRecipe = document.getElementById('item-create-recipe')?.checked || false;
    const recipeId = document.getElementById('item-recipe-link')?.value || '';
    
    // VALIDATION: Recipe is REQUIRED
    if (!createRecipe && !recipeId) {
      alert('⚠️ Recipe Required: Every menu item must have a recipe.\n\nPlease either:\n1. Select an existing recipe from the dropdown, OR\n2. Check "Create New Recipe Draft Instead" to create a recipe automatically.');
      return;
    }

    try {
      const itemData = {
        name: formData.get('name'),
        description: formData.get('description') || '',
        category: formData.get('category') || 'Main Courses',
        price: parseFloat(formData.get('price')) || 0,
        targetFoodCost: parseFloat(formData.get('targetFoodCost')) || 30,
        recipeId: createRecipe ? null : recipeId, // Will be created if createRecipe is true
        allergens: formData.get('allergens') ? formData.get('allergens').split(',').map(a => a.trim()).filter(Boolean) : [],
        dietaryInfo: formData.get('dietaryInfo') ? formData.get('dietaryInfo').split(',').map(d => d.trim()).filter(Boolean) : []
      };

      // Add menu item (will create recipe if createRecipe is true)
      await this.addMenuItem(itemData, createRecipe);
      
      // Close modal
      const modal = document.getElementById('add-menu-item-modal');
      if (modal) {
        modal.style.display = 'none';
      }
      
      // Reset form
      form.reset();
      
      // Update display
      if (window.currentSelectedMenu && typeof displayMenuItems === 'function') {
        displayMenuItems({
          ...window.currentSelectedMenu,
          items: this.menuItems
        });
      }
    } catch (error) {
      console.error('❌ Error adding menu item:', error);
      alert(`Error: ${error.message || 'Failed to add menu item. Please try again.'}`);
    }
  }

  /**
   * Handle edit menu item form submission
   * REQUIRES: Recipe
   */
  async handleEditMenuItemForm(event) {
    const form = event.target;
    const formData = new FormData(form);
    const itemId = window._editingItemId;
    
    if (!itemId) {
      alert('Error: Menu item ID not found');
      return;
    }

    const recipeId = document.getElementById('edit-item-recipe-link')?.value || '';
    
    // VALIDATION: Recipe is REQUIRED
    if (!recipeId) {
      alert('⚠️ Recipe Required: Every menu item must have a recipe. Please select a recipe.');
      return;
    }

    try {
      const item = this.menuItems.find(i => i.id === itemId);
      if (!item) {
        throw new Error('Menu item not found');
      }

      // Update item data
      item.name = formData.get('name');
      item.description = formData.get('description') || '';
      item.category = formData.get('category') || 'Main Courses';
      item.price = parseFloat(formData.get('price')) || 0;
      item.targetFoodCost = parseFloat(formData.get('targetFoodCost')) || 30;
      item.recipeId = recipeId; // REQUIRED
      item.updatedAt = new Date().toISOString();

      // Update in database
      if (window.menuItemsDatabase) {
        try {
          const dbItem = window.menuItemsDatabase.getMenuItem(itemId);
          if (dbItem) {
            dbItem.name = item.name;
            dbItem.description = item.description;
            dbItem.category = item.category;
            dbItem.price = item.price;
            dbItem.targetFoodCost = item.targetFoodCost;
            dbItem.recipeId = item.recipeId; // REQUIRED
            
            // Get recipe name
            try {
              const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
              const recipeIdeas = JSON.parse(localStorage.getItem('recipe_ideas') || '[]');
              const recipeStubs = JSON.parse(localStorage.getItem('recipe_stubs') || '[]');
              const allRecipes = [...recipes, ...recipeIdeas, ...recipeStubs];
              const recipe = allRecipes.find(r => (r.id || r._id) === item.recipeId);
              if (recipe) {
                dbItem.recipeName = recipe.name || recipe.title;
              }
            } catch (error) {
              console.warn('Could not load recipe name:', error);
            }
            
            dbItem.updatedAt = item.updatedAt;
            window.menuItemsDatabase.saveMenuItem(dbItem);
          } else {
            // Add to database if not there
            window.menuItemsDatabase.saveMenuItem({
              ...item,
              menuIds: [this.currentMenu?.id].filter(Boolean),
              userId: this.getCurrentUserId(),
              projectId: this.getCurrentProjectId()
            });
          }
        } catch (error) {
          console.error('Error updating menu item in database:', error);
        }
      }

      // Save menu
      await this.saveMenu();

      // Update in user menus list
      if (window.currentSelectedMenu) {
        const user = window.authManager?.currentUser;
        if (user) {
          const userId = user.userId || user.id;
          const menuKey = `menus_${userId}`;
          const menus = JSON.parse(localStorage.getItem(menuKey) || '[]');
          const menuIndex = menus.findIndex(m => m.id === this.currentMenu?.id);
          if (menuIndex !== -1) {
            menus[menuIndex].items = this.menuItems;
            localStorage.setItem(menuKey, JSON.stringify(menus));
          }
        }
      }

      // Close modal
      const modal = document.getElementById('edit-menu-item-modal');
      if (modal) {
        modal.style.display = 'none';
      }
      
      window._editingItemId = null;

      // Refresh display
      this.renderMenuItems();
      if (window.currentSelectedMenu && typeof displayMenuItems === 'function') {
        displayMenuItems({
          ...window.currentSelectedMenu,
          items: this.menuItems
        });
      }

      this.showToast('✅ Menu item updated!', 'success');

    } catch (error) {
      console.error('❌ Error updating menu item:', error);
      alert(`Error: ${error.message || 'Failed to update menu item. Please try again.'}`);
    }
  }
          
          // Reset form
          addForm.reset();
        } catch (error) {
          console.error('Error adding menu item:', error);
          alert('Error adding menu item. Please try again.');
        }
      });
      console.log('✅ Add menu item form handler attached');
    } else {
      console.warn('⚠️ Add menu item form not found');
    }

    // Edit item form
    const editForm = document.getElementById('edit-menu-item-form');
    if (editForm) {
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(editForm);
        const updates = {
          name: formData.get('name'),
          description: formData.get('description'),
          category: formData.get('category'),
          price: parseFloat(formData.get('price')),
          projectedCovers: parseInt(formData.get('projectedCovers')) || 0,
          portionSize: formData.get('portionSize') || '',
          prepStation: formData.get('prepStation') || 'General',
          prepLeadTime: parseInt(formData.get('prepLeadTime')) || 0,
          serviceNotes: formData.get('serviceNotes') || ''
        };

        await this.updateMenuItem(window._editingItemId, updates);
        
        // Close modal
        const modal = document.getElementById('edit-menu-item-modal');
        if (modal) {
          modal.style.display = 'none';
        }
      });
    }
  }

  /**
   * Utility functions
   */
  getCurrentProjectId() {
    if (window.projectManager?.getCurrentProject) {
      const project = window.projectManager.getCurrentProject();
      if (project?.id) return project.id;
    }
    if (window.projectManager?.currentProject?.id) {
      return window.projectManager.currentProject.id;
    }
    if (window.projectManager?.masterProjectId) {
      return window.projectManager.masterProjectId;
    }

    const stored = localStorage.getItem('active_project');
    if (stored) {
      return stored;
    }

    return 'master';
  }

  getCurrentUserId() {
    const user = window.authManager?.currentUser;
    if (user?.id) return user.id;
    if (user?.userId) return user.userId;
    const stored = localStorage.getItem('current_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed?.id || parsed?.userId || parsed?.email || null;
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-weight: 500;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  getAllCategories() {
    const categories = new Set(this.menuItems.map(item => item.category));
    return Array.from(categories);
  }

  getMenuItems() {
    return Array.isArray(this.menuItems) ? [...this.menuItems] : [];
  }
}

// Initialize global instance
window.enhancedMenuManager = new EnhancedMenuManager();

console.log('🍽️ Enhanced Menu Manager loaded');


