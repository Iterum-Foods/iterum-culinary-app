/**
 * Auth API Helper
 * Provides authenticated fetch wrapper for backend API calls
 * Automatically includes Firebase token in requests
 */

(function() {
    'use strict';
    
    console.log('🔌 Auth API Helper loading...');
    
    // Wait for AuthManager to be ready
    function waitForAuthManager() {
        return new Promise((resolve) => {
            if (window.authManager) {
                resolve(window.authManager);
                return;
            }
            
            const checkInterval = setInterval(() => {
                if (window.authManager) {
                    clearInterval(checkInterval);
                    resolve(window.authManager);
                }
            }, 100);
        });
    }
    
    /**
     * Authenticated fetch wrapper
     * Automatically includes Firebase token and handles auth errors
     */
    async function authFetch(url, options = {}) {
        const authManager = await waitForAuthManager();
        
        // Get auth headers
        const authHeaders = authManager.getAuthHeaders();
        
        // Merge headers
        const headers = {
            ...authHeaders,
            ...(options.headers || {})
        };
        
        // Make request
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        // Handle auth errors
        if (response.status === 401) {
            console.error('❌ Authentication failed - token may be expired');
            // Optionally redirect to login
            // window.location.href = 'launch.html';
        }
        
        return response;
    }
    
    /**
     * GET request with auth
     */
    async function authGet(url) {
        const response = await authFetch(url, { method: 'GET' });
        return response.json();
    }
    
    /**
     * POST request with auth
     */
    async function authPost(url, data) {
        const response = await authFetch(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response.json();
    }
    
    /**
     * PUT request with auth
     */
    async function authPut(url, data) {
        const response = await authFetch(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response.json();
    }
    
    /**
     * DELETE request with auth
     */
    async function authDelete(url) {
        const response = await authFetch(url, { method: 'DELETE' });
        return response.json();
    }
    
    /**
     * Get API base URL
     */
    function getApiBaseUrl() {
        return window.location.hostname === 'localhost' 
            ? 'http://localhost:8000' 
            : 'https://your-backend-url.com'; // Update with your production URL
    }
    
    // Export to window
    window.authApi = {
        fetch: authFetch,
        get: authGet,
        post: authPost,
        put: authPut,
        delete: authDelete,
        getBaseUrl: getApiBaseUrl
    };
    
    console.log('✅ Auth API Helper loaded');
    console.log('   Usage: window.authApi.get("/api/recipes")');
    console.log('   Usage: window.authApi.post("/api/recipes", data)');
    
})();

