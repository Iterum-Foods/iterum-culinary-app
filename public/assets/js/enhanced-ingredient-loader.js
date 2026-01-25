/**
 * Enhanced Ingredient Loader with USDA API Integration
 * Combines base database, API searches, and bulk imports
 */

class EnhancedIngredientLoader {
  constructor() {
    this.baseLoader = window.baseIngredientsLoader;
    this.usdaApiClient = window.usdaApiClient;
    this.usdaBulkProcessor = window.usdaBulkProcessor;
    this.ingredientsManager = window.ingredientsManager;
  }

  /**
   * Initialize and check database status
   */
  async init() {
    const stats = this.getDatabaseStats();
    console.log('📊 Ingredient Database Stats:', stats);
    return stats;
  }

  /**
   * Get database statistics
   */
  getDatabaseStats() {
    const allIngredients = this.ingredientsManager
      ? this.ingredientsManager.getAllIngredients()
      : JSON.parse(localStorage.getItem('ingredients_database') || '[]');

    const builtIn = allIngredients.filter(ing => /^ing_\d+$/.test(ing.id));
    const usda = allIngredients.filter(ing => ing.id?.startsWith('usda_'));
    const custom = allIngredients.filter(ing => 
      !/^ing_\d+$/.test(ing.id) && !ing.id?.startsWith('usda_')
    );

    return {
      total: allIngredients.length,
      builtIn: builtIn.length,
      usda: usda.length,
      custom: custom.length,
      hasApiKey: this.usdaApiClient.hasApiKey()
    };
  }

