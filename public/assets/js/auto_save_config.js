/**
 * Auto-Save Configuration for Iterum R&D Chef Notebook
 * Easy configuration script to customize auto-save behavior per page
 */

// Page-specific auto-save configurations
const autoSaveConfigs = {
    // Menu Builder - Save frequently due to complex interactions
    'menu-builder': {
        saveInterval: 15000, // 15 seconds
        debounceDelay: 1500, // 1.5 seconds
        showNotifications: true,
        excludeFields: ['search', 'filter', 'temp-input'],
        priority: 'high' // Critical page
    },
    
    // Recipe Upload - Save less frequently, larger forms
    'recipe-upload': {
        saveInterval: 30000, // 30 seconds
        debounceDelay: 3000, // 3 seconds
        showNotifications: true,
        excludeFields: ['file-upload', 'password'],
        priority: 'medium'
    },
    
    // Recipe Developer - High frequency saving for active development
    'recipe-developer': {
        saveInterval: 10000, // 10 seconds
        debounceDelay: 1000, // 1 second
        showNotifications: false, // Don't distract during development
        excludeFields: ['preview', 'temp-calc'],
        priority: 'high'
    },
    
    // Recipe Library - Moderate saving for browsing/editing
    'recipe-library': {
        saveInterval: 45000, // 45 seconds
        debounceDelay: 2000, // 2 seconds
        showNotifications: true,
        excludeFields: ['search-query', 'filter-options'],
        priority: 'low'
    },
    
    // Ingredients - Database-style entries, save carefully
    'ingredients': {
        saveInterval: 20000, // 20 seconds
        debounceDelay: 2500, // 2.5 seconds
        showNotifications: true,
        excludeFields: ['search-ingredient', 'quick-filter'],
        priority: 'medium'
    },
    
    // Equipment Management - Less frequent saves
    'equipment-management': {
        saveInterval: 60000, // 60 seconds
        debounceDelay: 3000, // 3 seconds
        showNotifications: true,
        excludeFields: ['search-equipment'],
        priority: 'low'
    },
    
    // Vendor Management - Business data, save carefully
    'vendor-management': {
        saveInterval: 30000, // 30 seconds
        debounceDelay: 2000, // 2 seconds
        showNotifications: true,
        excludeFields: ['search-vendor'],
        priority: 'medium'
    },
    
    // Default configuration for unlisted pages
    'default': {
        saveInterval: 30000, // 30 seconds
        debounceDelay: 2000, // 2 seconds
        showNotifications: true,
        excludeFields: ['search', 'filter', 'password', 'confirm-password'],
        priority: 'medium'
    }
};

// Critical fields that should always be saved immediately
const criticalFields = [
    'recipe-name',
    'recipe-title',
    'menu-title',
    'project-name',
    'restaurant-name',
    'main-content',
    'description',
    'ingredients-list',
    'instructions'
];

// Fields that should trigger immediate save when changed
const immediateFields = [
    'recipe-type',
    'cuisine-type',
    'difficulty-level',
    'serving-size',
    'prep-time',
    'cook-time'
];

/**
 * Initialize auto-save with page-specific configuration
 */
function initializeAutoSave() {
    // Determine current page
    const currentPage = getCurrentPageId();
    
    // Get configuration for current page
    const config = autoSaveConfigs[currentPage] || autoSaveConfigs['default'];
    
    // Enhanced configuration with page-specific settings
    const enhancedConfig = {
        ...config,
        apiEndpoint: '/api/autosave/save',
        storagePrefix: 'iterum_autosave_',
        
        // Custom field handlers
        onFieldSave: (fieldId, value, element) => {
            handleCustomFieldSave(fieldId, value, element);
        },
        
        onPageSave: (data) => {
            handlePageSave(data, config.priority);
        },
        
        onRestorePrompt: (data, ageMinutes) => {
            return handleRestorePrompt(data, ageMinutes, currentPage);
        }
    };
    
    // Initialize auto-save system
    if (window.AutoSaveManager) {
        window.autoSave = new window.AutoSaveManager(enhancedConfig);
        
        // Add page-specific enhancements
        addPageSpecificFeatures(currentPage);
        
        console.log(`🔄 Auto-save initialized for: ${currentPage}`, config);
    } else {
        console.warn('AutoSaveManager not loaded. Please include auto_save_system.js');
    }
}

/**
 * Get current page identifier
 */
function getCurrentPageId() {
    const path = window.location.pathname;
    const pageName = path.split('/').pop().replace('.html', '') || 'index';
    return pageName;
}

/**
 * Handle custom field save logic
 */
function handleCustomFieldSave(fieldId, value, element) {
    // Check if this is a critical field
    if (criticalFields.some(field => fieldId.includes(field))) {
        console.log(`💾 Critical field saved: ${fieldId}`);
        
        // Add visual indicator for critical fields
        addCriticalFieldIndicator(element);
    }
    
    // Handle immediate save fields
    if (immediateFields.some(field => fieldId.includes(field))) {
        console.log(`⚡ Immediate save triggered: ${fieldId}`);
        
        // Force immediate save for important fields
        setTimeout(() => {
            if (window.autoSave) {
                window.autoSave.forceSave();
            }
        }, 100);
    }
}

