/**
 * Unified Authentication System for Iterum R&D Chef Notebook
 * Combines the best features of both authManager.js and profileManager.js
 * into one cohesive authentication flow
 */

class UnifiedAuthSystem {
    constructor() {
        this.currentUser = null;
        this.isOnline = false;
        this.savedUsers = [];
        this.isAuthenticating = false; // Flag to prevent multiple simultaneous auth attempts
        this.setupSessionHandlers();
        this.init();
    }

    /**
     * Setup session and browser event handlers
     */
    setupSessionHandlers() {
        // Maintain session across page refreshes
        window.addEventListener('beforeunload', () => {
            if (this.currentUser && this.isSessionActive()) {
                // Session persists across page refreshes
                console.log('🔄 Page refresh detected, maintaining user session');
            }
        });

        // Handle browser tab/window close
        window.addEventListener('unload', () => {
            if (this.currentUser) {
                // Update last activity timestamp
                localStorage.setItem('last_activity', new Date().toISOString());
            }
        });

        // Handle page visibility changes (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.currentUser) {
                // User returned to tab - check if session is still valid
                this.validateSession();
            }
        });
    }

    /**
     * Validate current session
     */
    validateSession() {
        if (this.isSessionActive() && this.currentUser) {
            console.log('✅ Session validated for user:', this.currentUser.name);
            return true;
        } else if (this.currentUser) {
            console.log('⚠️ Session expired, logging out user');
            this.handleLogout();
            return false;
        }
        return false;
    }

    /**
     * Initialize the authentication system
     */
    async init() {
        console.log('🔐 Initializing Unified Authentication System...');
        
        // Set a shorter timeout to prevent hanging
        const initTimeout = setTimeout(() => {
            console.warn('⚠️ Authentication initialization timeout, showing auth');
            this.showMandatoryAuthentication();
        }, 1500); // Reduced to 1.5 seconds
        
        try {
            // Quick session check without heavy operations
            const hasSession = this.quickSessionCheck();
            
            // Clear timeout
            clearTimeout(initTimeout);
            
            if (!hasSession) {
                console.log('🚫 NO ACCESS: User not authenticated, showing mandatory auth');
                // Show auth immediately without delay
                this.showMandatoryAuthentication();
                return;
            }
            
            console.log('✅ User authenticated, allowing app access');
            
            // Show content immediately
            this.showContent();
            
            // Load user data in background after authentication is confirmed
            setTimeout(() => {
                this.loadUserDataInBackground();
            }, 500);
            
        } catch (error) {
            console.error('❌ Error during authentication initialization:', error);
            clearTimeout(initTimeout);
            // Show authentication immediately on error
            this.showMandatoryAuthentication();
        }
    }

    /**
     * Quick session check without heavy operations
     */
    quickSessionCheck() {
        try {
            // Check localStorage directly without encryption for speed
            const sessionActive = localStorage.getItem('session_active');
            const currentUserStr = localStorage.getItem('current_user');
            
            if (sessionActive === 'true' && currentUserStr) {
                const user = JSON.parse(currentUserStr);
                this.currentUser = user;
                console.log('💾 Quick session check found user:', user.name);
                return true;
            }
            
            return false;
        } catch (error) {
            console.warn('⚠️ Quick session check failed:', error);
            return false;
        }
    }

    /**
     * Load user data in background after authentication
     */
    async loadUserDataInBackground() {
        try {
            console.log('📥 Loading user data in background...');
            await this.loadAllUserData(this.currentUser);
        } catch (error) {
            console.warn('⚠️ Background user data loading failed:', error);
        }
    }

    /**
     * Wait for enhanced user system to be ready
     */
    async waitForEnhancedUserSystem() {
        if (typeof window.enhancedUserSystem !== 'undefined') {
            console.log('✅ Enhanced user system already available');
            return;
        }
        
        console.log('⏳ Waiting for enhanced user system to be ready...');
        
        // Wait up to 5 seconds for the enhanced user system to load
        for (let i = 0; i < 50; i++) {
            if (typeof window.enhancedUserSystem !== 'undefined') {
                console.log('✅ Enhanced user system is now available');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('⚠️ Enhanced user system not available after waiting, proceeding anyway');
    }

    /**
     * Check for existing authentication session
     */
    async checkExistingSession() {
        console.log('🔐 Checking for existing session...');
        
        // Check Firebase Auth first
        if (window.firebaseAuth && window.firebaseAuth.isSignedIn()) {
            const firebaseUser = window.firebaseAuth.getCurrentUser();
            if (firebaseUser) {
                console.log('🔥 Firebase session found, restoring user:', firebaseUser.email);
                this.syncWithFirebaseUser(firebaseUser);
                return;
            }
        }
        
        // Check localStorage session with decryption
        let sessionActive, currentUser;
        if (window.securityUtils) {
            sessionActive = await window.securityUtils.safeLocalStorage.getItem('session_active', false);
            currentUser = await window.securityUtils.safeLocalStorage.getItem('current_user', true);
        } else {
            sessionActive = localStorage.getItem('session_active');
            const currentUserStr = localStorage.getItem('current_user');
            currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
        }
        
        if (sessionActive === 'true' && currentUser) {
            try {
                const user = currentUser;
                console.log('💾 Local session found, restoring user:', user.name);
                this.currentUser = user;
                this.updateAuthUI(user);
                
                // Load user data
                await this.loadAllUserData(user);
                return;
            } catch (error) {
                console.error('❌ Error parsing stored user data:', error);
                this.clearSession();
            }
        }
        
        // No valid session found, force authentication
        console.log('🚫 No valid session found, requiring authentication');
        await this.forceUserSelection();
    }

    /**
     * Sync with Firebase user and update local session
     */
    syncWithFirebaseUser(firebaseUser) {
        const user = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL,
            provider: 'firebase',
            providerId: firebaseUser.uid,
            verified: firebaseUser.emailVerified,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        this.currentUser = user;
        this.saveUserLocally(user);
        this.updateAuthUI(user);
    }

    /**
     * Save user data locally
     */
    saveUserLocally(user) {
        try {
            // Save current user
            localStorage.setItem('current_user', JSON.stringify(user));
            localStorage.setItem('session_active', 'true');
            localStorage.setItem('last_login', new Date().toISOString());
            
            // Add to saved users if not already there
            const existingUser = this.savedUsers.find(u => u.id === user.id);
            if (!existingUser) {
                this.savedUsers.push(user);
                localStorage.setItem('saved_users', JSON.stringify(this.savedUsers));
            }
            
            console.log('💾 User saved locally:', user.name);
        } catch (error) {
            console.error('❌ Error saving user locally:', error);
        }
    }

    /**
     * Clear authentication session
     */
    clearSession() {
        console.log('🧹 Clearing authentication session...');
        this.currentUser = null;
        localStorage.removeItem('session_active');
        localStorage.removeItem('current_user');
        localStorage.removeItem('last_login');
        
        // Clear Firebase session if available
        if (window.firebaseAuth && window.firebaseAuth.isSignedIn()) {
            window.firebaseAuth.signOut();
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Get current authenticated user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Force user selection at startup - no automatic login
     */
    async forceUserSelection() {
        // Prevent multiple simultaneous authentication attempts
        if (this.isAuthenticating) {
            console.log('🔐 Authentication already in progress, skipping...');
            return;
        }
        
        this.isAuthenticating = true;
        console.log('🔐 Force user selection called...');
        
        // Debug: Check what's available
        console.log('🔍 Debug - window.firebaseAuth:', window.firebaseAuth);
        console.log('🔍 Debug - window.firebaseAuthUI:', window.firebaseAuthUI);
        console.log('🔍 Debug - window.unifiedAuthSystem:', window.unifiedAuthSystem);
        
        // Check if Firebase Auth is available and user is signed in
        if (window.firebaseAuth && window.firebaseAuth.isSignedIn()) {
            console.log('🔥 Firebase user already signed in, skipping selection');
            return;
        }
        
        // Clear any existing session to force fresh selection
        localStorage.removeItem('session_active');
        localStorage.removeItem('current_user');
        this.currentUser = null;
        
        console.log('🧹 Cleared existing session');
        
        // Always load saved users - this handles both online and offline modes
        console.log('👥 Loading saved users...');
        await this.loadSavedUsers();
        console.log(`📊 After loading, savedUsers count: ${this.savedUsers.length}`);
        
        // Double-check localStorage to ensure we have all users
        this.ensureAllUsersLoaded();
        
        // Show user selection interface
        if (this.savedUsers.length > 0) {
            console.log('✅ Users found, showing user selection');
            this.showUserSelection();
        } else {
            console.log('⚠️ No users found, attempting final JSON import...');
            // Try one more time to import users from JSON
            try {
                const finalImport = await this.importUsersFromJSON();
                if (finalImport && finalImport.length > 0) {
                    console.log(`✅ Final import successful: ${finalImport.length} users`);
                    this.savedUsers = finalImport;
                    this.showUserSelection();
                } else {
                    console.log('❌ No users could be imported, showing login options');
                    this.showLoginOptions();
                }
            } catch (error) {
                console.error('❌ Final import failed:', error);
                this.showLoginOptions();
            }
        }
    }

    /**
     * Check if there's an active user session
     */
    isSessionActive() {
        const sessionActive = localStorage.getItem('session_active');
        const currentUser = localStorage.getItem('current_user');
        return sessionActive === 'true' && currentUser !== null;
    }

    /**
     * Check if backend is available
     */
    async checkBackendConnection() {
        try {
            // For now, default to offline mode since this is a desktop app
            // Backend connection can be enabled later if needed
            this.isOnline = false;
            console.log('🌐 Backend connection: Offline (desktop app mode)');
            
            // Uncomment the following code when you have a backend server running
            /*
            const response = await fetch('http://localhost:8000/health', {
                method: 'GET',
                timeout: 3000
            });
            this.isOnline = response.ok;
            console.log(`🌐 Backend connection: ${this.isOnline ? 'Online' : 'Offline'}`);
            */
        } catch (error) {
            this.isOnline = false;
            console.warn('⚠️ Backend not available, using offline mode');
        }
    }

    /**
     * Load saved users from storage
     */
    async loadSavedUsers() {
        try {
            console.log('👥 Loading saved users...');
            
            // First, try to load from enhanced user system if available
            if (window.enhancedUserSystem && typeof window.enhancedUserSystem.loadUsersFromFiles === 'function') {
                try {
                    console.log('🔍 Enhanced user system available, loading users from files...');
                    await window.enhancedUserSystem.loadUsersFromFiles();
                    
                    // Get users from enhanced user system
                    if (window.enhancedUserSystem.users && window.enhancedUserSystem.users.length > 0) {
                        this.savedUsers = [...window.enhancedUserSystem.users];
                        console.log(`✅ Loaded ${this.savedUsers.length} users from enhanced user system`);
                        
                        // Also save to localStorage for consistency
                        localStorage.setItem('saved_users', JSON.stringify(this.savedUsers));
                        
                        return this.savedUsers;
                    }
                } catch (enhancedError) {
                    console.warn('⚠️ Failed to load from enhanced user system:', enhancedError);
                }
            }
            
            if (this.isOnline) {
                // Try to load from backend
                try {
                    const response = await fetch('http://localhost:8000/api/users', {
                        method: 'GET',
                        timeout: 5000
                    });
                    if (response.ok) {
                        const data = await response.json();
                        this.savedUsers = data.users || [];
                        console.log(`✅ Loaded ${this.savedUsers.length} users from backend`);
                    } else {
                        throw new Error('Backend returned error');
                    }
                } catch (error) {
                    console.warn('⚠️ Failed to load users from backend, using local storage:', error);
                    // Fallback to local storage
                    this.loadSavedUsersFromLocal();
                }
            } else {
                // Offline mode - load from local storage
                this.loadSavedUsersFromLocal();
            }
            
            // If no users found anywhere, try to import from JSON file
            if (this.savedUsers.length === 0) {
                console.log('⚠️ No users found, attempting to import from JSON file...');
                try {
                    const importedUsers = await this.importUsersFromJSON();
                    if (importedUsers && importedUsers.length > 0) {
                        console.log(`✅ Successfully imported ${importedUsers.length} users from JSON file`);
                        this.savedUsers = importedUsers;
                    }
                } catch (importError) {
                    console.warn('⚠️ Failed to import users from JSON:', importError);
                }
            }
            
            console.log(`👥 Total saved users: ${this.savedUsers.length}`);
            return this.savedUsers;
        } catch (error) {
            console.error('❌ Error loading saved users:', error);
            // Ensure we have at least an empty array
            this.savedUsers = [];
            return this.savedUsers;
        }
    }

    /**
     * Load saved users from local storage
     */
    loadSavedUsersFromLocal() {
        try {
            console.log('🔍 Checking local storage for saved users...');
            const savedUsersData = localStorage.getItem('saved_users');
            console.log('📦 Raw saved users data:', savedUsersData);
            
            if (savedUsersData) {
                this.savedUsers = JSON.parse(savedUsersData);
                console.log(`✅ Loaded ${this.savedUsers.length} users from local storage:`, this.savedUsers);
            } else {
                this.savedUsers = [];
                console.log('ℹ️ No saved users found in local storage');
            }
        } catch (error) {
            console.error('❌ Error parsing saved users from local storage:', error);
            this.savedUsers = [];
        }
    }

    /**
     * Ensure all users from localStorage are loaded into savedUsers array
     */
    ensureAllUsersLoaded() {
        try {
            console.log('🔍 Ensuring all users are loaded from localStorage...');
            
            // Check localStorage directly
            const savedUsersData = localStorage.getItem('saved_users');
            if (savedUsersData) {
                const localStorageUsers = JSON.parse(savedUsersData);
                console.log(`📦 Found ${localStorageUsers.length} users in localStorage`);
                
                // Merge with current savedUsers array to avoid duplicates
                localStorageUsers.forEach(localUser => {
                    if (!this.savedUsers.find(u => u.id === localUser.id)) {
                        this.savedUsers.push(localUser);
                        console.log(`➕ Added user from localStorage: ${localUser.name}`);
                    }
                });
                
                // Also check for any users stored under different keys
                this.checkAlternativeUserStorage();
                
                // Sync with enhanced user system if available
                this.syncWithEnhancedUserSystem();
                
                console.log(`📊 Final savedUsers count: ${this.savedUsers.length}`);
                
                // Update localStorage to ensure consistency
                if (this.savedUsers.length > 0) {
                    localStorage.setItem('saved_users', JSON.stringify(this.savedUsers));
                    console.log('💾 Updated localStorage with merged user data');
                }
            } else {
                console.log('ℹ️ No saved_users found in localStorage');
                // Try to sync with enhanced user system even if no localStorage users
                this.syncWithEnhancedUserSystem();
                
                // If still no users, try to import from JSON
                if (this.savedUsers.length === 0) {
                    console.log('⚠️ Still no users found, attempting JSON import...');
                    this.importUsersFromJSON().then(importedUsers => {
                        if (importedUsers && importedUsers.length > 0) {
                            console.log(`✅ Imported ${importedUsers.length} users from JSON in ensureAllUsersLoaded`);
                            this.savedUsers = importedUsers;
                            // Update localStorage
                            localStorage.setItem('saved_users', JSON.stringify(this.savedUsers));
                        }
                    }).catch(error => {
                        console.warn('⚠️ JSON import failed in ensureAllUsersLoaded:', error);
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error ensuring all users are loaded:', error);
        }
    }

    /**
     * Check for users stored under alternative storage keys
     */
    checkAlternativeUserStorage() {
        try {
            // Check for users stored under different patterns
            const allKeys = Object.keys(localStorage);
            const userKeys = allKeys.filter(key => 
                key.includes('user') || 
                key.includes('profile') || 
                key.includes('auth')
            );
            
            console.log(`🔍 Checking ${userKeys.length} potential user storage keys...`);
            
            userKeys.forEach(key => {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const parsed = JSON.parse(data);
                        
                        // Check if this looks like user data
                        if (parsed && typeof parsed === 'object') {
                            if (parsed.name && parsed.id) {
                                // This looks like a user object
                                if (!this.savedUsers.find(u => u.id === parsed.id)) {
                                    this.savedUsers.push(parsed);
                                    console.log(`➕ Found user in ${key}: ${parsed.name}`);
                                }
                            } else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name && parsed[0].id) {
                                // This looks like an array of users
                                parsed.forEach(user => {
                                    if (!this.savedUsers.find(u => u.id === user.id)) {
                                        this.savedUsers.push(user);
                                        console.log(`➕ Found user in ${key}: ${user.name}`);
                                    }
                                });
                            }
                        }
                    }
                } catch (parseError) {
                    // Skip keys that can't be parsed as JSON
                }
            });
        } catch (error) {
            console.error('❌ Error checking alternative user storage:', error);
        }
    }

    /**
     * Sync users with enhanced user system
     */
    syncWithEnhancedUserSystem() {
        try {
            if (window.enhancedUserSystem && window.enhancedUserSystem.users) {
                console.log('🔄 Syncing with enhanced user system...');
                
                // Get users from enhanced user system
                const enhancedUsers = window.enhancedUserSystem.users;
                console.log(`📦 Found ${enhancedUsers.length} users in enhanced user system`);
                
                // Merge users from enhanced system
                enhancedUsers.forEach(enhancedUser => {
                    if (!this.savedUsers.find(u => u.id === enhancedUser.id)) {
                        this.savedUsers.push(enhancedUser);
                        console.log(`➕ Added user from enhanced system: ${enhancedUser.name}`);
                    }
                });
                
                // Update enhanced user system with our users
                if (this.savedUsers.length > 0) {
                    window.enhancedUserSystem.users = [...this.savedUsers];
                    window.enhancedUserSystem.saveUsersToLocalStorage();
                    console.log('💾 Synced users back to enhanced user system');
                }
            }
        } catch (error) {
            console.error('❌ Error syncing with enhanced user system:', error);
        }
    }

    /**
     * Load current user from localStorage with session validation
     */
    loadCurrentUser() {
        try {
            const user = localStorage.getItem('current_user');
            const authToken = localStorage.getItem('iterum_auth_token');
            
            if (user) {
                this.currentUser = JSON.parse(user);
                
                // Set session flag to persist login until explicit logout
                if (this.currentUser) {
                    localStorage.setItem('session_active', 'true');
                    console.log('✅ User session restored:', this.currentUser.name);
                }
            } else {
                this.currentUser = null;
            }
        } catch (error) {
            console.warn('⚠️ Error loading current user:', error);
            this.currentUser = null;
        }
    }

    /**
     * Show the main authentication flow
     * This is called when the app launches and no user is signed in
     */
    async showAuthFlow() {
        try {
            console.log('🔐 Showing authentication flow...');
            
            // Check if we have saved users
            if (this.savedUsers && this.savedUsers.length > 0) {
                // Show user selection modal
                this.showUserSelectionModal();
            } else {
                // Show create profile modal
                this.showCreateProfileModal();
            }
        } catch (error) {
            console.error('❌ Error showing auth flow:', error);
            // Fallback to user selection
            this.showUserSelectionModal();
        }
    }
    
    /**
     * Show user selection modal (popup style)
     */
    showUserSelectionModal() {
        this.removeExistingModals();
        
        const modal = document.createElement('div');
        modal.className = 'auth-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] opacity-0 transition-opacity duration-300';
        modal.style.zIndex = '9999';
        
        modal.dataset.trusted = 'true';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <!-- Header -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center">
                    <div class="text-4xl mb-3">🍃</div>
                    <h2 class="text-2xl font-bold">Welcome to Iterum R&D</h2>
                    <p class="text-blue-100">Choose your profile to continue</p>
                </div>
                
                <!-- User List -->
                <div class="p-6">
                    <div class="space-y-3 mb-6">
                        ${this.savedUsers.map(user => `
                            <button onclick="unifiedAuth.selectUser('${user.id}')" 
                                    class="w-full flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 rounded-lg p-4 border-2 border-transparent hover:border-blue-300 transition-all">
                                <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                    ${user.name.charAt(0).toUpperCase()}
                                </div>
                                <div class="text-left flex-1">
                                    <div class="font-semibold text-gray-800">${user.name}</div>
                                    ${user.role ? `<div class="text-sm text-gray-600">${user.role}</div>` : ''}
                                    ${user.restaurant ? `<div class="text-xs text-gray-500">${user.restaurant}</div>` : ''}
                                </div>
                                <div class="text-blue-500">
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                    </svg>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="space-y-3">
                        <button onclick="unifiedAuth.showCreateProfileModal()" class="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-all">
                            ➕ Create New Profile
                        </button>
                        <button onclick="unifiedAuth.showLoginModal()" class="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-all">
                            🔐 Sign In with Different Account
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                // Don't allow closing by clicking outside - user must make a selection
                console.log('⚠️ User must select a profile to continue');
            }
        });
        
        console.log('✅ User selection modal displayed');
    }
    
    /**
     * Show create profile modal (popup style)
     */
    showCreateProfileModal() {
        this.removeExistingModals();
        
        const modal = document.createElement('div');
        modal.className = 'auth-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] opacity-0 transition-opacity duration-300';
        modal.style.zIndex = '9999';
        
        modal.dataset.trusted = 'true';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <!-- Header -->
                <div class="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white text-center">
                    <div class="text-4xl mb-3">👤</div>
                    <h2 class="text-2xl font-bold">Create Your Profile</h2>
                    <p class="text-green-100">Set up your chef profile to get started</p>
                </div>
                
                <!-- Form -->
                <div class="p-6">
                    <form id="create-profile-form" class="space-y-4">
                        <div class="form-group">
                            <label for="profile-name" class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" id="profile-name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter your full name" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="profile-role" class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select id="profile-role" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="Chef">Chef</option>
                                <option value="Sous Chef">Sous Chef</option>
                                <option value="Line Cook">Line Cook</option>
                                <option value="Pastry Chef">Pastry Chef</option>
                                <option value="Kitchen Manager">Kitchen Manager</option>
                                <option value="Food Service Director">Food Service Director</option>
                                <option value="Culinary Student">Culinary Student</option>
                                <option value="Home Cook">Home Cook</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="profile-restaurant" class="block text-sm font-medium text-gray-700 mb-1">Restaurant/Organization (Optional)</label>
                            <input type="text" id="profile-restaurant" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Where do you work?">
                        </div>
                        
                        <div class="form-group">
                            <label for="profile-email" class="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                            <input type="email" id="profile-email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="your.email@example.com">
                        </div>
                        
                        <button type="submit" class="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-all">
                            🚀 Create Profile & Start
                        </button>
                    </form>
                    
                    <div class="mt-4 text-center">
                        <button onclick="unifiedAuth.showUserSelectionModal()" class="text-blue-600 hover:text-blue-700 text-sm">
                            ← Back to Profile Selection
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = modal.querySelector('#create-profile-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const profileData = {
                    name: document.getElementById('profile-name').value.trim(),
                    role: document.getElementById('profile-role').value,
                    restaurant: document.getElementById('profile-restaurant').value.trim(),
                    email: document.getElementById('profile-email').value.trim()
                };
                
                if (!profileData.name) {
                    alert('Please enter your name');
                    return;
                }
                
                try {
                    await this.createOfflineProfile(profileData);
                    this.removeExistingModals();
                } catch (error) {
                    console.error('❌ Error creating profile:', error);
                    alert('Failed to create profile: ' + error.message);
                }
            });
        }
        
        // Show modal with animation
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                // Don't allow closing by clicking outside - user must create a profile
                console.log('⚠️ User must create a profile to continue');
            }
        });
        
        console.log('✅ Create profile modal displayed');
    }
    
    /**
     * Show login modal (popup style)
     */
    showLoginModal() {
        this.removeExistingModals();
        this.removeUserSwitchDropdown();
        
        const modal = document.createElement('div');
        modal.className = 'auth-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] opacity-0 transition-opacity duration-300';
        modal.style.zIndex = '9999';
        
        modal.dataset.trusted = 'true';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <!-- Header -->
                <div class="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white text-center">
                    <div class="text-4xl mb-3">🔐</div>
                    <h2 class="text-2xl font-bold">Sign In</h2>
                    <p class="text-purple-100">Access your existing account</p>
                </div>
                
                <!-- Form -->
                <div class="p-6">
                    <form id="login-form" class="space-y-4">
                        <div class="form-group">
                            <label for="login-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" id="login-email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="your.email@example.com" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="login-password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input type="password" id="login-password" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter your password" required>
                        </div>
                        
                        <button type="submit" class="w-full bg-purple-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-600 transition-all">
                            🔑 Sign In
                        </button>
                    </form>
                    
                    <div class="mt-4 text-center">
                        <button onclick="unifiedAuth.showUserSelectionModal()" class="text-blue-600 hover:text-blue-700 text-sm">
                            ← Back to Profile Selection
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = modal.querySelector('#login-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const loginData = {
                    email: document.getElementById('login-email').value.trim(),
                    password: document.getElementById('login-password').value
                };
                
                if (!loginData.email || !loginData.password) {
                    alert('Please enter both email and password');
                    return;
                }
                
                try {
                    // For now, just show a message that online login will be implemented later
                    alert('Online login will be implemented in a future update. Please use offline profile creation for now.');
                    this.removeExistingModals();
                    this.showCreateProfileModal();
                } catch (error) {
                    console.error('❌ Login error:', error);
                    alert('Login failed: ' + error.message);
                }
            });
        }
        
        // Show modal with animation
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                // Don't allow closing by clicking outside - user must sign in or go back
                console.log('⚠️ User must sign in or go back to continue');
            }
        });
        
        console.log('✅ Login modal displayed');
    }
    
    /**
     * Remove existing modals
     */
    removeExistingModals() {
        const existingModals = document.querySelectorAll('.auth-modal-overlay, .mandatory-auth-overlay');
        existingModals.forEach(modal => modal.remove());
    }

    /**
     * Show user selection interface
     */
    showUserSelection() {
        console.log('🎯 Show user selection called');
        console.log('👥 Current savedUsers:', this.savedUsers);
        console.log('📊 Users count:', this.savedUsers.length);
        
        // Create popup modal instead of using loading overlay
        this.removeExistingModals();
        this.removeUserSwitchDropdown();
        
        const modal = document.createElement('div');
        modal.className = 'auth-modal-overlay fixed inset-0 bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 bg-opacity-90 flex items-center justify-center z-[9999] opacity-0 transition-opacity duration-500';
        modal.style.zIndex = '9999';
        modal.style.backdropFilter = 'blur(8px)';
        
        modal.dataset.trusted = 'true';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border-4 border-yellow-400 animate-pulse" style="box-shadow: 0 0 30px rgba(251, 191, 36, 0.8), 0 0 60px rgba(251, 191, 36, 0.4), 0 0 90px rgba(251, 191, 36, 0.2);">
                <!-- Header -->
                <div class="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 p-6 text-white text-center relative">
                    <div class="absolute top-2 right-2">
                        <div class="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-bounce flash-warning">
                            ⚠️ REQUIRED
                        </div>
                    </div>
                    <div class="absolute top-2 left-2">
                        <div class="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full animate-bounce flash-warning">
                            🔒 LOCKED
                        </div>
                    </div>
                    <div class="text-5xl mb-3">👨‍🍳</div>
                    <h2 class="text-3xl font-bold text-shadow-lg">Select Your Profile</h2>
                    <p class="text-yellow-100 text-lg mt-2">You must select a profile to continue</p>
                    <div class="mt-3 text-sm bg-red-600 text-white px-4 py-2 rounded-full font-bold animate-pulse">
                        🔒 PROFILE SELECTION REQUIRED
                    </div>
                </div>
                
                <!-- User Selection -->
                <div class="p-6">
                    <div id="saved-users-list" class="space-y-3 mb-6">
                        ${this.savedUsers.length > 0 ? 
                            this.savedUsers.map(user => `
                                <div class="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all transform hover:scale-105">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                            ${user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div class="font-bold text-gray-800 text-lg">${user.name}</div>
                                            ${user.role ? `<div class="text-sm text-blue-600 font-medium">${user.role}</div>` : ''}
                                            ${user.restaurant ? `<div class="text-xs text-gray-500">${user.restaurant}</div>` : ''}
                                        </div>
                                    </div>
                                    <button onclick="unifiedAuth.selectUser('${user.id}')" class="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-lg transform hover:scale-110 transition-all">
                                        🚀 SELECT
                                    </button>
                                </div>
                            `).join('') :
                            `<div class="text-center py-8 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200 p-6">
                                <div class="text-6xl mb-4">⚠️</div>
                                <div class="text-2xl font-bold mb-3 text-red-600">No Profiles Found</div>
                                <div class="text-lg text-red-500 mb-3">No user profiles have been created yet.</div>
                                <div class="text-sm mt-4 p-3 bg-red-100 text-red-700 rounded-lg font-mono">Debug: savedUsers count = ${this.savedUsers.length}</div>
                            </div>`
                        }
                    </div>
                    
                    <!-- Enhanced Action Buttons with Switch User Integration -->
                    <div class="space-y-4">
                        <!-- Switch User Option - Only show if there are multiple users -->
                        ${this.savedUsers.length > 1 ? `
                        <button onclick="unifiedAuth.showSwitchUserInterface()" class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg transform hover:scale-105">
                            🔄 Switch User Profile
                        </button>
                        ` : ''}
                        
                        <!-- Firebase Authentication -->
                        <button onclick="firebaseAuthUI.showAuthModal()" class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg transform hover:scale-105">
                            🔥 Sign in with Firebase
                        </button>
                        
                        <button onclick="unifiedAuth.showLoginModal()" class="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg transform hover:scale-105">
                            🔐 Sign In with Different Account
                        </button>
                        <button onclick="unifiedAuth.showCreateProfileModal()" class="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg transform hover:scale-105">
                            ➕ Create New Profile
                        </button>
                        <button onclick="unifiedAuth.createOfflineProfile()" class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-lg transform hover:scale-105">
                            🚀 Continue Offline
                        </button>
                        
                        <!-- Debug Button - Only show in development -->
                        <button onclick="unifiedAuth.debugUserLoading()" class="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-6 rounded-lg text-sm font-medium hover:from-gray-600 hover:to-gray-700 transition-all shadow-md">
                            🐛 Debug User Loading
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                // Don't allow closing by clicking outside - user must make a selection
                console.log('⚠️ User must select a profile to continue');
            }
        });
        
        console.log('✅ User selection modal displayed');
    }

    /**
     * Manual trigger for authentication - can be called from UI
     */
    showAuthentication() {
        console.log('🔐 Manual authentication trigger called');
        this.forceUserSelection();
    }

    /**
     * Show mandatory authentication - blocks all access until user authenticates
     */
    showMandatoryAuthentication() {
        console.log('🚫 Showing mandatory authentication - blocking all access');
        
        // Prevent multiple overlays
        if (document.querySelector('.mandatory-auth-overlay')) {
            console.log('⚠️ Mandatory auth overlay already exists, skipping');
            return;
        }
        
        // Hide all existing content
        this.hideAllContent();
        
        // Create mandatory auth overlay that covers everything
        this.removeExistingModals();
        
        const modal = document.createElement('div');
        modal.className = 'mandatory-auth-overlay fixed inset-0 bg-gray-900 flex items-center justify-center z-[99999]';
        modal.style.zIndex = '99999';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        
        modal.dataset.trusted = 'true';
        modal.innerHTML = `
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border-4 border-red-500">
                <!-- Header -->
                <div class="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white text-center">
                    <div class="text-4xl mb-4">🔒</div>
                    <h2 class="text-3xl font-bold mb-2">Access Required</h2>
                    <p class="text-red-100 text-lg">Authentication is mandatory to use this application</p>
                    <div class="mt-4 text-sm text-red-200 bg-red-800 bg-opacity-50 px-4 py-2 rounded-full">
                        🚫 No access without valid authentication
                    </div>
                </div>
                
                <!-- Authentication Options -->
                <div class="p-8 space-y-4">
                    <div class="text-center mb-6">
                        <p class="text-gray-600">Please authenticate to continue:</p>
                    </div>
                    
                    <button onclick="unifiedAuth.showLoginModal()" class="w-full bg-blue-500 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-600 transition-all text-lg">
                        🔐 Sign In
                    </button>
                    
                    <button onclick="unifiedAuth.showCreateProfileModal()" class="w-full bg-green-500 text-white py-4 px-6 rounded-xl font-semibold hover:bg-green-600 transition-all text-lg">
                        ➕ Create New Profile
                    </button>
                    
                    <button onclick="unifiedAuth.createOfflineProfile()" class="w-full bg-orange-500 text-white py-4 px-6 rounded-xl font-semibold hover:bg-orange-600 transition-all text-lg">
                        🚀 Continue Offline
                    </button>
                    
                    <div class="text-center mt-6 text-sm text-gray-500">
                        <p>Authentication is required for security and data protection</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animate in
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 100);
        
        // Prevent any clicks outside the modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚫 Click outside blocked - authentication required');
            }
        });
        
        // Prevent page navigation
        this.preventNavigation();
    }

    /**
     * Hide all content until authentication is complete
     */
    hideAllContent() {
        // Hide main content sections but NOT the body
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.style.display = 'none';
        }
        
        // Hide header content
        const header = document.querySelector('header');
        if (header) {
            header.style.display = 'none';
        }
        
        // Hide any other content sections
        const contentSections = document.querySelectorAll('.content, .app-content, .main-content, .page-content, .landing-hero, .features-section, .cta-section');
        contentSections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Set body to minimal height and prevent scrolling
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100vh';
    }

    /**
     * Show content after successful authentication
     */
    showContent() {
        // Show main content
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.style.display = '';
        }
        
        // Show header
        const header = document.querySelector('header');
        if (header) {
            header.style.display = '';
        }
        
        // Show content sections
        const contentSections = document.querySelectorAll('.content, .app-content, .main-content, .page-content, .landing-hero, .features-section, .cta-section');
        contentSections.forEach(section => {
            section.style.display = '';
        });
        
        // Restore body scrolling
        document.body.style.overflow = '';
        document.body.style.height = '';
    }

    /**
     * Prevent navigation until authenticated
     */
    preventNavigation() {
        // Prevent back button
        window.addEventListener('popstate', (e) => {
            if (!this.isAuthenticated()) {
                e.preventDefault();
                console.log('🚫 Navigation blocked - authentication required');
            }
        });
        
        // Prevent form submissions
        document.addEventListener('submit', (e) => {
            if (!this.isAuthenticated()) {
                e.preventDefault();
                console.log('🚫 Form submission blocked - authentication required');
            }
        });
    }

    /**
     * Show login options when no saved users
     */
    showLoginOptions() {
        // Reset authentication flag when showing login options
        this.isAuthenticating = false;
        
        // Create popup modal instead of using loading overlay
        this.removeExistingModals();
        
        const modal = document.createElement('div');
        modal.className = 'auth-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] opacity-0 transition-opacity duration-300';
        modal.style.zIndex = '9999';
        
        modal.dataset.trusted = 'true';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <!-- Header -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center">
                    <div class="text-3xl mb-2">👨‍🍳</div>
                    <h2 class="text-2xl font-bold">Welcome to Iterum</h2>
                    <p class="text-blue-100">Your Culinary Research & Development Notebook</p>
                    <div class="mt-2 text-sm text-blue-200 bg-blue-700 bg-opacity-50 px-3 py-1 rounded-full">
                        🔒 Profile creation required
                    </div>
                </div>
                
                <!-- Login Options -->
                <div class="p-6 space-y-4">
                    <button onclick="unifiedAuth.showLoginModal()" class="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-all">
                        🔐 Sign In
                    </button>
                    <button onclick="unifiedAuth.showCreateProfileModal()" class="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-all">
                        ➕ Create New Profile
                    </button>
                    <button onclick="unifiedAuth.createOfflineProfile()" class="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-600 transition-all">
                        🚀 Continue Offline
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                // Don't allow closing by clicking outside - user must make a selection
                console.log('⚠️ User must create a profile to continue');
            }
        });
        
        console.log('✅ Login options modal displayed');
    }

    /**
     * Show traditional login modal
     */
    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.hideLoadingScreen();
        }
    }

    /**
     * Show dedicated switch user interface
     */
    showSwitchUserInterface() {
        // Create a dropdown interface instead of full-screen overlay
        this.showUserSwitchDropdown();
    }

    /**
     * Show user switch dropdown interface
     */
    showUserSwitchDropdown() {
        // Remove any existing dropdown
        this.removeUserSwitchDropdown();
        
        // Create dropdown container
        const dropdown = document.createElement('div');
        dropdown.id = 'user-switch-dropdown';
        dropdown.className = 'user-switch-dropdown';
        
        // Position the dropdown relative to the header user section
        const headerUser = document.querySelector('.header-user-section');
        if (!headerUser) {
            console.warn('⚠️ Header user section not found, falling back to full-screen overlay');
            this.showSwitchUserInterfaceFallback();
            return;
        }
        
        // Get header user position
        const headerRect = headerUser.getBoundingClientRect();
        
        // Set dropdown styles
        dropdown.style.cssText = `
            position: fixed;
            top: ${headerRect.bottom + 5}px;
            right: ${window.innerWidth - headerRect.right}px;
            width: 320px;
            max-height: 500px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            z-index: 1000;
            overflow: hidden;
            animation: dropdownSlideIn 0.2s ease-out;
        `;
        
        // Create dropdown content
        dropdown.dataset.trusted = 'true';
        dropdown.innerHTML = `
            <!-- Header -->
            <div class="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-xl mb-1">🔄</div>
                        <h3 class="font-semibold">Switch User Profile</h3>
                        <p class="text-sm text-purple-100">Choose a different profile</p>
                    </div>
                    <button onclick="unifiedAuth.removeUserSwitchDropdown()" class="text-purple-100 hover:text-white transition-colors">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- User List -->
            <div class="p-4 max-h-80 overflow-y-auto">
                <div class="space-y-2">
                    ${this.savedUsers.map(user => `
                        <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3 border-2 hover:bg-gray-100 transition-colors ${user.id === this.currentUser?.id ? 'border-purple-300 bg-purple-50' : 'border-transparent'}">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    ${user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div class="font-semibold text-gray-800 text-sm">${user.name}</div>
                                    ${user.role ? `<div class="text-xs text-gray-600">${user.role}</div>` : ''}
                                    ${user.restaurant ? `<div class="text-xs text-gray-500">${user.restaurant}</div>` : ''}
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                ${user.id === this.currentUser?.id ? 
                                    '<span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Current</span>' : 
                                    '<button onclick="unifiedAuth.selectUser(\'' + user.id + '\')" class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs">Switch To</button>'}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Action Buttons -->
                <div class="space-y-2 mt-4 pt-4 border-t border-gray-200">
                    <button onclick="unifiedAuth.showUserSelection()" class="w-full bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-left">
                        ← Back to Profile Selection
                    </button>
                    <button onclick="unifiedAuth.showCreateProfileModal()" class="w-full bg-green-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors text-left">
                        ➕ Create New Profile
                    </button>
                    <button onclick="unifiedAuth.showLoginModal()" class="w-full bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors text-left">
                        🔐 Sign In with Different Account
                    </button>
                </div>
            </div>
        `;
        
        // Add dropdown to body
        document.body.appendChild(dropdown);
        
        // Add click outside to close
        setTimeout(() => {
            document.addEventListener('click', this.handleClickOutsideDropdown);
        }, 100);
        
        // Add escape key to close
        document.addEventListener('keydown', this.handleEscapeKey);
        
        // Add window resize handler to reposition dropdown
        this.handleWindowResize = this.handleWindowResize.bind(this);
        window.addEventListener('resize', this.handleWindowResize);
        
        console.log('✅ User switch dropdown displayed');
    }

    /**
     * Remove user switch dropdown
     */
    removeUserSwitchDropdown() {
        const dropdown = document.getElementById('user-switch-dropdown');
        if (dropdown) {
            dropdown.remove();
            document.removeEventListener('click', this.handleClickOutsideDropdown);
            document.removeEventListener('keydown', this.handleEscapeKey);
            window.removeEventListener('resize', this.handleWindowResize); // Remove resize listener
            console.log('✅ User switch dropdown removed');
        }
    }

    /**
     * Handle click outside dropdown to close it
     */
    handleClickOutsideDropdown = (event) => {
        const dropdown = document.getElementById('user-switch-dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
            // Check if click is not on header user elements
            const headerUser = event.target.closest('.header-user');
            if (!headerUser) {
                this.removeUserSwitchDropdown();
            }
        }
    }

    /**
     * Handle escape key to close dropdown
     */
    handleEscapeKey = (event) => {
        if (event.key === 'Escape') {
            this.removeUserSwitchDropdown();
        }
    }

    /**
     * Handle window resize to reposition dropdown
     */
    handleWindowResize = () => {
        const dropdown = document.getElementById('user-switch-dropdown');
        const headerUser = document.querySelector('.header-user');
        
        if (dropdown && headerUser) {
            const headerRect = headerUser.getBoundingClientRect();
            
            // Update dropdown position
            dropdown.style.top = `${headerRect.bottom + 5}px`;
            dropdown.style.right = `${window.innerWidth - headerRect.right}px`;
            
            // Check if dropdown goes off-screen and adjust if needed
            const dropdownRect = dropdown.getBoundingClientRect();
            
            // Adjust if dropdown goes off the right edge
            if (dropdownRect.right > window.innerWidth - 16) {
                dropdown.style.right = '16px';
            }
            
            // Adjust if dropdown goes off the left edge
            if (dropdownRect.left < 16) {
                dropdown.style.left = '16px';
                dropdown.style.right = 'auto';
            }
            
            // Adjust if dropdown goes off the bottom edge
            if (dropdownRect.bottom > window.innerHeight - 16) {
                dropdown.style.top = `${headerRect.top - dropdownRect.height - 5}px`;
            }
        }
    }

    /**
     * Fallback to full-screen overlay if dropdown positioning fails
     */
    showSwitchUserInterfaceFallback() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (!loadingOverlay) return;

        loadingOverlay.dataset.trusted = 'true';
        loadingOverlay.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <!-- Header -->
                <div class="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white text-center">
                    <div class="text-3xl mb-2">🔄</div>
                    <h2 class="text-2xl font-bold">Switch User Profile</h2>
                    <p class="text-purple-100">Choose a different profile to continue</p>
                    <div class="mt-2 text-sm text-purple-200 bg-purple-700 bg-opacity-50 px-3 py-1 rounded-full">
                        🔄 Profile switching
                    </div>
                </div>
                
                <!-- User List for Switching -->
                <div class="p-6">
                    <div class="space-y-3 mb-6">
                        ${this.savedUsers.map(user => `
                            <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3 border-2 hover:bg-gray-100 transition-colors ${user.id === this.currentUser?.id ? 'border-purple-300 bg-purple-50' : 'border-transparent'}">
                                <div class="flex items-center space-x-3">
                                    <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                        ${user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div class="font-semibold text-gray-800">${user.name}</div>
                                        ${user.role ? `<div class="text-sm text-gray-600">${user.role}</div>` : ''}
                                        ${user.restaurant ? `<div class="text-xs text-gray-500">${user.restaurant}</div>` : ''}
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    ${user.id === this.currentUser?.id ? 
                                        '<span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Current</span>' : 
                                        '<button onclick="unifiedAuth.selectUser(\'' + user.id + '\')" class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">Switch To</button>'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="space-y-3">
                        <button onclick="unifiedAuth.showUserSelection()" class="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all">
                            ← Back to Profile Selection
                        </button>
                        <button onclick="unifiedAuth.showCreateProfileModal()" class="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-all">
                            ➕ Create New Profile
                        </button>
                        <button onclick="unifiedAuth.showLoginModal()" class="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-all">
                            🔐 Sign In with Different Account
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
                console.log('✅ Loading screen hidden');
            }, 500);
        }
    }

    /**
     * Show loading screen with custom message
     */
    showLoadingScreen(message = 'Loading...') {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            loadingOverlay.style.opacity = '1';
            
            // Update loading message if provided
            if (message) {
                const loadingContent = loadingOverlay.querySelector('.p-6');
                if (loadingContent) {
                    const messageElement = loadingContent.querySelector('p');
                    if (messageElement) {
                        messageElement.textContent = message;
                    }
                }
            }
            
            console.log('🔒 Loading screen shown:', message);
        }
    }

    /**
     * Select a user profile
     */
    async selectUser(userId) {
        try {
            console.log('👤 Selecting user:', userId);
            
            // Find the user
            const user = this.savedUsers.find(u => u.id === userId);
            if (!user) {
                throw new Error('User not found');
            }
            
            // Set as current user
            this.currentUser = user;
            
            // Save to localStorage with encryption for sensitive data
            if (window.securityUtils) {
                await window.securityUtils.safeLocalStorage.setItem('current_user', user, true);
                await window.securityUtils.safeLocalStorage.setItem('session_active', 'true', false);
                await window.securityUtils.safeLocalStorage.setItem('last_login', new Date().toISOString(), false);
            } else {
                localStorage.setItem('current_user', JSON.stringify(user));
                localStorage.setItem('session_active', 'true');
                localStorage.setItem('last_login', new Date().toISOString());
            }
            
            // Update session timestamp
            this.lastActivity = Date.now();
            
            console.log('✅ User selected:', user.name);
            
            // Load all user data
            await this.loadAllUserData(user);
            
            // Update authentication UI
            this.updateAuthUI();
            
            // Dispatch user logged in event
            window.dispatchEvent(new CustomEvent('userLoggedIn', {
                detail: { user: user }
            }));
            
            // Remove authentication modals and dropdowns
            this.removeExistingModals();
            this.removeUserSwitchDropdown();
            
            // Show content after successful authentication
            this.showContent();
            
            // Show success message briefly
            this.showSuccessMessage(`Welcome back, ${user.name}!`);
            
            // Reset authentication flag
            this.isAuthenticating = false;
            
        } catch (error) {
            console.error('❌ Error selecting user:', error);
            alert('Failed to select user: ' + error.message);
            // Reset authentication flag even on error
            this.isAuthenticating = false;
        }
    }
    
    /**
     * Show success message briefly
     */
    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[10000] transform translate-x-full transition-transform duration-300';
        successDiv.dataset.trusted = 'true';
        successDiv.innerHTML = `
            <div class="flex items-center space-x-2">
                <span>✅</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        // Slide in
        setTimeout(() => {
            successDiv.classList.remove('translate-x-full');
        }, 100);
        
        // Slide out and remove after 3 seconds
        setTimeout(() => {
            successDiv.classList.add('translate-x-full');
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Load all data associated with the selected user
     */
    async loadAllUserData(user) {
        console.log('📥 Loading all data for user:', user.name);
        
        try {
            // Load data in small chunks to avoid blocking
            await this.loadUserDataInChunks(user);
            
            // Dispatch event that user data is loaded
            window.dispatchEvent(new CustomEvent('iterumUserDataLoaded', {
                detail: { user, timestamp: new Date().toISOString() }
            }));
            
            console.log('✅ All user data loaded successfully');
            
        } catch (error) {
            console.warn('⚠️ Some user data failed to load:', error);
            // Continue anyway - partial data is better than no data
        }
    }

    /**
     * Load user data in small chunks to avoid blocking
     */
    async loadUserDataInChunks(user) {
        // Chunk 1: Basic user data
        await this.loadBasicUserData(user);
        await this.sleep(10); // Small delay between chunks
        
        // Chunk 2: Project data
        await this.loadProjectData(user);
        await this.sleep(10);
        
        // Chunk 3: Menu data
        await this.loadMenuData(user);
        await this.sleep(10);
        
        // Chunk 4: Ingredient data
        await this.loadIngredientData(user);
        await this.sleep(10);
        
        // Chunk 5: Other data
        await this.loadOtherData(user);
    }

    /**
     * Load basic user data
     */
    async loadBasicUserData(user) {
        try {
            if (!window.userDataManager && typeof window.UserDataManager === 'function') {
                window.userDataManager = new window.UserDataManager();
            }
            
            if (window.userDataManager && window.userDataManager.refreshUserData) {
                console.log('🔄 Refreshing user data...');
                await window.userDataManager.refreshUserData();
            }
        } catch (error) {
            console.warn('⚠️ Basic user data loading failed:', error);
        }
    }

    /**
     * Load project data
     */
    async loadProjectData(user) {
        try {
            if (window.projectManager && window.projectManager.loadProjects) {
                console.log('📁 Loading user projects...');
                window.projectManager.loadProjects();
            }
        } catch (error) {
            console.warn('⚠️ Project data loading failed:', error);
        }
    }

    /**
     * Load menu data
     */
    async loadMenuData(user) {
        try {
            if (window.menuManager && window.menuManager.loadMenusFromStorage) {
                console.log('🍽️ Loading user menus...');
                window.menuManager.loadMenusFromStorage();
            }
        } catch (error) {
            console.warn('⚠️ Menu data loading failed:', error);
        }
    }

    /**
     * Load ingredient data
     */
    async loadIngredientData(user) {
        try {
            if (window.ingredientLibrary && window.ingredientLibrary.loadFromLocalStorage) {
                console.log('🥕 Loading user ingredients...');
                window.ingredientLibrary.loadFromLocalStorage();
            }
            
            if (window.vendorManager && window.vendorManager.loadVendors) {
                console.log('🏢 Loading user vendors...');
                window.vendorManager.loadVendors();
            }
        } catch (error) {
            console.warn('⚠️ Ingredient data loading failed:', error);
        }
    }

    /**
     * Load other data
     */
    async loadOtherData(user) {
        try {
            if (window.loadRecipeIdeasFromFiles) {
                console.log('💡 Loading user recipe ideas...');
                window.loadRecipeIdeasFromFiles();
            }
            
            if (window.loadDailyNotes) {
                console.log('📝 Loading user daily notes...');
                window.loadDailyNotes();
            }
        } catch (error) {
            console.warn('⚠️ Other data loading failed:', error);
        }
    }

    /**
     * Sleep utility function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create offline profile
     */
    async createOfflineProfile(profileData = {}) {
        try {
            let user;
            
            if (this.isOnline) {
                const response = await fetch('http://localhost:8000/api/profiles/offline', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!response.ok) throw new Error('Failed to create offline profile');
                const data = await response.json();
                user = data.user;
            } else {
                // Create local offline user
                user = {
                    id: 'offline_' + Date.now(),
                    name: profileData.name || 'Local User',
                    email: profileData.email || 'local@offline.com',
                    role: profileData.role || 'Chef',
                    restaurant: profileData.restaurant || 'My Kitchen',
                    avatar: null,
                    isGoogleUser: false,
                    recipes: [],
                    ingredients: [],
                    equipment: [],
                    lastUpdated: new Date().toISOString()
                };
            }

            this.currentUser = user;
            localStorage.setItem('current_user', JSON.stringify(user));
            localStorage.setItem('session_active', 'true');
            localStorage.setItem('last_login', new Date().toISOString());
            
            // Save user to saved users list for future use
            if (!this.savedUsers.find(u => u.id === user.id)) {
                this.savedUsers.push(user);
                localStorage.setItem('saved_users', JSON.stringify(this.savedUsers));
                console.log('�� Saved offline user for future sessions');
            }
            
            // Initialize projects for the new user
            if (window.initializeProjectsForNewUser) {
                try {
                    const projectInitSuccess = window.initializeProjectsForNewUser(user.id);
                    if (projectInitSuccess) {
                        console.log('✅ Projects initialized for new user:', user.id);
                    } else {
                        console.warn('⚠️ Failed to initialize projects for new user:', user.id);
                    }
                } catch (error) {
                    console.error('❌ Error initializing projects for new user:', error);
                }
            } else {
                console.warn('⚠️ Project initialization function not available');
            }
            
            // Load all user data before hiding loading screen
            await this.loadAllUserData(user);
            
            this.hideLoadingScreen();
            this.updateAuthUI(user);
            
            // Trigger header update event
            document.dispatchEvent(new CustomEvent('userSwitched', { detail: user }));
            
            // Dispatch user logged in event
            window.dispatchEvent(new CustomEvent('userLoggedIn', {
                detail: { user: user }
            }));
            
            // Remove authentication modals
            this.removeExistingModals();
            
            // Show content after successful authentication
            this.showContent();
            
            // Show success message briefly
            this.showSuccessMessage(`Welcome to Iterum R&D, ${user.name}!`);
            
            console.log('🎉 New profile created and user logged in:', user.name);
            
        } catch (error) {
            console.error('Error creating offline profile:', error);
            alert('Failed to create offline profile. Please try again.');
        }
    }

    /**
     * Show create profile interface
     */
    showCreateProfileModal() {
        // Close any open dropdowns
        this.removeUserSwitchDropdown();
        this.removeExistingModals();
        
        const modal = document.createElement('div');
        modal.className = 'auth-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] opacity-0 transition-opacity duration-300';
        modal.style.zIndex = '9999';
        
        modal.dataset.trusted = 'true';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <!-- Header -->
                <div class="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white text-center">
                    <div class="text-3xl mb-2">➕</div>
                    <h2 class="text-2xl font-bold">Create Profile</h2>
                    <p class="text-green-100">Set up your culinary profile</p>
                </div>
                
                <!-- Create Profile Form -->
                <div class="p-6">
                    <form id="create-profile-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input type="text" id="profile-name" name="name" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" placeholder="Enter your full name">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input type="email" id="profile-email" name="email" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" placeholder="Enter your email (optional)">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
                            <select id="profile-role" name="role" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all">
                                <option value="Chef">Chef</option>
                                <option value="Sous Chef">Sous Chef</option>
                                <option value="Line Cook">Line Cook</option>
                                <option value="Pastry Chef">Pastry Chef</option>
                                <option value="Kitchen Manager">Kitchen Manager</option>
                                <option value="Home Cook">Home Cook</option>
                                <option value="Food Enthusiast">Food Enthusiast</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Restaurant/Kitchen</label>
                            <input type="text" id="profile-restaurant" name="restaurant" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" placeholder="Enter restaurant or kitchen name">
                        </div>
                        <div id="profile-error" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"></div>
                        <button type="submit" class="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all">
                            Create Profile
                        </button>
                    </form>
                    
                    <div class="mt-4 text-center">
                        <button onclick="unifiedAuth.showAuthFlow()" class="text-gray-600 hover:text-gray-800">
                            ← Back to options
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                // Don't allow closing by clicking outside - user must complete the form
                console.log('⚠️ User must complete profile creation to continue');
            }
        });
        
        // Add form submission handler
        const form = document.getElementById('create-profile-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleCreateProfile(e));
        }
        
        console.log('✅ Create profile modal displayed');
    }

    /**
     * Handle create profile form submission
     */
    async handleCreateProfile(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const profileData = {
            name: formData.get('name'),
            email: formData.get('email') || '',
            role: formData.get('role'),
            restaurant: formData.get('restaurant') || 'My Kitchen'
        };

        try {
            let user;
            
            if (this.isOnline) {
                // For profile creation, we'll use the login endpoint with a default password
                // since the system is username-only and doesn't require actual passwords
                const loginData = {
                    email: profileData.email || `${profileData.name.toLowerCase().replace(/\s+/g, '')}@local.com`,
                    password: 'default123', // Default password since we're username-only
                    name: profileData.name
                };
                
                const response = await fetch('http://localhost:8000/api/profiles/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(loginData)
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to create profile: ${errorText}`);
                }
                const data = await response.json();
                user = data.user;
            } else {
                // Create local profile
                user = {
                    id: 'local_' + Date.now(),
                    name: profileData.name,
                    email: profileData.email,
                    role: profileData.role,
                    restaurant: profileData.restaurant,
                    password: profileData.password || 'localdev123', // Default password for local dev
                    avatar: null,
                    isGoogleUser: false,
                    recipes: [],
                    ingredients: [],
                    equipment: [],
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                };
            }

            this.currentUser = user;
            localStorage.setItem('current_user', JSON.stringify(user));
            localStorage.setItem('session_active', 'true');
            localStorage.setItem('last_login', new Date().toISOString());
            
            // Initialize projects for the new user
            if (window.initializeProjectsForNewUser) {
                try {
                    const projectInitSuccess = window.initializeProjectsForNewUser(user.id);
                    if (projectInitSuccess) {
                        console.log('✅ Projects initialized for new user:', user.id);
                    } else {
                        console.warn('⚠️ Failed to initialize projects for new user:', user.id);
                    }
                } catch (error) {
                    console.error('❌ Error initializing projects for new user:', error);
                }
            } else {
                console.warn('⚠️ Project initialization function not available');
            }
            
            this.hideLoadingScreen();
            this.updateAuthUI(user);
            
            // Refresh user data manager
            if (window.userDataManager) {
                window.userDataManager.refreshUserData();
            }
            
        } catch (error) {
            console.error('Error creating profile:', error);
            const errorDiv = document.getElementById('profile-error');
            if (errorDiv) {
                errorDiv.textContent = 'Failed to create profile. Please try again.';
                errorDiv.classList.remove('hidden');
            }
        }
    }

    /**
     * Update authentication UI
     */
    updateAuthUI(user) {
        console.log('🔄 Updating auth UI for user:', user ? user.name : 'Guest');
        
        // Update user info display
        const userInfo = document.getElementById('user-info');
        const currentUserSpan = document.getElementById('current-user');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const authButton = document.getElementById('auth-button');
        
        // Update user display elements
        if (userInfo) userInfo.textContent = user && user.name ? user.name : 'Guest';
        if (currentUserSpan) currentUserSpan.textContent = user && user.name ? user.name : '';
        
        // Update button visibility
        if (loginBtn) loginBtn.style.display = user ? 'none' : 'inline-block';
        if (logoutBtn) logoutBtn.style.display = user ? 'inline-block' : 'none';
        if (authButton) authButton.style.display = user ? 'none' : 'block';
        
        // Update authentication status indicator
        const authStatus = document.getElementById('auth-status');
        if (authStatus) {
            if (user) {
                authStatus.dataset.trusted = 'true';
                authStatus.innerHTML = `<span>✅</span> <span>Authenticated as ${window.securityUtils.sanitizeInput(user.name)}</span>`;
                authStatus.style.background = '#f0fdf4';
                authStatus.style.borderColor = '#22c55e';
                authStatus.style.color = '#166534';
            } else {
                authStatus.dataset.trusted = 'true';
                authStatus.innerHTML = `<span>🔐</span> <span>Please sign in to continue</span>`;
                authStatus.style.background = '#fef2f2';
                authStatus.style.borderColor = '#ef4444';
                authStatus.style.color = '#dc2626';
            }
        }
        
        // Update profile display in header
        const profileDisplay = document.getElementById('user-profile-display');
        if (profileDisplay) {
            profileDisplay.classList.remove('hidden');
        }
        
        // Update profile information
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        const userRole = document.getElementById('user-role');
        const userRestaurant = document.getElementById('user-restaurant');
        const userAvatar = document.getElementById('user-avatar');
        
        if (userName) userName.textContent = user.name;
        if (userEmail) userEmail.textContent = user.email || '';
        if (userRole) userRole.textContent = user.role || '';
        if (userRestaurant) userRestaurant.textContent = user.restaurant || '';
        
        // Set avatar (use first letter of name)
        if (userAvatar) {
            userAvatar.src = user.photoURL || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%234285F4"/><text x="50" y="65" font-family="Arial" font-size="40" fill="white" text-anchor="middle">${user.name.charAt(0).toUpperCase()}</text></svg>`;
        }

        // Also update the existing user system if available
        if (window.userSystem && window.userSystem.setCurrentUser) {
            try {
                window.userSystem.setCurrentUser(user);
                console.log('✅ Updated existing user system with authenticated user');
            } catch (error) {
                console.warn('⚠️ Could not update existing user system:', error);
            }
        }

        // Update header user sync if available
        if (window.HeaderUserSync) {
            try {
                const headerSync = new window.HeaderUserSync();
                headerSync.updateUserDisplay(user);
                console.log('✅ Updated header user sync');
            } catch (error) {
                console.warn('⚠️ Could not update header user sync:', error);
            }
        }
    }

    /**
     * Handle user login
     */
    async handleLogin(loginData) {
        console.log('🔐 Handling login for:', loginData.email);
        
        try {
            let user;
            
            if (this.isOnline) {
                // Try backend authentication - backend expects form data, not JSON
                const formData = new FormData();
                formData.append('username', loginData.email || loginData.username);
                formData.append('password', loginData.password);
                
                const response = await fetch('http://localhost:8000/api/auth/login', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const data = await response.json();
                    user = data.user;
                    
                    // Store auth token - backend returns 'access_token'
                    if (data.access_token) {
                        localStorage.setItem('iterum_auth_token', data.access_token);
                        localStorage.setItem('access_token', data.access_token); // Backup for compatibility
                    }
                } else {
                    const errorData = await response.json().catch(() => ({ detail: 'Login failed' }));
                    throw new Error(errorData.detail || 'Invalid email or password');
                }
            } else {
                // Offline mode: check saved users
                const savedUser = this.savedUsers.find(u => 
                    u.email === loginData.email || u.username === loginData.email
                );
                
                if (!savedUser) {
                    throw new Error('User not found in offline mode');
                }
                
                // For local development, allow passwordless login if no password set
                if (savedUser.password && savedUser.password !== 'localdev123' && loginData.password !== savedUser.password) {
                    throw new Error('Invalid password');
                }
                
                user = savedUser;
            }
            
            // Set current user
            this.currentUser = user;
            localStorage.setItem('current_user', JSON.stringify(user));
            localStorage.setItem('session_active', 'true');
            localStorage.setItem('last_login', new Date().toISOString());
            
            // Hide modal and update UI
            const loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.classList.add('hidden');
            
            this.hideLoadingScreen();
            this.updateAuthUI(user);
            
            // Trigger header update event
            document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: user }));
            
            // Refresh user data manager
            if (window.userDataManager) {
                window.userDataManager.refreshUserData();
            }
            
            console.log('✅ Login successful for:', user.name);
            
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error; // Re-throw to be handled by the form
        }
    }

    /**
     * Handle user signup
     */
    async handleSignup(signupData) {
        console.log('🔐 Handling signup for:', signupData.email);
        
        try {
            let user;
            
            if (this.isOnline) {
                // Try backend user creation
                const response = await fetch('http://localhost:8000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: signupData.name || signupData.email.split('@')[0],
                        email: signupData.email,
                        password: signupData.password || null, // Optional for local dev
                        first_name: signupData.name,
                        role: signupData.role,
                        restaurant: signupData.restaurant
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    user = data; // Backend returns user directly, not wrapped in 'user' property
                    
                    // Registration doesn't return token, user needs to login
                    console.log('✅ Account created successfully, please login');
                } else if (response.status === 400) {
                    const errorData = await response.json().catch(() => ({ detail: 'Registration failed' }));
                    throw new Error(errorData.detail || 'An account with this email or username already exists');
                } else {
                    const errorData = await response.json().catch(() => ({ detail: 'Registration failed' }));
                    throw new Error(errorData.detail || 'Failed to create account. Please try again.');
                }
            } else {
                // Offline mode: create user locally
                user = {
                    id: 'user_' + Date.now(),
                    name: signupData.name,
                    email: signupData.email,
                    role: signupData.role || 'chef',
                    restaurant: signupData.restaurant || 'My Kitchen',
                    password: signupData.password || 'localdev123', // Default password for local dev
                    avatar: null,
                    isGoogleUser: false,
                    recipes: [],
                    ingredients: [],
                    equipment: [],
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                };
                
                // Add to saved users
                this.savedUsers.push(user);
                localStorage.setItem('saved_users', JSON.stringify(this.savedUsers));
            }
            
            // Set current user
            this.currentUser = user;
            localStorage.setItem('current_user', JSON.stringify(user));
            localStorage.setItem('session_active', 'true');
            localStorage.setItem('last_login', new Date().toISOString());
            
            // Hide modal and update UI
            const loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.classList.add('hidden');
            
            this.hideLoadingScreen();
            this.updateAuthUI(user);
            
            // Refresh user data manager
            if (window.userDataManager) {
                window.userDataManager.refreshUserData();
            }
            
            console.log('✅ Signup successful for:', user.name);
            
        } catch (error) {
            console.error('❌ Signup error:', error);
            throw error; // Re-throw to be handled by the form
        }
    }

    /**
     * Handle logout
     */
    handleLogout() {
        console.log('🔐 Handling logout...');
        
        // Clear current user
        this.currentUser = null;
        
        // Clear all authentication data
        localStorage.removeItem('current_user');
        localStorage.removeItem('currentLocalProfile');
        localStorage.removeItem('iterum_auth_token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('session_active');
        localStorage.removeItem('last_login');
        
        // Clear any profile-specific data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('equipment_') || key.startsWith('profile_') || key.includes('user')) {
            localStorage.removeItem(key);
          }
        });
        
        // Sign out from Firebase if available
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            window.firebaseAuth.signOut().catch(console.warn);
        }
        
        // Trigger header update event
        document.dispatchEvent(new CustomEvent('userLoggedOut'));
        
        // Show loading overlay and auth flow
        this.showLoadingOverlay();
        
        // Show auth flow again
        setTimeout(() => {
            this.showAuthFlow();
        }, 100);
    }

    /**
     * Show loading overlay for auth
     */
    showLoadingOverlay() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            loadingOverlay.style.opacity = '1';
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return !!this.currentUser;
    }

    /**
     * Get current session info for debugging
     */
    getSessionInfo() {
        return {
            user: this.currentUser?.name || 'None',
            sessionActive: this.isSessionActive(),
            lastLogin: localStorage.getItem('last_login'),
            lastActivity: localStorage.getItem('last_activity'),
            isOnline: this.isOnline
        };
    }

    /**
     * Debug method to check localStorage state
     */
    debugLocalStorage() {
        console.log('🔍 Debugging localStorage state...');
        
        const savedUsers = localStorage.getItem('saved_users');
        const currentUser = localStorage.getItem('current_user');
        const sessionActive = localStorage.getItem('session_active');
        
        console.log('📦 saved_users:', savedUsers);
        console.log('👤 current_user:', currentUser);
        console.log('🔑 session_active:', sessionActive);
        
        if (savedUsers) {
            try {
                const users = JSON.parse(savedUsers);
                console.log('✅ Parsed saved users:', users);
                console.log('📊 User count:', users.length);
            } catch (error) {
                console.error('❌ Error parsing saved users:', error);
            }
        }
        
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                console.log('✅ Parsed current user:', user);
            } catch (error) {
                console.error('❌ Error parsing current user:', error);
            }
        }
        
        return {
            savedUsers: savedUsers,
            currentUser: currentUser,
            sessionActive: sessionActive,
            parsedUsers: savedUsers ? JSON.parse(savedUsers) : [],
            parsedCurrentUser: currentUser ? JSON.parse(currentUser) : null
        };
    }
    /**
     * Switch to a different user (maintains session for new user)
     */
    async switchUser() {
        console.log('🔄 Switching user...');
        
        // If we have saved users, show the switch interface directly
        if (this.savedUsers && this.savedUsers.length > 1) {
            this.showSwitchUserInterface();
        } else {
            // Fall back to full auth flow if no users available
            this.currentUser = null;
            localStorage.removeItem('current_user');
            localStorage.removeItem('session_active');
            localStorage.removeItem('last_login');
            
            // Show user selection or login flow
            this.showLoadingOverlay();
            await this.showAuthFlow();
        }
    }

    /**
     * Update authentication UI after user selection
     */
    updateAuthUI() {
        try {
            if (this.currentUser) {
                console.log('🔄 Updating authentication UI for user:', this.currentUser.name);
                
                // Update header user display
                if (window.HeaderUserSync) {
                    window.HeaderUserSync.updateUserDisplay(this.currentUser);
                }
                
                // Update user system
                if (window.userSystem) {
                    window.userSystem.setCurrentUser(this.currentUser);
                }
                
                // Dispatch event to show user toggle
                window.dispatchEvent(new CustomEvent('showUserToggle', {
                    detail: { user: this.currentUser }
                }));
                
                console.log('✅ Authentication UI updated');
            }
        } catch (error) {
            console.error('❌ Error updating authentication UI:', error);
        }
    }

    /**
     * Debug user loading issues
     */
    debugUserLoading() {
        try {
            console.log('🐛 Debugging user loading...');
            
            // Check current state
            console.log('📊 Current savedUsers:', this.savedUsers);
            console.log('📊 Current savedUsers length:', this.savedUsers.length);
            
            // Check localStorage directly
            const savedUsersData = localStorage.getItem('saved_users');
            console.log('📦 Raw saved_users from localStorage:', savedUsersData);
            
            if (savedUsersData) {
                try {
                    const parsed = JSON.parse(savedUsersData);
                    console.log('✅ Parsed saved_users:', parsed);
                    console.log('📊 Parsed length:', parsed.length);
                } catch (parseError) {
                    console.error('❌ Parse error:', parseError);
                }
            }
            
            // Check for other user-related keys
            const allKeys = Object.keys(localStorage);
            const userKeys = allKeys.filter(key => 
                key.includes('user') || 
                key.includes('profile') || 
                key.includes('auth')
            );
            console.log('🔍 User-related localStorage keys:', userKeys);
            
            // Check each user-related key
            userKeys.forEach(key => {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const parsed = JSON.parse(data);
                        console.log(`📦 ${key}:`, parsed);
                    }
                } catch (error) {
                    console.log(`❌ ${key}: Parse error`);
                }
            });
            
            // Force reload users
            console.log('🔄 Forcing user reload...');
            this.loadSavedUsersFromLocal();
            console.log('📊 After reload, savedUsers count:', this.savedUsers.length);
            
            // Show alert with debug info
            const debugInfo = `
Debug Information:
- Current savedUsers count: ${this.savedUsers.length}
- localStorage saved_users: ${savedUsersData ? 'Present' : 'Missing'}
- User-related keys: ${userKeys.length}
- Check console for detailed information
            `;
            alert(debugInfo);
            
        } catch (error) {
            console.error('❌ Error in debugUserLoading:', error);
            alert('Debug error: ' + error.message);
        }
    }

    /**
     * Check if users.json file is accessible
     */
    async checkUsersJSONAccess() {
        const possiblePaths = [
            './users/users.json',
            '../users/users.json',
            'users/users.json',
            '/users/users.json'
        ];
        
        for (const path of possiblePaths) {
            try {
                const response = await fetch(path, { method: 'HEAD' });
                if (response.ok) {
                    console.log(`✅ users.json accessible at: ${path}`);
                    return path;
                }
            } catch (error) {
                console.log(`⚠️ Path ${path} not accessible:`, error.message);
            }
        }
        
        console.log('❌ users.json not accessible at any path');
        return null;
    }

    /**
     * Manually import users from JSON file
     */
    async importUsersFromJSON(isManualImport = false) {
        this.isManualImport = isManualImport;
        try {
            console.log('📥 Manually importing users from JSON file...');
            
            // First check if the file is accessible
            const accessiblePath = await this.checkUsersJSONAccess();
            if (!accessiblePath) {
                throw new Error('users.json file is not accessible');
            }
            
            // Load from the accessible path
            const response = await fetch(accessiblePath);
            if (!response.ok) {
                throw new Error(`Failed to fetch users.json: ${response.status}`);
            }
            
            const users = await response.json();
            console.log(`📦 Loaded ${users.length} users from JSON file (${accessiblePath}):`, users);
            
            // Add users to savedUsers array
            users.forEach(user => {
                if (!this.savedUsers.find(u => u.id === user.id)) {
                    this.savedUsers.push(user);
                    console.log(`➕ Added user: ${user.name}`);
                }
            });
            
            // Save to localStorage
            localStorage.setItem('saved_users', JSON.stringify(this.savedUsers));
            
            // Sync with enhanced user system if available
            if (window.enhancedUserSystem) {
                window.enhancedUserSystem.users = [...this.savedUsers];
                window.enhancedUserSystem.saveUsersToLocalStorage();
            }
            
            console.log(`✅ Successfully imported users. Total users: ${this.savedUsers.length}`);
            
            // If this was an automatic import during startup, refresh the user selection interface
            if (!isManualImport && this.savedUsers.length > 0) {
                console.log('🔄 Refreshing user selection interface after automatic import...');
                // Use setTimeout to ensure the DOM is ready
                setTimeout(() => {
                    if (this.savedUsers.length > 0) {
                        this.showUserSelection();
                    }
                }, 100);
            }
            
            return this.savedUsers;
        } catch (error) {
            console.error('❌ Error importing users from JSON:', error);
            // Don't show alert during automatic import, only during manual import
            if (this.isManualImport) {
                alert('Failed to import users: ' + error.message);
            }
            return null;
        }
    }
}

