/**
 * Lightweight Authentication System
 * Non-blocking, fast, and simple
 * 
 * This replaces the heavy UnifiedAuthSystem for pages that need
 * authentication checking without blocking the UI.
 */

class AuthLite {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Load user data immediately (sync, fast)
        this.loadUserData();
        
        console.log('✅ AuthLite initialized:', this.isAuthenticated ? 'User logged in' : 'No user');
    }
    
    /**
     * Load user data from localStorage (synchronous, fast)
     */
    loadUserData() {
        try {
            const sessionActive = localStorage.getItem('session_active');
            const currentUserStr = localStorage.getItem('current_user');
            
            console.log('🔍 Loading user data...');
            console.log('  session_active:', sessionActive);
            console.log('  current_user exists:', !!currentUserStr);
            
            if (sessionActive === 'true' && currentUserStr) {
                this.currentUser = JSON.parse(currentUserStr);
                this.isAuthenticated = true;
                console.log('👤 User loaded:', this.currentUser.name || this.currentUser.email);
                console.log('  Full user data:', this.currentUser);
            } else {
                console.log('⚠️ No valid session found');
                console.log('  session_active is:', sessionActive);
                console.log('  current_user is:', currentUserStr ? 'present' : 'missing');
            }
        } catch (error) {
            console.warn('⚠️ Could not load user data:', error);
            this.isAuthenticated = false;
        }
    }
    
    /**
     * Refresh user data from localStorage
     */
    refreshUserData() {
        console.log('🔄 Refreshing user data...');
        this.loadUserData();
        return this.isAuthenticated;
    }
    
    /**
     * Check if user is authenticated
     */
    isUserAuthenticated() {
        return this.isAuthenticated;
    }
    
    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Get user name
     */
    getUserName() {
        if (!this.currentUser) return 'Guest';
        return this.currentUser.name || this.currentUser.email || 'User';
    }
    
    /**
     * Sign out
     */
    signOut() {
        localStorage.removeItem('current_user');
        localStorage.removeItem('session_active');
        localStorage.removeItem('last_login');
        this.currentUser = null;
        this.isAuthenticated = false;
        
        console.log('👋 User signed out');
        
        // Redirect to launch page
        window.location.href = 'launch.html';
    }
    
    /**
     * Show login prompt if not authenticated
     * Non-blocking, just shows a notice
     */
    showLoginPrompt() {
        if (this.isAuthenticated) return;
        
        // Create a simple, non-blocking notice
        const notice = document.createElement('div');
        notice.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        notice.innerHTML = `
            <div style="color: #92400e; font-weight: 600; margin-bottom: 8px;">⚠️ Not Signed In</div>
            <div style="color: #92400e; font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
                Sign in to save your work and access all features.
            </div>
            <div style="display: flex; gap: 8px;">
                <a href="launch.html" style="padding: 8px 16px; background: #f59e0b; color: white; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                    Sign In
                </a>
                <button onclick="this.closest('div').parentElement.remove()" style="padding: 8px 16px; background: white; border: 2px solid #f59e0b; color: #92400e; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;">
                    Dismiss
                </button>
            </div>
        `;
        
        document.body.appendChild(notice);
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (notice.parentElement) {
                notice.remove();
            }
        }, 10000);
    }
    
    /**
     * Update header with user info
     * Non-blocking, optional
     */
    updateHeader() {
        if (!this.isAuthenticated) return;
        
        // Find header user info elements
        const userNameElements = document.querySelectorAll('.user-name, #user-name, [data-user-name]');
        const userEmailElements = document.querySelectorAll('.user-email, #user-email, [data-user-email]');
        
        userNameElements.forEach(el => {
            el.textContent = this.getUserName();
        });
        
        userEmailElements.forEach(el => {
            if (this.currentUser && this.currentUser.email) {
                el.textContent = this.currentUser.email;
            }
        });
    }
}

// Create global instance immediately
window.authLite = new AuthLite();

// Alias for backward compatibility
window.unifiedAuth = {
    isAuthenticated: () => window.authLite.isUserAuthenticated(),
    getCurrentUser: () => window.authLite.getCurrentUser(),
    signOut: () => window.authLite.signOut()
};
window.unifiedAuthSystem = window.unifiedAuth;

console.log('✅ AuthLite ready - lightweight authentication loaded');

