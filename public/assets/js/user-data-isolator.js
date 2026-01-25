/**
 * User Data Isolator
 * Ensures that user-specific data (menus, recipes, ingredients) 
 * is isolated per user and not visible to others
 * 
 * Special handling for chefmcpherson@gmail.com and 89 Charles content
 */

class UserDataIsolator {
  constructor() {
    this.currentUserId = null;
    this.currentUserEmail = null;
    this.restrictedUsers = ['chefmcpherson@gmail.com'];
  }

  /**
   * Initialize with current user
   */
  init(userId, userEmail) {
    this.currentUserId = userId;
    this.currentUserEmail = userEmail;
    
    console.log(`🔒 Data Isolator initialized for ${userEmail}`);
  }

  /**
   * Check if current user has access to specific data
   */
  hasAccess(dataOwnerId, dataOwnerEmail) {
    // User always has access to their own data
    if (this.currentUserId === dataOwnerId) {
      return true;
    }
    
    if (this.currentUserEmail === dataOwnerEmail) {
      return true;
    }
    
    // No access to other users' data
    return false;
  }

  /**
   * Filter recipes to show only user's recipes
   */
  filterRecipes(allRecipes) {
    if (!allRecipes || !Array.isArray(allRecipes)) {
      return [];
    }

    return allRecipes.filter(recipe => {
      // Filter by userId
      if (recipe.userId === this.currentUserId) {
        return true;
      }
      
      // Filter by userEmail
      if (recipe.userEmail === this.currentUserEmail) {
        return true;
      }
      
      // If no user info, allow for backwards compatibility
      if (!recipe.userId && !recipe.userEmail) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Filter menus to show only user's menus
   */
  filterMenus(allMenus) {
    if (!allMenus || !Array.isArray(allMenus)) {
      return [];
    }

    return allMenus.filter(menu => {
      if (menu.userId === this.currentUserId) {
        return true;
      }
      
      if (menu.userEmail === this.currentUserEmail) {
        return true;
      }
      
      if (!menu.userId && !menu.userEmail) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Filter ingredients to show only user's custom ingredients
   */
  filterIngredients(allIngredients) {
    if (!allIngredients || !Array.isArray(allIngredients)) {
      return [];
    }

    return allIngredients.filter(ing => {
      // Base ingredients (no userId) are available to all
      if (!ing.userId && !ing.userEmail) {
        return true;
      }
      
      // User's custom ingredients
      if (ing.userId === this.currentUserId) {
        return true;
      }
      
      if (ing.userEmail === this.currentUserEmail) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Tag data with current user info
   */
  tagData(data) {
    return {
      ...data,
      userId: this.currentUserId,
      userEmail: this.currentUserEmail,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Save recipe with user isolation
   */
  saveRecipe(recipe) {
    const taggedRecipe = this.tagData(recipe);
    
    // Use universal recipe manager if available
    if (window.universalRecipeManager) {
      window.universalRecipeManager.addToLibrary(taggedRecipe);
    }
    
    // Also save to user-specific localStorage key
    const userKey = `recipes_${this.currentUserId}`;
    let userRecipes = JSON.parse(localStorage.getItem(userKey) || '[]');
    
    const existingIndex = userRecipes.findIndex(r => r.id === recipe.id);
    if (existingIndex !== -1) {
      userRecipes[existingIndex] = taggedRecipe;
    } else {
      userRecipes.push(taggedRecipe);
    }
    
    localStorage.setItem(userKey, JSON.stringify(userRecipes));
    
    console.log(`✅ Recipe saved for user ${this.currentUserEmail}`);
    
    return taggedRecipe;
  }

  /**
   * Save menu with user isolation
   */
  saveMenu(menu) {
    const taggedMenu = this.tagData(menu);
    
    // Save to user-specific key
    const userKey = `menus_${this.currentUserId}`;
    let userMenus = JSON.parse(localStorage.getItem(userKey) || '[]');
    
    const existingIndex = userMenus.findIndex(m => m.id === menu.id);
    if (existingIndex !== -1) {
      userMenus[existingIndex] = taggedMenu;
    } else {
      userMenus.push(taggedMenu);
    }
    
    localStorage.setItem(userKey, JSON.stringify(userMenus));
    
    console.log(`✅ Menu saved for user ${this.currentUserEmail}`);
    
    return taggedMenu;
  }

  /**
   * Load user's recipes
   */
  loadUserRecipes() {
    const userKey = `recipes_${this.currentUserId}`;
    const userRecipes = JSON.parse(localStorage.getItem(userKey) || '[]');
    
    // Also get from universal manager
    let allRecipes = [];
    if (window.universalRecipeManager) {
      allRecipes = window.universalRecipeManager.getAllRecipes();
    }
    
    // Combine and filter
    const combined = [...userRecipes, ...allRecipes];
    const filtered = this.filterRecipes(combined);
    
    // Remove duplicates by id
    const uniqueRecipes = [];
    const seenIds = new Set();
    
    filtered.forEach(recipe => {
      if (!seenIds.has(recipe.id)) {
        seenIds.add(recipe.id);
        uniqueRecipes.push(recipe);
      }
    });
    
    return uniqueRecipes;
  }

  /**
   * Load user's menus
   */
  loadUserMenus() {
    const userKey = `menus_${this.currentUserId}`;
    const userMenus = JSON.parse(localStorage.getItem(userKey) || '[]');
    
    return this.filterMenus(userMenus);
  }
}

// Initialize global instance
window.userDataIsolator = new UserDataIsolator();

// Auto-initialize when user authenticates
window.addEventListener('userAuthenticated', (event) => {
  if (event.detail && event.detail.userId) {
    window.userDataIsolator.init(
      event.detail.userId,
      event.detail.email || event.detail.userEmail
    );
  }
});

console.log('🔒 User Data Isolator loaded');

