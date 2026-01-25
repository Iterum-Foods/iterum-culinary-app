/**
 * Firestore Sync Service
 * Syncs user data between localStorage and Firebase Firestore
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs,
    updateDoc,
    deleteDoc,
    orderBy,
    limit,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class FirestoreSync {
    constructor() {
        this.db = null;
        this.initialized = false;
        // Don't call init in constructor - will be called externally
    }

    normalizeId(source, fallback = 'local-testing') {
        if (!source) return fallback;
        return String(source).replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    resolveUserId(explicitUserId) {
        if (explicitUserId) {
            return this.normalizeId(explicitUserId);
        }

        const authUser = window.authManager?.currentUser;
        if (authUser) {
            return this.normalizeId(authUser.id || authUser.uid || authUser.userId || authUser.email);
        }

        const stored = localStorage.getItem('current_user');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed?.id || parsed?.userId || parsed?.email) {
                    return this.normalizeId(parsed.id || parsed.userId || parsed.email);
                }
            } catch (error) {
                console.warn('⚠️ Unable to parse stored user for Firestore sync:', error);
            }
        }

        return 'local-testing';
    }

    resolveProjectId(explicitProjectId) {
        if (explicitProjectId) return this.normalizeId(explicitProjectId, 'master');

        const projectManager = window.projectManager;
        if (projectManager?.currentProject?.id) {
            return this.normalizeId(projectManager.currentProject.id, 'master');
        }
        if (projectManager?.masterProjectId) {
            return this.normalizeId(projectManager.masterProjectId, 'master');
        }

        const stored = localStorage.getItem('active_project');
        if (stored) {
            return this.normalizeId(stored, 'master');
        }

        return 'master';
    }

    sanitizeForFirestore(data, fallback) {
        const source = data !== undefined ? data : fallback;
        try {
            return JSON.parse(JSON.stringify(source));
        } catch (error) {
            console.warn('⚠️ Unable to sanitize data for Firestore, using fallback.', error);
            return fallback;
        }
    }

    async ensureProjectDoc(projectId, metadata = {}) {
        if (!this.initialized) return null;
        const projectRef = doc(this.db, 'projects', projectId);
        const enriched = {
            projectId,
            updatedAt: serverTimestamp(),
            ...this.deriveProjectMetadata(metadata),
        };
        const payload = {
            ...enriched,
        };
        await setDoc(projectRef, payload, { merge: true });
        return projectRef;
    }
 
    async init() {
        if (this.initialized) {
            console.log('✅ Firestore already initialized');
            return;
        }
        
        try {
            console.log('🔥 Initializing Firestore...');
            
            // Get Firebase config (should be loaded by firebase-config.js already)
            const config = window.firebaseConfig;
            
            if (!config) {
                console.warn('⚠️ Firebase config not found - Firestore will not be available');
                console.log('Make sure firebase-config.js is loaded before firestore-sync.js');
                return; // Don't throw, just return - Firestore optional
            }
            
            console.log('✅ Firebase config found:', config.projectId);
            
            // Initialize Firebase app (if not already initialized)
            let app;
            try {
                app = initializeApp(config);
            } catch (e) {
                // App might already be initialized
                const { getApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
                app = getApp();
            }
            
            // Initialize Firestore
            this.db = getFirestore(app);
            this.initialized = true;
            
            console.log('✅ Firestore initialized successfully');
            console.log('📊 Database:', config.projectId);
            
            // Make globally available
            window.firestoreDB = this.db;
            window.firestoreSync = this;
            
        } catch (error) {
            console.error('❌ Firestore initialization failed:', error);
            this.initialized = false;
        }
    }

    async saveRecipeLibrarySnapshot(library, options = {}) {
        if (!this.initialized) {
            console.warn('⚠️ Firestore not initialized, skipping recipe library sync');
            return false;
        }

        const userId = this.resolveUserId(options.userId);
        if (!userId) {
            console.warn('⚠️ No user ID available for recipe library sync');
            return false;
        }

        try {
            const userRef = doc(this.db, 'users', userId);
            await setDoc(userRef, {
                userId,
                lastRecipeSync: serverTimestamp(),
            }, { merge: true });

            const snapshotRef = doc(collection(userRef, 'snapshots'), 'recipeLibrary');
            const maxRecipes = options.maxRecipes || 200;
            const libraryArray = Array.isArray(library) ? library : [];
            const trimmed = libraryArray.slice(0, maxRecipes);
            const payload = {
                recipes: this.sanitizeForFirestore(trimmed, []),
                count: trimmed.length,
                fullCount: libraryArray.length,
                syncedAt: new Date().toISOString(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(snapshotRef, payload, { merge: true });
            console.log(`✅ Recipe library snapshot synced (${payload.count}/${payload.fullCount})`);
            return true;
        } catch (error) {
            console.error('❌ Error saving recipe library snapshot:', error);
            return false;
        }
    }

    async saveMenuSnapshot(payload = {}) {
        if (!this.initialized) {
            console.warn('⚠️ Firestore not initialized, skipping menu sync');
            return false;
        }

        const projectId = this.resolveProjectId(payload.projectId);
        if (!projectId) {
            console.warn('⚠️ Unable to resolve project ID for menu sync');
            return false;
        }

        try {
            const userId = this.resolveUserId(payload.userId);
            const projectRef = await this.ensureProjectDoc(projectId, {
                ownerId: userId,
            });

            if (!projectRef) {
                return false;
            }

            const menuId = this.normalizeId(payload.menu?.id, 'primary');
            const menuRef = doc(collection(projectRef, 'menus'), menuId);

            const sanitizedMenu = this.sanitizeForFirestore(payload.menu || {}, {});
            const sanitizedItems = this.sanitizeForFirestore(payload.items || [], []);
            const sanitizedLinks = this.sanitizeForFirestore(payload.links || {}, {});

            const metadata = {
                menu: sanitizedMenu,
                items: sanitizedItems,
                links: sanitizedLinks,
                itemCount: Array.isArray(sanitizedItems) ? sanitizedItems.length : 0,
                updatedBy: userId,
                syncedAt: new Date().toISOString(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(menuRef, metadata, { merge: true });
            console.log(`✅ Menu snapshot synced for project ${projectId} (menu ${menuId})`);
            return true;
        } catch (error) {
            console.error('❌ Error saving menu snapshot:', error);
            return false;
        }
    }

    async fetchLatestMenuSnapshot(projectId, options = {}) {
        if (!this.initialized) {
            return null;
        }

        try {
            const resolvedProjectId = this.resolveProjectId(projectId);
            const projectRef = doc(this.db, 'projects', resolvedProjectId);
            const menuId = this.normalizeId(options.menuId || options.menu?.id || 'primary');
            const menuRef = doc(collection(projectRef, 'menus'), menuId);
            const snap = await getDoc(menuRef);
            if (!snap.exists()) {
                return null;
            }

            const data = snap.data();
            const deserialized = this.deserializeTimestamps({
                id: menuId,
                projectId: resolvedProjectId,
                ...data,
            });
            return deserialized;
        } catch (error) {
            console.warn('⚠️ Unable to fetch menu snapshot:', error.message || error);
            return null;
        }
    }

    async fetchRecipeLibrarySnapshot(userId) {
        if (!this.initialized) {
            return null;
        }

        try {
            const resolvedUserId = this.resolveUserId(userId);
            const userRef = doc(this.db, 'users', resolvedUserId);
            const snapshotRef = doc(collection(userRef, 'snapshots'), 'recipeLibrary');
            const snap = await getDoc(snapshotRef);
            if (!snap.exists()) {
                return null;
            }

            const data = snap.data();
            return this.deserializeTimestamps({
                userId: resolvedUserId,
                ...data,
            });
        } catch (error) {
            console.warn('⚠️ Unable to fetch recipe library snapshot:', error.message || error);
            return null;
        }
    }
 
    /**
     * Save user to Firestore
     */
    async saveUser(userData) {
        if (!this.initialized) {
            console.warn('⚠️ Firestore not initialized, skipping cloud save');
            return false;
        }
        
        try {
            console.log('💾 Saving user to Firestore:', userData.email);
            
            const userId = userData.id || userData.userId || userData.email.replace(/[^a-zA-Z0-9]/g, '_');
            const userRef = doc(this.db, 'users', userId);
            
            const firestoreData = {
                // Profile
                name: userData.name || '',
                email: userData.email || '',
                userId: userId,
                
                // Account info
                type: userData.type || 'email',
                createdAt: userData.createdAt || new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                
                // Optional fields
                company: userData.company || null,
                role: userData.role || null,
                source: userData.source || null,
                photoURL: userData.photoURL || null,
                
                // Trial info (if applicable)
                ...(userData.type === 'trial' && {
                    trial: {
                        startDate: userData.trialStartDate || new Date().toISOString(),
                        endDate: userData.trialEndDate || new Date(Date.now() + 14*24*60*60*1000).toISOString(),
                        daysRemaining: userData.trialDaysRemaining || 14,
                        isActive: true
                    }
                }),
                
                // Metadata
                updatedAt: serverTimestamp()
            };
            
            await setDoc(userRef, firestoreData, { merge: true });
            
            console.log('✅ User saved to Firestore successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error saving to Firestore:', error);
            return false;
        }
    }
    
    /**
     * Get user from Firestore
     */
    async getUser(userId) {
        if (!this.initialized) {
            console.warn('⚠️ Firestore not initialized');
            return null;
        }
        
        try {
            const userRef = doc(this.db, 'users', userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                console.log('✅ User found in Firestore');
                return userSnap.data();
            } else {
                console.log('⚠️ User not found in Firestore');
                return null;
            }
        } catch (error) {
            console.error('❌ Error getting user from Firestore:', error);
            return null;
        }
    }
    
    /**
     * Get all users from Firestore
     */
    async getAllUsers() {
        if (!this.initialized) {
            console.warn('⚠️ Firestore not initialized');
            return [];
        }
        
        try {
            console.log('📊 Fetching all users from Firestore...');
            
            const usersRef = collection(this.db, 'users');
            const querySnapshot = await getDocs(usersRef);
            
            const users = [];
            querySnapshot.forEach((doc) => {
                users.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log('✅ Fetched', users.length, 'users from Firestore');
            return users;
            
        } catch (error) {
            console.error('❌ Error fetching users from Firestore:', error);
            return [];
        }
    }
    
    /**
     * Get trial users from Firestore
     */
    async getTrialUsers() {
        if (!this.initialized) {
            console.warn('⚠️ Firestore not initialized');
            return [];
        }
        
        try {
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, where('type', '==', 'trial'));
            const querySnapshot = await getDocs(q);
            
            const users = [];
            querySnapshot.forEach((doc) => {
                users.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log('✅ Fetched', users.length, 'trial users from Firestore');
            return users;
            
        } catch (error) {
            console.error('❌ Error fetching trial users:', error);
            return [];
        }
    }
    
    /**
     * Update user in Firestore
     */
    async updateUser(userId, updates) {
        if (!this.initialized) {
            console.warn('⚠️ Firestore not initialized');
            return false;
        }
        
        try {
            const userRef = doc(this.db, 'users', userId);
            await updateDoc(userRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            
            console.log('✅ User updated in Firestore');
            return true;
            
        } catch (error) {
            console.error('❌ Error updating user:', error);
            return false;
        }
    }
    
    /**
     * Delete user from Firestore
     */
    async deleteUser(userId) {
        if (!this.initialized) {
            console.warn('⚠️ Firestore not initialized');
            return false;
        }
        
        try {
            const userRef = doc(this.db, 'users', userId);
            await deleteDoc(userRef);
            
            console.log('✅ User deleted from Firestore');
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting user:', error);
            return false;
        }
    }
    
    /**
     * Save checklist entry to Firestore under the project scope
     */
    async saveChecklistEntry(entry) {
        if (!this.initialized) {
            console.warn('⚠️ Firestore not initialized, skipping checklist sync');
            return false;
        }

        try {
            const projectId = entry.projectId || 'master';
            const projectRef = doc(this.db, 'projects', projectId);
            const checklistRef = doc(collection(projectRef, 'checklists'), entry.id);

            const payload = {
                ...entry,
                projectId,
                projectTags: entry.projectTags || [],
                collaborators: entry.collaborators || [],
                updatedAt: serverTimestamp(),
            };

            if (!payload.timestamp) {
                payload.timestamp = new Date().toISOString();
            }

            await setDoc(checklistRef, payload, { merge: true });
            console.log('✅ Checklist entry saved to Firestore');
            return true;
        } catch (error) {
            console.error('❌ Error saving checklist entry:', error);
            return false;
        }
    }

    /**
     * Fetch checklist entries for a project
     */
    async getChecklistEntries(projectId, options = {}) {
        if (!this.initialized) {
            console.warn('⚠️ Firestore not initialized, returning local checklist entries');
            return [];
        }

        try {
            const projectRef = doc(this.db, 'projects', projectId);
            const checklistsRef = collection(projectRef, 'checklists');
            const constraints = [orderBy('timestamp', 'desc')];

            const entryLimit = options.limit || 200;
            constraints.push(limit(entryLimit));

            const q = query(checklistsRef, ...constraints);
            const querySnapshot = await getDocs(q);

            const entries = [];
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                entries.push({
                    id: docSnap.id,
                    ...this.deserializeChecklistEntry(data),
                });
            });

            console.log(`✅ Fetched ${entries.length} checklist entries for project ${projectId}`);
            return entries;
        } catch (error) {
            console.error('❌ Error fetching checklist entries:', error);
            return [];
        }
    }

    deserializeChecklistEntry(data) {
        if (!data) return data;
        const result = { ...data };

        ['timestamp', 'createdAt', 'updatedAt', 'syncedAt'].forEach((field) => {
            if (result[field]?.toDate) {
                result[field] = result[field].toDate().toISOString();
            }
        });

        result.projectTags = Array.isArray(result.projectTags) ? result.projectTags : [];
        result.collaborators = Array.isArray(result.collaborators) ? result.collaborators : [];

        return result;
    }

    /**
     * Sync localStorage to Firestore
     * Migrates existing users from localStorage to cloud
     */
    async syncLocalStorageToFirestore() {
        if (!this.initialized) {
            console.warn('⚠️ Firestore not initialized, cannot sync');
            return { success: false, synced: 0 };
        }
        
        try {
            console.log('🔄 Syncing localStorage to Firestore...');
            
            let syncedCount = 0;
            
            // Sync saved_users
            const savedUsersStr = localStorage.getItem('saved_users');
            if (savedUsersStr) {
                const savedUsers = JSON.parse(savedUsersStr);
                console.log('  Found', savedUsers.length, 'saved users to sync');
                
                for (const user of savedUsers) {
                    const success = await this.saveUser(user);
                    if (success) syncedCount++;
                }
            }
            
            // Sync trial_users
            const trialUsersStr = localStorage.getItem('trial_users');
            if (trialUsersStr) {
                const trialUsers = JSON.parse(trialUsersStr);
                console.log('  Found', trialUsers.length, 'trial users to sync');
                
                for (const user of trialUsers) {
                    // Check if not already synced
                    const userId = user.email.replace(/[^a-zA-Z0-9]/g, '_');
                    const exists = await this.getUser(userId);
                    if (!exists) {
                        const success = await this.saveUser(user);
                        if (success) syncedCount++;
                    }
                }
            }
            
            console.log('✅ Sync complete:', syncedCount, 'users synced to Firestore');
            return { success: true, synced: syncedCount };
            
        } catch (error) {
            console.error('❌ Error syncing to Firestore:', error);
            return { success: false, synced: 0, error: error.message };
        }
    }
    
    /**
     * Load user from Firestore to localStorage
     */
    async loadUserToLocalStorage(userId) {
        const userData = await this.getUser(userId);
        if (userData) {
            localStorage.setItem('current_user', JSON.stringify(userData));
            localStorage.setItem('session_active', 'true');
            console.log('✅ User loaded from Firestore to localStorage');
            return true;
        }
        return false;
    }

    
    async getMenuSnapshot(projectId, menuId = 'primary') {
        if (!this.initialized) {
            console.warn('⚠️ Firestore not initialized, cannot load menu snapshot');
            return null;
        }

        const normalizedProject = this.resolveProjectId(projectId);
        const normalizedMenu = this.normalizeId(menuId, 'primary');

        try {
            const projectRef = doc(this.db, 'projects', normalizedProject);
            const menuRef = doc(collection(projectRef, 'menus'), normalizedMenu);
            const snapshot = await getDoc(menuRef);
            if (!snapshot.exists()) {
                console.log('ℹ️ No menu snapshot found in Firestore for project', normalizedProject);
                return null;
            }

            const data = snapshot.data();
            const payload = {
                menu: data.menu || null,
                items: Array.isArray(data.items) ? data.items : [],
                links: data.links || {},
                syncedAt: data.syncedAt || null,
                itemCount: data.itemCount || 0,
            };
            return payload;
        } catch (error) {
            console.error('❌ Error loading menu snapshot:', error);
            return null;
        }
    }

    async getRecipeLibrarySnapshot(userId) {
        if (!this.initialized) {
            console.warn('⚠️ Firestore not initialized, cannot load recipe snapshot');
            return null;
        }

        const resolvedUserId = this.resolveUserId(userId);
        try {
            const userRef = doc(this.db, 'users', resolvedUserId);
            const snapshotRef = doc(collection(userRef, 'snapshots'), 'recipeLibrary');
            const snapshot = await getDoc(snapshotRef);
            if (!snapshot.exists()) {
                console.log('ℹ️ No recipe snapshot found in Firestore for user', resolvedUserId);
                return null;
            }

            const data = snapshot.data();
            const recipes = Array.isArray(data.recipes) ? data.recipes : [];
            const payload = {
                recipes,
                count: data.count || recipes.length,
                fullCount: data.fullCount || recipes.length,
                syncedAt: data.syncedAt || null,
            };
            return payload;
        } catch (error) {
            console.error('❌ Error loading recipe library snapshot:', error);
            return null;
        }
    }

    async bootstrapLocalData(options = {}) {
        if (!this.initialized) {
            console.warn('⚠️ Firestore not initialized, cannot bootstrap data');
            return { recipes: 0, menus: 0 };
        }

        const results = {
            recipes: 0,
            menus: 0,
        };

        try {
            if (options.recipes !== false && !localStorage.getItem('recipes')) {
                const recipeSnapshot = await this.getRecipeLibrarySnapshot(options.userId);
                if (recipeSnapshot?.recipes?.length) {
                    localStorage.setItem('recipes', JSON.stringify(recipeSnapshot.recipes));
                    results.recipes = recipeSnapshot.recipes.length;
                    console.log(`📥 Loaded ${results.recipes} recipes from Firestore`);
                }
            }

            if (options.menu !== false && window.enhancedMenuManager) {
                const projectId = this.resolveProjectId(options.projectId);
                const menuSnapshot = await this.getMenuSnapshot(projectId, options.menuId || window.enhancedMenuManager?.currentMenu?.id || 'primary');
                if (menuSnapshot?.items) {
                    const menuData = {
                        menu: menuSnapshot.menu || window.enhancedMenuManager.currentMenu,
                        items: menuSnapshot.items,
                    };
                    const storageKey = `${window.enhancedMenuManager.storageKey}_${projectId}`;
                    localStorage.setItem(storageKey, JSON.stringify(menuData));
                    window.enhancedMenuManager.menuItems = menuSnapshot.items;
                    if (menuSnapshot.menu) {
                        window.enhancedMenuManager.currentMenu = menuSnapshot.menu;
                    }
                    results.menus = menuSnapshot.items.length;
                    console.log(`📥 Loaded ${results.menus} menu items from Firestore`);
                }
            }
        } catch (error) {
            console.error('❌ Error bootstrapping data from Firestore:', error);
        }

        return results;
    }

    deriveProjectMetadata(metadata = {}) {
        const projectManager = window.projectManager;
        const currentProject = projectManager?.currentProject;
        const owner = window.authManager?.currentUser;

        const base = {
            ownerId: owner?.id || owner?.userId || metadata.ownerId || null,
            ownerEmail: owner?.email || null,
            ownerName: owner?.name || null,
            projectName: currentProject?.name || metadata.projectName || null,
            projectTags: Array.isArray(currentProject?.tags) ? currentProject.tags : (metadata.projectTags || []),
            syncedAt: new Date().toISOString(),
        };

        return { ...base, ...metadata };
    }

    deserializeTimestamps(value) {
        if (value === null || value === undefined) {
            return value;
        }

        if (typeof value?.toDate === 'function') {
            try {
                return value.toDate().toISOString();
            } catch (error) {
                return value.toDate();
            }
        }

        if (Array.isArray(value)) {
            return value.map((item) => this.deserializeTimestamps(item));
        }

        if (typeof value === 'object') {
            const result = {};
            for (const key of Object.keys(value)) {
                result[key] = this.deserializeTimestamps(value[key]);
            }
            return result;
        }

        return value;
    }
}

// Initialize Firestore Sync
console.log('🔥 Loading Firestore Sync Service...');
const firestoreSync = new FirestoreSync();

// Initialize it (async - don't wait)
firestoreSync.init().then(() => {
    console.log('✅ Firestore Sync initialized successfully');
}).catch(error => {
    console.warn('⚠️ Firestore Sync initialization failed:', error.message);
    console.log('App will work without Firestore (localStorage fallback)');
});

// Make globally available immediately (before init completes)
window.firestoreSync = firestoreSync;
console.log('✅ Firestore Sync set on window.firestoreSync');

// Export
export default firestoreSync;
export { FirestoreSync };

