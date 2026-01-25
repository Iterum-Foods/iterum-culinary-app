// Menu Operations Dashboard Checklist
// Surfaces menu → recipe → prep → FOH workflow status on the main dashboard

class MenuOpsDashboard {
  constructor(options = {}) {
    this.containerId = options.containerId || 'menu-ops-dashboard-card';
    this.refreshThrottleMs = options.refreshThrottleMs || 1500;
    this.lastRefresh = 0;
    this.state = {
      projectId: 'master',
      menu: null,
      menuItems: [],
      links: {},
      prepPlan: null,
      fohBriefing: null,
      statuses: [],
      warnings: [],
      progress: 0
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.warn(`⚠️ MenuOpsDashboard container #${this.containerId} not found.`);
      return;
    }

    this.renderSkeleton();
    this.refresh(true);
    this.bindEvents();
    this.startAutoRefresh();
  }

  bindEvents() {
    window.addEventListener('storage', (event) => {
      if (!event.key) return;
      if (event.key.startsWith('menu_data') || event.key === 'menu_recipe_links' || event.key === 'recipe_stubs') {
        this.refresh();
      }
    });

    document.addEventListener('projectChanged', () => this.refresh(true));
    document.addEventListener('recipesUpdated', () => this.refresh());
    document.addEventListener('recipeLibraryUpdated', () => this.refresh());
    document.addEventListener('menuWorkflowUpdated', () => this.refresh());
  }

  refresh(force = false) {
    const now = Date.now();
    if (!force && now - this.lastRefresh < this.refreshThrottleMs) {
      return;
    }
    this.lastRefresh = now;

    try {
      this.state.projectId = this.getCurrentProjectId();
      const { menu, items } = this.loadMenuData(this.state.projectId);
      this.state.menu = menu;
      this.state.menuItems = items;
      this.state.links = this.getMenuRecipeLinks();
      this.state.prepPlan = this.buildPrepPlan(menu, items);
      this.state.fohBriefing = this.buildFOHBriefing(menu, items);
      this.state.statuses = this.evaluateStatuses();
      this.state.warnings = this.collectWarnings();
      this.state.progress = this.calculateProgress(this.state.statuses);
      this.render();
    } catch (error) {
      console.error('❌ MenuOpsDashboard refresh error:', error);
      this.renderError(error);
    }
  }

  startAutoRefresh() {
    this.stopAutoRefresh();
    const interval = Math.max(this.refreshThrottleMs * 2, 5000);
    this.autoRefreshTimer = setInterval(() => {
      this.refresh();
    }, interval);
  }

  stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  getCurrentProjectId() {
    const projectManager = window.projectManager;
    if (projectManager?.currentProject?.id) {
      return projectManager.currentProject.id;
    }
    if (projectManager?.masterProjectId) {
      return projectManager.masterProjectId;
    }
    const stored = localStorage.getItem('active_project');
    if (stored) {
      return stored;
    }
    return 'master';
  }

  loadMenuData(projectId) {
    const storageKey = (window.enhancedMenuManager?.storageKey || 'menu_data') + '_' + projectId;
    const fallbackKey = `menu_${window.authManager?.currentUser?.id || ''}`;

    let raw = localStorage.getItem(storageKey);
    if (!raw && fallbackKey) {
      raw = localStorage.getItem(fallbackKey);
    }

    if (!raw) {
      return { menu: null, items: [] };
    }

    try {
      const parsed = JSON.parse(raw);
      const menu = parsed?.menu || parsed;
      const items = Array.isArray(parsed?.items) ? parsed.items : (parsed?.menuItems || []);
      return { menu, items };
    } catch (error) {
      console.warn('⚠️ Unable to parse menu data:', error);
      return { menu: null, items: [] };
    }
  }

  getMenuRecipeLinks() {
    try {
      const raw = localStorage.getItem('menu_recipe_links');
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.warn('⚠️ Unable to parse recipe links:', error);
      return {};
    }
  }

