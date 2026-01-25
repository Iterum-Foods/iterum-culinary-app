/**
 * Project Management System - Culinary Project Organization
 * Handles project creation, data tagging, and filtering
 */

class ProjectManagementSystem {
    constructor() {
        this.projects = [];
        this.currentProject = null;
        this.masterProjectId = 'master';
        this.storageKey = 'iterum_projects';
        this.currentProjectKey = 'iterum_current_project';
        this.initialized = false; // Track initialization status
        this.init();
    }

    /**
     * Initialize master project
     */
    initializeMasterProject() {
        console.log('🏗️ Initializing master project...');
        
        // Create master project if it doesn't exist
        const masterProject = {
            id: this.masterProjectId,
            name: 'Master Project',
            description: 'Default project for all culinary data',
            type: 'master',
            createdAt: new Date().toISOString(),
            isDefault: true
        };
        
        // Ensure master project exists in storage
        this.ensureMasterProject(masterProject);
    }

    /**
     * Ensure master project exists in storage
     */
    ensureMasterProject(masterProject) {
        try {
            const stored = localStorage.getItem(this.storageKey);
            let projects = stored ? JSON.parse(stored) : [];
            
            // Check if master project exists
            const masterExists = projects.some(p => p.id === this.masterProjectId);
            
            if (!masterExists) {
                projects.push(masterProject);
                localStorage.setItem(this.storageKey, JSON.stringify(projects));
                console.log('✅ Master project created');
            } else {
                console.log('✅ Master project already exists');
            }
        } catch (error) {
            console.error('❌ Error ensuring master project:', error);
        }
    }

    /**
     * Initialize the project management system
     */
    init() {
        if (this.initialized) {
            console.log('📋 Project management system already initialized');
            return;
        }

        try {
            console.log('🚀 Initializing Project Management System...');
            
            // CRITICAL: Get current user ID from authManager
            if (window.authManager && window.authManager.currentUser) {
                this.currentUserId = window.authManager.currentUser.userId;
                console.log('✅ Set user ID from authManager:', this.currentUserId);
            } else {
                // Fallback to localStorage
                const sessionUser = localStorage.getItem('current_user');
                if (sessionUser) {
                    try {
                        const user = JSON.parse(sessionUser);
                        this.currentUserId = user.userId || user.id || 'guest';
                        console.log('✅ Set user ID from localStorage:', this.currentUserId);
                    } catch (e) {
                        this.currentUserId = 'guest';
                        console.warn('⚠️ Could not parse user, using guest');
                    }
                } else {
                    this.currentUserId = 'guest';
                    console.warn('⚠️ No user found, using guest');
                }
            }
            
            // Initialize with master project only
            this.initializeMasterProject();
            
            // Load projects from storage
            this.loadProjects();
            
            // Load current project (don't force master - use saved selection)
            this.loadCurrentProject();
            
            // If no current project found, default to master
            if (!this.currentProject) {
                this.setCurrentProject(this.masterProjectId);
            }
            
            // Update UI
            this.updateProjectUI();
            
            // Mark as initialized
            this.initialized = true;
            
            // Listen for storage changes to sync across tabs
            window.addEventListener('storage', (event) => {
                if (event.key === this.currentProjectKey) {
                    console.log('🔄 Project selection changed in another tab, syncing...');
                    this.loadCurrentProject();
                    this.updateProjectUI();
                }
            });
            
            // Listen for user changes
            window.addEventListener('userLoggedIn', (event) => {
                console.log('🔄 User logged in, updating project management...');
                this.handleUserChange(event.detail.user);
            });
            
            window.addEventListener('userSwitched', (event) => {
                console.log('🔄 User switched, updating project management...');
                this.handleUserChange(event.detail.user);
            });
            
            console.log('✅ Project Management System initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Project Management System:', error);
            this.initialized = false;
        }
    }

    /**
     * Load all projects from local storage
     */
    loadProjects() {
        try {
            console.log('🔍 Loading projects for user:', this.currentUserId);
            const userStorageKey = this.getUserStorageKey(this.storageKey);
            const stored = localStorage.getItem(userStorageKey);
            this.projects = stored ? JSON.parse(stored) : [];
            
            // TRY TO RECOVER FROM BACKUP if no projects found
            if (this.projects.length === 0 || !this.projects.some(p => p.id !== 'master')) {
                console.log('⚠️ No projects found, checking backup...');
                const backup = localStorage.getItem('iterum_projects_backup');
                if (backup) {
                    try {
                        const backupData = JSON.parse(backup);
                        if (backupData.projects && backupData.projects.length > 0) {
                            console.log(`🔄 Restoring ${backupData.projects.length} projects from backup`);
                            this.projects = backupData.projects;
                            // Save to correct location
                            this.saveProjects();
                        }
                    } catch (e) {
                        console.warn('Could not restore from backup:', e);
                    }
                }
            }
            
            // Ensure master project exists for current user
            this.ensureMasterProject();
            
            console.log(`📚 Loaded ${this.projects.length} projects for user ${this.currentUserId}`);
            
            // Log project names for debugging
            if (this.projects.length > 0) {
                console.log('📋 Projects:', this.projects.map(p => p.name).join(', '));
            }
        } catch (error) {
            console.error('❌ Error loading projects:', error);
            this.projects = [];
            this.ensureMasterProject();
        }
    }

    /**
     * Create the master project (shows all user data)
     */
    createMasterProject() {
        const masterProject = {
            id: this.masterProjectId,
            name: 'Master Project',
            description: 'Complete data repository - shows all ingredients, recipes, and menus',
            type: 'master',
            status: 'active',
            createdAt: new Date().toISOString(),
            isMaster: true,
            color: '#6366f1', // Indigo
            icon: '🏠'
        };
        
        this.projects.push(masterProject);
        this.saveProjects();
        console.log('✅ Created master project');
    }

