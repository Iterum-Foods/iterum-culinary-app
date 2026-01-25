/**
 * API Security Utilities for Iterum R&D Chef Notebook
 * Provides secure API communication and data handling
 */

class APISecurity {
    constructor() {
        this.baseURL = window.location.origin;
        this.timeout = 30000; // 30 seconds
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Secure fetch wrapper with authentication and validation
     * @param {string} url - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>} - Fetch response
     */
    async secureFetch(url, options = {}) {
        // Validate URL
        if (!this.isValidURL(url)) {
            throw new Error('Invalid URL provided');
        }

        // Add security headers
        const secureOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                ...options.headers
            },
            credentials: 'same-origin',
            mode: 'cors',
            cache: 'no-cache'
        };

        // Add authentication token if available
        const authToken = this.getAuthToken();
        if (authToken) {
            secureOptions.headers['Authorization'] = `Bearer ${authToken}`;
        }

        // Add CSRF token if available
        const csrfToken = this.getCSRFToken();
        if (csrfToken) {
            secureOptions.headers['X-CSRF-Token'] = csrfToken;
        }

        // Set timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        secureOptions.signal = controller.signal;

        try {
            const response = await fetch(url, secureOptions);
            clearTimeout(timeoutId);

            // Validate response
            this.validateResponse(response);

            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    }

    /**
     * Validate URL for security
     * @param {string} url - URL to validate
     * @returns {boolean} - Whether URL is valid
     */
    isValidURL(url) {
        try {
            const urlObj = new URL(url);
            
            // Only allow http and https protocols
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return false;
            }
            
            // Block javascript: and data: URLs
            if (url.toLowerCase().startsWith('javascript:') || url.toLowerCase().startsWith('data:')) {
                return false;
            }
            
            // Check for suspicious patterns
            const suspiciousPatterns = [
                /\.\.\//, // Directory traversal
                /<script/i, // Script injection
                /javascript:/i, // JavaScript protocol
                /data:/i // Data protocol
            ];
            
            return !suspiciousPatterns.some(pattern => pattern.test(url));
        } catch {
            return false;
        }
    }

    /**
     * Validate API response
     * @param {Response} response - Fetch response
     */
    validateResponse(response) {
        // Check for suspicious headers
        const suspiciousHeaders = [
            'x-frame-options',
            'x-content-type-options',
            'x-xss-protection'
        ];

        suspiciousHeaders.forEach(header => {
            if (!response.headers.get(header)) {
                console.warn(`🔒 Missing security header: ${header}`);
            }
        });

        // Check content type
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/json') && !contentType.includes('text/')) {
            console.warn('🔒 Unexpected content type:', contentType);
        }
    }

    /**
     * Get authentication token
     * @returns {string|null} - Auth token
     */
    getAuthToken() {
        try {
            // Try to get from localStorage (encrypted)
            if (window.securityUtils) {
                const user = localStorage.getItem('current_user');
                if (user) {
                    const userData = JSON.parse(user);
                    return userData.token || null;
                }
            }
            
            // Fallback to session storage
            return sessionStorage.getItem('auth_token');
        } catch (error) {
            console.error('Failed to get auth token:', error);
            return null;
        }
    }

    /**
     * Get CSRF token
     * @returns {string|null} - CSRF token
     */
    getCSRFToken() {
        try {
            const meta = document.querySelector('meta[name="csrf-token"]');
            return meta ? meta.getAttribute('content') : null;
        } catch (error) {
            console.error('Failed to get CSRF token:', error);
            return null;
        }
    }

    /**
     * Sanitize API request data
     * @param {any} data - Data to sanitize
     * @returns {any} - Sanitized data
     */
    sanitizeRequestData(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }

        const sanitized = {};
        
        Object.entries(data).forEach(([key, value]) => {
            // Sanitize key
            const sanitizedKey = this.sanitizeString(key);
            
            // Sanitize value
            let sanitizedValue = value;
            
            if (typeof value === 'string') {
                sanitizedValue = this.sanitizeString(value);
            } else if (Array.isArray(value)) {
                sanitizedValue = value.map(item => this.sanitizeRequestData(item));
            } else if (typeof value === 'object' && value !== null) {
                sanitizedValue = this.sanitizeRequestData(value);
            }
            
            sanitized[sanitizedKey] = sanitizedValue;
        });

        return sanitized;
    }

    /**
     * Sanitize string data
     * @param {string} str - String to sanitize
     * @returns {string} - Sanitized string
     */
    sanitizeString(str) {
        if (typeof str !== 'string') {
            return str;
        }

        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/[<>'"&]/g, (match) => {
                const entities = {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;',
                    '&': '&amp;'
                };
                return entities[match];
            });
    }

    /**
     * Secure API request with retry logic
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<any>} - API response
     */
    async secureRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        let lastError;

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                // Sanitize request data
                if (options.body) {
                    options.body = JSON.stringify(this.sanitizeRequestData(JSON.parse(options.body)));
                }

                const response = await this.secureFetch(url, options);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                // Validate response data
                this.validateResponseData(data);
                
                return data;
            } catch (error) {
                lastError = error;
                console.warn(`🔒 API request attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }

        throw lastError;
    }

    /**
     * Validate API response data
     * @param {any} data - Response data
     */
    validateResponseData(data) {
        if (!data || typeof data !== 'object') {
            return;
        }

        // Check for suspicious patterns
        const dataStr = JSON.stringify(data);
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /\.\.\//
        ];

        suspiciousPatterns.forEach(pattern => {
            if (pattern.test(dataStr)) {
                console.warn('🔒 Suspicious content in API response');
            }
        });
    }

    /**
     * Delay execution
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} - Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Upload file securely
     * @param {string} endpoint - Upload endpoint
     * @param {File} file - File to upload
     * @param {Object} options - Upload options
     * @returns {Promise<any>} - Upload response
     */
    async secureFileUpload(endpoint, file, options = {}) {
        // Validate file
        if (!file || !(file instanceof File)) {
            throw new Error('Invalid file provided');
        }

        // Check file size (default 10MB limit)
        const maxSize = options.maxSize || 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error(`File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`);
        }

        // Check file type
        const allowedTypes = options.allowedTypes || [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'application/json'
        ];
        
        if (!allowedTypes.includes(file.type)) {
            throw new Error(`File type ${file.type} not allowed`);
        }

        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        
        // Add additional data
        if (options.data) {
            Object.entries(options.data).forEach(([key, value]) => {
                formData.append(key, this.sanitizeString(String(value)));
            });
        }

        // Upload file
        const response = await this.secureFetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            body: formData,
            headers: {
                // Don't set Content-Type for FormData, let browser set it
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Download file securely
     * @param {string} endpoint - Download endpoint
     * @param {Object} options - Download options
     * @returns {Promise<Blob>} - File blob
     */
    async secureFileDownload(endpoint, options = {}) {
        const response = await this.secureFetch(`${this.baseURL}${endpoint}`, {
            method: 'GET',
            ...options
        });

        if (!response.ok) {
            throw new Error(`Download failed: ${response.statusText}`);
        }

        const blob = await response.blob();
        
        // Validate blob type
        const allowedTypes = options.allowedTypes || [
            'application/pdf', 'image/jpeg', 'image/png', 'image/gif',
            'text/plain', 'application/json', 'text/csv'
        ];
        
        if (!allowedTypes.includes(blob.type)) {
            throw new Error(`Downloaded file type ${blob.type} not allowed`);
        }

        return blob;
    }

    /**
     * Intercept and secure all fetch requests
     */
    interceptFetch() {
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            // Only intercept relative URLs or same-origin URLs
            if (typeof url === 'string' && (url.startsWith('/') || url.startsWith(this.baseURL))) {
                return this.secureFetch(url, options);
            }
            
            return originalFetch(url, options);
        };
        
        console.log('🔒 API security interceptor activated');
    }
}

// Initialize API security
window.apiSecurity = new APISecurity();

// Intercept fetch requests
window.apiSecurity.interceptFetch();

console.log('🔒 API Security initialized');