/**
 * Handle page-wide save logic
 */
function handlePageSave(data, priority) {
    // Add metadata based on priority
    const metadata = {
        priority: priority,
        fieldCount: Object.keys(data.forms).reduce((count, formId) => {
            return count + Object.keys(data.forms[formId]).length;
        }, 0),
        saveReason: 'auto',
        userAgent: navigator.userAgent.substring(0, 100)
    };
    
    // Add metadata to save data
    data.metadata = metadata;
    
    console.log(`💾 Page saved with priority: ${priority}`, metadata);
}

/**
 * Custom restore prompt based on page type
 */
function handleRestorePrompt(data, ageMinutes, currentPage) {
    const config = autoSaveConfigs[currentPage] || autoSaveConfigs['default'];
    
    // Don't prompt for very recent saves on low-priority pages
    if (config.priority === 'low' && ageMinutes < 5) {
        return false; // Skip prompt, auto-restore
    }
    
    // Always prompt for high-priority pages
    if (config.priority === 'high') {
        return true;
    }
    
    // Default behavior for medium priority
    return ageMinutes > 1; // Prompt if older than 1 minute
}

/**
 * Add page-specific features
 */
function addPageSpecificFeatures(currentPage) {
    switch (currentPage) {
        case 'menu-builder':
            addMenuBuilderFeatures();
            break;
        case 'recipe-developer':
            addRecipeDeveloperFeatures();
            break;
        case 'recipe-upload':
            addRecipeUploadFeatures();
            break;
        default:
            addDefaultFeatures();
    }
}

/**
 * Menu Builder specific features
 */
function addMenuBuilderFeatures() {
    // Save menu sections as they're created
    document.addEventListener('click', (e) => {
        if (e.target.matches('.add-menu-section, .save-menu-section')) {
            setTimeout(() => {
                if (window.autoSave) {
                    window.autoSave.forceSave();
                }
            }, 500);
        }
    });
    
    // Save when color coding changes
    document.addEventListener('change', (e) => {
        if (e.target.matches('.category-selector, .color-selector')) {
            if (window.autoSave) {
                window.autoSave.forceSave();
            }
        }
    });
}

/**
 * Recipe Developer specific features
 */
function addRecipeDeveloperFeatures() {
    // Save when recipe steps are modified
    document.addEventListener('input', (e) => {
        if (e.target.matches('.recipe-step, .ingredient-input, .instruction-input')) {
            // More frequent saves for active development
            e.target.dataset.lastModified = Date.now();
        }
    });
    
    // Save when scaling or calculations change
    document.addEventListener('change', (e) => {
        if (e.target.matches('.serving-size, .scaling-factor')) {
            if (window.autoSave) {
                window.autoSave.forceSave();
            }
        }
    });
}

/**
 * Recipe Upload specific features
 */
function addRecipeUploadFeatures() {
    // Save when files are selected (metadata only)
    document.addEventListener('change', (e) => {
        if (e.target.type === 'file') {
            // Save form state but not file content
            setTimeout(() => {
                if (window.autoSave) {
                    window.autoSave.saveAllData(true);
                }
            }, 1000);
        }
    });
}

/**
 * Default features for all pages
 */
function addDefaultFeatures() {
    // Save when important buttons are clicked
    document.addEventListener('click', (e) => {
        if (e.target.matches('.btn-primary, .save-btn, .submit-btn')) {
            if (window.autoSave) {
                window.autoSave.forceSave();
            }
        }
    });
}

/**
 * Add visual indicator for critical fields
 */
function addCriticalFieldIndicator(element) {
    if (!element || element.dataset.criticalIndicatorAdded) return;
    
    element.dataset.criticalIndicatorAdded = 'true';
    element.style.borderLeft = '3px solid #10b981';
    element.title = (element.title || '') + ' (Auto-saving critical field)';
}

/**
 * Manual save function for buttons/triggers
 */
function manualSave() {
    if (window.autoSave) {
        window.autoSave.forceSave();
        
        // Show confirmation
        if (window.autoSave.options.showNotifications) {
            window.autoSave.showNotification('Work saved manually', 'success');
        }
    }
}

/**
 * Get auto-save status for debugging
 */
function getAutoSaveStatus() {
    if (window.autoSave) {
        return window.autoSave.getAutoSaveStatus();
    }
    return { enabled: false, error: 'Auto-save not initialized' };
}

/**
 * Clear auto-save data for current page
 */
function clearAutoSaveData() {
    if (window.autoSave) {
        window.autoSave.clearAutoSavedData();
        console.log('🧹 Auto-save data cleared for current page');
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAutoSave);
} else {
    // DOM is already loaded
    setTimeout(initializeAutoSave, 100);
}

// Export functions for global access
window.autoSaveConfig = {
    initialize: initializeAutoSave,
    manualSave: manualSave,
    getStatus: getAutoSaveStatus,
    clearData: clearAutoSaveData,
    configs: autoSaveConfigs
};