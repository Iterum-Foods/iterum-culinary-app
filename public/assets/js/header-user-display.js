/**
 * Header User Display
 * Displays authenticated user information in the header
 * Uses new AuthManager system
 */

(function() {
    'use strict';
    
    console.log('👤 Header User Display initializing...');
    
    // Wait for AuthManager to be ready
    async function waitForAuthManager() {
        let attempts = 0;
        while (!window.authManager && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        return window.authManager;
    }
    
    // Update header user display
    async function updateHeaderUserDisplay() {
        console.log('👤 Updating header user display...');
        
        const authManager = await waitForAuthManager();
        
        if (!authManager) {
            console.error('❌ AuthManager not available');
            return;
        }
        
        const { authenticated, user } = await authManager.checkAuth();
        
        if (!authenticated || !user) {
            console.log('⚠️ User not authenticated');
            return;
        }
        
        console.log('✅ User authenticated, updating display:', user.email);
        
        // Update user name
        const userNameElements = document.querySelectorAll('#current-user, #header-user-name, #dropdown-user-name');
        userNameElements.forEach(el => {
            if (el) el.textContent = user.name || user.email.split('@')[0];
        });
        
        // Update user email
        const userEmailElements = document.querySelectorAll('#header-user-email');
        userEmailElements.forEach(el => {
            if (el) el.textContent = user.email;
        });
        
        // Update user avatar initial
        const avatarInitial = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
        const avatarElements = document.querySelectorAll('#user-avatar-initial, #user-avatar-text');
        avatarElements.forEach(el => {
            if (el) el.textContent = avatarInitial;
        });
        
        // Update user role
        const userRoleElements = document.querySelectorAll('#dropdown-user-role, .header-user-role');
        userRoleElements.forEach(el => {
            if (el) el.textContent = user.type === 'trial' ? 'Trial User' : 'Chef';
        });
        
        // Show user tab
        const userTab = document.getElementById('header-user-tab');
        if (userTab) {
            userTab.style.display = 'flex';
        }
        
        console.log('✅ Header user display updated');
    }
    
    // Toggle user dropdown
    window.toggleUserDropdown = function() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    };
    
    // Handle sign out
    window.handleSignOut = async function() {
        console.log('👋 Signing out...');
        
        try {
            if (window.authManager) {
                await window.authManager.signOut();
            }
            
            // Redirect to launch page
            window.location.href = 'launch.html';
            
        } catch (error) {
            console.error('❌ Sign out error:', error);
            // Redirect anyway
            window.location.href = 'launch.html';
        }
    };
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('user-dropdown');
        const userTab = document.getElementById('header-user-tab');
        
        if (dropdown && userTab) {
            if (!userTab.contains(event.target)) {
                dropdown.classList.remove('show');
            }
        }
    });
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateHeaderUserDisplay);
    } else {
        updateHeaderUserDisplay();
    }
    
    // Listen for auth state changes
    if (window.authManager) {
        window.authManager.on('session_loaded', updateHeaderUserDisplay);
        window.authManager.on('session_saved', updateHeaderUserDisplay);
    }
    
    console.log('✅ Header User Display loaded');
    
})();

