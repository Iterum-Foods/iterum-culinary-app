/**
 * Menu Items Database
 * Centralized database for all menu items across all menus
 * Ensures menu items are properly structured and can be referenced from multiple menus
 * @version 1.0.0
 */

class MenuItemsDatabase {
    constructor() {
        this.storageKey = 'menu_items_database';
        this.items = this.loadFromStorage();
        console.log(`📋 Menu Items Database initialized with ${this.items.length} items`);
    }

    /**
     * Load all menu items from storage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('❌ Error loading menu items database:', error);
        }
        return [];
    }

    /**
     * Save all menu items to storage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
            console.log(`💾 Menu Items Database saved: ${this.items.length} items`);
            return true;
        } catch (error) {
            console.error('❌ Error saving menu items database:', error);
            return false;
        }
    }

    /**
     * Add or update a menu item in the database
     * @param {Object} menuItem - Menu item object with required fields
     * @returns {Object} The saved menu item with ID
     */
    saveMenuItem(menuItem) {
        if (!menuItem) {
            throw new Error('Menu item is required');
        }

        // Validate required fields
        if (!menuItem.name) {
            throw new Error('Menu item name is required');
        }

        if (!menuItem.recipeId) {
            throw new Error('Menu item must have a recipe (recipeId is required)');
        }

        // Create structured menu item
        const item = {
            id: menuItem.id || `menu_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: menuItem.name,
            description: menuItem.description || '',
            category: menuItem.category || 'Uncategorized',
            price: parseFloat(menuItem.price) || 0,
            targetFoodCost: parseFloat(menuItem.targetFoodCost) || 30,
            recipeId: menuItem.recipeId, // REQUIRED
            recipeName: menuItem.recipeName || null,
            recipeLinkStatus: menuItem.recipeLinkStatus || 'linked',
            allergens: Array.isArray(menuItem.allergens) ? menuItem.allergens : 
                      menuItem.allergens ? menuItem.allergens.split(',').map(a => a.trim()).filter(a => a) : [],
            dietaryInfo: Array.isArray(menuItem.dietaryInfo) ? menuItem.dietaryInfo :
                        menuItem.dietaryInfo ? menuItem.dietaryInfo.split(',').map(d => d.trim()).filter(d => d) : [],
            projectedCovers: menuItem.projectedCovers || 0,
            portionSize: menuItem.portionSize || '',
            prepStation: menuItem.prepStation || 'General',
            prepLeadTime: menuItem.prepLeadTime || 0,
            serviceNotes: menuItem.serviceNotes || '',
            spiceLevel: menuItem.spiceLevel || 'mild',
            isSignature: menuItem.isSignature || false,
            isNew: menuItem.isNew || false,
            isSeasonal: menuItem.isSeasonal || false,
            availability: menuItem.availability || {
                daysAvailable: ['all'],
                mealPeriods: ['dinner']
            },
            menuIds: menuItem.menuIds || [], // Track which menus this item belongs to
            projectId: menuItem.projectId || null,
            userId: menuItem.userId || null,
            createdAt: menuItem.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Check if item already exists
        const existingIndex = this.items.findIndex(i => i.id === item.id);
        
        if (existingIndex !== -1) {
            // Update existing item
            this.items[existingIndex] = {
                ...this.items[existingIndex],
                ...item,
                createdAt: this.items[existingIndex].createdAt, // Preserve original creation date
                updatedAt: new Date().toISOString()
            };
            console.log(`📝 Updated menu item in database: ${item.name}`);
        } else {
            // Add new item
            this.items.push(item);
            console.log(`➕ Added menu item to database: ${item.name}`);
        }

        this.saveToStorage();
        return item;
    }

    /**
     * Get menu item by ID
     */
    getMenuItem(itemId) {
        return this.items.find(item => item.id === itemId);
    }

    /**
     * Get all menu items
     */
    getAllItems() {
        return this.items;
    }

    /**
     * Get menu items by menu ID
     */
    getItemsByMenuId(menuId) {
        return this.items.filter(item => item.menuIds && item.menuIds.includes(menuId));
    }

    /**
     * Get menu items by recipe ID
     */
    getItemsByRecipeId(recipeId) {
        return this.items.filter(item => item.recipeId === recipeId);
    }

    /**
     * Search menu items
     */
    searchItems(query) {
        const lowerQuery = query.toLowerCase();
        return this.items.filter(item => 
            item.name.toLowerCase().includes(lowerQuery) ||
            item.description.toLowerCase().includes(lowerQuery) ||
            item.category.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Delete menu item
     */
    deleteMenuItem(itemId) {
        const index = this.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            const deleted = this.items.splice(index, 1)[0];
            this.saveToStorage();
            console.log(`🗑️ Deleted menu item from database: ${deleted.name}`);
            return deleted;
        }
        return null;
    }

    /**
     * Link menu item to a menu
     */
    linkToMenu(itemId, menuId) {
        const item = this.getMenuItem(itemId);
        if (item) {
            if (!item.menuIds) {
                item.menuIds = [];
            }
            if (!item.menuIds.includes(menuId)) {
                item.menuIds.push(menuId);
                item.updatedAt = new Date().toISOString();
                this.saveToStorage();
                console.log(`🔗 Linked menu item "${item.name}" to menu ${menuId}`);
            }
            return item;
        }
        return null;
    }

    /**
     * Unlink menu item from a menu
     */
    unlinkFromMenu(itemId, menuId) {
        const item = this.getMenuItem(itemId);
        if (item && item.menuIds) {
            item.menuIds = item.menuIds.filter(id => id !== menuId);
            item.updatedAt = new Date().toISOString();
            this.saveToStorage();
            console.log(`🔓 Unlinked menu item "${item.name}" from menu ${menuId}`);
            return item;
        }
        return null;
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            totalItems: this.items.length,
            withRecipes: this.items.filter(item => item.recipeId).length,
            withoutRecipes: this.items.filter(item => !item.recipeId).length,
            byCategory: this.items.reduce((acc, item) => {
                const cat = item.category || 'Uncategorized';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {})
        };
    }
}

// Initialize global instance
window.menuItemsDatabase = new MenuItemsDatabase();

console.log('📋 Menu Items Database System Loaded');

