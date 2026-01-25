/**
 * Error Handler for Iterum R&D Chef Notebook
 * Catches and handles API errors and provides user-friendly messages
 */

class ErrorHandler {
    constructor() {
        this.setupGlobalErrorHandling();
        this.setupAPIFallback();
    }

    /**
     * Setup global error handling
     */
    setupGlobalErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason);
        });

        // Handle global errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error);
        });

        // Handle fetch errors specifically
        this.interceptFetch();
    }

    /**
     * Intercept fetch calls to handle API errors
     */
    interceptFetch() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                // Handle specific error cases
                if (!response.ok) {
                    this.handleAPIError(response, args[0]);
                }
                
                return response;
            } catch (error) {
                this.handleFetchError(error, args[0]);
                throw error;
            }
        };
    }

    /**
     * Handle API errors with context awareness
     */
    handleAPIError(error, context = {}) {
        const { url, status, method = 'GET', expected = false } = context;
        
        // Skip logging expected errors (like 403 during app initialization)
        if (expected) {
            console.log(`ℹ️ Expected API response: ${status} ${method} ${url}`);
            return;
        }
        
        // Skip logging common expected failures (404s for missing backend)
        if (status === 404 && url && (url.includes('/api/') || url.includes('/health'))) {
            console.log(`ℹ️ Backend API not available: ${url}`);
            return;
        }
        
        // Log unexpected errors
        console.error('🚨 API Error -', status || 'Unknown');
        console.error('📍 URL:', url);
        console.error('🕐 Time:', new Date().toISOString());
        console.error('📊 Status:', status || 'Unknown');
        
        if (error.message) {
            console.error('💬 Message:', error.message);
        }
        
        // Handle specific status codes
        switch (status) {
            case 401:
                console.log('🔐 Unauthorized - User needs to authenticate');
                break;
            case 403:
                console.log('🚫 Forbidden - User lacks permission or not authenticated');
                break;
            case 404:
                console.log('🔍 Not Found - Resource doesn\'t exist');
                break;
            case 500:
                console.log('💥 Server Error - Backend issue');
                break;
            default:
                console.log('❓ Unhandled status code:', status);
        }
    }

    /**
     * Extract endpoint name from URL for better debugging
     */
    extractEndpoint(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname;
        } catch {
            return url.replace(/^.*\/api/, '/api');
        }
    }

    /**
     * Log API errors to localStorage for debugging
     */
    logAPIError(errorInfo) {
        try {
            const errorLog = JSON.parse(localStorage.getItem('api_error_log') || '[]');
            errorLog.push(errorInfo);
            
            // Keep only last 50 errors
            if (errorLog.length > 50) {
                errorLog.splice(0, errorLog.length - 50);
            }
            
            localStorage.setItem('api_error_log', JSON.stringify(errorLog));
        } catch (e) {
            console.warn('Could not log API error to localStorage:', e);
        }
    }

    /**
     * Log security violations
     * @param {SecurityPolicyViolationEvent} event - CSP violation event
     */
    logSecurityViolation(event) {
        const violation = {
            type: 'CSP_VIOLATION',
            violatedDirective: event.violatedDirective,
            blockedURI: event.blockedURI,
            sourceFile: event.sourceFile,
            lineNumber: event.lineNumber,
            columnNumber: event.columnNumber,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        console.warn('🔒 Security Violation:', violation);
        
        // Store violation for analysis
        try {
            const violations = JSON.parse(localStorage.getItem('security_violations') || '[]');
            violations.push(violation);
            
            // Keep only last 50 violations
            if (violations.length > 50) {
                violations.splice(0, violations.length - 50);
            }
            
            localStorage.setItem('security_violations', JSON.stringify(violations));
        } catch (e) {
            console.error('Failed to log security violation:', e);
        }
    }

    /**
     * Handle fetch errors (network issues)
     */
    handleFetchError(error, url) {
        // Skip logging common expected failures (connection refused for missing backend)
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch') && 
            url && (url.includes('/api/') || url.includes('/health'))) {
            console.log(`ℹ️ Backend server not available: ${url}`);
            return;
        }
        
        console.error('Fetch Error:', error);

        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            this.showUserMessage('Unable to connect to the server. Please check your internet connection and try again.', 'error');
        } else if (error.name === 'TypeError' && error.message.includes('Cannot read properties of null')) {
            // Handle the specific error you're seeing
            console.warn('Null reference error detected, attempting recovery...');
            this.handleNullReferenceError();
        } else {
            this.showUserMessage('An unexpected error occurred. Please refresh the page and try again.', 'error');
        }
    }

    /**
     * Handle null reference errors
     */
    handleNullReferenceError() {
        // Try to recover by reinitializing components
        setTimeout(() => {
            if (window.apiConfig) {
                window.apiConfig.checkConnection();
            }
            
            // Reinitialize profile manager if needed
            if (typeof initializeLoginSystem === 'function') {
                initializeLoginSystem();
            }
        }, 1000);
    }

    /**
     * Handle general errors
     */
    handleError(error) {
        console.error('Error handled:', error);

        // Don't show user message for every error, only important ones
        if (error.message && (
            error.message.includes('API') ||
            error.message.includes('fetch') ||
            error.message.includes('network') ||
            error.message.includes('connection')
        )) {
            this.showUserMessage('A connection error occurred. Please check your internet connection.', 'error');
        }
    }

    /**
     * Show user-friendly error message
     */
    showUserMessage(message, type = 'error') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
        
        // Set styling based on type
        switch (type) {
            case 'error':
                notification.className += ' bg-red-500 text-white';
                break;
            case 'warning':
                notification.className += ' bg-yellow-500 text-white';
                break;
            case 'info':
                notification.className += ' bg-blue-500 text-white';
                break;
            case 'success':
                notification.className += ' bg-green-500 text-white';
                break;
        }

        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <span class="mr-2">${this.getIcon(type)}</span>
                    <span class="text-sm font-medium">${message}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    ✕
                </button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }

    /**
     * Get icon for notification type
     */
    getIcon(type) {
        switch (type) {
            case 'error':
                return '⚠️';
            case 'warning':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            case 'success':
                return '✅';
            default:
                return 'ℹ️';
        }
    }

    /**
     * Setup API fallback for when backend is not available
     */
    setupAPIFallback() {
        // Check if backend is available on page load
        setTimeout(() => {
            this.checkBackendStatus();
        }, 2000);
    }

    /**
     * Check backend status
     */
    async checkBackendStatus() {
        try {
            const response = await fetch('http://localhost:8000/health', {
                method: 'GET',
                timeout: 3000
            });
            
            if (!response.ok) {
                this.showUserMessage('Backend server is not responding. Some features may be limited.', 'warning');
            }
        } catch (error) {
            this.showUserMessage('Backend server is not available. Running in offline mode.', 'info');
        }
    }

    /**
     * Retry failed operations
     */
    async retryOperation(operation, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error);
                
                if (i === maxRetries - 1) {
                    throw error;
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }
}

// Initialize error handler
const errorHandler = new ErrorHandler();

// Make it globally available
window.errorHandler = errorHandler;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
} 