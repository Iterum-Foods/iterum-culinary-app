/**
 * State Persistence Manager
 * Ensures user and project selection persist consistently across all pages
 * Handles page navigation, tab synchronization, and state recovery
 */

class StatePersistenceManager {
    constructor() {
        this.initialized = false;
        this.syncInProgress = false;
        
        // Storage keys
        this.KEYS = {
            USER: 'current_user',
            USER_ID: 'current_user_id',
            SESSION: 'session_active',
            PROJECT: 'iterum_current_project',
            PROJECT_USER: 'iterum_current_project_user_',
            LAST_PAGE: 'last_visited_page',
            STATE_VERSION: 'state_version'
        };
        
        this.init();
    }

    /**
     * Initialize state persistence
     */
    async init() {
        if (this.initialized) return;

        console.log('🔄 Initializing State Persistence Manager...');

        try {
            // 1. Load and validate current user state
            await this.loadUserState();

            // 2. Load and validate project state
            await this.loadProjectState();

            // 3. Set up cross-tab synchronization
            this.setupCrossTabSync();

            // 4. Set up page navigation handling
            this.setupPageNavigationHandlers();

            // 5. Set up periodic state verification
            this.setupPeriodicStateCheck();

            // 6. Sync state across all page elements immediately
            await this.syncAllPageElements();

            this.initialized = true;
            console.log('✅ State Persistence Manager initialized');

            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('statePersistenceReady'));

        } catch (error) {
            console.error('❌ State Persistence Manager initialization failed:', error);
        }
    }

    /**
     * Load and validate user state
     */
    async loadUserState() {
        console.log('👤 Loading user state...');

        try {
            // Check for active session
            const sessionActive = localStorage.getItem(this.KEYS.SESSION);
            const userJson = localStorage.getItem(this.KEYS.USER);

            if (!sessionActive || sessionActive !== 'true') {
                console.warn('⚠️ No active session found');
                return false;
            }

            if (!userJson) {
                console.warn('⚠️ No user data found');
                return false;
            }

            // Parse user data
            const user = JSON.parse(userJson);

            // Validate user data
            if (!user.id && !user.userId) {
                console.error('❌ Invalid user data: missing ID');
                return false;
            }

            // Normalize user ID
            const userId = user.userId || user.id;
            user.userId = userId;
            user.id = userId;

            // Store user ID separately for quick access
            localStorage.setItem(this.KEYS.USER_ID, userId);

            // Update user object in localStorage with normalized data
            localStorage.setItem(this.KEYS.USER, JSON.stringify(user));

            // Make user globally available
            window.currentUser = user;

            // Update auth manager if available
            if (window.authManager) {
                window.authManager.currentUser = user;
                window.authManager.isAuthenticated = true;
            }

            console.log('✅ User state loaded:', user.email || user.name);
            return true;

        } catch (error) {
            console.error('❌ Error loading user state:', error);
            return false;
        }
    }

    /**
     * Load and validate project state
     */
    async loadProjectState() {
        console.log('📋 Loading project state...');

        try {
            // Get current user ID
            const userId = this.getCurrentUserId();

            if (!userId) {
                console.warn('⚠️ Cannot load project state without user ID');
                return false;
            }

            // Get user-specific project key
            const projectKey = `${this.KEYS.PROJECT_USER}${userId}`;
            let currentProjectId = localStorage.getItem(projectKey);

            // If no project found, try to load from project manager
            if (!currentProjectId && window.projectManager) {
                currentProjectId = window.projectManager.currentProject?.id || 'master';
            }

            // Default to master if still not found
            if (!currentProjectId) {
                currentProjectId = 'master';
            }

            // Store project selection
            localStorage.setItem(projectKey, currentProjectId);

            // Update project manager if available
            if (window.projectManager) {
                // Ensure user ID is set in project manager
                window.projectManager.currentUserId = userId;

                // Load projects for user
                window.projectManager.loadProjects();

                // Set current project
                window.projectManager.setCurrentProject(currentProjectId);

                console.log('✅ Project state loaded:', currentProjectId);
                return true;
            } else {
                console.warn('⚠️ Project manager not available yet');
                return false;
            }

        } catch (error) {
            console.error('❌ Error loading project state:', error);
            return false;
        }
    }

    /**
     * Get current user ID from various sources
     */
    getCurrentUserId() {
        // Try quick access storage
        let userId = localStorage.getItem(this.KEYS.USER_ID);
        
        if (userId) return userId;

        // Try from current user object
        const userJson = localStorage.getItem(this.KEYS.USER);
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                userId = user.userId || user.id;
                if (userId) {
                    localStorage.setItem(this.KEYS.USER_ID, userId);
                    return userId;
                }
            } catch (e) {
                console.error('Error parsing user:', e);
            }
        }

        // Try from auth manager
        if (window.authManager?.currentUser) {
            userId = window.authManager.currentUser.userId || window.authManager.currentUser.id;
            if (userId) {
                localStorage.setItem(this.KEYS.USER_ID, userId);
                return userId;
            }
        }

        // Try from global currentUser
        if (window.currentUser) {
            userId = window.currentUser.userId || window.currentUser.id;
            if (userId) {
                localStorage.setItem(this.KEYS.USER_ID, userId);
                return userId;
            }
        }

        return null;
    }

    /**
     * Setup cross-tab synchronization
     */
    setupCrossTabSync() {
        console.log('🔄 Setting up cross-tab synchronization...');

        window.addEventListener('storage', (event) => {
            if (this.syncInProgress) return;

            // User changed in another tab
            if (event.key === this.KEYS.USER || event.key === this.KEYS.SESSION) {
                console.log('🔄 User state changed in another tab');
                this.loadUserState().then(() => {
                    this.syncAllPageElements();
                });
            }

            // Project changed in another tab
            if (event.key?.startsWith(this.KEYS.PROJECT_USER) || event.key === this.KEYS.PROJECT) {
                console.log('🔄 Project state changed in another tab');
                this.loadProjectState().then(() => {
                    this.syncAllPageElements();
                });
            }
        });

        console.log('✅ Cross-tab synchronization enabled');
    }

    /**
     * Setup page navigation handlers
     */
    setupPageNavigationHandlers() {
        console.log('🔄 Setting up page navigation handlers...');

        // Before page unload - save current state
        window.addEventListener('beforeunload', () => {
            this.saveCurrentState();
        });

        // Page visibility change - restore state
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Page became visible - restore state
                this.restoreState();
            }
        });

        // Page load/navigation - restore state
        window.addEventListener('load', () => {
            this.restoreState();
        });

        // Navigation via popstate (back/forward buttons)
        window.addEventListener('popstate', () => {
            this.restoreState();
        });

        console.log('✅ Page navigation handlers set up');
    }

    /**
     * Setup periodic state verification
     */
    setupPeriodicStateCheck() {
        // Verify state every 5 seconds
        setInterval(() => {
            this.verifyState();
        }, 5000);

        console.log('✅ Periodic state check enabled');
    }

    /**
     * Save current state before navigation
     */
    saveCurrentState() {
        try {
            const state = {
                user: window.currentUser,
                userId: this.getCurrentUserId(),
                projectId: window.projectManager?.currentProject?.id,
                timestamp: Date.now(),
                page: window.location.pathname
            };

            localStorage.setItem(this.KEYS.LAST_PAGE, window.location.pathname);
            localStorage.setItem(this.KEYS.STATE_VERSION, Date.now().toString());

            console.log('💾 Current state saved');
        } catch (error) {
            console.error('❌ Error saving state:', error);
        }
    }

    /**
     * Restore state after navigation
     */
    async restoreState() {
        try {
            console.log('🔄 Restoring state...');

            // Reload user state
            await this.loadUserState();

            // Reload project state
            await this.loadProjectState();

            // Sync all page elements
            await this.syncAllPageElements();

            console.log('✅ State restored successfully');

        } catch (error) {
            console.error('❌ Error restoring state:', error);
        }
    }

    /**
     * Verify state consistency
     */
    async verifyState() {
        try {
            // Verify user state consistency
            const userJson = localStorage.getItem(this.KEYS.USER);
            const userId = this.getCurrentUserId();

            if (userJson && userId) {
                const user = JSON.parse(userJson);
                
                // Check if IDs match
                if (user.userId !== userId && user.id !== userId) {
                    console.warn('⚠️ User state inconsistency detected, fixing...');
                    user.userId = userId;
                    user.id = userId;
                    localStorage.setItem(this.KEYS.USER, JSON.stringify(user));
                }

                // Update global reference
                if (window.currentUser?.userId !== userId) {
                    window.currentUser = user;
                }

                // Update auth manager
                if (window.authManager && window.authManager.currentUser?.userId !== userId) {
                    window.authManager.currentUser = user;
                }
            }

            // Verify project state consistency
            if (window.projectManager && userId) {
                const projectKey = `${this.KEYS.PROJECT_USER}${userId}`;
                const storedProjectId = localStorage.getItem(projectKey);
                const currentProjectId = window.projectManager.currentProject?.id;

                if (storedProjectId && storedProjectId !== currentProjectId) {
                    console.warn('⚠️ Project state inconsistency detected, fixing...');
                    window.projectManager.setCurrentProject(storedProjectId);
                }
            }

        } catch (error) {
            console.error('❌ Error verifying state:', error);
        }
    }

    /**
     * Sync all page elements with current state
     */
    async syncAllPageElements() {
        if (this.syncInProgress) return;
        this.syncInProgress = true;

        try {
            console.log('🔄 Syncing all page elements...');

            // 1. Sync user display elements
            await this.syncUserDisplayElements();

            // 2. Sync project display elements
            await this.syncProjectDisplayElements();

            // 3. Update header elements
            this.updateHeaderElements();

            // 4. Dispatch sync complete event
            window.dispatchEvent(new CustomEvent('stateSyncComplete', {
                detail: {
                    user: window.currentUser,
                    project: window.projectManager?.currentProject
                }
            }));

            console.log('✅ All page elements synced');

        } catch (error) {
            console.error('❌ Error syncing page elements:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sync user display elements
     */
    async syncUserDisplayElements() {
        const user = window.currentUser;

        if (!user) {
            console.warn('⚠️ No user to sync');
            return;
        }

        // Update user name displays
        const userNameElements = document.querySelectorAll('[id*="user-name"], [data-user-name], #current-user, #dropdown-user-name');
        userNameElements.forEach(element => {
            if (element) {
                element.textContent = user.name || user.email || 'User';
            }
        });

        // Update user email displays
        const userEmailElements = document.querySelectorAll('[data-user-email]');
        userEmailElements.forEach(element => {
            if (element) {
                element.textContent = user.email || '';
            }
        });

        // Update user avatar/initial
        const avatarElements = document.querySelectorAll('#user-avatar-initial, [data-user-avatar]');
        avatarElements.forEach(element => {
            if (element) {
                const initial = (user.name || user.email || 'U')[0].toUpperCase();
                element.textContent = initial;
            }
        });

        // Update auth state elements
        const authElements = document.querySelectorAll('[data-auth-state]');
        authElements.forEach(element => {
            element.setAttribute('data-auth-state', 'authenticated');
        });

        console.log('✅ User display elements synced');
    }

    /**
     * Sync project display elements
     */
    async syncProjectDisplayElements() {
        if (!window.projectManager?.currentProject) {
            console.warn('⚠️ No project to sync');
            return;
        }

        const project = window.projectManager.currentProject;

        // Update project name displays
        const projectNameElements = document.querySelectorAll('[data-project-name], .project-selector-name');
        projectNameElements.forEach(element => {
            if (element) {
                element.textContent = project.name || 'Master Project';
            }
        });

        // Update project icon displays
        const projectIconElements = document.querySelectorAll('.project-selector-icon');
        projectIconElements.forEach(element => {
            if (element) {
                element.textContent = project.icon || '📋';
            }
        });

        // Update project dropdown selections
        const projectSelectors = document.querySelectorAll('#header-project-selector, #mobile-project-selector, [data-project-selector]');
        projectSelectors.forEach(selector => {
            if (selector && selector.tagName === 'SELECT') {
                selector.value = project.id;
            }
        });

        console.log('✅ Project display elements synced');
    }

    /**
     * Update header elements specifically
     */
    updateHeaderElements() {
        // Force update header user display if available
        if (typeof window.updateUserInfo === 'function') {
            window.updateUserInfo();
        }

        // Force update project UI if available
        if (window.projectManager && typeof window.projectManager.updateProjectUI === 'function') {
            window.projectManager.updateProjectUI();
        }

        console.log('✅ Header elements updated');
    }

    /**
     * Force refresh all state (use after user/project changes)
     */
    async forceRefresh() {
        console.log('🔄 Force refreshing all state...');

        this.syncInProgress = false; // Reset sync flag

        await this.loadUserState();
        await this.loadProjectState();
        await this.syncAllPageElements();

        console.log('✅ Force refresh complete');
    }

    /**
     * Clear all state (use on logout)
     */
    clearAllState() {
        console.log('🗑️ Clearing all state...');

        // Clear user state
        localStorage.removeItem(this.KEYS.USER);
        localStorage.removeItem(this.KEYS.USER_ID);
        localStorage.removeItem(this.KEYS.SESSION);

        // Clear project state
        const userId = this.getCurrentUserId();
        if (userId) {
            const projectKey = `${this.KEYS.PROJECT_USER}${userId}`;
            localStorage.removeItem(projectKey);
        }

        // Clear global references
        window.currentUser = null;
        if (window.authManager) {
            window.authManager.currentUser = null;
            window.authManager.isAuthenticated = false;
        }

        console.log('✅ All state cleared');
    }

    /**
     * Get current state summary
     */
    getStateSummary() {
        return {
            user: window.currentUser,
            userId: this.getCurrentUserId(),
            project: window.projectManager?.currentProject,
            isAuthenticated: window.authManager?.isAuthenticated || false,
            sessionActive: localStorage.getItem(this.KEYS.SESSION) === 'true',
            initialized: this.initialized
        };
    }
}

// Initialize global instance
console.log('📦 Creating State Persistence Manager...');
window.statePersistenceManager = new StatePersistenceManager();

// Global helper functions
window.refreshUserAndProjectState = function() {
    if (window.statePersistenceManager) {
        window.statePersistenceManager.forceRefresh();
    }
};

window.getStateStatus = function() {
    if (window.statePersistenceManager) {
        const summary = window.statePersistenceManager.getStateSummary();
        console.table(summary);
        return summary;
    }
    return null;
};

// Listen for user login/logout events
window.addEventListener('userLoggedIn', (event) => {
    console.log('👤 User logged in event received');
    if (window.statePersistenceManager) {
        setTimeout(() => {
            window.statePersistenceManager.forceRefresh();
        }, 100);
    }
});

window.addEventListener('userLoggedOut', () => {
    console.log('🚪 User logged out event received');
    if (window.statePersistenceManager) {
        window.statePersistenceManager.clearAllState();
    }
});

// Listen for project change events
window.addEventListener('projectChanged', (event) => {
    console.log('📋 Project changed event received');
    if (window.statePersistenceManager) {
        setTimeout(() => {
            window.statePersistenceManager.syncProjectDisplayElements();
        }, 50);
    }
});

console.log('✅ State Persistence Manager ready');

