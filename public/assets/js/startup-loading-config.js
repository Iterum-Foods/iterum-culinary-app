/**
 * Startup Loading Configuration with Integrated User Selection
 * Controls the loading screen duration at startup and handles user selection
 * ENSURES LOADING SCREEN NEVER GETS STUCK + SEAMLESS USER SELECTION
 */

class StartupLoadingManager {
    constructor() {
        this.loadingDuration = 3000; // 3 seconds default
        this.fadeOutDuration = 500; // Fade out animation duration
        this.loadingStartTime = Date.now();
        this.hasStarted = false;
        this.maxWaitTime = 10000; // Maximum 10 seconds before forcing hide
        this.isHidden = false;
        this.userSelected = false;
        this.authFlowShown = false;
        
        this.init();
    }

    /**
     * Initialize the loading manager with integrated user selection
     */
    init() {
        console.log('🕒 Startup loading configured for 3 seconds with user selection');
        console.log('🔒 User selection will be ENFORCED before app can start');
        
        // Wait for user system to be ready before proceeding
        this.waitForUserSystem();
    }

    /**
     * Wait for user system to be ready
     */
    waitForUserSystem() {
        if (window.userSystem) {
            console.log('✅ User system ready, initializing startup manager');
            this.initializeStartupManager();
        } else {
            console.log('⏳ Waiting for user system to be ready...');
            setTimeout(() => this.waitForUserSystem(), 100);
        }
    }

    /**
     * Initialize startup manager components
     */
    initializeStartupManager() {
        console.log('🚀 Initializing startup manager with user selection requirement');
        
        // Block any unauthorized hiding attempts
        this.blockUnauthorizedHiding();
        
        // Override existing loading screen hide functions
        this.overrideExistingFunctions();
        
        // IMMEDIATELY show user selection - no delay
        console.log('🔒 Enforcing user selection requirement');
        this.showUserSelectionFlow();
        
        // Set up automatic hiding after user selection + 3 seconds
        this.setupAutoHide();
        
        // Set up emergency timeout (10 seconds max)
        this.setupEmergencyTimeout();
        
        // Track loading completion
        this.trackLoadingCompletion();
        
        // Ensure loading screen is visible initially
        this.ensureLoadingScreenVisible();
        
        // Force the loading screen to show user selection
        this.forceUserSelectionDisplay();
    }

    /**
     * Force the loading screen to display user selection interface
     */
    forceUserSelectionDisplay() {
        console.log('🔒 Forcing user selection display');
        
        // Check if user is already selected
        if (window.userSystem && window.userSystem.getCurrentUser()) {
            console.log('✅ User already selected, proceeding to loading progress');
            this.userSelected = true;
            this.showLoadingProgress();
            return;
        }
        
        // Force show user selection after a brief delay to ensure DOM is ready
        setTimeout(() => {
            if (!this.userSelected) {
                console.log('🔒 User selection not completed, forcing display');
                this.showUserSelectionFlow();
            }
        }, 100);
    }

    /**
     * Ensure loading screen is visible and blocking at startup
     */
    ensureLoadingScreenVisible() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            // Force the loading screen to be visible and blocking
            loadingOverlay.style.display = 'flex';
            loadingOverlay.style.opacity = '1';
            loadingOverlay.style.visibility = 'visible';
            loadingOverlay.style.pointerEvents = 'auto';
            loadingOverlay.style.zIndex = '9999';
            
            // Prevent body scrolling
            document.body.style.overflow = 'hidden';
            document.body.style.pointerEvents = 'none';
            
