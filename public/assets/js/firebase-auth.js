/**
 * Firebase Authentication Integration for Iterum R&D Chef Notebook
 * Provides Google, Email/Password, and other Firebase Auth methods
 * Integrates with existing unified authentication system
 */

// Firebase configuration - embedded directly to avoid loading issues
// Uses global config from firebase-config.js if available, otherwise fallback to embedded config
const firebaseConfig = window.firebaseConfig || {
    apiKey: "AIzaSyDnoHJC-p22f-sBsdo_5UTeFiurFZ5Q4Yw",
    authDomain: "iterum-culinary-app2.firebaseapp.com",
    projectId: "iterum-culinary-app2",
    storageBucket: "iterum-culinary-app2.firebasestorage.app",
    messagingSenderId: "109643878536",
    appId: "1:109643878536:web:65a701743af85b083a0f3d",
    measurementId: "G-X9Y60QRWMT"
};

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js';
import { 
    getAuth, 
    signInWithPopup, 
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

// Analytics tracker (optional - import with error handling)
let analyticsTracker = null;
try {
    // Dynamic import to avoid breaking if file doesn't exist
    import('./analytics-tracker.js').then(module => {
        analyticsTracker = module.default || module;
    }).catch(() => {
        // Analytics tracker is optional
        console.warn('⚠️ Analytics tracker not available (non-critical)');
    });
} catch (e) {
    // Analytics tracker is optional - don't fail Firebase Auth if it's missing
    console.warn('⚠️ Analytics tracker import failed (non-critical)');
}

class FirebaseAuthSystem {
    constructor() {
        this.app = null;
        this.auth = null;
        this.providers = {};
        this.isInitialized = false;
        this.currentFirebaseUser = null;
        this.unifiedAuthSystem = null;
        this.retryAttempted = false;
        
        // Set window.firebaseAuth immediately for other scripts
        window.firebaseAuth = this;
        
        // Initialize immediately - config is embedded in this file
        this.init();
    }

    /**
     * Initialize Firebase Auth
     */
    async init() {
        try {
            console.log('🔥 Initializing Firebase Authentication...');
            
            // Use embedded config instead of waiting for global config
            console.log('🔥 Using embedded Firebase config:', firebaseConfig.projectId);
            
            // Check if Firebase functions are available
            if (typeof initializeApp === 'undefined') {
                console.error('❌ Firebase initializeApp not available');
                throw new Error('Firebase SDK not loaded properly');
            }
            
            // Initialize Firebase app with embedded config
            this.app = initializeApp(firebaseConfig);
            this.auth = getAuth(this.app);
            
            // Initialize Analytics (optional - don't fail if it doesn't work)
            if (firebaseConfig.measurementId) {
                try {
                    this.analytics = getAnalytics(this.app);
                    console.log('📊 Firebase Analytics initialized');
                    
                    // Initialize Analytics Tracker (if available)
                    if (analyticsTracker && typeof analyticsTracker.init === 'function') {
                        try {
                            await analyticsTracker.init(this.app);
                        } catch (analyticsError) {
                            console.warn('⚠️ Analytics tracker init failed (non-critical):', analyticsError);
                        }
                    }
                } catch (analyticsError) {
                    console.warn('⚠️ Firebase Analytics initialization failed (non-critical):', analyticsError);
                }
            }
            
            // Setup providers
            this.providers = {
                google: new GoogleAuthProvider()
            };
            
            // Configure Google provider
            this.providers.google.addScope('email');
            this.providers.google.addScope('profile');
            
            // Check for redirect result first
            this.handleRedirectResult();
            
            // Listen for auth state changes
            onAuthStateChanged(this.auth, (user) => {
                this.handleAuthStateChange(user);
            });
            
            this.isInitialized = true;
            console.log('✅ Firebase Auth initialized successfully for iterum-culinary-app2');
            
            // Add alias for backward compatibility
            this.createAccountWithEmail = this.createUserWithEmail;
            
            // Make sure window.firebaseAuth is set and mark as ready
            window.firebaseAuth = this;
            window.firebaseAuthReady = true;
            
            // Dispatch event for other scripts
            window.dispatchEvent(new CustomEvent('firebaseAuthReady', { detail: this }));
            
            // Connect with unified auth system
            this.connectWithUnifiedAuth();
            
        } catch (error) {
            console.error('❌ Firebase Auth initialization failed:', error);
            this.isInitialized = false;
            
            // Retry initialization after a delay (only once to avoid infinite loops)
            if (!this.retryAttempted) {
                this.retryAttempted = true;
                setTimeout(() => {
                    console.log('🔄 Retrying Firebase Auth initialization...');
                    this.init();
                }, 1000);
            } else {
                console.error('❌ Firebase Auth initialization failed after retry');
            }
        }
    }

    /**
     * Handle redirect result from Google sign-in
     */
    async handleRedirectResult() {
        try {
            const result = await getRedirectResult(this.auth);
            if (result) {
                console.log('✅ Google redirect sign-in successful:', result.user.displayName);
                // The user will be handled by the auth state listener
            }
        } catch (error) {
            console.error('❌ Error handling redirect result:', error);
            // Don't throw here as it might be a normal redirect without result
        }
    }

    /**
     * Connect with the existing unified auth system
     */
    connectWithUnifiedAuth() {
        // Wait for unified auth system to be available
        const checkForUnifiedAuth = () => {
            if (window.unifiedAuthSystem) {
                this.unifiedAuthSystem = window.unifiedAuthSystem;
                console.log('🔗 Connected Firebase Auth with Unified Auth System');
                return true;
            }
            return false;
        };
        
        if (!checkForUnifiedAuth()) {
            // Check every 500ms for up to 10 seconds
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (checkForUnifiedAuth() || attempts >= 20) {
                    clearInterval(interval);
                }
            }, 500);
        }
    }

    /**
     * Handle Firebase auth state changes
     */
    handleAuthStateChange(firebaseUser) {
        this.currentFirebaseUser = firebaseUser;
        
        if (firebaseUser) {
            console.log('🔥 Firebase user signed in:', firebaseUser.displayName || firebaseUser.email);
            this.syncWithUnifiedAuth(firebaseUser);
        } else {
            console.log('🔥 Firebase user signed out');
            this.syncWithUnifiedAuth(null);
        }
    }

    /**
     * Sync Firebase user with unified auth system
     */
    syncWithUnifiedAuth(firebaseUser) {
        if (!this.unifiedAuthSystem) return;
        
        if (firebaseUser) {
            // Create user object compatible with unified auth system
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
            
            // Set as current user in unified auth system
            this.unifiedAuthSystem.currentUser = user;
            
            // Save to local storage
            this.unifiedAuthSystem.saveUserLocally(user);
            
            // Update UI
            this.unifiedAuthSystem.updateAuthUI(user);
            
            console.log('✅ Firebase user synced with unified auth system:', user.email);
            
        } else {
            // Clear user from unified auth system
            this.unifiedAuthSystem.clearSession();
            console.log('🧹 Firebase sign-out, cleared unified auth session');
        }
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        if (!this.isInitialized) {
            throw new Error('Firebase Auth not initialized');
        }
        
        try {
            console.log('🔥 Signing in with Google...');
            
            // Use redirect method to avoid COOP issues
            console.log('🔄 Using redirect method to avoid COOP issues...');
            await signInWithRedirect(this.auth, this.providers.google);
            
            // The redirect will take the user to Google, then back to our app
            // The result will be handled by getRedirectResult() in the auth state listener
            
        } catch (error) {
            console.error('❌ Google sign-in failed:', error);
            
            // Handle specific error cases
            if (error.code === 'auth/cancelled-popup-request') {
                throw new Error('Sign-in cancelled by user');
            } else if (error.code === 'auth/popup-blocked') {
                throw new Error('Redirect blocked by browser. Please check your browser settings.');
            } else {
                throw new Error('Google sign-in failed: ' + error.message);
            }
        }
    }

    /**
     * Sign in anonymously
     */
    async signInAnonymously() {
        if (!this.isInitialized) {
            throw new Error('Firebase Auth not initialized');
        }
        
        try {
            console.log('🔥 Signing in anonymously...');
            
            // Import signInAnonymously function
            const { signInAnonymously } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            const result = await signInAnonymously(this.auth);
            const user = result.user;
            
            console.log('✅ Anonymous sign-in successful');
            return user;
            
        } catch (error) {
            console.error('❌ Anonymous sign-in failed:', error);
            throw new Error('Anonymous sign-in failed: ' + error.message);
        }
    }

    /**
     * Sign in with email and password
     */
    async signInWithEmail(email, password) {
        if (!this.isInitialized) {
            throw new Error('Firebase Auth not initialized');
        }
        
        try {
            console.log('🔥 Signing in with email...');
            const result = await signInWithEmailAndPassword(this.auth, email, password);
            const user = result.user;
            
            console.log('✅ Email sign-in successful:', user.email);
            return user;
            
        } catch (error) {
            console.error('❌ Email sign-in failed:', error);
            
            // Handle specific error cases
            if (error.code === 'auth/user-not-found') {
                throw new Error('No account found with this email address');
            } else if (error.code === 'auth/wrong-password') {
                throw new Error('Incorrect password');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('Invalid email address');
            } else if (error.code === 'auth/too-many-requests') {
                throw new Error('Too many failed attempts. Please try again later.');
            } else {
                throw new Error('Sign-in failed: ' + error.message);
            }
        }
    }

    /**
     * Create account with email and password
     */
    async createUserWithEmail(email, password, displayName) {
        if (!this.isInitialized) {
            throw new Error('Firebase Auth not initialized');
        }
        
        try {
            console.log('🔥 Creating account with email...');
            const result = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = result.user;
            
            // Update profile with display name
            if (displayName) {
                await updateProfile(user, {
                    displayName: displayName
                });
            }
            
            console.log('✅ Account creation successful:', user.email);
            return user;
            
        } catch (error) {
            console.error('❌ Account creation failed:', error);
            
            // Handle specific error cases
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('An account with this email already exists');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('Password should be at least 6 characters');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('Invalid email address');
            } else {
                throw new Error('Account creation failed: ' + error.message);
            }
        }
    }

    /**
     * Sign out
     */
    async signOut() {
        if (!this.isInitialized) {
            throw new Error('Firebase Auth not initialized');
        }
        
        try {
            console.log('🔥 Signing out...');
            await signOut(this.auth);
            console.log('✅ Sign-out successful');
            
        } catch (error) {
            console.error('❌ Sign-out failed:', error);
            throw new Error('Sign-out failed: ' + error.message);
        }
    }

    /**
     * Get current Firebase user
     */
    getCurrentUser() {
        return this.currentFirebaseUser;
    }

    /**
     * Check if user is signed in
     */
    isSignedIn() {
        return this.currentFirebaseUser !== null;
    }

    /**
     * Get user's ID token
     */
    async getIdToken() {
        if (this.currentFirebaseUser) {
            return await this.currentFirebaseUser.getIdToken();
        }
        return null;
    }
}

// Initialize Firebase Auth System immediately
let firebaseAuthInstance = null;

// Initialize synchronously to set window.firebaseAuth immediately
try {
    firebaseAuthInstance = new FirebaseAuthSystem();
    window.firebaseAuth = firebaseAuthInstance;
    console.log('🔥 Firebase Auth System instance created');
} catch (error) {
    console.error('❌ Failed to create Firebase Auth System:', error);
    // Create a placeholder object so waitForFirebaseAuth doesn't fail immediately
    window.firebaseAuth = {
        isInitialized: false,
        init: async function() {
            console.log('🔄 Retrying Firebase Auth initialization...');
            try {
                firebaseAuthInstance = new FirebaseAuthSystem();
                window.firebaseAuth = firebaseAuthInstance;
            } catch (e) {
                console.error('❌ Retry failed:', e);
            }
        }
    };
}

// Export for module usage
export default FirebaseAuthSystem;
