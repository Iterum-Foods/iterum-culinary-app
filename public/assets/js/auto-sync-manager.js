/**
 * Auto-Sync Manager - Automatically syncs data to backend
 * Syncs menus, daily notes, and recipe ideas for long-term storage
 */

class AutoSyncManager {
  constructor() {
    this.syncInterval = 5 * 60 * 1000; // Sync every 5 minutes
    this.lastSyncTimes = {};
    this.syncQueue = [];
    this.isSyncing = false;
    this.init();
  }

  init() {
    console.log('🔄 Auto-Sync Manager initialized');
    
    // Load last sync times
    this.loadLastSyncTimes();
    
    // Start periodic sync
    this.startPeriodicSync();
    
    // Sync on page unload
    window.addEventListener('beforeunload', () => this.syncAll());
    
    // Sync when coming back online
    window.addEventListener('online', () => {
      console.log('🌐 Back online - syncing data...');
      this.syncAll();
    });
  }

  /**
   * Start periodic background sync
   */
  startPeriodicSync() {
    // Initial sync after 30 seconds
    setTimeout(() => this.syncAll(), 30000);
    
    // Then sync every 5 minutes
    setInterval(() => this.syncAll(), this.syncInterval);
  }

  /**
   * Sync all data types
   */
  async syncAll() {
    if (!window.authManager?.isAuthenticated()) {
      console.log('⏭️ Skipping sync - not authenticated');
      return;
    }

    if (!navigator.onLine) {
      console.log('⏭️ Skipping sync - offline');
      return;
    }

    console.log('🔄 Starting auto-sync...');
    
    await this.syncMenus();
    await this.syncDailyNotes();
    await this.syncRecipeIdeas();
    
    console.log('✅ Auto-sync complete');
  }

  /**
   * Sync menu data to backend
   */
  async syncMenus() {
    try {
      const userId = this.getCurrentUserId();
      const keys = Object.keys(localStorage);
      let syncedCount = 0;

      for (const key of keys) {
        if (key.startsWith('menu_data_')) {
          const projectId = key.replace('menu_data_', '');
          const menuData = JSON.parse(localStorage.getItem(key) || '{}');
          
          // Check if needs sync
          const lastSync = this.lastSyncTimes[`menu_${projectId}`];
          const lastModified = menuData.lastModified || 0;
          
          if (!lastSync || lastModified > lastSync) {
            await this.syncMenuToBackend(projectId, menuData);
            this.lastSyncTimes[`menu_${projectId}`] = Date.now();
            syncedCount++;
          }
        }
      }

      if (syncedCount > 0) {
        console.log(`✅ Synced ${syncedCount} menus to backend`);
        this.saveLastSyncTimes();
      }

    } catch (error) {
      console.error('❌ Error syncing menus:', error);
    }
  }

  /**
   * Sync a single menu to backend
   */
  async syncMenuToBackend(projectId, menuData) {
    if (!window.authApiHelper) {
      console.warn('Auth API helper not available');
      return;
    }

    try {
      await window.authApiHelper.post('/api/menus/sync', {
        project_id: projectId,
        menu_data: menuData
      });
      
      console.log(`✅ Menu synced for project: ${projectId}`);
    } catch (error) {
      console.error(`❌ Failed to sync menu for project ${projectId}:`, error);
    }
  }

  /**
   * Sync daily notes to backend
   */
  async syncDailyNotes() {
    try {
      const notes = JSON.parse(localStorage.getItem('daily_notes') || '{}');
      let syncedCount = 0;

      for (const [date, notesData] of Object.entries(notes)) {
        // Check if needs sync
        const lastSync = this.lastSyncTimes[`note_${date}`];
        const lastModified = notesData.lastModified || 0;
        
        if (!lastSync || lastModified > lastSync) {
          await this.syncNoteToBackend(date, notesData);
          this.lastSyncTimes[`note_${date}`] = Date.now();
          syncedCount++;
        }
      }

      if (syncedCount > 0) {
        console.log(`✅ Synced ${syncedCount} daily notes to backend`);
        this.saveLastSyncTimes();
      }

    } catch (error) {
      console.error('❌ Error syncing daily notes:', error);
    }
  }

