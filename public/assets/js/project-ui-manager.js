/**
 * Project UI Manager - Beautiful Project Management Interface
 * Modern dropdown and modal popup for creating and managing projects
 */

class ProjectUIManager {
    constructor() {
        this.currentDropdown = null;
        this.currentModal = null;
    }

    /**
     * Show beautiful project dropdown
     */
    showProjectDropdown() {
        // Remove any existing dropdown
        this.closeDropdown();

        const dropdown = document.createElement('div');
        dropdown.id = 'project-dropdown-modern';
        dropdown.className = 'project-dropdown-modern';
        
        // Get current projects
        const projects = window.projectManager?.projects || [];
        const currentProject = window.projectManager?.currentProject;

        dropdown.innerHTML = `
            <div class="dropdown-content">
                <!-- Header -->
                <div class="dropdown-header">
                    <h3>Your Projects</h3>
                    <button class="dropdown-close" onclick="window.projectUIManager.closeDropdown()">✕</button>
                </div>

                <!-- Current Project -->
                ${currentProject ? `
                <div class="current-project-display">
                    <div class="current-label">Currently Active:</div>
                    <div class="current-name">📋 ${currentProject.name}</div>
                </div>
                ` : ''}

                <!-- Project List -->
                <div class="project-list">
                    ${projects.length > 0 ? projects.map(project => `
                        <div class="project-item ${project.id === currentProject?.id ? 'active' : ''}" 
                             onclick="window.projectUIManager.switchProject('${project.id}')">
                            <div class="project-item-main">
                                <div class="project-item-icon">
                                    ${project.type === 'master' ? '🏠' : '📁'}
                                </div>
                                <div class="project-item-info">
                                    <div class="project-item-name">${project.name}</div>
                                    <div class="project-item-meta">
                                        ${project.description || 'No description'}
                                    </div>
                                </div>
                            </div>
                            ${project.id === currentProject?.id ? 
                                '<div class="project-item-badge">✓ Active</div>' : 
                                '<div class="project-item-action">Switch →</div>'}
                        </div>
                    `).join('') : '<div class="no-projects">No projects yet</div>'}
                </div>

                <!-- Actions -->
                <div class="dropdown-actions">
                    <button class="action-btn primary" onclick="window.projectUIManager.showCreateModal()">
                        <span>➕</span>
                        <span>Create New Project</span>
                    </button>
                    <button class="action-btn secondary" onclick="window.projectUIManager.showManageModal()">
                        <span>⚙️</span>
                        <span>Manage Projects</span>
                    </button>
                </div>
            </div>
        `;

        // Add styles
        this.addDropdownStyles();

        // Position dropdown
        const projectSelector = document.querySelector('.header-project-selector-container') || 
                                document.querySelector('.project-selector-display');
        
        if (projectSelector) {
            document.body.appendChild(dropdown);
            this.positionDropdown(dropdown, projectSelector);
            this.currentDropdown = dropdown;

            // Close on outside click
            setTimeout(() => {
                document.addEventListener('click', this.handleOutsideClick.bind(this));
            }, 100);

            // Animate in
            setTimeout(() => dropdown.classList.add('show'), 10);
        }
    }

    /**
     * Position dropdown relative to trigger
     */
    positionDropdown(dropdown, trigger) {
        const rect = trigger.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = (rect.bottom + 8) + 'px';
        dropdown.style.right = '20px';
        dropdown.style.maxWidth = '400px';
    }

    /**
     * Close dropdown
     */
    closeDropdown() {
        if (this.currentDropdown) {
            this.currentDropdown.classList.remove('show');
            setTimeout(() => {
                this.currentDropdown?.remove();
                this.currentDropdown = null;
            }, 200);
        }
        document.removeEventListener('click', this.handleOutsideClick);
    }

    /**
     * Handle outside click
     */
    handleOutsideClick(event) {
        if (this.currentDropdown && !this.currentDropdown.contains(event.target) &&
            !event.target.closest('.header-project-selector-container') &&
            !event.target.closest('.project-selector-display')) {
            this.closeDropdown();
        }
    }

    /**
     * Switch to project
     */
    switchProject(projectId) {
        if (window.projectManager) {
            window.projectManager.setCurrentProject(projectId);
            window.projectManager.updateProjectUI();
            this.closeDropdown();

            // Track analytics
            if (window.analyticsTracker) {
                const project = window.projectManager.projects.find(p => p.id === projectId);
                window.analyticsTracker.trackProjectSwitched(projectId, project?.name);
            }
        }
    }

