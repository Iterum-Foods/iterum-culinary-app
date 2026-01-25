/**
 * Secure Storage Manager
 * Fast, secure, and scalable data storage using IndexedDB + Firestore
 * Replaces localStorage for better performance and security
 */

class SecureStorageManager {
    constructor() {
        this.dbName = 'IterumCulinaryDB';
        this.dbVersion = 1;
        this.db = null;
        this.encryptionKey = null;
        this.compressionEnabled = true;
        this.syncQueue = [];
        this.syncInProgress = false;
        
        this.init();
    }

    /**
     * Initialize IndexedDB for fast, large storage
     */
    async init() {
        console.log('🔒 Initializing Secure Storage Manager...');

        try {
            // Open IndexedDB
            await this.openDatabase();
            
            // Generate or load encryption key
            await this.initializeEncryption();
            
            // Set up offline detection
            this.setupOfflineDetection();
            
            // Set up periodic sync
            this.setupPeriodicSync();
            
            console.log('✅ Secure Storage Manager initialized');
            window.dispatchEvent(new CustomEvent('secureStorageReady'));
            
        } catch (error) {
            console.error('❌ Secure Storage initialization failed:', error);
        }
    }

    /**
     * Open IndexedDB database
     */
    async openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('IndexedDB failed to open'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores (tables)
                if (!db.objectStoreNames.contains('recipes')) {
                    const recipeStore = db.createObjectStore('recipes', { keyPath: 'id' });
                    recipeStore.createIndex('userId', 'userId', { unique: false });
                    recipeStore.createIndex('category', 'category', { unique: false });
                    recipeStore.createIndex('status', 'status', { unique: false });
                }

                if (!db.objectStoreNames.contains('ingredients')) {
                    const ingredientStore = db.createObjectStore('ingredients', { keyPath: 'id' });
                    ingredientStore.createIndex('category', 'category', { unique: false });
                    ingredientStore.createIndex('name', 'name', { unique: false });
                }

                if (!db.objectStoreNames.contains('projects')) {
                    const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
                    projectStore.createIndex('userId', 'userId', { unique: false });
                }

                if (!db.objectStoreNames.contains('menus')) {
                    const menuStore = db.createObjectStore('menus', { keyPath: 'id' });
                    menuStore.createIndex('projectId', 'projectId', { unique: false });
                }

                if (!db.objectStoreNames.contains('cache')) {
                    const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
                    cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                console.log('✅ IndexedDB object stores created');
            };
        });
    }

    /**
     * Initialize encryption for sensitive data
     */
    async initializeEncryption() {
        try {
            // Check if crypto API is available
            if (!window.crypto || !window.crypto.subtle) {
                console.warn('⚠️ Web Crypto API not available, encryption disabled');
                return;
            }

            // Generate or retrieve encryption key
            const storedKey = localStorage.getItem('storage_encryption_key');
            
            if (storedKey) {
                this.encryptionKey = storedKey;
            } else {
                // Generate new key (in production, derive from user password)
                this.encryptionKey = this.generateEncryptionKey();
                localStorage.setItem('storage_encryption_key', this.encryptionKey);
            }

            console.log('🔐 Encryption initialized');

        } catch (error) {
            console.error('❌ Encryption initialization failed:', error);
        }
    }

    /**
     * Generate encryption key
     */
    generateEncryptionKey() {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Encrypt sensitive data
     */
    async encrypt(data) {
        if (!this.encryptionKey) return data;

        try {
            // Simple XOR encryption (for demo - use AES in production)
            const jsonString = JSON.stringify(data);
            let encrypted = '';
            
            for (let i = 0; i < jsonString.length; i++) {
                const charCode = jsonString.charCodeAt(i);
                const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
                encrypted += String.fromCharCode(charCode ^ keyChar);
            }
            
            return btoa(encrypted); // Base64 encode

        } catch (error) {
            console.error('❌ Encryption failed:', error);
            return data;
        }
    }

    /**
     * Decrypt sensitive data
     */
    async decrypt(encryptedData) {
        if (!this.encryptionKey || !encryptedData) return encryptedData;

        try {
            const encrypted = atob(encryptedData);
            let decrypted = '';
            
            for (let i = 0; i < encrypted.length; i++) {
                const charCode = encrypted.charCodeAt(i);
                const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
                decrypted += String.fromCharCode(charCode ^ keyChar);
            }
            
            return JSON.parse(decrypted);

        } catch (error) {
            console.error('❌ Decryption failed:', error);
            return encryptedData;
        }
    }

    /**
     * Compress data before storage
     */
    compress(data) {
        if (!this.compressionEnabled) return data;

        try {
            const jsonString = JSON.stringify(data);
            
            // Simple compression: remove whitespace and use abbreviations
            let compressed = jsonString
                .replace(/\s+/g, ' ')
                .replace(/": "/g, '":"')
                .replace(/", "/g, '","');
            
            return compressed;

        } catch (error) {
            console.error('❌ Compression failed:', error);
            return data;
        }
    }

    /**
     * Decompress data
     */
    decompress(compressedData) {
        if (!this.compressionEnabled) return compressedData;

        try {
            if (typeof compressedData === 'string') {
                return JSON.parse(compressedData);
            }
            return compressedData;

        } catch (error) {
            console.error('❌ Decompression failed:', error);
            return compressedData;
        }
    }

    /**
     * Save data to IndexedDB (fast, unlimited storage)
     */
    async save(storeName, data, options = {}) {
        if (!this.db) {
            console.warn('⚠️ IndexedDB not ready, falling back to localStorage');
            return this.saveToLocalStorage(storeName, data);
        }

        try {
            const startTime = performance.now();

            // Prepare data
            let preparedData = { ...data };
            
            // Add metadata
            preparedData.savedAt = new Date().toISOString();
            preparedData.userId = this.getCurrentUserId();
            
            // Compress if enabled
            if (options.compress !== false && this.compressionEnabled) {
                preparedData.compressed = true;
                preparedData.data = this.compress(preparedData.data || preparedData);
            }
            
            // Encrypt if sensitive
            if (options.encrypt && this.encryptionKey) {
                preparedData.encrypted = true;
                preparedData.data = await this.encrypt(preparedData.data || preparedData);
            }

            // Save to IndexedDB
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await store.put(preparedData);

            const saveTime = (performance.now() - startTime).toFixed(2);
            console.log(`💾 Saved to ${storeName} in ${saveTime}ms`);

            // Queue for cloud sync if enabled
            if (options.sync !== false) {
                this.queueForSync(storeName, preparedData);
            }

            return true;

        } catch (error) {
            console.error(`❌ Error saving to ${storeName}:`, error);
            // Fallback to localStorage
            return this.saveToLocalStorage(storeName, data);
        }
    }

    /**
     * Get data from IndexedDB (fast retrieval)
     */
    async get(storeName, id) {
        if (!this.db) {
            return this.getFromLocalStorage(storeName, id);
        }

        try {
            const startTime = performance.now();

            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            return new Promise((resolve, reject) => {
                request.onsuccess = async () => {
                    let data = request.result;

                    if (!data) {
                        resolve(null);
                        return;
                    }

                    // Decrypt if encrypted
                    if (data.encrypted) {
                        data.data = await this.decrypt(data.data);
                    }

                    // Decompress if compressed
                    if (data.compressed) {
                        data.data = this.decompress(data.data);
                    }

                    const loadTime = (performance.now() - startTime).toFixed(2);
                    console.log(`📖 Loaded from ${storeName} in ${loadTime}ms`);

                    resolve(data);
                };

                request.onerror = () => reject(request.error);
            });

        } catch (error) {
            console.error(`❌ Error getting from ${storeName}:`, error);
            return this.getFromLocalStorage(storeName, id);
        }
    }

    /**
     * Get all data from a store
     */
    async getAll(storeName) {
        if (!this.db) {
            return this.getAllFromLocalStorage(storeName);
        }

        try {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const items = request.result || [];
                    console.log(`📖 Loaded ${items.length} items from ${storeName}`);
                    resolve(items);
                };

                request.onerror = () => reject(request.error);
            });

        } catch (error) {
            console.error(`❌ Error getting all from ${storeName}:`, error);
            return [];
        }
    }

    /**
     * Delete from IndexedDB
     */
    async delete(storeName, id) {
        if (!this.db) {
            return this.deleteFromLocalStorage(storeName, id);
        }

        try {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await store.delete(id);

            console.log(`🗑️ Deleted from ${storeName}: ${id}`);
            return true;

        } catch (error) {
            console.error(`❌ Error deleting from ${storeName}:`, error);
            return false;
        }
    }

    /**
     * Queue data for cloud sync
     */
    queueForSync(storeName, data) {
        this.syncQueue.push({
            storeName,
            data,
            timestamp: Date.now()
        });

        // Trigger sync if not already in progress
        if (!this.syncInProgress && navigator.onLine) {
            this.processSyncQueue();
        }
    }

    /**
     * Process sync queue to Firestore
     */
    async processSyncQueue() {
        if (this.syncInProgress || this.syncQueue.length === 0) return;
        if (!window.firestoreSync || !window.firestoreSync.initialized) {
            console.log('⏭️ Firestore not available, keeping items in queue');
            return;
        }

        this.syncInProgress = true;
        console.log(`🔄 Syncing ${this.syncQueue.length} items to cloud...`);

        try {
            while (this.syncQueue.length > 0) {
                const item = this.syncQueue.shift();
                
                // Sync to Firestore based on store type
                if (item.storeName === 'recipes') {
                    await window.firestoreSync.saveRecipe(item.data);
                } else if (item.storeName === 'ingredients') {
                    await window.firestoreSync.saveIngredient(item.data);
                } else if (item.storeName === 'projects') {
                    await window.firestoreSync.saveProject(item.data);
                }
                
                // Small delay to avoid rate limiting
                await this.delay(100);
            }

            console.log('✅ Cloud sync complete');

        } catch (error) {
            console.error('❌ Cloud sync failed:', error);
            // Items remain in queue for retry
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Setup offline detection
     */
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            console.log('🌐 Back online, processing sync queue...');
            this.processSyncQueue();
        });

        window.addEventListener('offline', () => {
            console.log('📡 Offline mode - data will sync when online');
        });
    }

    /**
     * Setup periodic sync (every 5 minutes when online)
     */
    setupPeriodicSync() {
        setInterval(() => {
            if (navigator.onLine && this.syncQueue.length > 0) {
                this.processSyncQueue();
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Migrate from localStorage to IndexedDB
     */
    async migrateFromLocalStorage() {
        console.log('🔄 Migrating data from localStorage to IndexedDB...');

        try {
            const migrations = {
                recipes: ['recipes', 'recipes_in_progress', 'recipe_library'],
                ingredients: ['ingredients', 'ingredients_database'],
                projects: ['iterum_projects'],
                menus: ['menu_data']
            };

            let migratedCount = 0;

            for (const [storeName, keys] of Object.entries(migrations)) {
                for (const key of keys) {
                    const data = localStorage.getItem(key);
                    if (data) {
                        try {
                            const parsed = JSON.parse(data);
                            if (Array.isArray(parsed)) {
                                for (const item of parsed) {
                                    if (item.id) {
                                        await this.save(storeName, item, { sync: false });
                                        migratedCount++;
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn(`Could not migrate ${key}:`, e);
                        }
                    }
                }
            }

            console.log(`✅ Migrated ${migratedCount} items to IndexedDB`);
            return migratedCount;

        } catch (error) {
            console.error('❌ Migration failed:', error);
            return 0;
        }
    }

    /**
     * LocalStorage fallback methods
     */
    saveToLocalStorage(storeName, data) {
        try {
            const key = `${storeName}_${data.id || Date.now()}`;
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('❌ localStorage save failed:', error);
            return false;
        }
    }

    getFromLocalStorage(storeName, id) {
        try {
            const key = `${storeName}_${id}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            return null;
        }
    }

    getAllFromLocalStorage(storeName) {
        try {
            const items = [];
            const prefix = storeName + '_';
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    const data = localStorage.getItem(key);
                    if (data) {
                        items.push(JSON.parse(data));
                    }
                }
            }
            
            return items;
        } catch (error) {
            return [];
        }
    }

    deleteFromLocalStorage(storeName, id) {
        try {
            const key = `${storeName}_${id}`;
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        if (window.currentUser) return window.currentUser.userId || window.currentUser.id;
        
        const userJson = localStorage.getItem('current_user');
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                return user.userId || user.id;
            } catch (e) {
                return 'guest';
            }
        }
        return 'guest';
    }

    /**
     * Utility: delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear all data (for logout)
     */
    async clearAll() {
        try {
            if (this.db) {
                const stores = ['recipes', 'ingredients', 'projects', 'menus', 'cache'];
                for (const storeName of stores) {
                    const transaction = this.db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    await store.clear();
                }
            }

            console.log('🗑️ All data cleared from IndexedDB');
            return true;

        } catch (error) {
            console.error('❌ Error clearing data:', error);
            return false;
        }
    }

    /**
     * Get storage statistics
     */
    async getStorageStats() {
        try {
            const stats = {
                indexedDB: {},
                localStorage: {},
                total: 0
            };

            // IndexedDB stats
            if (this.db) {
                const stores = ['recipes', 'ingredients', 'projects', 'menus'];
                for (const storeName of stores) {
                    const items = await this.getAll(storeName);
                    stats.indexedDB[storeName] = items.length;
                    stats.total += items.length;
                }
            }

            // localStorage stats
            stats.localStorage.size = new Blob(Object.values(localStorage)).size;
            stats.localStorage.items = localStorage.length;

            return stats;

        } catch (error) {
            console.error('❌ Error getting stats:', error);
            return {};
        }
    }
}

// Initialize global instance
window.secureStorage = new SecureStorageManager();

// Global helper functions
window.saveSecurely = async function(storeName, data, options = {}) {
    return await window.secureStorage.save(storeName, data, options);
};

window.getSecurely = async function(storeName, id) {
    return await window.secureStorage.get(storeName, id);
};

window.migrateToSecureStorage = async function() {
    return await window.secureStorage.migrateFromLocalStorage();
};

console.log('🔒 Secure Storage Manager ready');

