/**
 * Security Utilities for Iterum R&D Chef Notebook
 * Provides safe HTML injection, input sanitization, and data encryption
 */

class SecurityUtils {
    constructor() {
        this.allowedTags = [
            'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'strong', 'em', 'b', 'i', 'u', 'br', 'hr',
            'ul', 'ol', 'li', 'a', 'img', 'button', 'input',
            'form', 'label', 'select', 'option', 'textarea',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'section', 'article', 'header', 'footer', 'nav',
            'main', 'aside', 'figure', 'figcaption'
        ];
        
        this.allowedAttributes = [
            'class', 'id', 'style', 'title', 'alt', 'src', 'href',
            'type', 'value', 'placeholder', 'disabled', 'readonly',
            'checked', 'selected', 'role', 'aria-label', 'aria-labelledby',
            'aria-describedby', 'tabindex', 'data-*'
        ];
        
        this.encryptionKey = this.generateEncryptionKey();
    }

    /**
     * Safely set innerHTML with XSS protection
     * @param {Element} element - DOM element to update
     * @param {string} html - HTML content to set
     * @param {Object} options - Options for sanitization
     */
    safeInnerHTML(element, html, options = {}) {
        if (!element || typeof html !== 'string') {
            console.warn('SecurityUtils: Invalid element or HTML content');
            return;
        }

        try {
            const sanitizedHTML = this.sanitizeHTML(html, options);
            element.innerHTML = sanitizedHTML;
        } catch (error) {
            console.error('SecurityUtils: Error setting safe innerHTML:', error);
            // Fallback to text content
            element.textContent = this.stripHTML(html);
        }
    }

    /**
     * Sanitize HTML content to prevent XSS attacks
     * @param {string} html - HTML content to sanitize
     * @param {Object} options - Sanitization options
     * @returns {string} - Sanitized HTML
     */
    sanitizeHTML(html, options = {}) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        const {
            allowedTags = this.allowedTags,
            allowedAttributes = this.allowedAttributes,
            stripScripts = true,
            stripStyles = false
        } = options;

        // Remove script tags and event handlers
        if (stripScripts) {
            html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            html = html.replace(/javascript:/gi, '');
            html = html.replace(/on\w+\s*=/gi, '');
        }

        // Remove style tags if requested
        if (stripStyles) {
            html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
            html = html.replace(/style\s*=/gi, '');
        }

        // Create a temporary DOM element to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Sanitize the DOM tree
        this.sanitizeElement(temp, allowedTags, allowedAttributes);

