/**
 * Inventory Generator
 * Automatically generates inventory items from recipes and menus
 * Links all ingredients to inventory via ingredient database
 */

class InventoryGenerator {
  constructor() {
    this.inventoryManager = window.inventoryManager;
    this.unitConverter = window.unitConverter;
  }

  /**
   * Generate inventory from recipes
   * Creates inventory items for all unique ingredients used in recipes
   * @param {Object} options - Generation options
   */
  async generateFromRecipes(options = {}) {
    const {
      recipeIds = null, // Specific recipes, or null for all
      projectId = null, // Filter by project
      overwriteExisting = false, // Overwrite existing inventory items
      defaultQuantity = 0, // Default quantity for new items
      defaultLocation = 'Main Kitchen',
      progressCallback = null
    } = options;

    try {
      console.log('📦 Generating inventory from recipes...');

      // Load recipes
      const recipes = this.loadRecipes(recipeIds, projectId);
      
      if (recipes.length === 0) {
        return {
          success: false,
          message: 'No recipes found',
          created: 0,
          skipped: 0
        };
      }

      console.log(`📚 Found ${recipes.length} recipes`);

      // Extract unique ingredients
      const ingredientMap = new Map(); // ingredientId -> ingredient data
      
      recipes.forEach((recipe, index) => {
        if (progressCallback) {
          progressCallback({
            current: index + 1,
            total: recipes.length,
            percent: Math.round(((index + 1) / recipes.length) * 50),
            message: `Scanning recipe: ${recipe.name || recipe.title}`
          });
        }

        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
          recipe.ingredients.forEach(ing => {
            const ingredientId = ing.ingredientId || ing.id;
            const ingredientName = ing.name || ing.ingredient;
            
            if (ingredientId && ingredientName) {
              // Get ingredient details from database
              const ingredient = this.getIngredientFromDatabase(ingredientId);
              
              if (ingredient) {
                // Store unique ingredient (first occurrence wins)
                if (!ingredientMap.has(ingredientId)) {
                  ingredientMap.set(ingredientId, {
                    ingredientId: ingredientId,
                    ingredientName: ingredientName,
                    ingredient: ingredient,
                    unit: ing.unit || ingredient.default_unit || ingredient.unit || 'g',
                    recipes: [recipe.name || recipe.title]
                  });
                } else {
                  // Add recipe to list
                  const existing = ingredientMap.get(ingredientId);
                  if (!existing.recipes.includes(recipe.name || recipe.title)) {
                    existing.recipes.push(recipe.name || recipe.title);
                  }
                }
              }
            }
          });
        }
      });

      console.log(`🔍 Found ${ingredientMap.size} unique ingredients`);

      // Create inventory items
      const created = [];
      const skipped = [];
      const existing = this.inventoryManager.getInventory();
      const existingIds = new Set(existing.map(item => item.ingredientId));

      let createdCount = 0;
      let skippedCount = 0;

      ingredientMap.forEach((data, ingredientId) => {
        const index = createdCount + skippedCount;
        if (progressCallback) {
          progressCallback({
            current: index + 1,
            total: ingredientMap.size,
            percent: 50 + Math.round(((index + 1) / ingredientMap.size) * 50),
            message: `Creating inventory: ${data.ingredientName}`
          });
        }

        // Check if exists
        const exists = existingIds.has(ingredientId);
        
        if (exists && !overwriteExisting) {
          skipped.push(data);
          skippedCount++;
          return;
        }

        // Create inventory item
        const inventoryItem = {
          id: `inv_${ingredientId}_${Date.now()}`,
          ingredientId: ingredientId,
          ingredientName: data.ingredientName,
          category: data.ingredient.category || 'Other',
          
          // Quantity
          quantity: defaultQuantity,
          unit: data.unit,
          minQuantity: 0,
          maxQuantity: null,
          
          // Cost (from ingredient database)
          unitCost: data.ingredient.cost || 
                   data.ingredient.avg_price_per_lb || 
                   0,
          totalValue: 0,
          
          // Vendor (from ingredient if available)
          vendor: data.ingredient.supplier || 
                  data.ingredient.brandOwner || 
                  'Default',
          vendorSKU: data.ingredient.vendorSKU || null,
          
          // Tracking
          location: defaultLocation,
          lastRestocked: null,
          lastUsed: null,
          
          // Status
          status: defaultQuantity > 0 ? 'in-stock' : 'out-of-stock',
          lowStockAlert: false,
          needsReorder: false,
          
          // Metadata
          notes: `Auto-generated from recipes: ${data.recipes.join(', ')}`,
          tags: ['auto-generated', 'from-recipes', data.ingredient.category?.toLowerCase() || 'other'],
          sourceRecipes: data.recipes,
          
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Add or update
        if (exists && overwriteExisting) {
          const existingItem = existing.find(item => item.ingredientId === ingredientId);
          Object.assign(existingItem, inventoryItem);
          this.inventoryManager.saveInventory(existing);
        } else {
          existing.push(inventoryItem);
          existingIds.add(ingredientId);
          this.inventoryManager.saveInventory(existing);
        }

        created.push(inventoryItem);
        createdCount++;
      });

      console.log(`✅ Created ${createdCount} inventory items, skipped ${skippedCount}`);

      return {
        success: true,
        recipesScanned: recipes.length,
        uniqueIngredients: ingredientMap.size,
        created: createdCount,
        skipped: skippedCount,
        items: created
      };

    } catch (error) {
      console.error('❌ Error generating inventory from recipes:', error);
      return {
        success: false,
        error: error.message,
        created: 0,
        skipped: 0
      };
    }
  }