    /**
     * Show create project modal
     */
    showCreateModal() {
        this.closeDropdown();
        this.closeModal();

        const modal = document.createElement('div');
        modal.className = 'project-modal-overlay';
        
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="window.projectUIManager.closeModal()"></div>
            <div class="modal-content modal-create">
                <!-- Header -->
                <div class="modal-header">
                    <div>
                        <h2>Create New Project</h2>
                        <p>Organize your recipes, menus, and ingredients by project</p>
                    </div>
                    <button class="modal-close" onclick="window.projectUIManager.closeModal()">✕</button>
                </div>

                <!-- Body -->
                <div class="modal-body">
                    <form id="create-project-form" onsubmit="window.projectUIManager.handleCreateProject(event)">
                        <div class="form-group">
                            <label>Project Name <span class="required">*</span></label>
                            <input type="text" id="new-project-name" class="form-input" 
                                   placeholder="e.g., Summer Menu 2025, Dessert R&D" required>
                        </div>

                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="new-project-description" class="form-textarea" rows="3"
                                      placeholder="Brief description of this project..."></textarea>
                        </div>

                        <div class="form-group">
                            <label>Project Type</label>
                            <select id="new-project-type" class="form-select">
                                <option value="recipe">Recipe Development</option>
                                <option value="menu">Menu Planning</option>
                                <option value="research">Research & Testing</option>
                                <option value="event">Event/Catering</option>
                                <option value="seasonal">Seasonal Menu</option>
                                <option value="general">General</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="switch-to-new-project" checked>
                                <span>Switch to this project after creating</span>
                            </label>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="window.projectUIManager.closeModal()">
                                Cancel
                            </button>
                            <button type="submit" class="btn-primary">
                                <span>✓</span>
                                <span>Create Project</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.addModalStyles();
        document.body.appendChild(modal);
        this.currentModal = modal;

        // Animate in
        setTimeout(() => modal.classList.add('show'), 10);

        // Focus input
        setTimeout(() => document.getElementById('new-project-name')?.focus(), 100);
    }