  buildPrepPlan(menu, items) {
    if (!window.menuPrepManager || !items.length) {
      return null;
    }

    try {
      return window.menuPrepManager.generatePrepPlan({
        projectId: this.state.projectId,
        menu: menu || { name: 'Menu' },
        menuItems: items,
        recipes: window.universalRecipeManager?.getRecipeLibrary?.() || [],
        serviceDate: new Date()
      });
    } catch (error) {
      console.warn('⚠️ Prep plan generation failed:', error);
      return null;
    }
  }

  buildFOHBriefing(menu, items) {
    if (!window.menuFOHManager || !items.length) {
      return null;
    }

    try {
      return window.menuFOHManager.generateSheet({
        projectId: this.state.projectId,
        menu: menu || { name: 'Menu' },
        menuItems: items,
        recipes: window.universalRecipeManager?.getRecipeLibrary?.() || [],
        serviceDate: new Date()
      });
    } catch (error) {
      console.warn('⚠️ FOH briefing generation failed:', error);
      return null;
    }
  }

  evaluateStatuses() {
    const items = this.state.menuItems;
    const menu = this.state.menu;
    const links = this.state.links || {};
    const prepPlan = this.state.prepPlan;
    const foh = this.state.fohBriefing;

    const itemCount = items.length;
    const linkedCount = items.filter((item) => !!links[item.id]).length;

    const recipesMissing = itemCount - linkedCount;
    const prepTasks = prepPlan ? Object.values(prepPlan.stations || {}).reduce((acc, station) => acc + (station.tasks?.length || 0), 0) : 0;
    const prepWarnings = prepPlan?.warnings?.length || 0;
    const fohCourses = foh ? (foh.courses || []).reduce((acc, course) => acc + course.items.length, 0) : 0;
    const fohWarnings = foh?.warnings?.length || 0;

    const statuses = [
      {
        id: 'menu_draft',
        title: 'Draft Menu',
        description: itemCount ? `${itemCount} dish${itemCount === 1 ? '' : 'es'} on this menu.` : 'Add dishes to your current menu.',
        complete: itemCount > 0,
        metric: `${itemCount} items`,
        action: { label: 'Open Menu Builder', href: 'menu-builder.html' }
      },
      {
        id: 'recipes_linked',
        title: 'Recipes Linked',
        description: recipesMissing === 0 && itemCount ? 'All dishes have recipes linked or drafted.' : `${linkedCount}/${itemCount} dishes linked to recipes.`,
        complete: itemCount > 0 && recipesMissing === 0,
        metric: `${linkedCount}/${itemCount}`,
        action: { label: 'Link Recipes', href: 'menu-builder.html#linking' }
      },
      {
        id: 'prep_ready',
        title: 'Prep Plan Ready',
        description: prepPlan
          ? prepTasks
            ? `${prepTasks} prep tasks queued across ${Object.keys(prepPlan.stations || {}).length} station${Object.keys(prepPlan.stations || {}).length === 1 ? '' : 's'}.`
            : 'No prep tasks generated yet.'
          : 'Generate a prep plan from the Kitchen Management tools.',
        complete: !!prepPlan && prepTasks > 0 && prepWarnings === 0,
        metric: prepPlan ? `${prepTasks} tasks` : '—',
        action: { label: 'Review Prep Plan', href: 'kitchen-management.html?tab=prep' }
      },
      {
        id: 'foh_briefing',
        title: 'FOH Briefing',
        description: foh
          ? fohCourses
            ? `${fohCourses} talking points ready for front-of-house.`
            : 'FOH briefing generated but no talking points found.'
          : 'Generate a FOH information sheet for service.',
        complete: !!foh && fohCourses > 0 && fohWarnings === 0,
        metric: foh ? `${fohCourses} items` : '—',
        action: { label: 'Prep FOH Sheet', href: 'kitchen-management.html?tab=foh' }
      }
    ];

    return statuses;
  }