            console.log('✅ Loading screen ensured visible and blocking');
        } else {
            console.warn('⚠️ Loading overlay not found');
        }
    }

    /**
     * Override existing hideLoadingScreen functions to use our timing
     */
    overrideExistingFunctions() {
        // Store original functions
        const originalUnifiedAuthHide = window.unifiedAuth?.hideLoadingScreen;
        const originalMainAuthUI = window.updateAuthUI;

        // Override unified auth hideLoadingScreen
        if (window.unifiedAuth) {
            window.unifiedAuth.hideLoadingScreen = () => {
                this.hideLoadingScreenWithDelay();
            };
        }

        // Override main.js updateAuthUI
        // Authentication is now handled by unified_auth_system.js
        // This file focuses on loading screen management

        console.log('✅ Loading screen timing functions overridden');
    }

    /**
     * Show integrated user selection flow in loading screen
     */
    showUserSelectionFlow() {
        if (this.authFlowShown) return;
        this.authFlowShown = true;
        
        console.log('🔒 Displaying user selection interface');
        
        const loadingOverlay = document.getElementById('loading-overlay');
        if (!loadingOverlay) {
            console.error('❌ Loading overlay not found');
            return;
        }
        
        // Check if user is already selected using our new simple user system
        if (window.userSystem && window.userSystem.getCurrentUser()) {
            console.log('✅ User already selected, proceeding to loading progress');
            this.userSelected = true;
            this.showLoadingProgress();
            return;
        }
        
        // ENFORCE USER SELECTION - No more skipping for utility pages
        console.log('🔒 User selection required before app can start');
        
        // COMPLETELY REPLACE the loading screen content with user selection
        loadingOverlay.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <!-- Header -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center">
                    <div class="text-3xl mb-2">👨‍🍳</div>
                    <h2 class="text-2xl font-bold">Welcome to Iterum</h2>
                    <p class="text-blue-100">Your Culinary Research & Development Notebook</p>
                </div>
                
                <!-- User Selection Required Message -->
                <div class="px-6 pt-4 pb-2">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <p class="text-blue-800 font-medium">Please select a profile to continue</p>
                        <p class="text-blue-600 text-sm mt-1">This is required to access your workspace</p>
                    </div>
                </div>
                
                <!-- User Selection -->
                <div class="p-6">
                    <div id="saved-users-list" class="space-y-3 mb-6">
                        ${this.getSavedUsersList()}
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="space-y-3">
                        <button onclick="window.startupLoadingManager.createNewProfile()" class="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-all">
                            ➕ Create New Profile
                        </button>
                        <button onclick="window.startupLoadingManager.continueOffline()" class="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-600 transition-all">
                            🚀 Continue Offline
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Ensure the loading overlay is visible and blocking
        loadingOverlay.style.display = 'flex';
        loadingOverlay.style.opacity = '1';
        loadingOverlay.style.visibility = 'visible';
        loadingOverlay.style.pointerEvents = 'auto';
        
        console.log('✅ User selection interface displayed');
        
        // Start loading progress animation (but don't hide until user selected)
        this.startLoadingProgress();
    }

    /**
     * Get saved users list HTML
     */
    getSavedUsersList() {
        try {
            // Use our new simple user system
            if (window.userSystem) {
                const savedUsers = window.userSystem.getAllUsers();
                if (savedUsers.length === 0) {
                    return '<div class="text-center text-gray-500 py-4">No saved profiles found</div>';
                }
                
                return savedUsers.map(user => `
                    <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3 border hover:bg-gray-100 transition-colors">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                ${user.avatar || user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="font-semibold text-gray-800">${user.name}</div>
                                ${user.role ? `<div class="text-sm text-gray-600">${user.role}</div>` : ''}
                                ${user.email ? `<div class="text-xs text-gray-500">${user.email}</div>` : ''}
                            </div>
                        </div>
                        <button onclick="window.startupLoadingManager.selectUser('${user.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                            Select
                        </button>
                    </div>
                `).join('');
            } else {
                return '<div class="text-center text-gray-500 py-4">User system not available</div>';
            }
        } catch (e) {
            console.error('Error loading user list:', e);
            return '<div class="text-center text-gray-500 py-4">Error loading profiles</div>';
        }
    }

    /**
     * Start loading progress animation
     */
    startLoadingProgress() {
        const progressBar = document.getElementById('loading-progress');
        if (!progressBar) return;
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            
            if (this.userSelected && progress >= 90) {
                clearInterval(interval);
                this.completeLoading();
            }
        }, 200);
        
        this.progressInterval = interval;
    }

    /**
     * Show loading progress after user selection
     */
    showLoadingProgress() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (!loadingOverlay) return;
        
        loadingOverlay.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <!-- Header -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center">
                    <div class="text-3xl mb-2">👨‍🍳</div>
                    <h2 class="text-2xl font-bold">Welcome back!</h2>
                    <p class="text-blue-100">Loading your workspace...</p>
                </div>
                
                <!-- Loading Progress Bar -->
                <div class="px-6 pt-4">
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div id="loading-progress" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <p class="text-center text-sm text-gray-600 mt-2">Initializing application...</p>
                </div>
                
                <!-- Loading Steps -->
                <div class="p-6">
                    <div class="space-y-3">
                        <div class="flex items-center space-x-3">
                            <div class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                            <span class="text-sm text-gray-700">User profile loaded</span>
                        </div>
                        <div class="flex items-center space-x-3">
                            <div id="step-2" class="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs">2</div>
                            <span class="text-sm text-gray-700">Loading application modules</span>
                        </div>
                        <div class="flex items-center space-x-3">
                            <div id="step-3" class="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs">3</div>
                            <span class="text-sm text-gray-700">Initializing workspace</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Start progress animation
        this.startLoadingProgress();
    }

    /**
     * Select a user from the list
     */
    selectUser(userId) {
        try {
            // Use our new simple user system
            if (window.userSystem) {
                const success = window.userSystem.setCurrentUser(userId);
                if (success) {
                    this.userSelected = true;
                    this.showLoadingProgress();
                    console.log('✅ User selected via startup manager');
                    
                    // Dispatch app ready event
                    window.dispatchEvent(new CustomEvent('iterumAppReady', {
                        detail: { user: window.userSystem.getCurrentUser() }
                    }));
                }
            } else {
                console.error('User system not available');
            }
        } catch (e) {
            console.error('Error selecting user:', e);
        }
    }

    /**
     * Select user from external list (deprecated - using inline system now)
     */
    selectUserFromList() {
        console.log('⚠️ selectUserFromList is deprecated - using inline user system');
        // This method is no longer needed with our new inline user system
    }

    /**
     * Create new profile
     */
    createNewProfile() {
        // Show inline profile creation form
        const loadingOverlay = document.getElementById('loading-overlay');
        if (!loadingOverlay) return;
        
        loadingOverlay.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <!-- Header -->
                <div class="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white text-center">
                    <div class="text-3xl mb-2">➕</div>
                    <h2 class="text-2xl font-bold">Create New Profile</h2>
                    <p class="text-green-100">Set up your chef profile</p>
                </div>
                
                <!-- Profile Creation Form -->
                <div class="p-6">
                    <form id="create-profile-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input type="text" id="new-user-name" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Enter your name">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
                            <select id="new-user-role" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                <option value="Chef">Chef</option>
                                <option value="Sous Chef">Sous Chef</option>
                                <option value="Kitchen Manager">Kitchen Manager</option>
                                <option value="Line Cook">Line Cook</option>
                                <option value="Pastry Chef">Pastry Chef</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
                            <input type="email" id="new-user-email" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Enter your email">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
                            <select id="new-user-avatar" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                <option value="👨‍🍳">👨‍🍳 Chef</option>
                                <option value="👩‍🍳">👩‍🍳 Chef</option>
                                <option value="👨‍💼">👨‍💼 Manager</option>
                                <option value="👩‍💼">👩‍💼 Manager</option>
                                <option value="👤">👤 User</option>
                            </select>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="space-y-3 pt-4">
                            <button type="submit" class="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-all">
                                ✅ Create Profile
                            </button>
                            <button type="button" onclick="window.startupLoadingManager.showUserSelectionFlow()" class="w-full bg-gray-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-600 transition-all">
                                ← Back to Selection
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Handle form submission
        const form = document.getElementById('create-profile-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const userData = {
                name: document.getElementById('new-user-name').value,
                role: document.getElementById('new-user-role').value,
                email: document.getElementById('new-user-email').value,
                avatar: document.getElementById('new-user-avatar').value
            };
            
            if (window.userSystem) {
                const newUser = window.userSystem.createUser(userData);
                if (newUser) {
                    // Auto-select the new user
                    this.selectUser(newUser.id);
                }
            }
        });
    }

    /**
     * Continue offline
     */
    continueOffline() {
        // Use our new simple user system
        if (window.userSystem) {
            const offlineUser = {
                name: 'Local User',
                role: 'Chef',
                email: 'local@iterum.com',
                avatar: '👤',
                isOffline: true
            };
            
            const newUser = window.userSystem.createUser(offlineUser);
            if (newUser) {
                // Auto-select the new user
                this.selectUser(newUser.id);
            }
        } else {
            console.error('User system not available');
        }
    }

    /**
     * Complete the loading sequence after user selection
     */
    completeLoading() {
        console.log('🎉 Completing loading sequence');
        
        // Show final loading progress
        this.showLoadingProgress();
        
        // Wait a moment for user to see the progress, then hide
        setTimeout(() => {
            this.forceHideLoadingScreen();
            console.log('✅ Loading sequence completed, app ready');
            
            // Dispatch app ready event
            window.dispatchEvent(new CustomEvent('iterumAppReady', {
                detail: { 
                    user: window.userSystem ? window.userSystem.getCurrentUser() : null,
                    timestamp: Date.now()
                }
            }));
        }, 2000); // Show progress for 2 seconds
    }

    /**
     * Set up automatic hiding after user selection + loading duration
     */
    setupAutoHide() {
        console.log('⏰ Setting up auto-hide with user selection requirement');
        
        const checkUserAndHide = () => {
            if (this.userSelected && !this.isHidden) {
                console.log('✅ User selected, completing loading sequence');
                this.completeLoading();
            } else if (!this.userSelected) {
                console.log('⏳ User not yet selected, continuing to wait...');
                // Keep checking every second until user is selected
                setTimeout(checkUserAndHide, 1000);
            }
        };
        
        // Start checking after the loading duration
        setTimeout(checkUserAndHide, this.loadingDuration);
    }

    /**
     * Set up emergency timeout to prevent infinite loading
     */
    setupEmergencyTimeout() {
        setTimeout(() => {
            if (!this.isHidden) {
                console.warn('⚠️ EMERGENCY: Loading screen timeout reached (10s), forcing hide');
                this.forceHideLoadingScreen();
            }
        }, this.maxWaitTime);
    }

    /**
     * Hide loading screen with minimum duration check
     */
    hideLoadingScreenWithDelay() {
        if (this.isHidden) {
            console.log('🔄 Loading screen already hidden');
            return;
        }

        const elapsed = Date.now() - this.loadingStartTime;
        const remainingTime = Math.max(0, this.loadingDuration - elapsed);

        if (remainingTime > 0) {
            console.log(`⏳ Loading screen will continue for ${remainingTime}ms more`);
            setTimeout(() => {
                this.forceHideLoadingScreen();
            }, remainingTime);
        } else {
            this.forceHideLoadingScreen();
        }
    }

    /**
     * Force hide loading screen (emergency function)
     */
    forceHideLoadingScreen() {
        if (this.isHidden) return;
        
        console.log('🔧 Force hiding loading screen');
        this.isHidden = true;
        
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.5s ease-out';
            
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
                console.log('✅ Loading screen force-hidden');
                
                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('loadingScreenHidden'));
            }, 500);
        }
        
        // Clear any intervals
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    }

    /**
     * Hide loading screen with fade out animation
     */
    hideLoadingScreen() {
        if (this.isHidden) return;
        
        console.log('🎭 Hiding loading screen with fade out animation');
        this.isHidden = true;
        
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.5s ease-out';
            
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
                console.log('✅ Loading screen hidden completely');
                
                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('loadingScreenHidden'));
            }, this.fadeOutDuration);
        }
        
        // Clear any intervals
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    }

    /**
     * Ensure page content is visible
     */
    ensurePageVisibility() {
        if (document.body) {
            document.body.style.display = 'block';
            document.body.style.visibility = 'visible';
            document.body.style.opacity = '1';
        }

        // Show main content elements
        const mainElements = document.querySelectorAll('.container, main, .main-content, #main-content, header, .header');
        mainElements.forEach(el => {
            el.style.display = 'block';
            el.style.visibility = 'visible';
            el.style.opacity = '1';
        });

        // Remove any loading-related classes
        document.body.classList.remove('loading', 'initializing');
        
        console.log('✅ Page visibility ensured');
    }

    /**
     * Track when loading operations complete
     */
    trackLoadingCompletion() {
        // Track script loading completion
        if (typeof Promise !== 'undefined') {
            // Monitor script loading promises
            const originalPromiseAll = Promise.all;
            Promise.all = function(promises) {
                return originalPromiseAll.call(this, promises).then(results => {
                    console.log('📦 Scripts finished loading, but maintaining 3-second minimum display');
                    return results;
                });
            };
        }

        // Track DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('📄 DOM ready, but maintaining 3-second loading screen');
            });
        }

        // Track window load
        window.addEventListener('load', () => {
            console.log('🌐 Window loaded, but maintaining 3-second loading screen');
        });

        // Listen for our custom event
        window.addEventListener('loadingScreenHidden', () => {
            console.log('🎉 Loading screen hidden event received');
        });
    }

    /**
     * Allow manual override of loading duration
     */
    setLoadingDuration(milliseconds) {
        if (typeof milliseconds === 'number' && milliseconds > 0) {
            this.loadingDuration = milliseconds;
            console.log(`⏱️ Loading duration set to ${milliseconds}ms`);
        }
    }

    /**
     * Get remaining loading time
     */
    getRemainingTime() {
        const elapsed = Date.now() - this.loadingStartTime;
        return Math.max(0, this.loadingDuration - elapsed);
    }

    /**
     * Manual hide (for debugging)
     */
    manualHide() {
        console.log('🔧 Manual loading screen hide triggered');
        this.forceHideLoadingScreen();
    }

    /**
     * Check if loading screen is currently visible
     */
    isVisible() {
        const loadingOverlay = document.getElementById('loading-overlay');
        return loadingOverlay && loadingOverlay.style.display !== 'none';
    }

    /**
     * Block any attempts to hide the loading screen before user selection
     */
    blockUnauthorizedHiding() {
        console.log('🚫 Blocking unauthorized loading screen hiding');
        
        // Override any existing hide functions
        const originalHide = window.hideLoadingScreen;
        window.hideLoadingScreen = () => {
            if (this.userSelected) {
                console.log('✅ User selected, allowing loading screen hide');
                this.forceHideLoadingScreen();
            } else {
                console.log('🚫 User not selected, blocking loading screen hide');
                this.showUserSelectionFlow();
            }
        };
        
        // Also block the emergency fix if user not selected
        const originalEmergencyFix = window.emergencyLoadingFix;
        window.emergencyLoadingFix = () => {
            if (this.userSelected) {
                console.log('✅ User selected, allowing emergency fix');
                originalEmergencyFix && originalEmergencyFix();
            } else {
                console.log('🚫 User not selected, blocking emergency fix');
                this.showUserSelectionFlow();
            }
        };
    }
}

