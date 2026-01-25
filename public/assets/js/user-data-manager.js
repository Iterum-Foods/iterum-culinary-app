/**
 * User Data Manager
 * Comprehensive data management system ensuring all data is:
 * - Properly saved with userId
 * - Synced to cloud automatically
 * - Always available across devices
 * - Protected and validated
 */

class UserDataManager {
    constructor() {
        this.userId = null;
        this.userEmail = null;
        this.currentProjectId = null;
        this.dataCollections = ['recipes', 'menus', 'projects', 'ingredients', 'vendors', 'equipment'];
        this.saveTimeout = null;
        this.initialized = false;
        
        this.init();
    }

    /**
     * Initialize data manager
     */
    async init() {
        console.log('💾 Initializing User Data Manager...');
        
        // Wait for authentication
        await this.waitForAuth();
        
        // Verify data integrity
        await this.verifyDataIntegrity();
        
        // Setup auto-save
        this.setupAutoSave();
        
        // Setup cloud sync integration
        this.setupCloudSync();
        
        // Setup data validation
        this.setupDataValidation();
        
        this.initialized = true;
        console.log('✅ User Data Manager initialized');
        
        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('userDataManagerReady'));
    }

    /**
     * Wait for authentication
     */
    async waitForAuth() {
        return new Promise((resolve) => {
            const check = () => {
                const user = window.authManager?.currentUser;
                if (user) {
                    this.userId = user.userId || user.id;
                    this.userEmail = user.email;
                    this.updateCurrentProject();
                    console.log(`✅ User Data Manager ready for: ${this.userEmail}`);
                    resolve();
                } else {
                    setTimeout(check, 200);
                }
            };
            check();
        });
    }

    /**
     * Update current project
     */
    updateCurrentProject() {
        // Get current project from unified selector or storage
        if (window.unifiedProjectSelector) {
            this.currentProjectId = window.unifiedProjectSelector.currentProjectId;
        } else if (window.projectManager?.currentProject) {
            this.currentProjectId = window.projectManager.currentProject.id;
        } else {
            const storedProjectId = localStorage.getItem(`iterum_current_project_user_${this.userId}`) ||
                                   localStorage.getItem('iterum_current_project') ||
                                   'master';
            this.currentProjectId = storedProjectId;
        }
        
        console.log(`📋 Current project: ${this.currentProjectId}`);
        
        // Listen for project changes
        window.addEventListener('projectChanged', (event) => {
            this.currentProjectId = event.detail?.projectId || 'master';
            console.log(`📋 Project changed to: ${this.currentProjectId}`);
        });
    }

    /**
     * Save data with user AND project isolation
     */
    saveData(dataType, data, options = {}) {
        if (!this.userId) {
            console.error('❌ Cannot save data: no user ID');
            return false;
        }

        try {
            // Update current project
            this.updateCurrentProject();
            
            console.log(`💾 Saving ${dataType} for user ${this.userEmail} in project ${this.currentProjectId}...`);

            // Ensure data is an array
            const dataArray = Array.isArray(data) ? data : [data];

            // Tag all items with userId AND projectId (unless it's a project itself)
            const taggedData = dataArray.map(item => {
                const tagged = {
                    ...item,
                    userId: this.userId,
                    userEmail: this.userEmail,
                    lastModified: new Date().toISOString(),
                    lastModifiedBy: this.userEmail
                };
                
                // Add projectId if not a project collection and project is specified
                if (dataType !== 'projects' && this.currentProjectId && options.skipProjectTag !== true) {
                    tagged.projectId = this.currentProjectId;
                    tagged.project = this.currentProjectId;
                }
                
                return tagged;
            });

            // Get storage key
            const storageKey = this.getStorageKey(dataType);

            // For single item save, merge with existing
            if (options.merge !== false) {
                const existing = this.loadData(dataType) || [];
                
                // Merge logic
                taggedData.forEach(newItem => {
                    const existingIndex = existing.findIndex(item => item.id === newItem.id);
                    if (existingIndex >= 0) {
                        // Update existing
                        existing[existingIndex] = newItem;
                    } else {
                        // Add new
                        existing.push(newItem);
                    }
                });

                localStorage.setItem(storageKey, JSON.stringify(existing));
                console.log(`✅ Saved ${existing.length} ${dataType} (merged)`);
                
                // Trigger cloud sync
                this.queueForCloudSync(dataType, existing);
                
                return existing;
            } else {
                // Replace all data
                localStorage.setItem(storageKey, JSON.stringify(taggedData));
                console.log(`✅ Saved ${taggedData.length} ${dataType} (replaced)`);
                
                // Trigger cloud sync
                this.queueForCloudSync(dataType, taggedData);
                
                return taggedData;
            }

        } catch (error) {
            console.error(`❌ Error saving ${dataType}:`, error);
            return false;
        }
    }

    /**
     * Load data for current user and project
     */
    loadData(dataType, options = {}) {
        if (!this.userId) {
            console.error('❌ Cannot load data: no user ID');
            return [];
        }

        try {
            // Update current project
            this.updateCurrentProject();
            
            const storageKey = this.getStorageKey(dataType);
            const dataJson = localStorage.getItem(storageKey);

            if (!dataJson) {
                console.log(`ℹ️ No ${dataType} found in localStorage`);
                return [];
            }

            const data = JSON.parse(dataJson);

            // Always filter by userId first
            let filtered = Array.isArray(data) 
                ? data.filter(item => !item.userId || item.userId === this.userId)
                : [];

            // Then filter by project (unless it's master or projects collection)
            if (dataType !== 'projects' && options.filterByProject !== false) {
                const projectId = options.projectId || this.currentProjectId;
                
                if (projectId === 'master') {
                    // Master project shows ALL user data
                    console.log(`📊 Loaded ${filtered.length} ${dataType} for user (Master Project - ALL DATA)`);
                } else {
                    // Other projects only show their data
                    const beforeFilter = filtered.length;
                    filtered = filtered.filter(item => 
                        !item.projectId || 
                        item.projectId === projectId || 
                        item.project === projectId
                    );
                    console.log(`📊 Loaded ${filtered.length} ${dataType} for project "${projectId}" (filtered from ${beforeFilter} total)`);
                }
            } else {
                console.log(`📊 Loaded ${filtered.length} ${dataType} for user (no project filter)`);
            }

            return filtered;

        } catch (error) {
            console.error(`❌ Error loading ${dataType}:`, error);
            return [];
        }
    }

    /**
     * Delete data item
     */
    deleteData(dataType, itemId) {
        if (!this.userId) {
            console.error('❌ Cannot delete data: no user ID');
            return false;
        }

        try {
            const data = this.loadData(dataType);
            const filtered = data.filter(item => item.id !== itemId);

            const storageKey = this.getStorageKey(dataType);
            localStorage.setItem(storageKey, JSON.stringify(filtered));

            console.log(`✅ Deleted ${dataType} item: ${itemId}`);

            // Trigger cloud sync
            this.queueForCloudSync(dataType, filtered);

            return true;

        } catch (error) {
            console.error(`❌ Error deleting ${dataType}:`, error);
            return false;
        }
    }

    /**
     * Get storage key for data type
     */
    getStorageKey(dataType) {
        const keyMap = {
            'recipes': `recipes_${this.userId}`,
            'menus': `menus_${this.userId}`,
            'projects': `iterum_projects_${this.userId}`,
            'ingredients': `user_ingredients_${this.userId}`,
            'vendors': `vendors_${this.userId}`,
            'equipment': `equipment_${this.userId}`
        };

        return keyMap[dataType] || `${dataType}_${this.userId}`;
    }

    /**
     * Verify data integrity
     */
    async verifyDataIntegrity() {
        console.log('🔍 Verifying data integrity...');

        const issues = [];

        for (const dataType of this.dataCollections) {
            try {
                const data = this.loadData(dataType, { filterByUser: false });
                
                if (!Array.isArray(data)) {
                    issues.push(`${dataType}: Not an array`);
                    continue;
                }

                // Check each item
                let invalidItems = 0;
                data.forEach(item => {
                    if (!item.id) invalidItems++;
                    if (!item.userId && dataType !== 'ingredients') invalidItems++;
                });

                if (invalidItems > 0) {
                    issues.push(`${dataType}: ${invalidItems} items missing id or userId`);
                    await this.fixDataIntegrity(dataType, data);
                }

            } catch (error) {
                issues.push(`${dataType}: ${error.message}`);
            }
        }

        if (issues.length > 0) {
            console.warn('⚠️ Data integrity issues found:', issues);
        } else {
            console.log('✅ Data integrity verified');
        }
    }

    /**
     * Fix data integrity issues
     */
    async fixDataIntegrity(dataType, data) {
        console.log(`🔧 Fixing ${dataType} integrity...`);

        const fixed = data.map(item => ({
            ...item,
            id: item.id || `${dataType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: item.userId || this.userId,
            userEmail: item.userEmail || this.userEmail,
            lastModified: item.lastModified || new Date().toISOString()
        }));

        const storageKey = this.getStorageKey(dataType);
        localStorage.setItem(storageKey, JSON.stringify(fixed));

        console.log(`✅ Fixed ${fixed.length} ${dataType} items`);
    }

    /**
     * Setup auto-save
     */
    setupAutoSave() {
        console.log('💾 Setting up auto-save...');

        // Listen for data changes
        window.addEventListener('dataChanged', (event) => {
            const { dataType, data } = event.detail;
            if (dataType && data) {
                this.saveData(dataType, data);
            }
        });

        // Periodic backup every 30 seconds
        setInterval(() => {
            this.createLocalBackup();
        }, 30000);

        console.log('✅ Auto-save enabled');
    }

    /**
     * Create local backup
     */
    createLocalBackup() {
        try {
            const backup = {
                userId: this.userId,
                userEmail: this.userEmail,
                timestamp: new Date().toISOString(),
                data: {}
            };

            // Backup all collections
            this.dataCollections.forEach(dataType => {
                const data = this.loadData(dataType);
                if (data && data.length > 0) {
                    backup.data[dataType] = data;
                }
            });

            // Save backup
            const backupKey = `backup_${this.userId}_latest`;
            localStorage.setItem(backupKey, JSON.stringify(backup));

            // Also keep a timestamped backup (keep last 5)
            const timestampedKey = `backup_${this.userId}_${Date.now()}`;
            localStorage.setItem(timestampedKey, JSON.stringify(backup));

            // Clean old backups
            this.cleanOldBackups();

            console.log('💾 Local backup created');

        } catch (error) {
            console.error('❌ Backup error:', error);
        }
    }

    /**
     * Clean old backups (keep last 5)
     */
    cleanOldBackups() {
        const backupKeys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`backup_${this.userId}_`) && key !== `backup_${this.userId}_latest`) {
                backupKeys.push(key);
            }
        }

        // Sort by timestamp (newest first)
        backupKeys.sort().reverse();

        // Remove old backups (keep first 5)
        backupKeys.slice(5).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    /**
     * Restore from backup
     */
    async restoreFromBackup(backupKey = null) {
        try {
            const key = backupKey || `backup_${this.userId}_latest`;
            const backupJson = localStorage.getItem(key);

            if (!backupJson) {
                console.error('❌ No backup found');
                return false;
            }

            const backup = JSON.parse(backupJson);

            // Restore each collection
            Object.entries(backup.data).forEach(([dataType, items]) => {
                this.saveData(dataType, items, { merge: false });
            });

            console.log('✅ Data restored from backup');
            return true;

        } catch (error) {
            console.error('❌ Restore error:', error);
            return false;
        }
    }

    /**
     * Setup cloud sync integration
     */
    setupCloudSync() {
        console.log('☁️ Setting up cloud sync integration...');

        // Listen for cloud sync complete
        window.addEventListener('cloudSyncComplete', () => {
            console.log('✅ Cloud sync complete, data should be current');
        });

        // Trigger initial upload if cloudDataSync available
        if (window.cloudDataSync) {
            setTimeout(() => {
                window.cloudDataSync.syncAllDataToCloud();
            }, 5000);
        }
    }

    /**
     * Queue for cloud sync
     */
    queueForCloudSync(dataType, data) {
        // Trigger cloud sync if available
        if (window.cloudDataSync) {
            const storageKey = this.getStorageKey(dataType);
            window.cloudDataSync.queueForSync(storageKey);
        }
    }

    /**
     * Setup data validation
     */
    setupDataValidation() {
        console.log('🔍 Setting up data validation...');

        // Validate on save
        this.originalSaveData = this.saveData;
        this.saveData = (dataType, data, options = {}) => {
            // Validate data
            const validationResult = this.validateData(dataType, data);
            
            if (!validationResult.valid) {
                console.error(`❌ Data validation failed for ${dataType}:`, validationResult.errors);
                return false;
            }

            // Call original save
            return this.originalSaveData.call(this, dataType, data, options);
        };
    }

    /**
     * Validate data before saving
     */
    validateData(dataType, data) {
        const errors = [];
        const dataArray = Array.isArray(data) ? data : [data];

        dataArray.forEach((item, index) => {
            // Check required fields
            if (!item.id) {
                errors.push(`Item ${index}: Missing ID`);
            }

            // Type-specific validation
            if (dataType === 'recipes') {
                if (!item.name && !item.title) {
                    errors.push(`Recipe ${index}: Missing name/title`);
                }
            }

            if (dataType === 'menus') {
                if (!item.name) {
                    errors.push(`Menu ${index}: Missing name`);
                }
            }

            if (dataType === 'projects') {
                if (!item.name) {
                    errors.push(`Project ${index}: Missing name`);
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Get all data for export
     */
    exportAllUserData() {
        if (!this.userId) return null;

        const exportData = {
            userId: this.userId,
            userEmail: this.userEmail,
            exportedAt: new Date().toISOString(),
            data: {}
        };

        this.dataCollections.forEach(dataType => {
            const data = this.loadData(dataType);
            if (data && data.length > 0) {
                exportData.data[dataType] = data;
            }
        });

        // Create download
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `iterum-data-${this.userEmail}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('✅ Data exported successfully');
        return exportData;
    }

    /**
     * Import data
     */
    async importUserData(file) {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            if (!importData.userId || !importData.data) {
                throw new Error('Invalid import file format');
            }

            // Confirm import
            const dataTypes = Object.keys(importData.data);
            const totalItems = Object.values(importData.data).reduce((sum, arr) => sum + arr.length, 0);

            if (!confirm(`Import ${totalItems} items (${dataTypes.join(', ')}) from ${importData.userEmail}?`)) {
                return false;
            }

            // Import each collection
            let imported = 0;
            Object.entries(importData.data).forEach(([dataType, items]) => {
                this.saveData(dataType, items, { merge: true });
                imported += items.length;
            });

            console.log(`✅ Imported ${imported} items`);
            alert(`✅ Successfully imported ${imported} items!`);

            // Trigger full sync
            if (window.cloudDataSync) {
                window.cloudDataSync.syncAllDataToCloud();
            }

            // Reload page to show new data
            setTimeout(() => {
                location.reload();
            }, 1000);

            return true;

        } catch (error) {
            console.error('❌ Import error:', error);
            alert('❌ Import failed: ' + error.message);
            return false;
        }
    }

    /**
     * Get data statistics
     */
    getDataStats() {
        const stats = {
            userId: this.userId,
            userEmail: this.userEmail,
            collections: {}
        };

        this.dataCollections.forEach(dataType => {
            const data = this.loadData(dataType);
            stats.collections[dataType] = {
                count: data.length,
                lastModified: this.getLastModified(data)
            };
        });

        return stats;
    }

    /**
     * Get last modified timestamp
     */
    getLastModified(data) {
        if (!data || data.length === 0) return null;

        const timestamps = data
            .map(item => item.lastModified || item.updatedAt || item.createdAt)
            .filter(t => t)
            .sort()
            .reverse();

        return timestamps[0] || null;
    }

    /**
     * Clear all user data (use with caution!)
     */
    clearAllUserData(confirm = true) {
        if (confirm && !window.confirm('⚠️ Clear ALL your data? This cannot be undone!')) {
            return false;
        }

        this.dataCollections.forEach(dataType => {
            const storageKey = this.getStorageKey(dataType);
            localStorage.removeItem(storageKey);
        });

        console.log('🗑️ All user data cleared');
        return true;
    }

    /**
     * Migrate data from old storage keys
     */
    migrateOldData() {
        console.log('🔄 Checking for data migration...');

        // Old key patterns to check
        const migrations = [
            { old: 'recipes', new: `recipes_${this.userId}`, type: 'recipes' },
            { old: 'menus', new: `menus_${this.userId}`, type: 'menus' },
            { old: 'iterum_projects', new: `iterum_projects_${this.userId}`, type: 'projects' }
        ];

        let migrated = 0;

        migrations.forEach(({ old, new: newKey, type }) => {
            const oldData = localStorage.getItem(old);
            const newData = localStorage.getItem(newKey);

            // If old data exists and new doesn't, migrate
            if (oldData && !newData) {
                try {
                    const data = JSON.parse(oldData);
                    this.saveData(type, data, { merge: false });
                    migrated++;
                    console.log(`✅ Migrated ${type} from ${old} to ${newKey}`);
                } catch (e) {
                    console.error(`❌ Migration failed for ${type}:`, e);
                }
            }
        });

        if (migrated > 0) {
            console.log(`✅ Migrated ${migrated} collections`);
        } else {
            console.log('ℹ️ No migration needed');
        }
    }

    /**
     * Data recovery tool
     */
    async recoverData() {
        console.log('🔍 Attempting data recovery...');

        // Try to recover from backups
        const backupKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`backup_${this.userId}_`)) {
                backupKeys.push(key);
            }
        }

        if (backupKeys.length === 0) {
            console.log('❌ No backups found');
            
            // Try cloud sync
            if (window.cloudDataSync) {
                await window.cloudDataSync.syncFromCloud();
                console.log('✅ Attempted cloud recovery');
                return true;
            }
            
            return false;
        }

        // Show recovery options
        console.log(`📦 Found ${backupKeys.length} backups`);
        
        // Auto-restore from latest
        const latestBackup = `backup_${this.userId}_latest`;
        if (backupKeys.includes(latestBackup)) {
            await this.restoreFromBackup(latestBackup);
            console.log('✅ Restored from latest backup');
            return true;
        }

        return false;
    }
}