    /**
     * Show manage projects modal
     */
    showManageModal() {
        this.closeDropdown();
        this.closeModal();

        const projects = window.projectManager?.projects || [];
        const currentProject = window.projectManager?.currentProject;

        const modal = document.createElement('div');
        modal.className = 'project-modal-overlay';
        
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="window.projectUIManager.closeModal()"></div>
            <div class="modal-content modal-manage">
                <!-- Header -->
                <div class="modal-header">
                    <div>
                        <h2>Manage Projects</h2>
                        <p>View, edit, or delete your projects</p>
                    </div>
                    <button class="modal-close" onclick="window.projectUIManager.closeModal()">✕</button>
                </div>

                <!-- Body -->
                <div class="modal-body">
                    ${projects.length > 0 ? `
                        <div class="project-grid">
                            ${projects.map(project => `
                                <div class="project-card ${project.id === currentProject?.id ? 'active' : ''}">
                                    <div class="project-card-icon">
                                        ${project.type === 'master' ? '🏠' : '📁'}
                                    </div>
                                    <div class="project-card-info">
                                        <h4>${project.name}</h4>
                                        <p>${project.description || 'No description'}</p>
                                        <div class="project-card-meta">
                                            <span>Type: ${project.type || 'general'}</span>
                                            <span>Created: ${new Date(project.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div class="project-card-actions">
                                        ${project.id === currentProject?.id ? 
                                            '<span class="active-badge">✓ Active</span>' : 
                                            `<button onclick="window.projectUIManager.switchProject('${project.id}')" class="btn-small primary">
                                                Switch
                                            </button>`}
                                        ${project.type !== 'master' ? `
                                            <button onclick="window.projectUIManager.editProject('${project.id}')" class="btn-small secondary">
                                                Edit
                                            </button>
                                            <button onclick="window.projectUIManager.deleteProject('${project.id}')" class="btn-small danger">
                                                Delete
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <div class="empty-icon">📁</div>
                            <h3>No Projects Yet</h3>
                            <p>Create your first project to organize your culinary work</p>
                            <button onclick="window.projectUIManager.showCreateModal()" class="btn-primary">
                                <span>➕</span>
                                <span>Create First Project</span>
                            </button>
                        </div>
                    `}

                    <div class="modal-footer">
                        <button onclick="window.projectUIManager.showCreateModal()" class="btn-primary">
                            <span>➕</span>
                            <span>Create New Project</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.addModalStyles();
        document.body.appendChild(modal);
        this.currentModal = modal;

        // Animate in
        setTimeout(() => modal.classList.add('show'), 10);
    }

    /**
     * Handle create project form submission
     */
    handleCreateProject(event) {
        event.preventDefault();

        const name = document.getElementById('new-project-name').value.trim();
        const description = document.getElementById('new-project-description').value.trim();
        const type = document.getElementById('new-project-type').value;
        const switchTo = document.getElementById('switch-to-new-project').checked;

        if (!name) {
            alert('Please enter a project name');
            return;
        }

        // Create project
        if (window.projectManager) {
            const projectId = 'project_' + Date.now();
            const project = {
                id: projectId,
                name: name,
                description: description,
                type: type,
                createdAt: new Date().toISOString(),
                isDefault: false
            };

            window.projectManager.projects.push(project);
            window.projectManager.saveProjects();

            if (switchTo) {
                window.projectManager.setCurrentProject(projectId);
            }

            window.projectManager.updateProjectUI();

            // Track analytics
            if (window.analyticsTracker) {
                window.analyticsTracker.trackProjectCreated(name);
            }

            // Show success
            this.showSuccessMessage('Project created successfully!');
            this.closeModal();
        }
    }

    /**
     * Edit project
     */
    editProject(projectId) {
        const project = window.projectManager?.projects.find(p => p.id === projectId);
        if (!project) return;

        this.closeModal();

        const modal = document.createElement('div');
        modal.className = 'project-modal-overlay';
        
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="window.projectUIManager.closeModal()"></div>
            <div class="modal-content modal-edit">
                <div class="modal-header">
                    <div>
                        <h2>Edit Project</h2>
                        <p>Update project details</p>
                    </div>
                    <button class="modal-close" onclick="window.projectUIManager.closeModal()">✕</button>
                </div>

                <div class="modal-body">
                    <form id="edit-project-form" onsubmit="window.projectUIManager.handleEditProject(event, '${projectId}')">
                        <div class="form-group">
                            <label>Project Name</label>
                            <input type="text" id="edit-project-name" class="form-input" 
                                   value="${project.name}" required>
                        </div>

                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="edit-project-description" class="form-textarea" rows="3">${project.description || ''}</textarea>
                        </div>

                        <div class="form-group">
                            <label>Project Type</label>
                            <select id="edit-project-type" class="form-select">
                                <option value="recipe" ${project.type === 'recipe' ? 'selected' : ''}>Recipe Development</option>
                                <option value="menu" ${project.type === 'menu' ? 'selected' : ''}>Menu Planning</option>
                                <option value="research" ${project.type === 'research' ? 'selected' : ''}>Research & Testing</option>
                                <option value="event" ${project.type === 'event' ? 'selected' : ''}>Event/Catering</option>
                                <option value="seasonal" ${project.type === 'seasonal' ? 'selected' : ''}>Seasonal Menu</option>
                                <option value="general" ${project.type === 'general' ? 'selected' : ''}>General</option>
                            </select>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="window.projectUIManager.closeModal()">
                                Cancel
                            </button>
                            <button type="submit" class="btn-primary">
                                <span>✓</span>
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.currentModal = modal;
        setTimeout(() => modal.classList.add('show'), 10);
    }

    /**
     * Handle edit project
     */
    handleEditProject(event, projectId) {
        event.preventDefault();

        const name = document.getElementById('edit-project-name').value.trim();
        const description = document.getElementById('edit-project-description').value.trim();
        const type = document.getElementById('edit-project-type').value;

        if (window.projectManager) {
            const project = window.projectManager.projects.find(p => p.id === projectId);
            if (project) {
                project.name = name;
                project.description = description;
                project.type = type;
                window.projectManager.saveProjects();
                window.projectManager.updateProjectUI();

                // Track analytics
                if (window.analyticsTracker) {
                    window.analyticsTracker.trackProjectEdited(projectId);
                }

                this.showSuccessMessage('Project updated successfully!');
                this.closeModal();
            }
        }
    }

    /**
     * Delete project
     */
    deleteProject(projectId) {
        const project = window.projectManager?.projects.find(p => p.id === projectId);
        if (!project) return;

        if (project.type === 'master') {
            alert('Cannot delete the Master Project');
            return;
        }

        if (confirm(`Are you sure you want to delete "${project.name}"?\n\nThis will not delete your data, just the project organization.`)) {
            if (window.projectManager) {
                window.projectManager.projects = window.projectManager.projects.filter(p => p.id !== projectId);
                window.projectManager.saveProjects();

                // If current project was deleted, switch to master
                if (window.projectManager.currentProject?.id === projectId) {
                    window.projectManager.setCurrentProject(window.projectManager.masterProjectId);
                }

                window.projectManager.updateProjectUI();

                // Track analytics
                if (window.analyticsTracker) {
                    window.analyticsTracker.trackProjectDeleted(projectId);
                }

                this.showSuccessMessage('Project deleted');
                this.closeModal();
                this.showManageModal();
            }
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        if (this.currentModal) {
            this.currentModal.classList.remove('show');
            setTimeout(() => {
                this.currentModal?.remove();
                this.currentModal = null;
            }, 200);
        }
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">✓</span>
                <span class="toast-message">${message}</span>
            </div>
        `;

        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Add dropdown styles
     */
    addDropdownStyles() {
        if (document.getElementById('project-dropdown-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'project-dropdown-styles';
        styles.textContent = `
            .project-dropdown-modern {
                position: fixed;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.2);
                min-width: 380px;
                max-width: 400px;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.2s ease;
                z-index: 9998;
                overflow: hidden;
            }

            .project-dropdown-modern.show {
                opacity: 1;
                transform: translateY(0);
            }

            .dropdown-content {
                padding: 0;
            }

            .dropdown-header {
                padding: 20px;
                background: linear-gradient(135deg, #4a7c2c 0%, #2d5a1a 100%);
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .dropdown-header h3 {
                font-size: 1.25rem;
                font-weight: 700;
                margin: 0;
            }

            .dropdown-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 20px;
                transition: all 0.2s;
            }

            .dropdown-close:hover {
                background: rgba(255,255,255,0.3);
            }

            .current-project-display {
                padding: 16px 20px;
                background: #f8fafc;
                border-bottom: 2px solid #e5e7eb;
            }

            .current-label {
                font-size: 0.75rem;
                color: #64748b;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 4px;
            }

            .current-name {
                font-size: 1rem;
                font-weight: 700;
                color: #1e293b;
            }

            .project-list {
                max-height: 400px;
                overflow-y: auto;
                padding: 8px;
            }

            .project-item {
                padding: 16px;
                border-radius: 12px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s;
                border: 2px solid transparent;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .project-item:hover {
                background: #f8fafc;
                border-color: #4a7c2c;
            }

            .project-item.active {
                background: #f0fdf4;
                border-color: #16a34a;
            }

            .project-item-main {
                display: flex;
                gap: 12px;
                flex: 1;
            }

            .project-item-icon {
                font-size: 24px;
            }

            .project-item-info {
                flex: 1;
            }

            .project-item-name {
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 4px;
            }

            .project-item-meta {
                font-size: 0.875rem;
                color: #64748b;
            }

            .project-item-badge {
                background: #16a34a;
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 700;
            }

            .project-item-action {
                color: #4a7c2c;
                font-weight: 600;
                font-size: 0.875rem;
            }

            .dropdown-actions {
                padding: 12px;
                background: #f8fafc;
                border-top: 2px solid #e5e7eb;
                display: flex;
                gap: 8px;
            }

            .action-btn {
                flex: 1;
                padding: 12px 16px;
                border-radius: 10px;
                border: none;
                font-weight: 600;
                font-size: 0.875rem;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }

            .action-btn.primary {
                background: linear-gradient(135deg, #4a7c2c 0%, #2d5a1a 100%);
                color: white;
            }

            .action-btn.primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(74,124,44,0.3);
            }

            .action-btn.secondary {
                background: #f3f4f6;
                color: #1e293b;
            }

            .action-btn.secondary:hover {
                background: #e5e7eb;
            }

            .no-projects {
                padding: 40px 20px;
                text-align: center;
                color: #64748b;
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Add modal styles
     */
    addModalStyles() {
        if (document.getElementById('project-modal-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'project-modal-styles';
        styles.textContent = `
            .project-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .project-modal-overlay.show {
                opacity: 1;
            }

            .modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(4px);
            }

            .modal-content {
                position: relative;
                background: white;
                border-radius: 20px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 25px 50px rgba(0,0,0,0.3);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }

            .project-modal-overlay.show .modal-content {
                transform: scale(1);
            }

            .modal-content.modal-manage {
                max-width: 900px;
            }

            .modal-header {
                padding: 30px;
                background: linear-gradient(135deg, #4a7c2c 0%, #2d5a1a 100%);
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }

            .modal-header h2 {
                font-size: 1.75rem;
                font-weight: 800;
                margin: 0 0 6px 0;
            }

            .modal-header p {
                font-size: 0.9375rem;
                opacity: 0.95;
                margin: 0;
            }

            .modal-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 24px;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .modal-close:hover {
                background: rgba(255,255,255,0.3);
            }

            .modal-body {
                padding: 30px;
                overflow-y: auto;
                max-height: calc(90vh - 140px);
            }

            .form-group {
                margin-bottom: 24px;
            }

            .form-group label {
                display: block;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 8px;
                font-size: 0.9375rem;
            }

            .required {
                color: #ef4444;
            }

            .form-input, .form-select, .form-textarea {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                font-size: 15px;
                font-family: 'Inter', sans-serif;
                transition: all 0.2s;
            }

            .form-input:focus, .form-select:focus, .form-textarea:focus {
                outline: none;
                border-color: #4a7c2c;
                box-shadow: 0 0 0 4px rgba(74,124,44,0.1);
            }

            .form-textarea {
                resize: vertical;
                min-height: 100px;
            }

            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                user-select: none;
            }

            .checkbox-label input[type="checkbox"] {
                width: 20px;
                height: 20px;
                cursor: pointer;
            }

            .modal-actions {
                display: flex;
                gap: 12px;
                margin-top: 30px;
                justify-content: flex-end;
            }

            .btn-primary, .btn-secondary, .btn-small {
                padding: 12px 24px;
                border-radius: 10px;
                border: none;
                font-weight: 600;
                font-size: 15px;
                cursor: pointer;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .btn-primary {
                background: linear-gradient(135deg, #4a7c2c 0%, #2d5a1a 100%);
                color: white;
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(74,124,44,0.3);
            }

            .btn-secondary {
                background: #f3f4f6;
                color: #1e293b;
            }

            .btn-secondary:hover {
                background: #e5e7eb;
            }

            .btn-small {
                padding: 6px 12px;
                font-size: 0.8125rem;
            }

            .btn-small.danger {
                background: #fee2e2;
                color: #991b1b;
            }

            .btn-small.danger:hover {
                background: #fecaca;
            }

            .project-grid {
                display: grid;
                gap: 16px;
            }

            .project-card {
                padding: 20px;
                border-radius: 12px;
                border: 2px solid #e5e7eb;
                transition: all 0.2s;
            }

            .project-card.active {
                background: #f0fdf4;
                border-color: #16a34a;
            }

            .project-card-icon {
                font-size: 32px;
                margin-bottom: 12px;
            }

            .project-card-info h4 {
                font-size: 1.125rem;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 8px;
            }

            .project-card-info p {
                color: #64748b;
                font-size: 0.9375rem;
                margin-bottom: 12px;
            }

            .project-card-meta {
                display: flex;
                gap: 12px;
                font-size: 0.8125rem;
                color: #64748b;
            }

            .project-card-actions {
                display: flex;
                gap: 8px;
                margin-top: 16px;
                flex-wrap: wrap;
            }

            .active-badge {
                background: #16a34a;
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.8125rem;
                font-weight: 700;
            }

            .empty-state {
                text-align: center;
                padding: 60px 20px;
            }

            .empty-icon {
                font-size: 80px;
                margin-bottom: 20px;
            }

            .empty-state h3 {
                font-size: 1.5rem;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 10px;
            }

            .empty-state p {
                color: #64748b;
                margin-bottom: 30px;
            }

            .modal-footer {
                padding: 20px;
                background: #f8fafc;
                border-top: 2px solid #e5e7eb;
                margin-top: 20px;
            }

            .success-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                padding: 16px 20px;
                z-index: 10000;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            }

            .success-toast.show {
                opacity: 1;
                transform: translateX(0);
            }

            .toast-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .toast-icon {
                width: 32px;
                height: 32px;
                background: #16a34a;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 18px;
            }

            .toast-message {
                font-weight: 600;
                color: #1e293b;
            }
        `;

        document.head.appendChild(styles);
    }
}

// Create global instance
window.projectUIManager = new ProjectUIManager();

// Global shortcut functions
window.showProjectSelectionDropdown = function() {
    window.projectUIManager.showProjectDropdown();
};

