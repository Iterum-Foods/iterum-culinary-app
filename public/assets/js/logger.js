/**
 * Centralized Logging Utility
 * Provides consistent logging with levels and production mode support
 */

class Logger {
    constructor() {
        // Check if we're in production (you can set this via environment or config)
        this.isProduction = window.location.hostname !== 'localhost' && 
                            !window.location.hostname.includes('127.0.0.1');
        
        // Log levels: 'debug', 'info', 'warn', 'error'
        // In production, only 'warn' and 'error' are shown
        this.minLevel = this.isProduction ? 'warn' : 'debug';
        
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        // Optional: Store logs for debugging
        this.logHistory = [];
        this.maxHistorySize = 100;
    }
    
    /**
     * Check if a log level should be displayed
     */
    shouldLog(level) {
        return this.levels[level] >= this.levels[this.minLevel];
    }
    
    /**
     * Add to history
     */
    addToHistory(level, message, ...args) {
        if (this.logHistory.length >= this.maxHistorySize) {
            this.logHistory.shift();
        }
        this.logHistory.push({
            timestamp: new Date().toISOString(),
            level,
            message,
            args: args.length > 0 ? args : undefined
        });
    }
    
    /**
     * Format log message with prefix
     */
    formatMessage(level, message) {
        const prefixes = {
            debug: '🔍',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌'
        };
        
        return `${prefixes[level] || ''} ${message}`;
    }
    
    /**
     * Debug level logging (development only)
     */
    debug(message, ...args) {
        if (!this.shouldLog('debug')) return;
        this.addToHistory('debug', message, ...args);
        console.log(this.formatMessage('debug', message), ...args);
    }
    
    /**
     * Info level logging
     */
    info(message, ...args) {
        if (!this.shouldLog('info')) return;
        this.addToHistory('info', message, ...args);
        console.log(this.formatMessage('info', message), ...args);
    }
    
    /**
     * Warning level logging
     */
    warn(message, ...args) {
        if (!this.shouldLog('warn')) return;
        this.addToHistory('warn', message, ...args);
        console.warn(this.formatMessage('warn', message), ...args);
    }
    
    /**
     * Error level logging
     */
    error(message, ...args) {
        if (!this.shouldLog('error')) return;
        this.addToHistory('error', message, ...args);
        console.error(this.formatMessage('error', message), ...args);
    }
    
    /**
     * Get log history (for debugging)
     */
    getHistory(level = null) {
        if (level) {
            return this.logHistory.filter(log => log.level === level);
        }
        return this.logHistory;
    }
    
    /**
     * Clear log history
     */
    clearHistory() {
        this.logHistory = [];
    }
    
    /**
     * Export logs (for error reporting)
     */
    exportLogs() {
        return JSON.stringify(this.logHistory, null, 2);
    }
}

// Create global logger instance
window.logger = new Logger();

// Provide convenience methods
window.logDebug = (message, ...args) => window.logger.debug(message, ...args);
window.logInfo = (message, ...args) => window.logger.info(message, ...args);
window.logWarn = (message, ...args) => window.logger.warn(message, ...args);
window.logError = (message, ...args) => window.logger.error(message, ...args);

