/**
 * Enhanced Loading System for Iterum R&D Chef Notebook
 * Provides skeleton screens, progress indicators, and smooth transitions
 */

class LoadingSystem {
    constructor() {
        this.loadingStates = new Map();
        this.progressBars = new Map();
        this.skeletonTemplates = this.createSkeletonTemplates();
    }

    /**
     * Create skeleton screen templates for different content types
     */
    createSkeletonTemplates() {
        return {
            recipe: `
                <div class="skeleton-recipe">
                    <div class="skeleton-header">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-meta">
                            <div class="skeleton-badge"></div>
                            <div class="skeleton-badge"></div>
                        </div>
                    </div>
                    <div class="skeleton-content">
                        <div class="skeleton-section">
                            <div class="skeleton-subtitle"></div>
                            <div class="skeleton-line"></div>
                            <div class="skeleton-line"></div>
                            <div class="skeleton-line short"></div>
                        </div>
                        <div class="skeleton-section">
                            <div class="skeleton-subtitle"></div>
                            <div class="skeleton-line"></div>
                            <div class="skeleton-line"></div>
                            <div class="skeleton-line"></div>
                        </div>
                    </div>
                </div>
            `,
            recipeList: `
                <div class="skeleton-recipe-list">
                    ${Array(6).fill().map(() => `
                        <div class="skeleton-recipe-card">
                            <div class="skeleton-image"></div>
                            <div class="skeleton-content">
                                <div class="skeleton-title"></div>
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line short"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `,
            ingredient: `
                <div class="skeleton-ingredient">
                    <div class="skeleton-header">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-badge"></div>
                    </div>
                    <div class="skeleton-content">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                    </div>
                </div>
            `,
            equipment: `
                <div class="skeleton-equipment">
                    <div class="skeleton-header">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-status"></div>
                    </div>
                    <div class="skeleton-content">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                    </div>
                </div>
            `,
            dashboard: `
                <div class="skeleton-dashboard">
                    <div class="skeleton-stats">
                        <div class="skeleton-stat">
                            <div class="skeleton-number"></div>
                            <div class="skeleton-label"></div>
                        </div>
                        <div class="skeleton-stat">
                            <div class="skeleton-number"></div>
                            <div class="skeleton-label"></div>
                        </div>
                        <div class="skeleton-stat">
                            <div class="skeleton-number"></div>
                            <div class="skeleton-label"></div>
                        </div>
                    </div>
                    <div class="skeleton-widgets">
                        <div class="skeleton-widget">
                            <div class="skeleton-widget-header"></div>
                            <div class="skeleton-widget-content">
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line short"></div>
                            </div>
                        </div>
                        <div class="skeleton-widget">
                            <div class="skeleton-widget-header"></div>
                            <div class="skeleton-widget-content">
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line short"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        };
    }

    /**
     * Show loading state for an element
     */
    showLoading(element, type = 'recipe', message = 'Loading...') {
        if (!element) return;

        const loadingId = this.generateLoadingId();
        this.loadingStates.set(loadingId, { element, originalContent: element.innerHTML });

        // Add loading overlay
        const overlay = this.createLoadingOverlay(message);
        element.appendChild(overlay);

        // Show skeleton content
        const skeleton = this.createSkeleton(type);
        element.appendChild(skeleton);

        // Add loading styles
        element.classList.add('loading');
        element.style.position = 'relative';

        return loadingId;
    }

    /**
     * Hide loading state and show content
     */
    hideLoading(loadingId, content = null) {
        const loadingState = this.loadingStates.get(loadingId);
        if (!loadingState) return;

        const { element } = loadingState;

        // Remove loading overlay and skeleton
        const overlay = element.querySelector('.loading-overlay');
        const skeleton = element.querySelector('.skeleton-content');
        if (overlay) overlay.remove();
        if (skeleton) skeleton.remove();

        // Remove loading class
        element.classList.remove('loading');

        // Show content with fade-in animation
        if (content) {
            element.innerHTML = content;
            this.fadeIn(element);
        } else {
            // Restore original content
            element.innerHTML = loadingState.originalContent;
            this.fadeIn(element);
        }

        this.loadingStates.delete(loadingId);
    }

    /**
     * Create loading overlay with message
     */
    createLoadingOverlay(message) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-message">${message}</div>
            </div>
        `;
        return overlay;
    }

    /**
     * Create skeleton content
     */
    createSkeleton(type) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-content';
        skeleton.innerHTML = this.skeletonTemplates[type] || this.skeletonTemplates.recipe;
        return skeleton;
    }

    /**
     * Show progress bar for long operations
     */
    showProgress(container, operation = 'Processing') {
        const progressId = this.generateLoadingId();
        const progressBar = this.createProgressBar(operation);
        container.appendChild(progressBar);
        this.progressBars.set(progressId, { container, progressBar });
        return progressId;
    }

    /**
     * Update progress bar
     */
    updateProgress(progressId, percentage, message = null) {
        const progressState = this.progressBars.get(progressId);
        if (!progressState) return;

        const { progressBar } = progressState;
        const bar = progressBar.querySelector('.progress-fill');
        const messageEl = progressBar.querySelector('.progress-message');

        bar.style.width = `${percentage}%`;
        if (message && messageEl) {
            messageEl.textContent = message;
        }
    }

    /**
     * Hide progress bar
     */
    hideProgress(progressId) {
        const progressState = this.progressBars.get(progressId);
        if (!progressState) return;

        const { container, progressBar } = progressState;
        progressBar.remove();
        this.progressBars.delete(progressId);
    }

    /**
     * Create progress bar element
     */
    createProgressBar(operation) {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `
            <div class="progress-header">
                <span class="progress-operation">${operation}</span>
                <span class="progress-percentage">0%</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-message">Starting...</div>
        `;
        return progressBar;
    }