  /**
   * Search USDA database and import results
   * @param {string} query - Search query
   * @param {Object} options - Search options
   */
  async searchAndImport(query, options = {}) {
    if (!this.usdaApiClient.hasApiKey()) {
      return {
        success: false,
        message: 'USDA API key required. Get one free at https://api.data.gov/signup/',
        needsApiKey: true
      };
    }

    try {
      const {
        maxResults = 50,
        dataType = null, // Foundation, Branded, SR Legacy
        overwriteExisting = false,
        progressCallback = null
      } = options;

      console.log(`🔍 Searching USDA database for: "${query}"`);

      // Search
      const result = await this.usdaApiClient.searchAndImport(query, maxResults);
      
      if (!result.success) {
        return result;
      }

      // Import ingredients
      const importResult = await this.usdaBulkProcessor.importIngredients(
        result.ingredients,
        overwriteExisting
      );

      return {
        success: true,
        searched: result.totalFound,
        found: result.ingredients.length,
        imported: importResult.imported,
        skipped: importResult.skipped,
        errors: importResult.errors
      };

    } catch (error) {
      console.error('❌ Search and import error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Process bulk download file
   * @param {File} file - File to process
   * @param {Object} options - Processing options
   */
  async processBulkFile(file, options = {}) {
    try {
      const result = await this.usdaBulkProcessor.processFile(file, options);
      return result;
    } catch (error) {
      console.error('❌ Bulk file processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load base database (existing functionality)
   */
  async loadBaseDatabase(overwrite = false) {
    if (this.baseLoader) {
      return await this.baseLoader.importToLocalStorage(overwrite);
    }
    return { success: false, message: 'Base loader not available' };
  }

  /**
   * Get all ingredients
   */
  getAllIngredients() {
    return this.ingredientsManager
      ? this.ingredientsManager.getAllIngredients()
      : JSON.parse(localStorage.getItem('ingredients_database') || '[]');
  }

  /**
   * Search local database
   * @param {string} query - Search query
   */
  searchLocal(query) {
    const ingredients = this.getAllIngredients();
    const lowerQuery = query.toLowerCase();

    return ingredients.filter(ing =>
      ing.name?.toLowerCase().includes(lowerQuery) ||
      ing.category?.toLowerCase().includes(lowerQuery) ||
      ing.subcategory?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Combined search (local + USDA API)
   * @param {string} query - Search query
   * @param {Object} options - Search options
   */
  async combinedSearch(query, options = {}) {
    const {
      searchLocal = true,
      searchUSDA = true,
      maxLocalResults = 20,
      maxUSDAResults = 50
    } = options;

    const results = {
      local: [],
      usda: [],
      total: 0
    };

    // Search local
    if (searchLocal) {
      results.local = this.searchLocal(query).slice(0, maxLocalResults);
    }

    // Search USDA
    if (searchUSDA && this.usdaApiClient.hasApiKey()) {
      try {
        const usdaResult = await this.usdaApiClient.searchFoods(query, {
          pageSize: maxUSDAResults
        });

        if (usdaResult.foods) {
          results.usda = usdaResult.foods.map(food => 
            this.usdaApiClient.transformToIngredient(food)
          );
        }
      } catch (error) {
        console.error('USDA search error:', error);
      }
    }

    results.total = results.local.length + results.usda.length;

    return results;
  }

  /**
   * Show import modal with options
   */
  showImportModal() {
    const stats = this.getDatabaseStats();
    
    const modal = document.createElement('div');
    modal.id = 'enhanced-import-modal';
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
      <div style="background: white; border-radius: 16px; padding: 32px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto;">
        <h2 style="font-size: 28px; font-weight: 800; margin-bottom: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          📦 Import Ingredients
        </h2>

        <!-- Current Stats -->
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">Current Database</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            <div>
              <div style="font-size: 24px; font-weight: 800; color: #667eea;">${stats.total}</div>
              <div style="font-size: 13px; color: #64748b;">Total Ingredients</div>
            </div>
            <div>
              <div style="font-size: 24px; font-weight: 800; color: #10b981;">${stats.builtIn}</div>
              <div style="font-size: 13px; color: #64748b;">Built-in</div>
            </div>
            <div>
              <div style="font-size: 24px; font-weight: 800; color: #f59e0b;">${stats.usda}</div>
              <div style="font-size: 13px; color: #64748b;">From USDA</div>
            </div>
          </div>
        </div>

        <!-- Import Options -->
        <div style="display: grid; gap: 16px; margin-bottom: 24px;">
          <!-- Option 1: Base Database -->
          <button onclick="window.enhancedIngredientLoader.loadBaseDatabase(false)" 
                  style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; text-align: left;">
            <div style="font-size: 20px; margin-bottom: 8px;">📚 Import Base Database</div>
            <div style="font-size: 14px; opacity: 0.9;">145 professional culinary ingredients</div>
          </button>

          <!-- Option 2: USDA API Search -->
          <div style="padding: 20px; background: #f8fafc; border-radius: 12px; border: 2px solid #e2e8f0;">
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">🔍 Search USDA Database</div>
            <div style="font-size: 14px; color: #64748b; margin-bottom: 16px;">
              Search 300,000+ ingredients from USDA FoodData Central
            </div>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="usda-search-query" placeholder="e.g., chicken, olive oil, flour" 
                     style="flex: 1; padding: 12px; border: 2px solid #cbd5e1; border-radius: 8px;">
              <button onclick="window.enhancedIngredientLoader.handleUSDASearch()" 
                      style="padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                Search
              </button>
            </div>
            ${!stats.hasApiKey ? `
              <div style="margin-top: 12px; padding: 12px; background: #fef3c7; border-radius: 8px; font-size: 13px;">
                ⚠️ API key required. <a href="https://api.data.gov/signup/" target="_blank" style="color: #d97706; font-weight: 600;">Get one free →</a>
              </div>
            ` : ''}
          </div>

          <!-- Option 3: Bulk File Upload -->
          <div style="padding: 20px; background: #f8fafc; border-radius: 12px; border: 2px solid #e2e8f0;">
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">📥 Upload USDA Bulk File</div>
            <div style="font-size: 14px; color: #64748b; margin-bottom: 16px;">
              Upload USDA JSON/CSV files (Foundation Foods or Branded Foods)
            </div>
            <input type="file" id="usda-bulk-file" accept=".json,.csv" 
                   style="width: 100%; padding: 12px; border: 2px solid #cbd5e1; border-radius: 8px;">
            <div style="margin-top: 12px; font-size: 13px; color: #64748b;">
              <a href="https://fdc.nal.usda.gov/download-datasets.html" target="_blank">Download USDA datasets →</a>
            </div>
          </div>
        </div>

        <!-- Close Button -->
        <button onclick="document.getElementById('enhanced-import-modal').remove()" 
                style="width: 100%; padding: 14px; background: #f1f5f9; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
          Close
        </button>

        <!-- Results Area -->
        <div id="import-results" style="margin-top: 24px; display: none;"></div>
      </div>
    `;

    document.body.appendChild(modal);

    // File upload handler
    const fileInput = document.getElementById('usda-bulk-file');
    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          await window.enhancedIngredientLoader.handleBulkUpload(file);
        }
      });
    }
  }

  /**
   * Handle USDA API search
   */
  async handleUSDASearch() {
    const queryInput = document.getElementById('usda-search-query');
    const query = queryInput?.value.trim();

    if (!query) {
      alert('Please enter a search query');
      return;
    }

    const resultsDiv = document.getElementById('import-results');
    if (resultsDiv) {
      resultsDiv.style.display = 'block';
      resultsDiv.innerHTML = `
        <div style="padding: 20px; background: #f0fdf4; border-radius: 8px; text-align: center;">
          <div style="font-size: 40px; margin-bottom: 8px;">⏳</div>
          <div>Searching USDA database...</div>
        </div>
      `;
    }

    const result = await this.searchAndImport(query, { maxResults: 50 });

    if (resultsDiv) {
      if (result.success) {
        resultsDiv.innerHTML = `
          <div style="padding: 20px; background: #f0fdf4; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #10b981;">✅ Import Complete!</div>
            <div style="font-size: 14px; color: #64748b; margin-bottom: 16px;">
              Found: ${result.searched} | Imported: ${result.imported} | Skipped: ${result.skipped}
            </div>
            <button onclick="window.location.reload()" 
                    style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
              Reload Page
            </button>
          </div>
        `;
      } else {
        resultsDiv.innerHTML = `
          <div style="padding: 20px; background: #fef2f2; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #ef4444;">❌ Error</div>
            <div style="font-size: 14px; color: #64748b;">${result.message}</div>
          </div>
        `;
      }
    }
  }

  /**
   * Save USDA API key
   */
  saveApiKey() {
    const keyInput = document.getElementById('usda-api-key-input');
    if (keyInput && keyInput.value.trim()) {
      this.usdaApiClient.setApiKey(keyInput.value.trim());
      const setupDiv = document.getElementById('usda-api-key-setup');
      if (setupDiv) {
        setupDiv.style.display = 'none';
      }
      alert('✅ API key saved! You can now search USDA database.');
      return true;
    }
    alert('Please enter a valid API key');
    return false;
  }

  /**
   * Check and show API key setup if needed
   * Note: With shared key, this is typically hidden
   */
  checkApiKeyStatus() {
    // Hide API key setup by default (using shared key)
    // Only show if shared key is not set AND user wants to override
    const setupDiv = document.getElementById('usda-api-key-setup');
    if (setupDiv) {
      // Hide by default - shared key should be configured in code
      setupDiv.style.display = 'none';
      
      // Only show if no key at all (shared or user)
      if (!this.usdaApiClient.hasApiKey()) {
        setupDiv.style.display = 'block';
      }
    }
  }

  /**
   * Handle bulk file upload
   */
  async handleBulkUpload(file) {
    const resultsDiv = document.getElementById('import-results');
    if (resultsDiv) {
      resultsDiv.style.display = 'block';
      resultsDiv.innerHTML = `
        <div style="padding: 20px; background: #f0fdf4; border-radius: 8px; text-align: center;">
          <div style="font-size: 40px; margin-bottom: 8px;">⏳</div>
          <div>Processing file: ${file.name}</div>
        </div>
      `;
    }

    const result = await this.processBulkFile(file, {
      progressCallback: (progress) => {
        if (resultsDiv) {
          resultsDiv.innerHTML = `
            <div style="padding: 20px; background: #f0fdf4; border-radius: 8px;">
              <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Processing...</div>
              <div style="background: #e2e8f0; border-radius: 4px; height: 24px; margin-bottom: 8px;">
                <div style="background: #10b981; height: 100%; width: ${progress.percent}%; border-radius: 4px; transition: width 0.3s;"></div>
              </div>
              <div style="font-size: 14px; color: #64748b;">
                ${progress.current} / ${progress.total} (${progress.percent}%) - ${progress.ingredient}
              </div>
            </div>
          `;
        }
      }
    });

    if (resultsDiv) {
      if (result.success) {
        resultsDiv.innerHTML = `
          <div style="padding: 20px; background: #f0fdf4; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #10b981;">✅ Import Complete!</div>
            <div style="font-size: 14px; color: #64748b; margin-bottom: 16px;">
              Processed: ${result.processed} | Imported: ${result.imported} | Skipped: ${result.skipped}
            </div>
            <button onclick="window.location.reload()" 
                    style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
              Reload Page
            </button>
          </div>
        `;
      } else {
        resultsDiv.innerHTML = `
          <div style="padding: 20px; background: #fef2f2; border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #ef4444;">❌ Error</div>
            <div style="font-size: 14px; color: #64748b;">${result.error}</div>
          </div>
        `;
      }
    }
  }
}

// Create global instance
window.enhancedIngredientLoader = new EnhancedIngredientLoader();

console.log('📦 Enhanced Ingredient Loader loaded');
