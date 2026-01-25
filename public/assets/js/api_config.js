/**
 * API Configuration for Iterum R&D Chef Notebook
 * Handles API connection, fallbacks, and error handling
 */

class APIConfig {
    constructor() {
        this.baseURL = 'http://localhost:8000/api';
        this.timeout = 10000; // 10 seconds
        this.retryAttempts = 3;
        this.isOnline = false;
        this.init();
    }

    /**
     * Initialize API configuration
     */
    async init() {
        await this.checkConnection();
        this.setupOfflineHandling();
    }

    /**
     * Check if backend is available
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api', '')}/health`, {
                method: 'GET',
                timeout: 5000
            });
            this.isOnline = response.ok;
            console.log(`🌐 Backend connection: ${this.isOnline ? 'Online' : 'Offline'}`);
        } catch (error) {
            this.isOnline = false;
            console.warn('⚠️ Backend not available, using offline mode');
        }
    }

    /**
     * Make API request with error handling and fallbacks
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: this.timeout,
            ...options
        };

        // If offline, use localStorage fallback
        if (!this.isOnline) {
            return this.handleOfflineRequest(endpoint, config);
        }

        try {
            const response = await fetch(url, config);
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            
            // Fallback to offline mode
            return this.handleOfflineRequest(endpoint, config);
        }
    }

    /**
     * Handle requests when backend is offline
     */
    handleOfflineRequest(endpoint, config) {
        console.log(`📱 Using offline mode for: ${endpoint}`);
        
        switch (endpoint) {
            case '/profiles/':
                return this.getOfflineProfiles();
            case '/profiles/login':
                return this.handleOfflineLogin(config.body);
            case '/profiles/offline':
                return this.createOfflineProfile();
            default:
                if (endpoint.startsWith('/profiles/') && endpoint !== '/profiles/') {
                    const profileId = endpoint.split('/').pop();
                    return this.getOfflineProfile(profileId);
                }
                throw new Error('Offline mode not supported for this endpoint');
        }
    }

    /**
     * Get profiles from localStorage
     */
    getOfflineProfiles() {
        const profiles = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('profile_')) {
                try {
                    const profile = JSON.parse(localStorage.getItem(key));
                    profiles.push(profile);
                } catch (error) {
                    console.error('Error parsing profile:', error);
                }
            }
        }
        return profiles;
    }

    /**
     * Handle offline login
     */
    async handleOfflineLogin(body) {
        if (!body) {
            throw new Error('Login data required');
        }

        const loginData = typeof body === 'string' ? JSON.parse(body) : body;
        const profileId = `offline_${Date.now()}`;
        
        const profile = {
            id: profileId,
            name: loginData.name || loginData.email.split('@')[0],
            email: loginData.email,
            role: 'Chef',
            restaurant: 'My Kitchen',
            avatar: null,
            isGoogleUser: false,
            recipes: [],
            ingredients: [],
            equipment: [],
            lastUpdated: new Date().toISOString()
        };

        // Save to localStorage
        localStorage.setItem(`profile_${profileId}`, JSON.stringify(profile));
        
        return {
            user: profile,
            token: `offline_token_${profileId}`
        };
    }

    /**
     * Create offline profile
     */
    createOfflineProfile() {
        const profileId = `offline_${Date.now()}`;
        
        const profile = {
            id: profileId,
            name: 'Local User',
            email: 'local@offline.com',
            role: 'Chef',
            restaurant: 'My Kitchen',
            avatar: null,
            isGoogleUser: false,
            recipes: [],
            ingredients: [],
            equipment: [],
            lastUpdated: new Date().toISOformat()
        };

        // Save to localStorage
        localStorage.setItem(`profile_${profileId}`, JSON.stringify(profile));
        
        return {
            user: profile,
            token: `offline_token_${profileId}`
        };
    }

    /**
     * Get specific profile from localStorage
     */
    getOfflineProfile(profileId) {
        const profileKey = `profile_${profileId}`;
        const profile = localStorage.getItem(profileKey);
        
        if (!profile) {
            throw new Error('Profile not found');
        }
        
        return JSON.parse(profile);
    }

    /**
     * Setup offline handling
     */
    setupOfflineHandling() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('🌐 Back online, checking connection...');
            this.checkConnection();
        });

        window.addEventListener('offline', () => {
            console.log('📱 Going offline');
            this.isOnline = false;
        });

        // Periodic connection check
        setInterval(() => {
            if (navigator.onLine) {
                this.checkConnection();
            }
        }, 30000); // Check every 30 seconds
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
}

// Initialize API configuration
const apiConfig = new APIConfig();

// Make it globally available
window.apiConfig = apiConfig;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIConfig;
} 