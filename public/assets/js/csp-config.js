/**
 * Content Security Policy Configuration for Iterum R&D Chef Notebook
 * Provides CSP headers and security policies
 */

class CSPConfig {
    constructor() {
        this.policies = {
            'default-src': ["'self'"],
            'script-src': [
                "'self'",
                "'unsafe-inline'", // Required for inline scripts
                'https://cdnjs.cloudflare.com',
                'https://www.gstatic.com',
                'https://www.googleapis.com',
                'https://apis.google.com',
                'https://cdn.jsdelivr.net'
            ],
            'style-src': [
                "'self'",
                "'unsafe-inline'", // Required for inline styles
                'https://fonts.googleapis.com',
                'https://cdnjs.cloudflare.com'
            ],
            'font-src': [
                "'self'",
                'https://fonts.gstatic.com',
                'https://fonts.googleapis.com',
                'data:'
            ],
            'img-src': [
                "'self'",
                'data:',
                'blob:',
                'https://firebasestorage.googleapis.com',
                'https://storage.googleapis.com'
            ],
            'connect-src': [
                "'self'",
                'https://iterum-culinary-app2.firebaseapp.com',
                'https://iterum-culinary-app2.firebasestorage.app',
                'https://firebase.googleapis.com',
                'https://identitytoolkit.googleapis.com',
                'https://securetoken.googleapis.com',
                'https://api.allorigins.win'
            ],
            'media-src': [
                "'self'",
                'data:',
                'blob:'
            ],
            'object-src': ["'none'"],
            'base-uri': ["'self'"],
            'form-action': ["'self'"],
            'frame-ancestors': ["'none'"],
            'upgrade-insecure-requests': []
        };
    }

    /**
     * Generate CSP header string
     * @returns {string} - CSP header value
     */
    generateCSP() {
        const directives = Object.entries(this.policies).map(([directive, sources]) => {
            return `${directive} ${sources.join(' ')}`;
        });
        
        return directives.join('; ');
    }

    /**
     * Apply CSP meta tag to document
     */
    applyCSPMeta() {
        const cspContent = this.generateCSP();
        
        // Remove existing CSP meta tag
        const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (existingMeta) {
            existingMeta.remove();
        }
        
        // Add new CSP meta tag
        const meta = document.createElement('meta');
        meta.setAttribute('http-equiv', 'Content-Security-Policy');
        meta.setAttribute('content', cspContent);
        document.head.appendChild(meta);
        
        console.log('🔒 CSP meta tag applied');
    }

    /**
     * Validate script sources against CSP
     * @param {string} src - Script source
     * @returns {boolean} - Whether source is allowed
     */
    isScriptSourceAllowed(src) {
        const allowedSources = this.policies['script-src'];
        
        if (src.startsWith('data:') || src.startsWith('blob:')) {
            return allowedSources.includes('data:') || allowedSources.includes('blob:');
        }
        
        if (src.startsWith('https://') || src.startsWith('http://')) {
            return allowedSources.some(allowed => {
                if (allowed === "'self'") {
                    return src.startsWith(window.location.origin);
                }
                return src.startsWith(allowed);
            });
        }
        
        return allowedSources.includes("'unsafe-inline'");
    }

    /**
     * Validate style sources against CSP
     * @param {string} src - Style source
     * @returns {boolean} - Whether source is allowed
     */
    isStyleSourceAllowed(src) {
        const allowedSources = this.policies['style-src'];
        
        if (src.startsWith('data:') || src.startsWith('blob:')) {
            return allowedSources.includes('data:') || allowedSources.includes('blob:');
        }
        
        if (src.startsWith('https://') || src.startsWith('http://')) {
            return allowedSources.some(allowed => {
                if (allowed === "'self'") {
                    return src.startsWith(window.location.origin);
                }
                return src.startsWith(allowed);
            });
        }
        
        return allowedSources.includes("'unsafe-inline'");
    }

    /**
     * Monitor and log CSP violations
     */
    setupCSPViolationReporting() {
        if ('SecurityPolicyViolationEvent' in window) {
            document.addEventListener('securitypolicyviolation', (event) => {
                console.warn('🔒 CSP Violation:', {
                    violatedDirective: event.violatedDirective,
                    blockedURI: event.blockedURI,
                    sourceFile: event.sourceFile,
                    lineNumber: event.lineNumber,
                    columnNumber: event.columnNumber
                });
                
                // Send violation to logging service if available
                if (window.errorHandler) {
                    window.errorHandler.logSecurityViolation(event);
                }
            });
        }
    }

    /**
     * Initialize CSP configuration
     */
    init() {
        // Apply CSP meta tag
        this.applyCSPMeta();
        
        // Setup violation reporting
        this.setupCSPViolationReporting();
        
        // Override script loading to validate sources
        this.overrideScriptLoading();
        
        // Override style loading to validate sources
        this.overrideStyleLoading();
        
        console.log('🔒 CSP Configuration initialized');
    }

    /**
     * Override script loading to validate sources
     */
    overrideScriptLoading() {
        const originalCreateElement = document.createElement;
        
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(this, tagName);
            
            if (tagName.toLowerCase() === 'script') {
                const originalSetAttribute = element.setAttribute;
                
                element.setAttribute = function(name, value) {
                    if (name === 'src' && !window.cspConfig.isScriptSourceAllowed(value)) {
                        console.warn('🔒 CSP: Blocked script source:', value);
                        return;
                    }
                    return originalSetAttribute.call(this, name, value);
                };
            }
            
            return element;
        };
    }

    /**
     * Override style loading to validate sources
     */
    overrideStyleLoading() {
        const originalCreateElement = document.createElement;
        
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(this, tagName);
            
            if (tagName.toLowerCase() === 'link') {
                const originalSetAttribute = element.setAttribute;
                
                element.setAttribute = function(name, value) {
                    if (name === 'href' && element.rel === 'stylesheet' && !window.cspConfig.isStyleSourceAllowed(value)) {
                        console.warn('🔒 CSP: Blocked style source:', value);
                        return;
                    }
                    return originalSetAttribute.call(this, name, value);
                };
            }
            
            return element;
        };
    }
}

// Initialize CSP configuration
window.cspConfig = new CSPConfig();

// Apply CSP when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cspConfig.init();
    });
} else {
    window.cspConfig.init();
}

console.log('🔒 CSP Config loaded');
