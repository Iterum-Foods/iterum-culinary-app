/**
 * Header Sync Loader
 * Automatically ensures header user synchronization on all pages
 * This script should be included on every page that has a header
 */

(function() {
    'use strict';
    
    console.log('🔄 Header Sync Loader: Starting automatic header synchronization...');
    
    // Function to ensure header sync is loaded and initialized
    let retryCount = 0;
    const maxRetries = 25; // 5 seconds timeout (25 * 200ms)
    
    function ensureHeaderSync() {
        // Check if header user sync is already loaded
        if (window.HeaderUserSync && window.headerUserSync) {
            console.log('✅ Header sync already available, initializing...');
            if (typeof window.headerUserSync.init === 'function') {
                window.headerUserSync.init();
            } else if (typeof window.headerUserSync.initialize === 'function') {
                window.headerUserSync.initialize();
            }
            return;
        }
        
        // If HeaderUserSync class is available but not initialized
        if (window.HeaderUserSync && !window.headerUserSync) {
            console.log('✅ HeaderUserSync class available, creating instance...');
            window.headerUserSync = new window.HeaderUserSync();
            if (typeof window.headerUserSync.init === 'function') {
                window.headerUserSync.init();
            }
            return;
        }
        
        // If neither is available, wait and retry with timeout
        retryCount++;
        if (retryCount >= maxRetries) {
            console.warn('⚠️ Header sync not available after timeout, skipping...');
            return;
        }
        
        console.log('⏳ Header sync not ready, waiting...');
        setTimeout(ensureHeaderSync, 200);
    }
    
    // Function to initialize header sync when DOM is ready
    function initHeaderSync() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', ensureHeaderSync);
        } else {
            // DOM is already ready
            ensureHeaderSync();
        }
    }
    
    // Function to handle page visibility changes
    function handleVisibilityChange() {
        if (!document.hidden && window.headerUserSync) {
            console.log('🔄 Page became visible, refreshing header sync...');
            setTimeout(() => {
                if (window.headerUserSync && typeof window.headerUserSync.refresh === 'function') {
                    window.headerUserSync.refresh();
                }
            }, 100);
        }
    }
    
    // Function to handle storage changes (cross-tab sync)
    function handleStorageChange(event) {
        if (event.key === 'current_user' || event.key === 'session_active') {
            console.log('🔄 Storage change detected, updating header...');
            setTimeout(() => {
                if (window.headerUserSync && typeof window.headerUserSync.syncUserDisplay === 'function') {
                    window.headerUserSync.syncUserDisplay();
                }
            }, 100);
        }
    }
    
    // Function to handle authentication events
    function handleAuthEvent(event) {
        console.log(`🔐 Auth event received: ${event.type}`);
        setTimeout(() => {
            if (window.headerUserSync && typeof window.headerUserSync.syncUserDisplay === 'function') {
                window.headerUserSync.syncUserDisplay();
            }
        }, 100);
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Listen for storage changes
        window.addEventListener('storage', handleStorageChange);
        
        // Listen for authentication events
        document.addEventListener('userLoggedIn', handleAuthEvent);
        document.addEventListener('userLoggedOut', handleAuthEvent);
        document.addEventListener('userSwitched', handleAuthEvent);
        document.addEventListener('iterumUserDataLoaded', handleAuthEvent);
    }
    
    // Initialize everything
    function initialize() {
        console.log('🚀 Header Sync Loader: Initializing...');
        setupEventListeners();
        initHeaderSync();
        
        // Also try to initialize after a longer delay to catch late-loading systems
        setTimeout(ensureHeaderSync, 1000);
        setTimeout(ensureHeaderSync, 2000);
    }
    
    // Start initialization
    initialize();
    
    // Export global function for manual initialization
    window.ensureHeaderSync = ensureHeaderSync;
    
    console.log('✅ Header Sync Loader: Setup complete');
})();
