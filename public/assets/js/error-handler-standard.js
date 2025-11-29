/**
 * Standardized Error Handler
 * Provides consistent error handling across the application
 */

class StandardErrorHandler {
    constructor() {
        this.errorCallbacks = [];
        this.recoveryStrategies = new Map();
    }
    
    /**
     * Register error callback
     */
    onError(callback) {
        this.errorCallbacks.push(callback);
    }
    
    /**
     * Register recovery strategy for error type
     */
    registerRecovery(errorType, strategy) {
        this.recoveryStrategies.set(errorType, strategy);
    }
    
    /**
     * Handle error with standardized processing
     */
    handle(error, context = {}) {
        // Log error
        if (window.logger) {
            window.logger.error(`Error in ${context.module || 'unknown'}:`, error);
        } else {
            console.error('❌ Error:', error);
        }
        
        // Create error object
        const errorInfo = {
            message: error.message || 'Unknown error',
            stack: error.stack,
            type: error.name || 'Error',
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Try recovery strategy
        const recovery = this.recoveryStrategies.get(errorInfo.type);
        if (recovery) {
            try {
                recovery(errorInfo);
                return { handled: true, recovered: true };
            } catch (recoveryError) {
                if (window.logger) {
                    window.logger.error('Recovery strategy failed:', recoveryError);
                }
            }
        }
        
        // Notify callbacks
        this.errorCallbacks.forEach(callback => {
            try {
                callback(errorInfo);
            } catch (callbackError) {
                console.error('Error in error callback:', callbackError);
            }
        });
        
        // Show user-friendly message
        this.showUserMessage(errorInfo);
        
        return { handled: true, recovered: false };
    }
    
    /**
     * Show user-friendly error message
     */
    showUserMessage(errorInfo) {
        // Try to use toast notifications if available
        if (window.toastNotifications) {
            window.toastNotifications.error(
                this.getUserFriendlyMessage(errorInfo),
                { duration: 5000 }
            );
        } else {
            // Fallback to alert
            alert(`An error occurred: ${this.getUserFriendlyMessage(errorInfo)}`);
        }
    }
    
    /**
     * Get user-friendly error message
     */
    getUserFriendlyMessage(errorInfo) {
        const messages = {
            'NetworkError': 'Unable to connect to the server. Please check your internet connection.',
            'FirebaseError': 'Unable to save data to cloud. Your data is saved locally.',
            'QuotaExceededError': 'Storage is full. Please clear some data or contact support.',
            'TypeError': 'An unexpected error occurred. Please try again.',
            'ReferenceError': 'An application error occurred. Please refresh the page.',
            'SyntaxError': 'A data format error occurred. Please contact support.'
        };
        
        return messages[errorInfo.type] || 
               `An error occurred: ${errorInfo.message}`;
    }
    
    /**
     * Wrap async function with error handling
     */
    wrapAsync(fn, context = {}) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.handle(error, context);
                throw error; // Re-throw for caller to handle if needed
            }
        };
    }
    
    /**
     * Wrap sync function with error handling
     */
    wrapSync(fn, context = {}) {
        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                this.handle(error, context);
                throw error;
            }
        };
    }
}

// Create global error handler
window.errorHandler = new StandardErrorHandler();

// Register default recovery strategies
window.errorHandler.registerRecovery('NetworkError', (errorInfo) => {
    // Retry after delay
    setTimeout(() => {
        if (window.logger) {
            window.logger.info('Retrying after network error...');
        }
    }, 3000);
});

window.errorHandler.registerRecovery('QuotaExceededError', (errorInfo) => {
    // Clear old data
    if (window.logger) {
        window.logger.warn('Storage quota exceeded, clearing old data...');
    }
    // Could implement cleanup logic here
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StandardErrorHandler;
}

