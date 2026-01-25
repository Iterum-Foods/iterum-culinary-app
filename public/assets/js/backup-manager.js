/**
 * Backup Manager - Complete Data Backup & Restore System
 * Protects user data with local exports and cloud sync
 */

class BackupManager {
  constructor() {
    this.backupVersion = '1.0';
    this.autoBackupEnabled = true;
    this.autoBackupInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.lastBackupKey = 'last_backup_date';
    this.init();
  }

  init() {
    console.log('💾 Backup Manager initialized');
    
    // Check if auto-backup is due
    this.checkAutoBackup();
    
    // Setup periodic check
    setInterval(() => this.checkAutoBackup(), 60 * 60 * 1000); // Check hourly
  }

  /**
   * Create complete backup of all data
   */
  createBackup() {
    try {
      console.log('💾 Creating complete backup...');

      const backup = {
        version: this.backupVersion,
        timestamp: new Date().toISOString(),
        userId: this.getCurrentUserId(),
        userName: this.getCurrentUserName(),
        data: this.collectAllData()
      };

      console.log('✅ Backup created:', {
        recipes: backup.data.recipes.length,
        projects: backup.data.projects.length,
        photos: backup.data.photos.length,
        vendors: backup.data.vendors.length,
        menus: backup.data.menus.length
      });

      return backup;

    } catch (error) {
      console.error('❌ Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Collect all data from localStorage
   */
  collectAllData() {
    const userId = this.getCurrentUserId();

    return {
      // Core data
      recipes: JSON.parse(localStorage.getItem('recipes') || '[]'),
      recipeIdeas: JSON.parse(localStorage.getItem('recipe_ideas') || '[]'),
      recipeStubs: JSON.parse(localStorage.getItem('recipe_stubs') || '[]'),
      
      // Projects
      projects: JSON.parse(localStorage.getItem(`iterum_projects_user_${userId}`) || '[]'),
      currentProject: localStorage.getItem(`iterum_current_project_user_${userId}`) || 'master',
      
      // Menus (collect from all projects)
      menus: this.collectAllMenus(),
      menuRecipeLinks: JSON.parse(localStorage.getItem('menu_recipe_links') || '{}'),
      
      // Ingredients
      ingredients: JSON.parse(localStorage.getItem('ingredients_database') || '[]'),
      customIngredients: JSON.parse(localStorage.getItem('custom_ingredients') || '[]'),
      
      // Vendors
      vendors: JSON.parse(localStorage.getItem('iterum_vendors') || '[]'),
      
      // Equipment
      equipment: JSON.parse(localStorage.getItem('equipment_list') || '[]'),
      
      // Photos
      photos: JSON.parse(localStorage.getItem('recipe_photos') || '[]'),
      
      // Notes
      dailyNotes: JSON.parse(localStorage.getItem('daily_notes') || '{}'),
      
      // User data
      currentUser: localStorage.getItem('current_user') || null
    };
  }

  /**
   * Collect menus from all projects
   */
  collectAllMenus() {
    const menus = [];
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith('menu_data_')) {
        try {
          const menuData = JSON.parse(localStorage.getItem(key));
          menus.push({
            projectId: key.replace('menu_data_', ''),
            data: menuData
          });
        } catch (e) {
          console.warn('Could not parse menu data:', key);
        }
      }
    });
    
    return menus;
  }

  /**
   * Download backup as JSON file
   */
  downloadBackup() {
    try {
      const backup = this.createBackup();
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iterum-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update last backup date
      localStorage.setItem(this.lastBackupKey, new Date().toISOString());

      this.showNotification('✅ Backup downloaded successfully!', 'success');
      
      // Track analytics
      if (window.analyticsTracker) {
        window.analyticsTracker.trackCustomEvent('backup_created', {
          recipes: backup.data.recipes.length,
          photos: backup.data.photos.length,
          size_mb: (JSON.stringify(backup).length / 1024 / 1024).toFixed(2)
        });
      }

      console.log('✅ Backup downloaded');
      return true;

    } catch (error) {
      console.error('❌ Error downloading backup:', error);
      this.showNotification('❌ Backup failed: ' + error.message, 'error');
      return false;
    }
  }

