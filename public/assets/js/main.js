/**
 * Main Application JavaScript
 * Core functionality for Iterum Chef Notebook
 */

// Core app configuration
const APP_CONFIG = {
  brand: {
    name: 'Iterum R&D',
    tagline: 'Chef Notebook',
    version: '1.0.0'
  },
  features: {
    ocr: true,
    menuParsing: true,
    userManagement: true,
    projectManagement: true
  },
  storage: {
    prefix: 'iterum_',
    version: '1.0'
  }
};

// Authentication is now handled by unified_auth_system.js
// This file focuses on main application functionality

// Global error tracking
window.IterumErrorTracker = {
  capture(error, context = {}) {
    console.error('🚨 Iterum Error:', error, context);
    
    // Add timestamp and user context
    const errorData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      user: window.unifiedAuthSystem?.currentUser?.name || 'Unknown',
      ...context
    };
    
    // Store error in user-specific file storage or localStorage for debugging
    let errors = [];
    
    // Try to load from user-specific file storage first
    if (window.userDataManager && window.userDataManager.isUserLoggedIn()) {
        const userId = window.userDataManager.getCurrentUserId();
        const filename = `user_${userId}_errors.json`;
        errors = window.userDataManager.loadUserFile(filename) || [];
        errors.push(errorData);
        if (errors.length > 100) errors.shift(); // Keep only last 100 errors
        window.userDataManager.saveUserFile(filename, errors);
        console.log(`💾 Error saved to user file: ${errors.length} errors`);
    } else {
        // Fallback to localStorage
        errors = JSON.parse(localStorage.getItem('iterum_errors') || '[]');
        errors.push(errorData);
        if (errors.length > 100) errors.shift(); // Keep only last 100 errors
        localStorage.setItem('iterum_errors', JSON.stringify(errors));
        console.log(`💾 Error saved to localStorage`);
    }
    
    // Could send to monitoring service here
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorData });
    // }
  }
};

// Global error handler
window.addEventListener('error', (event) => {
  window.IterumErrorTracker.capture(event.error, {
    type: 'runtime_error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  window.IterumErrorTracker.capture(event.reason, {
    type: 'unhandled_promise_rejection'
  });
});

// App initialization
class IterumApp {
  constructor() {
    this.config = APP_CONFIG;
    this.initialized = false;
    this.modules = new Map();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('🚀 Initializing Iterum Chef Notebook...');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }
      
      // Check authentication before proceeding
      if (!this.checkAuthentication()) {
        console.log('🔒 Authentication required - stopping initialization');
        return;
      }
      
      // Protect app content until authentication is complete
      this.protectAppContent();
      
      // Initialize core systems
      await this.initializeCoreSystems();
      
      // Initialize user system
      await this.initializeUserSystem();
      
      // Initialize project manager
      await this.initializeProjectManager();
      
      // Setup global event listeners
      this.setupGlobalListeners();
      
      this.initialized = true;
      console.log('✅ Iterum Chef Notebook initialized successfully');
      
