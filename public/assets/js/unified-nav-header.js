/**
 * Unified Navigation Header
 * Provides consistent navigation across all pages
 */

/** Bump when sidebar HTML or menu structure changes (forces rebuild on cached pages). */
const ITERUM_NAV_VERSION = '2026-05-21-tc-sidebar-contrast-v2';

class UnifiedNavHeader {
  constructor() {
    this.currentPage = this.detectCurrentPage();
    this.init();
  }

  detectCurrentPage() {
    const path = (window.location.pathname || '').toLowerCase();
    if (path.includes('index') || path.includes('dashboard')) {
      const hash = (window.location.hash || '').toLowerCase();
      if (hash.includes('temp')) {
        return 'temperature';
      }
      if (hash.includes('haccp')) {
        return 'haccp';
      }
      return 'dashboard';
    }
    if (path.includes('restaurant-group-onboarding')) {
      return 'rgo';
    }
    if (path.includes('bulk-ingredient-import')) {
      return 'import_ing';
    }
    if (path.includes('bulk-recipe-import')) {
      return 'import_recipe';
    }
    if (path.includes('recipe-scaling-tool')) {
      return 'scaling';
    }
    if (path.includes('recipe-photo-studio')) {
      return 'photo';
    }
    if (path.includes('recipe-canvas')) {
      return 'canvas';
    }
    if (path.includes('data-management-dashboard')) {
      return 'datamgmt';
    }
    if (path.includes('data-backup')) {
      return 'backup';
    }
    if (path.includes('vendor-price-comparison')) {
      return 'vendorprice';
    }
    if (path.includes('production-planning')) {
      return 'reports';
    }
    if (path.includes('project-hub')) {
      return 'team';
    }
    if (path.includes('contact_management')) {
      return 'crm';
    }
    if (path.includes('user_management')) {
      return 'admin';
    }
    if (path.includes('recipe-library')) {
      return 'recipes';
    }
    if (path.includes('recipe-developer')) {
      return 'developer';
    }
    if (path.includes('menu-builder')) {
      return 'menu';
    }
    if (path.includes('calendar')) {
      return 'calendar';
    }
    if (path.includes('kitchen-management')) {
      return 'kitchen';
    }
    if (path.includes('mobile-compliance')) {
      return 'shift';
    }
    if (path.includes('inventory-variance')) {
      return 'invvar';
    }
    if (path.includes('inventory')) {
      return 'inventory';
    }
    if (path.includes('vendor-management')) {
      return 'vendors';
    }
    if (path.includes('equipment-management')) {
      return 'equipment';
    }
    if (path.includes('ingredients')) {
      return 'ingredients';
    }
    if (path.includes('user-profile')) {
      return 'profile';
    }
    if (path.includes('ingredient-highlights')) {
      return 'highlights';
    }
    if (path.includes('server-info')) {
      return 'server';
    }
    if (path.includes('audit-log')) {
      return 'audit';
    }
    if (path.includes('spec-library')) {
      return 'spec_library';
    }
    if (path.includes('setup')) {
      return 'setup';
    }
    return 'other';
  }

  navPageActive(slug) {
    return this.currentPage === slug ? 'active' : '';
  }

  moreMenuActiveClass() {
    const inMore = [
      'highlights',
      'server',
      'spec_library',
      'vendorprice',
      'equipment',
      'production',
      'reports',
      'team',
      'haccp',
      'temperature',
      'import_recipe',
      'import_ing',
      'rgo',
      'datamgmt',
      'backup',
      'audit',
      'profile',
      'setup',
      'invvar',
      'crm',
      'admin'
    ];
    return inMore.indexOf(this.currentPage) >= 0 ? 'active' : '';
  }

  /** Only skip when a page opts out explicitly (auth, marketing, embeds). */
  shouldSkipUnifiedNav() {
    return document.body?.getAttribute('data-no-unified-nav') === 'true';
  }

  ensureFontAwesome() {
    if (
      document.querySelector(
        'link[href*="font-awesome"], link[href*="fontawesome"]'
      )
    ) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
    link.crossOrigin = 'anonymous';
    link.referrerPolicy = 'no-referrer';
    document.head.appendChild(link);
  }

  ensureAppShell() {
    if (this.shouldSkipUnifiedNav()) {
      return;
    }
    document.body.classList.add('tc-revamp-body', 'iterum-has-sidebar');
    this.ensureCanonicalStyles();
    this.ensureCompanionScripts();
  }

  ensureCanonicalStyles() {
    if (
      document.querySelector('link[href*="iterum-canonical-app.css"]')
    ) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'assets/css/iterum-canonical-app.css';
    document.head.appendChild(link);
  }

