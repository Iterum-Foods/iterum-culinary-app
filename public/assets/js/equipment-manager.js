/**
 * Equipment Manager
 * Comprehensive equipment management with inventory, categories, and recipe linking
 */

class EquipmentManager {
    constructor() {
        this.equipment = [];
        this.categories = this.getCategories();
        this.wishlist = [];
        this.initialized = false;
        this.init();
    }

    /**
     * Initialize equipment manager
     */
    init() {
        console.log('🔧 Initializing Equipment Manager...');
        
        this.loadEquipment();
        this.loadWishlist();
        this.initialized = true;
        
        console.log('✅ Equipment Manager initialized');
        window.dispatchEvent(new CustomEvent('equipmentManagerReady'));
    }

    /**
     * Get equipment categories
     */
    getCategories() {
        return [
            {
                id: 'prep',
                name: 'Preparation Equipment',
                icon: '🔪',
                subcategories: ['Knives', 'Cutting Boards', 'Mixing Bowls', 'Graters', 'Peelers']
            },
            {
                id: 'cooking',
                name: 'Cooking Equipment',
                icon: '🔥',
                subcategories: ['Ranges', 'Ovens', 'Grills', 'Fryers', 'Griddles', 'Steamers']
            },
            {
                id: 'refrigeration',
                name: 'Refrigeration',
                icon: '❄️',
                subcategories: ['Walk-in Coolers', 'Reach-in Refrigerators', 'Freezers', 'Ice Machines']
            },
            {
                id: 'storage',
                name: 'Storage & Shelving',
                icon: '📦',
                subcategories: ['Shelving Units', 'Storage Containers', 'Dry Storage', 'Mobile Racks']
            },
            {
                id: 'smallwares',
                name: 'Smallwares',
                icon: '🥄',
                subcategories: ['Pots & Pans', 'Utensils', 'Measuring Tools', 'Thermometers']
            },
            {
                id: 'beverage',
                name: 'Beverage Equipment',
                icon: '🥤',
                subcategories: ['Coffee Makers', 'Blenders', 'Juicers', 'Ice Dispensers']
            },
            {
                id: 'cleaning',
                name: 'Cleaning & Sanitation',
                icon: '🧽',
                subcategories: ['Dishwashers', 'Sinks', 'Sanitizing Stations', 'Cleaning Supplies']
            },
            {
                id: 'safety',
                name: 'Safety Equipment',
                icon: '🛡️',
                subcategories: ['Fire Extinguishers', 'First Aid', 'Safety Gear', 'Ventilation']
            },
            {
                id: 'plates',
                name: 'Plates & Dishes',
                icon: '🍽️',
                subcategories: [
                    'Dinner Plates (10-12")',
                    'Salad Plates (7-9")',
                    'Appetizer Plates (6-7")',
                    'Bowls - Soup/Pasta',
                    'Bowls - Salad',
                    'Bowls - Dessert',
                    'Ramekins',
                    'Serving Platters',
                    'Serving Bowls'
                ]
            },
            {
                id: 'silverware',
                name: 'Silverware & Flatware',
                icon: '🍴',
                subcategories: [
                    'Dinner Forks',
                    'Salad Forks',
                    'Dessert Forks',
                    'Dinner Knives',
                    'Steak Knives',
                    'Butter Knives',
                    'Tablespoons',
                    'Teaspoons',
                    'Dessert Spoons',
                    'Serving Spoons',
                    'Serving Forks',
                    'Ladles'
                ]
            },
            {
                id: 'glassware',
                name: 'Glassware & Barware',
                icon: '🥃',
                subcategories: [
                    'Water Glasses',
                    'Wine Glasses - Red',
                    'Wine Glasses - White',
                    'Champagne Flutes',
                    'Rocks Glasses (Old Fashioned)',
                    'Highball Glasses',
                    'Martini Glasses',
                    'Coupe Glasses',
                    'Shot Glasses',
                    'Beer Glasses',
                    'Cocktail Glasses',
                    'Specialty Glassware'
                ]
            },
            {
                id: 'serving',
                name: 'Serving Equipment',
                icon: '🍲',
                subcategories: ['Chafing Dishes', 'Display Cases', 'Serving Trays', 'Cake Stands']
            },
            {
                id: 'specialty',
                name: 'Specialty Equipment',
                icon: '⭐',
                subcategories: ['Sous Vide', 'Dehydrators', 'Smokers', 'Pasta Makers']
            }
        ];
    }

    /**
     * Get serving ware categories for filtering
     */
    getServingWareCategories() {
        return ['plates', 'silverware', 'glassware'];
    }

