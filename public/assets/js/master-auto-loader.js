/**
 * Master Auto-Loader
 * Automatically loads all user data on ANY page load
 * - Ingredients (145 total)
 * - Recipes (for chefmcpherson@gmail.com: 89 Charles recipes)
 * - Menus (for chefmcpherson@gmail.com: 89 Charles menu)
 * No manual action required!
 */

class MasterAutoLoader {
  constructor() {
    this.loaded = {
      ingredients: false,
      recipes: false,
      menus: false
    };
  }

  /**
   * Auto-load everything for current user
   */
  async autoLoadAll() {
    console.log('🚀 Master Auto-Loader starting...');
    
    const user = window.authManager?.currentUser;
    
    if (!user) {
      console.log('⏳ Waiting for user authentication...');
      return;
    }
    
    console.log(`👤 Loading data for: ${user.email}`);
    
    // Load in parallel for speed
    await Promise.all([
      this.autoLoadIngredients(),
      this.autoLoadRecipes(user),
      this.autoLoadMenus(user)
    ]);
    
    console.log('✅ Master Auto-Loader complete!');
    this.showCompletionNotification();
  }

  /**
   * Auto-load ingredients (for ALL users)
   */
  async autoLoadIngredients() {
    try {
      // Check if already loaded
      const existing = localStorage.getItem('ingredients_database');
      if (existing && JSON.parse(existing).length >= 100) {
        console.log('✅ Ingredients already loaded');
        this.loaded.ingredients = true;
        return;
      }
      
      console.log('📦 Loading ingredients database...');
      
      const response = await fetch('data/base-ingredients-database.json');
      if (!response.ok) {
        throw new Error('Database not found');
      }
      
      const database = await response.json();
      
      // Save to localStorage
      localStorage.setItem('ingredients_database', JSON.stringify(database.ingredients));
      localStorage.setItem('ingredients', JSON.stringify(database.ingredients));
      
      console.log(`✅ Loaded ${database.ingredients.length} ingredients`);
      this.loaded.ingredients = true;
      
    } catch (error) {
      console.error('❌ Error loading ingredients:', error);
    }
  }

  /**
   * Auto-load recipes (for chefmcpherson@gmail.com only)
   */
  async autoLoadRecipes(user) {
    if (user.email !== 'chefmcpherson@gmail.com') {
      console.log('ℹ️ Recipe auto-load only for Chef McPherson');
      this.loaded.recipes = true;
      return;
    }
    
    try {
      console.log('📚 Loading 89 Charles recipes...');
      
      const response = await fetch('89-charles-recipes.json');
      if (!response.ok) {
        throw new Error('Recipes file not found');
      }
      
      const recipes = await response.json();
      console.log(`📦 Found ${recipes.length} recipes`);
      
      // Add to universal recipe manager
      if (window.universalRecipeManager) {
        recipes.forEach(recipe => {
          window.universalRecipeManager.addToLibrary(recipe);
        });
        console.log(`✅ Loaded ${recipes.length} recipes into library`);
      } else {
        // Fallback to direct localStorage
        const userId = user.userId || user.id;
        const recipeKey = `recipes_${userId}`;
        let userRecipes = JSON.parse(localStorage.getItem(recipeKey) || '[]');
        
        recipes.forEach(recipe => {
          if (!userRecipes.find(r => r.id === recipe.id)) {
            userRecipes.push(recipe);
          }
        });
        
        localStorage.setItem(recipeKey, JSON.stringify(userRecipes));
        console.log(`✅ Loaded ${recipes.length} recipes to storage`);
      }
      
      this.loaded.recipes = true;
      
    } catch (error) {
      console.error('❌ Error loading recipes:', error);
    }
  }

  /**
   * Auto-load menus (for chefmcpherson@gmail.com only)
   */
  async autoLoadMenus(user) {
    if (user.email !== 'chefmcpherson@gmail.com') {
      console.log('ℹ️ Menu auto-load only for Chef McPherson');
      this.loaded.menus = true;
      return;
    }
    
    try {
      console.log('🍽️ Loading 89 Charles menu...');
      
      const response = await fetch('89-charles-fall-menu.json');
      if (!response.ok) {
        throw new Error('Menu file not found');
      }
      
      const menu = await response.json();
      console.log(`📦 Found menu with ${menu.items?.length} dishes`);
      
      // Save to user's menus
      const userId = user.userId || user.id;
      const menuKey = `menus_${userId}`;
      let userMenus = JSON.parse(localStorage.getItem(menuKey) || '[]');
      
      // Avoid duplicates
      if (!userMenus.find(m => m.id === menu.id)) {
        userMenus.push(menu);
        localStorage.setItem(menuKey, JSON.stringify(userMenus));
        console.log(`✅ Loaded menu with ${menu.items?.length} dishes`);
      } else {
        console.log('ℹ️ Menu already loaded');
      }
      
      this.loaded.menus = true;
      
    } catch (error) {
      console.error('❌ Error loading menu:', error);
    }
  }

  /**
   * Show completion notification
   */
  showCompletionNotification() {
    const loaded = Object.values(this.loaded).filter(v => v).length;
    const total = Object.keys(this.loaded).length;
    
    console.log(`\n📊 Auto-Load Summary:`);
    console.log(`   ✅ Ingredients: ${this.loaded.ingredients ? 'Loaded' : 'Failed'}`);
    console.log(`   ✅ Recipes: ${this.loaded.recipes ? 'Loaded' : 'Failed'}`);
    console.log(`   ✅ Menus: ${this.loaded.menus ? 'Loaded' : 'Failed'}`);
    console.log(`   📈 Success: ${loaded}/${total}\n`);
    
    // Dispatch event so pages can refresh their displays
    window.dispatchEvent(new CustomEvent('masterDataLoaded', {
      detail: {
        loaded: this.loaded,
        successRate: loaded / total
      }
    }));
  }
}

// Initialize global instance
window.masterAutoLoader = new MasterAutoLoader();

// Run when user authenticates
window.addEventListener('userAuthenticated', async function(event) {
  console.log('🔐 User authenticated, running Master Auto-Loader...');
  
  // Wait a moment for all dependencies to load
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await window.masterAutoLoader.autoLoadAll();
});

// Also run on page load if user already authenticated
window.addEventListener('load', async function() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (window.authManager?.isAuthenticated) {
    console.log('👤 User already authenticated, running Master Auto-Loader...');
    await window.masterAutoLoader.autoLoadAll();
  }
});

console.log('🚀 Master Auto-Loader ready');

