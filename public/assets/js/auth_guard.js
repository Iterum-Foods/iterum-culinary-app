/**
 * Authentication Guard (v2.0)
 * Protects pages and ensures user is logged in
 * Uses centralized AuthManager for bulletproof authentication
 * NON-BLOCKING - Allows page to load while checking auth
 */

(async function() {
    'use strict';
    
    console.log('🔐 Auth Guard v2.0 checking credentials...');
    
    // List of pages that don't require authentication
    const publicPages = [
        'launch.html',
        'index_simple.html',
        'index_minimal.html',
        'emergency_fix_index.html',
        'test_firestore_connection.html',
        'test-user-integration.html'
    ];
    
    // Get current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Check if this is a public page
    const isPublicPage = publicPages.some(page => currentPage.includes(page));
    
    if (isPublicPage) {
        console.log('✅ Public page - no auth required:', currentPage);
        return;
    }
    
    console.log('🔒 Protected page - authentication required:', currentPage);
    
    // CRITICAL: Remove loading screen immediately to let page load
    setTimeout(() => {
        const loadingIndicator = document.getElementById('simple-loading');
        if (loadingIndicator) {
            loadingIndicator.remove();
            console.log('✅ Loading screen removed by auth guard');
        }
    }, 500);
    
    // Wait for AuthManager to be ready (non-blocking)
    let authManager = window.authManager;
    if (!authManager) {
        console.log('⏳ Waiting for AuthManager...');
        let attempts = 0;
        while (!window.authManager && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        authManager = window.authManager;
    }
    
    if (!authManager) {
        console.error('❌ AuthManager not available after 3 seconds');
        console.log('⚠️ Allowing page to load anyway - will show sign-in modal');
        
        // Wait a moment for page to fully load
        setTimeout(() => {
            showSignInModal();
        }, 1000);
        return; // Don't block page load
    }
    
    console.log('✅ AuthManager available');
    
    // Check authentication (non-blocking)
    const { authenticated, user } = await authManager.checkAuth();
    
    if (!authenticated) {
        console.warn('🚫 NOT AUTHENTICATED - Will show sign-in modal');
        console.log('  Attempted to access:', currentPage);
        
        // Wait a moment for page to fully load before showing modal
        setTimeout(() => {
            showSignInModal();
        }, 500);
        
        return; // Don't block page load
    }
    
    // User is authenticated
    console.log('✅ Authentication verified');
    console.log('👤 User:', user.name || user.email);
    
    // Check if trial has expired
    if (user.type === 'trial' && user.trialEndDate) {
        const trialEnd = new Date(user.trialEndDate);
        const now = new Date();
        const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining <= 0) {
            console.warn('⚠️ Trial has expired');
            showTrialExpiredWarning();
        } else if (daysRemaining <= 3) {
            console.warn(`⚠️ Trial expiring in ${daysRemaining} days`);
            setTimeout(() => {
                showTrialWarning(daysRemaining);
            }, 1000);
        }
    }
    
    console.log('✅ Auth Guard complete - access granted');
    
    // Function to show sign-in modal
    function showSignInModal() {
        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'auth-guard-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                #auth-guard-content {
                    animation: slideUp 0.4s ease;
                }
                .auth-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 15px;
                    transition: all 0.2s;
                }
                .auth-input:focus {
                    outline: none;
                    border-color: #4a7c2c;
                    box-shadow: 0 0 0 3px rgba(74, 124, 44, 0.1);
                }
                .auth-btn {
                    width: 100%;
                    padding: 14px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .auth-btn-primary {
                    background: linear-gradient(135deg, #4a7c2c, #6ba83d);
                    color: white;
                }
                .auth-btn-primary:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(74, 124, 44, 0.3);
                }
                .auth-btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .auth-btn-secondary {
                    background: white;
                    color: #4a7c2c;
                    border: 2px solid #4a7c2c;
                }
                .auth-btn-secondary:hover {
                    background: #f0f9ff;
                }
                .auth-link {
                    color: #4a7c2c;
                    text-decoration: none;
                    font-weight: 600;
                    transition: color 0.2s;
                }
                .auth-link:hover {
                    color: #3d6a25;
                    text-decoration: underline;
                }
                .auth-error {
                    background: #fee2e2;
                    border: 1px solid #ef4444;
                    color: #991b1b;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 14px;
                    margin-top: 12px;
                    display: none;
                }
                .auth-success {
                    background: #d1fae5;
                    border: 1px solid #10b981;
                    color: #065f46;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 14px;
                    margin-top: 12px;
                    display: none;
                }
            </style>
            
            <div id="auth-guard-content" style="
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 450px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <!-- Header -->
                <div style="
                    background: linear-gradient(135deg, #4a7c2c, #6ba83d);
                    color: white;
                    padding: 32px;
                    border-radius: 20px 20px 0 0;
                    text-align: center;
                ">
                    <div style="font-size: 48px; margin-bottom: 12px;">🔐</div>
                    <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">Sign In Required</h2>
                    <p style="margin: 0; opacity: 0.9; font-size: 15px;">Sign in to continue to your desired page</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 32px;">
                    <!-- Sign In Form -->
                    <form id="modal-signin-form">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">
                                Email Address
                            </label>
                            <input type="email" id="modal-email" class="auth-input" 
                                   placeholder="your@email.com" required>
                        </div>
                        
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">
                                Password
                            </label>
                            <input type="password" id="modal-password" class="auth-input" 
                                   placeholder="Enter your password" required>
                        </div>
                        
                        <button type="submit" class="auth-btn auth-btn-primary" id="modal-signin-btn">
                            <span id="modal-signin-text">🚀 Sign In & Continue</span>
                            <span id="modal-signin-spinner" style="display: none;">⏳ Signing in...</span>
                        </button>
                        
                        <div id="modal-error" class="auth-error"></div>
                        <div id="modal-success" class="auth-success"></div>
                    </form>
                    
                    <!-- Divider -->
                    <div style="
                        display: flex;
                        align-items: center;
                        margin: 24px 0;
                        color: #9ca3af;
                        font-size: 14px;
                    ">
                        <div style="flex: 1; height: 1px; background: #e5e7eb;"></div>
                        <div style="padding: 0 12px;">OR</div>
                        <div style="flex: 1; height: 1px; background: #e5e7eb;"></div>
                    </div>
                    
                    <!-- Alternative Actions -->
                    <button type="button" onclick="window.location.href='launch.html?tab=signup'" class="auth-btn auth-btn-secondary" style="margin-bottom: 12px;">
                        ✨ Create New Account
                    </button>
                    
                    <div style="text-align: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                        <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">
                            Don't have an account?
                        </div>
                        <a href="launch.html?tab=signup" class="auth-link" style="font-size: 15px;">
                            Sign up for free →
                        </a>
                    </div>
                    
                    <div style="text-align: center; margin-top: 12px; font-size: 13px; color: #9ca3af;">
                        <a href="launch.html" class="auth-link" style="font-size: 13px; font-weight: normal;">
                            Go to full login page
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus email input
        setTimeout(() => {
            document.getElementById('modal-email')?.focus();
        }, 300);
        
        // Handle sign-in form submission
        document.getElementById('modal-signin-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('modal-email').value.trim();
            const password = document.getElementById('modal-password').value;
            const errorDiv = document.getElementById('modal-error');
            const successDiv = document.getElementById('modal-success');
            const btnText = document.getElementById('modal-signin-text');
            const spinner = document.getElementById('modal-signin-spinner');
            const btn = document.getElementById('modal-signin-btn');
            
            // Clear messages
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
            
            // Show loading
            btn.disabled = true;
            btnText.style.display = 'none';
            spinner.style.display = 'block';
            
            try {
                // Use AuthManager to sign in
                const user = await window.authManager.signInWithEmail(email, password);
                
                // Show success
                successDiv.textContent = '✅ Sign-in successful! Redirecting...';
                successDiv.style.display = 'block';
                
                // Reload page after short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
            } catch (error) {
                console.error('Modal sign-in error:', error);
                errorDiv.textContent = '❌ ' + (error.message || 'Sign-in failed. Please check your credentials.');
                errorDiv.style.display = 'block';
                btn.disabled = false;
                btnText.style.display = 'block';
                spinner.style.display = 'none';
            }
        });
        
        // Prevent clicking outside to close (user must sign in)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                const content = document.getElementById('auth-guard-content');
                content.style.animation = 'none';
                setTimeout(() => {
                    content.style.animation = 'slideUp 0.4s ease';
                }, 10);
            }
        });
    }
    
    // Function to show trial warning
    function showTrialWarning(daysRemaining) {
        const warning = document.createElement('div');
        warning.style.cssText = `
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
        warning.innerHTML = `
            <div style="color: #92400e; font-weight: 600; margin-bottom: 8px;">
                ⚠️ Trial Ending Soon
            </div>
            <div style="color: #92400e; font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
                Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining in your trial
            </div>
            <button onclick="this.parentElement.remove()" 
                    style="padding: 6px 12px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">
                Got it
            </button>
        `;
        document.body.appendChild(warning);
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (warning.parentElement) warning.remove();
        }, 10000);
    }
    
    // Function to show trial expired warning
    function showTrialExpiredWarning() {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee2e2;
            border: 2px solid #ef4444;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        warning.innerHTML = `
            <div style="color: #991b1b; font-weight: 600; margin-bottom: 8px;">
                ⚠️ Trial Has Expired
            </div>
            <div style="color: #991b1b; font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
                Your 14-day trial has ended. Subscribe to continue using Iterum.
            </div>
            <button onclick="this.parentElement.remove()" 
                    style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">
                Dismiss
            </button>
        `;
        document.body.appendChild(warning);
    }
    
})();