// Initialize the startup loading manager immediately
window.startupLoadingManager = new StartupLoadingManager();

// Global functions for easy access
window.setLoadingDuration = function(ms) {
    if (window.startupLoadingManager) {
        window.startupLoadingManager.setLoadingDuration(ms);
    }
};

window.hideLoadingNow = function() {
    if (window.startupLoadingManager) {
        window.startupLoadingManager.manualHide();
    }
};

window.getLoadingTimeRemaining = function() {
    if (window.startupLoadingManager) {
        return window.startupLoadingManager.getRemainingTime();
    }
    return 0;
};

window.isLoadingVisible = function() {
    if (window.startupLoadingManager) {
        return window.startupLoadingManager.isVisible();
    }
    return false;
};

// Emergency loading screen fix for stuck pages
window.emergencyLoadingFix = function() {
    console.log('🚑 EMERGENCY LOADING FIX ACTIVATED');
    
    // Force hide any loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        loadingOverlay.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            console.log('✅ Emergency loading fix complete');
        }, 300);
    }
    
    // Also try to use the startup loading manager if available
    if (window.startupLoadingManager) {
        window.startupLoadingManager.forceHideLoadingScreen();
    }
    
    // Ensure page is visible
    document.body.style.overflow = 'visible';
    document.body.style.pointerEvents = 'auto';
};

console.log('🚀 Startup Loading Manager initialized - 3 second loading screen active (max 10s)');
console.log('💡 Use setLoadingDuration(ms) to change duration');
console.log('💡 Use hideLoadingNow() to hide immediately');
console.log('💡 Use getLoadingTimeRemaining() to check remaining time');
console.log('💡 Use isLoadingVisible() to check if loading screen is visible');
console.log('🚑 If loading screen gets stuck, run: emergencyLoadingFix()');