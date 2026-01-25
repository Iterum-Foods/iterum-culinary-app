  buildTags(menuItem) {
    const tags = [];
    if (menuItem.category) {
      tags.push(menuItem.category.toLowerCase());
    }
    if (menuItem.menuSection) {
      tags.push(menuItem.menuSection.toLowerCase());
    }
    if (Array.isArray(menuItem.dietary)) {
      tags.push(...menuItem.dietary.map(d => `dietary:${d.toLowerCase()}`));
    }
    tags.push('menu-item');
    if (menuItem.recipeType) {
      tags.push(`type:${menuItem.recipeType.toLowerCase()}`);
    }
    return Array.from(new Set(tags));
  }
/**
 * Menu-Recipe Integration System
 * Automatically creates recipe stubs for menu items and manages the connection
 */

class MenuRecipeIntegration {
  constructor() {
    this.storageKey = 'menu_recipe_links';
    this.recipeStubsKey = 'recipe_stubs';
    this.auditStorageKey = 'menu_recipe_audit';
    this.init();
  }

  buildRecipeStubFromMenuItem(menuItem) {
    const now = new Date().toISOString();
    const baseStub = {
      id: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: menuItem.name,
      description: menuItem.description || `Recipe for ${menuItem.name}`,
      category: menuItem.category || 'Uncategorized',
      cuisine_type: this.guessCuisineType(menuItem),
      difficulty_level: menuItem.difficulty || 'Medium',
      prep_time: menuItem.prepTime || null,
      cook_time: menuItem.cookTime || null,
      servings: menuItem.servings || 4,
      tags: this.buildTags(menuItem),
      dietary_restrictions: Array.isArray(menuItem.dietary) ? menuItem.dietary : [],
      allergens: Array.isArray(menuItem.allergens) ? menuItem.allergens : [],
      equipment_needed: Array.isArray(menuItem.equipment) ? menuItem.equipment : [],
      status: 'draft',
      recipe_status: 'needs-development',
      type: menuItem.recipeType || 'menu-item',
      source: menuItem.source || 'Menu Builder',
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      menuItemPrice: menuItem.price,
      targetFoodCostPercent: 30,
      targetCost: menuItem.price ? (menuItem.price * 0.30).toFixed(2) : null,
      ingredients: [],
      instructions: [],
      createdAt: now,
      updatedAt: now,
      createdBy: this.getCurrentUserId(),
      projectId: this.getCurrentProjectId()
    };

    const menuPersona = menuItem.serviceStyle || menuItem.persona;
    if (menuPersona) {
      baseStub.serviceStyle = menuPersona;
    }

    if (menuItem.highlights) {
      baseStub.highlights = menuItem.highlights;
    }
    if (menuItem.components) {
      baseStub.components = menuItem.components;
    }
    if (menuItem.platingNotes) {
      baseStub.plating = {
        notes: menuItem.platingNotes,
        platingStyle: menuItem.platingStyle || 'plated dish'
      };
    }
    if (menuItem.winePairing || menuItem.beveragePairing) {
      baseStub.pairings = {
        wine: menuItem.winePairing || null,
        beverage: menuItem.beveragePairing || null
      };
    }
    return baseStub;
  }
  init() {
    console.log('🔗 Menu-Recipe Integration initialized');
  }

  /**
   * Create a recipe stub for a menu item
   */
  async createRecipeStubForMenuItem(menuItem) {
    try {
      console.log('📝 Creating recipe stub for:', menuItem.name);

      const recipeStub = this.buildRecipeStubFromMenuItem(menuItem);

      // Save recipe stub
      await this.saveRecipeStub(recipeStub, menuItem);

      // Link menu item to recipe
      await this.linkMenuItemToRecipe(menuItem.id, recipeStub.id);

      // Track analytics
      if (window.analyticsTracker) {
        window.analyticsTracker.trackCustomEvent('recipe_stub_created', {
          menu_item: menuItem.name,
          recipe_id: recipeStub.id,
          category: menuItem.category
        });
      }

      console.log('✅ Recipe stub created:', recipeStub.id);
      return recipeStub;

    } catch (error) {
      console.error('❌ Error creating recipe stub:', error);
      throw error;
    }
  }

