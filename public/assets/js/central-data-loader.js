/**
 * Central Data Loader
 * Pre-loads all user data on sign-in for instant access across all pages
 */

class CentralDataLoader {
  constructor() {
    this.dataCache = {};
    this.isLoaded = false;
    this.isLoading = false;
    this.init();
  }

  init() {
    console.log('📂 Central Data Loader initialized');
    
    // Listen for authentication events
    window.addEventListener('userLoggedIn', (e) => {
      console.log('👤 User logged in - loading all data...');
      this.loadAllData();
    });

    window.addEventListener('userSwitched', (e) => {
      console.log('🔄 User switched - reloading data...');
      this.loadAllData();
    });

    // If user is already logged in, load immediately
    if (window.authManager?.isAuthenticated()) {
      this.loadAllData();
    }
  }

  /**
   * Load all user data
   */
  async loadAllData() {
    if (this.isLoading) {
      console.log('⏳ Data already loading...');
      return;
    }

    this.isLoading = true;
    console.log('📥 Loading all user data...');

    try {
      const startTime = Date.now();

      // Load from localStorage first (instant)
      await this.loadFromLocalStorage();

      // Then sync from backend (if available)
      if (window.authManager?.isAuthenticated()) {
        await this.syncFromBackend();
      }

      this.isLoaded = true;
      this.isLoading = false;

      const loadTime = Date.now() - startTime;
      console.log(`✅ All data loaded in ${loadTime}ms`);

      // Dispatch event that data is ready
      window.dispatchEvent(new CustomEvent('dataLoaded', {
        detail: {
          cache: this.dataCache,
          loadTime: loadTime
        }
      }));

      // Show data stats
      this.logDataStats();

    } catch (error) {
      console.error('❌ Error loading data:', error);
      this.isLoading = false;
    }
  }

  /**
   * Load all data from localStorage
   */
  async loadFromLocalStorage() {
    const userId = this.getCurrentUserId();

    // Load recipes
    this.dataCache.recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
    this.dataCache.recipeIdeas = JSON.parse(localStorage.getItem('recipe_ideas') || '[]');
    this.dataCache.recipeStubs = JSON.parse(localStorage.getItem('recipe_stubs') || '[]');

    // Load projects
    this.dataCache.projects = JSON.parse(localStorage.getItem(`iterum_projects_user_${userId}`) || '[]');
    this.dataCache.currentProject = localStorage.getItem(`iterum_current_project_user_${userId}`) || 'master';

    // Load ingredients
    this.dataCache.ingredients = JSON.parse(localStorage.getItem('ingredients_database') || '[]');
    this.dataCache.customIngredients = JSON.parse(localStorage.getItem('custom_ingredients') || '[]');

    // Load vendors
    this.dataCache.vendors = JSON.parse(localStorage.getItem('iterum_vendors') || '[]');
    this.dataCache.vendorConnections = JSON.parse(localStorage.getItem('vendor_ingredient_connections') || '[]');

    // Load equipment
    this.dataCache.equipment = JSON.parse(localStorage.getItem('equipment_list') || '[]');

    // Load inventory
    this.dataCache.inventory = JSON.parse(localStorage.getItem('inventory_items') || '[]');
    this.dataCache.inventoryTransactions = JSON.parse(localStorage.getItem('inventory_transactions') || '[]');

    // Load production plans
    this.dataCache.productionPlans = JSON.parse(localStorage.getItem('production_plans') || '[]');

    // Load menus (from all projects)
    this.dataCache.menus = this.loadAllMenus();
    this.dataCache.menuRecipeLinks = JSON.parse(localStorage.getItem('menu_recipe_links') || '{}');

    // Load photos
    this.dataCache.photos = JSON.parse(localStorage.getItem('recipe_photos') || '[]');

    // Load notes
    this.dataCache.dailyNotes = JSON.parse(localStorage.getItem('daily_notes') || '{}');

    // Load user preferences
    this.dataCache.userPreferences = JSON.parse(localStorage.getItem('user_preferences') || '{}');

    console.log('✅ Data loaded from localStorage');
  }

