/**
 * Project Selector UI Fix
 * Ensures the project selector displays properly in the header
 */

// Function to ensure project selector is visible
function ensureProjectSelectorVisible() {
    const headerSelector = document.getElementById('header-project-selector');
    const projectContainer = document.getElementById('project-selector-container');
    
    if (headerSelector && projectContainer) {
        // Make sure the header area is visible
        headerSelector.classList.remove('hidden');
        headerSelector.style.display = 'block';
        
        // Ensure the project container has proper styling
        projectContainer.style.display = 'flex';
        projectContainer.style.width = '100%';
        
        console.log('✅ Project selector visibility fixed');
        return true;
    }
    
    console.warn('⚠️ Project selector elements not found');
    return false;
}

// Function to add enhanced project selector styles
function addEnhancedProjectStyles() {
    const existingStyle = document.getElementById('project-selector-styles');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = 'project-selector-styles';
    style.textContent = `
        /* Enhanced Project Selector Styles */
        #header-project-selector {
            display: block !important;
        }
        
        .project-selector-container {
            display: flex !important;
            justify-content: center;
            width: 100%;
            margin: 0;
        }
        
        .project-selector {
            position: relative;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 320px;
            min-width: 240px;
        }
        
        .project-current {
            padding: 0.5rem 0.75rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            border-radius: 6px;
        }
        
        .project-current:hover {
            background-color: #f9fafb;
        }
        
        .project-color-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .project-info {
            flex: 1;
            min-width: 0;
        }
        
        .project-name {
            font-weight: 500;
            font-size: 0.875rem;
            color: #111827;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .project-stats {
            font-size: 0.75rem;
            color: #6b7280;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .project-dropdown-arrow {
            color: #6b7280;
            font-size: 0.75rem;
            transition: transform 0.2s ease;
        }
        
        .project-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            margin-top: 2px;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .project-search {
            width: 100%;
            padding: 0.5rem;
            border: none;
            border-bottom: 1px solid #e5e7eb;
            font-size: 0.875rem;
            outline: none;
        }
        
        .project-search:focus {
            border-bottom-color: #3b82f6;
        }
        
        .project-list {
            max-height: 200px;
            overflow-y: auto;
        }
        
        .project-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .project-item:hover {
            background-color: #f3f4f6;
        }
        
        .project-item.current {
            background-color: #eff6ff;
            color: #1d4ed8;
        }
        
        .project-item .project-details {
            flex: 1;
            min-width: 0;
        }
        
        .project-item .project-name {
            font-weight: 500;
            font-size: 0.875rem;
        }
        
        .project-item .project-meta {
            display: flex;
            gap: 0.5rem;
            font-size: 0.75rem;
            color: #6b7280;
        }
        
        .new-project-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            border-top: 1px solid #e5e7eb;
            background: #f9fafb;
            color: #3b82f6;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: background-color 0.2s ease;
        }
        
        .new-project-btn:hover {
            background-color: #f3f4f6;
        }
        
        /* Responsive adjustments */
        @media (max-width: 1024px) {
            #header-project-selector {
                display: none !important;
            }
        }
    `;
    
    document.head.appendChild(style);
    console.log('✅ Enhanced project selector styles added');
}

// Initialize fix when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            addEnhancedProjectStyles();
            ensureProjectSelectorVisible();
        }, 500);
    });
} else {
    setTimeout(() => {
        addEnhancedProjectStyles();
        ensureProjectSelectorVisible();
    }, 500);
}

// Also run periodically to catch late-loading elements
let attempts = 0;
const checkInterval = setInterval(() => {
    attempts++;
    if (ensureProjectSelectorVisible() || attempts > 10) {
        clearInterval(checkInterval);
    }
}, 1000);

// Make functions available globally
window.ensureProjectSelectorVisible = ensureProjectSelectorVisible;
window.addEnhancedProjectStyles = addEnhancedProjectStyles;