    /**
     * Show loading for async operations
     */
    async withLoading(element, type, asyncOperation, message = 'Loading...') {
        const loadingId = this.showLoading(element, type, message);
        
        try {
            const result = await asyncOperation();
            this.hideLoading(loadingId);
            return result;
        } catch (error) {
            this.hideLoading(loadingId);
            this.showError(element, error.message);
            throw error;
        }
    }

    /**
     * Show error state
     */
    showError(element, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-state';
        errorDiv.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-message">${message}</div>
            <button class="error-retry" onclick="location.reload()">Retry</button>
        `;
        element.innerHTML = '';
        element.appendChild(errorDiv);
    }

    /**
     * Fade in animation
     */
    fadeIn(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(10px)';
        
        requestAnimationFrame(() => {
            element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }

    /**
     * Generate unique loading ID
     */
    generateLoadingId() {
        return `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Initialize loading system
     */
    init() {
        this.injectStyles();
        this.setupGlobalLoading();
    }

    /**
     * Inject loading styles
     */
    injectStyles() {
        const styles = `
            /* Modern Dark Loading Overlay */
            .loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f0f23 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(10px);
            }

            .loading-spinner {
                text-align: center;
            }

            .spinner {
                width: 60px;
                height: 60px;
                border: 3px solid rgba(255, 255, 255, 0.1);
                border-top: 3px solid #64ffda;
                border-radius: 50%;
                animation: spin 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
                margin: 0 auto 10px;
                position: relative;
            }
            
            .spinner::before {
                content: '';
                position: absolute;
                top: -3px;
                left: -3px;
                right: -3px;
                bottom: -3px;
                border: 2px solid transparent;
                border-top: 2px solid #ff6b6b;
                border-radius: 50%;
                animation: spin 2s linear infinite reverse;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .loading-message {
                color: #e2e8f0;
                font-size: 14px;
                font-weight: 500;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                opacity: 0.9;
            }

            /* Skeleton Styles */
            .skeleton-content {
                animation: skeleton-loading 1.5s infinite;
            }

            .skeleton-title {
                height: 24px;
                background: #e5e7eb;
                border-radius: 4px;
                margin-bottom: 12px;
                width: 80%;
            }

            .skeleton-subtitle {
                height: 18px;
                background: #e5e7eb;
                border-radius: 4px;
                margin-bottom: 8px;
                width: 60%;
            }

            .skeleton-line {
                height: 16px;
                background: #e5e7eb;
                border-radius: 4px;
                margin-bottom: 8px;
                width: 100%;
            }

            .skeleton-line.short {
                width: 70%;
            }

            .skeleton-badge {
                height: 20px;
                background: #e5e7eb;
                border-radius: 12px;
                width: 60px;
                display: inline-block;
                margin-right: 8px;
            }

            .skeleton-image {
                height: 120px;
                background: #e5e7eb;
                border-radius: 8px;
                margin-bottom: 12px;
            }

            .skeleton-number {
                height: 32px;
                background: #e5e7eb;
                border-radius: 4px;
                margin-bottom: 8px;
                width: 60px;
            }

            .skeleton-label {
                height: 14px;
                background: #e5e7eb;
                border-radius: 4px;
                width: 80px;
            }

            @keyframes skeleton-loading {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }

            /* Progress Bar */
            .progress-bar {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .progress-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .progress-operation {
                font-weight: 600;
                color: #374151;
            }

            .progress-percentage {
                font-weight: 600;
                color: #4f46e5;
            }

            .progress-track {
                height: 8px;
                background: #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4f46e5, #7c3aed);
                border-radius: 4px;
                transition: width 0.3s ease;
            }

            .progress-message {
                font-size: 14px;
                color: #6b7280;
            }

            /* Error State */
            .error-state {
                text-align: center;
                padding: 32px;
                color: #dc2626;
            }

            .error-icon {
                font-size: 48px;
                margin-bottom: 16px;
            }

            .error-message {
                font-size: 16px;
                margin-bottom: 16px;
                color: #374151;
            }

            .error-retry {
                background: #dc2626;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
            }

            .error-retry:hover {
                background: #b91c1c;
            }

            /* Recipe List Skeleton */
            .skeleton-recipe-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
            }

            .skeleton-recipe-card {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            /* Dashboard Skeleton */
            .skeleton-dashboard {
                display: grid;
                gap: 24px;
            }

            .skeleton-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 16px;
            }

            .skeleton-stat {
                text-align: center;
                padding: 16px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
            }

            .skeleton-widgets {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }

            .skeleton-widget {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
            }

            .skeleton-widget-header {
                height: 20px;
                background: #e5e7eb;
                border-radius: 4px;
                margin-bottom: 16px;
                width: 60%;
            }

            .skeleton-widget-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    /**
     * Setup global loading indicators
     */
    setupGlobalLoading() {
        // Add global loading indicator for page transitions
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && !link.href.startsWith('javascript:') && !link.href.startsWith('#')) {
                this.showPageTransition();
            }
        });

        // Add loading for form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.classList.contains('loading-form')) {
                this.showFormLoading(form);
            }
        });
    }

    /**
     * Show page transition loading
     */
    showPageTransition() {
        const overlay = document.createElement('div');
        overlay.id = 'page-transition-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-message">Loading page...</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    /**
     * Show form loading
     */
    showFormLoading(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="spinner small"></div> Submitting...';
        }
    }
}

// Initialize loading system
const loadingSystem = new LoadingSystem();

// Make it globally available
window.loadingSystem = loadingSystem;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadingSystem.init();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingSystem;
} 