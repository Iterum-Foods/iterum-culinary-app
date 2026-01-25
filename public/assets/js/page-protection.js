/**
 * Page Protection System for Iterum R&D Chef Notebook
 * Ensures all pages require authentication and redirect to main page if not authenticated
 */

class PageProtection {
    constructor() {
        this.mainPage = 'index.html';
        this.protectedPages = [
            'menu-builder.html',
            'recipe-upload.html',
            'vendor-management.html',
            'recipe-library.html',
            'recipe-developer.html',
            'equipment-management.html',
            'ingredients.html'
        ];
        this.init();
    }

    /**
     * Initialize page protection
     */
    init() {
        console.log('🛡️ Initializing page protection...');
        
        // Wait for unified auth system to be ready
        this.waitForAuthSystem();
    }

    /**
     * Wait for authentication system to be ready
     */
    async waitForAuthSystem() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds timeout
        
        while (attempts < maxAttempts) {
            if (window.unifiedAuthSystem) {
                console.log('✅ Authentication system found, checking protection...');
                await this.checkPageProtection();
                return;
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.warn('⚠️ Authentication system not found after timeout, allowing page access');
    }

    /**
     * Check if current page needs protection
     */
    async checkPageProtection() {
        const currentPage = this.getCurrentPageName();
        
        // Wait for auth system to initialize
        await this.waitForAuthInitialization();
        
        // Check authentication status for ALL pages
        if (!window.unifiedAuthSystem.isAuthenticated()) {
            console.log('🚫 User not authenticated, redirecting to main page');
            this.redirectToMainPage();
            return;
        }
        
        // Check if this is a protected page
        if (this.protectedPages.includes(currentPage)) {
            console.log(`🛡️ Protected page detected: ${currentPage}`);
            console.log('✅ User authenticated, allowing access to', currentPage);
        } else if (currentPage === this.mainPage) {
            console.log('🏠 Main page detected - authentication verified');
        } else {
            console.log(`📄 Page: ${currentPage} - authentication verified`);
        }
    }

    /**
     * Wait for authentication system to fully initialize
     */
    async waitForAuthInitialization() {
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds timeout
        
        while (attempts < maxAttempts) {
            if (window.unifiedAuthSystem && 
                (window.unifiedAuthSystem.isAuthenticated() || 
                 window.unifiedAuthSystem.currentUser === null)) {
                // Auth system is ready (either authenticated or confirmed not authenticated)
                return;
            }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.warn('⚠️ Auth initialization timeout, proceeding with protection check');
    }

    /**
     * Get current page name from URL
     */
    getCurrentPageName() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page;
    }

    /**
     * Redirect to main page
     */
    redirectToMainPage() {
        console.log('🔄 Redirecting to main page for authentication...');
        
        // Show a brief message to user
        this.showRedirectMessage();
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = this.mainPage;
        }, 1500);
    }

    /**
     * Show redirect message to user
     */
    showRedirectMessage() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
        `;
        
        // Create message box
        const messageBox = document.createElement('div');
        messageBox.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            margin: 20px;
        `;
        
        messageBox.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
            <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 24px;">Authentication Required</h2>
            <p style="margin: 0 0 24px 0; color: #64748b; line-height: 1.5;">
                You need to sign in to access this page.<br>
                Redirecting to login...
            </p>
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #3b82f6;">
                <div style="width: 20px; height: 20px; border: 2px solid #3b82f6; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span>Redirecting...</span>
            </div>
        `;
        
        // Add spinner animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        overlay.appendChild(messageBox);
        document.body.appendChild(overlay);
        
        // Remove overlay after redirect
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 2000);
    }

    /**
     * Check if a page is protected
     */
    isProtectedPage(pageName) {
        return this.protectedPages.includes(pageName);
    }

    /**
     * Add a page to the protected list
     */
    addProtectedPage(pageName) {
        if (!this.protectedPages.includes(pageName)) {
            this.protectedPages.push(pageName);
            console.log(`🛡️ Added ${pageName} to protected pages list`);
        }
    }

    /**
     * Remove a page from the protected list
     */
    removeProtectedPage(pageName) {
        const index = this.protectedPages.indexOf(pageName);
        if (index > -1) {
            this.protectedPages.splice(index, 1);
            console.log(`🔓 Removed ${pageName} from protected pages list`);
        }
    }
}

// Initialize page protection when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.pageProtection = new PageProtection();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, event listener above will handle it
} else {
    // DOM is already loaded
    window.pageProtection = new PageProtection();
}

// PageProtection class is available globally as window.pageProtection