    /**
     * Save all projects to local storage
     */
    saveProjects() {
        try {
            const userStorageKey = this.getUserStorageKey(this.storageKey);
            localStorage.setItem(userStorageKey, JSON.stringify(this.projects));
            
            // BACKUP: Also save to a backup key without user ID for recovery
            localStorage.setItem('iterum_projects_backup', JSON.stringify({
                userId: this.currentUserId,
                projects: this.projects,
                savedAt: new Date().toISOString()
            }));
            
            console.log('✅ Projects saved to localStorage for user:', this.currentUserId);
            console.log(`📦 Saved ${this.projects.length} projects`);
        } catch (error) {
            console.error('❌ Error saving projects:', error);
        }
    }

    /**
     * Load current project from local storage
     */
    loadCurrentProject() {
        try {
            // Load projects first to ensure we have the full list
            this.loadProjects();
            
            // Try multiple storage keys (user-specific first, then legacy)
            const userCurrentProjectKey = this.getUserStorageKey(this.currentProjectKey);
            let projectId = localStorage.getItem(userCurrentProjectKey);
            
            // Fallback to legacy keys
            if (!projectId) {
                projectId = localStorage.getItem(this.currentProjectKey);
            }
            if (!projectId) {
                projectId = localStorage.getItem('iterum_current_project');
            }
            if (!projectId && this.currentUserId) {
                projectId = localStorage.getItem(`iterum_current_project_${this.currentUserId}`);
            }
            
            console.log('🔍 Loading current project. Found projectId:', projectId);
            console.log('📚 Available projects:', this.projects.map(p => ({id: p.id, name: p.name})));
            
            if (projectId) {
                this.currentProject = this.projects.find(p => p.id === projectId);
                
                if (this.currentProject) {
                    console.log('✅ Loaded current project:', this.currentProject.name);
                    // Ensure it's saved in all keys for compatibility
                    const userCurrentProjectKey = this.getUserStorageKey(this.currentProjectKey);
                    localStorage.setItem(userCurrentProjectKey, projectId);
                    localStorage.setItem(this.currentProjectKey, projectId);
                    localStorage.setItem('iterum_current_project', projectId);
                } else {
                    console.warn('⚠️ Project ID', projectId, 'not found in projects list. Available:', this.projects.map(p => p.id));
                    // Try to find master project
                    if (this.projects.some(p => p.id === this.masterProjectId)) {
                        console.log('📋 Falling back to master project');
                        this.setCurrentProject(this.masterProjectId);
                    } else if (this.projects.length > 0) {
                        // Use first available project
                        console.log('📋 Using first available project:', this.projects[0].name);
                        this.setCurrentProject(this.projects[0].id);
                    }
                }
            } else {
                // No saved project - default to master or first available
                if (this.projects.some(p => p.id === this.masterProjectId)) {
                    console.log('📋 No saved project, defaulting to master');
                    this.setCurrentProject(this.masterProjectId);
                } else if (this.projects.length > 0) {
                    console.log('📋 No saved project, using first available:', this.projects[0].name);
                    this.setCurrentProject(this.projects[0].id);
                }
            }
            
            console.log('📋 Final current project for user', this.currentUserId + ':', this.currentProject?.name);
        } catch (error) {
            console.error('❌ Error loading current project:', error);
            // Fallback to master
            if (this.projects.some(p => p.id === this.masterProjectId)) {
                this.setCurrentProject(this.masterProjectId);
            } else if (this.projects.length > 0) {
                this.setCurrentProject(this.projects[0].id);
            }
        }
    }

    /**
     * Set current project
     */
    setCurrentProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            this.currentProject = project;
            const userCurrentProjectKey = this.getUserStorageKey(this.currentProjectKey);
            
            // Save to ALL storage keys to ensure persistence
            localStorage.setItem(userCurrentProjectKey, projectId);
            localStorage.setItem(this.currentProjectKey, projectId);
            localStorage.setItem('iterum_current_project', projectId);
            
            // Also save with user ID
            if (this.currentUserId) {
                localStorage.setItem(`iterum_current_project_${this.currentUserId}`, projectId);
            }
            
            // Force immediate write completion
            if (localStorage.getItem(userCurrentProjectKey) !== projectId) {
                console.error('❌ Failed to save project ID to localStorage!');
                return false;
            }
            
            console.log('✅ Project ID saved to localStorage:', projectId);
            console.log('📋 Current project:', project.name);
            
