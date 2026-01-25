/**
 * Loading States Utility
 * Beautiful loading spinners and indicators
 */

class LoadingStates {
    constructor() {
        this.activeLoaders = new Map();
        this.injectStyles();
        console.log('⏳ Loading States utility initialized');
    }
    
    injectStyles() {
        if (document.getElementById('loading-states-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'loading-states-styles';
        style.textContent = `
            .loading-spinner {
                display: inline-block;
                width: 40px;
                height: 40px;
                border: 4px solid rgba(102, 126, 234, 0.2);
                border-top-color: #667eea;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }
            
            .loading-spinner-sm {
                width: 20px;
                height: 20px;
                border-width: 2px;
            }
            
            .loading-spinner-lg {
                width: 60px;
                height: 60px;
                border-width: 6px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                animation: fadeIn 0.2s ease;
            }
            
            .loading-inline {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 40px;
                flex-direction: column;
                gap: 16px;
            }
            
            .loading-text {
                color: #64748b;
                font-size: 14px;
                font-weight: 600;
                margin-top: 12px;
            }
            
            .loading-dots {
                display: inline-flex;
                gap: 6px;
            }
            
            .loading-dots span {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #667eea;
                animation: bounce 1.4s infinite ease-in-out both;
            }
            
            .loading-dots span:nth-child(1) {
                animation-delay: -0.32s;
            }
            
            .loading-dots span:nth-child(2) {
                animation-delay: -0.16s;
            }
            
            @keyframes bounce {
                0%, 80%, 100% {
                    transform: scale(0);
                    opacity: 0.5;
                }
                40% {
                    transform: scale(1);
                    opacity: 1;
                }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 4px;
            }
            
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            .skeleton-text {
                height: 16px;
                margin-bottom: 8px;
            }
            
            .skeleton-title {
                height: 24px;
                width: 60%;
                margin-bottom: 12px;
            }
            
            .skeleton-card {
                height: 200px;
                border-radius: 12px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Show full-page loading overlay
    showOverlay(message = 'Loading...') {
        const id = 'loading-overlay-' + Date.now();
        
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = id;
        overlay.innerHTML = `
            <div style="text-align: center; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div class="loading-spinner loading-spinner-lg"></div>
                <div class="loading-text" style="color: #1e293b; margin-top: 20px; font-size: 16px;">${message}</div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.activeLoaders.set(id, overlay);
        
        return id;
    }
    
    // Hide loading overlay
    hideOverlay(id) {
        const overlay = this.activeLoaders.get(id);
        if (overlay) {
            overlay.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => {
                overlay.remove();
                this.activeLoaders.delete(id);
            }, 200);
        }
    }
    
    // Hide all overlays
    hideAllOverlays() {
        this.activeLoaders.forEach((overlay, id) => {
            this.hideOverlay(id);
        });
    }
    
    // Show inline loading spinner in an element
    showInline(element, message = '') {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }
        
        if (!element) return;
        
        // Store original content
        element.dataset.originalContent = element.innerHTML;
        
        element.innerHTML = `
            <div class="loading-inline">
                <div class="loading-spinner"></div>
                ${message ? `<div class="loading-text">${message}</div>` : ''}
            </div>
        `;
    }
    
    // Show loading dots (smaller, less intrusive)
    showDots(element, message = 'Loading') {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }
        
        if (!element) return;
        
        element.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 20px;">
                <span class="loading-text" style="margin: 0;">${message}</span>
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
    }
    
    // Restore original content
    restore(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }
        
        if (!element) return;
        
        if (element.dataset.originalContent) {
            element.innerHTML = element.dataset.originalContent;
            delete element.dataset.originalContent;
        }
    }
    
    // Create skeleton loader
    createSkeleton(type = 'card', count = 1) {
        const skeletons = {
            text: '<div class="skeleton skeleton-text"></div>',
            title: '<div class="skeleton skeleton-title"></div>',
            card: '<div class="skeleton skeleton-card"></div>',
            table: `
                <div style="padding: 20px;">
                    <div class="skeleton skeleton-title"></div>
                    ${Array(5).fill('<div class="skeleton skeleton-text" style="width: 100%; margin-bottom: 12px;"></div>').join('')}
                </div>
            `
        };
        
        const skeleton = skeletons[type] || skeletons.card;
        return Array(count).fill(skeleton).join('');
    }
    
    // Show skeleton in element
    showSkeleton(element, type = 'card', count = 3) {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }
        
        if (!element) return;
        
        element.dataset.originalContent = element.innerHTML;
        element.innerHTML = this.createSkeleton(type, count);
    }
}

// Initialize global loading system
window.loadingStates = new LoadingStates();

// Convenience functions
window.showLoading = (message) => window.loadingStates.showOverlay(message);
window.hideLoading = (id) => window.loadingStates.hideOverlay(id);
window.showInlineLoading = (element, message) => window.loadingStates.showInline(element, message);
window.showLoadingDots = (element, message) => window.loadingStates.showDots(element, message);
window.restoreContent = (element) => window.loadingStates.restore(element);
window.showSkeleton = (element, type, count) => window.loadingStates.showSkeleton(element, type, count);

console.log('✅ Loading functions available: showLoading(), hideLoading(), showInlineLoading(), showSkeleton()');


