/**
 * Header User Display Synchronization
 * Ensures user information is consistently displayed in the header across all pages
 */

class HeaderUserSync {
    constructor() {
        this.headerElements = {
            currentUser: null,
            userAvatar: null,
            dropdownUserName: null,
            dropdownUserRole: null,
            userRole: null
        };
        this.initialized = false;
    }

    /**
     * Initialize header synchronization
     */
    init() {
        if (this.initialized) {
            console.log('🔄 Header User Sync already initialized');
            return;
        }
        
        console.log('🔄 Initializing Header User Sync...');
        this.findHeaderElements();
        this.setupEventListeners();
        this.syncUserDisplay();
        this.initialized = true;
    }

    /**
     * Initialize header synchronization (alias for init)
     */
    initialize() {
        this.init();
    }

    /**
     * Find all user-related header elements
     */
    findHeaderElements() {
        this.headerElements = {
            currentUser: document.getElementById('current-user'),
            userAvatar: document.getElementById('user-avatar'),
            dropdownUserName: document.getElementById('dropdown-user-name'),
            dropdownUserRole: document.getElementById('dropdown-user-role'),
            userRole: document.getElementById('user-role')
        };

        // Log found elements for debugging
        const foundElements = Object.entries(this.headerElements)
            .filter(([key, element]) => element !== null)
            .map(([key]) => key);
        
        console.log('✅ Found header elements:', foundElements);
    }

    /**
     * Setup event listeners for authentication changes
     */
    setupEventListeners() {
        // Listen for custom authentication events
        document.addEventListener('userLoggedIn', (event) => {
            console.log('🔐 Header sync: User logged in event received');
            this.syncUserDisplay();
        });

        document.addEventListener('userLoggedOut', (event) => {
            console.log('🔐 Header sync: User logged out event received');
            this.syncUserDisplay();
        });

        document.addEventListener('userSwitched', (event) => {
            console.log('🔐 Header sync: User switched event received');
            this.syncUserDisplay();
        });

        // Listen for storage changes (when auth state changes in other tabs)
        window.addEventListener('storage', (event) => {
            if (event.key === 'current_user' || event.key === 'session_active') {
                console.log('🔄 Header sync: Storage change detected, updating display');
                this.syncUserDisplay();
            }
        });

        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('🔄 Header sync: Page became visible, checking user state');
                this.syncUserDisplay();
            }
        });
    }

    /**
     * Synchronize user display in header
     */
    syncUserDisplay() {
        try {
            const currentUser = this.getCurrentUser();
            
            if (currentUser) {
                this.updateHeaderWithUser(currentUser);
                console.log('✅ Header updated with user:', currentUser.name);
            } else {
                this.updateHeaderAsGuest();
                console.log('✅ Header updated as guest user');
            }
        } catch (error) {
            console.error('❌ Error syncing header user display:', error);
        }
    }

    /**
     * Get current user from authentication system
     */
    getCurrentUser() {
        // Try to get from localStorage first
        const currentUserStr = localStorage.getItem('current_user');
        if (currentUserStr) {
            try {
                return JSON.parse(currentUserStr);
            } catch (e) {
                console.warn('⚠️ Could not parse current_user from localStorage');
            }
        }

        // Try to get from authLite if available
        if (window.authLite && typeof window.authLite.getCurrentUser === 'function') {
            const user = window.authLite.getCurrentUser();
            if (user) {
                return user;
            }
        }

        // Try to get from global currentUser if available
        if (window.currentUser) {
            return window.currentUser;
        }

        return null;
    }

    /**
     * Update header with user information
     */
    updateHeaderWithUser(user) {
        const { currentUser, userAvatar, dropdownUserName, dropdownUserRole, userRole } = this.headerElements;

        // Update main user display
        if (currentUser) {
            currentUser.textContent = user.name || 'Unknown User';
            currentUser.classList.remove('text-gray-500');
            currentUser.classList.add('text-white', 'font-semibold');
        }

        // Update user role
        if (userRole) {
            userRole.textContent = user.role || user.title || 'Chef';
        }

        // Update dropdown user info
        if (dropdownUserName) {
            dropdownUserName.textContent = user.name || 'Unknown User';
        }

        if (dropdownUserRole) {
            dropdownUserRole.textContent = user.role || user.title || 'Chef';
        }

        // Update avatar if available
        if (userAvatar) {
            if (user.avatar) {
                userAvatar.style.backgroundImage = `url(${user.avatar})`;
            } else {
                // Use initials as fallback
                const initials = this.getInitials(user.name);
                userAvatar.textContent = initials;
                userAvatar.style.backgroundImage = 'none';
                userAvatar.style.backgroundColor = this.getUserColor(user.name);
            }
        }

        // Update page title to include user name
        this.updatePageTitle(user.name);
    }

    /**
     * Update header as guest user
     */
    updateHeaderAsGuest() {
        const { currentUser, userAvatar, dropdownUserName, dropdownUserRole, userRole } = this.headerElements;

        // Reset to guest state
        if (currentUser) {
            currentUser.textContent = 'Guest User';
            currentUser.classList.remove('text-white', 'font-semibold');
            currentUser.classList.add('text-gray-500');
        }

        if (userRole) {
            userRole.textContent = 'Guest';
        }

        if (dropdownUserName) {
            dropdownUserName.textContent = 'Guest User';
        }

        if (dropdownUserRole) {
            dropdownUserRole.textContent = 'Guest';
        }

        if (userAvatar) {
            userAvatar.textContent = 'G';
            userAvatar.style.backgroundImage = 'none';
            userAvatar.style.backgroundColor = '#9CA3AF';
        }

        // Reset page title
            this.updatePageTitle('Guest');
    }

    /**
     * Get user initials from name
     */
    getInitials(name) {
        if (!name) return 'U';
        return name.split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    /**
     * Get consistent color for user avatar
     */
    getUserColor(name) {
        if (!name) return '#9CA3AF';
        
        // Generate consistent color based on name
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 60%)`;
    }

    /**
     * Update page title to include user name
     */
    updatePageTitle(userName) {
        const baseTitle = document.title.replace(/ - .*$/, ''); // Remove existing user suffix
        if (userName && userName !== 'Guest') {
            document.title = `${baseTitle} - ${userName}`;
        } else {
            document.title = baseTitle;
        }
    }

    /**
     * Force refresh of user display
     */
    refresh() {
        console.log('🔄 Header sync: Forcing refresh');
        this.findHeaderElements();
        this.syncUserDisplay();
    }

    /**
     * Manual trigger for user display update
     */
    updateUserDisplay() {
        this.syncUserDisplay();
    }
}

// Global auto-initialization function
window.initializeHeaderUserSync = function() {
    if (!window.headerUserSync) {
        window.headerUserSync = new HeaderUserSync();
    }
    window.headerUserSync.init();
    return window.headerUserSync;
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other systems to load
    setTimeout(() => {
        window.initializeHeaderUserSync();
    }, 100);
});

// Auto-initialize when page becomes visible (for better cross-tab sync)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.headerUserSync) {
        // Refresh user display when page becomes visible
        setTimeout(() => {
            window.headerUserSync.refresh();
        }, 200);
    }
});

// Make HeaderUserSync globally available
window.HeaderUserSync = HeaderUserSync;

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderUserSync;
}