  collectWarnings() {
    const warnings = [];

    if (this.state.prepPlan?.warnings?.length) {
      warnings.push(...this.state.prepPlan.warnings.map((warning) => ({
        source: 'Prep Plan',
        message: warning.message || warning.type || 'Issue detected in prep plan.',
        itemName: warning.name
      })));
    }

    if (this.state.fohBriefing?.warnings?.length) {
      warnings.push(...this.state.fohBriefing.warnings.map((warning) => ({
        source: 'FOH Briefing',
        message: warning.message || warning.type || 'Issue detected in FOH briefing.',
        itemName: warning.name
      })));
    }

    const missingItems = this.state.menuItems.filter((item) => !this.state.links[item.id]);
    if (missingItems.length) {
      warnings.push({
        source: 'Recipe Linking',
        message: `${missingItems.length} menu item${missingItems.length === 1 ? '' : 's'} missing linked recipes.`,
        itemName: missingItems.slice(0, 3).map((item) => item.name).join(', ')
      });
    }

    return warnings;
  }

  calculateProgress(statuses) {
    if (!Array.isArray(statuses) || !statuses.length) return 0;
    const completeCount = statuses.filter((status) => status.complete).length;
    return Math.round((completeCount / statuses.length) * 100);
  }

  renderSkeleton() {
    this.container.innerHTML = `
      <div class="dashboard-card-header">
        <div>
          <div class="dashboard-card-title">Menu Ops Checklist</div>
          <div class="text-xs text-gray-500">Track menu ➜ recipe ➜ prep ➜ FOH workflow</div>
        </div>
      </div>
      <div class="text-sm text-gray-500">Preparing status...</div>
    `;
  }

  render() {
    const statuses = this.state.statuses;
    const warnings = this.state.warnings;
    const progress = this.state.progress;
    const menuName = this.state.menu?.name || 'Current Menu';

    const statusList = statuses.map((status) => {
      const icon = status.complete ? '✅' : '⬜️';
      const statusClass = status.complete ? 'color: #15803d;' : 'color: #0f172a;';
      return `
        <li style="display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="font-size: 1.25rem; min-width: 24px;">${icon}</div>
          <div style="flex: 1;">
            <div style="font-weight: 600; ${statusClass}">${status.title}</div>
            <div style="font-size: 0.9rem; color: #475569; margin-top: 4px;">${status.description}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.9rem; color: #1e293b; font-weight: 600;">${status.metric}</div>
            ${status.action ? `<a href="${status.action.href}" class="btn btn-sm btn-secondary" style="margin-top: 8px;">${status.action.label}</a>` : ''}
          </div>
        </li>
      `;
    }).join('');

    const warningList = warnings.length
      ? `
        <div style="margin-top: 16px; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px;">
          <div style="font-weight: 600; color: #b91c1c; margin-bottom: 8px;">Needs Attention</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 0.9rem; color: #b91c1c;">
            ${warnings.map((warning) => `<li>${warning.source}: ${warning.message}${warning.itemName ? ` <em>(${warning.itemName})</em>` : ''}</li>`).join('')}
          </ul>
        </div>
      `
      : '';

    this.container.innerHTML = `
      <div class="dashboard-card-header">
        <div>
          <div class="dashboard-card-title">Menu Ops Checklist</div>
          <div class="text-xs text-gray-500">${menuName} — Project ${this.state.projectId}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; font-size: 1.5rem;">${progress}%</div>
          <div style="font-size: 0.8rem; color: #94a3b8;">Workflow Complete</div>
        </div>
      </div>
      <div style="margin: 12px 0 16px; height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
        <div style="width: ${progress}%; height: 100%; background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%);"></div>
      </div>
      <ul style="list-style: none; margin: 0; padding: 0;">
        ${statusList}
      </ul>
      ${warningList}
      <div style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
        <a href="menu-builder.html" class="btn btn-secondary">🍽️ Menu Builder</a>
        <a href="kitchen-management.html?tab=prep" class="btn btn-secondary">🧾 Prep Lists</a>
        <a href="kitchen-management.html?tab=foh" class="btn btn-secondary">🛎️ FOH Sheets</a>
      </div>
    `;
  }

  renderError(error) {
    this.container.innerHTML = `
      <div class="dashboard-card-header">
        <div>
          <div class="dashboard-card-title">Menu Ops Checklist</div>
          <div class="text-xs text-gray-500">Unable to load workflow</div>
        </div>
      </div>
      <div style="padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; color: #b91c1c;">
        <strong>Error:</strong> ${error?.message || 'Unknown issue loading menu status.'}
      </div>
    `;
  }
}

window.menuOpsDashboard = new MenuOpsDashboard();