  /**
   * Generate inventory from menus
   * Creates inventory items for all ingredients in menu items (via their recipes)
   * @param {Object} options - Generation options
   */
  async generateFromMenus(options = {}) {
    const {
      menuIds = null, // Specific menus, or null for all
      projectId = null, // Filter by project
      overwriteExisting = false,
      defaultQuantity = 0,
      defaultLocation = 'Main Kitchen',
      progressCallback = null
    } = options;

    try {
      console.log('📦 Generating inventory from menus...');

      // Load menus
      const menus = this.loadMenus(menuIds, projectId);
      
      if (menus.length === 0) {
        return {
          success: false,
          message: 'No menus found',
          created: 0,
          skipped: 0
        };
      }

      console.log(`📚 Found ${menus.length} menus`);

      // Load recipes
      const recipes = this.loadRecipes(null, projectId);
      const recipeMap = new Map(recipes.map(r => [r.id, r]));

      // Extract ingredients from menu items
      const ingredientMap = new Map();
      
      menus.forEach((menu, menuIndex) => {
        const menuItems = menu.items || [];
        
        menuItems.forEach((menuItem, itemIndex) => {
          if (progressCallback) {
            const total = menus.reduce((sum, m) => sum + (m.items?.length || 0), 0);
            const current = menus.slice(0, menuIndex).reduce((sum, m) => sum + (m.items?.length || 0), 0) + itemIndex + 1;
            progressCallback({
              current: current,
              total: total,
              percent: Math.round((current / total) * 50),
              message: `Scanning menu item: ${menuItem.name}`
            });
          }

          // Get recipe for menu item
          const recipeId = menuItem.recipeId;
          if (!recipeId) {
            console.warn(`⚠️ Menu item "${menuItem.name}" has no linked recipe`);
            return;
          }

          const recipe = recipeMap.get(recipeId);
          if (!recipe) {
            console.warn(`⚠️ Recipe "${recipeId}" not found for menu item "${menuItem.name}"`);
            return;
          }

          // Extract ingredients from recipe
          if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
            recipe.ingredients.forEach(ing => {
              const ingredientId = ing.ingredientId || ing.id;
              const ingredientName = ing.name || ing.ingredient;
              
              if (ingredientId && ingredientName) {
                const ingredient = this.getIngredientFromDatabase(ingredientId);
                
                if (ingredient) {
                  if (!ingredientMap.has(ingredientId)) {
                    ingredientMap.set(ingredientId, {
                      ingredientId: ingredientId,
                      ingredientName: ingredientName,
                      ingredient: ingredient,
                      unit: ing.unit || ingredient.default_unit || ingredient.unit || 'g',
                      menuItems: [menuItem.name],
                      menus: [menu.name || menu.title]
                    });
                  } else {
                    const existing = ingredientMap.get(ingredientId);
                    if (!existing.menuItems.includes(menuItem.name)) {
                      existing.menuItems.push(menuItem.name);
                    }
                    if (!existing.menus.includes(menu.name || menu.title)) {
                      existing.menus.push(menu.name || menu.title);
                    }
                  }
                }
              }
            });
          }
        });
      });

      console.log(`🔍 Found ${ingredientMap.size} unique ingredients from menus`);

      // Create inventory items (same logic as generateFromRecipes)
      const created = [];
      const skipped = [];
      const existing = this.inventoryManager.getInventory();
      const existingIds = new Set(existing.map(item => item.ingredientId));

      let createdCount = 0;
      let skippedCount = 0;

      ingredientMap.forEach((data, ingredientId) => {
        const index = createdCount + skippedCount;
        if (progressCallback) {
          progressCallback({
            current: index + 1,
            total: ingredientMap.size,
            percent: 50 + Math.round(((index + 1) / ingredientMap.size) * 50),
            message: `Creating inventory: ${data.ingredientName}`
          });
        }

        const exists = existingIds.has(ingredientId);
        
        if (exists && !overwriteExisting) {
          skipped.push(data);
          skippedCount++;
          return;
        }

        const inventoryItem = {
          id: `inv_${ingredientId}_${Date.now()}`,
          ingredientId: ingredientId,
          ingredientName: data.ingredientName,
          category: data.ingredient.category || 'Other',
          
          quantity: defaultQuantity,
          unit: data.unit,
          minQuantity: 0,
          maxQuantity: null,
          
          unitCost: data.ingredient.cost || 
                   data.ingredient.avg_price_per_lb || 
                   0,
          totalValue: 0,
          
          vendor: data.ingredient.supplier || 
                  data.ingredient.brandOwner || 
                  'Default',
          vendorSKU: data.ingredient.vendorSKU || null,
          
          location: defaultLocation,
          lastRestocked: null,
          lastUsed: null,
          
          status: defaultQuantity > 0 ? 'in-stock' : 'out-of-stock',
          lowStockAlert: false,
          needsReorder: false,
          
          notes: `Auto-generated from menus: ${data.menus.join(', ')}`,
          tags: ['auto-generated', 'from-menus', data.ingredient.category?.toLowerCase() || 'other'],
          sourceMenus: data.menus,
          sourceMenuItems: data.menuItems,
          
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (exists && overwriteExisting) {
          const existingItem = existing.find(item => item.ingredientId === ingredientId);
          Object.assign(existingItem, inventoryItem);
          this.inventoryManager.saveInventory(existing);
        } else {
          existing.push(inventoryItem);
          existingIds.add(ingredientId);
          this.inventoryManager.saveInventory(existing);
        }

        created.push(inventoryItem);
        createdCount++;
      });

      console.log(`✅ Created ${createdCount} inventory items from menus, skipped ${skippedCount}`);

      return {
        success: true,
        menusScanned: menus.length,
        uniqueIngredients: ingredientMap.size,
        created: createdCount,
        skipped: skippedCount,
        items: created
      };

    } catch (error) {
      console.error('❌ Error generating inventory from menus:', error);
      return {
        success: false,
        error: error.message,
        created: 0,
        skipped: 0
      };
    }
  }