  ensureCompanionScripts() {
    const load = (src, test) => {
      if (test()) {
        return;
      }
      if (document.querySelector('script[src="' + src + '"]')) {
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.defer = true;
      document.head.appendChild(s);
    };
    load('assets/js/project-management-system.js', () => window.projectManager);
    load('assets/js/unified-project-selector.js', () => window.unifiedProjectSelector);
  }

  unwrapMainContent() {
    const wrapper = document.querySelector('.main-content-wrapper');
    if (!wrapper) {
      return;
    }
    const sidebar = document.querySelector('.unified-nav-sidebar');
    const children = Array.from(wrapper.children);
    children.forEach(child => {
      if (sidebar && child === sidebar) {
        return;
      }
      document.body.appendChild(child);
    });
    wrapper.remove();
  }

  removeStaleSidebar() {
    const sidebar = document.querySelector('.unified-nav-sidebar');
    if (!sidebar) {
      return false;
    }
    if (sidebar.getAttribute('data-nav-version') === ITERUM_NAV_VERSION) {
      return false;
    }
    sidebar.remove();
    this.unwrapMainContent();
    return true;
  }

  init() {
    if (this.shouldSkipUnifiedNav()) {
      console.log('Unified nav: skipped (data-no-unified-nav)');
      return;
    }

    this.ensureAppShell();

    const sidebar = document.querySelector('.unified-nav-sidebar');
    if (sidebar && sidebar.getAttribute('data-nav-version') === ITERUM_NAV_VERSION) {
      this.ensureMainContentWrapper();
      this.injectStyles();
      this.syncSidebarCollapseFromStorage();
      this.setupSidebarCollapse();
      return;
    }

    if (sidebar) {
      this.removeStaleSidebar();
    }

    this.injectHeader();
  }

  ensureMainContentWrapper() {
    const sidebar = document.querySelector('.unified-nav-sidebar');
    if (!sidebar) {
      return;
    }
    if (document.querySelector('.main-content-wrapper')) {
      return;
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'main-content-wrapper';
    const children = Array.from(document.body.children);
    children.forEach(child => {
      if (
        child !== sidebar &&
        !child.classList.contains('main-content-wrapper')
      ) {
        wrapper.appendChild(child);
      }
    });
    document.body.appendChild(wrapper);
  }

  finalizeSidebarSetup() {
    this.injectStyles();
    this.syncSidebarCollapseFromStorage();
    this.setupSidebarCollapse();
    this.setupDropdownHover();
    this.setupDropdownClickToggle();
    this.setupSignOutLink();
    this.setupMobileToggle();
    this.setupMobileNavLinkClose();
    this.ensureUserRoleSetup();
    this.initNavContextBar();
  }

  syncSidebarCollapseFromStorage() {
    const sidebar = document.querySelector('.unified-nav-sidebar');
    if (!sidebar) {
      return;
    }
    const collapsed = localStorage.getItem('iterum_sidebar_collapsed') === '1';
    sidebar.classList.toggle('is-collapsed', collapsed);
    document.body.classList.toggle('sidebar-collapsed', collapsed);
  }

  injectHeader() {
    if (this.shouldSkipUnifiedNav()) {
      return;
    }

    if (document.querySelector('.unified-nav-sidebar')) {
      return;
    }

    this.ensureFontAwesome();

    const sidebar = document.createElement('aside');
    sidebar.className = 'unified-nav-sidebar';
    sidebar.setAttribute('data-nav-version', ITERUM_NAV_VERSION);
    sidebar.innerHTML = this.getSidebarHTML();

    // Insert at start of body
    document.body.insertBefore(sidebar, document.body.firstChild);

    this.ensureMainContentWrapper();

    this.finalizeSidebarSetup();

    this.injectWorkspaceFeaturesScript();
    this.injectRestaurantLocationSidebarScript();
    this.injectHelpChefWidgetScript();

    console.log('✅ Navigation sidebar injected');
  }

  injectHelpChefWidgetScript() {
    if (window.__iterumHelpChefScriptLoading) {
      return;
    }
    window.__iterumHelpChefScriptLoading = true;
    const s = document.createElement('script');
    s.src = 'assets/js/help-chef-widget.js';
    s.defer = true;
    s.onload = () => {
      if (typeof window.initIterumHelpChefWidget === 'function') {
        window.initIterumHelpChefWidget();
      }
    };
    document.head.appendChild(s);
  }

  injectWorkspaceFeaturesScript() {
    if (window.__workspaceFeaturesInjected) {
      if (typeof window.applyWorkspaceFeatureNav === 'function') {
        window.applyWorkspaceFeatureNav();
      }
      return;
    }
    window.__workspaceFeaturesInjected = true;
    const s = document.createElement('script');
    s.src = 'assets/js/workspace-features.js';
    s.onload = () => {
      if (typeof window.applyWorkspaceFeatureNav === 'function') {
        window.applyWorkspaceFeatureNav();
      }
    };
    document.head.appendChild(s);
  }

  injectRestaurantLocationSidebarScript() {
    if (window.__restaurantLocationSidebarInjected) {
      if (typeof window.initRestaurantLocationSidebar === 'function') {
        window.initRestaurantLocationSidebar();
      }
      return;
    }
    window.__restaurantLocationSidebarInjected = true;
    const s = document.createElement('script');
    s.src = 'assets/js/restaurant-location-sidebar.js';
    s.defer = true;
    s.onload = () => {
      if (typeof window.initRestaurantLocationSidebar === 'function') {
        window.initRestaurantLocationSidebar();
      }
    };
    document.head.appendChild(s);
  }

  setupDropdownClickToggle() {
    const sidebar = document.querySelector('.unified-nav-sidebar');
    if (!sidebar) return;

    sidebar.querySelectorAll('.nav-dropdown').forEach(dropdown => {
      const btn = dropdown.querySelector(
        '.nav-dropdown-btn, .nav-user-menu-btn'
      );
      const content = dropdown.querySelector('.nav-dropdown-content');
      if (!btn || !content) return;

      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const isShown = content.classList.contains('show');
        sidebar
          .querySelectorAll('.nav-dropdown-content.show')
          .forEach(c => c.classList.remove('show'));
        if (!isShown) {
          content.classList.add('show');
        }
        const nowShown = content.classList.contains('show');
        if (btn.classList.contains('nav-dropdown-btn')) {
          btn.setAttribute('aria-expanded', nowShown ? 'true' : 'false');
        }
        if (btn.classList.contains('nav-user-menu-btn')) {
          btn.setAttribute('aria-expanded', nowShown ? 'true' : 'false');
        }
      });
    });

    document.addEventListener('click', e => {
      if (e.target.closest('.unified-nav-sidebar .nav-dropdown')) return;
      sidebar.querySelectorAll('.nav-dropdown-content.show').forEach(c => {
        c.classList.remove('show');
      });
      sidebar
        .querySelectorAll('.nav-dropdown-btn[aria-expanded]')
        .forEach(b => {
          b.setAttribute('aria-expanded', 'false');
        });
      sidebar
        .querySelectorAll('.nav-user-menu-btn[aria-expanded]')
        .forEach(b => {
          b.setAttribute('aria-expanded', 'false');
        });
    });
  }

