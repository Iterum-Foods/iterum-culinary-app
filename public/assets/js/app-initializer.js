/**
 * Application Initialization System
 * Manages initialization order and dependencies for all systems
 */

class AppInitializer {
    constructor() {
        this.initialized = false;
        this.initializationOrder = [];
        this.readyCallbacks = [];
        this.dependencies = {
            'firebase': () => window.firebase || window.firebaseConfig,
            'auth': () => window.authManager && window.authManager.initialized,
            'project': () => window.projectManager && window.projectManager.initialized,
            'storage': () => typeof Storage !== 'undefined'
        };
    }
    
    /**
     * Register a system for initialization
     */
    register(name, initFunction, dependencies = []) {
        this.initializationOrder.push({
            name,
            init: initFunction,
            dependencies,
            initialized: false
        });
    }
    
    /**
     * Wait for dependencies to be ready
     */
    async waitForDependencies(dependencies) {
        const waitPromises = dependencies.map(dep => {
            const check = this.dependencies[dep];
            if (!check) {
                console.warn(`⚠️ Unknown dependency: ${dep}`);
                return Promise.resolve();
            }
            
            return new Promise((resolve) => {
                const checkReady = () => {
                    if (check()) {
                        resolve();
                    } else {
                        setTimeout(checkReady, 100);
                    }
                };
                checkReady();
            });
        });
        
        await Promise.all(waitPromises);
    }
    
    /**
     * Initialize all registered systems in order
     */
    async initialize() {
        if (this.initialized) {
            console.warn('⚠️ App already initialized');
            return;
        }
        
        console.log('🚀 Starting application initialization...');
        
        for (const system of this.initializationOrder) {
            try {
                // Wait for dependencies
                if (system.dependencies.length > 0) {
                    await this.waitForDependencies(system.dependencies);
                }
                
                // Initialize system
                console.log(`⚙️ Initializing ${system.name}...`);
                await system.init();
                system.initialized = true;
                console.log(`✅ ${system.name} initialized`);
                
            } catch (error) {
                console.error(`❌ Failed to initialize ${system.name}:`, error);
                // Continue with other systems even if one fails
            }
        }
        
        this.initialized = true;
        console.log('✅ Application initialization complete');
        
        // Trigger ready event
        this.triggerReady();
    }
    
    /**
     * Check if a system is initialized
     */
    isSystemReady(name) {
        const system = this.initializationOrder.find(s => s.name === name);
        return system ? system.initialized : false;
    }
    
    /**
     * Register callback for when app is ready
     */
    onReady(callback) {
        if (this.initialized) {
            callback();
        } else {
            this.readyCallbacks.push(callback);
        }
    }
    
    /**
     * Trigger ready callbacks
     */
    triggerReady() {
        const event = new CustomEvent('iterumAppReady', {
            detail: { initialized: true }
        });
        document.dispatchEvent(event);
        
        this.readyCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error in ready callback:', error);
            }
        });
        
        this.readyCallbacks = [];
    }
    
    /**
     * Get initialization status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            systems: this.initializationOrder.map(s => ({
                name: s.name,
                initialized: s.initialized,
                dependencies: s.dependencies
            }))
        };
    }
}

// Create global initializer
window.appInitializer = new AppInitializer();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.appInitializer.initialize();
    });
} else {
    // DOM already ready
    window.appInitializer.initialize();
}