  /**
   * Sync a single note to backend
   */
  async syncNoteToBackend(date, notesData) {
    if (!window.authApiHelper) {
      console.warn('Auth API helper not available');
      return;
    }

    try {
      await window.authApiHelper.post('/api/notes/sync', {
        date: date,
        notes_data: notesData
      });
      
      console.log(`✅ Note synced for date: ${date}`);
    } catch (error) {
      console.error(`❌ Failed to sync note for ${date}:`, error);
    }
  }

  /**
   * Sync recipe ideas to backend
   */
  async syncRecipeIdeas() {
    try {
      const ideas = JSON.parse(localStorage.getItem('recipe_ideas') || '[]');
      let syncedCount = 0;

      for (const idea of ideas) {
        // Skip if already synced to backend (has backendId)
        if (idea.backendId) continue;

        // Check if needs sync
        const lastSync = this.lastSyncTimes[`idea_${idea.id}`];
        const lastModified = idea.lastModified || idea.createdAt || 0;
        
        if (!lastSync || lastModified > lastSync) {
          const backendId = await this.syncIdeaToBackend(idea);
          if (backendId) {
            idea.backendId = backendId;
            this.lastSyncTimes[`idea_${idea.id}`] = Date.now();
            syncedCount++;
          }
        }
      }

      if (syncedCount > 0) {
        // Update ideas with backend IDs
        localStorage.setItem('recipe_ideas', JSON.stringify(ideas));
        console.log(`✅ Synced ${syncedCount} recipe ideas to backend`);
        this.saveLastSyncTimes();
      }

    } catch (error) {
      console.error('❌ Error syncing recipe ideas:', error);
    }
  }

  /**
   * Sync a single idea to backend
   */
  async syncIdeaToBackend(idea) {
    if (!window.authApiHelper) {
      console.warn('Auth API helper not available');
      return null;
    }

    try {
      const response = await window.authApiHelper.post('/api/ideas/sync', {
        title: idea.title,
        description: idea.description || '',
        category: idea.category || '',
        inspiration: idea.inspiration || '',
        tags: idea.tags || [],
        status: idea.status || 'idea'
      });
      
      console.log(`✅ Idea synced: ${idea.title}`);
      return response.id;
    } catch (error) {
      console.error(`❌ Failed to sync idea "${idea.title}":`, error);
      return null;
    }
  }

  /**
   * Load last sync times from localStorage
   */
  loadLastSyncTimes() {
    const saved = localStorage.getItem('auto_sync_times');
    if (saved) {
      try {
        this.lastSyncTimes = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading sync times:', e);
        this.lastSyncTimes = {};
      }
    }
  }

  /**
   * Save last sync times to localStorage
   */
  saveLastSyncTimes() {
    localStorage.setItem('auto_sync_times', JSON.stringify(this.lastSyncTimes));
  }

  /**
   * Force sync all data immediately
   */
  async forceSyncAll() {
    // Clear last sync times to force re-sync
    this.lastSyncTimes = {};
    await this.syncAll();
    this.saveLastSyncTimes();
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    if (window.authManager?.currentUser) {
      return window.authManager.currentUser.userId;
    }
    return 'guest';
  }

  /**
   * Get sync status for dashboard
   */
  getSyncStatus() {
    const now = Date.now();
    const syncTimes = Object.values(this.lastSyncTimes);
    
    if (syncTimes.length === 0) {
      return {
        status: 'never',
        message: 'Never synced',
        lastSync: null
      };
    }

    const lastSync = Math.max(...syncTimes);
    const minutesSinceSync = Math.floor((now - lastSync) / 60000);

    if (minutesSinceSync < 5) {
      return {
        status: 'synced',
        message: `Synced ${minutesSinceSync} min ago`,
        lastSync: new Date(lastSync)
      };
    } else if (minutesSinceSync < 30) {
      return {
        status: 'recent',
        message: `Synced ${minutesSinceSync} min ago`,
        lastSync: new Date(lastSync)
      };
    } else {
      return {
        status: 'stale',
        message: `Synced ${minutesSinceSync} min ago`,
        lastSync: new Date(lastSync)
      };
    }
  }
}

// Initialize global instance
window.autoSyncManager = new AutoSyncManager();

console.log('🔄 Auto-Sync Manager loaded');