    /**
     * Check if category is serving ware
     */
    isServingWare(categoryId) {
        return this.getServingWareCategories().includes(categoryId);
    }

    /**
     * Get serving ware inventory summary
     */
    getServingWareInventory() {
        const servingWare = this.equipment.filter(item => 
            this.isServingWare(item.category)
        );

        const inventory = {
            plates: [],
            silverware: [],
            glassware: []
        };

        servingWare.forEach(item => {
            if (inventory[item.category]) {
                inventory[item.category].push({
                    id: item.id,
                    name: item.name,
                    subcategory: item.subcategory,
                    quantity: item.quantity || 0,
                    condition: item.condition || 'Good',
                    lastCounted: item.lastCounted || null,
                    linkedRecipes: item.linkedRecipes || []
                });
            }
        });

        return inventory;
    }

    /**
     * Link serving ware to recipe
     */
    linkServingWareToRecipe(equipmentId, recipeId, recipeName) {
        const item = this.equipment.find(e => e.id === equipmentId);
        if (!item) {
            console.error('Equipment not found:', equipmentId);
            return false;
        }

        if (!item.linkedRecipes) {
            item.linkedRecipes = [];
        }

        // Check if already linked
        const existingLink = item.linkedRecipes.find(r => r.recipeId === recipeId);
        if (existingLink) {
            console.log('Already linked to recipe');
            return true;
        }

        item.linkedRecipes.push({
            recipeId,
            recipeName,
            linkedAt: new Date().toISOString()
        });

        this.saveEquipment();
        console.log(`✅ Linked ${item.name} to recipe: ${recipeName}`);
        return true;
    }

    /**
     * Unlink serving ware from recipe
     */
    unlinkServingWareFromRecipe(equipmentId, recipeId) {
        const item = this.equipment.find(e => e.id === equipmentId);
        if (!item || !item.linkedRecipes) {
            return false;
        }

        item.linkedRecipes = item.linkedRecipes.filter(r => r.recipeId !== recipeId);
        this.saveEquipment();
        console.log(`✅ Unlinked from recipe`);
        return true;
    }

    /**
     * Get serving ware for recipe
     */
    getServingWareForRecipe(recipeId) {
        return this.equipment.filter(item => 
            this.isServingWare(item.category) &&
            item.linkedRecipes &&
            item.linkedRecipes.some(r => r.recipeId === recipeId)
        );
    }

    /**
     * Update serving ware quantity (for inventory counts)
     */
    updateServingWareQuantity(equipmentId, quantity, countedBy) {
        const item = this.equipment.find(e => e.id === equipmentId);
        if (!item) {
            return false;
        }

        item.quantity = quantity;
        item.lastCounted = new Date().toISOString();
        item.countedBy = countedBy || 'Unknown';

        this.saveEquipment();
        return true;
    }

