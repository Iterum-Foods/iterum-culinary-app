// Script Loader Utility to prevent duplicate script loading
window.loadScriptOnce = function(src, callback) {
    // Check if script is already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
        if (callback) callback();
        return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    document.head.appendChild(script);
};

// Global script loading state
window.loadedScripts = window.loadedScripts || new Set();

// Enhanced script loader with state tracking
window.loadScriptIfNeeded = function(src, callback) {
    if (window.loadedScripts.has(src)) {
        if (callback) callback();
        return;
    }
    
    window.loadScriptOnce(src, () => {
        window.loadedScripts.add(src);
        if (callback) callback();
    });
};

// User Data Manager for Iterum R&D Chef Notebook
// Handles user-specific data storage and initialization

class UserDataManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadCurrentUser();
        this.initializeUserData();
    }

    // Get current user from localStorage
    getCurrentUser() {
        const user = localStorage.getItem('current_user');
        return user ? JSON.parse(user) : null;
    }

    // Load current user and initialize their data
    loadCurrentUser() {
        this.currentUser = this.getCurrentUser();
        if (!this.currentUser) {
            console.log('No user logged in');
            return;
        }
        console.log('Current user:', this.currentUser.name);
    }

    // Initialize user data if it doesn't exist
    initializeUserData() {
        if (!this.currentUser) return;

        const userId = this.currentUser.id;
        
        // Check if user data has been initialized
        const initialized = localStorage.getItem(`user_initialized_${userId}`);
        if (initialized === 'true') {
            console.log('User data already initialized');
            return;
        }

        console.log('Initializing user data for:', this.currentUser.name);
        
        // Initialize ingredients with default database
        this.initializeUserIngredients(userId);
        
        // Initialize equipment with default database
        this.initializeUserEquipment(userId);
        
        // Initialize other user-specific data
        this.initializeUserRecipes(userId);
        this.initializeUserInventory(userId);
        this.initializeUserHACCP(userId);
        this.initializeUserCalendar(userId);
        this.initializeUserDrafts(userId);
        
        // Mark as initialized
        localStorage.setItem(`user_initialized_${userId}`, 'true');
        
        console.log('User data initialization complete');
    }

    // Initialize user's ingredient library with default ingredients
    initializeUserIngredients(userId) {
        const existingIngredients = localStorage.getItem(`ingredients_${userId}`);
        if (existingIngredients) {
            console.log('User ingredients already exist');
            return;
        }

        const defaultIngredients = [
            // Produce
            { id: 1, name: "All-Purpose Flour", category: "Pantry", default_unit: "g", description: "Standard baking flour", allergens: ["gluten"], nutritional_info: { protein: 10, carbs: 76, fat: 1, calories: 364 }, created_at: new Date().toISOString() },
            { id: 2, name: "Granulated Sugar", category: "Pantry", default_unit: "g", description: "Sweetener", allergens: [], nutritional_info: { carbs: 100, calories: 387 }, created_at: new Date().toISOString() },
            { id: 3, name: "Salt", category: "Pantry", default_unit: "g", description: "Basic seasoning", allergens: [], nutritional_info: { sodium: 38758 }, created_at: new Date().toISOString() },
            { id: 4, name: "Black Pepper", category: "Pantry", default_unit: "g", description: "Spice, freshly ground preferred", allergens: [], nutritional_info: { calories: 251 }, created_at: new Date().toISOString() },
            { id: 5, name: "Unsalted Butter", category: "Dairy", default_unit: "g", description: "For baking and cooking", allergens: ["dairy"], nutritional_info: { fat: 81, calories: 717 }, created_at: new Date().toISOString() },
            { id: 6, name: "Large Eggs", category: "Dairy", default_unit: "each", description: "Binding and leavening agent", allergens: ["eggs"], nutritional_info: { protein: 12.5, calories: 70 }, created_at: new Date().toISOString() },
            { id: 7, name: "Whole Milk", category: "Dairy", default_unit: "ml", description: "Dairy base", allergens: ["dairy"], nutritional_info: { protein: 3.4, calories: 42 }, created_at: new Date().toISOString() },
            { id: 8, name: "Olive Oil", category: "Oils/Fats", default_unit: "ml", description: "Cooking and finishing oil", allergens: [], nutritional_info: { fat: 100, calories: 884 }, created_at: new Date().toISOString() },
            { id: 9, name: "Garlic", category: "Produce", default_unit: "cloves", description: "Aromatic, pungent", allergens: [], nutritional_info: { calories: 149 }, created_at: new Date().toISOString() },
            { id: 10, name: "Onion", category: "Produce", default_unit: "each", description: "Aromatic base", allergens: [], nutritional_info: { calories: 40 }, created_at: new Date().toISOString() },
            { id: 11, name: "Tomatoes", category: "Produce", default_unit: "each", description: "Fresh tomatoes", allergens: [], nutritional_info: { calories: 18 }, created_at: new Date().toISOString() },
            { id: 12, name: "Carrots", category: "Produce", default_unit: "each", description: "Root vegetable", allergens: [], nutritional_info: { calories: 41 }, created_at: new Date().toISOString() },
            { id: 13, name: "Celery", category: "Produce", default_unit: "stalks", description: "Aromatic vegetable", allergens: [], nutritional_info: { calories: 16 }, created_at: new Date().toISOString() },
            { id: 14, name: "Potatoes", category: "Produce", default_unit: "each", description: "Starchy root vegetable", allergens: [], nutritional_info: { calories: 77 }, created_at: new Date().toISOString() },
            { id: 15, name: "Chicken Breast", category: "Protein", default_unit: "g", description: "Lean protein", allergens: [], nutritional_info: { protein: 31, calories: 165 }, created_at: new Date().toISOString() },
            { id: 16, name: "Ground Beef", category: "Protein", default_unit: "g", description: "Ground meat", allergens: [], nutritional_info: { protein: 26, fat: 15, calories: 250 }, created_at: new Date().toISOString() },
            { id: 17, name: "Rice", category: "Grains", default_unit: "g", description: "Staple grain", allergens: [], nutritional_info: { carbs: 28, calories: 130 }, created_at: new Date().toISOString() },
            { id: 18, name: "Pasta", category: "Grains", default_unit: "g", description: "Italian staple", allergens: ["gluten"], nutritional_info: { carbs: 25, calories: 131 }, created_at: new Date().toISOString() },
            { id: 19, name: "Lemon", category: "Produce", default_unit: "each", description: "Citrus fruit", allergens: [], nutritional_info: { calories: 17 }, created_at: new Date().toISOString() },
            { id: 20, name: "Lime", category: "Produce", default_unit: "each", description: "Citrus fruit", allergens: [], nutritional_info: { calories: 20 }, created_at: new Date().toISOString() }
        ];

        localStorage.setItem(`ingredients_${userId}`, JSON.stringify(defaultIngredients));
        console.log(`Initialized ${defaultIngredients.length} default ingredients for user`);
    }

    // Initialize user's equipment with default equipment
    initializeUserEquipment(userId) {
        const existingEquipment = localStorage.getItem(`equipment_${userId}`);
        if (existingEquipment) {
            console.log('User equipment already exists');
            return;
        }

        const defaultEquipment = [
            { id: 1, name: "Chef's Knife", category: "Cutlery", brand: "Standard", model: "8-inch", location: "Kitchen", status: "Active", last_maintenance: new Date().toISOString(), next_maintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), notes: "Primary cutting tool" },
            { id: 2, name: "Cutting Board", category: "Prep Equipment", brand: "Standard", model: "Large Wooden", location: "Prep Station", status: "Active", last_maintenance: new Date().toISOString(), next_maintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), notes: "Sanitize regularly" },
            { id: 3, name: "Mixing Bowls", category: "Prep Equipment", brand: "Standard", model: "Set of 3", location: "Prep Station", status: "Active", last_maintenance: new Date().toISOString(), next_maintenance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), notes: "Various sizes" },
            { id: 4, name: "Measuring Cups", category: "Measuring", brand: "Standard", model: "Set", location: "Prep Station", status: "Active", last_maintenance: new Date().toISOString(), next_maintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), notes: "Dry and liquid measures" },
            { id: 5, name: "Measuring Spoons", category: "Measuring", brand: "Standard", model: "Set", location: "Prep Station", status: "Active", last_maintenance: new Date().toISOString(), next_maintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), notes: "Small measurements" },
            { id: 6, name: "Whisk", category: "Utensils", brand: "Standard", model: "Balloon", location: "Utensil Drawer", status: "Active", last_maintenance: new Date().toISOString(), next_maintenance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), notes: "For mixing and aerating" },
            { id: 7, name: "Spatula", category: "Utensils", brand: "Standard", model: "Rubber", location: "Utensil Drawer", status: "Active", last_maintenance: new Date().toISOString(), next_maintenance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), notes: "For scraping and folding" },
            { id: 8, name: "Tongs", category: "Utensils", brand: "Standard", model: "12-inch", location: "Utensil Drawer", status: "Active", last_maintenance: new Date().toISOString(), next_maintenance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), notes: "For handling hot items" },
            { id: 9, name: "Colander", category: "Prep Equipment", brand: "Standard", model: "Large", location: "Prep Station", status: "Active", last_maintenance: new Date().toISOString(), next_maintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), notes: "For draining pasta and vegetables" },
            { id: 10, name: "Strainer", category: "Prep Equipment", brand: "Standard", model: "Fine Mesh", location: "Prep Station", status: "Active", last_maintenance: new Date().toISOString(), next_maintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), notes: "For straining liquids" }
        ];

        localStorage.setItem(`equipment_${userId}`, JSON.stringify(defaultEquipment));
        console.log(`Initialized ${defaultEquipment.length} default equipment for user`);
    }

    // Initialize user's recipe library
    initializeUserRecipes(userId) {
        const existingRecipes = localStorage.getItem(`recipe_library_${userId}`);
        if (existingRecipes) {
            console.log('User recipes already exist');
            return;
        }

        localStorage.setItem(`recipe_library_${userId}`, JSON.stringify([]));
        console.log('Initialized empty recipe library for user');
    }

    // Initialize user's inventory
    initializeUserInventory(userId) {
        const existingInventory = localStorage.getItem(`inventory_${userId}`);
        if (existingInventory) {
            console.log('User inventory already exists');
            return;
        }

        localStorage.setItem(`inventory_${userId}`, JSON.stringify([]));
        console.log('Initialized empty inventory for user');
    }

    // Initialize user's HACCP data
    initializeUserHACCP(userId) {
        const existingHACCP = localStorage.getItem(`haccp_readings_${userId}`);
        if (existingHACCP) {
            console.log('User HACCP data already exists');
            return;
        }

        localStorage.setItem(`haccp_readings_${userId}`, JSON.stringify([]));
        localStorage.setItem(`haccp_sanitizer_${userId}`, JSON.stringify([]));
        localStorage.setItem(`haccp_dishwasher_${userId}`, JSON.stringify([]));
        console.log('Initialized empty HACCP data for user');
    }

    // Initialize user's calendar data
    initializeUserCalendar(userId) {
        const existingCalendar = localStorage.getItem(`journal_entries_${userId}`);
        if (existingCalendar) {
            console.log('User calendar data already exists');
            return;
        }

        localStorage.setItem(`journal_entries_${userId}`, JSON.stringify([]));
        localStorage.setItem(`recipe_changes_${userId}`, JSON.stringify([]));
        localStorage.setItem(`maintenance_log_${userId}`, JSON.stringify([]));
        console.log('Initialized empty calendar data for user');
    }

    // Initialize user's recipe drafts
    initializeUserDrafts(userId) {
        const existingDrafts = localStorage.getItem(`recipe_drafts_${userId}`);
        if (existingDrafts) {
            console.log('User drafts already exist');
            return;
        }

        localStorage.setItem(`recipe_drafts_${userId}`, JSON.stringify([]));
        localStorage.setItem(`current_draft_${userId}`, JSON.stringify(null));
        console.log('Initialized empty drafts for user');
    }

    // Get user-specific data
    getUserData(dataType) {
        if (!this.currentUser) return null;
        
        const userId = this.currentUser.id;
        const data = localStorage.getItem(`${dataType}_${userId}`);
        return data ? JSON.parse(data) : null;
    }

    // Save user-specific data
    saveUserData(dataType, data) {
        if (!this.currentUser) return;
        
        const userId = this.currentUser.id;
        localStorage.setItem(`${dataType}_${userId}`, JSON.stringify(data));
    }

    // Get user's ingredients
    getUserIngredients() {
        return this.getUserData('ingredients') || [];
    }

    // Save user's ingredients
    saveUserIngredients(ingredients) {
        this.saveUserData('ingredients', ingredients);
    }

    // Get user's equipment (project-aware)
    getUserEquipment() {
        // Use project-specific storage if project manager is available
        if (window.projectManager && window.projectManager.getCurrentProject()) {
            const key = window.projectManager.getProjectStorageKey('equipment');
            const equipment = localStorage.getItem(key);
            return equipment ? JSON.parse(equipment) : [];
        }
        
        // Fallback to user-specific storage
        return this.getUserData('equipment') || [];
    }

    // Save user's equipment (project-aware)
    saveUserEquipment(equipment) {
        // Use project-specific storage if project manager is available
        if (window.projectManager && window.projectManager.getCurrentProject()) {
            const key = window.projectManager.getProjectStorageKey('equipment');
            localStorage.setItem(key, JSON.stringify(equipment));
        } else {
            // Fallback to user-specific storage
            this.saveUserData('equipment', equipment);
        }
    }

    // Get user's recipes (project-aware)
    getUserRecipes() {
        // Use project-specific storage if project manager is available
        if (window.projectManager && window.projectManager.getCurrentProject()) {
            const key = window.projectManager.getProjectStorageKey('recipe_library');
            const recipes = localStorage.getItem(key);
            return recipes ? JSON.parse(recipes) : [];
        }
        
        // Fallback to user-specific storage
        return this.getUserData('recipe_library') || [];
    }

    // Save user's recipes (project-aware)
    saveUserRecipes(recipes) {
        // Use project-specific storage if project manager is available
        if (window.projectManager && window.projectManager.getCurrentProject()) {
            const key = window.projectManager.getProjectStorageKey('recipe_library');
            localStorage.setItem(key, JSON.stringify(recipes));
        } else {
            // Fallback to user-specific storage
            this.saveUserData('recipe_library', recipes);
        }
    }

    // Get user's inventory
    getUserInventory() {
        return this.getUserData('inventory') || [];
    }

    // Save user's inventory
    saveUserInventory(inventory) {
        this.saveUserData('inventory', inventory);
    }

    // Get user's HACCP readings
    getUserHACCPReadings() {
        return this.getUserData('haccp_readings') || [];
    }

    // Save user's HACCP readings
    saveUserHACCPReadings(readings) {
        this.saveUserData('haccp_readings', readings);
    }

    // Get user's journal entries
    getUserJournalEntries() {
        return this.getUserData('journal_entries') || [];
    }

    // Save user's journal entries
    saveUserJournalEntries(entries) {
        this.saveUserData('journal_entries', entries);
    }

    // Get user's recipe drafts
    getUserDrafts() {
        return this.getUserData('recipe_drafts') || [];
    }

    // Save user's recipe drafts
    saveUserDrafts(drafts) {
        this.saveUserData('recipe_drafts', drafts);
    }

    // Check if user is logged in
    isUserLoggedIn() {
        return this.currentUser !== null;
    }

    // Get current user ID
    getCurrentUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }

    // Get current user name
    getCurrentUserName() {
        return this.currentUser ? this.currentUser.name : 'Guest';
    }

    // Refresh user data (call when user changes)
    refreshUserData() {
        this.loadCurrentUser();
        this.initializeUserData();
    }

    // Clear user data (for logout)
    clearUserData() {
        this.currentUser = null;
    }

    // Export user data
    exportUserData() {
        if (!this.currentUser) return null;

        const userId = this.currentUser.id;
        const userData = {
            user: this.currentUser,
            ingredients: this.getUserIngredients(),
            equipment: this.getUserEquipment(),
            recipes: this.getUserRecipes(),
            inventory: this.getUserInventory(),
            haccp_readings: this.getUserHACCPReadings(),
            journal_entries: this.getUserJournalEntries(),
            recipe_drafts: this.getUserDrafts(),
            export_date: new Date().toISOString()
        };

        return userData;
    }

    // Import user data
    importUserData(data) {
        if (!this.currentUser || !data) return false;

        try {
            if (data.ingredients) this.saveUserIngredients(data.ingredients);
            if (data.equipment) this.saveUserEquipment(data.equipment);
            if (data.recipes) this.saveUserRecipes(data.recipes);
            if (data.inventory) this.saveUserInventory(data.inventory);
            if (data.haccp_readings) this.saveUserHACCPReadings(data.haccp_readings);
            if (data.journal_entries) this.saveUserJournalEntries(data.journal_entries);
            if (data.recipe_drafts) this.saveUserDrafts(data.recipe_drafts);

            return true;
        } catch (error) {
            console.error('Error importing user data:', error);
            return false;
        }
    }
}

// Create global instance (delayed to avoid blocking page load)
console.log('📦 UserDataManager: Scheduling initialization...');

setTimeout(() => {
    try {
        window.userDataManager = new UserDataManager();
        console.log('✅ UserDataManager initialized successfully');
    } catch (error) {
        console.error('❌ UserDataManager initialization failed:', error);
        // Create minimal fallback
        window.userDataManager = {
            isUserLoggedIn: () => false,
            getCurrentUserId: () => null,
            getCurrentUserName: () => 'Guest',
            getCurrentUser: () => null
        };
    }
}, 100);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserDataManager;
} 