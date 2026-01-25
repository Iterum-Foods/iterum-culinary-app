/**
 * Authentication Diagnostics Tool
 * Provides debugging and monitoring tools for the auth system
 */

(function() {
    'use strict';
    
    console.log('🔧 Auth Diagnostics loading...');
    
    // Create diagnostics namespace
    window.authDiagnostics = {
        
        /**
         * Get complete system status
         */
        getStatus() {
            console.log('📊 === AUTH SYSTEM STATUS ===');
            
            const status = {
                authManager: this.checkAuthManager(),
                localStorage: this.checkLocalStorage(),
                firebase: this.checkFirebase(),
                currentUser: this.checkCurrentUser(),
                browser: this.checkBrowser(),
                timestamp: new Date().toISOString()
            };
            
            console.table(status);
            return status;
        },
        
        /**
         * Check AuthManager status
         */
        checkAuthManager() {
            const status = {
                available: !!window.authManager,
                initialized: window.authManager?.initialized,
                isAuthenticated: window.authManager?.isAuthenticated,
                hasUser: !!window.authManager?.currentUser,
                userEmail: window.authManager?.currentUser?.email
            };
            
            console.log('🔐 AuthManager:', status);
            return status;
        },
        
        /**
         * Check localStorage status
         */
        checkLocalStorage() {
            try {
                const status = {
                    available: typeof localStorage !== 'undefined',
                    session_active: localStorage.getItem('session_active'),
                    current_user_exists: !!localStorage.getItem('current_user'),
                    last_login: localStorage.getItem('last_login'),
                    saved_users_count: this.getSavedUsersCount()
                };
                
                console.log('💾 localStorage:', status);
                
                // Try to parse current user
                try {
                    const userJson = localStorage.getItem('current_user');
                    if (userJson) {
                        const user = JSON.parse(userJson);
                        console.log('👤 Current User:', {
                            email: user.email,
                            name: user.name,
                            type: user.type,
                            id: user.id
                        });
                    }
                } catch (e) {
                    console.error('❌ Error parsing current_user:', e);
                }
                
                return status;
                
            } catch (error) {
                console.error('❌ localStorage check failed:', error);
                return { error: error.message };
            }
        },
        
        /**
         * Check Firebase status
         */
        checkFirebase() {
            const status = {
                configAvailable: !!window.firebaseConfig,
                authAvailable: !!window.firebaseAuth,
                authInitialized: window.firebaseAuth?.isInitialized,
                firestoreAvailable: !!window.firestoreSync,
                firestoreInitialized: window.firestoreSync?.initialized
            };
            
            console.log('🔥 Firebase:', status);
            return status;
        },
        
        /**
         * Check current user
         */
        checkCurrentUser() {
            const status = {
                window_currentUser: !!window.currentUser,
                manager_currentUser: !!window.authManager?.currentUser,
                match: window.currentUser === window.authManager?.currentUser
            };
            
            if (window.currentUser) {
                console.log('👤 window.currentUser:', {
                    email: window.currentUser.email,
                    name: window.currentUser.name,
                    type: window.currentUser.type
                });
            }
            
            return status;
        },
        
        /**
         * Check browser compatibility
         */
        checkBrowser() {
            const status = {
                userAgent: navigator.userAgent,
                cookiesEnabled: navigator.cookieEnabled,
                localStorageAvailable: typeof localStorage !== 'undefined',
                sessionStorageAvailable: typeof sessionStorage !== 'undefined'
            };
            
            console.log('🌐 Browser:', status);
            return status;
        },
        
        /**
         * Get saved users count
         */
        getSavedUsersCount() {
            try {
                const saved = localStorage.getItem('saved_users');
                if (saved) {
                    return JSON.parse(saved).length;
                }
                return 0;
            } catch (e) {
                return 0;
            }
        },
        
        /**
         * Test authentication flow
         */
        async testAuth() {
            console.log('🧪 === TESTING AUTH FLOW ===');
            
            try {
                if (!window.authManager) {
                    throw new Error('AuthManager not available');
                }
                
                console.log('1. Checking auth status...');
                const { authenticated, user } = await window.authManager.checkAuth();
                
                console.log('   Result:', authenticated ? '✅ Authenticated' : '❌ Not authenticated');
                if (user) {
                    console.log('   User:', user.email);
                }
                
                console.log('2. Checking localStorage...');
                const sessionActive = localStorage.getItem('session_active');
                const currentUser = localStorage.getItem('current_user');
                console.log('   session_active:', sessionActive);
                console.log('   current_user:', !!currentUser);
                
                console.log('3. Verifying consistency...');
                if (authenticated && sessionActive === 'true' && currentUser) {
                    console.log('   ✅ All checks passed');
                    return true;
                } else {
                    console.warn('   ⚠️ Inconsistency detected');
                    console.log('   authenticated:', authenticated);
                    console.log('   session_active:', sessionActive);
                    console.log('   current_user exists:', !!currentUser);
                    return false;
                }
                
            } catch (error) {
                console.error('❌ Test failed:', error);
                return false;
            }
        },
        
        /**
         * Clear all auth data (use with caution)
         */
        clearAllAuth() {
            console.warn('⚠️ Clearing all authentication data...');
            
            try {
                // Clear localStorage
                localStorage.removeItem('session_active');
                localStorage.removeItem('current_user');
                localStorage.removeItem('last_login');
                localStorage.removeItem('auth_state');
                
                // Clear AuthManager state
                if (window.authManager) {
                    window.authManager.clearSession();
                }
                
                // Clear window.currentUser
                window.currentUser = null;
                
                console.log('✅ All auth data cleared');
                console.log('💡 Reload the page to start fresh');
                
                return true;
                
            } catch (error) {
                console.error('❌ Clear failed:', error);
                return false;
            }
        },
        
        /**
         * Export diagnostics report
         */
        exportReport() {
            const report = {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                status: this.getStatus(),
                localStorage: {
                    session_active: localStorage.getItem('session_active'),
                    has_current_user: !!localStorage.getItem('current_user'),
                    last_login: localStorage.getItem('last_login')
                }
            };
            
            const reportJson = JSON.stringify(report, null, 2);
            console.log('📋 Diagnostics Report:');
            console.log(reportJson);
            
            return report;
        },
        
        /**
         * Monitor auth changes
         */
        startMonitoring() {
            console.log('👀 Starting auth monitoring...');
            
            // Monitor localStorage changes
            window.addEventListener('storage', (e) => {
                if (e.key === 'session_active' || e.key === 'current_user') {
                    console.log('🔄 localStorage changed:', {
                        key: e.key,
                        oldValue: e.oldValue,
                        newValue: e.newValue
                    });
                }
            });
            
            // Monitor AuthManager events
            if (window.authManager) {
                window.authManager.on('session_saved', (user) => {
                    console.log('✅ Session saved:', user.email);
                });
                
                window.authManager.on('session_cleared', () => {
                    console.log('🗑️ Session cleared');
                });
                
                window.authManager.on('signed_out', () => {
                    console.log('👋 User signed out');
                });
            }
            
            console.log('✅ Monitoring started');
        },
        
        /**
         * Quick status check (shorthand)
         */
        check() {
            return this.getStatus();
        },
        
        /**
         * Show help
         */
        help() {
            console.log('');
            console.log('🔧 === AUTH DIAGNOSTICS HELP ===');
            console.log('');
            console.log('Available commands:');
            console.log('  authDiagnostics.getStatus()      - Get complete system status');
            console.log('  authDiagnostics.check()          - Quick status check');
            console.log('  authDiagnostics.testAuth()       - Test authentication flow');
            console.log('  authDiagnostics.clearAllAuth()   - Clear all auth data');
            console.log('  authDiagnostics.exportReport()   - Export diagnostics report');
            console.log('  authDiagnostics.startMonitoring() - Monitor auth changes');
            console.log('  authDiagnostics.help()           - Show this help');
            console.log('');
            console.log('AuthManager commands:');
            console.log('  authManager.checkAuth()          - Check if authenticated');
            console.log('  authManager.getDiagnostics()     - Get AuthManager diagnostics');
            console.log('  authManager.signOut()            - Sign out current user');
            console.log('');
        }
    };
    
    // Auto-run status check on load
    setTimeout(() => {
        console.log('');
        console.log('🔧 Auth Diagnostics loaded. Type "authDiagnostics.help()" for help.');
        console.log('');
    }, 1000);
    
    console.log('✅ Auth Diagnostics loaded');
    
})();