            this.updateProjectUI();
            this.dispatchProjectChangeEvent();
            console.log('📋 User', this.currentUserId, 'switched to project:', project.name);
            return true;
        } else {
            console.warn('⚠️ Project not found:', projectId);
            console.warn('📚 Available projects:', this.projects.map(p => ({id: p.id, name: p.name})));
        }
        return false;
    }

    /**
     * Create a new project
     */
    createProject(projectData) {
        const newProject = {
            id: this.generateProjectId(),
            name: projectData.name || 'New Project',
            description: projectData.description || '',
            type: projectData.type || 'culinary',
            status: 'active',
            createdAt: new Date().toISOString(),
            isMaster: false,
            color: projectData.color || this.getRandomProjectColor(),
            icon: projectData.icon || '📋',
            tags: projectData.tags || [],
            userId: this.currentUserId, // Ensure user ID is set
            ...projectData
        };

        // Add to projects array
        this.projects.push(newProject);
        
        // Save projects FIRST
        this.saveProjects();
        console.log('💾 Projects saved, total count:', this.projects.length);
        
        // AUTO-SET AS CURRENT: Automatically set the new project as current
        const setSuccess = this.setCurrentProject(newProject.id);
        
        if (setSuccess) {
            console.log('✅ Created new project:', newProject.name, 'and set as current');
            console.log('📋 Current project ID:', this.currentProject?.id);
            console.log('📋 Current project name:', this.currentProject?.name);
        } else {
            console.error('❌ Failed to set new project as current');
        }
        
        return newProject;
    }

    /**
     * Update existing project
     */
    updateProject(projectId, updates) {
        const projectIndex = this.projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            this.projects[projectIndex] = { ...this.projects[projectIndex], ...updates };
            this.saveProjects();
            
            // Update current project if it's the one being updated
            if (this.currentProject?.id === projectId) {
                this.currentProject = this.projects[projectIndex];
            }
            
            console.log('✅ Updated project:', this.projects[projectIndex].name);
            return true;
        }
        return false;
    }

    /**
     * Delete project (but prevent deleting master project)
     */
    deleteProject(projectId) {
        if (projectId === this.masterProjectId) {
            console.warn('⚠️ Cannot delete master project');
            return false;
        }

        const projectIndex = this.projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            const deletedProject = this.projects[projectIndex];
            this.projects.splice(projectIndex, 1);
            this.saveProjects();

            // If deleted project was current, switch to master
            if (this.currentProject?.id === projectId) {
                this.setCurrentProject(this.masterProjectId);
            }

            console.log('🗑️ Deleted project:', deletedProject.name);
            return true;
        }
        return false;
    }

    /**
     * Get all projects
     */
    getAllProjects() {
        return this.projects;
    }

    /**
     * Get current project
     */
    getCurrentProject() {
        return this.currentProject;
    }

    /**
     * Generate storage key for data (simplified for master project)
     * All data is stored in master project storage
     */
    getProjectStorageKey(dataType) {
        // Always use master project storage
        return `iterum_master_${dataType}`;
    }

    /**
     * Get file storage path (simplified for master project)
     * All files are stored in master project storage
     */
    getProjectFilePath(dataType) {
        // Always use master project file storage
        return `iterum_master_${dataType}.json`;
    }

    /**
     * Check if current project is master (always true for master-only system)
     */
    isMasterProject() {
        return true; // Always true since we only use master project
    }

    /**
     * Generate unique project ID
     */
    generateProjectId() {
        return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get random project color
     */
    getRandomProjectColor() {
        const colors = [
            '#ef4444', // Red
            '#f97316', // Orange
            '#eab308', // Yellow
            '#22c55e', // Green
            '#06b6d4', // Cyan
            '#3b82f6', // Blue
            '#8b5cf6', // Violet
            '#ec4899', // Pink
            '#84cc16', // Lime
            '#14b8a6'  // Teal
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Update project UI elements
     */
    updateProjectUI() {
        // Update project selector dropdowns
        this.updateProjectSelectors();
        
        // Synchronize all project selectors across the page
        this.synchronizeAllProjectSelectors();
        
        // Update project display
        this.updateProjectDisplay();
        
        // Update data filtering based on current project
        this.updateDataFiltering();
    }

    /**
     * Update project selector dropdowns
     */
    updateProjectSelectors() {
        // Update header project selector display (new dropdown style)
        const headerSelectorDisplay = document.querySelector('.project-selector-display');
        if (headerSelectorDisplay) {
            const projectNameElement = headerSelectorDisplay.querySelector('.project-selector-name');
            const projectIconElement = headerSelectorDisplay.querySelector('.project-selector-icon');
            
            if (projectNameElement && this.currentProject) {
                projectNameElement.textContent = this.currentProject.name;
            }
            
            if (projectIconElement && this.currentProject) {
                projectIconElement.textContent = this.currentProject.icon || '📋';
            }
        }

        // Update legacy header project selector (if it exists)
        const headerSelector = document.getElementById('header-project-selector');
        if (headerSelector) {
            headerSelector.innerHTML = this.projects.map(project => `
                <option value="${project.id}" ${project.id === this.currentProject?.id ? 'selected' : ''}>
                    ${project.icon} ${project.name}
                </option>
            `).join('');
            
            // Add change event listener for project selection
            headerSelector.onchange = (event) => {
                const selectedProjectId = event.target.value;
                if (selectedProjectId && selectedProjectId !== this.currentProject?.id) {
                    this.setCurrentProject(selectedProjectId);
                }
            };
        }

        // Update mobile project selector
        const mobileSelector = document.getElementById('mobile-project-selector');
        if (mobileSelector) {
            mobileSelector.innerHTML = this.projects.map(project => `
                <option value="${project.id}" ${project.id === this.currentProject?.id ? 'selected' : ''}>
                    ${project.icon} ${project.name}
                </option>
            `).join('');
            
            // Add change event listener for mobile project selection
            mobileSelector.onchange = (event) => {
                const selectedProjectId = event.target.value;
                if (selectedProjectId && selectedProjectId !== this.currentProject?.id) {
                    this.setCurrentProject(selectedProjectId);
                }
            };
        }
    }

    /**
     * Update project display information
     */
    updateProjectDisplay() {
        // Update project name display
        const projectNameElements = document.querySelectorAll('[data-project-name]');
        projectNameElements.forEach(element => {
            if (this.currentProject) {
                element.textContent = this.currentProject.name;
            }
        });

        // Update project status display
        const projectStatusElements = document.querySelectorAll('[data-project-status]');
        projectStatusElements.forEach(element => {
            if (this.currentProject) {
                element.textContent = this.currentProject.status;
            }
        });

        // Update project type display
        const projectTypeElements = document.querySelectorAll('[data-project-type]');
        projectTypeElements.forEach(element => {
            if (this.currentProject) {
                element.textContent = this.currentProject.type;
            }
        });
    }

    /**
     * Update data filtering based on current project
     */
    updateDataFiltering() {
        if (this.isMasterProject()) {
            // Show all data (no filtering)
            this.showAllData();
        } else {
            // Filter data to show only current project items
            this.filterDataByProject();
        }
    }

    /**
     * Show all data (master project mode)
     */
    showAllData() {
        console.log('🔍 Showing all data (master project mode)');
        // Remove any project-specific filtering
        const projectFilteredElements = document.querySelectorAll('[data-project-filtered]');
        projectFilteredElements.forEach(element => {
            element.style.display = '';
        });
        
        // Show all data sections
        this.showDataSection('ingredients', true);
        this.showDataSection('recipes', true);
        this.showDataSection('menus', true);
    }

    /**
     * Filter data to show only current project items
     */
    filterDataByProject() {
        console.log('🔍 Filtering data for project:', this.currentProject.name);
        
        if (window.dataTagger) {
            const projectItems = window.dataTagger.getProjectItems(this.currentProject.id);
            console.log('🔍 Project items:', projectItems);
            
            // Show/hide data sections based on what's tagged
            this.showDataSection('ingredients', projectItems.ingredients.length > 0);
            this.showDataSection('recipes', projectItems.recipes.length > 0);
            this.showDataSection('menus', projectItems.menus.length > 0);
            
            // Update project statistics display
            this.updateProjectStats(projectItems);
        } else {
            console.warn('⚠️ Data tagging system not available');
        }
    }

    /**
     * Show or hide a data section based on project filtering
     */
    showDataSection(sectionType, show) {
        const sectionElements = document.querySelectorAll(`[data-section="${sectionType}"]`);
        sectionElements.forEach(element => {
            if (show) {
                element.style.display = '';
                element.classList.remove('project-filtered-hidden');
            } else {
                element.style.display = 'none';
                element.classList.add('project-filtered-hidden');
            }
        });
    }

    /**
     * Update project statistics display
     */
    updateProjectStats(projectItems) {
        const statsElements = document.querySelectorAll('[data-project-stats]');
        statsElements.forEach(element => {
            const total = projectItems.ingredients.length + projectItems.recipes.length + projectItems.menus.length;
            element.innerHTML = `
                <div class="project-stats">
                    <span class="stat-item">🥕 ${projectItems.ingredients.length} Ingredients</span>
                    <span class="stat-item">📖 ${projectItems.recipes.length} Recipes</span>
                    <span class="stat-item">🍽️ ${projectItems.menus.length} Menus</span>
                    <span class="stat-item total">📊 ${total} Total Items</span>
                </div>
            `;
        });
    }

    /**
     * Dispatch project change event
     */
    dispatchProjectChangeEvent() {
        // Dispatch the main project change event
        window.dispatchEvent(new CustomEvent('projectChanged', {
            detail: { 
                project: this.currentProject,
                isMaster: this.isMasterProject(),
                userId: this.currentUserId
            }
        }));
        
        // Also dispatch a storage event to sync across tabs
        try {
            const userCurrentProjectKey = this.getUserStorageKey(this.currentProjectKey);
            localStorage.setItem(userCurrentProjectKey, this.currentProject?.id || '');
            
            // Trigger a custom storage event for cross-tab synchronization
            window.dispatchEvent(new StorageEvent('storage', {
                key: userCurrentProjectKey,
                newValue: this.currentProject?.id || '',
                oldValue: null,
                url: window.location.href
            }));
        } catch (error) {
            console.warn('⚠️ Could not dispatch storage event:', error);
        }
        
        console.log('📡 Project change event dispatched for project:', this.currentProject?.name);
    }

    /**
     * Show project management modal
     */
    showProjectModal() {
        this.removeExistingModals();
        
        const modal = this.createProjectModal();
        if (modal) {
            document.body.appendChild(modal);
            
            setTimeout(() => {
                modal.classList.add('show');
                modal.style.opacity = '1';
            }, 10);
            
            console.log('✅ Project management modal displayed');
        } else {
            console.error('❌ Failed to create project modal');
        }
    }

    /**
     * Remove existing modals
     */
    removeExistingModals() {
        const existingModals = document.querySelectorAll('.project-modal-overlay');
        existingModals.forEach(modal => modal.remove());
    }

    /**
     * Create project management modal
     */
    createProjectModal() {
        try {
            const modal = document.createElement('div');
            modal.className = 'project-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] opacity-0 transition-opacity duration-300';
            modal.style.zIndex = '9999';
            
            modal.innerHTML = `
                <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="p-6 border-b border-gray-200">
                        <h2 class="text-xl font-semibold text-gray-900">Project Management</h2>
                        <p class="text-sm text-gray-600 mt-1">Manage your culinary projects and data organization</p>
                    </div>
                    
                    <div class="p-6 space-y-6">
                        <!-- Current Project Info -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h3 class="font-medium text-gray-900 mb-2">Current Project</h3>
                            <div class="flex items-center space-x-3">
                                <span class="text-2xl">${this.currentProject?.icon || '📋'}</span>
                                <div>
                                    <div class="font-medium">${this.currentProject?.name || 'Unknown'}</div>
                                    <div class="text-sm text-gray-600">${this.currentProject?.description || 'No description'}</div>
                                    <div class="text-xs text-gray-500">${this.currentProject?.type || 'Project'} • ${this.currentProject?.status || 'Unknown'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Project List -->
                        <div class="space-y-3">
                            <h3 class="font-medium text-gray-900">All Projects</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                ${this.projects.map(project => `
                                    <div class="border rounded-lg p-4 ${project.id === this.currentProject?.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'}">
                                        <div class="flex items-center justify-between mb-2">
                                            <div class="flex items-center space-x-2">
                                                <span class="text-lg">${project.icon}</span>
                                                <span class="font-medium">${project.name}</span>
                                                ${project.isMaster ? '<span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Master</span>' : ''}
                                            </div>
                                            ${project.id === this.currentProject?.id ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Current</span>' : ''}
                                        </div>
                                        <p class="text-sm text-gray-600 mb-3">${project.description || 'No description'}</p>
                                        <div class="flex space-x-2">
                                            ${!project.isMaster ? `
                                                <button onclick="window.projectManager.setCurrentProject('${project.id}')" 
                                                        class="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors">
                                                    Switch
                                                </button>
                                                <button onclick="window.projectManager.editProject('${project.id}')" 
                                                        class="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors">
                                                    Edit
                                                </button>
                                                <button onclick="window.projectManager.deleteProject('${project.id}')" 
                                                        class="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors">
                                                    Delete
                                                </button>
                                            ` : `
                                                <button onclick="window.projectManager.setCurrentProject('${project.id}')" 
                                                        class="text-sm bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded transition-colors">
                                                    Switch to Master
                                                </button>
                                            `}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Create New Project -->
                        <div class="border-t pt-4">
                            <h3 class="font-medium text-gray-900 mb-3">Create New Project</h3>
                            <form id="create-project-form" class="space-y-3">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div class="form-group">
                                        <label for="new-project-name" class="form-label text-sm">Project Name</label>
                                        <input type="text" id="new-project-name" class="form-input form-input-sm" placeholder="Enter project name" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="new-project-type" class="form-label text-sm">Project Type</label>
                                        <select id="new-project-type" class="form-select form-select-sm">
                                            <option value="culinary">Culinary</option>
                                            <option value="catering">Catering</option>
                                            <option value="restaurant">Restaurant</option>
                                            <option value="food-truck">Food Truck</option>
                                            <option value="popup">Pop-up</option>
                                            <option value="private-chef">Private Chef</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="new-project-description" class="form-label text-sm">Description</label>
                                    <textarea id="new-project-description" class="form-input form-input-sm" rows="2" placeholder="Describe your project"></textarea>
                                </div>
                                
                                <button type="submit" class="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
                                    ➕ Create Project
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    <div class="p-6 border-t border-gray-200">
                        <button onclick="window.projectManager.closeProjectModal()" class="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            `;

            // Handle form submission
            const form = modal.querySelector('#create-project-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    const projectData = {
                        name: document.getElementById('new-project-name')?.value || '',
                        type: document.getElementById('new-project-type')?.value || 'culinary',
                        description: document.getElementById('new-project-description')?.value || ''
                    };
                    
                    if (!projectData.name.trim()) {
                        alert('Please enter a project name');
                        return;
                    }
                    
                    const newProject = this.createProject(projectData);
                    if (newProject) {
                        // Switch to new project
                        this.setCurrentProject(newProject.id);
                        
                        // Close modal
                        this.closeProjectModal();
                        
                        // Show success message
                        alert(`Project "${newProject.name}" created successfully!`);
                    } else {
                        alert('Failed to create project. Please try again.');
                    }
                });
            }

            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeProjectModal();
                }
            });

            return modal;
            
        } catch (error) {
            console.error('❌ Error creating project modal:', error);
            return null;
        }
    }

    /**
     * Close project modal
     */
    closeProjectModal() {
        const modal = document.querySelector('.project-modal-overlay');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                console.log('✅ Project modal closed');
            }, 300);
        }
    }

    /**
     * Edit project (placeholder for future implementation)
     */
    editProject(projectId) {
        console.log('🔍 Edit project:', projectId);
        // TODO: Implement project editing
        alert('Project editing will be implemented in the next phase');
    }

    /**
     * Handle project selector change
     */
    handleProjectChange(projectId) {
        console.log('🔍 Project changed to:', projectId);
        this.setCurrentProject(projectId);
    }

    /**
     * Show import from master modal
     */
    showImportFromMasterModal() {
        if (this.isMasterProject()) {
            console.log('⚠️ Cannot import from master while on master project');
            return;
        }

        this.removeExistingModals();
        
        const modal = this.createImportFromMasterModal();
        if (modal) {
            document.body.appendChild(modal);
            
            setTimeout(() => {
                modal.classList.add('show');
                modal.style.opacity = '1';
            }, 10);
            
            console.log('✅ Import from master modal displayed');
        } else {
            console.error('❌ Failed to create import modal');
        }
    }

    /**
     * Create import from master modal
     */
    createImportFromMasterModal() {
        try {
            const modal = document.createElement('div');
            modal.className = 'project-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] opacity-0 transition-opacity duration-300';
            modal.style.zIndex = '9999';
            
            modal.innerHTML = `
                <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="p-6 border-b border-gray-200">
                        <h2 class="text-xl font-semibold text-gray-900">Import from Master Project</h2>
                        <p class="text-sm text-gray-600 mt-1">Select items to import from your master data to "${this.currentProject?.name}"</p>
                    </div>
                    
                    <div class="p-6 space-y-6">
                        <!-- Import Options -->
                        <div class="space-y-4">
                            <h3 class="font-medium text-gray-900">What would you like to import?</h3>
                            
                            <!-- Ingredients -->
                            <div class="border rounded-lg p-4">
                                <div class="flex items-center justify-between mb-3">
                                    <h4 class="font-medium text-gray-900">🥕 Ingredients</h4>
                                    <button onclick="window.projectManager.toggleImportSection('ingredients')" class="text-sm text-blue-600 hover:text-blue-700">
                                        Show/Hide
                                    </button>
                                </div>
                                <div id="import-ingredients" class="space-y-2" style="display: none;">
                                    <p class="text-sm text-gray-600">Select ingredients to import:</p>
                                    <div class="max-h-32 overflow-y-auto space-y-2">
                                        <div class="flex items-center space-x-2">
                                            <input type="checkbox" id="ingredient-all" class="rounded">
                                            <label for="ingredient-all" class="text-sm">Select All Ingredients</label>
                                        </div>
                                        <!-- Ingredient list will be populated here -->
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Recipes -->
                            <div class="border rounded-lg p-4">
                                <div class="flex items-center justify-between mb-3">
                                    <h4 class="font-medium text-gray-900">📖 Recipes</h4>
                                    <button onclick="window.projectManager.toggleImportSection('recipes')" class="text-sm text-blue-600 hover:text-blue-700">
                                        Show/Hide
                                    </button>
                                </div>
                                <div id="import-recipes" class="space-y-2" style="display: none;">
                                    <p class="text-sm text-gray-600">Select recipes to import:</p>
                                    <div class="max-h-32 overflow-y-auto space-y-2">
                                        <div class="flex items-center space-x-2">
                                            <input type="checkbox" id="recipe-all" class="rounded">
                                            <label for="recipe-all" class="text-sm">Select All Recipes</label>
                                        </div>
                                        <!-- Recipe list will be populated here -->
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Menus -->
                            <div class="border rounded-lg p-4">
                                <div class="flex items-center justify-between mb-3">
                                    <h4 class="font-medium text-gray-900">🍽️ Menus</h4>
                                    <button onclick="window.projectManager.toggleImportSection('menus')" class="text-sm text-blue-600 hover:text-blue-700">
                                        Show/Hide
                                    </button>
                                </div>
                                <div id="import-menus" class="space-y-2" style="display: none;">
                                    <p class="text-sm text-gray-600">Select menus to import:</p>
                                    <div class="max-h-32 overflow-y-auto space-y-2">
                                        <div class="flex items-center space-x-2">
                                            <input type="checkbox" id="menu-all" class="rounded">
                                            <label for="menu-all" class="text-sm">Select All Menus</label>
                                        </div>
                                        <!-- Menu list will be populated here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Import Mode -->
                        <div class="border-t pt-4">
                            <h3 class="font-medium text-gray-900 mb-3">Import Mode</h3>
                            <div class="space-y-2">
                                <div class="flex items-center space-x-2">
                                    <input type="radio" id="import-mode-copy" name="import-mode" value="copy" checked class="rounded">
                                    <label for="import-mode-copy" class="text-sm">Copy (Create independent copies)</label>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <input type="radio" id="import-mode-link" name="import-mode" value="link" class="rounded">
                                    <label for="import-mode-link" class="text-sm">Link (Reference master data)</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6 border-t border-gray-200">
                        <div class="flex space-x-3">
                            <button onclick="window.projectManager.executeImport()" class="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
                                📥 Import Selected Items
                            </button>
                            <button onclick="window.projectManager.closeProjectModal()" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeProjectModal();
                }
            });

            return modal;
            
        } catch (error) {
            console.error('❌ Error creating import modal:', error);
            return null;
        }
    }

    /**
     * Toggle import section visibility
     */
    toggleImportSection(section) {
        const element = document.getElementById(`import-${section}`);
        if (element) {
            element.style.display = element.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Execute import from master
     */
    executeImport() {
        console.log('🔍 Executing import from master...');
        // TODO: Implement actual import logic
        alert('Import functionality will be implemented in the next phase. This will allow you to import ingredients, recipes, and menus from your master project.');
        this.closeProjectModal();
    }

    /**
     * Initialize projects for a new user
     * This should be called when a new user is created
     */
    initializeForNewUser(userId) {
        if (!userId) {
            console.warn('⚠️ Cannot initialize projects without user ID');
            return false;
        }

        try {
            console.log('🚀 Initializing projects for new user:', userId);
            
            // Set current user ID
            this.currentUserId = userId;
            
            // Clear any existing projects for this user
            this.projects = [];
            
            // Create master project for the new user
            this.createMasterProject();
            
            // Set master project as current
            this.setCurrentProject(this.masterProjectId);
            
            console.log('✅ Projects initialized for new user:', userId);
            return true;
        } catch (error) {
            console.error('❌ Error initializing projects for new user:', error);
            return false;
        }
    }

    /**
     * Ensure master project exists for current user
     * This is called automatically but can also be called manually
     */
    ensureMasterProject() {
        if (!this.currentUserId) {
            console.warn('⚠️ Cannot ensure master project without user ID');
            return false;
        }

        try {
            // Check if master project exists
            const masterProject = this.projects.find(p => p.id === this.masterProjectId);
            
            if (!masterProject) {
                console.log('🏠 Creating master project for user:', this.currentUserId);
                this.createMasterProject();
                return true;
            } else {
                console.log('✅ Master project already exists for user:', this.currentUserId);
                return true;
            }
        } catch (error) {
            console.error('❌ Error ensuring master project:', error);
            return false;
        }
    }

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        // Try to get from authManager first
        if (window.authManager && window.authManager.currentUser) {
            return window.authManager.currentUser.userId;
        }
        
        // Fallback to stored value
        if (this.currentUserId) {
            return this.currentUserId;
        }
        
        // Last resort: check localStorage
        const sessionUser = localStorage.getItem('current_user');
        if (sessionUser) {
            try {
                const user = JSON.parse(sessionUser);
                return user.userId || user.id || 'guest';
            } catch (e) {
                console.error('Error parsing user:', e);
            }
        }
        
        return 'guest';
    }

    /**
     * Handle user change events
     */
    handleUserChange(user) {
        if (user && user.id) {
            this.currentUserId = user.id;
            console.log('🔄 User changed to:', user.name, 'ID:', user.id);
            
            // Reload projects for new user
            this.loadProjects();
            this.loadCurrentProject();
            this.updateProjectUI();
        }
    }

    /**
     * Get user-specific storage key
     */
    getUserStorageKey(baseKey) {
        if (!this.currentUserId) {
            return baseKey;
        }
        return `${baseKey}_user_${this.currentUserId}`;
    }

    /**
     * Synchronize all project selectors across the page
     * This ensures all project dropdowns show the same selection
     */
    synchronizeAllProjectSelectors() {
        try {
            console.log('🔄 Synchronizing all project selectors...');
            
            // Find all project selectors on the page
            const allProjectSelectors = document.querySelectorAll('select[id*="project"], select[class*="project"], [data-project-selector]');
            
            allProjectSelectors.forEach(selector => {
                if (selector && this.currentProject) {
                    // Update the options if they don't match current projects
                    if (selector.options.length !== this.projects.length) {
                        selector.innerHTML = this.projects.map(project => `
                            <option value="${project.id}" ${project.id === this.currentProject.id ? 'selected' : ''}>
                                ${project.icon} ${project.name}
                            </option>
                        `).join('');
                    } else {
                        // Just update the selection
                        selector.value = this.currentProject.id;
                    }
                    
                    // Ensure change event listener is attached
                    if (!selector.hasAttribute('data-project-listener-attached')) {
                        selector.onchange = (event) => {
                            const selectedProjectId = event.target.value;
                            if (selectedProjectId && selectedProjectId !== this.currentProject?.id) {
                                this.setCurrentProject(selectedProjectId);
                            }
                        };
                        selector.setAttribute('data-project-listener-attached', 'true');
                    }
                }
            });
            
            console.log(`✅ Synchronized ${allProjectSelectors.length} project selectors`);
        } catch (error) {
            console.warn('⚠️ Error synchronizing project selectors:', error);
        }
    }

    /**
     * Show project selection dropdown interface
     */
    showProjectSelectionDropdown() {
        // Remove any existing dropdown
        this.removeProjectSelectionDropdown();
        
        // Create dropdown container
        const dropdown = document.createElement('div');
        dropdown.id = 'project-selection-dropdown';
        dropdown.className = 'project-selection-dropdown';
        
        // Position the dropdown relative to the project selector container
        const projectContainer = document.querySelector('.header-project-selector-container');
        if (!projectContainer) {
            console.warn('⚠️ Project selector container not found, falling back to modal');
            this.showProjectModal();
            return;
        }
        
        // Get project container position
        const containerRect = projectContainer.getBoundingClientRect();
        
        // Set dropdown styles
        dropdown.style.cssText = `
            position: fixed;
            top: ${containerRect.bottom + 5}px;
            left: ${containerRect.left}px;
            width: 400px;
            max-height: 500px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            z-index: 1000;
            overflow: hidden;
            animation: dropdownSlideIn 0.2s ease-out;
        `;
        
        // Create dropdown content
        dropdown.innerHTML = `
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-xl mb-1">📋</div>
                        <h3 class="font-semibold">Select Project</h3>
                        <p class="text-sm text-blue-100">Choose a project to work with</p>
                    </div>
                    <button onclick="window.projectManager.removeProjectSelectionDropdown()" class="text-blue-100 hover:text-white transition-colors">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- Current Project Info -->
            <div class="p-4 border-b border-gray-200 bg-gray-50">
                <div class="text-sm text-gray-600 mb-2">Current Project:</div>
                <div class="flex items-center space-x-3">
                    <span class="text-2xl">${this.currentProject?.icon || '📋'}</span>
                    <div>
                        <div class="font-semibold text-gray-800">${this.currentProject?.name || 'None Selected'}</div>
                        <div class="text-sm text-gray-600">${this.currentProject?.description || 'No description'}</div>
                    </div>
                </div>
            </div>
            
            <!-- Project List -->
            <div class="p-4 max-h-80 overflow-y-auto">
                <div class="space-y-2">
                    ${this.projects.map(project => `
                        <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3 border-2 hover:bg-gray-100 transition-colors ${project.id === this.currentProject?.id ? 'border-blue-300 bg-blue-50' : 'border-transparent'}">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    ${project.icon || '📋'}
                                </div>
                                <div>
                                    <div class="font-semibold text-gray-800 text-sm">${project.name}</div>
                                    <div class="text-xs text-gray-600">${project.description || 'No description'}</div>
                                    ${project.isMaster ? '<div class="text-xs text-purple-600 font-medium">Master Project</div>' : ''}
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                ${project.id === this.currentProject?.id ? 
                                    '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Current</span>' : 
                                    '<button onclick="window.projectManager.selectProjectFromDropdown(\'' + project.id + '\')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">Select</button>'}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Action Buttons -->
                <div class="space-y-2 mt-4 pt-4 border-t border-gray-200">
                    <button onclick="window.projectManager.showProjectModal()" class="w-full bg-purple-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors text-left">
                        📋 Manage Projects
                    </button>
                    <button onclick="window.projectManager.showCreateProjectModal()" class="w-full bg-green-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors text-left">
                        ➕ Create New Project
                    </button>
                </div>
            </div>
        `;
        
        // Add dropdown to body
        document.body.appendChild(dropdown);
        
        // Add click outside to close
        setTimeout(() => {
            document.addEventListener('click', this.handleClickOutsideProjectDropdown);
        }, 100);
        
        // Add escape key to close
        document.addEventListener('keydown', this.handleEscapeKeyProjectDropdown);
        
        // Add window resize handler to reposition dropdown
        this.handleProjectDropdownResize = this.handleProjectDropdownResize.bind(this);
        window.addEventListener('resize', this.handleProjectDropdownResize);
        
        console.log('✅ Project selection dropdown displayed');
    }

    /**
     * Remove project selection dropdown
     */
    removeProjectSelectionDropdown() {
        const dropdown = document.getElementById('project-selection-dropdown');
        if (dropdown) {
            dropdown.remove();
            document.removeEventListener('click', this.handleClickOutsideProjectDropdown);
            document.removeEventListener('keydown', this.handleEscapeKeyProjectDropdown);
            window.removeEventListener('resize', this.handleProjectDropdownResize);
            console.log('✅ Project selection dropdown removed');
        }
    }

    /**
     * Handle click outside project dropdown to close it
     */
    handleClickOutsideProjectDropdown = (event) => {
        const dropdown = document.getElementById('project-selection-dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
            // Check if click is not on project selector elements
            const projectContainer = event.target.closest('.header-project-selector-container');
            if (!projectContainer) {
                this.removeProjectSelectionDropdown();
            }
        }
    }

    /**
     * Handle escape key to close project dropdown
     */
    handleEscapeKeyProjectDropdown = (event) => {
        if (event.key === 'Escape') {
            this.removeProjectSelectionDropdown();
        }
    }

    /**
     * Handle window resize to reposition project dropdown
     */
    handleProjectDropdownResize = () => {
        const dropdown = document.getElementById('project-selection-dropdown');
        const projectContainer = document.querySelector('.header-project-selector-container');
        
        if (dropdown && projectContainer) {
            const containerRect = projectContainer.getBoundingClientRect();
            
            // Update dropdown position
            dropdown.style.top = `${containerRect.bottom + 5}px`;
            dropdown.style.left = `${containerRect.left}px`;
            
            // Check if dropdown goes off-screen and adjust if needed
            const dropdownRect = dropdown.getBoundingClientRect();
            
            // Adjust if dropdown goes off the right edge
            if (dropdownRect.right > window.innerWidth - 16) {
                dropdown.style.left = `${window.innerWidth - dropdownRect.width - 16}px`;
            }
            
            // Adjust if dropdown goes off the left edge
            if (dropdownRect.left < 16) {
                dropdown.style.left = '16px';
            }
            
            // Adjust if dropdown goes off the bottom edge
            if (dropdownRect.bottom > window.innerHeight - 16) {
                dropdown.style.top = `${containerRect.top - dropdownRect.height - 5}px`;
            }
        }
    }

    /**
     * Select project from dropdown and close it
     */
    selectProjectFromDropdown(projectId) {
        console.log('📋 Selecting project from dropdown:', projectId);
        this.setCurrentProject(projectId);
        this.removeProjectSelectionDropdown();
    }
}

// Initialize the project management system
console.log('🚀 Creating ProjectManagementSystem instance...');
const projectManager = new ProjectManagementSystem();

// Make it globally available
console.log('🚀 Making projectManager globally available...');
window.projectManager = projectManager;
console.log('🚀 Global projectManager object:', window.projectManager);

// Global initialization function for all pages
window.initializeProjectManagement = function() {
    if (window.projectManager && !window.projectManager.initialized) {
        try {
            window.projectManager.init();
            console.log('✅ Project management system initialized globally');
        } catch (error) {
            console.warn('⚠️ Global project management initialization failed:', error);
        }
    }
    
    // Ensure current project is properly displayed on page load
    if (window.projectManager && window.projectManager.currentProject) {
        setTimeout(() => {
            try {
                // Force update all project UI elements
                if (window.forceUpdateProjectUI) {
                    window.forceUpdateProjectUI();
                }
                
                // Ensure project selectors show the correct selection
                const projectSelectors = document.querySelectorAll('#header-project-selector, #mobile-project-selector');
                projectSelectors.forEach(selector => {
                    if (selector && window.projectManager.currentProject) {
                        selector.value = window.projectManager.currentProject.id;
                    }
                });
                
                console.log('✅ Page project display synchronized on load');
            } catch (error) {
                console.warn('⚠️ Page project display sync failed:', error);
            }
        }, 100); // Small delay to ensure DOM is ready
    }
};

// Global function to initialize projects for a new user
window.initializeProjectsForNewUser = function(userId) {
    if (window.projectManager) {
        try {
            const success = window.projectManager.initializeForNewUser(userId);
            if (success) {
                console.log('✅ Projects initialized for new user:', userId);
            } else {
                console.warn('⚠️ Failed to initialize projects for new user:', userId);
            }
            return success;
        } catch (error) {
            console.error('❌ Error initializing projects for new user:', error);
            return false;
        }
    } else {
        console.warn('⚠️ Project manager not available');
        return false;
    }
};

// Global project synchronization function
window.syncProjectSelection = function() {
    if (window.projectManager && window.projectManager.currentProject) {
        try {
            // Update all project selectors on the page
            window.projectManager.updateProjectUI();
            
            // Ensure the current project is properly selected in all dropdowns
            const projectSelectors = document.querySelectorAll('#header-project-selector, #mobile-project-selector');
            projectSelectors.forEach(selector => {
                if (selector && window.projectManager.currentProject) {
                    selector.value = window.projectManager.currentProject.id;
                }
            });
            
            console.log('✅ Project selection synchronized across page');
        } catch (error) {
            console.warn('⚠️ Project synchronization failed:', error);
        }
    }
};

// Global function to force update all project UI elements
window.forceUpdateProjectUI = function() {
    if (window.projectManager) {
        try {
            // Force update all project UI elements
            window.projectManager.updateProjectUI();
            
            // Also update any custom project displays
            const customProjectDisplays = document.querySelectorAll('[data-project-display]');
            customProjectDisplays.forEach(element => {
                // Update custom project displays if they have update methods
                if (element.updateProjectDisplay && typeof element.updateProjectDisplay === 'function') {
                    element.updateProjectDisplay();
                }
            });
            
            console.log('✅ Project UI force updated');
        } catch (error) {
            console.warn('⚠️ Force update project UI failed:', error);
        }
    }
};

// Global function to show project selection dropdown
window.showProjectSelectionDropdown = function() {
    if (window.projectManager) {
        try {
            window.projectManager.showProjectSelectionDropdown();
            console.log('✅ Project selection dropdown shown globally');
        } catch (error) {
            console.warn('⚠️ Failed to show project selection dropdown:', error);
            // Fallback to modal
            window.projectManager.showProjectModal();
        }
    } else {
        console.warn('⚠️ Project manager not available');
    }
};

// Global function to manually synchronize project selection across the page
window.syncProjectSelectionAcrossPage = function() {
    if (window.projectManager) {
        try {
            // Synchronize all project selectors
            window.projectManager.synchronizeAllProjectSelectors();
            
            // Update any page-specific project displays
            if (window.projectManager.currentProject) {
                updatePageProjectDisplays({
                    project: window.projectManager.currentProject,
                    isMaster: window.projectManager.isMasterProject()
                });
            }
            
            console.log('✅ Project selection synchronized across entire page');
        } catch (error) {
            console.warn('⚠️ Page-wide project synchronization failed:', error);
        }
    } else {
        console.warn('⚠️ Project manager not available for page synchronization');
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initializeProjectManagement);
} else {
    // DOM is already ready
    window.initializeProjectManagement();
}

// Global project change listener for all pages
window.addEventListener('projectChanged', function(event) {
    console.log('🔄 Project change event received:', event.detail);
    
    // Force update all project UI elements on the page
    if (window.forceUpdateProjectUI) {
        window.forceUpdateProjectUI();
    }
    
    // Update any page-specific project displays
    updatePageProjectDisplays(event.detail);
});

// Function to update page-specific project displays
function updatePageProjectDisplays(projectDetail) {
    try {
        // Update any elements with data-project-current attribute
        const currentProjectElements = document.querySelectorAll('[data-project-current]');
        currentProjectElements.forEach(element => {
            if (projectDetail.project) {
                element.textContent = projectDetail.project.name;
                element.className = element.className.replace(/current-project-\w+/g, '') + ' current-project-' + projectDetail.project.id;
            }
        });
        
        // Update any elements with data-project-status attribute
        const projectStatusElements = document.querySelectorAll('[data-project-status]');
        projectStatusElements.forEach(element => {
            if (projectDetail.project) {
                element.textContent = projectDetail.isMaster ? 'Master Project' : 'Project: ' + projectDetail.project.name;
            }
        });
        
        // Update any project context headers
        const projectContextHeaders = document.querySelectorAll('[data-project-context-header]');
        projectContextHeaders.forEach(element => {
            if (projectDetail.project) {
                element.textContent = `Working in: ${projectDetail.project.name}`;
                element.className = element.className.replace(/context-header-\w+/g, '') + ' context-header-' + projectDetail.project.id;
            }
        });
        
        console.log('✅ Page-specific project displays updated');
    } catch (error) {
        console.warn('⚠️ Error updating page-specific project displays:', error);
    }
}

// Create global instance
window.projectManager = new ProjectManagementSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectManagementSystem;
}