// Initialize unified auth system
const unifiedAuth = new UnifiedAuthSystem();

// Make it globally available
window.unifiedAuth = unifiedAuth;

// Global function for easy access to switch user functionality
window.showSwitchUserInterface = function() {
    if (window.unifiedAuth) {
        window.unifiedAuth.showSwitchUserInterface();
    } else {
        console.warn('⚠️ Unified auth system not available');
    }
};

// Global function for quick user switching
window.switchUser = function() {
    if (window.unifiedAuth) {
        window.unifiedAuth.switchUser();
    } else {
        console.warn('⚠️ Unified auth system not available');
    }
};

// Global function for debugging localStorage
window.debugAuth = function() {
    if (window.unifiedAuth) {
        return window.unifiedAuth.debugLocalStorage();
    } else {
        console.warn('⚠️ Unified auth system not available');
        return null;
    }
};

// Global function to force reload users
window.reloadUsers = async function() {
    if (window.unifiedAuth) {
        console.log('🔄 Forcing user reload...');
        await window.unifiedAuth.loadSavedUsers();
        console.log('✅ Users reloaded. Count:', window.unifiedAuth.savedUsers.length);
        return window.unifiedAuth.savedUsers;
    } else {
        console.warn('⚠️ Unified auth system not available');
        return null;
    }
};

// Global function to import users from JSON file
window.importUsersFromJSON = async function() {
    if (window.unifiedAuth) {
        console.log('📥 Importing users from JSON file...');
        const users = await window.unifiedAuth.importUsersFromJSON();
        if (users) {
            alert(`✅ Successfully imported ${users.length} users!`);
            // Refresh the page to show the users
            location.reload();
        }
        return users;
    } else {
        console.warn('⚠️ Unified auth system not available');
        return null;
    }
};

// Create global instance
        window.unifiedAuthSystem = new UnifiedAuthSystem();
        window.unifiedAuth = window.unifiedAuthSystem; // Alias for onclick handlers

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedAuthSystem;
} 