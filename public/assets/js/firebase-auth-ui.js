/**
 * Firebase Authentication UI Components
 * Provides beautiful UI for Firebase authentication methods
 * Integrates with the existing unified auth system
 */

class FirebaseAuthUI {
    constructor() {
        this.firebaseAuth = null;
        this.modalContainer = null;
        this.isModalOpen = false;
        
        this.init();
    }

    /**
     * Initialize Firebase Auth UI
     */
    init() {
        // Wait for Firebase Auth to be available
        const checkForFirebaseAuth = () => {
            if (window.firebaseAuth) {
                this.firebaseAuth = window.firebaseAuth;
                console.log('🎨 Firebase Auth UI initialized');
                return true;
            }
            return false;
        };
        
        if (!checkForFirebaseAuth()) {
            // Check every 500ms for up to 10 seconds
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (checkForFirebaseAuth() || attempts >= 20) {
                    clearInterval(interval);
                }
            }, 500);
        }
    }

    /**
     * Show Firebase authentication modal
     */
    showAuthModal() {
        if (this.isModalOpen) return;
        
        this.createModal();
        this.isModalOpen = true;
    }

    /**
     * Create the authentication modal
     */
    createModal() {
        // Create modal container
        this.modalContainer = document.createElement('div');
        this.modalContainer.className = 'firebase-auth-modal';
        this.modalContainer.innerHTML = `
            <div class="firebase-auth-modal-content">
                <div class="firebase-auth-header">
                    <h3>🔥 Sign in to Iterum</h3>
                    <button class="firebase-auth-close" onclick="firebaseAuthUI.closeModal()">×</button>
                </div>
                
                <div class="firebase-auth-body">
                    <!-- Google Sign In -->
                    <button class="firebase-auth-btn firebase-auth-google" onclick="firebaseAuthUI.signInWithGoogle()">
                        <svg class="firebase-auth-icon" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </button>
                    
                    <!-- Divider -->
                    <div class="firebase-auth-divider">
                        <span>or</span>
                    </div>
                    
                    <!-- Email/Password Form -->
                    <div class="firebase-auth-form">
                        <div class="firebase-auth-tabs">
                            <button class="firebase-auth-tab active" onclick="firebaseAuthUI.switchTab('signin')">Sign In</button>
                            <button class="firebase-auth-tab" onclick="firebaseAuthUI.switchTab('signup')">Sign Up</button>
                        </div>
                        
                        <form id="firebase-auth-email-form" class="firebase-auth-email-form">
                            <div class="firebase-auth-input-group">
                                <label for="firebase-auth-email">Email</label>
                                <input type="email" id="firebase-auth-email" placeholder="Enter your email" required>
                            </div>
                            
                            <div class="firebase-auth-input-group">
                                <label for="firebase-auth-password">Password</label>
                                <input type="password" id="firebase-auth-password" placeholder="Enter your password" required>
                            </div>
                            
                            <div class="firebase-auth-input-group" id="firebase-auth-confirm-password-group" style="display: none;">
                                <label for="firebase-auth-confirm-password">Confirm Password</label>
                                <input type="password" id="firebase-auth-confirm-password" placeholder="Confirm your password">
                            </div>
                            
                            <button type="submit" class="firebase-auth-btn firebase-auth-email">
                                <span class="firebase-auth-icon">📧</span>
                                <span id="firebase-auth-submit-text">Sign In</span>
                            </button>
                        </form>
                    </div>
                    
                    <!-- Divider -->
                    <div class="firebase-auth-divider">
                        <span>or</span>
                    </div>
                    
                    <!-- Anonymous User -->
                    <button class="firebase-auth-btn firebase-auth-anonymous" onclick="firebaseAuthUI.signInAnonymously()">
                        <span class="firebase-auth-icon">👤</span>
                        Continue as Guest
                    </button>
                    
                    <!-- Loading State -->
                    <div class="firebase-auth-loading" style="display: none;">
                        <div class="firebase-auth-spinner"></div>
                        <p>Signing you in...</p>
                    </div>
                    
                    <!-- Error Message -->
                    <div class="firebase-auth-error" style="display: none;">
                        <p class="firebase-auth-error-message"></p>
                    </div>
                </div>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(this.modalContainer);
        
        // Add styles
        this.addStyles();
        
        // Close on outside click
        this.modalContainer.addEventListener('click', (e) => {
            if (e.target === this.modalContainer) {
                this.closeModal();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen) {
                this.closeModal();
            }
        });
        
        // Add form event listener
        const emailForm = document.getElementById('firebase-auth-email-form');
        if (emailForm) {
            emailForm.addEventListener('submit', (e) => this.handleEmailAuth(e));
        }
    }

    /**
     * Close the authentication modal
     */
    closeModal() {
        if (this.modalContainer) {
            this.modalContainer.remove();
            this.modalContainer = null;
        }
        this.isModalOpen = false;
    }

    /**
     * Handle Google sign-in
     */
    async signInWithGoogle() {
        if (!this.firebaseAuth) {
            this.showError('Firebase Auth not available');
            return;
        }
        
        this.showLoading();
        
        try {
            await this.firebaseAuth.signInWithGoogle();
            this.closeModal();
            
        } catch (error) {
            this.showError(error.message);
            this.hideLoading();
        }
    }

    /**
     * Handle anonymous sign-in
     */
    async signInAnonymously() {
        if (!this.firebaseAuth) {
            this.showError('Firebase Auth not available');
            return;
        }
        
        this.showLoading();
        
        try {
            await this.firebaseAuth.signInAnonymously();
            this.closeModal();
            
        } catch (error) {
            this.showError(error.message);
            this.hideLoading();
        }
    }

    /**
     * Switch between sign in and sign up tabs
     */
    switchTab(tab) {
        const tabs = document.querySelectorAll('.firebase-auth-tab');
        const confirmPasswordGroup = document.getElementById('firebase-auth-confirm-password-group');
        const submitText = document.getElementById('firebase-auth-submit-text');
        
        // Update tab appearance
        tabs.forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        
        if (tab === 'signup') {
            confirmPasswordGroup.style.display = 'block';
            submitText.textContent = 'Sign Up';
        } else {
            confirmPasswordGroup.style.display = 'none';
            submitText.textContent = 'Sign In';
        }
    }

    /**
     * Handle email/password authentication (both sign in and sign up)
     */
    async handleEmailAuth(event) {
        event.preventDefault();
        
        if (!this.firebaseAuth) {
            this.showError('Firebase Auth not available');
            return;
        }
        
        const email = document.getElementById('firebase-auth-email').value;
        const password = document.getElementById('firebase-auth-password').value;
        const confirmPassword = document.getElementById('firebase-auth-confirm-password').value;
        const isSignUp = event.target.querySelector('.firebase-auth-tab.active').textContent === 'Sign Up';
        
        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }
        
        if (isSignUp) {
            if (!confirmPassword) {
                this.showError('Please confirm your password');
                return;
            }
            
            if (password !== confirmPassword) {
                this.showError('Passwords do not match');
                return;
            }
            
            if (password.length < 6) {
                this.showError('Password must be at least 6 characters');
                return;
            }
        }
        
        this.showLoading();
        
        try {
            if (isSignUp) {
                await this.firebaseAuth.createUserWithEmail(email, password);
            } else {
                await this.firebaseAuth.signInWithEmail(email, password);
            }
            this.closeModal();
            
        } catch (error) {
            this.showError(error.message);
            this.hideLoading();
        }
    }

    /**
     * Handle account creation
     */
    async handleCreateAccount(event) {
        event.preventDefault();
        
        if (!this.firebaseAuth) {
            this.showError('Firebase Auth not available');
            return;
        }
        
        const displayName = document.getElementById('firebase-display-name').value;
        const email = document.getElementById('firebase-create-email').value;
        const password = document.getElementById('firebase-create-password').value;
        
        if (!displayName || !email || !password) {
            this.showError('Please fill in all fields');
            return;
        }
        
        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }
        
        this.showLoading();
        
        try {
            await this.firebaseAuth.createAccountWithEmail(email, password, displayName);
            this.closeModal();
            
        } catch (error) {
            this.showError(error.message);
            this.hideLoading();
        }
    }

    /**
     * Show create account form
     */
    showCreateAccount() {
        const signInForm = this.modalContainer.querySelector('.firebase-auth-form:not(.firebase-auth-create-form)');
        const createForm = this.modalContainer.querySelector('.firebase-auth-create-form');
        
        if (signInForm) signInForm.style.display = 'none';
        if (createForm) createForm.style.display = 'block';
    }

    /**
     * Show sign-in form
     */
    showSignIn() {
        const signInForm = this.modalContainer.querySelector('.firebase-auth-form:not(.firebase-auth-create-form)');
        const createForm = this.modalContainer.querySelector('.firebase-auth-create-form');
        
        if (signInForm) signInForm.style.display = 'block';
        if (createForm) createForm.style.display = 'none';
    }

    /**
     * Show loading state
     */
    showLoading() {
        const loading = this.modalContainer.querySelector('.firebase-auth-loading');
        const forms = this.modalContainer.querySelectorAll('.firebase-auth-form');
        
        if (loading) loading.style.display = 'block';
        forms.forEach(form => form.style.display = 'none');
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loading = this.modalContainer.querySelector('.firebase-auth-loading');
        const signInForm = this.modalContainer.querySelector('.firebase-auth-form:not(.firebase-auth-create-form)');
        
        if (loading) loading.style.display = 'none';
        if (signInForm) signInForm.style.display = 'block';
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = this.modalContainer.querySelector('.firebase-auth-error');
        const errorMessage = this.modalContainer.querySelector('.firebase-auth-error-message');
        
        if (errorDiv && errorMessage) {
            errorMessage.textContent = message;
            errorDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Add CSS styles for the modal
     */
    addStyles() {
        if (document.getElementById('firebase-auth-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'firebase-auth-styles';
        style.textContent = `
            .firebase-auth-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(4px);
                animation: firebaseAuthFadeIn 0.3s ease;
            }
            
            @keyframes firebaseAuthFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .firebase-auth-modal-content {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                width: 90%;
                max-width: 380px;
                max-height: 85vh;
                overflow-y: auto;
                animation: firebaseAuthSlideIn 0.3s ease;
            }
            
            @keyframes firebaseAuthSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            .firebase-auth-header {
                padding: 20px 24px 16px;
                border-bottom: 1px solid #e5e7eb;
                text-align: center;
                position: relative;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-radius: 12px 12px 0 0;
            }
            
            .firebase-auth-header h3 {
                margin: 0;
                font-size: 20px;
                font-weight: 700;
                color: #1e293b;
            }
            
            .firebase-auth-close {
                position: absolute;
                top: 16px;
                right: 16px;
                background: none;
                border: none;
                font-size: 24px;
                color: #6b7280;
                cursor: pointer;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.3s ease;
            }
            
            .firebase-auth-close:hover {
                background: #f3f4f6;
                color: #374151;
            }
            
            .firebase-auth-body {
                padding: 24px;
            }
            
            .firebase-auth-btn {
                width: 100%;
                padding: 12px 16px;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-bottom: 12px;
            }
            
            .firebase-auth-google {
                background: #fff;
                color: #374151;
                border: 1px solid #d1d5db;
            }
            
            .firebase-auth-google:hover {
                background: #f9fafb;
                border-color: #9ca3af;
            }
            
            .firebase-auth-anonymous {
                background: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;
            }
            
            .firebase-auth-anonymous:hover {
                background: #e5e7eb;
                border-color: #9ca3af;
            }
            
            .firebase-auth-primary {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
            }
            
            .firebase-auth-primary:hover {
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            }
            
            .firebase-auth-icon {
                width: 20px;
                height: 20px;
            }
            
            .firebase-auth-divider {
                text-align: center;
                margin: 20px 0;
                position: relative;
            }
            
            .firebase-auth-divider::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 1px;
                background: #e5e7eb;
            }
            
            .firebase-auth-divider span {
                background: white;
                padding: 0 16px;
                color: #6b7280;
                font-size: 14px;
                position: relative;
                z-index: 1;
            }
            
            .firebase-auth-form-group {
                margin-bottom: 16px;
            }
            
            .firebase-auth-form-group input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                transition: all 0.3s ease;
                box-sizing: border-box;
            }
            
            .firebase-auth-form-group input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .firebase-auth-form-actions {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .firebase-auth-link {
                background: none;
                border: none;
                color: #3b82f6;
                cursor: pointer;
                font-size: 14px;
                text-decoration: underline;
                padding: 8px 0;
            }
            
            .firebase-auth-link:hover {
                color: #1d4ed8;
            }
            
            .firebase-auth-loading {
                text-align: center;
                padding: 40px 20px;
            }
            
            .firebase-auth-spinner {
                width: 32px;
                height: 32px;
                border: 3px solid #e5e7eb;
                border-top: 3px solid #3b82f6;
                border-radius: 50%;
                animation: firebaseAuthSpin 1s linear infinite;
                margin: 0 auto 16px;
            }
            
            @keyframes firebaseAuthSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .firebase-auth-loading p {
                color: #6b7280;
                margin: 0;
            }
            
            /* New styles for email/password form */
            .firebase-auth-form {
                margin: 16px 0;
            }
            
            .firebase-auth-tabs {
                display: flex;
                background: #f8fafc;
                border-radius: 8px;
                padding: 4px;
                margin-bottom: 20px;
            }
            
            .firebase-auth-tab {
                flex: 1;
                padding: 8px 16px;
                border: none;
                background: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                color: #6b7280;
            }
            
            .firebase-auth-tab.active {
                background: white;
                color: #1e293b;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .firebase-auth-input-group {
                margin-bottom: 16px;
            }
            
            .firebase-auth-input-group label {
                display: block;
                margin-bottom: 6px;
                font-weight: 600;
                color: #374151;
                font-size: 14px;
            }
            
            .firebase-auth-input-group input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                transition: all 0.3s ease;
                box-sizing: border-box;
            }
            
            .firebase-auth-input-group input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .firebase-auth-email {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                margin-top: 8px;
            }
            
            .firebase-auth-email:hover {
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            
            .firebase-auth-error {
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 16px;
            }
            
            .firebase-auth-error-message {
                color: #dc2626;
                font-size: 14px;
                margin: 0;
            }
            
            .firebase-auth-footer {
                padding: 20px 28px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                background: #f9fafb;
                border-radius: 0 0 16px 16px;
            }
            
            .firebase-auth-footer p {
                margin: 0;
                color: #6b7280;
                font-size: 12px;
                line-height: 1.4;
            }
            
            @media (max-width: 480px) {
                .firebase-auth-modal-content {
                    width: 95%;
                    margin: 20px;
                }
                
                .firebase-auth-header,
                .firebase-auth-body,
                .firebase-auth-footer {
                    padding: 20px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Initialize Firebase Auth UI
window.firebaseAuthUI = new FirebaseAuthUI();

// Export for module usage
export default FirebaseAuthUI;