  /**
   * Generate inventory from both recipes and menus
   * @param {Object} options - Generation options
   */
  async generateFromRecipesAndMenus(options = {}) {
    const {
      fromRecipes = true,
      fromMenus = true,
      ...otherOptions
    } = options;

    const results = {
      recipes: null,
      menus: null,
      totalCreated: 0,
      totalSkipped: 0
    };

    if (fromRecipes) {
      results.recipes = await this.generateFromRecipes(otherOptions);
      if (results.recipes.success) {
        results.totalCreated += results.recipes.created;
        results.totalSkipped += results.recipes.skipped;
      }
    }

    if (fromMenus) {
      results.menus = await this.generateFromMenus(otherOptions);
      if (results.menus.success) {
        results.totalCreated += results.menus.created;
        results.totalSkipped += results.menus.skipped;
      }
    }

    return results;
  }

  /**
   * Load recipes
   */
  loadRecipes(recipeIds = null, projectId = null) {
    // Try multiple storage keys
    const userId = this.getCurrentUserId();
    const projId = projectId || this.getCurrentProjectId() || 'master';
    
    const recipesKey = `iterum_recipes_${userId}_${projId}`;
    let recipes = [];
    
    try {
      const stored = localStorage.getItem(recipesKey);
      if (stored) {
        recipes = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading recipes:', e);
    }

    // Filter by recipe IDs if specified
    if (recipeIds && Array.isArray(recipeIds)) {
      recipes = recipes.filter(r => recipeIds.includes(r.id));
    }

    return recipes;
  }

  /**
   * Load menus
   */
  loadMenus(menuIds = null, projectId = null) {
    const userId = this.getCurrentUserId();
    const projId = projectId || this.getCurrentProjectId() || 'master';
    
    const menusKey = `iterum_menus_${userId}_${projId}`;
    let menus = [];
    
    try {
      const stored = localStorage.getItem(menusKey);
      if (stored) {
        menus = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading menus:', e);
    }

    // Filter by menu IDs if specified
    if (menuIds && Array.isArray(menuIds)) {
      menus = menus.filter(m => menuIds.includes(m.id));
    }

    return menus;
  }

  /**
   * Get ingredient from database
   */
  getIngredientFromDatabase(ingredientId) {
    // Try enhanced manager first
    if (window.ingredientsManager) {
      const allIngredients = window.ingredientsManager.getAllIngredients();
      return allIngredients.find(ing => ing.id === ingredientId);
    }

    // Fallback to direct localStorage
    const ingredients = JSON.parse(
      localStorage.getItem('ingredients_database') || 
      localStorage.getItem('ingredients') || 
      '[]'
    );

    return ingredients.find(ing => ing.id === ingredientId);
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    if (window.unifiedAuthSystem) {
      return window.unifiedAuthSystem.getCurrentUserId();
    }
    return localStorage.getItem('current_user_id') || 'default';
  }

  /**
   * Get current project ID
   */
  getCurrentProjectId() {
    if (window.projectManagementSystem) {
      return window.projectManagementSystem.getCurrentProjectId();
    }
    return localStorage.getItem('current_project_id') || 'master';
  }
}

// Create global instance
window.inventoryGenerator = new InventoryGenerator();

console.log('📦 Inventory Generator loaded');