// Global helper functions
window.saveUserData = function(dataType, data, options = {}) {
    if (window.userDataManager) {
        return window.userDataManager.saveData(dataType, data, options);
    }
    console.error('❌ User Data Manager not initialized');
    return false;
};

window.loadUserData = function(dataType, options = {}) {
    if (window.userDataManager) {
        return window.userDataManager.loadData(dataType, options);
    }
    console.error('❌ User Data Manager not initialized');
    return [];
};

window.deleteUserData = function(dataType, itemId) {
    if (window.userDataManager) {
        return window.userDataManager.deleteData(dataType, itemId);
    }
    console.error('❌ User Data Manager not initialized');
    return false;
};

window.getUserDataStats = function() {
    if (window.userDataManager) {
        const stats = window.userDataManager.getDataStats();
        console.table(stats.collections);
        return stats;
    }
    return null;
};

window.exportUserData = function() {
    if (window.userDataManager) {
        return window.userDataManager.exportAllUserData();
    }
    return null;
};

window.recoverUserData = function() {
    if (window.userDataManager) {
        return window.userDataManager.recoverData();
    }
    return false;
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.userDataManager = new UserDataManager();
    });
} else {
    window.userDataManager = new UserDataManager();
}

console.log('✅ User Data Manager script loaded');

