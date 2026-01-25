/**
 * API Configuration for Iterum R&D Chef Notebook
 * Centralized API endpoint management
 */

class APIConfig {
    constructor() {
        // Auto-detect environment
        this.isLocalhost = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname === '';
        
        // Detect HTTPS support
        this.isHTTPS = window.location.protocol === 'https:';
        
        // Set base URLs based on environment and protocol
        if (this.isLocalhost) {
            // For local development, support both HTTP and HTTPS
            this.baseURL = this.isHTTPS ? 'https://localhost:8000' : 'http://localhost:8000';
        } else {
            // For production, always use the current origin (which should be HTTPS)
            this.baseURL = window.location.origin;
        }
        
        this.apiBase = `${this.baseURL}/api`;
        
        console.log(`🌐 API Config initialized: ${this.apiBase} (${this.isHTTPS ? 'HTTPS' : 'HTTP'})`);
    }

    /**
     * Get full API URL for endpoint
     */
    getURL(endpoint) {
        // Remove leading slash if present
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        
        // If endpoint starts with 'api/', use baseURL
        if (cleanEndpoint.startsWith('api/')) {
            return `${this.baseURL}/${cleanEndpoint}`;
        }
        
        // Otherwise, prepend apiBase
        return `${this.apiBase}/${cleanEndpoint}`;
    }

    /**
     * Get auth headers for API requests
     */
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        const token = localStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    /**
     * Make authenticated API request
     */
    async request(endpoint, options = {}) {
        const url = this.getURL(endpoint);
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            console.log(`🔄 API Request: ${config.method || 'GET'} ${url}`);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                console.warn(`⚠️ API Error: ${response.status} ${response.statusText} - ${url}`);
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            console.log(`✅ API Success: ${url}`);
            return response;
        } catch (error) {
            console.error(`❌ API Failed: ${url}`, error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    /**
     * Check backend health
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            const isHealthy = response.ok;
            
            if (isHealthy) {
                console.log('✅ Backend is healthy');
            } else {
                console.warn('⚠️ Backend health check failed');
            }
            
            return isHealthy;
        } catch (error) {
            console.error('❌ Backend health check error:', error);
            return false;
        }
    }

    /**
     * Test API connectivity
     */
    async testConnection() {
        try {
            const isHealthy = await this.checkHealth();
            
            if (!isHealthy) {
                console.warn('⚠️ Backend appears to be down. Using offline mode.');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('❌ API connection test failed:', error);
            return false;
        }
    }
}

// Create global API config instance
window.apiConfig = new APIConfig();

// Test connection on load
window.apiConfig.testConnection().then(isOnline => {
    if (!isOnline) {
        console.warn('📱 Running in offline mode');
        
        // Show user notification
        if (window.showNotification) {
            window.showNotification('Running in offline mode - data will be stored locally', 'warning');
        }
    }
});

// Helper function for backward compatibility
window.getAPIURL = function(endpoint) {
    return window.apiConfig.getURL(endpoint);
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIConfig;
}