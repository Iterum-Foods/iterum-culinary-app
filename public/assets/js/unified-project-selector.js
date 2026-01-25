/**
 * Unified Project Selector
 * Provides a consistent project selector UI across all pages
 */

class UnifiedProjectSelector {
    constructor() {
        this.initialized = false;
        this.currentUserId = null;
        this.currentProjectId = null;
        this.projects = [];
        
        // Storage keys with user ID
        this.STORAGE_KEYS = {
            PROJECTS: 'iterum_projects_',  // Will append user ID
            CURRENT_PROJECT: 'iterum_current_project_user_'  // Will append user ID
        };
        
        this.init();
    }

    /**
     * Initialize the selector
     */
    async init() {
        if (this.initialized) return;
        
        console.log('🎯 Initializing Unified Project Selector...');
        
        // Wait for auth and get user ID
        await this.waitForAuth();
        
        // Load user's projects
        this.loadProjects();
        
        // Load current project
        this.loadCurrentProject();
        
        // Inject selector into page
        this.injectSelector();
        
        // Setup auto-refresh
        this.setupAutoRefresh();
        
        this.initialized = true;
        console.log('✅ Unified Project Selector initialized');
    }

    /**
     * Wait for authentication
     */
    async waitForAuth() {
        return new Promise((resolve) => {
            const checkAuth = () => {
                if (window.authManager?.currentUser) {
                    this.currentUserId = window.authManager.currentUser.userId || window.authManager.currentUser.id;
                    console.log('✅ User ID found:', this.currentUserId);
                    resolve();
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
        });
    }

    /**
     * Load projects for current user
     */
    loadProjects() {
        if (!this.currentUserId) {
            console.warn('⚠️ Cannot load projects without user ID');
            return;
        }
        
        // Try new storage key first
        let projectsKey = `${this.STORAGE_KEYS.PROJECTS}${this.currentUserId}`;
        let projectsJson = localStorage.getItem(projectsKey);
        
        // If not found, try old storage key for migration
        if (!projectsJson) {
            const oldKey = `iterum_projects_${this.currentUserId}`;
            projectsJson = localStorage.getItem(oldKey);
            if (projectsJson) {
                console.log('📦 Migrating projects from old storage key');
                // Migrate to new key
                localStorage.setItem(projectsKey, projectsJson);
            }
        }
        
        // Also check global projects storage (from old system)
        if (!projectsJson) {
            const globalProjectsJson = localStorage.getItem('iterum_projects');
            if (globalProjectsJson) {
                try {
                    const globalProjects = JSON.parse(globalProjectsJson);
                    // Filter projects for current user if they have a userId field
                    const userProjects = globalProjects.filter(p => 
                        !p.userId || p.userId === this.currentUserId || p.id === 'master'
                    );
                    if (userProjects.length > 0) {
                        console.log('📦 Migrating projects from global storage');
                        this.projects = userProjects;
                        this.saveProjects();
                        return;
                    }
                } catch (e) {
                    console.error('Error parsing global projects:', e);
                }
            }
        }
        
        if (projectsJson) {
            try {
                this.projects = JSON.parse(projectsJson);
                console.log(`📋 Loaded ${this.projects.length} projects for user`);
            } catch (e) {
                console.error('Error parsing projects:', e);
                this.projects = this.createDefaultProjects();
            }
        } else {
            this.projects = this.createDefaultProjects();
            this.saveProjects();
        }
        
        // Sync with old project manager if available
        if (window.projectManager) {
            window.projectManager.projects = this.projects;
        }
    }

    /**
     * Create default projects
     */
    createDefaultProjects() {
        return [
            {
                id: 'master',
                name: 'Master Project',
                icon: '📋',
                description: 'All your culinary data',
                createdAt: new Date().toISOString(),
                isDefault: true
            }
        ];
    }

    /**
     * Save projects
     */
    saveProjects() {
        if (!this.currentUserId) return;
        
        const projectsKey = `${this.STORAGE_KEYS.PROJECTS}${this.currentUserId}`;
        localStorage.setItem(projectsKey, JSON.stringify(this.projects));
        console.log('💾 Projects saved');
    }

    /**
     * Load current project
     */
    loadCurrentProject() {
        if (!this.currentUserId) return;
        
        const currentProjectKey = `${this.STORAGE_KEYS.CURRENT_PROJECT}${this.currentUserId}`;
        this.currentProjectId = localStorage.getItem(currentProjectKey) || 'master';
        
        console.log('📋 Current project:', this.currentProjectId);
    }

    /**
     * Set current project
     */
    setCurrentProject(projectId) {
        if (!this.currentUserId) return;
        
        console.log(`🔄 Switching to project: ${projectId}`);
        
        this.currentProjectId = projectId;
        
        // Save to multiple storage keys for compatibility
        const currentProjectKey = `${this.STORAGE_KEYS.CURRENT_PROJECT}${this.currentUserId}`;
        localStorage.setItem(currentProjectKey, projectId);
        localStorage.setItem('iterum_current_project', projectId);
        localStorage.setItem(`iterum_current_project_${this.currentUserId}`, projectId);
        
        // Update old project manager if available
        const currentProject = this.projects.find(p => p.id === projectId);
        if (window.projectManager) {
            window.projectManager.currentProject = currentProject;
            window.projectManager.currentProjectId = projectId;
            
            // Update project UI if method exists
            if (typeof window.projectManager.updateProjectUI === 'function') {
                window.projectManager.updateProjectUI();
            }
        }
        
        // Update state persistence manager
        if (window.statePersistenceManager) {
            window.statePersistenceManager.loadProjectState();
        }
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('projectChanged', {
            detail: { 
                projectId, 
                project: currentProject,
                userId: this.currentUserId
            }
        }));
        
        // Refresh UI
        this.updateSelectorUI();
        
        // Reload page data for the new project
        this.reloadPageData();
        
        // Show notification
        this.showNotification(`✅ Switched to project: ${currentProject?.name || projectId}`);
        
        console.log('✅ Project changed to:', projectId, currentProject);
    }

    /**
     * Get current project
     */
    getCurrentProject() {
        return this.projects.find(p => p.id === this.currentProjectId) || this.projects[0];
    }

    /**
     * Inject selector into page
     */
    injectSelector() {
        // Find container
        let container = document.getElementById('unified-project-selector');
        
        if (!container) {
            // Create container in header
            const nav = document.querySelector('.main-nav .nav-container');
            if (nav) {
                container = document.createElement('div');
                container.id = 'unified-project-selector';
                container.style.cssText = 'margin-left: auto; margin-right: 20px;';
                nav.insertBefore(container, nav.querySelector('.nav-menu'));
            }
        }
        
        if (container) {
            container.innerHTML = this.getSelectorHTML();
            this.attachEventListeners();
        }
    }

    /**
     * Get selector HTML
     */
    getSelectorHTML() {
        const currentProject = this.getCurrentProject();
        
        return `
            <div class="project-selector-unified" style="
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 16px;
                background: white;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            " onclick="window.unifiedProjectSelector?.toggleDropdown()">
                <span style="font-size: 20px;">${currentProject?.icon || '📋'}</span>
                <div style="display: flex; flex-direction: column; align-items: flex-start;">
                    <div style="font-size: 11px; color: #64748b; font-weight: 500;">CURRENT PROJECT</div>
                    <div style="font-size: 14px; font-weight: 600; color: #1e293b;">${currentProject?.name || 'Master Project'}</div>
                </div>
                <span style="font-size: 16px; color: #64748b;">▼</span>
            </div>
            
            <!-- Dropdown -->
            <div id="project-dropdown" style="
                display: none;
                position: absolute;
                top: calc(100% + 10px);
                right: 0;
                background: white;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                min-width: 300px;
                z-index: 9999;
                max-height: 400px;
                overflow-y: auto;
            ">
                <div style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-weight: 700; font-size: 16px; color: #1e293b; margin-bottom: 5px;">Your Projects</div>
                    <div style="font-size: 13px; color: #64748b;">Select a project to work with</div>
                </div>
                
                <div id="project-list" style="padding: 10px;">
                    ${this.projects.map(project => `
                        <div class="project-option" data-project-id="${project.id}" style="
                            padding: 12px;
                            border-radius: 8px;
                            cursor: pointer;
                            margin-bottom: 5px;
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            transition: all 0.2s ease;
                            ${project.id === this.currentProjectId ? 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;' : 'background: #f8fafc;'}
                        " onclick="window.unifiedProjectSelector.setCurrentProject('${project.id}')">
                            <span style="font-size: 24px;">${project.icon || '📋'}</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; margin-bottom: 2px;">${project.name}</div>
                                <div style="font-size: 12px; opacity: 0.8;">${project.description || 'No description'}</div>
                            </div>
                            ${project.id === this.currentProjectId ? '<span style="font-size: 20px;">✓</span>' : ''}
                        </div>
                    `).join('')}
                </div>
                
                <div style="padding: 15px; border-top: 1px solid #e2e8f0;">
                    <button onclick="window.unifiedProjectSelector.createNewProject()" style="
                        width: 100%;
                        padding: 10px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                        ➕ Create New Project
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Toggle dropdown
     */
    toggleDropdown() {
        const dropdown = document.getElementById('project-dropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Close dropdown
     */
    closeDropdown() {
        const dropdown = document.getElementById('project-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const selector = document.querySelector('.project-selector-unified');
            const dropdown = document.getElementById('project-dropdown');
            
            if (selector && dropdown && !selector.contains(e.target) && !dropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    /**
     * Update selector UI
     */
    updateSelectorUI() {
        const container = document.getElementById('unified-project-selector');
        if (container) {
            container.innerHTML = this.getSelectorHTML();
            this.attachEventListeners();
            this.closeDropdown();
        }
    }

    /**
     * Create new project
     */
    createNewProject() {
        const projectName = prompt('Enter project name:');
        if (!projectName) return;
        
        const newProject = {
            id: `project_${Date.now()}`,
            name: projectName,
            icon: '📁',
            description: 'New project',
            createdAt: new Date().toISOString()
        };
        
        this.projects.push(newProject);
        this.saveProjects();
        this.setCurrentProject(newProject.id);
        
        alert(`✅ Project "${projectName}" created!`);
    }

    /**
     * Reload page data for current project
     */
    reloadPageData() {
        console.log('🔄 Reloading page data for current project...');
        
        // Reload recipes if on recipe library page
        if (window.location.pathname.includes('recipe-library') && typeof loadRecipes === 'function') {
            setTimeout(() => loadRecipes(), 100);
        }
        
        // Reload menus if on menu builder page
        if (window.location.pathname.includes('menu-builder') && window.loadMenuData) {
            setTimeout(() => window.loadMenuData(), 100);
        }
        
        // Reload vendors if on vendor page
        if (window.location.pathname.includes('vendor-management') && window.vendorManager) {
            setTimeout(() => window.vendorManager.loadVendors(), 100);
        }
        
        // Reload ingredients if on ingredients page
        if (window.location.pathname.includes('ingredients') && typeof displayIngredients === 'function') {
            setTimeout(() => displayIngredients(), 100);
        }
        
        // Refresh dashboard stats if on index
        if (window.location.pathname.includes('index') || window.location.pathname === '/') {
            if (typeof updateDashboardStats === 'function') {
                setTimeout(() => updateDashboardStats(), 100);
            }
        }
    }
    
    /**
     * Show notification
     */
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 99999;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Setup auto-refresh
     */
    setupAutoRefresh() {
        // Listen for storage events (cross-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key?.includes('iterum_projects_') || e.key?.includes('iterum_current_project_')) {
                console.log('🔄 Projects changed in another tab');
                this.loadProjects();
                this.loadCurrentProject();
                this.updateSelectorUI();
            }
        });
        
        // Listen for project change events
        window.addEventListener('projectChanged', () => {
            setTimeout(() => this.updateSelectorUI(), 50);
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.unifiedProjectSelector = new UnifiedProjectSelector();
    });
} else {
    window.unifiedProjectSelector = new UnifiedProjectSelector();
}

console.log('✅ Unified Project Selector script loaded');

