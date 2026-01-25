/**
 * Base Ingredients Database Loader
 * Loads professional culinary ingredients into the app
 */

class BaseIngredientsLoader {
  constructor() {
    this.databaseUrl = 'data/base-ingredients-database.json';
    this.localStorageKey = 'ingredients_database';
    this.customKey = 'custom_ingredients';
  }

  /**
   * Load base ingredients from JSON file
   */
  async loadBaseDatabase() {
    try {
      console.log('📦 Loading base ingredients database...');
      
      const response = await fetch(this.databaseUrl);
      if (!response.ok) {
        throw new Error(`Failed to load database: ${response.status}`);
      }

      const database = await response.json();
      console.log(`✅ Loaded ${database.ingredients.length} base ingredients`);
      
      return database;

    } catch (error) {
      console.error('❌ Error loading base ingredients:', error);
      return null;
    }
  }

  /**
   * Import base ingredients into localStorage
   * @param {boolean} overwrite - If true, replace existing. If false, merge.
   */
  async importToLocalStorage(overwrite = false) {
    try {
      const database = await this.loadBaseDatabase();
      if (!database) {
        throw new Error('Failed to load database');
      }

      // Get existing ingredients
      const existing = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
      
      let finalIngredients = [];

      if (overwrite) {
        // Replace everything
        finalIngredients = database.ingredients;
        console.log(`🔄 Overwriting with ${finalIngredients.length} base ingredients`);
      } else {
        // Merge - keep custom, add base
        const existingIds = new Set(existing.map(ing => ing.id));
        const newBaseIngredients = database.ingredients.filter(
          ing => !existingIds.has(ing.id)
        );
        
        finalIngredients = [...existing, ...newBaseIngredients];
        console.log(`✅ Added ${newBaseIngredients.length} new base ingredients`);
      }

      // Save to BOTH storage keys for compatibility
      localStorage.setItem(this.localStorageKey, JSON.stringify(finalIngredients));
      localStorage.setItem('ingredients', JSON.stringify(finalIngredients)); // Also save to old key
      
      // Track analytics
      if (window.analyticsTracker) {
        window.analyticsTracker.trackCustomEvent('ingredients_imported', {
          count: finalIngredients.length,
          source: 'base_database'
        });
      }

      console.log(`✅ Saved ${finalIngredients.length} ingredients to storage`);

      return {
        success: true,
        total: finalIngredients.length,
        added: finalIngredients.length - existing.length
      };

    } catch (error) {
      console.error('❌ Error importing ingredients:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get ingredients by category
   */
  async getByCategory(category) {
    const database = await this.loadBaseDatabase();
    if (!database) return [];

    return database.ingredients.filter(ing => ing.category === category);
  }

  /**
   * Get all categories
   */
  async getCategories() {
    const database = await this.loadBaseDatabase();
    return database?.categories || [];
  }

  /**
   * Search ingredients
   */
  async searchIngredients(query) {
    const database = await this.loadBaseDatabase();
    if (!database) return [];

    const lowerQuery = query.toLowerCase();
    
    return database.ingredients.filter(ing => 
      ing.name.toLowerCase().includes(lowerQuery) ||
      ing.category.toLowerCase().includes(lowerQuery) ||
      ing.substitutes.some(sub => sub.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get ingredient by ID
   */
  async getById(id) {
    const database = await this.loadBaseDatabase();
    if (!database) return null;

    return database.ingredients.find(ing => ing.id === id);
  }

  /**
   * Get database statistics
   */
  async getStats() {
    const database = await this.loadBaseDatabase();
    if (!database) return null;

    const stats = {
      total: database.ingredients.length,
      version: database.version,
      lastUpdated: database.last_updated,
      categories: {}
    };

    // Count by category
    database.categories.forEach(cat => {
      const count = database.ingredients.filter(ing => ing.category === cat).length;
      stats.categories[cat] = count;
    });

    return stats;
  }

  /**
   * Check if base database is loaded
   */
  isBaseLoaded() {
    const ingredients = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
    // Check if any ingredient has an ID starting with "ing_" (base database format)
    return ingredients.some(ing => ing.id && ing.id.startsWith('ing_'));
  }

  /**
   * Show import modal
   */
  showImportModal() {
    const modal = document.createElement('div');
    modal.id = 'base-ingredients-import-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="background: white; border-radius: 16px; padding: 32px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
        <h2 style="font-size: 28px; font-weight: 800; margin-bottom: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          📦 Import Base Ingredients
        </h2>
        
        <div id="import-stats-loading" style="text-align: center; padding: 20px;">
          <div style="font-size: 40px; margin-bottom: 10px;">⏳</div>
          <div>Loading database...</div>
        </div>

        <div id="import-stats" style="display: none;">
          <p style="font-size: 16px; color: #64748b; margin-bottom: 24px;">
            Import professional culinary ingredients with pricing, nutritional info, substitutes, and more.
          </p>

          <div id="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
            <!-- Stats will be inserted here -->
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="overwrite-existing" style="width: 20px; height: 20px; margin-right: 12px;">
              <span style="font-weight: 600;">Overwrite existing ingredients</span>
            </label>
            <p style="font-size: 13px; color: #64748b; margin: 8px 0 0 32px;">
              ⚠️ This will replace ALL current ingredients. Leave unchecked to merge with existing.
            </p>
          </div>

          <div style="display: flex; gap: 12px;">
            <button onclick="document.getElementById('base-ingredients-import-modal').remove()" 
                    style="flex: 1; padding: 14px; background: #f1f5f9; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
              Cancel
            </button>
            <button onclick="window.baseIngredientsLoader.executeImport()" 
                    style="flex: 2; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
              Import Ingredients
            </button>
          </div>
        </div>

        <div id="import-result" style="display: none; text-align: center; padding: 20px;">
          <div id="result-icon" style="font-size: 60px; margin-bottom: 16px;">✅</div>
          <h3 id="result-title" style="font-size: 24px; font-weight: 700; margin-bottom: 8px;"></h3>
          <p id="result-message" style="font-size: 16px; color: #64748b; margin-bottom: 24px;"></p>
          <button onclick="window.location.reload()" 
                  style="padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
            Reload Page
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Load stats
    this.loadImportStats();
  }

  /**
   * Load and display stats for import modal
   */
  async loadImportStats() {
    const stats = await this.getStats();
    
    if (!stats) {
      document.getElementById('import-stats-loading').innerHTML = `
        <div style="font-size: 40px; margin-bottom: 10px;">❌</div>
        <div style="color: #ef4444;">Failed to load database</div>
      `;
      return;
    }

    document.getElementById('import-stats-loading').style.display = 'none';
    document.getElementById('import-stats').style.display = 'block';

    // Display stats
    const statsGrid = document.getElementById('stats-grid');
    statsGrid.innerHTML = `
      <div style="text-align: center; padding: 16px; background: white; border: 2px solid #e2e8f0; border-radius: 8px;">
        <div style="font-size: 28px; font-weight: 800; color: #667eea;">${stats.total}</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Ingredients</div>
      </div>
      <div style="text-align: center; padding: 16px; background: white; border: 2px solid #e2e8f0; border-radius: 8px;">
        <div style="font-size: 28px; font-weight: 800; color: #667eea;">${Object.keys(stats.categories).length}</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Categories</div>
      </div>
      <div style="text-align: center; padding: 16px; background: white; border: 2px solid #e2e8f0; border-radius: 8px;">
        <div style="font-size: 20px; font-weight: 800; color: #667eea;">${stats.version}</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Version</div>
      </div>
    `;
  }

  /**
   * Execute the import
   */
  async executeImport() {
    const overwrite = document.getElementById('overwrite-existing')?.checked || false;
    
    // Show loading
    document.getElementById('import-stats').style.display = 'none';
    document.getElementById('import-stats-loading').style.display = 'block';
    document.getElementById('import-stats-loading').innerHTML = `
      <div style="font-size: 40px; margin-bottom: 10px;">⏳</div>
      <div>Importing ingredients...</div>
    `;

    // Import
    const result = await this.importToLocalStorage(overwrite);

    // Show result
    document.getElementById('import-stats-loading').style.display = 'none';
    document.getElementById('import-result').style.display = 'block';

    if (result.success) {
      document.getElementById('result-icon').textContent = '✅';
      document.getElementById('result-title').textContent = 'Import Successful!';
      document.getElementById('result-message').textContent = 
        `${result.total} total ingredients (${result.added} new)`;
    } else {
      document.getElementById('result-icon').textContent = '❌';
      document.getElementById('result-title').textContent = 'Import Failed';
      document.getElementById('result-message').textContent = result.error;
    }
  }
}

// Initialize global instance
window.baseIngredientsLoader = new BaseIngredientsLoader();

console.log('📦 Base Ingredients Loader ready');

