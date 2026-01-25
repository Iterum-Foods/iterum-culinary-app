/**
 * Change Tracker
 * Automatically tracks all changes made to recipes, menus, ingredients, equipment
 * Documents who, what, when, and why
 */

class ChangeTracker {
  constructor() {
    this.changes = [];
    this.autoSaveEnabled = true;
  }

  /**
   * Initialize change tracking
   */
  init() {
    console.log('📝 Change Tracker initializing...');
    
    this.loadChanges();
    this.setupAutoTracking();
    
    console.log('✅ Change Tracker active');
  }

  /**
   * Load existing changes
   */
  loadChanges() {
    this.changes = JSON.parse(localStorage.getItem('change_history') || '[]');
    console.log(`📚 Loaded ${this.changes.length} historical changes`);
  }

  /**
   * Track a change
   */
  trackChange(entityType, entityId, action, oldValue = null, newValue = null, notes = '') {
    const change = {
      id: `change_${Date.now()}`,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      
      // What changed
      entityType: entityType, // 'recipe', 'menu', 'ingredient', 'equipment', 'project'
      entityId: entityId,
      entityName: this.getEntityName(entityType, entityId),
      action: action, // 'created', 'updated', 'deleted', 'viewed', 'exported'
      
      // Who made the change
      userId: window.authManager?.currentUser?.userId,
      userEmail: window.authManager?.currentUser?.email,
      userName: window.authManager?.currentUser?.name,
      
      // What changed
      oldValue: oldValue,
      newValue: newValue,
      fieldChanged: this.detectFieldChange(oldValue, newValue),
      
      // Context
      page: window.location.pathname,
      project: window.projectManager?.currentProject?.name,
      notes: notes,
      
      // System info
      browser: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    this.changes.push(change);
    
    // Keep only last 5000 changes
    if (this.changes.length > 5000) {
      this.changes = this.changes.slice(-5000);
    }
    
    // Save
    if (this.autoSaveEnabled) {
      this.saveChanges();
    }
    
    // Log to audit system if available
    if (window.timestampSystem) {
      window.timestampSystem.logAction(action, entityType, entityId, {
        oldValue: oldValue,
        newValue: newValue,
        notes: notes
      });
    }
    
    console.log(`📝 Tracked: ${action} ${entityType} "${change.entityName}"`);
    
    return change;
  }

  /**
   * Get entity name from ID
   */
  getEntityName(entityType, entityId) {
    try {
      switch (entityType) {
        case 'recipe':
          const recipes = window.universalRecipeManager?.getAllRecipes() || [];
          const recipe = recipes.find(r => r.id === entityId);
          return recipe?.title || recipe?.name || entityId;
        
        case 'menu':
          // Get from localStorage
          const user = window.authManager?.currentUser;
          const menuKey = `menus_${user?.userId}`;
          const menus = JSON.parse(localStorage.getItem(menuKey) || '[]');
          const menu = menus.find(m => m.id === entityId);
          return menu?.name || entityId;
        
        case 'ingredient':
          const ingredients = JSON.parse(localStorage.getItem('ingredients_database') || '[]');
          const ing = ingredients.find(i => i.id === entityId);
          return ing?.name || entityId;
        
        case 'equipment':
          if (window.equipmentManager) {
            const equip = window.equipmentManager.getById(entityId);
            return equip?.name || entityId;
          }
          return entityId;
        
        default:
          return entityId;
      }
    } catch (error) {
      return entityId;
    }
  }

  /**
   * Detect which field changed
   */
  detectFieldChange(oldValue, newValue) {
    if (!oldValue || !newValue) return [];
    
    const changes = [];
    
    try {
      const oldObj = typeof oldValue === 'string' ? JSON.parse(oldValue) : oldValue;
      const newObj = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
      
      Object.keys(newObj).forEach(key => {
        if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
          changes.push(key);
        }
      });
    } catch (e) {
      // Not objects to compare
    }
    
    return changes;
  }

  /**
   * Save changes to localStorage
   */
  saveChanges() {
    localStorage.setItem('change_history', JSON.stringify(this.changes));
  }

  /**
   * Get changes for specific entity
   */
  getEntityChanges(entityId) {
    return this.changes
      .filter(change => change.entityId === entityId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get recent changes
   */
  getRecentChanges(limit = 20) {
    return this.changes
      .slice(-limit)
      .reverse();
  }

  /**
   * Get changes by date range
   */
  getChangesByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.changes.filter(change => {
      const changeDate = new Date(change.timestamp);
      return changeDate >= start && changeDate <= end;
    });
  }

  /**
   * Get changes by user
   */
  getChangesByUser(userEmail) {
    return this.changes.filter(change => change.userEmail === userEmail);
  }

  /**
   * Setup auto-tracking for common operations
   */
  setupAutoTracking() {
    // Override common save functions to auto-track
    
    // Recipe saves
    const originalRecipeAdd = window.universalRecipeManager?.addToLibrary;
    if (originalRecipeAdd && window.universalRecipeManager) {
      window.universalRecipeManager.addToLibrary = (recipe) => {
        const isNew = !window.universalRecipeManager.getRecipe(recipe.id);
        const result = originalRecipeAdd.call(window.universalRecipeManager, recipe);
        
        this.trackChange(
          'recipe',
          recipe.id,
          isNew ? 'created' : 'updated',
          null,
          recipe,
          isNew ? 'New recipe created' : 'Recipe updated'
        );
        
        return result;
      };
    }
  }

  /**
   * Export change history
   */
  exportChanges() {
    const data = {
      exported: new Date().toISOString(),
      totalChanges: this.changes.length,
      changes: this.changes
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `change-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    console.log('📥 Change history exported');
  }

  /**
   * View changes in console
   */
  viewChanges(limit = 20) {
    console.log(`\n📋 RECENT CHANGES (Last ${limit}):`);
    console.log('═'.repeat(80));
    
    this.getRecentChanges(limit).forEach((change, index) => {
      console.log(`\n${index + 1}. ${change.action.toUpperCase()} ${change.entityType}: "${change.entityName}"`);
      console.log(`   When: ${window.timestampSystem.formatTimestamp(change.timestamp)}`);
      console.log(`   Who: ${change.userEmail || 'Unknown'}`);
      console.log(`   Where: ${change.page}`);
      if (change.notes) console.log(`   Notes: ${change.notes}`);
      if (change.fieldChanged && change.fieldChanged.length > 0) {
        console.log(`   Fields: ${change.fieldChanged.join(', ')}`);
      }
    });
    
    console.log('\n' + '═'.repeat(80));
  }
}

// Global helper functions
window.trackChange = function(entityType, entityId, action, oldValue, newValue, notes) {
  if (window.changeTracker) {
    return window.changeTracker.trackChange(entityType, entityId, action, oldValue, newValue, notes);
  }
};

window.viewChanges = function(limit = 20) {
  if (window.changeTracker) {
    window.changeTracker.viewChanges(limit);
  }
};

window.exportChanges = function() {
  if (window.changeTracker) {
    window.changeTracker.exportChanges();
  }
};

// Initialize global instance
window.changeTracker = new ChangeTracker();

// Auto-initialize on page load
window.addEventListener('load', () => {
  setTimeout(() => {
    window.changeTracker.init();
  }, 1000);
});

console.log('📝 Change Tracker loaded');