  setupSignOutLink() {
    const link = document.querySelector(
      '.nav-sign-out-link[data-iterum-sign-out="1"]'
    );
    if (!link) return;
    link.addEventListener('click', e => {
      e.preventDefault();
      if (window.authManager) {
        window.authManager.signOut();
      }
      window.location.href = 'index.html';
    });
  }

  setupDropdownHover() {
    // Add delay for dropdown hover to stay open when moving to it
    const dropdowns = document.querySelectorAll('.nav-dropdown');

    dropdowns.forEach(dropdown => {
      let hoverTimeout;

      dropdown.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        const content = dropdown.querySelector('.nav-dropdown-content');
        if (content) {
          content.classList.add('show');
        }
      });

      dropdown.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(() => {
          const content = dropdown.querySelector('.nav-dropdown-content');
          if (content) {
            content.classList.remove('show');
          }
        }, 300); // 300ms delay before closing
      });
    });
  }

  navLink(href, slug, iconClass, label, feature) {
    const feat = feature ? ` data-iterum-feature="${feature}"` : '';
    return (
      '<a href="' +
      href +
      '" class="nav-link ' +
      this.navPageActive(slug) +
      '"' +
      feat +
      ' title="' +
      label +
      '">' +
      '<i class="' +
      iconClass +
      ' nav-link-fa" aria-hidden="true"></i>' +
      '<span class="nav-link-label">' +
      label +
      '</span></a>'
    );
  }

  formatRoleLabel(roleKey) {
    const map = {
      chef_leadership: 'Kitchen lead',
      location_manager: 'Location manager',
      account_admin: 'Account admin',
      operations_gm: 'Operations / GM',
      employee_line: 'Line crew',
      kitchen_staff: 'Kitchen staff',
      front_of_house: 'Front of house',
      bartender: 'Bartender',
      server: 'Server',
      purchasing: 'Purchasing',
      consultant_rd: 'R&D consultant'
    };
    if (!roleKey) {
      return 'Kitchen lead';
    }
    return map[roleKey] || roleKey.replace(/_/g, ' ');
  }

  getSidebarHTML() {
    const moreActive = this.moreMenuActiveClass();
    const p = slug => this.navPageActive(slug);
    return `
            <div class="tc-sidebar-header sidebar-header">
                <a href="dashboard.html" class="tc-sidebar-brand">
                    <span class="tc-sidebar-brand-icon" aria-hidden="true"><i class="fa-solid fa-wand-magic-sparkles"></i></span>
                    <span class="tc-sidebar-brand-text">
                        <span class="tc-sidebar-brand-title">Iterum</span>
                        <span class="tc-sidebar-brand-eyebrow">Culinary OS</span>
                    </span>
                </a>
                <button type="button" class="tc-sidebar-collapse-btn" id="sidebar-collapse-btn" aria-label="Collapse sidebar" aria-expanded="true" title="Collapse sidebar">
                    <i class="fa-solid fa-angles-left" aria-hidden="true"></i>
                </button>
                <button type="button" class="sidebar-toggle-mobile" id="sidebar-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="unified-sidebar-nav">
                    <i class="fa-solid fa-bars" aria-hidden="true"></i>
                </button>
            </div>

            <nav class="sidebar-nav" id="unified-sidebar-nav" aria-label="Main">
                <div class="nav-links">
                    <div class="nav-section-label">Daily Ops</div>
                    ${this.navLink('dashboard.html', 'dashboard', 'fa-solid fa-table-columns', 'Dashboard', 'dashboard')}
                    ${this.navLink('dashboard.html#haccp', 'haccp', 'fa-solid fa-clipboard-check', 'HACCP Log', 'compliance')}
                    ${this.navLink('dashboard.html#temperature', 'temperature', 'fa-solid fa-temperature-half', 'Temperature', 'compliance')}
                    ${this.navLink('calendar.html', 'calendar', 'fa-solid fa-calendar-days', 'Calendar', 'calendar')}

                    <div class="nav-section-label">Kitchen</div>
                    ${this.navLink('recipe-library.html', 'recipes', 'fa-solid fa-book', 'Recipes', 'recipes')}
                    ${this.navLink('recipe-developer.html', 'developer', 'fa-solid fa-flask', 'Recipe Developer', 'recipes')}
                    ${this.navLink('menu-builder.html', 'menu', 'fa-solid fa-utensils', 'Menu Builder', 'menus')}
                    ${this.navLink('inventory.html', 'inventory', 'fa-solid fa-warehouse', 'Inventory', 'inventory')}
                    ${this.navLink('production-planning.html', 'reports', 'fa-solid fa-chart-line', 'Reports', 'production')}
                    ${this.navLink('project-hub.html#team', 'team', 'fa-solid fa-users', 'Team', 'projects')}

                    <div class="nav-dropdown">
                        <button type="button" class="nav-link nav-dropdown-btn ${moreActive}" aria-expanded="false" aria-haspopup="true" aria-controls="nav-more-panel" id="nav-more-toggle">
                            <i class="fa-solid fa-ellipsis nav-link-fa" aria-hidden="true"></i><span class="nav-link-label nav-more-label">More</span>
                        </button>
                        <div class="nav-dropdown-content" id="nav-more-panel" aria-labelledby="nav-more-toggle">
                            <div class="nav-dropdown-category">Kitchen tools</div>
                            <a href="kitchen-management.html?tab=pdf" data-iterum-feature="kitchen"><i class="fa-solid fa-book fa-fw nav-dd-icon" aria-hidden="true"></i>Recipe book PDF</a>
                            <a href="kitchen-management.html?tab=preplist" data-iterum-feature="kitchen"><i class="fa-solid fa-list-check fa-fw nav-dd-icon" aria-hidden="true"></i>Prep lists</a>
                            <a href="ingredient-highlights.html" class="${p('highlights')}" data-iterum-feature="ingredients"><i class="fa-solid fa-wand-magic-sparkles fa-fw nav-dd-icon" aria-hidden="true"></i>Ingredient stories</a>
                            <a href="server-info-sheet.html" class="${p('server')}" data-iterum-feature="kitchen"><i class="fa-solid fa-comments fa-fw nav-dd-icon" aria-hidden="true"></i>Server info</a>
                            <hr>
                            <div class="nav-dropdown-category">Operations</div>
                            <a href="spec-library.html" class="${p('spec_library')}" data-iterum-feature="ingredients"><i class="fa-solid fa-file-lines fa-fw nav-dd-icon" aria-hidden="true"></i>Spec library</a>
                            <a href="vendor-price-comparison.html" class="${p('vendorprice')}" data-iterum-feature="vendors"><i class="fa-solid fa-scale-balanced fa-fw nav-dd-icon" aria-hidden="true"></i>Price compare</a>
                            <a href="equipment-management.html" class="${p('equipment')}" data-iterum-feature="equipment"><i class="fa-solid fa-screwdriver-wrench fa-fw nav-dd-icon" aria-hidden="true"></i>Equipment</a>
                            <a href="mobile-compliance.html" class="${p('shift')}" data-iterum-feature="compliance"><i class="fa-solid fa-mobile-screen fa-fw nav-dd-icon" aria-hidden="true"></i>Shift tools</a>
                            <a href="ingredients.html" class="${p('ingredients')}" data-iterum-feature="ingredients"><i class="fa-solid fa-carrot fa-fw nav-dd-icon" aria-hidden="true"></i>Ingredients</a>
                            <a href="vendor-management.html" class="${p('vendors')}" data-iterum-feature="vendors"><i class="fa-solid fa-truck-field fa-fw nav-dd-icon" aria-hidden="true"></i>Vendors</a>
                            <a href="recipe-canvas.html" class="${p('canvas')}" data-iterum-feature="recipes"><i class="fa-solid fa-pen-ruler fa-fw nav-dd-icon" aria-hidden="true"></i>Recipe canvas</a>
                            <a href="kitchen-management.html" class="${p('kitchen')}" data-iterum-feature="kitchen"><i class="fa-solid fa-fire-burner fa-fw nav-dd-icon" aria-hidden="true"></i>Kitchen hub</a>
                            <a href="inventory-variance.html" class="${p('invvar')}" data-iterum-feature="inventory"><i class="fa-solid fa-chart-line fa-fw nav-dd-icon" aria-hidden="true"></i>Inventory variance</a>
                            <hr>
                            <div class="nav-dropdown-category">Import</div>
                            <a href="bulk-recipe-import.html" class="${p('import_recipe')}" data-iterum-feature="import_export"><i class="fa-solid fa-file-import fa-fw nav-dd-icon" aria-hidden="true"></i>Recipe import</a>
                            <a href="bulk-ingredient-import.html" class="${p('import_ing')}" data-iterum-feature="import_export"><i class="fa-solid fa-file-arrow-up fa-fw nav-dd-icon" aria-hidden="true"></i>Ingredient import</a>
                            <hr>
                            <div class="nav-dropdown-category">Organization &amp; data</div>
                            <a href="restaurant-group-onboarding.html" class="${p('rgo')}" data-iterum-feature="projects"><i class="fa-solid fa-location-dot fa-fw nav-dd-icon" aria-hidden="true"></i>Add a restaurant group</a>
                            <a href="data-backup-center.html" class="${p('backup')}" data-iterum-feature="backup"><i class="fa-solid fa-database fa-fw nav-dd-icon" aria-hidden="true"></i>Backup center</a>
                            <a href="data-management-dashboard.html" class="${p('datamgmt')}" data-iterum-feature="data_tools"><i class="fa-solid fa-network-wired fa-fw nav-dd-icon" aria-hidden="true"></i>Data management</a>
                            <a href="audit-log.html" class="${p('audit')}" data-iterum-feature="data_tools"><i class="fa-solid fa-scroll fa-fw nav-dd-icon" aria-hidden="true"></i>Audit log</a>
                            <a href="contact_management.html" class="${p('crm')}" data-iterum-feature="data_tools"><i class="fa-solid fa-address-book fa-fw nav-dd-icon" aria-hidden="true"></i>CRM &amp; contacts</a>
                            <a href="user_management.html" class="${p('admin')}" data-iterum-feature="data_tools"><i class="fa-solid fa-user-shield fa-fw nav-dd-icon" aria-hidden="true"></i>User admin</a>
                        </div>
                    </div>
                </div>
            </nav>

            <div class="sidebar-footer">
                <div id="unified-project-selector" class="sidebar-unified-project-slot" style="width:100%;position:relative;"></div>
                <div class="tc-sidebar-footer-card" id="tc-sidebar-footer-card">
                    <p class="tc-sidebar-footer-project" id="tc-sidebar-footer-project">Master Project</p>
                    <p class="tc-sidebar-footer-meta">
                        <span id="tc-sidebar-footer-role">Kitchen lead</span>
                        <span aria-hidden="true"> · </span>
                        <span class="tc-sidebar-footer-status" id="tc-sidebar-footer-status">Online</span>
                    </p>
                </div>
                <div class="nav-project-chip" id="nav-project-chip" hidden>Master Project</div>
                <div class="sidebar-restaurant-scope-wrap" style="display:none;width:100%;margin:10px 0 14px;">
                    <label for="sidebar-restaurant-location-select" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;">Restaurant location</label>
                    <select id="sidebar-restaurant-location-select" data-restaurant-location-select aria-label="Restaurant location"></select>
                </div>
                <div class="tc-sidebar-account-wrap nav-dropdown">
                    <button type="button" class="nav-user-menu-btn" id="nav-settings-toggle" aria-expanded="false" aria-haspopup="true" aria-controls="nav-settings-panel">
                        <i class="fa-solid fa-gear" aria-hidden="true"></i> <span class="nav-link-label">Account</span>
                    </button>
                    <div class="nav-dropdown-content nav-user-menu" id="nav-settings-panel" aria-labelledby="nav-settings-toggle">
                        <a href="user-profile.html"><i class="fa-solid fa-user fa-fw nav-dd-icon" aria-hidden="true"></i>Profile &amp; settings</a>
                        <a href="setup.html"><i class="fa-solid fa-sliders fa-fw nav-dd-icon" aria-hidden="true"></i>Operator setup</a>
                        <hr>
                        <a href="#" class="nav-sign-out-link" data-iterum-sign-out="1"><i class="fa-solid fa-right-from-bracket fa-fw nav-dd-icon" aria-hidden="true"></i>Sign out</a>
                    </div>
                </div>
                <span id="nav-user-name" hidden></span>
                <span id="nav-user-email" hidden></span>
                <span id="nav-user-avatar" hidden></span>
                <span id="iterum-nav-context-project" hidden></span>
                <span id="iterum-nav-context-role" hidden></span>
            </div>
        `;
  }

  setupSidebarCollapse() {
    const sidebar = document.querySelector('.unified-nav-sidebar');
    const btn = document.getElementById('sidebar-collapse-btn');
    if (!sidebar || !btn) {
      return;
    }
    if (btn.dataset.iterumCollapseBound === '1') {
      this.syncSidebarCollapseFromStorage();
      return;
    }
    btn.dataset.iterumCollapseBound = '1';
    const apply = collapsed => {
      sidebar.classList.toggle('is-collapsed', collapsed);
      document.body.classList.toggle('sidebar-collapsed', collapsed);
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      btn.innerHTML = collapsed
        ? '<i class="fa-solid fa-angles-right" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-angles-left" aria-hidden="true"></i>';
      btn.setAttribute(
        'aria-label',
        collapsed ? 'Expand sidebar' : 'Collapse sidebar'
      );
    };
    apply(localStorage.getItem('iterum_sidebar_collapsed') === '1');
    btn.addEventListener('click', () => {
      const collapsed = !sidebar.classList.contains('is-collapsed');
      apply(collapsed);
      try {
        localStorage.setItem(
          'iterum_sidebar_collapsed',
          collapsed ? '1' : '0'
        );
      } catch (e) {
        void e;
      }
    });
  }

  setupMobileToggle() {
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.unified-nav-sidebar');

    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        const open = sidebar.classList.contains('mobile-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', e => {
        if (
          window.innerWidth <= 768 &&
          sidebar.classList.contains('mobile-open') &&
          !sidebar.contains(e.target) &&
          !toggle.contains(e.target) &&
          !(
            e.target &&
            e.target.closest &&
            e.target.closest('#dash-menu-toggle')
          )
        ) {
          sidebar.classList.remove('mobile-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  /** Collapse the drawer after navigating on small screens */
  setupMobileNavLinkClose() {
    const sidebar = document.querySelector('.unified-nav-sidebar');
    if (!sidebar) return;
    sidebar.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || window.innerWidth > 768) return;
      const href = (a.getAttribute('href') || '').trim();
      if (!href || href === '#') return;
      sidebar.classList.remove('mobile-open');
      const t = document.getElementById('sidebar-toggle');
      if (t) t.setAttribute('aria-expanded', 'false');
      const dash = document.getElementById('dash-menu-toggle');
      if (dash) dash.setAttribute('aria-expanded', 'false');
    });
  }

  injectStyles() {
    if (document.getElementById('iterum-unified-nav-layout-style')) {
      return;
    }
    const style = document.createElement('style');
    style.id = 'iterum-unified-nav-layout-style';
    style.textContent = `
            body.iterum-has-sidebar,
            body.tc-revamp-body:has(.unified-nav-sidebar) {
                padding-top: 0 !important;
            }
            body.iterum-has-sidebar > nav[aria-label="App shortcuts"] {
                display: none !important;
            }
            .unified-nav-sidebar {
                position: fixed;
                left: 0;
                top: 0;
                height: 100vh;
                z-index: 1000;
            }
            body.iterum-has-sidebar {
                --iterum-sidebar-offset: var(--tc-sidebar-width, 16rem);
            }
            body.iterum-has-sidebar.sidebar-collapsed,
            body.iterum-has-sidebar:has(.unified-nav-sidebar.is-collapsed) {
                --iterum-sidebar-offset: var(--tc-sidebar-width-icon, 3.25rem);
            }
            .main-content-wrapper {
                margin-left: var(--iterum-sidebar-offset) !important;
                width: calc(100vw - var(--iterum-sidebar-offset)) !important;
                max-width: calc(100vw - var(--iterum-sidebar-offset)) !important;
                min-height: 100vh;
                box-sizing: border-box;
            }
            .legacy-header,
            .site-header,
            .app-header,
            .old-header,
            .top-nav { display: none !important; }
        `;
    document.head.appendChild(style);
  }

  ensureUserRoleSetup() {
    if (typeof window.iterumGetEffectiveRoleKey === 'function') {
      return;
    }
    if (document.querySelector('script[src*="user-role-setup.js"]')) {
      return;
    }
    const s = document.createElement('script');
    s.src = 'assets/js/user-role-setup.js';
    s.onload = () => this.refreshNavContextBar();
    document.head.appendChild(s);
  }

  initNavContextBar() {
    this.refreshNavContextBar();
    const refresh = () => this.refreshNavContextBar();
    window.addEventListener('storage', e => {
      const k = e.key || '';
      if (
        k.indexOf('project') >= 0 ||
        k === 'iterum_operator_profile' ||
        k.indexOf('iterum_current_project') >= 0
      ) {
        refresh();
      }
    });
  }

  refreshNavContextBar(projectNameOverride) {
    const projEl = document.getElementById('iterum-nav-context-project');
    const footProj = document.getElementById('tc-sidebar-footer-project');
    const footRole = document.getElementById('tc-sidebar-footer-role');
    const chipEl = document.getElementById('nav-project-chip');
    const bcEl = document.getElementById('iterum-nav-context-breadcrumb');
    let name = projectNameOverride;
    if (!name) {
      if (window.projectManager?.currentProject?.name) {
        name = window.projectManager.currentProject.name;
      } else {
        name =
          localStorage.getItem('active_project_name') ||
          localStorage.getItem('active_project') ||
          'Master Project';
      }
    }
    if (projEl) {
      projEl.textContent = name;
    }
    if (footProj) {
      footProj.textContent = name;
    }
    if (chipEl) {
      chipEl.textContent = name;
    }
    let rk = '';
    if (typeof window.iterumGetEffectiveRoleKey === 'function') {
      rk = window.iterumGetEffectiveRoleKey();
    } else {
      try {
        const raw = localStorage.getItem('iterum_operator_profile');
        if (raw) {
          const p = JSON.parse(raw);
          if (p && p.roleKey) rk = p.roleKey;
        }
      } catch (e) {
        /* ignore */
      }
      if (!rk && window.iterumMembership?.roleKey) {
        rk = window.iterumMembership.roleKey;
      }
    }
    const rl = this.formatRoleLabel(rk);
    if (footRole) {
      footRole.textContent = rl;
    }
    const roleEl = document.getElementById('iterum-nav-context-role');
    if (roleEl) {
      roleEl.textContent = rl;
    }
    if (bcEl) {
      const bc =
        document.body && document.body.getAttribute('data-iterum-breadcrumb');
      if (bc) {
        bcEl.textContent = bc.replace(/\|/g, ' → ');
        bcEl.hidden = false;
      } else {
        bcEl.textContent = '';
        bcEl.hidden = true;
      }
    }
    const label = `Project: ${name}`;
    const navChip = document.getElementById('nav-project-chip');
    const headerChip = document.getElementById('header-project-chip');
    const kitchenChip = document.getElementById('kitchen-project-chip');
    const menuChip = document.getElementById('menu-project-chip');
    if (navChip) {
      navChip.textContent = label;
    }
    if (headerChip) {
      headerChip.textContent = label;
    }
    if (kitchenChip) {
      kitchenChip.textContent = label;
    }
    if (menuChip) {
      menuChip.textContent = label;
    }
  }

  updateProjectChip(projectName = 'Master Project') {
    const name = projectName || 'Master Project';
    this.refreshNavContextBar(name);
  }

  updateUserInfo(user) {
    const nameEl = document.getElementById('nav-user-name');
    const emailEl = document.getElementById('nav-user-email');
    const avatarEl = document.getElementById('nav-user-avatar');

    if (nameEl && user) {
      const displayName =
        user.displayName || user.name || user.email?.split('@')[0] || 'Chef';
      nameEl.textContent = displayName;
    }

    if (emailEl && user) {
      emailEl.textContent = user.email || 'Loading...';
    }

    if (avatarEl && user) {
      if (user.photoURL || user.avatarUrl) {
        avatarEl.innerHTML = `<img src="${user.photoURL || user.avatarUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
      } else {
        const initial = (user.name || user.email || 'C')[0].toUpperCase();
        avatarEl.textContent = initial;
        avatarEl.style.backgroundColor = '#4d7c0f'; // Olive green
      }
    }
  }
}

// Load user info from localStorage as fallback
function loadUserInfoFromStorage() {
  try {
    const currentUserStr = localStorage.getItem('current_user');
    if (currentUserStr) {
      const user = JSON.parse(currentUserStr);
      if (window.unifiedNavHeader && user) {
        window.unifiedNavHeader.updateUserInfo(user);
      }
    }
  } catch (e) {
    console.warn('Could not load user from storage:', e);
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.unifiedNavHeader = new UnifiedNavHeader();

    // Try to load user info immediately
    loadUserInfoFromStorage();

    // Update user info when AuthManager is ready
    setTimeout(() => {
      if (window.authManager?.currentUser) {
        window.unifiedNavHeader.updateUserInfo(window.authManager.currentUser);
      } else {
        // Check authManager after a delay
        const checkAuth = setInterval(() => {
          if (window.authManager?.currentUser) {
            window.unifiedNavHeader.updateUserInfo(
              window.authManager.currentUser
            );
            clearInterval(checkAuth);
          }
        }, 500);
        setTimeout(() => clearInterval(checkAuth), 10000); // Stop after 10s
      }
    }, 100);

    // Listen for auth events
    window.addEventListener('userLoggedIn', e => {
      if (e.detail?.user) {
        window.unifiedNavHeader.updateUserInfo(e.detail.user);
      }
    });

    // Listen for auth state changes
    if (window.authManager && typeof window.authManager.on === 'function') {
      window.authManager.on('auth_state_changed', user => {
        if (user) {
          window.unifiedNavHeader.updateUserInfo(user);
        }
      });
    }
  });
} else {
  window.unifiedNavHeader = new UnifiedNavHeader();
  loadUserInfoFromStorage();

  setTimeout(() => {
    if (window.authManager?.currentUser) {
      window.unifiedNavHeader.updateUserInfo(window.authManager.currentUser);
    }
  }, 100);
}

document.addEventListener('projectChanged', event => {
  const detail = event.detail || {};
  const projectName =
    detail.project?.name ||
    detail.projectName ||
    detail.projectId ||
    'Master Project';
  window.unifiedNavHeader?.updateProjectChip(projectName);
});

document.addEventListener('iterumAppReady', () => {
  updateHeaderProjectChip();
});

// Function to update header project chip
function updateHeaderProjectChip() {
  let projectName = 'Master Project';

  // Try to get from projectManager first
  if (window.projectManager?.currentProject?.name) {
    projectName = window.projectManager.currentProject.name;
  } else {
    // Try to get from localStorage (project ID stored, need to find project name)
    const projectId =
      localStorage.getItem(
        `iterum_current_project_${window.projectManager?.currentUserId || ''}`
      ) || localStorage.getItem('iterum_current_project');

    if (projectId && window.projectManager) {
      // Load projects if not loaded
      if (
        !window.projectManager.projects ||
        window.projectManager.projects.length === 0
      ) {
        window.projectManager.loadProjects();
      }

      const project = window.projectManager.projects?.find(
        p => p.id === projectId
      );
      if (project) {
        projectName = project.name;
      }
    }
  }

  window.unifiedNavHeader?.updateProjectChip(projectName);
}

// Update header when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(updateHeaderProjectChip, 500); // Wait for projectManager to initialize
  });
} else {
  setTimeout(updateHeaderProjectChip, 500);
}

// Global sign out function
window.signOut = function () {
  if (confirm('Are you sure you want to sign out?')) {
    if (window.authManager) {
      window.authManager.signOut();
    }
    localStorage.clear();
    window.location.href = 'index.html';
  }
};

console.log('✅ Unified Nav Header script loaded');

// Auto-load the mobile quick-nav pill bar so every page that uses unified-nav-header
// gets the phone-friendly top nav for free. The script self-gates by viewport
// (≤ 720 px) and is a no-op on desktop.
(function ensureIterumMobileQuickNav() {
  try {
    if (typeof document === 'undefined') return;
    if (window.__iterumMobileQuickNavMounted) return;
    if (document.getElementById('iterum-mqn-script')) return;
    var s = document.createElement('script');
    s.id = 'iterum-mqn-script';
    s.src = 'assets/js/iterum-mobile-quicknav.js';
    s.defer = true;
    document.head.appendChild(s);
  } catch (e) {
    /* ignore */
  }
})();