  /**
   * Restore from backup file
   */
  async restoreBackup(file) {
    try {
      console.log('📥 Restoring from backup...');

      const text = await file.text();
      const backup = JSON.parse(text);

      // Validate backup
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup file format');
      }

      // Confirm restoration
      const confirm = window.confirm(
        `Restore backup from ${new Date(backup.timestamp).toLocaleDateString()}?\n\n` +
        `This backup contains:\n` +
        `• ${backup.data.recipes.length} recipes\n` +
        `• ${backup.data.projects.length} projects\n` +
        `• ${backup.data.photos.length} photos\n` +
        `• ${backup.data.vendors.length} vendors\n` +
        `• ${backup.data.menus.length} menus\n\n` +
        `⚠️ This will replace your current data!`
      );

      if (!confirm) {
        console.log('❌ Restore cancelled by user');
        return false;
      }

      // Restore data
      this.restoreAllData(backup.data);

      this.showNotification('✅ Backup restored! Refreshing...', 'success');
      
      // Reload page to show restored data
      setTimeout(() => window.location.reload(), 2000);

      console.log('✅ Backup restored successfully');
      return true;

    } catch (error) {
      console.error('❌ Error restoring backup:', error);
      this.showNotification('❌ Restore failed: ' + error.message, 'error');
      return false;
    }
  }

  /**
   * Restore all data to localStorage
   */
  restoreAllData(data) {
    const userId = this.getCurrentUserId();

    // Core data
    if (data.recipes) localStorage.setItem('recipes', JSON.stringify(data.recipes));
    if (data.recipeIdeas) localStorage.setItem('recipe_ideas', JSON.stringify(data.recipeIdeas));
    if (data.recipeStubs) localStorage.setItem('recipe_stubs', JSON.stringify(data.recipeStubs));
    
    // Projects
    if (data.projects) localStorage.setItem(`iterum_projects_user_${userId}`, JSON.stringify(data.projects));
    if (data.currentProject) localStorage.setItem(`iterum_current_project_user_${userId}`, data.currentProject);
    
    // Menus
    if (data.menus) {
      data.menus.forEach(menu => {
        localStorage.setItem(`menu_data_${menu.projectId}`, JSON.stringify(menu.data));
      });
    }
    if (data.menuRecipeLinks) localStorage.setItem('menu_recipe_links', JSON.stringify(data.menuRecipeLinks));
    
    // Ingredients
    if (data.ingredients) localStorage.setItem('ingredients_database', JSON.stringify(data.ingredients));
    if (data.customIngredients) localStorage.setItem('custom_ingredients', JSON.stringify(data.customIngredients));
    
    // Vendors
    if (data.vendors) localStorage.setItem('iterum_vendors', JSON.stringify(data.vendors));
    
    // Equipment
    if (data.equipment) localStorage.setItem('equipment_list', JSON.stringify(data.equipment));
    
    // Photos
    if (data.photos) localStorage.setItem('recipe_photos', JSON.stringify(data.photos));
    
    // Notes
    if (data.dailyNotes) localStorage.setItem('daily_notes', JSON.stringify(data.dailyNotes));

    console.log('✅ All data restored to localStorage');
  }

  /**
   * Check if auto-backup is due
   */
  checkAutoBackup() {
    if (!this.autoBackupEnabled) return;

    const lastBackup = localStorage.getItem(this.lastBackupKey);
    
    if (!lastBackup) {
      // Never backed up - do it now
      console.log('📅 No previous backup found, creating first backup...');
      this.downloadBackup();
      return;
    }

    const lastBackupDate = new Date(lastBackup);
    const now = new Date();
    const hoursSinceBackup = (now - lastBackupDate) / (1000 * 60 * 60);

    if (hoursSinceBackup >= 24) {
      console.log('📅 Auto-backup due (last backup: ' + hoursSinceBackup.toFixed(1) + ' hours ago)');
      
      // Show reminder
      this.showBackupReminder();
    }
  }

  /**
   * Show backup reminder notification
   */
  showBackupReminder() {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 350px;
    `;

    notification.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 8px; font-size: 16px;">💾 Backup Reminder</div>
      <div style="font-size: 14px; margin-bottom: 16px; opacity: 0.95;">
        It's been 24+ hours since your last backup. Protect your data!
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="window.backupManager.downloadBackup(); this.parentElement.parentElement.remove();" 
                style="flex: 1; padding: 8px; background: white; color: #667eea; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
          Backup Now
        </button>
        <button onclick="this.parentElement.parentElement.remove();" 
                style="padding: 8px 16px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 6px; cursor: pointer;">
          Later
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 30000);
  }

  /**
   * Get backup statistics
   */
  getBackupStats() {
    const backup = this.createBackup();
    const jsonString = JSON.stringify(backup);
    const sizeBytes = new Blob([jsonString]).size;

    return {
      totalItems: backup.data.recipes.length + 
                  backup.data.projects.length + 
                  backup.data.photos.length +
                  backup.data.vendors.length +
                  backup.data.menus.length,
      recipes: backup.data.recipes.length,
      projects: backup.data.projects.length,
      photos: backup.data.photos.length,
      vendors: backup.data.vendors.length,
      menus: backup.data.menus.length,
      sizeBytes: sizeBytes,
      sizeMB: (sizeBytes / 1024 / 1024).toFixed(2),
      lastBackup: localStorage.getItem(this.lastBackupKey)
    };
  }

  /**
   * Helper methods
   */
  getCurrentUserId() {
    if (window.authManager?.currentUser) {
      return window.authManager.currentUser.userId;
    }
    return 'guest';
  }

  getCurrentUserName() {
    if (window.authManager?.currentUser) {
      return window.authManager.currentUser.displayName || window.authManager.currentUser.email;
    }
    return 'Guest User';
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize global instance
window.backupManager = new BackupManager();

console.log('💾 Backup Manager loaded');

