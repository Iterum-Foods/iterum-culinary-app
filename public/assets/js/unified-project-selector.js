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

    // Must match project-management-system.js getUserStorageKey('iterum_projects')
    this.STORAGE_KEYS = {
      PROJECTS: 'iterum_projects_user_', // + userId — canonical list (was iterum_projects_ which broke sync)
      CURRENT_PROJECT: 'iterum_current_project_user_' // + userId
    };

    this.init();
  }

  /**
   * Initialize the selector
   */
  async init() {
    if (this.initialized) {
      return;
    }

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
    return new Promise(resolve => {
      const checkAuth = () => {
        if (window.authManager?.currentUser) {
          this.currentUserId =
            window.authManager.currentUser.userId ||
            window.authManager.currentUser.id;
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

    // Canonical key (same as ProjectManagementSystem)
    let projectsKey = `${this.STORAGE_KEYS.PROJECTS}${this.currentUserId}`;
    let projectsJson = localStorage.getItem(projectsKey);

    // Legacy: unified selector used iterum_projects_${uid} without _user_
    if (!projectsJson) {
      const legacyUnifiedKey = `iterum_projects_${this.currentUserId}`;
      projectsJson = localStorage.getItem(legacyUnifiedKey);
      if (projectsJson) {
        console.log(
          '📦 Migrating projects from legacy unified key → iterum_projects_user_*'
        );
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
          const userProjects = globalProjects.filter(
            p =>
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
    if (!this.currentUserId) {
      return;
    }

    const projectsKey = `${this.STORAGE_KEYS.PROJECTS}${this.currentUserId}`;
    localStorage.setItem(projectsKey, JSON.stringify(this.projects));
    console.log('💾 Projects saved');
  }

  /**
   * Load current project
   */
  loadCurrentProject() {
    if (!this.currentUserId) {
      return;
    }

    const currentProjectKey = `${this.STORAGE_KEYS.CURRENT_PROJECT}${this.currentUserId}`;
    this.currentProjectId = localStorage.getItem(currentProjectKey) || 'master';

    console.log('📋 Current project:', this.currentProjectId);
  }

  /**
   * Set current project
   */
  setCurrentProject(projectId) {
    if (!this.currentUserId) {
      return;
    }

    console.log(`🔄 Switching to project: ${projectId}`);

    const resolvedProject = this.projects.find(p => p.id === projectId);
    const pm = window.projectManager;

    if (pm && typeof pm.setCurrentProject === 'function') {
      pm.currentUserId = this.currentUserId;
      pm.loadProjects();
      if (Array.isArray(pm.projects) && pm.projects.length) {
        this.projects = pm.projects;
      }
      if (!pm.setCurrentProject(projectId)) {
        console.warn('Project manager could not activate project:', projectId);
        return;
      }
      this.currentProjectId = pm.currentProject?.id || projectId;
    } else {
      this.currentProjectId = projectId;
      const currentProjectKey = `${this.STORAGE_KEYS.CURRENT_PROJECT}${this.currentUserId}`;
      localStorage.setItem(currentProjectKey, projectId);
      localStorage.setItem('iterum_current_project', projectId);
      localStorage.setItem(
        `iterum_current_project_${this.currentUserId}`,
        projectId
      );
      localStorage.setItem('active_project_id', projectId);
      localStorage.setItem('active_project_name', resolvedProject?.name || '');
      localStorage.setItem('active_project', projectId);

      if (pm) {
        pm.currentProject = resolvedProject || null;
        pm.currentProjectId = projectId;
        if (typeof pm.updateProjectUI === 'function') {
          pm.updateProjectUI();
        }
      }

      document.dispatchEvent(
        new CustomEvent('projectChanged', {
          bubbles: true,
          detail: {
            projectId,
            project: resolvedProject,
            userId: this.currentUserId
          }
        })
      );
    }

    if (window.statePersistenceManager) {
      window.statePersistenceManager.loadProjectState();
    }

    const displayProject = (pm && pm.currentProject) || resolvedProject || null;
    this.updateSelectorUI();
    this.reloadPageData();

    // Show notification
    this.showNotification(
      `✅ Switched to project: ${displayProject?.name || projectId}`
    );

    console.log('✅ Project changed to:', projectId, displayProject);
  }

  /**
   * Get current project
   */
  getCurrentProject() {
    return (
      this.projects.find(p => p.id === this.currentProjectId) ||
      this.projects[0]
    );
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

  getSelectableProjects() {
    const pm = window.projectManager;
    if (pm && typeof pm.getSelectableRestaurantProjects === 'function') {
      return pm.getSelectableRestaurantProjects();
    }
    return this.projects.filter(
      p =>
        p.id !== 'master' &&
        p.type === 'restaurant' &&
        !p.isArchived &&
        p.status !== 'archived'
    );
  }

  /**
   * Get selector HTML
   */
  getSelectorHTML() {
    const currentProject = this.getCurrentProject();
    const currentName = currentProject?.name || 'Master Project';
    const currentIcon = currentProject?.icon || '📋';

    const projectRows = this.getSelectableProjects()
      .map(project => {
        const active = project.id === this.currentProjectId;
        const safeId = String(project.id || '').replace(/'/g, "\\'");
        const name = project.name || 'Untitled';
        const desc = project.description || 'No description';
        return `
                        <button type="button" class="tc-project-option${active ? ' is-active' : ''}" data-project-id="${project.id}"
                          onclick="window.unifiedProjectSelector.setCurrentProject('${safeId}')">
                            <span class="tc-project-option__icon" aria-hidden="true">${project.icon || '📋'}</span>
                            <span class="tc-project-option__body">
                              <span class="tc-project-option__name">${name}</span>
                              <span class="tc-project-option__desc">${desc}</span>
                            </span>
                            ${active ? '<span class="tc-project-option__check" aria-hidden="true">✓</span>' : ''}
                        </button>`;
      })
      .join('');

    return `
            <div class="tc-project-select">
              <button type="button" class="tc-project-select__trigger project-selector-unified"
                onclick="window.unifiedProjectSelector?.toggleDropdown()"
                aria-haspopup="listbox" aria-expanded="false" id="project-select-trigger">
                <span class="tc-project-select__trigger-icon" aria-hidden="true">${currentIcon}</span>
                <span class="tc-project-select__trigger-text">
                  <span class="tc-project-select__label">Current project</span>
                  <span class="tc-project-select__name">${currentName}</span>
                </span>
                <i class="fa-solid fa-chevron-down tc-project-select__chevron" aria-hidden="true"></i>
              </button>
              <div id="project-dropdown" class="tc-project-select__menu" role="listbox" aria-label="Your projects" hidden>
                <div class="tc-project-select__menu-head">
                  <p class="tc-project-select__menu-title">Your projects</p>
                  <p class="tc-project-select__menu-sub">Select a workspace</p>
                </div>
                <div id="project-list" class="tc-project-select__list">
                    ${projectRows}
                </div>
                <div class="tc-project-select__menu-foot">
                    <button type="button" class="tc-project-select__create" onclick="window.unifiedProjectSelector.createNewProject()">
                      <i class="fa-solid fa-plus" aria-hidden="true"></i> Create new project
                    </button>
                </div>
              </div>
            </div>
        `;
  }

  /**
   * Toggle dropdown
   */
  toggleDropdown() {
    const dropdown = document.getElementById('project-dropdown');
    const trigger = document.getElementById('project-select-trigger');
    if (!dropdown) {
      return;
    }
    const open = dropdown.hidden;
    dropdown.hidden = !open;
    if (trigger) {
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      trigger.classList.toggle('is-open', open);
    }
    dropdown.classList.toggle('is-open', open);
  }

  /**
   * Close dropdown
   */
  closeDropdown() {
    const dropdown = document.getElementById('project-dropdown');
    const trigger = document.getElementById('project-select-trigger');
    if (dropdown) {
      dropdown.hidden = true;
      dropdown.classList.remove('is-open');
    }
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.classList.remove('open');
      trigger.classList.remove('is-open');
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close dropdown when clicking outside
    document.addEventListener('click', e => {
      const root = document.querySelector('.tc-project-select');
      const dropdown = document.getElementById('project-dropdown');

      if (root && dropdown && !root.contains(e.target)) {
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
    const projectName = prompt('Restaurant name (new workspace):');
    if (!projectName) {
      return;
    }

    if (
      window.projectManager &&
      typeof window.projectManager.createProject === 'function'
    ) {
      const project = window.projectManager.createProject({
        name: projectName.trim(),
        description: 'Restaurant workspace',
        type: 'restaurant',
        icon: '🍽️'
      });
      if (project) {
        this.loadProjects();
        this.setCurrentProject(project.id);
      }
      return;
    }

    const newProject = {
      id: `project_${Date.now()}`,
      name: projectName.trim(),
      icon: '🍽️',
      type: 'restaurant',
      description: 'Restaurant workspace',
      createdAt: new Date().toISOString()
    };

    this.projects.push(newProject);
    this.saveProjects();
    this.setCurrentProject(newProject.id);
  }

  /**
   * Reload page data for current project
   */
  reloadPageData() {
    console.log('🔄 Reloading page data for current project...');

    const path = `${window.location.pathname} ${window.location.href}`;

    if (
      /recipe-library/i.test(path) &&
      typeof window.loadRecipes === 'function'
    ) {
      setTimeout(() => window.loadRecipes(), 100);
    }

    if (/menu-builder/i.test(path) && window.loadMenuData) {
      setTimeout(() => window.loadMenuData(), 100);
    }

    if (/vendor-management/i.test(path) && window.vendorManager) {
      setTimeout(() => window.vendorManager.loadVendors(), 100);
    }

    if (
      /ingredients/i.test(path) &&
      typeof window.displayIngredients === 'function'
    ) {
      setTimeout(() => window.displayIngredients(), 100);
    }

    if (
      /index\.html|^\/$|\/dashboard/i.test(
        `${window.location.pathname} ${window.location.href}`
      )
    ) {
      if (typeof window.updateDashboardStats === 'function') {
        setTimeout(() => window.updateDashboardStats(), 100);
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
    window.addEventListener('storage', e => {
      if (
        e.key?.includes('iterum_projects_') ||
        e.key?.includes('iterum_current_project_')
      ) {
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