    /**
     * Load equipment from storage
     */
    loadEquipment() {
        const currentUser = this.getCurrentUser();
        const userId = currentUser?.userId || currentUser?.id || 'guest';
        
        // Load from user-specific storage
        const userKey = `equipment_${userId}`;
        const userEquipment = JSON.parse(localStorage.getItem(userKey) || '[]');
        
        // Load from general storage
        const generalEquipment = JSON.parse(localStorage.getItem('equipment_list') || '[]');
        
        // Merge and deduplicate
        const allEquipment = [...userEquipment, ...generalEquipment];
        this.equipment = allEquipment.filter((item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
        );
        
        console.log(`✅ Loaded ${this.equipment.length} equipment items`);
    }

    /**
     * Load wishlist
     */
    loadWishlist() {
        const currentUser = this.getCurrentUser();
        const userId = currentUser?.userId || currentUser?.id || 'guest';
        
        const wishlistKey = `equipment_wishlist_${userId}`;
        this.wishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
        
        console.log(`✅ Loaded ${this.wishlist.length} wishlist items`);
    }

    /**
     * Add equipment
     */
    addEquipment(equipmentData, options = {}) {
        const currentUser = this.getCurrentUser();
        const userId = currentUser?.userId || currentUser?.id || 'guest';
        
        const equipment = {
            id: equipmentData.id || ('equip_' + Date.now()),
            name: equipmentData.name,
            category: equipmentData.category,
            subcategory: equipmentData.subcategory || '',
            brand: equipmentData.brand || '',
            model: equipmentData.model || '',
            serialNumber: equipmentData.serialNumber || '',
            purchaseDate: equipmentData.purchaseDate || '',
            purchasePrice: parseFloat(equipmentData.purchasePrice) || 0,
            purchaseUrl: equipmentData.purchaseUrl || '',
            currentValue: parseFloat(equipmentData.currentValue) || parseFloat(equipmentData.purchasePrice) || 0,
            warranty: equipmentData.warranty || '',
            warrantyExpiry: equipmentData.warrantyExpiry || '',
            status: equipmentData.status || 'Active',
            location: equipmentData.location || '',
            quantity: parseInt(equipmentData.quantity) || 1,
            inStock: parseInt(equipmentData.inStock || equipmentData.quantity) || 1,
            condition: equipmentData.condition || 'Good',
            lastMaintenance: equipmentData.lastMaintenance || '',
            nextMaintenance: equipmentData.nextMaintenance || '',
            maintenanceSchedule: equipmentData.maintenanceSchedule || '',
            maintenanceNotes: equipmentData.maintenanceNotes || '',
            description: equipmentData.description || '',
            specifications: equipmentData.specifications || {},
            vendor: equipmentData.vendor || '',
            vendorContact: equipmentData.vendorContact || '',
            notes: equipmentData.notes || '',
            images: equipmentData.images || [],
            manualUrl: equipmentData.manualUrl || '',
            createdAt: equipmentData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: userId,
            createdVia: equipmentData.createdVia || 'manual',
            importBatchId: equipmentData.importBatchId || null
        };

        if (!options.skipDuplicateCheck) {
            const duplicate = this.equipment.find(item => item.name.toLowerCase() === equipment.name.toLowerCase());
            if (duplicate) {
                console.log('⚠️ Duplicate equipment skipped:', equipment.name);
                return false;
            }
        }
        
        this.equipment.push(equipment);
        this.saveEquipment();
        
        console.log('✅ Equipment added:', equipment.name);
        return equipment;
    }

    /**
     * Update equipment
     */
    updateEquipment(id, updates) {
        const index = this.equipment.findIndex(e => e.id === id);
        
        if (index !== -1) {
            this.equipment[index] = {
                ...this.equipment[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            this.saveEquipment();
            console.log('✅ Equipment updated:', id);
            return this.equipment[index];
        }
        
        return null;
    }

    /**
     * Delete equipment
     */
    deleteEquipment(id) {
        this.equipment = this.equipment.filter(e => e.id !== id);
        this.saveEquipment();
        console.log('🗑️ Equipment deleted:', id);
    }

    /**
     * Save equipment to storage
     */
    saveEquipment() {
        const currentUser = this.getCurrentUser();
        const userId = currentUser?.userId || currentUser?.id || 'guest';
        
        const userKey = `equipment_${userId}`;
        localStorage.setItem(userKey, JSON.stringify(this.equipment));
        localStorage.setItem('equipment_list', JSON.stringify(this.equipment));
        
        console.log(`💾 Saved ${this.equipment.length} equipment items`);
    }

    /**
     * Get equipment by ID
     */
    getById(id) {
        return this.equipment.find(e => e.id === id);
    }

    /**
     * Get equipment by category
     */
    getByCategory(category) {
        return this.equipment.filter(e => e.category === category);
    }

    /**
     * Get equipment needed for recipe
     */
    getEquipmentForRecipe(recipeId) {
        const recipe = this.getRecipeById(recipeId);
        if (!recipe || !recipe.equipmentNeeded) return [];
        
        return recipe.equipmentNeeded.map(equipId => this.getById(equipId)).filter(Boolean);
    }

    /**
     * Add to wishlist
     */
    addToWishlist(wishlistItem) {
        const item = {
            id: 'wish_' + Date.now(),
            name: wishlistItem.name,
            category: wishlistItem.category,
            subcategory: wishlistItem.subcategory || '',
            estimatedCost: parseFloat(wishlistItem.estimatedCost) || 0,
            priority: wishlistItem.priority || 'Medium',
            reason: wishlistItem.reason || '',
            targetDate: wishlistItem.targetDate || '',
            vendor: wishlistItem.vendor || '',
            url: wishlistItem.url || '',
            notes: wishlistItem.notes || '',
            status: 'Wishlist',
            addedAt: new Date().toISOString(),
            userId: this.getCurrentUser()?.userId || 'guest'
        };
        
        this.wishlist.push(item);
        this.saveWishlist();
        
        console.log('✅ Added to wishlist:', item.name);
        return item;
    }

    /**
     * Convert wishlist item to equipment
     */
    convertWishlistToEquipment(wishlistId) {
        const wishlistItem = this.wishlist.find(w => w.id === wishlistId);
        
        if (!wishlistItem) {
            console.error('Wishlist item not found:', wishlistId);
            return null;
        }
        
        // Create equipment from wishlist
        const equipment = this.addEquipment({
            name: wishlistItem.name,
            category: wishlistItem.category,
            subcategory: wishlistItem.subcategory,
            purchasePrice: wishlistItem.estimatedCost,
            vendor: wishlistItem.vendor,
            notes: `Converted from wishlist: ${wishlistItem.reason || ''}`,
            status: 'Active'
        });
        
        // Remove from wishlist
        this.wishlist = this.wishlist.filter(w => w.id !== wishlistId);
        this.saveWishlist();
        
        console.log('✅ Converted wishlist to equipment:', equipment.name);
        return equipment;
    }

    /**
     * Save wishlist
     */
    saveWishlist() {
        const currentUser = this.getCurrentUser();
        const userId = currentUser?.userId || currentUser?.id || 'guest';
        
        const wishlistKey = `equipment_wishlist_${userId}`;
        localStorage.setItem(wishlistKey, JSON.stringify(this.wishlist));
        
        console.log(`💾 Saved ${this.wishlist.length} wishlist items`);
    }

    /**
     * Update inventory (check in/check out)
     */
    updateInventory(equipmentId, change, reason = '') {
        const equipment = this.getById(equipmentId);
        
        if (!equipment) {
            console.error('Equipment not found:', equipmentId);
            return false;
        }
        
        // Update in-stock quantity
        equipment.inStock = (equipment.inStock || equipment.quantity) + change;
        
        // Ensure not negative
        if (equipment.inStock < 0) equipment.inStock = 0;
        
        // Log transaction
        const transaction = {
            id: 'trans_' + Date.now(),
            equipmentId: equipmentId,
            equipmentName: equipment.name,
            change: change,
            reason: reason,
            timestamp: new Date().toISOString(),
            userId: this.getCurrentUser()?.userId || 'guest'
        };
        
        this.logInventoryTransaction(transaction);
        this.updateEquipment(equipmentId, { inStock: equipment.inStock });
        
        console.log(`📦 Inventory updated: ${equipment.name} (${equipment.inStock}/${equipment.quantity})`);
        return true;
    }

    /**
     * Log inventory transaction
     */
    logInventoryTransaction(transaction) {
        const currentUser = this.getCurrentUser();
        const userId = currentUser?.userId || currentUser?.id || 'guest';
        
        const transKey = `equipment_transactions_${userId}`;
        let transactions = JSON.parse(localStorage.getItem(transKey) || '[]');
        
        transactions.push(transaction);
        
        // Keep last 1000 transactions
        if (transactions.length > 1000) {
            transactions = transactions.slice(-1000);
        }
        
        localStorage.setItem(transKey, JSON.stringify(transactions));
    }

    /**
     * Get inventory transactions
     */
    getTransactions(equipmentId = null, limit = 100) {
        const currentUser = this.getCurrentUser();
        const userId = currentUser?.userId || currentUser?.id || 'guest';
        
        const transKey = `equipment_transactions_${userId}`;
        let transactions = JSON.parse(localStorage.getItem(transKey) || '[]');
        
        if (equipmentId) {
            transactions = transactions.filter(t => t.equipmentId === equipmentId);
        }
        
        // Return most recent first
        return transactions.reverse().slice(0, limit);
    }

    /**
     * Get equipment statistics
     */
    getStatistics() {
        const stats = {
            total: this.equipment.length,
            byCategory: {},
            byStatus: {},
            totalValue: 0,
            inMaintenance: 0,
            needingRepair: 0,
            wishlistTotal: this.wishlist.length,
            lowStock: []
        };
        
        this.equipment.forEach(equip => {
            // By category
            stats.byCategory[equip.category] = (stats.byCategory[equip.category] || 0) + 1;
            
            // By status
            stats.byStatus[equip.status] = (stats.byStatus[equip.status] || 0) + 1;
            
            // Total value
            stats.totalValue += (equip.currentValue || equip.purchasePrice || 0);
            
            // Maintenance & repair
            if (equip.status === 'Maintenance') stats.inMaintenance++;
            if (equip.status === 'Repair') stats.needingRepair++;
            
            // Low stock (less than 25% of original quantity)
            if (equip.inStock < (equip.quantity * 0.25)) {
                stats.lowStock.push({
                    id: equip.id,
                    name: equip.name,
                    inStock: equip.inStock,
                    total: equip.quantity
                });
            }
        });
        
        return stats;
    }

    /**
     * Link equipment to recipe
     */
    linkEquipmentToRecipe(recipeId, equipmentIds) {
        // Get recipe from universal recipe manager
        if (!window.universalRecipeManager) {
            console.error('Universal Recipe Manager not available');
            return false;
        }
        
        const recipe = window.universalRecipeManager.getRecipeById(recipeId);
        
        if (!recipe) {
            console.error('Recipe not found:', recipeId);
            return false;
        }
        
        // Update recipe with equipment
        recipe.equipmentNeeded = equipmentIds;
        recipe.equipmentDetails = equipmentIds.map(id => {
            const equip = this.getById(id);
            return equip ? {
                id: equip.id,
                name: equip.name,
                category: equip.category
            } : null;
        }).filter(Boolean);
        
        // Save recipe
        window.universalRecipeManager.addToLibrary(recipe, 'equipment-linked');
        
        console.log(`🔗 Linked ${equipmentIds.length} equipment items to recipe:`, recipe.title);
        return true;
    }

    /**
     * Get equipment needed for recipe
     */
    getRecipeEquipment(recipeId) {
        const recipe = window.universalRecipeManager?.getRecipeById(recipeId);
        
        if (!recipe || !recipe.equipmentNeeded) return [];
        
        return recipe.equipmentNeeded.map(id => this.getById(id)).filter(Boolean);
    }

    /**
     * Get recipes that use this equipment
     */
    getRecipesUsingEquipment(equipmentId) {
        if (!window.universalRecipeManager) return [];
        
        const allRecipes = window.universalRecipeManager.getAllRecipes();
        
        return allRecipes.filter(recipe => 
            recipe.equipmentNeeded && recipe.equipmentNeeded.includes(equipmentId)
        );
    }

    /**
     * Check equipment availability
     */
    checkAvailability(equipmentId, quantityNeeded = 1) {
        const equipment = this.getById(equipmentId);
        
        if (!equipment) return { available: false, reason: 'Equipment not found' };
        
        if (equipment.status !== 'Active') {
            return { available: false, reason: `Equipment status: ${equipment.status}` };
        }
        
        if (equipment.inStock < quantityNeeded) {
            return { 
                available: false, 
                reason: `Only ${equipment.inStock} available, need ${quantityNeeded}` 
            };
        }
        
        return { available: true, equipment: equipment };
    }

    /**
     * Reserve equipment (for production planning)
     */
    reserveEquipment(equipmentId, quantity, reservedFor = '') {
        const equipment = this.getById(equipmentId);
        
        if (!equipment) return false;
        
        // Initialize reservations if not exists
        if (!equipment.reservations) equipment.reservations = [];
        
        const reservation = {
            id: 'res_' + Date.now(),
            quantity: quantity,
            reservedFor: reservedFor,
            reservedAt: new Date().toISOString(),
            userId: this.getCurrentUser()?.userId || 'guest'
        };
        
        equipment.reservations.push(reservation);
        this.updateEquipment(equipmentId, equipment);
        
        console.log(`📋 Reserved ${quantity}x ${equipment.name} for ${reservedFor}`);
        return reservation;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        if (window.currentUser) return window.currentUser;
        
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
     * Get recipe by ID (helper)
     */
    getRecipeById(id) {
        if (window.universalRecipeManager) {
            return window.universalRecipeManager.getRecipeById(id);
        }
        return null;
    }

    /**
     * Export equipment list
     */
    exportEquipmentList() {
        const data = {
            equipment: this.equipment,
            wishlist: this.wishlist,
            categories: this.categories,
            exportedAt: new Date().toISOString(),
            userId: this.getCurrentUser()?.userId || 'guest'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `equipment-list-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        console.log('📤 Equipment list exported');
    }

    /**
     * Import equipment list
     */
    async importEquipmentList(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.equipment && Array.isArray(data.equipment)) {
                this.equipment = [...this.equipment, ...data.equipment];
                this.saveEquipment();
            }
            
            if (data.wishlist && Array.isArray(data.wishlist)) {
                this.wishlist = [...this.wishlist, ...data.wishlist];
                this.saveWishlist();
            }
            
            console.log('📥 Equipment list imported');
            return true;
            
        } catch (error) {
            console.error('❌ Error importing equipment:', error);
            return false;
        }
    }
}

// Initialize global instance
window.equipmentManager = new EquipmentManager();

// Global helper functions
window.addEquipment = function(equipmentData) {
    return window.equipmentManager.addEquipment(equipmentData);
};

window.getEquipmentById = function(id) {
    return window.equipmentManager.getById(id);
};

window.linkEquipmentToRecipe = function(recipeId, equipmentIds) {
    return window.equipmentManager.linkEquipmentToRecipe(recipeId, equipmentIds);
};

console.log('🔧 Equipment Manager ready');