        return temp.innerHTML;
    }

    /**
     * Recursively sanitize DOM elements
     * @param {Element} element - Element to sanitize
     * @param {Array} allowedTags - Allowed tag names
     * @param {Array} allowedAttributes - Allowed attribute names
     */
    sanitizeElement(element, allowedTags, allowedAttributes) {
        if (element.nodeType === Node.ELEMENT_NODE) {
            const tagName = element.tagName.toLowerCase();
            
            // Remove disallowed tags
            if (!allowedTags.includes(tagName)) {
                const parent = element.parentNode;
                if (parent) {
                    // Move children to parent and remove this element
                    while (element.firstChild) {
                        parent.insertBefore(element.firstChild, element);
                    }
                    parent.removeChild(element);
                    return;
                }
            }

            // Sanitize attributes
            const attributes = Array.from(element.attributes);
            attributes.forEach(attr => {
                const attrName = attr.name.toLowerCase();
                
                // Check if attribute is allowed
                if (!this.isAttributeAllowed(attrName, allowedAttributes)) {
                    element.removeAttribute(attr.name);
                    return;
                }

                // Sanitize specific attributes
                if (attrName === 'href' || attrName === 'src') {
                    const value = attr.value.toLowerCase();
                    if (value.startsWith('javascript:') || value.startsWith('data:')) {
                        element.removeAttribute(attr.name);
                    }
                }
            });
        }

        // Recursively sanitize children
        const children = Array.from(element.childNodes);
        children.forEach(child => this.sanitizeElement(child, allowedTags, allowedAttributes));
    }

    /**
     * Check if an attribute is allowed
     * @param {string} attrName - Attribute name
     * @param {Array} allowedAttributes - Allowed attributes
     * @returns {boolean}
     */
    isAttributeAllowed(attrName, allowedAttributes) {
        return allowedAttributes.some(allowed => {
            if (allowed.endsWith('*')) {
                return attrName.startsWith(allowed.slice(0, -1));
            }
            return attrName === allowed;
        });
    }

    /**
     * Strip HTML tags from content
     * @param {string} html - HTML content
     * @returns {string} - Plain text
     */
    stripHTML(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }
        
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }

    /**
     * Sanitize user input
     * @param {string} input - User input
     * @param {Object} options - Sanitization options
     * @returns {string} - Sanitized input
     */
    sanitizeInput(input, options = {}) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        const {
            maxLength = 1000,
            allowHTML = false,
            trim = true
        } = options;

        let sanitized = input;

        // Trim whitespace
        if (trim) {
            sanitized = sanitized.trim();
        }

        // Limit length
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        // Remove or sanitize HTML
        if (!allowHTML) {
            sanitized = this.stripHTML(sanitized);
        } else {
            sanitized = this.sanitizeHTML(sanitized);
        }

        // Remove potentially dangerous characters
        sanitized = sanitized.replace(/[<>'"&]/g, (match) => {
            const entities = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '&': '&amp;'
            };
            return entities[match];
        });

        return sanitized;
    }

    /**
     * Generate encryption key for local storage
     * @returns {string} - Base64 encoded key
     */
    generateEncryptionKey() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode.apply(null, array));
    }

    /**
     * Encrypt sensitive data
     * @param {string} data - Data to encrypt
     * @returns {string} - Encrypted data
     */
    async encryptData(data) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);
            
            const key = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(this.encryptionKey),
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );

            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                dataBuffer
            );

            const result = new Uint8Array(iv.length + encrypted.byteLength);
            result.set(iv);
            result.set(new Uint8Array(encrypted), iv.length);

            return btoa(String.fromCharCode.apply(null, result));
        } catch (error) {
            console.error('SecurityUtils: Encryption failed:', error);
            return data; // Return original data if encryption fails
        }
    }

    /**
     * Decrypt sensitive data
     * @param {string} encryptedData - Encrypted data
     * @returns {string} - Decrypted data
     */
    async decryptData(encryptedData) {
        try {
            const data = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
            
            const key = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(this.encryptionKey),
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );

            const iv = data.slice(0, 12);
            const encrypted = data.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encrypted
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('SecurityUtils: Decryption failed:', error);
            return encryptedData; // Return original data if decryption fails
        }
    }

    /**
     * Safe localStorage operations
     */
    safeLocalStorage = {
        /**
         * Set item with encryption
         * @param {string} key - Storage key
         * @param {any} value - Value to store
         * @param {boolean} encrypt - Whether to encrypt the value
         */
        async setItem(key, value, encrypt = false) {
            try {
                let data = JSON.stringify(value);
                
                if (encrypt) {
                    data = await window.securityUtils.encryptData(data);
                }
                
                localStorage.setItem(key, data);
            } catch (error) {
                console.error('SecurityUtils: Failed to set localStorage item:', error);
            }
        },

        /**
         * Get item with decryption
         * @param {string} key - Storage key
         * @param {boolean} decrypt - Whether to decrypt the value
         * @returns {any} - Retrieved value
         */
        async getItem(key, decrypt = false) {
            try {
                const data = localStorage.getItem(key);
                
                if (!data) {
                    return null;
                }
                
                let parsedData = data;
                
                if (decrypt) {
                    parsedData = await window.securityUtils.decryptData(data);
                }
                
                return JSON.parse(parsedData);
            } catch (error) {
                console.error('SecurityUtils: Failed to get localStorage item:', error);
                return null;
            }
        },

        /**
         * Remove item
         * @param {string} key - Storage key
         */
        removeItem(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error('SecurityUtils: Failed to remove localStorage item:', error);
            }
        }
    };

    /**
     * Validate URL for security
     * @param {string} url - URL to validate
     * @returns {boolean} - Whether URL is safe
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
            
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - Whether email is valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Generate secure random string
     * @param {number} length - Length of string
     * @returns {string} - Random string
     */
    generateSecureRandomString(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}

// Initialize security utils
window.securityUtils = new SecurityUtils();

// Override innerHTML for safer usage
const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
Object.defineProperty(Element.prototype, 'innerHTML', {
    set: function(value) {
        // Check if this is a trusted operation
        if (this.dataset.trusted === 'true') {
            originalInnerHTML.set.call(this, value);
        } else {
            // Use safe innerHTML
            window.securityUtils.safeInnerHTML(this, value);
        }
    },
    get: originalInnerHTML.get
});

console.log('🔒 Security Utils initialized');