  promptRecipeLink(menuItemId) {
    const menuItem = window.enhancedMenuManager?.menuItems?.find(item => item.id === menuItemId);
    if (!menuItem) {
      window.showError?.('Menu item not found.');
      return;
    }

    const recipes = window.universalRecipeManager?.getRecipeLibrary?.() || [];
    if (!recipes.length) {
      window.showError?.('No recipes available to link. Create or import recipes first.');
      return;
    }

    const select = document.createElement('select');
    select.className = 'form-input';
    recipes.forEach(recipe => {
      const option = document.createElement('option');
      option.value = recipe.id;
      option.textContent = `${recipe.title || recipe.name} (${recipe.category || 'Uncategorized'})`;
      if (recipe.id === menuItem.recipeId) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    const modal = document.createElement('div');
    modal.className = 'checklist-modal-overlay';
    modal.innerHTML = `
      <div class="checklist-modal">
        <div class="checklist-modal-header">
          <h3>Link Recipe</h3>
          <button class="checklist-modal-close" aria-label="Close">✕</button>
        </div>
        <div class="checklist-modal-body">
          <p class="text-sm text-gray-600" style="margin-bottom: 12px;">
            Link <strong>${menuItem.name}</strong> to an existing recipe from the library.
          </p>
          <div class="form-group">
            <label class="form-label">Select Recipe</label>
          </div>
        </div>
        <div class="checklist-modal-footer">
          <button class="btn btn-primary" data-action="link">Link Recipe</button>
          <button class="btn btn-secondary" data-action="cancel">Cancel</button>
        </div>
      </div>
    `;

    const body = modal.querySelector('.checklist-modal-body .form-group');
    body.appendChild(select);

    const closeModal = () => modal.remove();

    modal.querySelector('.checklist-modal-close').addEventListener('click', closeModal);
    modal.querySelector('[data-action="cancel"]').addEventListener('click', closeModal);

    modal.querySelector('[data-action="link"]').addEventListener('click', async () => {
      const recipeId = select.value;
      if (!recipeId) {
        window.showError?.('Please select a recipe to link.');
        return;
      }
      await this.linkMenuItemToRecipe(menuItemId, recipeId, {
        source: 'manual',
        linkedBy: window.authManager?.currentUser?.id,
        auditLog: { status: 'linked', message: 'Manually linked to existing recipe.' }
      });
      const recipe = this.getRecipeById(recipeId);
      if (menuItem) {
        menuItem.recipeId = recipeId;
        menuItem.recipeLinkStatus = 'linked';
        menuItem.recipeName = recipe?.title || recipe?.name || menuItem.name;
        if (window.enhancedMenuManager) {
          await window.enhancedMenuManager.saveMenu();
          window.enhancedMenuManager.renderMenuItems();
        }
      }
      window.showSuccess?.('Menu item linked to recipe.');
      closeModal();
    });

    document.body.appendChild(modal);
  }

  /**
   * Save recipe stub to localStorage and sync to backend
   */
  async saveRecipeStub(recipeStub, menuItem = null) {
    const stubs = this.getRecipeStubs();
    stubs.push(recipeStub);
    localStorage.setItem(this.recipeStubsKey, JSON.stringify(stubs));

    const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
    recipes.push(recipeStub);
    localStorage.setItem('recipes', JSON.stringify(recipes));

    if (menuItem) {
      const existing = window.universalRecipeManager?.getRecipeLibrary?.() || recipes;
      const recipeIndex = existing.findIndex(r => r.id === recipeStub.id);
      if (recipeIndex !== -1) {
        const enriched = {
          ...existing[recipeIndex],
          menuLinks: [
            ...(existing[recipeIndex].menuLinks || []),
            {
              menuItemId: menuItem.id,
              menuName: menuItem.menuName || menuItem.name,
              menuSection: menuItem.menuSection || menuItem.category,
              linkedAt: new Date().toISOString()
            }
          ],
          course: menuItem.course,
          menuCategory: menuItem.category,
          recommendedServiceStyle: menuItem.serviceStyle || menuItem.persona,
          platingNotes: menuItem.platingNotes
        };

        existing[recipeIndex] = enriched;
        localStorage.setItem('recipes', JSON.stringify(existing));
        if (window.universalRecipeManager?.saveRecipeLibrary) {
          window.universalRecipeManager.saveRecipeLibrary(existing);
        }
      }
    }

    // Try to sync to backend
    try {
      if (window.authApiHelper && window.authManager?.isAuthenticated()) {
        const response = await window.authApiHelper.post('/api/recipes', {
          title: recipeStub.title,
          description: recipeStub.description,
          cuisine_type: recipeStub.cuisine_type,
          difficulty_level: recipeStub.difficulty_level,
          prep_time: recipeStub.prep_time,
          cook_time: recipeStub.cook_time,
          servings: recipeStub.servings,
          tags: recipeStub.tags,
          status: recipeStub.status,
          type: recipeStub.type,
          source: recipeStub.source,
          tags: recipeStub.tags,
          linked_menu_items: recipeStub.menuItemId ? [{
            menu_item_id: recipeStub.menuItemId,
            menu_item_name: recipeStub.menuItemName,
            menu_item_price: recipeStub.menuItemPrice
          }] : undefined,
          type: recipeStub.type
        });
        
        if (response.id) {
          recipeStub.backendId = response.id;
          console.log('✅ Recipe stub synced to backend:', response.id);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not sync recipe to backend:', error);
      // Continue anyway - we have local copy
    }

    return recipeStub;
  }

  /**
   * Get all recipe stubs
   */
  getRecipeStubs() {
    const stubs = localStorage.getItem(this.recipeStubsKey);
    return stubs ? JSON.parse(stubs) : [];
  }

  /**
   * Get recipe by ID (check stubs and main recipes)
   */
  getRecipeById(recipeId) {
    // Check stubs first
    const stubs = this.getRecipeStubs();
    let recipe = stubs.find(r => r.id === recipeId);
    
    if (!recipe) {
      // Check main recipes
      const unified = window.universalRecipeManager?.getRecipeLibrary?.() || JSON.parse(localStorage.getItem('recipes') || '[]');
      recipe = unified.find(r => r.id === recipeId);
    }
    
    return recipe;
  }

  /**
   * Link menu item to recipe
   */
  async linkMenuItemToRecipe(menuItemId, recipeId, options = {}) {
    const links = this.getMenuRecipeLinks();
    links[menuItemId] = {
      recipeId: recipeId,
      linkedAt: new Date().toISOString(),
      linkedBy: options.linkedBy || (window.authManager?.currentUser?.id || 'system'),
      source: options.source || 'manual',
      recipeStatus: options.recipeStatus || 'linked'
    };
    localStorage.setItem(this.storageKey, JSON.stringify(links));
    console.log('🔗 Linked menu item', menuItemId, 'to recipe', recipeId);

    if (options.auditLog) {
      this.recordLinkAudit(menuItemId, recipeId, options.auditLog);
    }

    if (window.enhancedMenuManager?.syncToCloud) {
      window.enhancedMenuManager.syncToCloud().catch((error) => {
        console.warn('⚠️ Menu link sync skipped:', error?.message || error);
      });
    }

    window.dispatchEvent(new CustomEvent('menuWorkflowUpdated', {
      detail: {
        projectId: window.enhancedMenuManager?.getCurrentProjectId?.() || 'master',
        menuItemId,
        recipeId,
        source: options.source || 'manual'
      }
    }));
  }

  /**
   * Get all menu-recipe links
   */
  getMenuRecipeLinks() {
    const links = localStorage.getItem(this.storageKey);
    return links ? JSON.parse(links) : {};
  }

  /**
   * Get recipe for a menu item
   */
  getRecipeForMenuItem(menuItemId) {
    const links = this.getMenuRecipeLinks();
    const link = links[menuItemId];
    
    if (!link) {
      return null;
    }
    
    const recipe = this.getRecipeById(link.recipeId);
    if (!recipe) {
      this.recordLinkAudit(menuItemId, link.recipeId, {
        status: 'missing-recipe',
        message: 'Linked recipe not found in library.'
      });
    }
    return recipe;
  }

  /**
   * Get recipe status for menu item
   */
  getRecipeStatus(menuItemId) {
    const recipe = this.getRecipeForMenuItem(menuItemId);
    
    if (!recipe) {
      this.recordLinkAudit(menuItemId, null, {
        status: 'no-recipe',
        message: 'Menu item has no associated recipe.'
      });
      return {
        status: 'no-recipe',
        label: 'No Recipe',
        icon: '🔴',
        color: '#ef4444',
        action: 'Create Recipe'
      };
    }

    // Check if recipe is complete
    const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
    const hasInstructions = recipe.instructions && recipe.instructions.length > 0;
    const hasCosting = recipe.ingredients && recipe.ingredients.every(i => i.cost);
    const hasAllergens = Array.isArray(recipe.allergens) && recipe.allergens.length > 0;

    if (hasCosting && hasIngredients && hasInstructions) {
      this.recordLinkAudit(menuItemId, recipe.id, {
        status: 'costed',
        message: 'Recipe complete with costing.'
      });
      return {
        status: 'costed',
        label: 'Complete & Costed',
        icon: '🔵',
        color: '#3b82f6',
        action: 'View Recipe',
        recipeId: recipe.id
      };
    }

    if (hasIngredients && hasInstructions) {
      this.recordLinkAudit(menuItemId, recipe.id, {
        status: 'complete',
        message: 'Recipe complete but missing costing.'
      });
      return {
        status: 'complete',
        label: 'Recipe Complete',
        icon: '🟢',
        color: '#22c55e',
        action: 'Add Costing',
        recipeId: recipe.id
      };
    }

    if (hasIngredients || hasInstructions) {
      this.recordLinkAudit(menuItemId, recipe.id, {
        status: 'draft',
        message: 'Recipe draft needs completion.'
      });
      return {
        status: 'draft',
        label: 'Recipe Draft',
        icon: '🟡',
        color: '#eab308',
        action: 'Complete Recipe',
        recipeId: recipe.id
      };
    }

    return {
      status: 'stub',
      label: 'Needs Development',
      icon: '🟠',
      color: '#f97316',
      action: 'Develop Recipe',
      recipeId: recipe.id
    };
  }

  recordLinkAudit(menuItemId, recipeId, details = {}) {
    try {
      const auditKey = this.auditStorageKey;
      const existing = localStorage.getItem(auditKey);
      const log = existing ? JSON.parse(existing) : {};

      log[menuItemId] = {
        recipeId,
        status: details.status || 'unknown',
        message: details.message || '',
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(auditKey, JSON.stringify(log));
    } catch (error) {
      console.warn('⚠️ Unable to record menu-recipe audit:', error);
    }
  }

  getLinkAudit(menuItemId) {
    try {
      const auditKey = this.auditStorageKey;
      const existing = localStorage.getItem(auditKey);
      if (!existing) return null;
      const log = JSON.parse(existing);
      return log[menuItemId] || null;
    } catch (error) {
      console.warn('⚠️ Unable to read menu-recipe audit:', error);
      return null;
    }
  }


  /**
   * Open recipe in recipe developer
   */
  openRecipeInDeveloper(recipeId) {
    if (!recipeId) {
      console.error('No recipe ID provided');
      return;
    }

    // Store the recipe ID for the developer to load
    sessionStorage.setItem('recipe_to_edit', recipeId);
    
    // Navigate to recipe developer
    window.location.href = 'recipe-developer.html';
  }

  /**
   * Calculate menu item cost from recipe
   */
  calculateMenuItemCost(menuItemId) {
    const recipe = this.getRecipeForMenuItem(menuItemId);
    
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      return {
        hasCost: false,
        ingredientCost: 0,
        laborCost: 0,
        totalCost: 0
      };
    }

    // Sum ingredient costs
    let ingredientCost = 0;
    for (const ingredient of recipe.ingredients) {
      if (ingredient.cost) {
        ingredientCost += parseFloat(ingredient.cost);
      }
    }

    // Estimate labor cost (simple calculation)
    const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
    const laborRate = 15; // $15/hour
    const laborCost = (totalTime / 60) * laborRate;

    const totalCost = ingredientCost + laborCost;

    return {
      hasCost: true,
      ingredientCost: ingredientCost,
      laborCost: laborCost,
      totalCost: totalCost
    };
  }

  /**
   * Calculate food cost percentage
   */
  calculateFoodCostPercent(menuItem) {
    const cost = this.calculateMenuItemCost(menuItem.id);
    
    if (!cost.hasCost || !menuItem.price || menuItem.price === 0) {
      return null;
    }

    const foodCostPercent = (cost.totalCost / menuItem.price) * 100;
    
    return {
      percent: foodCostPercent.toFixed(1),
      cost: cost.totalCost.toFixed(2),
      price: menuItem.price,
      profit: (menuItem.price - cost.totalCost).toFixed(2),
      isOverTarget: foodCostPercent > 32,
      isGood: foodCostPercent <= 32 && foodCostPercent >= 28
    };
  }

  /**
   * Guess cuisine type from menu item
   */
  guessCuisineType(menuItem) {
    const name = menuItem.name.toLowerCase();
    const desc = (menuItem.description || '').toLowerCase();
    const text = name + ' ' + desc;

    const cuisineKeywords = {
      'Italian': ['pasta', 'pizza', 'risotto', 'italian', 'marinara', 'parmesan'],
      'Asian': ['sushi', 'ramen', 'stir fry', 'asian', 'teriyaki', 'tempura'],
      'Mexican': ['taco', 'burrito', 'quesadilla', 'mexican', 'salsa', 'guacamole'],
      'American': ['burger', 'bbq', 'steak', 'american', 'wings', 'fries'],
      'French': ['french', 'coq au vin', 'ratatouille', 'bouillabaisse'],
      'Mediterranean': ['mediterranean', 'greek', 'hummus', 'falafel', 'tzatziki'],
      'Indian': ['curry', 'tandoori', 'indian', 'naan', 'biryani'],
      'Seafood': ['fish', 'seafood', 'salmon', 'shrimp', 'lobster', 'scallops']
    };

    for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return cuisine;
      }
    }

    return 'American';
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    if (window.authManager?.currentUser) {
      return window.authManager.currentUser.userId;
    }
    return 'guest';
  }

  /**
   * Get current project ID
   */
  getCurrentProjectId() {
    if (window.projectManager?.getCurrentProject) {
      const project = window.projectManager.getCurrentProject();
      return project?.id || 'default';
    }
    return 'default';
  }

  /**
   * Update recipe from menu item changes
   */
  async updateRecipeFromMenuItem(menuItem) {
    const recipe = this.getRecipeForMenuItem(menuItem.id);
    
    if (!recipe) {
      return;
    }

    // Update recipe fields that might have changed
    recipe.title = menuItem.name;
    recipe.description = menuItem.description;
    recipe.category = menuItem.category;
    recipe.menuItemPrice = menuItem.price;
    recipe.targetCost = menuItem.price ? (menuItem.price * 0.30).toFixed(2) : null;
    recipe.updatedAt = new Date().toISOString();

    // Save updated recipe
    await this.saveRecipeStub(recipe);

    console.log('✅ Recipe updated from menu item:', recipe.id);
  }

  /**
   * Delete recipe when menu item is deleted
   */
  async deleteRecipeForMenuItem(menuItemId, keepRecipe = false) {
    const links = this.getMenuRecipeLinks();
    const link = links[menuItemId];
    
    if (!link) {
      return;
    }

    if (!keepRecipe) {
      // Remove recipe stub
      const stubs = this.getRecipeStubs();
      const filtered = stubs.filter(r => r.id !== link.recipeId);
      localStorage.setItem(this.recipeStubsKey, JSON.stringify(filtered));

      // Also remove from main recipes
      const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
      const filteredRecipes = recipes.filter(r => r.id !== link.recipeId);
      localStorage.setItem('recipes', JSON.stringify(filteredRecipes));

      console.log('🗑️ Deleted recipe stub:', link.recipeId);
    }

    // Remove link
    delete links[menuItemId];
    localStorage.setItem(this.storageKey, JSON.stringify(links));

    console.log('🔗 Unlinked menu item:', menuItemId);
  }

  /**
   * Get menu statistics
   */
  getMenuStatistics(menuItems) {
    const stats = {
      totalItems: menuItems.length,
      withRecipes: 0,
      withCompleteRecipes: 0,
      withCosting: 0,
      needsDevelopment: 0,
      averageFoodCost: 0,
      overTargetCount: 0
    };

    let totalFoodCost = 0;
    let itemsWithCost = 0;

    for (const item of menuItems) {
      const status = this.getRecipeStatus(item.id);
      
      if (status.status !== 'no-recipe') {
        stats.withRecipes++;
      }
      
      if (status.status === 'complete' || status.status === 'costed') {
        stats.withCompleteRecipes++;
      }
      
      if (status.status === 'costed') {
        stats.withCosting++;
      }
      
      if (status.status === 'no-recipe' || status.status === 'stub') {
        stats.needsDevelopment++;
      }

      // Calculate food cost
      const costData = this.calculateFoodCostPercent(item);
      if (costData) {
        totalFoodCost += parseFloat(costData.percent);
        itemsWithCost++;
        
        if (costData.isOverTarget) {
          stats.overTargetCount++;
        }
      }
    }

    stats.averageFoodCost = itemsWithCost > 0 
      ? (totalFoodCost / itemsWithCost).toFixed(1) 
      : 0;

    return stats;
  }
}

// Initialize global instance
window.menuRecipeIntegration = new MenuRecipeIntegration();

console.log('🔗 Menu-Recipe Integration loaded');

