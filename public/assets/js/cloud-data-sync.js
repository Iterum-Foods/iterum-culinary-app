/**
 * Cloud Data Sync - Automatic synchronization between localStorage and Firestore
 * Ensures data appears on all devices
 */

class CloudDataSync {
    constructor() {
        this.userId = null;
        this.syncEnabled = true;
        this.lastSyncTime = null;
        this.syncQueue = [];
        this.isSyncing = false;
        
        this.init();
    }

    /**
     * Initialize cloud sync
     */
    async init() {
        console.log('☁️ Initializing Cloud Data Sync...');
        
        // Wait for Firebase and auth
        await this.waitForAuth();
        
        // Set up automatic sync
        this.setupAutoSync();
        
        // Initial sync from cloud
        await this.syncFromCloud();
        
        // Set up localStorage listeners
        this.setupLocalStorageListeners();
        
        console.log('✅ Cloud Data Sync initialized');
    }

    /**
     * Wait for authentication
     */
    async waitForAuth() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.authManager?.currentUser && window.firebase?.firestore) {
                    this.userId = window.authManager.currentUser.userId || window.authManager.currentUser.id;
                    this.db = window.firebase.firestore();
                    console.log('✅ Cloud sync ready for user:', this.userId);
                    resolve();
                } else {
                    setTimeout(check, 200);
                }
            };
            check();
        });
    }

    /**
     * Sync from cloud to local
     */
    async syncFromCloud() {
        if (!this.userId || !this.db) {
            console.warn('⚠️ Cannot sync from cloud: not authenticated');
            return;
        }

        console.log('⬇️ Syncing data from cloud to this device...');
        this.showSyncNotification('⬇️ Downloading from cloud...', 'info');

        try {
            let totalSynced = 0;
            
            // Sync recipes
            const recipesCount = await this.syncCollectionFromCloud('recipes', `recipes_${this.userId}`);
            totalSynced += recipesCount;
            
            // Sync menus
            const menusCount = await this.syncCollectionFromCloud('menus', `menus_${this.userId}`);
            totalSynced += menusCount;
            
            // Sync projects
            const projectsCount = await this.syncCollectionFromCloud('projects', `iterum_projects_${this.userId}`);
            totalSynced += projectsCount;
            
            // Sync ingredients (user-specific additions)
            const ingredientsCount = await this.syncCollectionFromCloud('ingredients', `user_ingredients_${this.userId}`);
            totalSynced += ingredientsCount;
            
            // Sync vendors
            const vendorsCount = await this.syncCollectionFromCloud('vendors', 'vendors');
            totalSynced += vendorsCount;
            
            // Sync equipment
            const equipmentCount = await this.syncCollectionFromCloud('equipment', `equipment_${this.userId}`);
            totalSynced += equipmentCount;
            
            this.lastSyncTime = Date.now();
            localStorage.setItem('last_cloud_sync', this.lastSyncTime.toString());
            
            console.log(`✅ Cloud sync complete - Downloaded ${totalSynced} items`);
            
            if (totalSynced > 0) {
                this.showSyncNotification(`✅ Downloaded ${totalSynced} items from cloud`);
            }
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('cloudSyncComplete', {
                detail: { itemsDownloaded: totalSynced }
            }));
            
        } catch (error) {
            console.error('❌ Cloud sync error:', error);
            this.showSyncNotification('❌ Cloud sync failed', 'error');
        }
    }

    /**
     * Sync a collection from cloud to localStorage
     */
    async syncCollectionFromCloud(firestoreCollection, localStorageKey) {
        try {
            console.log(`⬇️ Downloading ${firestoreCollection} from cloud...`);
            
            const snapshot = await this.db.collection(firestoreCollection)
                .where('userId', '==', this.userId)
                .get();

            if (snapshot.empty) {
                console.log(`ℹ️ No ${firestoreCollection} found in cloud for this user`);
                return 0;
            }

            const items = [];
            snapshot.forEach(doc => {
                items.push({ id: doc.id, ...doc.data() });
            });

            // Merge with existing local data (don't overwrite everything)
            const existingJson = localStorage.getItem(localStorageKey);
            let existingItems = [];
            if (existingJson) {
                try {
                    existingItems = JSON.parse(existingJson);
                } catch (e) {
                    console.warn('Could not parse existing data, will replace');
                }
            }

            // Merge: cloud items override local items with same ID
            const mergedMap = new Map();
            
            // Add existing items
            existingItems.forEach(item => mergedMap.set(item.id, item));
            
            // Override with cloud items (newer)
            items.forEach(item => mergedMap.set(item.id, item));
            
            const mergedItems = Array.from(mergedMap.values());

            localStorage.setItem(localStorageKey, JSON.stringify(mergedItems));
            console.log(`✅ Synced ${items.length} ${firestoreCollection} from cloud (${mergedItems.length} total after merge)`);

            return items.length;

        } catch (error) {
            console.error(`❌ Error syncing ${firestoreCollection}:`, error);
            return 0;
        }
    }

    /**
     * Sync to cloud (localStorage → Firestore)
     */
    async syncToCloud(dataType, localStorageKey) {
        if (!this.userId || !this.db) {
            console.warn('⚠️ Cannot sync to cloud: not authenticated');
            return 0;
        }

        try {
            const dataJson = localStorage.getItem(localStorageKey);
            if (!dataJson) {
                console.log(`ℹ️ No ${dataType} to sync (empty)`);
                return 0;
            }

            const items = JSON.parse(dataJson);
            if (!Array.isArray(items) || items.length === 0) {
                console.log(`ℹ️ No ${dataType} to sync (0 items)`);
                return 0;
            }

            console.log(`⬆️ Uploading ${items.length} ${dataType} to cloud...`);

            const batch = this.db.batch();
            let count = 0;
            let totalUploaded = 0;

            for (const item of items) {
                // Ensure userId is set
                item.userId = this.userId;
                item.userEmail = this.userEmail || window.authManager?.currentUser?.email;
                item.syncedAt = new Date().toISOString();

                const docRef = this.db.collection(dataType).doc(item.id);
                batch.set(docRef, item, { merge: true });
                count++;
                totalUploaded++;

                // Firestore batch limit is 500
                if (count >= 500) {
                    await batch.commit();
                    console.log(`✅ Batch of ${count} ${dataType} uploaded`);
                    count = 0;
                }
            }

            if (count > 0) {
                await batch.commit();
                console.log(`✅ Final batch: ${count} ${dataType} uploaded`);
            }

            console.log(`✅ Total uploaded: ${totalUploaded} ${dataType}`);
            return totalUploaded;

        } catch (error) {
            console.error(`❌ Error syncing ${dataType} to cloud:`, error);
            return 0;
        }
    }

    /**
     * Setup automatic sync
     */
    setupAutoSync() {
        console.log('🔄 Setting up automatic cloud sync...');

        // IMMEDIATE sync every 30 seconds
        setInterval(() => {
            if (this.syncEnabled && !this.isSyncing) {
                this.syncAllDataToCloud();
            }
        }, 30000); // 30 seconds (more frequent)

        // Sync on page visibility change (when returning to tab)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👁️ Tab visible, syncing...');
                this.syncFromCloud(); // Download first
                setTimeout(() => this.syncAllDataToCloud(), 1000); // Then upload
            }
        });

        // Sync before page unload (ensure data is uploaded)
        window.addEventListener('beforeunload', () => {
            if (this.syncQueue.length > 0 || true) { // Always sync on exit
                // Use sendBeacon for reliable sync on page close
                this.syncAllDataToCloudImmediate();
            }
        });

        // Sync on page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                console.log('📄 Page loaded, syncing from cloud...');
                this.syncFromCloud();
            }, 2000);
        });

        console.log('✅ Auto-sync enabled (every 30 seconds + on all triggers)');
    }

    /**
     * Sync all data to cloud
     */
    async syncAllDataToCloud() {
        if (this.isSyncing) {
            console.log('⏳ Sync already in progress, queuing...');
            return;
        }

        this.isSyncing = true;
        console.log('⬆️ Uploading all data to cloud...');

        try {
            let totalUploaded = 0;
            
            // Sync all collections
            totalUploaded += await this.syncToCloud('recipes', `recipes_${this.userId}`);
            totalUploaded += await this.syncToCloud('menus', `menus_${this.userId}`);
            totalUploaded += await this.syncToCloud('projects', `iterum_projects_${this.userId}`);
            totalUploaded += await this.syncToCloud('equipment', `equipment_${this.userId}`);
            totalUploaded += await this.syncToCloud('vendors', 'vendors');
            
            // Update sync time
            this.lastSyncTime = Date.now();
            localStorage.setItem('last_cloud_sync', this.lastSyncTime.toString());
            
            console.log(`✅ All data synced to cloud - Uploaded ${totalUploaded} items`);
            
            if (totalUploaded > 0) {
                this.showSyncNotification(`✅ Uploaded ${totalUploaded} items to cloud`);
            }

        } catch (error) {
            console.error('❌ Cloud sync error:', error);
            this.showSyncNotification('❌ Sync failed', 'error');
        } finally {
            this.isSyncing = false;
        }
    }
    
    /**
     * Immediate sync (for page unload)
     */
    syncAllDataToCloudImmediate() {
        if (!this.userId || !this.db) return;
        
        // Use sendBeacon for reliable sync on page close
        const data = {
            userId: this.userId,
            recipes: localStorage.getItem(`recipes_${this.userId}`),
            menus: localStorage.getItem(`menus_${this.userId}`),
            projects: localStorage.getItem(`iterum_projects_${this.userId}`),
            timestamp: new Date().toISOString()
        };
        
        // Try to send via fetch with keepalive
        fetch(`https://firestore.googleapis.com/v1/projects/iterum-culinary-app2/databases/(default)/documents:commit`, {
            method: 'POST',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(() => {
            console.log('⚠️ Immediate sync may not have completed');
        });
        
        console.log('⚡ Immediate sync triggered');
    }

    /**
     * Setup localStorage listeners to detect changes
     */
    setupLocalStorageListeners() {
        console.log('📡 Setting up localStorage listeners for instant sync...');
        
        // Override localStorage.setItem to detect changes
        const originalSetItem = localStorage.setItem.bind(localStorage);
        const self = this;
        
        localStorage.setItem = function(key, value) {
            // Call original
            originalSetItem(key, value);
            
            // IMMEDIATE sync if it's user data
            if (self.isUserDataKey(key)) {
                console.log(`💾 Data changed: ${key}, triggering cloud upload...`);
                self.queueForSync(key);
            }
        };

        console.log('✅ localStorage listeners active - instant cloud sync on save');
    }

    /**
     * Check if key is user data that should sync
     */
    isUserDataKey(key) {
        return key.includes('recipes_') || 
               key.includes('menus_') || 
               key.includes('iterum_projects_') ||
               key.includes('equipment_') ||
               key === 'vendors';
    }

    /**
     * Queue item for sync
     */
    queueForSync(key) {
        if (!this.syncQueue.includes(key)) {
            this.syncQueue.push(key);
            console.log(`📝 Queued for cloud upload: ${key}`);
        }

        // IMMEDIATE sync - only wait 2 seconds after last change (reduced from 5)
        clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => {
            console.log('⚡ Processing sync queue NOW...');
            this.processSyncQueue();
        }, 2000); // 2 seconds (much faster)
    }

    /**
     * Process sync queue
     */
    async processSyncQueue() {
        if (this.syncQueue.length === 0 || this.isSyncing) return;

        console.log(`⬆️ Processing sync queue (${this.syncQueue.length} items)...`);

        const keysToSync = [...this.syncQueue];
        this.syncQueue = [];

        for (const key of keysToSync) {
            await this.syncSingleKey(key);
        }

        console.log('✅ Sync queue processed');
    }

    /**
     * Sync a single localStorage key to cloud
     */
    async syncSingleKey(key) {
        try {
            const dataType = this.getDataTypeFromKey(key);
            if (dataType) {
                await this.syncToCloud(dataType, key);
            }
        } catch (error) {
            console.error(`❌ Error syncing ${key}:`, error);
        }
    }

    /**
     * Get Firestore collection name from localStorage key
     */
    getDataTypeFromKey(key) {
        if (key.includes('recipes_')) return 'recipes';
        if (key.includes('menus_')) return 'menus';
        if (key.includes('iterum_projects_')) return 'projects';
        if (key.includes('equipment_')) return 'equipment';
        if (key === 'vendors') return 'vendors';
        return null;
    }

    /**
     * Setup offline detection
     */
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            console.log('🌐 Back online, syncing...');
            this.syncAllDataToCloud();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Offline mode - changes will sync when back online');
        });
    }

    /**
     * Setup periodic sync
     */
    setupPeriodicSync() {
        // Sync every 5 minutes
        setInterval(() => {
            if (navigator.onLine && !this.isSyncing) {
                this.syncFromCloud();
            }
        }, 300000); // 5 minutes
    }

    /**
     * Show sync notification
     */
    showSyncNotification(message, type = 'success') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? '#10b981' : '#ef4444';
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 99999;
            font-weight: 600;
            font-size: 14px;
            animation: slideInUp 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutDown 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Manual sync trigger
     */
    async manualSync() {
        console.log('🔄 Manual sync triggered...');
        this.showSyncNotification('☁️ Syncing...', 'info');
        
        await this.syncAllDataToCloud();
        await this.syncFromCloud();
        
        this.showSyncNotification('✅ Sync complete!');
    }

    /**
     * Get sync status
     */
    getSyncStatus() {
        const lastSync = localStorage.getItem('last_cloud_sync');
        const lastSyncDate = lastSync ? new Date(parseInt(lastSync)) : null;
        
        return {
            enabled: this.syncEnabled,
            lastSync: lastSyncDate,
            queueLength: this.syncQueue.length,
            isSyncing: this.isSyncing,
            online: navigator.onLine
        };
    }
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cloudDataSync = new CloudDataSync();
    });
} else {
    window.cloudDataSync = new CloudDataSync();
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slideOutDown {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(100px); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('✅ Cloud Data Sync script loaded');

