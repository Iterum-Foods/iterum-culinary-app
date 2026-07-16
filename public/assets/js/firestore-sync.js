/**
 * Firestore Sync Service
 * Syncs user data between localStorage and Firebase Firestore
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
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
  onSnapshot,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

class FirestoreSync {
  constructor() {
    this.db = null;
    this.initialized = false;
    /** @type {Array<Record<string, unknown>>} Cached rows from users/{uid}/vendor_prices (E3c). */
    this.vendorPriceRows = [];
    // Don't call init in constructor - will be called externally
  }

  normalizeId(source, fallback = 'local-testing') {
    if (!source) {
      return fallback;
    }
    return String(source).replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  /**
   * Firestore `users/{userId}/...` rules require `userId === request.auth.uid` for many paths.
   * Do not derive userId from email slug — that causes permission errors while signed in.
   */
  looksLikeFirebaseUid(value) {
    const s = String(value || '').trim();
    if (!s || s.includes('@')) {
      return false;
    }
    return /^[a-zA-Z0-9_-]{10,128}$/.test(s);
  }

  resolveUserId(explicitUserId) {
    if (explicitUserId) {
      const t = String(explicitUserId).trim();
      return t ? this.normalizeId(t) : 'local-testing';
    }

    const firebaseUid = window.firebaseAuth?.auth?.currentUser?.uid;
    if (firebaseUid) {
      return String(firebaseUid);
    }

    const authUser = window.authManager?.currentUser;
    if (authUser) {
      for (const c of [authUser.uid, authUser.userId, authUser.id]) {
        if (c && this.looksLikeFirebaseUid(c)) {
          return this.normalizeId(String(c).trim());
        }
      }
    }

    const stored = localStorage.getItem('current_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        for (const key of ['uid', 'userId', 'id']) {
          const v = parsed?.[key];
          if (v && this.looksLikeFirebaseUid(v)) {
            return this.normalizeId(String(v).trim());
          }
        }
      } catch (error) {
        console.warn(
          '⚠️ Unable to parse stored user for Firestore sync:',
          error
        );
      }
    }

    return 'local-testing';
  }

  /**
   * E3 — Account catalog owner uid for shared vendors / vendor_prices.
   * Prefer the active workspace project's firebaseUid (account owner), else signed-in user.
   */
  resolveCatalogOwnerUserId(explicitUserId) {
    if (explicitUserId) {
      return this.resolveUserId(explicitUserId);
    }
    const project =
      window.projectManager?.currentProject ||
      window.unifiedProjectSelector?.currentProject ||
      null;
    if (project && typeof project === 'object') {
      for (const key of ['firebaseUid', 'ownerId', 'ownerUid']) {
        const v = project[key];
        if (v && this.looksLikeFirebaseUid(v)) {
          return this.normalizeId(String(v).trim());
        }
      }
    }
    return this.resolveUserId();
  }

  resolveProjectId(explicitProjectId) {
    if (explicitProjectId) {
      return this.normalizeId(explicitProjectId, 'master');
    }

    const ups = window.unifiedProjectSelector?.currentProjectId;
    if (ups) {
      return this.normalizeId(ups, 'master');
    }

    const projectManager = window.projectManager;
    if (projectManager?.currentProject?.id) {
      return this.normalizeId(projectManager.currentProject.id, 'master');
    }

    const uid =
      window.firebaseAuth?.auth?.currentUser?.uid ||
      window.authManager?.currentUser?.uid ||
      window.authManager?.currentUser?.userId ||
      window.authManager?.currentUser?.id ||
      null;
    if (uid) {
      const userPick = localStorage.getItem(
        `iterum_current_project_user_${uid}`
      );
      if (userPick) {
        return this.normalizeId(userPick, 'master');
      }
    }

    const globalPick = localStorage.getItem('iterum_current_project');
    if (globalPick) {
      return this.normalizeId(globalPick, 'master');
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
      console.warn(
        '⚠️ Unable to sanitize data for Firestore, using fallback.',
        error
      );
      return fallback;
    }
  }

  async ensureProjectDoc(projectId, metadata = {}) {
    if (!this.initialized) {
      return null;
    }
    const projectRef = doc(this.db, 'projects', projectId);
    const authUid =
      window.firebaseAuth?.auth?.currentUser?.uid ||
      window.authManager?.currentUser?.uid ||
      metadata.firebaseUid ||
      null;
    const enriched = {
      projectId,
      updatedAt: serverTimestamp(),
      ...this.deriveProjectMetadata(metadata),
      firebaseUid: authUid
    };
    const payload = {
      ...enriched
    };
    await setDoc(projectRef, payload, { merge: true });
    try {
      await this.ensureProjectMemberDoc(projectId, {
        role: 'account_admin',
        firebaseUid: authUid
      });
    } catch (e) {
      console.warn('ensureProjectDoc: membership bootstrap skipped', e);
    }
    return projectRef;
  }

  /**
   * Upsert `projects/{projectId}/members/{authUid}` for company permissions (see firestore.rules).
   * Owner bootstrap uses role `account_admin`; admins can add other roles later.
   * @param {string} projectId
   * @param {{ role?: string, firebaseUid?: string, email?: string|null }} [opts]
   */
  async ensureProjectMemberDoc(projectId, opts = {}) {
    if (!this.initialized || !projectId) {
      return null;
    }
    const rawUid =
      opts.firebaseUid ?? window.authManager?.currentUser?.uid ?? null;
    if (rawUid === null || rawUid === undefined) {
      return null;
    }
    const authUid = String(rawUid).trim();
    if (!authUid) {
      return null;
    }
    const role = opts.role || 'account_admin';
    const memberRef = doc(this.db, 'projects', projectId, 'members', authUid);
    const email =
      opts.email !== undefined
        ? opts.email
        : window.authManager?.currentUser?.email || null;
    await setDoc(
      memberRef,
      {
        role,
        email,
        authUid,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return memberRef;
  }

  /**
   * List `projects/{projectId}/members` (owner / account_admin per rules).
   * @param {string} projectId
   * @returns {Promise<Array<{ uid: string, role?: string, email?: string|null, authUid?: string }>>}
   */
  async listProjectMembers(projectId) {
    if (!this.initialized || !projectId) {
      return [];
    }
    const snap = await getDocs(
      collection(this.db, 'projects', projectId, 'members')
    );
    return snap.docs.map(d => {
      const data = d.data();
      return {
        uid: d.id,
        role: data.role,
        email: data.email ?? null,
        authUid: data.authUid ?? d.id
      };
    });
  }

  /**
   * Remove a member doc (owner / account_admin per rules).
   * @param {string} projectId
   * @param {string} memberUid
   */
  async removeProjectMemberDoc(projectId, memberUid) {
    if (!this.initialized || !projectId || !memberUid) {
      return;
    }
    const uid = String(memberUid).trim();
    if (!uid) {
      return;
    }
    await deleteDoc(doc(this.db, 'projects', projectId, 'members', uid));
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
        console.warn(
          '⚠️ Firebase config not found - Firestore will not be available'
        );
        console.log(
          'Make sure firebase-config.js is loaded before firestore-sync.js'
        );
        return; // Don't throw, just return - Firestore optional
      }

      console.log('✅ Firebase config found:', config.projectId);

      // Initialize Firebase app (if not already initialized)
      let app;
      try {
        app = initializeApp(config);
      } catch (e) {
        // App might already be initialized
        const { getApp } = await import(
          'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'
        );
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

      this.refreshVendorPricesFromFirestore().catch(() => {});
      if (typeof window !== 'undefined' && !this._vendorPriceProjectListener) {
        this._vendorPriceProjectListener = true;
        window.addEventListener('projectChanged', () => {
          this.refreshVendorPricesFromFirestore().catch(() => {});
        });
      }
    } catch (error) {
      console.error('❌ Firestore initialization failed:', error);
      this.initialized = false;
    }
  }

  async saveRecipeLibrarySnapshot(library, options = {}) {
    if (!this.initialized) {
      console.warn(
        '⚠️ Firestore not initialized, skipping recipe library sync'
      );
      return false;
    }

    const userId = this.resolveUserId(options.userId);
    if (!userId) {
      console.warn('⚠️ No user ID available for recipe library sync');
      return false;
    }

    try {
      const userRef = doc(this.db, 'users', userId);
      await setDoc(
        userRef,
        {
          userId,
          lastRecipeSync: serverTimestamp()
        },
        { merge: true }
      );

      const snapshotRef = doc(
        collection(userRef, 'snapshots'),
        'recipeLibrary'
      );
      const maxRecipes = options.maxRecipes || 200;
      const libraryArray = Array.isArray(library) ? library : [];
      const trimmed = libraryArray.slice(0, maxRecipes);
      const payload = {
        recipes: this.sanitizeForFirestore(trimmed, []),
        count: trimmed.length,
        fullCount: libraryArray.length,
        syncedAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      };

      await setDoc(snapshotRef, payload, { merge: true });
      console.log(
        `✅ Recipe library snapshot synced (${payload.count}/${payload.fullCount})`
      );
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

    if (typeof window.iterumWarnIfMasterWorkspace === 'function') {
      window.iterumWarnIfMasterWorkspace('menu to cloud');
    }

    try {
      const userId = this.resolveUserId(payload.userId);
      const projectRef = await this.ensureProjectDoc(projectId, {
        ownerId: userId
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
        updatedAt: serverTimestamp()
      };

      await setDoc(menuRef, metadata, { merge: true });
      console.log(
        `✅ Menu snapshot synced for project ${projectId} (menu ${menuId})`
      );
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
      const menuId = this.normalizeId(
        options.menuId || options.menu?.id || 'primary'
      );
      const menuRef = doc(collection(projectRef, 'menus'), menuId);
      const snap = await getDoc(menuRef);
      if (!snap.exists()) {
        return null;
      }

      const data = snap.data();
      const deserialized = this.deserializeTimestamps({
        id: menuId,
        projectId: resolvedProjectId,
        ...data
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
      const snapshotRef = doc(
        collection(userRef, 'snapshots'),
        'recipeLibrary'
      );
      const snap = await getDoc(snapshotRef);
      if (!snap.exists()) {
        return null;
      }

      const data = snap.data();
      return this.deserializeTimestamps({
        userId: resolvedUserId,
        ...data
      });
    } catch (error) {
      console.warn(
        '⚠️ Unable to fetch recipe library snapshot:',
        error.message || error
      );
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

      const userId =
        userData.id ||
        userData.userId ||
        window.firebaseAuth?.auth?.currentUser?.uid ||
        (userData.email ? userData.email.replace(/[^a-zA-Z0-9]/g, '_') : null);
      if (!userId) {
        console.warn(
          '⚠️ saveUser: no user id / Firebase uid; skip Firestore write'
        );
        return false;
      }
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
            endDate:
              userData.trialEndDate ||
              new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
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
   * Custom claim `iterum_admin` (set via Firebase Admin SDK) allows collection-wide
   * user queries. Others only receive their own `users/{auth.uid}` doc per rules.
   */
  async isIterumAdminUser() {
    const user = window.firebaseAuth?.auth?.currentUser;
    if (!user || typeof user.getIdTokenResult !== 'function') {
      return false;
    }
    try {
      const token = await user.getIdTokenResult();
      return token.claims && token.claims.iterum_admin === true;
    } catch (e) {
      console.warn('⚠️ Could not read token claims:', e);
      return false;
    }
  }

  mapUserDoc(snapshot) {
    if (!snapshot.exists()) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() };
  }

  /**
   * Users visible to this client: all users only if iterum_admin; else own profile only.
   */
  async getAllUsers() {
    if (!this.initialized) {
      console.warn('⚠️ Firestore not initialized');
      return [];
    }

    try {
      if (await this.isIterumAdminUser()) {
        console.log('📊 Fetching all users from Firestore (admin)...');
        const usersRef = collection(this.db, 'users');
        const querySnapshot = await getDocs(usersRef);
        const users = [];
        querySnapshot.forEach(d => {
          users.push({ id: d.id, ...d.data() });
        });
        console.log('✅ Fetched', users.length, 'users from Firestore');
        return users;
      }

      const uid = window.firebaseAuth?.auth?.currentUser?.uid;
      if (!uid) {
        console.warn('⚠️ getAllUsers: not signed in');
        return [];
      }

      const userRef = doc(this.db, 'users', uid);
      const snap = await getDoc(userRef);
      const one = this.mapUserDoc(snap);
      return one ? [one] : [];
    } catch (error) {
      console.error('❌ Error fetching users from Firestore:', error);
      return [];
    }
  }

  /**
   * Trial users: full list only for iterum_admin; otherwise [self] if type === trial.
   */
  async getTrialUsers() {
    if (!this.initialized) {
      console.warn('⚠️ Firestore not initialized');
      return [];
    }

    try {
      if (await this.isIterumAdminUser()) {
        const usersRef = collection(this.db, 'users');
        const q = query(usersRef, where('type', '==', 'trial'));
        const querySnapshot = await getDocs(q);
        const users = [];
        querySnapshot.forEach(d => {
          users.push({ id: d.id, ...d.data() });
        });
        console.log('✅ Fetched', users.length, 'trial users from Firestore');
        return users;
      }

      const uid = window.firebaseAuth?.auth?.currentUser?.uid;
      if (!uid) {
        return [];
      }
      const userRef = doc(this.db, 'users', uid);
      const snap = await getDoc(userRef);
      const data = this.mapUserDoc(snap);
      if (data && data.type === 'trial') {
        return [data];
      }
      return [];
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
        updatedAt: serverTimestamp()
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
   * Save corrective action to Firestore under project scope
   */
  async saveCorrectiveAction(action) {
    if (!this.initialized) {
      console.warn(
        '⚠️ Firestore not initialized, skipping corrective action sync'
      );
      return false;
    }

    if (!action?.id) {
      return false;
    }

    try {
      const projectId = action.projectId || 'master';
      const projectRef = doc(this.db, 'projects', projectId);
      const actionRef = doc(
        collection(projectRef, 'corrective_actions'),
        action.id
      );
      const payload = {
        ...action,
        projectId,
        updatedAt: serverTimestamp()
      };
      if (!payload.createdAt) {
        payload.createdAt = new Date().toISOString();
      }
      await setDoc(actionRef, payload, { merge: true });
      console.log('✅ Corrective action saved to Firestore');
      return true;
    } catch (error) {
      console.error('❌ Error saving corrective action:', error);
      return false;
    }
  }

  /**
   * Fetch checklist entries for a project
   */
  async getChecklistEntries(projectId, options = {}) {
    if (!this.initialized) {
      console.warn(
        '⚠️ Firestore not initialized, returning local checklist entries'
      );
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
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        entries.push({
          id: docSnap.id,
          ...this.deserializeChecklistEntry(data)
        });
      });

      console.log(
        `✅ Fetched ${entries.length} checklist entries for project ${projectId}`
      );
      return entries;
    } catch (error) {
      console.error('❌ Error fetching checklist entries:', error);
      return [];
    }
  }

  deserializeChecklistEntry(data) {
    if (!data) {
      return data;
    }
    const result = { ...data };

    ['timestamp', 'createdAt', 'updatedAt', 'syncedAt'].forEach(field => {
      if (result[field]?.toDate) {
        result[field] = result[field].toDate().toISOString();
      }
    });

    result.projectTags = Array.isArray(result.projectTags)
      ? result.projectTags
      : [];
    result.collaborators = Array.isArray(result.collaborators)
      ? result.collaborators
      : [];

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
          if (success) {
            syncedCount++;
          }
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
            if (success) {
              syncedCount++;
            }
          }
        }
      }

      console.log(
        '✅ Sync complete:',
        syncedCount,
        'users synced to Firestore'
      );
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
        console.log(
          'ℹ️ No menu snapshot found in Firestore for project',
          normalizedProject
        );
        return null;
      }

      const data = snapshot.data();
      const payload = {
        menu: data.menu || null,
        items: Array.isArray(data.items) ? data.items : [],
        links: data.links || {},
        syncedAt: data.syncedAt || null,
        itemCount: data.itemCount || 0
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
      const snapshotRef = doc(
        collection(userRef, 'snapshots'),
        'recipeLibrary'
      );
      const snapshot = await getDoc(snapshotRef);
      if (!snapshot.exists()) {
        console.log(
          'ℹ️ No recipe snapshot found in Firestore for user',
          resolvedUserId
        );
        return null;
      }

      const data = snapshot.data();
      const recipes = Array.isArray(data.recipes) ? data.recipes : [];
      const payload = {
        recipes,
        count: data.count || recipes.length,
        fullCount: data.fullCount || recipes.length,
        syncedAt: data.syncedAt || null
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
      menus: 0
    };

    try {
      if (options.recipes !== false && !localStorage.getItem('recipes')) {
        const recipeSnapshot = await this.getRecipeLibrarySnapshot(
          options.userId
        );
        if (recipeSnapshot?.recipes?.length) {
          localStorage.setItem(
            'recipes',
            JSON.stringify(recipeSnapshot.recipes)
          );
          results.recipes = recipeSnapshot.recipes.length;
          console.log(`📥 Loaded ${results.recipes} recipes from Firestore`);
        }
      }

      if (options.menu !== false && window.enhancedMenuManager) {
        const projectId = this.resolveProjectId(options.projectId);
        const menuSnapshot = await this.getMenuSnapshot(
          projectId,
          options.menuId ||
            window.enhancedMenuManager?.currentMenu?.id ||
            'primary'
        );
        if (menuSnapshot?.items) {
          const menuData = {
            menu: menuSnapshot.menu || window.enhancedMenuManager.currentMenu,
            items: menuSnapshot.items
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

  /**
   * Stable Firestore document id for a vendor row (users/{uid}/vendors/{id}).
   */
  vendorFirestoreDocId(vendor) {
    if (!vendor || typeof vendor !== 'object') {
      return 'unknown';
    }
    if (
      vendor.id !== undefined &&
      vendor.id !== null &&
      String(vendor.id).trim() !== ''
    ) {
      return this.normalizeId(String(vendor.id), 'v');
    }
    if (vendor.name && String(vendor.name).trim()) {
      return this.normalizeId(String(vendor.name), 'vendor');
    }
    return `v_${Date.now()}`;
  }

  /**
   * Drop huge attachment payloads so writes stay under Firestore limits.
   */
  stripLargeVendorFieldsForSync(vendor) {
    const v = this.sanitizeForFirestore(vendor, {});
    if (
      v.invoiceAttachment &&
      typeof v.invoiceAttachment === 'string' &&
      v.invoiceAttachment.length > 40000
    ) {
      delete v.invoiceAttachment;
      v.invoiceAttachmentOmitted = true;
    }
    return v;
  }

  /**
   * E3 — Push vendor list to users/{catalogOwner}/vendors/* (shared account catalog).
   */
  async syncVendorsToFirestore(vendors) {
    if (!this.initialized || !Array.isArray(vendors)) {
      return { ok: false, reason: 'not_ready' };
    }
    const uid = this.resolveCatalogOwnerUserId();
    if (!uid || uid === 'local-testing') {
      return { ok: false, reason: 'no_user' };
    }
    const userRef = doc(this.db, 'users', uid);
    let wrote = 0;
    for (const vendor of vendors) {
      const docId = this.vendorFirestoreDocId(vendor);
      const base = this.stripLargeVendorFieldsForSync(vendor);
      const payload = {
        ...base,
        id: base.id != null ? base.id : vendor.id,
        iterumVendorDocId: docId,
        updatedAt: serverTimestamp()
      };
      try {
        const vRef = doc(collection(userRef, 'vendors'), docId);
        await setDoc(vRef, payload, { merge: true });
        wrote += 1;
      } catch (error) {
        console.warn('Vendor Firestore sync skipped:', docId, error.message);
      }
    }
    return { ok: true, wrote, userId: uid };
  }

  /**
   * E3 — Load all vendors from users/{catalogOwner}/vendors/*.
   */
  async fetchVendorsFromFirestore(explicitUserId) {
    if (!this.initialized) {
      return [];
    }
    const uid = explicitUserId || this.resolveCatalogOwnerUserId();
    if (!uid || uid === 'local-testing') {
      return [];
    }
    try {
      const userRef = doc(this.db, 'users', uid);
      const vendorsCol = collection(userRef, 'vendors');
      const snap = await getDocs(vendorsCol);
      const out = [];
      snap.forEach(d => {
        const data = d.data();
        const row = this.deserializeTimestamps(data);
        delete row.iterumVendorDocId;
        delete row.updatedAt;
        out.push(row);
      });
      return out;
    } catch (error) {
      console.error('Error fetching vendors from Firestore:', error);
      return [];
    }
  }

  /**
   * Stable document id for users/{uid}/vendor_prices/{id} (E3c).
   */
  vendorPriceFirestoreDocId(row) {
    if (!row || typeof row !== 'object') {
      return 'unknown';
    }
    const vendorPart = String(
      row.vendorDocId || row.iterumVendorDocId || row.vendorId || ''
    ).trim();
    const v = vendorPart ? this.normalizeId(vendorPart, 'v') : 'v_na';
    const projPart =
      row.projectId != null && String(row.projectId).trim() !== ''
        ? this.normalizeId(String(row.projectId), 'p')
        : '_acct';
    let ingPart;
    if (row.ingredientId != null && String(row.ingredientId).trim() !== '') {
      ingPart = `i_${this.normalizeId(String(row.ingredientId), 'ing')}`;
    } else {
      ingPart = this.normalizeId(
        String(row.ingredientName || row.sku || 'item'),
        'ing'
      );
    }
    return this.normalizeId(`${v}__${projPart}__${ingPart}`, 'vp');
  }

  /**
   * E3c — Upsert one price override row (project-specific or account default when projectId null/empty).
   * Workspace rows write to users/{catalogOwner}/vendor_prices and projects/{projectId}/vendor_prices.
   */
  async syncVendorPriceRowToFirestore(row) {
    if (!this.initialized || !row || typeof row !== 'object') {
      return { ok: false, reason: 'not_ready' };
    }
    const uid = this.resolveCatalogOwnerUserId();
    if (!uid || uid === 'local-testing') {
      return { ok: false, reason: 'no_user' };
    }
    const docId =
      row.iterumVendorPriceDocId || this.vendorPriceFirestoreDocId(row);
    const projectId =
      row.projectId != null && String(row.projectId).trim() !== ''
        ? String(row.projectId)
        : null;
    const base = this.sanitizeForFirestore(
      {
        vendorDocId:
          String(row.vendorDocId || row.iterumVendorDocId || '').trim() || null,
        projectId,
        ingredientId:
          row.ingredientId != null && String(row.ingredientId).trim() !== ''
            ? row.ingredientId
            : null,
        ingredientName: String(row.ingredientName || '').trim(),
        sku: row.sku != null ? String(row.sku).trim() : null,
        unitCost: Number(row.unitCost) || 0,
        unit: String(row.unit || 'ea').trim() || 'ea',
        vendorName: String(row.vendorName || '').trim() || null
      },
      {}
    );
    const payload = {
      ...base,
      iterumVendorPriceDocId: docId,
      updatedAt: serverTimestamp()
    };
    try {
      const userRef = doc(this.db, 'users', uid);
      const pRef = doc(collection(userRef, 'vendor_prices'), docId);
      await setDoc(pRef, payload, { merge: true });
      if (projectId) {
        try {
          const projRef = doc(this.db, 'projects', projectId);
          const projPriceRef = doc(collection(projRef, 'vendor_prices'), docId);
          await setDoc(projPriceRef, payload, { merge: true });
        } catch (projErr) {
          console.warn(
            'Project vendor_prices mirror skipped:',
            docId,
            projErr.message
          );
        }
      }
      await this.refreshVendorPricesFromFirestore();
      return { ok: true, docId, userId: uid };
    } catch (error) {
      console.warn(
        'Vendor price Firestore sync skipped:',
        docId,
        error.message
      );
      return { ok: false, reason: error.message };
    }
  }

  /**
   * E3c — Remove one vendor price override by Firestore document id.
   */
  async deleteVendorPriceFromFirestore(docId, explicitProjectId) {
    if (!this.initialized || !docId || String(docId).trim() === '') {
      return { ok: false, reason: 'bad_args' };
    }
    const uid = this.resolveCatalogOwnerUserId();
    if (!uid || uid === 'local-testing') {
      return { ok: false, reason: 'no_user' };
    }
    const projectId =
      explicitProjectId != null && String(explicitProjectId).trim() !== ''
        ? String(explicitProjectId).trim()
        : this.resolveProjectId();
    try {
      const userRef = doc(this.db, 'users', uid);
      const pRef = doc(collection(userRef, 'vendor_prices'), String(docId));
      await deleteDoc(pRef);
      if (projectId && projectId !== 'master') {
        try {
          const projRef = doc(this.db, 'projects', projectId);
          const projPriceRef = doc(
            collection(projRef, 'vendor_prices'),
            String(docId)
          );
          await deleteDoc(projPriceRef);
        } catch (projErr) {
          console.warn(
            'Project vendor_prices delete skipped:',
            docId,
            projErr.message
          );
        }
      }
      await this.refreshVendorPricesFromFirestore();
      return { ok: true };
    } catch (error) {
      console.warn('Vendor price delete failed:', docId, error.message);
      return { ok: false, reason: error.message };
    }
  }

  /**
   * E3c — Load vendor price rows for the catalog owner (+ active project mirror).
   */
  async fetchVendorPricesFromFirestore(explicitUserId) {
    if (!this.initialized) {
      return [];
    }
    const uid = explicitUserId || this.resolveCatalogOwnerUserId();
    if (!uid || uid === 'local-testing') {
      return [];
    }
    const byId = new Map();
    try {
      const userRef = doc(this.db, 'users', uid);
      const col = collection(userRef, 'vendor_prices');
      const snap = await getDocs(col);
      snap.forEach(d => {
        const data = d.data();
        const row = this.deserializeTimestamps(data);
        row.iterumVendorPriceDocId = d.id;
        byId.set(d.id, row);
      });
    } catch (error) {
      console.error('Error fetching vendor_prices from Firestore:', error);
    }
    const projectId = this.resolveProjectId();
    if (projectId && projectId !== 'master') {
      try {
        const projRef = doc(this.db, 'projects', projectId);
        const col = collection(projRef, 'vendor_prices');
        const snap = await getDocs(col);
        snap.forEach(d => {
          const data = d.data();
          const row = this.deserializeTimestamps(data);
          row.iterumVendorPriceDocId = d.id;
          if (!row.projectId) {
            row.projectId = projectId;
          }
          byId.set(d.id, row);
        });
      } catch (projErr) {
        console.warn(
          'Project vendor_prices fetch skipped:',
          projectId,
          projErr.message
        );
      }
    }
    return Array.from(byId.values());
  }

  async refreshVendorPricesFromFirestore(explicitUserId) {
    const rows = await this.fetchVendorPricesFromFirestore(explicitUserId);
    this.vendorPriceRows = rows;
    if (
      typeof window !== 'undefined' &&
      window.costCalculator &&
      typeof window.costCalculator.loadIngredientPrices === 'function'
    ) {
      try {
        window.costCalculator.loadIngredientPrices();
      } catch (e) {
        /* non-fatal */
      }
    }
    return rows;
  }

  _vendorPriceRowSortTime(row) {
    const u = row && row.updatedAt;
    if (!u) {
      return 0;
    }
    if (typeof u === 'number') {
      return u;
    }
    if (typeof u === 'string') {
      const n = new Date(u).getTime();
      return Number.isNaN(n) ? 0 : n;
    }
    if (typeof u.toDate === 'function') {
      try {
        return u.toDate().getTime();
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }

  /**
   * Map ingredient name key (lowercase) → override row for the active project.
   * Project-specific rows beat account-default rows (projectId null/empty).
   */
  getVendorPriceOverridesMap(explicitProjectId) {
    const pid =
      explicitProjectId != null && String(explicitProjectId).trim() !== ''
        ? String(explicitProjectId)
        : String(this.resolveProjectId() || '');
    const rows = Array.isArray(this.vendorPriceRows)
      ? this.vendorPriceRows
      : [];
    const best = new Map();
    for (const row of rows) {
      if (!row || typeof row !== 'object') {
        continue;
      }
      const nameKey = String(row.ingredientName || '')
        .trim()
        .toLowerCase();
      const skuKey = String(row.sku || '')
        .trim()
        .toLowerCase();
      const keys = [nameKey, skuKey].filter(Boolean);
      if (keys.length === 0) {
        continue;
      }
      const rpid =
        row.projectId != null && String(row.projectId).trim() !== ''
          ? String(row.projectId)
          : null;
      if (rpid != null && rpid !== pid) {
        continue;
      }
      const score = rpid === pid ? 2 : 1;
      const t = this._vendorPriceRowSortTime(row);
      for (const ingKey of keys) {
        const prev = best.get(ingKey);
        const prevScore = prev ? prev._vpScore : 0;
        const prevT = prev ? prev._vpT : 0;
        if (score > prevScore || (score === prevScore && t >= prevT)) {
          best.set(ingKey, {
            ingredientName: row.ingredientName,
            ingredientId: row.ingredientId,
            sku: row.sku,
            unitCost: row.unitCost,
            unit: row.unit,
            vendorName: row.vendorName,
            vendorDocId: row.vendorDocId,
            _vpScore: score,
            _vpT: t
          });
        }
      }
    }
    const out = new Map();
    best.forEach((row, k) => {
      out.set(k, {
        ingredientName: row.ingredientName,
        ingredientId: row.ingredientId,
        sku: row.sku,
        unitCost: row.unitCost,
        unit: row.unit,
        vendorName: row.vendorName,
        vendorDocId: row.vendorDocId
      });
    });
    return out;
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
      projectTags: Array.isArray(currentProject?.tags)
        ? currentProject.tags
        : metadata.projectTags || [],
      syncedAt: new Date().toISOString()
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
      return value.map(item => this.deserializeTimestamps(item));
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

  /**
   * Shift app → dashboard: team posts for a calendar day (project-scoped).
   * @param {string} projectId
   * @param {string} dateKey YYYY-MM-DD
   * @returns {Promise<Array<Record<string, unknown>>>}
   */
  async getShiftDayPosts(projectId, dateKey) {
    if (!this.initialized || !this.db || !dateKey) {
      return [];
    }
    const pid = this.resolveProjectId(projectId);
    const col = collection(this.db, 'projects', pid, 'shift_day_posts');
    let snap;
    try {
      const q = query(
        col,
        where('dateKey', '==', dateKey),
        orderBy('createdAt', 'asc')
      );
      snap = await getDocs(q);
    } catch (err) {
      console.warn('getShiftDayPosts orderBy (deploy index if needed):', err);
      try {
        const q2 = query(col, where('dateKey', '==', dateKey));
        snap = await getDocs(q2);
      } catch (e2) {
        console.warn('getShiftDayPosts:', e2);
        return [];
      }
    }
    const out = [];
    snap.forEach(d => {
      out.push({ id: d.id, ...d.data() });
    });
    out.sort((a, b) => {
      const ta =
        a.createdAt && typeof a.createdAt.toMillis === 'function'
          ? a.createdAt.toMillis()
          : 0;
      const tb =
        b.createdAt && typeof b.createdAt.toMillis === 'function'
          ? b.createdAt.toMillis()
          : 0;
      return ta - tb;
    });
    return out;
  }

  /**
   * Live listener for shift app posts (one calendar day). Uses equality filter only so
   * no composite index is required; sorts client-side.
   * @param {string} projectId
   * @param {string} dateKey YYYY-MM-DD
   * @param {(posts: Array<Record<string, unknown>>) => void} onUpdate
   * @param {(err: Error) => void} [onError]
   * @returns {() => void} unsubscribe
   */
  subscribeShiftDayPosts(projectId, dateKey, onUpdate, onError) {
    if (!this.initialized || !this.db || !dateKey) {
      return () => {};
    }
    const pid = this.resolveProjectId(projectId);
    const col = collection(this.db, 'projects', pid, 'shift_day_posts');
    const q = query(col, where('dateKey', '==', dateKey));
    return onSnapshot(
      q,
      snap => {
        const out = [];
        snap.forEach(d => out.push({ id: d.id, ...d.data() }));
        out.sort((a, b) => {
          const ta =
            a.createdAt && typeof a.createdAt.toMillis === 'function'
              ? a.createdAt.toMillis()
              : 0;
          const tb =
            b.createdAt && typeof b.createdAt.toMillis === 'function'
              ? b.createdAt.toMillis()
              : 0;
          return ta - tb;
        });
        onUpdate(out);
      },
      err => {
        if (typeof onError === 'function') {
          onError(err);
        } else {
          console.warn('subscribeShiftDayPosts:', err);
        }
      }
    );
  }

  /**
   * @param {object} opts
   * @param {string} opts.projectId
   * @param {string} opts.dateKey YYYY-MM-DD
   * @param {string} opts.body
   * @param {'shift'|'inventory'} opts.category
   * @param {'normal'|'low'|'out'} [opts.priority]
   */
  async saveShiftDayPost(opts) {
    if (!this.initialized || !this.db) {
      console.warn('Firestore not ready; skip saveShiftDayPost');
      return { ok: false };
    }
    const authUid =
      window.firebaseAuth?.auth?.currentUser?.uid ||
      window.authManager?.currentUser?.uid ||
      null;
    if (!authUid) {
      console.warn('saveShiftDayPost: no auth uid');
      return { ok: false };
    }
    const u = window.authManager?.currentUser;
    const authorName =
      (u && (u.name || u.displayName)) ||
      window.firebaseAuth?.auth?.currentUser?.displayName ||
      'Team member';
    const pid = this.resolveProjectId(opts.projectId);
    const dateKey = String(opts.dateKey || '').slice(0, 10);
    const body = String(opts.body || '')
      .trim()
      .slice(0, 8000);
    if (!dateKey || !body) {
      return { ok: false };
    }
    const category = opts.category === 'inventory' ? 'inventory' : 'shift';
    const priority =
      opts.priority === 'out'
        ? 'out'
        : opts.priority === 'low'
          ? 'low'
          : 'normal';
    const ref = doc(collection(this.db, 'projects', pid, 'shift_day_posts'));
    await setDoc(ref, {
      dateKey,
      body,
      category,
      priority,
      authorUid: authUid,
      authorName: String(authorName).slice(0, 120),
      source: 'shift_app',
      createdAt: serverTimestamp()
    });
    return { ok: true, id: ref.id };
  }

  /**
   * Save one employee list row under the project so managers can review it.
   * Document id is stable per user + type so latest value is always visible.
   * @param {object} opts
   * @param {string} opts.projectId
   * @param {'prep_list'|'stock_list'} opts.type
   * @param {string} opts.body
   * @param {string} [opts.authorName]
   * @param {string} [opts.source]
   */
  async saveProjectPrepListEntry(opts) {
    if (!this.initialized || !this.db) {
      return { ok: false };
    }
    const authUid =
      window.firebaseAuth?.auth?.currentUser?.uid ||
      window.authManager?.currentUser?.uid ||
      null;
    if (!authUid) {
      return { ok: false };
    }
    const projectId = this.resolveProjectId(opts.projectId);
    const type = opts.type === 'stock_list' ? 'stock_list' : 'prep_list';
    const body = String(opts.body || '')
      .trim()
      .slice(0, 40000);
    const authorName =
      String(
        opts.authorName ||
          window.authManager?.currentUser?.name ||
          window.firebaseAuth?.auth?.currentUser?.displayName ||
          'Team member'
      )
        .trim()
        .slice(0, 120) || 'Team member';
    const docId = `${type}__${authUid}`;
    const ref = doc(this.db, 'projects', projectId, 'prep_lists', docId);
    await setDoc(
      ref,
      {
        id: docId,
        projectId,
        type,
        body,
        authorUid: authUid,
        authorName,
        source: String(opts.source || 'mobile_line_app').slice(0, 80),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return { ok: true, id: docId };
  }

  /**
   * Managers can attach handoff notes to employee prep/stock lists.
   * @param {string} projectId
   * @param {string} docId
   * @param {string} managerNote
   */
  async saveProjectPrepListManagerNote(projectId, docId, managerNote) {
    if (!this.initialized || !this.db || !docId) {
      return { ok: false };
    }
    const project = this.resolveProjectId(projectId);
    const authUid =
      window.firebaseAuth?.auth?.currentUser?.uid ||
      window.authManager?.currentUser?.uid ||
      null;
    const managerName =
      String(
        window.authManager?.currentUser?.name ||
          window.firebaseAuth?.auth?.currentUser?.displayName ||
          'Manager'
      )
        .trim()
        .slice(0, 120) || 'Manager';
    const ref = doc(this.db, 'projects', project, 'prep_lists', String(docId));
    await setDoc(
      ref,
      {
        managerNote: String(managerNote || '')
          .trim()
          .slice(0, 4000),
        managerNoteByUid: authUid || null,
        managerNoteByName: managerName,
        managerNoteUpdatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return { ok: true };
  }

  /**
   * Live feed: project employee prep + stock lists for manager review.
   * @param {string} projectId
   * @param {(rows: Array<Record<string, unknown>>) => void} onUpdate
   * @param {(err: Error) => void} [onError]
   * @returns {() => void}
   */
  subscribeProjectPrepLists(projectId, onUpdate, onError) {
    if (!this.initialized || !this.db) {
      return () => {};
    }
    const project = this.resolveProjectId(projectId);
    const col = collection(this.db, 'projects', project, 'prep_lists');
    return onSnapshot(
      col,
      snap => {
        const out = [];
        snap.forEach(d => out.push({ id: d.id, ...d.data() }));
        out.sort((a, b) => {
          const ta =
            a.updatedAt && typeof a.updatedAt.toMillis === 'function'
              ? a.updatedAt.toMillis()
              : 0;
          const tb =
            b.updatedAt && typeof b.updatedAt.toMillis === 'function'
              ? b.updatedAt.toMillis()
              : 0;
          return tb - ta;
        });
        onUpdate(out);
      },
      err => {
        if (typeof onError === 'function') {
          onError(err);
        } else {
          console.warn('subscribeProjectPrepLists:', err);
        }
      }
    );
  }
}

// Initialize Firestore Sync
console.log('🔥 Loading Firestore Sync Service...');
const firestoreSync = new FirestoreSync();

// Initialize it (async - don't wait)
firestoreSync
  .init()
  .then(() => {
    console.log('✅ Firestore Sync initialized successfully');
    try {
      window.dispatchEvent(new CustomEvent('firestoreSyncReady'));
    } catch (e) {
      /* ignore */
    }
  })
  .catch(error => {
    console.warn('⚠️ Firestore Sync initialization failed:', error.message);
    console.log('App will work without Firestore (localStorage fallback)');
  });

// Make globally available immediately (before init completes)
window.firestoreSync = firestoreSync;
console.log('✅ Firestore Sync set on window.firestoreSync');

// Export
export default firestoreSync;
export { FirestoreSync };
