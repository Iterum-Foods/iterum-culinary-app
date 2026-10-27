/**
 * Universal Recipe Manager
 * Ensures ALL recipes are added to the library regardless of where they're created
 * Centralized storage system for recipe data
 */

class UniversalRecipeManager {
  constructor() {
    this.storageKeys = {
      recipes: 'recipes',
      recipesInProgress: 'recipes_in_progress',
      recipeIdeas: 'recipe_ideas',
      recipeStubs: 'recipe_stubs',
      recipeLibrary: 'recipe_library'
    };
    this.initialized = false;
    this.init();
  }

  /**
   * Initialize the universal recipe manager
   */
  init() {
    console.log('📚 Initializing Universal Recipe Manager...');

    try {
      // Ensure recipe library exists
      this.ensureRecipeLibrary();

      // Listen for recipe creation events from all sources
      this.setupEventListeners();

      this.initialized = true;
      console.log('✅ Universal Recipe Manager initialized');

      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('recipeManagerReady'));

      if (window.firestoreSync?.fetchRecipeLibrarySnapshot) {
        this.loadLibraryFromCloud();
      }
    } catch (error) {
      console.error('❌ Error initializing Universal Recipe Manager:', error);
    }
  }

  /**
   * Ensure recipe library storage exists
   */
  ensureRecipeLibrary() {
    // Get or create recipe library
    let library = this.getRecipeLibrary();

    if (!library || !Array.isArray(library)) {
      library = [];
      this.saveRecipeLibrary(library);
      console.log('📚 Recipe library initialized');
    } else {
      console.log(`📚 Recipe library loaded: ${library.length} recipes`);
    }
  }

  /**
   * Setup event listeners for recipe creation from all sources
   */
  setupEventListeners() {
    // Listen for recipe saved events
    window.addEventListener('recipeSaved', event => {
      console.log('📩 Recipe saved event received:', event.detail);
      this.addToLibrary(event.detail.recipe, event.detail.source);
    });

    // Listen for recipe created events
    window.addEventListener('recipeCreated', event => {
      console.log('📩 Recipe created event received:', event.detail);
      this.addToLibrary(event.detail.recipe, event.detail.source);
    });

    // Listen for recipe imported events
    window.addEventListener('recipeImported', event => {
      console.log('📩 Recipe imported event received:', event.detail);
      this.addToLibrary(event.detail.recipe, event.detail.source);
    });

    console.log('✅ Event listeners set up for recipe creation');
  }

  /**
   * Add recipe to library (main function)
   */
  addToLibrary(recipe, source = 'unknown') {
    if (!recipe) {
      console.warn('⚠️ Cannot add null/undefined recipe to library');
      return false;
    }

    console.log(
      `📖 Adding recipe to library from ${source}:`,
      recipe.title || recipe.name
    );

    try {
      // Normalize recipe data
      const normalizedRecipe = this.normalizeRecipe(recipe, source);

      // Get current library
      let library = this.getRecipeLibrary();

      // Check if recipe already exists
      const existingIndex = library.findIndex(
        r =>
          r.id === normalizedRecipe.id ||
          (r.title === normalizedRecipe.title &&
            r.userId === normalizedRecipe.userId)
      );

      if (existingIndex !== -1) {
        // Update existing recipe
        library[existingIndex] = {
          ...library[existingIndex],
          ...normalizedRecipe,
          updatedAt: new Date().toISOString(),
          lastSource: source
        };
        console.log('♻️ Updated existing recipe in library');
      } else {
        // Add new recipe
        library.push(normalizedRecipe);
        console.log('➕ Added new recipe to library');
      }

      // Save library
      this.saveRecipeLibrary(library);

      // Also save to other storage locations for compatibility
      this.saveToMultipleLocations(normalizedRecipe);

      // Dispatch event that library was updated
      window.dispatchEvent(
        new CustomEvent('recipeLibraryUpdated', {
          detail: {
            recipe: normalizedRecipe,
            source: source,
            libraryCount: library.length
          }
        })
      );

      console.log(`✅ Recipe added to library (total: ${library.length})`);
      return true;
    } catch (error) {
      console.error('❌ Error adding recipe to library:', error);
      return false;
    }
  }

  /**
   * Normalize recipe data from different sources
   */
  normalizeRecipe(recipe, source) {
    const currentUser = this.getCurrentUser();

    // Generate ID if missing
    const id =
      recipe.id ||
      `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Normalize title/name
    const title = recipe.title || recipe.name || 'Untitled Recipe';

    // Normalize ingredients
    const ingredients = this.normalizeIngredients(recipe.ingredients || []);

    // Normalize instructions
    const instructions = this.normalizeInstructions(recipe.instructions || []);

    // Get current project ID
    const projectId = this.getCurrentProjectId();

    return {
      id: id,
      title: title,
      name: title, // Keep both for compatibility
      description: recipe.description || '',
      category: recipe.category || recipe.type || 'other',
      cuisine: recipe.cuisine || recipe.cuisine_type || '',
      servings: recipe.servings || 4,
      prepTime: recipe.prepTime || recipe.prep_time || 0,
      cookTime: recipe.cookTime || recipe.cook_time || 0,
      totalTime:
        (recipe.prepTime || recipe.prep_time || 0) +
        (recipe.cookTime || recipe.cook_time || 0),
      difficulty: recipe.difficulty || recipe.difficulty_level || 'medium',
      ingredients: ingredients,
      instructions: instructions,
      tags: recipe.tags || [],
      notes: recipe.notes || '',
      image: recipe.image || recipe.primary_image || '',
      images: recipe.images || recipe.gallery_images || [],
      nutrition: recipe.nutrition || recipe.nutritionData || {},
      source: source,
      status: recipe.status || 'published',
      userId: recipe.userId || currentUser?.id || 'guest',
      userName: recipe.userName || currentUser?.name || 'Guest',
      projectId: recipe.projectId || projectId, // Tag with current project
      project: recipe.project || projectId, // Keep both for compatibility
      createdAt:
        recipe.createdAt || recipe.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Metadata
      metadata: {
        source: source,
        originalData: recipe.metadata || {},
        addedToLibrary: new Date().toISOString()
      }
    };
  }

  /**
   * Get current project ID
   */
  getCurrentProjectId() {
    // Try unified project selector first
    if (
      window.unifiedProjectSelector &&
      window.unifiedProjectSelector.currentProjectId
    ) {
      return window.unifiedProjectSelector.currentProjectId;
    }

    // Try project manager
    if (window.projectManager && window.projectManager.currentProject) {
      return window.projectManager.currentProject.id;
    }

    // Try localStorage
    const currentUser = this.getCurrentUser();
    const userId = currentUser?.userId || currentUser?.id || 'guest';
    const storedProjectId =
      localStorage.getItem(`iterum_current_project_user_${userId}`) ||
      localStorage.getItem('iterum_current_project');

    return storedProjectId || 'master';
  }

  /**
   * Normalize ingredients array
   */
  normalizeIngredients(ingredients) {
    if (!Array.isArray(ingredients)) {
      return [];
    }

    return ingredients.map(ing => ({
      id: ing.id || ing.ingredient_id,
      name: ing.name || ing.ingredient_name || '',
      amount: ing.amount || ing.quantity || '',
      unit: ing.unit || '',
      notes: ing.notes || ''
    }));
  }

  /**
   * Normalize instructions array
   */
  normalizeInstructions(instructions) {
    if (!Array.isArray(instructions)) {
      // If instructions is a string, convert to array
      if (typeof instructions === 'string') {
        return instructions
          .split('\n')
          .filter(s => s.trim())
          .map((text, index) => ({
            step: index + 1,
            instruction: text.trim()
          }));
      }
      return [];
    }

    return instructions.map((inst, index) => {
      if (typeof inst === 'string') {
        return {
          step: index + 1,
          instruction: inst
        };
      }
      return {
        step: inst.step || index + 1,
        instruction: inst.instruction || inst.text || inst.description || ''
      };
    });
  }

  projectRecipeKey(dataType) {
    if (window.projectManager?.getProjectStorageKey) {
      return window.projectManager.getProjectStorageKey(dataType);
    }
    return null;
  }

  readProjectRecipeList(dataType) {
    const key = this.projectRecipeKey(dataType);
    if (!key || localStorage.getItem(key) == null) {
      return [];
    }
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Could not read project recipes', dataType, error);
      return [];
    }
  }

  writeProjectRecipeList(dataType, list) {
    const key = this.projectRecipeKey(dataType);
    if (!key) {
      return false;
    }
    localStorage.setItem(key, JSON.stringify(Array.isArray(list) ? list : []));
    return true;
  }

  /**
   * Save to multiple storage locations for compatibility
   */
  saveToMultipleLocations(recipe) {
    try {
      // Keep the active project's in-progress list in sync. Do not write the shared bucket.
      if (recipe.status === 'in-progress' || recipe.status === 'draft') {
        const inProgress = this.readProjectRecipeList('recipes_in_progress');
        const progressIndex = inProgress.findIndex(r => r.id === recipe.id);
        if (progressIndex !== -1) {
          inProgress[progressIndex] = recipe;
        } else {
          inProgress.push(recipe);
        }
        this.writeProjectRecipeList('recipes_in_progress', inProgress);
      }

      console.log('✅ Recipe saved to multiple storage locations');
    } catch (error) {
      console.error('❌ Error saving to multiple locations:', error);
    }
  }

  /**
   * Get recipe library
   */
  getRecipeLibrary() {
    try {
      if (window.userDataManager?.getUserRecipes && window.projectManager) {
        const recipes = window.userDataManager.getUserRecipes();
        return Array.isArray(recipes) ? recipes : [];
      }
      return this.readProjectRecipeList('recipe_library');
    } catch (error) {
      console.error('❌ Error getting recipe library:', error);
      return [];
    }
  }

  /**
   * Save recipe library
   */
  saveRecipeLibrary(library) {
    try {
      const safe = Array.isArray(library) ? library : [];
      if (window.userDataManager?.saveUserRecipes && window.projectManager) {
        window.userDataManager.saveUserRecipes(safe);
      } else if (!this.writeProjectRecipeList('recipe_library', safe)) {
        return false;
      }
      console.log(`💾 Recipe library saved: ${library.length} recipes`);

      if (window.firestoreSync?.saveRecipeLibrarySnapshot) {
        window.firestoreSync.saveRecipeLibrarySnapshot(library).catch(error => {
          console.warn(
            '⚠️ Recipe library cloud sync skipped:',
            error?.message || error
          );
        });
      }

      return true;
    } catch (error) {
      console.error('❌ Error saving recipe library:', error);
      return false;
    }
  }

  async loadLibraryFromCloud() {
    try {
      const snapshot = await window.firestoreSync.fetchRecipeLibrarySnapshot();
      if (!snapshot || !Array.isArray(snapshot.recipes)) {
        return;
      }

      const localLibrary = this.getRecipeLibrary();
      const localUpdated =
        Array.isArray(localLibrary) && localLibrary.length
          ? Date.parse(localLibrary[0]?.updatedAt || 0)
          : 0;
      const remoteUpdated = Date.parse(
        snapshot.updatedAt || snapshot.syncedAt || 0
      );

      const currentId = this.getCurrentProjectId() || 'master';
      const scoped = snapshot.recipes.filter(recipe => {
        const pid = recipe && (recipe.projectId || recipe.project);
        if (!pid || pid === 'master') {
          return currentId === 'master';
        }
        return pid === currentId;
      });
      if (!scoped.length) {
        return;
      }

      if (
        !localLibrary.length ||
        (remoteUpdated && remoteUpdated > localUpdated)
      ) {
        this.saveRecipeLibrary(scoped);
        console.log('☁️ Recipe library hydrated from Firestore snapshot');
      }
    } catch (error) {
      console.warn(
        '⚠️ Unable to hydrate recipe library from cloud:',
        error?.message || error
      );
    }
  }

  /**
   * Get all recipes (from library and all other sources)
   */
  getAllRecipes() {
    const library = this.readProjectRecipeList('recipe_library');
    const inProgress = this.readProjectRecipeList('recipes_in_progress');
    const ideas = this.readProjectRecipeList('recipe_ideas');

    // Merge this project's lists only. Do not fall back to Master or global keys.
    const allRecipes = [...library, ...inProgress, ...ideas];
    const uniqueRecipes = [];
    const seenIds = new Set();

    allRecipes.forEach(recipe => {
      if (!seenIds.has(recipe.id)) {
        seenIds.add(recipe.id);
        uniqueRecipes.push(recipe);
      }
    });

    return uniqueRecipes;
  }

  /**
   * Get recipe by ID
   */
  getRecipeById(id) {
    const allRecipes = this.getAllRecipes();
    return allRecipes.find(r => r.id === id);
  }

  /**
   * Delete recipe from library
   */
  deleteRecipe(id) {
    try {
      // Remove from library
      let library = this.getRecipeLibrary();
      library = library.filter(r => r.id !== id);
      this.saveRecipeLibrary(library);

      // Remove from other locations
      ['recipes', 'recipesInProgress'].forEach(key => {
        let recipes = JSON.parse(
          localStorage.getItem(this.storageKeys[key]) || '[]'
        );
        recipes = recipes.filter(r => r.id !== id);
        localStorage.setItem(this.storageKeys[key], JSON.stringify(recipes));
      });

      console.log(`🗑️ Recipe deleted: ${id}`);

      // Dispatch event
      window.dispatchEvent(
        new CustomEvent('recipeDeleted', { detail: { id } })
      );

      return true;
    } catch (error) {
      console.error('❌ Error deleting recipe:', error);
      return false;
    }
  }

  /**
   * Search recipes
   */
  searchRecipes(query) {
    const allRecipes = this.getAllRecipes();
    const lowerQuery = query.toLowerCase();

    return allRecipes.filter(
      recipe =>
        recipe.title.toLowerCase().includes(lowerQuery) ||
        recipe.description.toLowerCase().includes(lowerQuery) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        recipe.cuisine.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Filter recipes by category
   */
  filterByCategory(category) {
    const allRecipes = this.getAllRecipes();
    return allRecipes.filter(r => r.category === category);
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    if (window.currentUser) {
      return window.currentUser;
    }

    const userJson = localStorage.getItem('current_user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /**
   * Sync all recipes to library (one-time migration)
   */
  syncAllRecipesToLibrary() {
    console.log('🔄 Syncing all recipes to library...');

    try {
      let syncCount = 0;

      // Get recipes from all sources
      const sources = [
        { key: this.storageKeys.recipes, name: 'recipes' },
        {
          key: this.storageKeys.recipesInProgress,
          name: 'recipes_in_progress'
        },
        { key: this.storageKeys.recipeIdeas, name: 'recipe_ideas' }
      ];

      sources.forEach(({ key, name }) => {
        const recipes = JSON.parse(localStorage.getItem(key) || '[]');
        console.log(`📦 Found ${recipes.length} recipes in ${name}`);

        recipes.forEach(recipe => {
          if (this.addToLibrary(recipe, name)) {
            syncCount++;
          }
        });
      });

      console.log(`✅ Synced ${syncCount} recipes to library`);
      alert(`✅ Successfully synced ${syncCount} recipes to the library!`);

      return syncCount;
    } catch (error) {
      console.error('❌ Error syncing recipes:', error);
      alert('Error syncing recipes. Check console for details.');
      return 0;
    }
  }

  /**
   * Get library statistics
   */
  getStatistics() {
    const library = this.getRecipeLibrary();

    const stats = {
      total: library.length,
      byCategory: {},
      bySource: {},
      byStatus: {},
      byUser: {}
    };

    library.forEach(recipe => {
      // By category
      stats.byCategory[recipe.category] =
        (stats.byCategory[recipe.category] || 0) + 1;

      // By source
      stats.bySource[recipe.source] = (stats.bySource[recipe.source] || 0) + 1;

      // By status
      stats.byStatus[recipe.status] = (stats.byStatus[recipe.status] || 0) + 1;

      // By user
      stats.byUser[recipe.userName] = (stats.byUser[recipe.userName] || 0) + 1;
    });

    return stats;
  }
}

// Create global instance
console.log('📚 Creating Universal Recipe Manager instance...');
window.universalRecipeManager = new UniversalRecipeManager();

// Global helper function to save recipe from anywhere
window.saveRecipeToLibrary = function (recipe, source = 'manual') {
  if (window.universalRecipeManager) {
    return window.universalRecipeManager.addToLibrary(recipe, source);
  } else {
    console.error('❌ Universal Recipe Manager not available');
    return false;
  }
};

// Global helper function to get all recipes
window.getAllRecipesFromLibrary = function () {
  if (window.universalRecipeManager) {
    return window.universalRecipeManager.getAllRecipes();
  } else {
    console.error('❌ Universal Recipe Manager not available');
    return [];
  }
};

// Global sync function
window.syncAllRecipesToLibrary = function () {
  if (window.universalRecipeManager) {
    return window.universalRecipeManager.syncAllRecipesToLibrary();
  } else {
    console.error('❌ Universal Recipe Manager not available');
    return 0;
  }
};

console.log('✅ Universal Recipe Manager ready');
