/**
 * Email Verification Banner
 * Shows banner if email is not verified
 */

(function() {
    'use strict';
    
    console.log('📧 Email Verification Banner initializing...');
    
    // Wait for AuthManager
    async function waitForAuthManager() {
        let attempts = 0;
        while (!window.authManager && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        return window.authManager;
    }
    
    // Check if email verification banner should be shown
    async function checkEmailVerification() {
        const authManager = await waitForAuthManager();
        
        if (!authManager || !authManager.isAuthenticated) {
            return; // Not logged in
        }
        
        const user = authManager.currentUser;
        
        // Only show for email accounts (not Google or trial)
        if (user.type !== 'email') {
            return;
        }
        
        // Check if Firebase user is verified
        try {
            const firebaseAuth = window.firebaseAuth;
            if (!firebaseAuth || !firebaseAuth.currentUser) {
                return;
            }
            
            // Reload user to get latest verification status
            await firebaseAuth.currentUser.reload();
            
            if (firebaseAuth.currentUser.emailVerified) {
                console.log('✅ Email is verified');
                return;
            }
            
            // Email not verified - show banner
            showVerificationBanner();
            
        } catch (error) {
            console.error('Error checking email verification:', error);
        }
    }
    
    // Show verification banner
    function showVerificationBanner() {
        // Don't show if already dismissed
        if (sessionStorage.getItem('verification_banner_dismissed')) {
            return;
        }
        
        const banner = document.createElement('div');
        banner.id = 'email-verification-banner';
        banner.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #f59e0b;
            border-radius: 12px;
            padding: 16px 24px;
            box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
            z-index: 9990;
            max-width: 600px;
            width: calc(100% - 40px);
            animation: slideDown 0.4s ease;
        `;
        
        banner.innerHTML = `
            <style>
                @keyframes slideDown {
                    from { transform: translate(-50%, -100px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            </style>
            
            <div style="display: flex; align-items: start; gap: 16px;">
                <div style="font-size: 32px; flex-shrink: 0;">📧</div>
                <div style="flex: 1;">
                    <div style="font-weight: 700; color: #92400e; margin-bottom: 4px; font-size: 16px;">
                        Please verify your email
                    </div>
                    <div style="color: #92400e; font-size: 14px; margin-bottom: 12px;">
                        We sent a verification email to <strong>${window.authManager.currentUser.email}</strong>. 
                        Please check your inbox (and spam folder).
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="resendVerificationEmail()" 
                                style="padding: 8px 16px; background: #f59e0b; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px;">
                            📧 Resend Email
                        </button>
                        <button onclick="dismissVerificationBanner()" 
                                style="padding: 8px 16px; background: white; color: #92400e; border: 2px solid #f59e0b; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px;">
                            Dismiss
                        </button>
                    </div>
                </div>
                <button onclick="dismissVerificationBanner()" 
                        style="background: none; border: none; color: #92400e; font-size: 20px; cursor: pointer; padding: 0; line-height: 1;">
                    ×
                </button>
            </div>
        `;
        
        document.body.appendChild(banner);
    }
    
    // Resend verification email
    window.resendVerificationEmail = async function() {
        try {
            await window.authManager.sendEmailVerification();
            
            // Show success message
            const banner = document.getElementById('email-verification-banner');
            if (banner) {
                banner.innerHTML = `
                    <div style="text-align: center; padding: 8px;">
                        <div style="font-size: 32px; margin-bottom: 8px;">✅</div>
                        <div style="font-weight: 700; color: #065f46; margin-bottom: 4px;">
                            Verification email sent!
                        </div>
                        <div style="color: #065f46; font-size: 14px;">
                            Check your inbox (and spam folder)
                        </div>
                    </div>
                `;
                banner.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
                banner.style.borderColor = '#10b981';
                
                setTimeout(() => {
                    dismissVerificationBanner();
                }, 3000);
            }
            
        } catch (error) {
            console.error('Error resending verification:', error);
            alert('Failed to resend verification email. Please try again.');
        }
    };
    
    // Dismiss verification banner
    window.dismissVerificationBanner = function() {
        const banner = document.getElementById('email-verification-banner');
        if (banner) {
            sessionStorage.setItem('verification_banner_dismissed', 'true');
            banner.style.animation = 'slideDown 0.3s ease reverse';
            setTimeout(() => banner.remove(), 300);
        }
    };
    
    // Initialize after page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(checkEmailVerification, 2000);
        });
    } else {
        setTimeout(checkEmailVerification, 2000);
    }
    
    console.log('✅ Email Verification Banner loaded');
    
})();

