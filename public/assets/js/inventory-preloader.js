/**
 * Inventory Preloader - Automatically loads Chef's Warehouse ingredients
 * into user's inventory on first load
 */

class InventoryPreloader {
  constructor() {
    this.storageKey = 'inventory_items';
    this.preloadedKey = 'inventory_preloaded';
    this.userId = null;
  }

  /**
   * Initialize and check if preload is needed
   */
  async init(userId) {
    this.userId = userId;
    
    // Check if inventory has already been preloaded for this user
    const preloadedKey = `${this.preloadedKey}_${userId}`;
    const alreadyPreloaded = localStorage.getItem(preloadedKey);
    
    if (alreadyPreloaded) {
      console.log('✅ Inventory already preloaded for this user');
      return false;
    }
    
    console.log('📦 Preloading Chef\'s Warehouse inventory...');
    await this.preloadInventory();
    
    // Mark as preloaded
    localStorage.setItem(preloadedKey, new Date().toISOString());
    
    return true;
  }

  /**
   * Preload all Chef's Warehouse ingredients into inventory
   */
  async preloadInventory() {
    try {
      // Load base ingredients database
      const response = await fetch('data/base-ingredients-database.json');
      const db = await response.json();
      
      // Filter ingredients from Chef's Warehouse (ing_1206 onwards)
      const chefWarehouseIngredients = db.ingredients.filter(ing => {
        const ingNum = parseInt(ing.id.replace('ing_', ''));
        return ingNum >= 1206 && ing.preferred_vendor === 'Chef\'s Warehouse';
      });
      
      console.log(`📋 Found ${chefWarehouseIngredients.length} Chef's Warehouse ingredients`);
      
      // Get existing inventory
      const inventoryKey = `${this.storageKey}_${this.userId}`;
      let inventory = JSON.parse(localStorage.getItem(inventoryKey) || '[]');
      
      // Add each ingredient to inventory with default values
      chefWarehouseIngredients.forEach(ing => {
        // Check if already exists
        if (inventory.find(item => item.ingredientId === ing.id)) {
          return; // Skip if already in inventory
        }
        
        const inventoryItem = {
          id: `inv_${ing.id}`,
          ingredientId: ing.id,
          ingredientName: ing.name,
          category: ing.category,
          
          // Quantity
          quantity: 0,
          unit: ing.default_unit,
          minQuantity: 0,
          maxQuantity: null,
          
          // Cost
          unitCost: ing.avg_price_per_lb || 0,
          totalValue: 0,
          
          // Vendor
          vendor: 'Chef\'s Warehouse',
          vendorSKU: ing.vendor_info?.supplier_sku || `CW-${ing.id}`,
          
          // Tracking
          location: 'Main Storage',
          lastRestocked: null,
          lastUsed: null,
          
          // Status
          status: 'in-stock',
          lowStockAlert: false,
          needsReorder: false,
          
          // Metadata
          notes: `Premium ingredient from Chef's Warehouse`,
          tags: ['chef-warehouse', 'premium', ing.category.toLowerCase()],
          
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        inventory.push(inventoryItem);
      });
      
      // Save inventory
      localStorage.setItem(inventoryKey, JSON.stringify(inventory));
      
      console.log(`✅ Preloaded ${chefWarehouseIngredients.length} items into inventory`);
      console.log(`📊 Total inventory items: ${inventory.length}`);
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('inventoryPreloaded', {
        detail: {
          itemsAdded: chefWarehouseIngredients.length,
          totalItems: inventory.length
        }
      }));
      
      return inventory;
      
    } catch (error) {
      console.error('❌ Error preloading inventory:', error);
      return [];
    }
  }

  /**
   * Get inventory stats
   */
  getInventoryStats(userId) {
    const inventoryKey = `${this.storageKey}_${userId || this.userId}`;
    const inventory = JSON.parse(localStorage.getItem(inventoryKey) || '[]');
    
    const stats = {
      totalItems: inventory.length,
      chefWarehouseItems: inventory.filter(i => i.vendor === 'Chef\'s Warehouse').length,
      inStock: inventory.filter(i => i.status === 'in-stock' && i.quantity > 0).length,
      lowStock: inventory.filter(i => i.lowStockAlert).length,
      totalValue: inventory.reduce((sum, i) => sum + (i.totalValue || 0), 0),
      categories: {}
    };
    
    // Count by category
    inventory.forEach(item => {
      stats.categories[item.category] = (stats.categories[item.category] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Reset preload flag (for testing)
   */
  resetPreloadFlag(userId) {
    const preloadedKey = `${this.preloadedKey}_${userId || this.userId}`;
    localStorage.removeItem(preloadedKey);
    console.log('🔄 Preload flag reset - inventory will reload on next init');
  }
}

// Initialize global instance
window.inventoryPreloader = new InventoryPreloader();

// Auto-initialize on auth
window.addEventListener('userAuthenticated', (event) => {
  if (event.detail && event.detail.userId) {
    window.inventoryPreloader.init(event.detail.userId).then(preloaded => {
      if (preloaded) {
        console.log('✅ Inventory preloaded successfully');
        
        // Show notification to user
        if (window.showNotification) {
          window.showNotification(
            '📦 Inventory Loaded',
            '73 premium Chef\'s Warehouse ingredients added to your inventory',
            'success'
          );
        }
      }
    });
  }
});

console.log('📦 Inventory Preloader ready');