  /**
   * Load menus from all projects
   */
  loadAllMenus() {
    const menus = {};
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith('menu_data_')) {
        try {
          const projectId = key.replace('menu_data_', '');
          menus[projectId] = JSON.parse(localStorage.getItem(key) || '{}');
        } catch (e) {
          console.warn('Could not load menu:', key);
        }
      }
    });

    return menus;
  }

  /**
   * Sync from backend (if available)
   */
  async syncFromBackend() {
    if (!window.authApiHelper) {
      console.log('⏭️ Backend sync not available');
      return;
    }

    try {
      console.log('🔄 Syncing from backend...');

      // Sync recipes
      try {
        const recipes = await window.authApiHelper.get('/api/recipes');
        if (recipes && recipes.length > 0) {
          this.dataCache.recipesFromBackend = recipes;
          console.log(`✅ Synced ${recipes.length} recipes from backend`);
        }
      } catch (e) {
        console.warn('Could not sync recipes from backend:', e.message);
      }

      // Sync projects
      try {
        const projects = await window.authApiHelper.get('/api/projects');
        if (projects && projects.length > 0) {
          this.dataCache.projectsFromBackend = projects;
          console.log(`✅ Synced ${projects.length} projects from backend`);
        }
      } catch (e) {
        console.warn('Could not sync projects from backend:', e.message);
      }

      // Sync vendors
      try {
        const vendors = await window.authApiHelper.get('/api/vendors');
        if (vendors && vendors.length > 0) {
          this.dataCache.vendorsFromBackend = vendors;
          console.log(`✅ Synced ${vendors.length} vendors from backend`);
        }
      } catch (e) {
        console.warn('Could not sync vendors from backend:', e.message);
      }

      console.log('✅ Backend sync complete');

    } catch (error) {
      console.warn('⚠️ Backend sync failed:', error.message);
      // Continue with localStorage data
    }
  }

  /**
   * Get data from cache
   */
  get(dataType) {
    if (!this.isLoaded && !this.isLoading) {
      console.warn('⚠️ Data not loaded yet, loading now...');
      this.loadAllData();
    }

    return this.dataCache[dataType] || [];
  }

  /**
   * Refresh specific data type
   */
  refresh(dataType) {
    const userId = this.getCurrentUserId();
    
    const keyMap = {
      'recipes': 'recipes',
      'ingredients': 'ingredients_database',
      'vendors': 'iterum_vendors',
      'equipment': 'equipment_list',
      'inventory': 'inventory_items',
      'projects': `iterum_projects_user_${userId}`,
      'productionPlans': 'production_plans',
      'photos': 'recipe_photos',
      'dailyNotes': 'daily_notes'
    };

    const key = keyMap[dataType];
    if (key) {
      this.dataCache[dataType] = JSON.parse(localStorage.getItem(key) || '[]');
      console.log(`🔄 Refreshed ${dataType}`);
    }
  }

  /**
   * Force reload all data
   */
  async forceReload() {
    this.isLoaded = false;
    this.isLoading = false;
    await this.loadAllData();
  }

  /**
   * Log data statistics
   */
  logDataStats() {
    console.log('📊 Data Cache Statistics:', {
      recipes: this.dataCache.recipes?.length || 0,
      recipeIdeas: this.dataCache.recipeIdeas?.length || 0,
      projects: this.dataCache.projects?.length || 0,
      ingredients: this.dataCache.ingredients?.length || 0,
      vendors: this.dataCache.vendors?.length || 0,
      vendorConnections: this.dataCache.vendorConnections?.length || 0,
      equipment: this.dataCache.equipment?.length || 0,
      inventory: this.dataCache.inventory?.length || 0,
      productionPlans: this.dataCache.productionPlans?.length || 0,
      photos: this.dataCache.photos?.length || 0,
      menus: Object.keys(this.dataCache.menus || {}).length,
      isLoaded: this.isLoaded
    });
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    if (window.authManager?.currentUser) {
      return window.authManager.currentUser.userId;
    }
    
    const sessionUser = localStorage.getItem('current_user');
    if (sessionUser) {
      try {
        const user = JSON.parse(sessionUser);
        return user.userId || user.id || 'guest';
      } catch (e) {
        return 'guest';
      }
    }
    
    return 'guest';
  }

  /**
   * Check if data is ready
   */
  isReady() {
    return this.isLoaded;
  }

  /**
   * Wait for data to be loaded
   */
  async waitForData(maxWaitMs = 5000) {
    if (this.isLoaded) return true;

    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.isLoaded) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime > maxWaitMs) {
          clearInterval(checkInterval);
          console.warn('⏱️ Data load timeout');
          resolve(false);
        }
      }, 100);
    });
  }

  /**
   * Get summary for dashboard
   */
  getSummary() {
    return {
      recipes: {
        total: this.dataCache.recipes?.length || 0,
        ideas: this.dataCache.recipeIdeas?.length || 0,
        stubs: this.dataCache.recipeStubs?.length || 0
      },
      ingredients: {
        total: (this.dataCache.ingredients?.length || 0) + (this.dataCache.customIngredients?.length || 0),
        base: this.dataCache.ingredients?.length || 0,
        custom: this.dataCache.customIngredients?.length || 0
      },
      vendors: {
        total: this.dataCache.vendors?.length || 0,
        connections: this.dataCache.vendorConnections?.length || 0
      },
      inventory: {
        items: this.dataCache.inventory?.length || 0,
        transactions: this.dataCache.inventoryTransactions?.length || 0,
        value: this.dataCache.inventory?.reduce((sum, item) => sum + (item.cost || 0) * (item.quantity || 0), 0) || 0
      },
      production: {
        plans: this.dataCache.productionPlans?.length || 0,
        active: this.dataCache.productionPlans?.filter(p => p.status !== 'executed').length || 0
      },
      projects: {
        total: this.dataCache.projects?.length || 0,
        current: this.dataCache.currentProject
      },
      photos: {
        total: this.dataCache.photos?.length || 0
      }
    };
  }

  /**
   * Show loading indicator
   */
  showLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'data-loading-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 9999;
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    indicator.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div class="spinner" style="width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <span>Loading your data...</span>
      </div>
    `;

    // Add spinner animation
    if (!document.getElementById('spinner-style')) {
      const style = document.createElement('style');
      style.id = 'spinner-style';
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(indicator);

    // Remove after data loads
    window.addEventListener('dataLoaded', () => {
      setTimeout(() => {
        const ind = document.getElementById('data-loading-indicator');
        if (ind) {
          ind.style.animation = 'slideOut 0.3s ease';
          setTimeout(() => ind.remove(), 300);
        }
      }, 500);
    }, { once: true });
  }

  /**
   * Show data loaded notification
   */
  showDataLoadedNotification() {
    const summary = this.getSummary();
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      z-index: 9999;
      min-width: 300px;
      border-left: 4px solid #22c55e;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div style="font-size: 24px;">✅</div>
        <div style="font-weight: 700; font-size: 16px;">Data Loaded</div>
      </div>
      <div style="font-size: 13px; color: #64748b; line-height: 1.6;">
        ${summary.recipes.total} recipes • ${summary.ingredients.total} ingredients<br>
        ${summary.vendors.total} vendors • ${summary.inventory.items} in stock<br>
        ${summary.production.plans} production plans
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Sync from backend
   */
  async syncFromBackend() {
    if (!window.authApiHelper) return;

    try {
      // Try to get latest data from backend
      const endpoints = [
        { key: 'recipesFromBackend', url: '/api/recipes' },
        { key: 'projectsFromBackend', url: '/api/projects' },
        { key: 'vendorsFromBackend', url: '/api/vendors' }
      ];

      for (const endpoint of endpoints) {
        try {
          const data = await window.authApiHelper.get(endpoint.url);
          if (data) {
            this.dataCache[endpoint.key] = data;
            console.log(`✅ Synced ${endpoint.key} from backend`);
          }
        } catch (e) {
          // Silently fail, use localStorage data
        }
      }

    } catch (error) {
      console.warn('Backend sync unavailable, using local data only');
    }
  }

  /**
   * Log data stats
   */
  logDataStats() {
    const summary = this.getSummary();
    console.log('📊 User Data Summary:', summary);
  }

  /**
   * Get specific data type with fallback
   */
  getData(type) {
    return this.dataCache[type] || [];
  }

  /**
   * Clear cache (for logout)
   */
  clearCache() {
    this.dataCache = {};
    this.isLoaded = false;
    console.log('🗑️ Data cache cleared');
  }
}

// Initialize global instance
window.centralDataLoader = new CentralDataLoader();

// Auto-show loading indicator on auth
window.addEventListener('userLoggedIn', () => {
  if (window.centralDataLoader && !window.centralDataLoader.isLoaded) {
    window.centralDataLoader.showLoadingIndicator();
  }
});

console.log('📂 Central Data Loader ready');