      // Dispatch app ready event
      window.dispatchEvent(new CustomEvent('iterumAppReady', {
        detail: { app: this }
      }));
      
    } catch (error) {
      console.error('❌ Failed to initialize Iterum app:', error);
      window.IterumErrorTracker.capture(error, { context: 'app_initialization' });
    }
  }

  /**
   * Protect main app content from unauthorized access
   */
  protectMainAppContent() {
    // Hide main app content until authentication is complete
    const mainContent = document.querySelector('main, .main-content, #main-content, .app-content');
    if (mainContent) {
      mainContent.style.display = 'none';
      
      // Show content only after user data is loaded
      window.addEventListener('iterumUserDataLoaded', () => {
        mainContent.style.display = '';
        console.log('✅ Main app content revealed after authentication');
      }, { once: true });
    }
    
    // Add authentication check to critical UI elements
    this.addAuthenticationChecks();
  }

  /**
   * Add authentication checks to critical UI elements
   */
  addAuthenticationChecks() {
    // Protect recipe creation buttons
    const recipeButtons = document.querySelectorAll('[onclick*="createRecipe"], [onclick*="addRecipe"]');
    recipeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        if (!window.unifiedAuthSystem || !window.unifiedAuthSystem.isAuthenticated()) {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔒 Recipe creation blocked - authentication required');
          window.unifiedAuthSystem?.showAuthentication();
          return false;
        }
      });
    });
    
    // Protect menu creation buttons
    const menuButtons = document.querySelectorAll('[onclick*="createMenu"], [onclick*="addMenu"]');
    menuButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        if (!window.unifiedAuthSystem || !window.unifiedAuthSystem.isAuthenticated()) {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔒 Menu creation blocked - authentication required');
          window.unifiedAuthSystem?.showAuthentication();
          return false;
        }
      });
    });
    
    console.log('✅ Authentication checks added to critical UI elements');
  }

  /**
   * Check authentication status
   */
  checkAuthentication() {
      try {
          console.log('🔐 Checking authentication status...');
          
          // Check if there's a current user
          const currentUser = localStorage.getItem('current_user');
          const sessionActive = localStorage.getItem('session_active');
          
          if (currentUser && sessionActive === 'true') {
              try {
                  const user = JSON.parse(currentUser);
                  console.log('✅ User authenticated:', user.name);
                  
                  // User is authenticated, allow app to continue
                  this.restoreAppContent();
                  return true;
              } catch (error) {
                  console.error('❌ Error parsing user data:', error);
                  // Invalid user data, force re-authentication
                  this.forceUserSelection();
                  return false;
              }
          } else {
              console.log('⚠️ No authenticated user found');
              // No user authenticated, show authentication popup
              this.forceUserSelection();
              return false;
          }
      } catch (error) {
          console.error('❌ Error checking authentication:', error);
          this.forceUserSelection();
          return false;
      }
  }
  
  /**
   * Force user selection (shows authentication popup)
   */
  forceUserSelection() {
      console.log('🔐 Forcing user selection...');
      
      // Hide main app content
      this.protectAppContent();
      
      // Show authentication popup via unified auth system
      if (window.unifiedAuth) {
          // Small delay to ensure DOM is ready
          setTimeout(() => {
              window.unifiedAuth.showAuthFlow();
          }, 100);
      } else {
          console.warn('⚠️ Unified auth system not available');
          // Fallback: show a simple message
          this.showFallbackAuthMessage();
      }
  }
  
  /**
   * Show fallback authentication message
   */
  showFallbackAuthMessage() {
      const mainContent = document.querySelector('main');
      if (mainContent) {
          mainContent.innerHTML = `
              <div class="flex items-center justify-center min-h-screen">
                  <div class="text-center">
                      <h1 class="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
                      <p class="text-gray-600 mb-4">Please refresh the page to sign in.</p>
                      <button onclick="location.reload()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                          Refresh Page
                      </button>
                  </div>
              </div>
          `;
      }
  }

  /**
   * Protect app content until authentication is complete
   */
  protectAppContent() {
    console.log('🛡️ Protecting app content until authentication...');
    
    // Hide main content until authenticated
    const mainContent = document.querySelector('main, .main-content, .content');
    if (mainContent) {
      mainContent.style.opacity = '0.3';
      mainContent.style.pointerEvents = 'none';
    }
    
    // Show authentication overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
      loadingOverlay.style.opacity = '1';
    }
    
    // Listen for user data loaded event to restore content
    window.addEventListener('iterumUserDataLoaded', () => {
      console.log('✅ User data loaded - restoring app content...');
      this.restoreAppContent();
    }, { once: true });
  }

  /**
   * Restore app content after authentication
   */
  restoreAppContent() {
    console.log('🔄 Restoring app content...');
    
    // Restore main content
    const mainContent = document.querySelector('main, .main-content, .content');
    if (mainContent) {
      mainContent.style.opacity = '1';
      mainContent.style.pointerEvents = 'auto';
    }
    
    // Hide authentication overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.opacity = '0';
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
      }, 500);
    }
    
    console.log('✅ App content restored');
  }

  /**
   * Initialize core application systems
   */
  async initializeCoreSystems() {
    console.log('🔧 Initializing core systems...');
    
    // Check for required dependencies
    this.checkDependencies();
    
    // Initialize error handling
    this.initializeErrorHandling();
    
    // Initialize performance monitoring
    this.initializePerformanceMonitoring();
  }

  /**
   * Check for required dependencies
   */
  checkDependencies() {
    const required = [
      'userSystem',
      'projectManager',
      'startupLoadingManager'
    ];
    
    const missing = required.filter(dep => !window[dep]);
    if (missing.length > 0) {
      console.warn('⚠️ Missing dependencies:', missing);
    }
  }

  /**
   * Initialize error handling
   */
  initializeErrorHandling() {
    // Global error handler is already set up above
    console.log('✅ Error handling initialized');
  }

  /**
   * Initialize performance monitoring
   */
  initializePerformanceMonitoring() {
    // Monitor page load performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          console.log('📊 Page Load Performance:', {
            totalTime: perfData.loadEventEnd - perfData.loadEventStart,
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
          });
        }
      });
    }
    
    console.log('✅ Performance monitoring initialized');
  }

  /**
   * Initialize user system
   */
  async initializeUserSystem() {
    if (!window.userSystem) {
      console.warn('⚠️ User system not available');
      return;
    }
    
    console.log('👤 Initializing user system...');
    
    // Wait for user system to be ready
    let attempts = 0;
    while (!window.userSystem.currentUser && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (window.userSystem.currentUser) {
      console.log('✅ User system initialized:', window.userSystem.currentUser.name);
    } else {
      console.warn('⚠️ User system initialization timeout');
      // Force user selection if no user is selected
      this.forceUserSelection();
    }
  }

  /**
   * Force user selection if no user is currently selected
   */
  forceUserSelection() {
    console.log('🔒 No user selected - forcing user selection...');
    
    // Check if unified auth system is available
    if (window.unifiedAuth && window.unifiedAuth.forceUserSelection) {
      window.unifiedAuth.forceUserSelection();
    } else {
      // Fallback: redirect to login or show error
      console.error('❌ Cannot force user selection - auth system not available');
      this.showAuthenticationRequired();
    }
  }

  /**
   * Show authentication required message
   */
  showAuthenticationRequired() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
      loadingOverlay.style.opacity = '1';
      loadingOverlay.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          <div class="bg-gradient-to-r from-red-600 to-pink-600 p-6 text-white text-center">
            <div class="text-3xl mb-2">🔒</div>
            <h2 class="text-2xl font-bold">Authentication Required</h2>
            <p class="text-red-100">You must select or create a user profile to continue</p>
          </div>
          <div class="p-6 text-center">
            <p class="text-gray-600 mb-4">The application requires user authentication to function properly.</p>
            <button onclick="location.reload()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg">
              🔄 Reload Page
            </button>
          </div>
        </div>
      `;
    }
  }

  /**
   * Initialize project manager
   */
  async initializeProjectManager() {
    if (!window.projectManager) {
      console.warn('⚠️ Project manager not available');
      return;
    }
    
    console.log('📁 Initializing project manager...');
    
    // Wait for project manager to be ready
    let attempts = 0;
    while (!window.projectManager.projects && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (window.projectManager.projects) {
      console.log('✅ Project manager initialized:', window.projectManager.projects.length, 'projects');
    } else {
      console.warn('⚠️ Project manager initialization timeout');
    }
  }

  /**
   * Setup global event listeners
   */
  setupGlobalListeners() {
    // Listen for user changes
    window.addEventListener('userChanged', (event) => {
      console.log('🔄 User changed:', event.detail.user.name);
      this.handleUserChange(event.detail.user);
    });
    
    // Listen for project changes
    window.addEventListener('projectChanged', (event) => {
      console.log('📁 Project changed:', event.detail.project.name);
      this.handleProjectChange(event.detail.project);
    });
    
    // Listen for app errors
    window.addEventListener('iterumError', (event) => {
      window.IterumErrorTracker.capture(event.detail.error, event.detail.context);
    });

    // Listen for user logout to force re-authentication
    window.addEventListener('userLoggedOut', (event) => {
      console.log('🔒 User logged out - forcing re-authentication...');
      this.forceUserSelection();
    });

    // Listen for user switch to ensure data is loaded
    window.addEventListener('userSwitched', (event) => {
      console.log('🔄 User switched - ensuring data is loaded...');
      this.ensureUserDataLoaded(event.detail);
    });

    // Listen for page visibility changes to check authentication
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkAuthenticationOnReturn();
      }
    });

    // Listen for focus events to check authentication
    window.addEventListener('focus', () => {
      this.checkAuthenticationOnReturn();
    });
    
    console.log('✅ Global event listeners setup complete');
  }

  /**
   * Check authentication when user returns to the app
   */
  checkAuthenticationOnReturn() {
    if (!window.unifiedAuthSystem || !window.unifiedAuthSystem.isAuthenticated()) {
      console.log('🔒 Authentication lost - forcing user selection...');
      window.unifiedAuthSystem?.showAuthentication();
    }
  }

  /**
   * Ensure user data is loaded after user switch
   */
  ensureUserDataLoaded(user) {
    console.log('📥 Ensuring data is loaded for user:', user.name);
    
    // Check if userDataManager is available and refresh data
    if (window.userDataManager && window.userDataManager.refreshUserData) {
      window.userDataManager.refreshUserData();
    }
    
    // Check if project manager needs to refresh
    if (window.projectManager && window.projectManager.loadProjects) {
      window.projectManager.loadProjects();
    }
    
    // Dispatch event that data loading is complete
    window.dispatchEvent(new CustomEvent('iterumUserDataLoaded', {
      detail: { user, timestamp: new Date().toISOString() }
    }));
  }

  /**
   * Handle user changes
   */
  handleUserChange(user) {
    // Update page title with user name
    document.title = `${APP_CONFIG.brand.name} - ${user.name}`;
    
    // Update any user-specific UI elements
    this.updateUserUI(user);
    
    // Notify other systems
    window.dispatchEvent(new CustomEvent('iterumUserChanged', {
      detail: { user, timestamp: new Date().toISOString() }
    }));
  }

  /**
   * Handle project changes
   */
  handleProjectChange(project) {
    // Update page title with project name
    const currentTitle = document.title.split(' - ')[0];
    document.title = `${currentTitle} - ${project.name}`;
    
    // Update any project-specific UI elements
    this.updateProjectUI(project);
    
    // Notify other systems
    window.dispatchEvent(new CustomEvent('iterumProjectChanged', {
      detail: { project, timestamp: new Date().toISOString() }
    }));
  }

  /**
   * Update user-specific UI elements
   */
  updateUserUI(user) {
    // Update any elements with data-user attribute
    document.querySelectorAll('[data-user]').forEach(element => {
      const attr = element.dataset.user;
      if (attr === 'name') {
        element.textContent = user.name;
      } else if (attr === 'role') {
        element.textContent = user.role;
      } else if (attr === 'avatar') {
        element.textContent = user.avatar;
      }
    });
  }

  /**
   * Update project-specific UI elements
   */
  updateProjectUI(project) {
    // Update any elements with data-project attribute
    document.querySelectorAll('[data-project]').forEach(element => {
      const attr = element.dataset.project;
      if (attr === 'name') {
        element.textContent = project.name;
      } else if (attr === 'description') {
        element.textContent = project.description;
      }
    });
  }

  /**
   * Get app status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      user: window.userSystem?.getCurrentUser(),
      project: window.projectManager?.getCurrentProject(),
      modules: Array.from(this.modules.keys()),
      config: this.config
    };
  }

  /**
   * Register a module
   */
  registerModule(name, module) {
    this.modules.set(name, module);
    console.log(`📦 Module registered: ${name}`);
  }

  /**
   * Get a module
   */
  getModule(name) {
    return this.modules.get(name);
  }
}

// Initialize the app
const iterumApp = new IterumApp();

// Make it globally available
window.iterumApp = iterumApp;
window.IterumApp = iterumApp; // Also expose the class for global access

// Start initialization
iterumApp.init().catch(error => {
  console.error('❌ App initialization failed:', error);
  window.IterumErrorTracker.capture(error, { context: 'app_startup' });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IterumApp;
} 