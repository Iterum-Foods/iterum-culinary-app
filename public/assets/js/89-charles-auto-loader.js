
// Auto-load 89 Charles data for chefmcpherson@gmail.com
(function() {
  window.addEventListener('userAuthenticated', async function(event) {
    const user = event.detail;
    
    // Only load for Chef McPherson
    if (user.email === 'chefmcpherson@gmail.com') {
      console.log('👨‍🍳 Loading 89 Charles menu for Chef McPherson...');
      
      try {
        // Load menu
        const menuResponse = await fetch('89-charles-fall-menu.json');
        const menu = await menuResponse.json();
        
        // Save to user's menus
        const menuKey = `menus_${user.userId}`;
        let userMenus = JSON.parse(localStorage.getItem(menuKey) || '[]');
        
        // Check if already loaded
        if (!userMenus.find(m => m.id === menu.id)) {
          userMenus.push(menu);
          localStorage.setItem(menuKey, JSON.stringify(userMenus));
          console.log('✅ 89 Charles menu loaded');
        }
        
        // Load recipes
        const recipesResponse = await fetch('89-charles-recipes.json');
        const recipes = await recipesResponse.json();
        
        // Save to user's recipes
        recipes.forEach(recipe => {
          if (window.universalRecipeManager) {
            window.universalRecipeManager.addToLibrary(recipe);
          }
        });
        
        console.log(`✅ Loaded ${recipes.length} 89 Charles recipes`);
        
        // Show notification
        if (window.showNotification) {
          window.showNotification(
            '🍽️ 89 Charles Menu Loaded',
            `${menu.items.length} dishes and ${recipes.length} recipes available`,
            'success'
          );
        }
        
      } catch (error) {
        console.error('Error loading 89 Charles data:', error);
      }
    }
  });
})();
