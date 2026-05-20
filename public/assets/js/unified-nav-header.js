/**
 * Unified Navigation Header
 * Provides consistent navigation across all pages
 */

class UnifiedNavHeader {
  constructor() {
    this.currentPage = this.detectCurrentPage();
    this.init();
  }

  detectCurrentPage() {
    const path = (window.location.pathname || '').toLowerCase();
    if (path.includes('index') || path.includes('dashboard')) {
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
      return 'production';
    }
    if (path.includes('project-hub')) {
      return 'projects';
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

  init() {
    // Check if sidebar already exists
    if (document.querySelector('.unified-nav-sidebar')) {
      console.log('Navigation sidebar already exists');
      return;
    }

    if (this.shouldSkipUnifiedNav()) {
      console.log('Unified nav: skipped (data-no-unified-nav)');
      return;
    }

    this.injectHeader();
  }

  injectHeader() {
    // Check if sidebar already exists
    if (document.querySelector('.unified-nav-sidebar')) {
      console.log('Navigation sidebar already exists');
      return;
    }

    if (this.shouldSkipUnifiedNav()) {
      return;
    }

    this.ensureFontAwesome();

    const sidebar = document.createElement('aside');
    sidebar.className = 'unified-nav-sidebar';
    sidebar.innerHTML = this.getSidebarHTML();

    // Insert at start of body
    document.body.insertBefore(sidebar, document.body.firstChild);

    // Add main content wrapper if it doesn't exist
    if (!document.querySelector('.main-content-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'main-content-wrapper';

      // Move all existing body children (except sidebar) into wrapper
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

    // Add styles
    this.injectStyles();

    // Setup dropdown hover delay
    this.setupDropdownHover();

    // Touch / click: open Settings & More menus (hover alone fails on mobile)
    this.setupDropdownClickToggle();
    this.setupSignOutLink();

    // Setup mobile toggle
    this.setupMobileToggle();
    this.setupMobileNavLinkClose();

    this.injectWorkspaceFeaturesScript();
    this.injectRestaurantLocationSidebarScript();
    this.injectHelpChefWidgetScript();

    this.ensureUserRoleSetup();
    this.initNavContextBar();

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

  getSidebarHTML() {
    const p = slug => this.navPageActive(slug);
    const moreActive = this.moreMenuActiveClass();
    return `
            <div class="sidebar-header">
                <a href="dashboard.html" class="nav-logo">
                    <span class="nav-logo-icon">🍳</span>
                    <span class="nav-logo-text">Iterum</span>
                </a>
                <button type="button" class="sidebar-toggle-mobile" id="sidebar-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="unified-sidebar-nav">
                    <i class="fa-solid fa-bars"></i>
                </button>
            </div>

            <div class="iterum-nav-context-bar" id="iterum-nav-context-bar" aria-label="Project context">
                <div class="iterum-nav-context-breadcrumb" id="iterum-nav-context-breadcrumb" hidden></div>
                <div class="iterum-nav-context-row">
                    <span class="iterum-nav-context-project" id="iterum-nav-context-project">Select project</span>
                    <span class="iterum-nav-context-role" id="iterum-nav-context-role"></span>
                </div>
            </div>

            <nav class="sidebar-nav" id="unified-sidebar-nav" aria-label="Main">
                <div class="nav-links">
                    <div class="nav-section-label">Daily ops</div>
                    <a href="dashboard.html" class="nav-link nav-link-emphasis ${p('dashboard')}"><i class="fa-solid fa-table-columns nav-link-fa" aria-hidden="true"></i>Dashboard</a>
                    <a href="project-hub.html" class="nav-link ${p('projects')}" data-iterum-feature="projects"><i class="fa-solid fa-diagram-project nav-link-fa" aria-hidden="true"></i>Project hub</a>
                    <a href="mobile-compliance.html" class="nav-link ${p('shift')}" data-iterum-feature="compliance"><i class="fa-solid fa-clipboard-check nav-link-fa" aria-hidden="true"></i>Shift tools</a>
                    <a href="calendar.html" class="nav-link ${p('calendar')}" data-iterum-feature="calendar"><i class="fa-solid fa-calendar-days nav-link-fa" aria-hidden="true"></i>Calendar</a>
                    <a href="kitchen-management.html" class="nav-link ${p('kitchen')}" data-iterum-feature="kitchen"><i class="fa-solid fa-fire-burner nav-link-fa" aria-hidden="true"></i>Kitchen</a>

                    <div class="nav-section-label">Menu &amp; recipes</div>
                    <a href="menu-builder.html" class="nav-link ${p('menu')}" data-iterum-feature="menus"><i class="fa-solid fa-utensils nav-link-fa" aria-hidden="true"></i>Menu builder</a>
                    <a href="recipe-library.html" class="nav-link ${p('recipes')}" data-iterum-feature="recipes"><i class="fa-solid fa-book nav-link-fa" aria-hidden="true"></i>Recipe index</a>
                    <a href="recipe-developer.html" class="nav-link ${p('developer')}" data-iterum-feature="recipes"><i class="fa-solid fa-flask nav-link-fa" aria-hidden="true"></i>Recipe developer</a>
                    <a href="recipe-canvas.html" class="nav-link ${p('canvas')}" data-iterum-feature="recipes"><i class="fa-solid fa-pen-ruler nav-link-fa" aria-hidden="true"></i>Recipe canvas</a>

                    <div class="nav-section-label">Purchasing &amp; inventory</div>
                    <a href="ingredients.html" class="nav-link ${p('ingredients')}" data-iterum-feature="ingredients"><i class="fa-solid fa-carrot nav-link-fa" aria-hidden="true"></i>Ingredients</a>
                    <a href="inventory.html" class="nav-link ${p('inventory')}" data-iterum-feature="inventory"><i class="fa-solid fa-warehouse nav-link-fa" aria-hidden="true"></i>Inventory</a>
                    <a href="vendor-management.html" class="nav-link ${p('vendors')}" data-iterum-feature="vendors"><i class="fa-solid fa-truck-field nav-link-fa" aria-hidden="true"></i>Vendors</a>

                    <div class="nav-section-label">Tools</div>
                    <a href="recipe-photo-studio.html" class="nav-link ${p('photo')}" data-iterum-feature="photo_studio"><i class="fa-solid fa-camera nav-link-fa" aria-hidden="true"></i>Photo studio</a>
                    <a href="recipe-scaling-tool.html" class="nav-link ${p('scaling')}" data-iterum-feature="scaling"><i class="fa-solid fa-calculator nav-link-fa" aria-hidden="true"></i>Recipe scaling</a>

                    <div class="nav-dropdown">
                        <button type="button" class="nav-link nav-dropdown-btn ${moreActive}" aria-expanded="false" aria-haspopup="true" aria-controls="nav-more-panel" id="nav-more-toggle">
                            <span class="nav-more-chevron" aria-hidden="true">▸</span> More tools
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
                            <a href="production-planning.html" class="${p('production')}" data-iterum-feature="production"><i class="fa-solid fa-clipboard-list fa-fw nav-dd-icon" aria-hidden="true"></i>Production</a>
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
                <div id="unified-project-selector" class="sidebar-unified-project-slot" style="width:100%;margin-bottom:12px;position:relative;"></div>
                <div class="nav-project-chip" id="nav-project-chip">Project: Master Project</div>
                <div class="sidebar-restaurant-scope-wrap" style="display:none;width:100%;margin:10px 0 14px;">
                    <div style="font-size:10px;text-transform:uppercase;font-weight:600;letter-spacing:0.06em;color:#b45309;opacity:0.9;margin-bottom:6px;">Locations</div>
                    <label for="sidebar-restaurant-location-select" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;">Restaurant location</label>
                    <select id="sidebar-restaurant-location-select" data-restaurant-location-select aria-label="Restaurant location"
                        style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid rgba(180,83,9,0.35);background:rgba(255,251,235,0.95);color:#451a03;font-size:12px;font-weight:600;cursor:pointer;"></select>
                </div>
                <!-- User Profile Section -->
                <div class="sidebar-user-profile">
                    <div class="flex items-center mb-2">
                        <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm sidebar-user-avatar" id="nav-user-avatar" style="background-color: #4d7c0f;">C</div>
                        <div class="ml-2.5 flex-1 min-w-0">
                            <div class="text-sm font-semibold truncate sidebar-user-name" id="nav-user-name" style="color: #78350f;">Chef</div>
                            <div class="text-xs truncate sidebar-user-email" id="nav-user-email" style="color: #b45309;">Loading...</div>
                        </div>
                    </div>
                    
                    <!-- User Menu Dropdown (no duplicate links — Projects / group onboarding live under Main + More) -->
                    <div class="nav-dropdown" style="width: 100%;">
                        <button type="button" class="nav-user-menu-btn" id="nav-settings-toggle" aria-expanded="false" aria-haspopup="true" aria-controls="nav-settings-panel"
                            style="width: 100%; text-align: left; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(180, 83, 9, 0.22); background: rgba(255, 251, 235, 0.85); cursor: pointer; font-weight: 600; color: #451a03; font-size: 0.8rem;">
                            <span aria-hidden="true">⚙️</span> Account
                        </button>
                        <div class="nav-dropdown-content nav-user-menu" id="nav-settings-panel" aria-labelledby="nav-settings-toggle">
                            <a href="user-profile.html">👤 Profile &amp; settings</a>
                            <a href="setup.html"><i class="fa-solid fa-sliders fa-fw nav-dd-icon" aria-hidden="true"></i>Operator &amp; project setup</a>
                            <hr>
                            <a href="#" class="nav-sign-out-link" data-iterum-sign-out="1">🚪 Sign out</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
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
    const style = document.createElement('style');
    style.textContent = `
            /* Sidebar Styles */
            .unified-nav-sidebar {
                position: fixed;
                left: 0;
                top: 0;
                width: 280px;
                height: 100vh;
                background: hsl(var(--tc-sidebar-background, 182 38% 13%));
                border-right: 1px solid hsl(var(--tc-sidebar-border, 182 25% 20%));
                box-shadow: 2px 0 16px hsl(180 25% 11% / 0.12);
                display: flex;
                flex-direction: column;
                z-index: 1000;
                overflow-y: auto;
                transition: transform 0.3s ease;
            }

            .main-content-wrapper {
                margin-left: 280px;
                min-height: 100vh;
            }

            .sidebar-header {
                padding: 24px 20px;
                border-bottom: 1px solid hsl(var(--tc-sidebar-border, 182 25% 20%));
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .sidebar-toggle-mobile {
                display: none;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #2C4A52;
                padding: 8px;
            }

            .sidebar-nav {
                flex: 1;
                padding: 16px 0;
                overflow-y: auto;
            }

            .sidebar-footer {
                padding: 20px;
                border-top: 1px solid hsl(var(--tc-sidebar-border, 182 25% 20%));
                background: hsl(var(--tc-sidebar-accent, 182 30% 18%) / 0.5);
            }

            .sidebar-user-profile {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid rgba(226, 232, 240, 0.8);
            }

            .sidebar-user-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: white;
                font-size: 0.875rem;
                flex-shrink: 0;
            }

            .sidebar-user-name {
                font-size: 0.875rem;
                font-weight: 600;
                color: #78350f;
                line-height: 1.2;
            }

            .sidebar-user-email {
                font-size: 0.75rem;
                color: #b45309;
                line-height: 1.2;
                margin-top: 2px;
            }

            .nav-user-menu-btn {
                margin-top: 8px;
            }

            .nav-user-menu-btn:hover {
                background: rgba(252, 211, 77, 0.3) !important;
            }

            /* Mobile Styles */
            @media (max-width: 768px) {
                .unified-nav-sidebar {
                    transform: translateX(-100%);
                }

                .unified-nav-sidebar.mobile-open {
                    transform: translateX(0);
                }

                .main-content-wrapper {
                    margin-left: 0;
                }

                .sidebar-toggle-mobile {
                    display: block;
                }

                /* Flyout to the right overflows the viewport — open below the toggle */
                .unified-nav-sidebar .nav-dropdown-content {
                    left: 0;
                    right: 0;
                    top: 100%;
                    margin-left: 0;
                    margin-top: 6px;
                    min-width: unset;
                }
            }

            .nav-logo {
                display: inline-flex;
                align-items: center;
                gap: 12px;
                text-decoration: none;
                color: #2C4A52;
                font-weight: 800;
                font-size: 1.4rem;
                letter-spacing: -0.02em;
            }

            .nav-logo-icon {
                font-size: 1.8rem;
            }

            .nav-links {
                display: flex;
                flex-direction: column;
                gap: 4px;
                padding: 0 12px;
            }

            .nav-section-label {
                font-size: 0.65rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #94a3b8;
                padding: 14px 16px 6px;
                margin-top: 2px;
            }

            .nav-section-label:first-child {
                padding-top: 4px;
                margin-top: 0;
            }

            .nav-link {
                color: hsl(var(--tc-sidebar-foreground, 40 30% 88%) / 0.88);
                text-decoration: none;
                padding: 12px 16px;
                border-radius: 8px;
                transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: 500;
                font-size: 0.9375rem;
                background: transparent;
                border: 1px solid transparent;
                cursor: pointer;
                white-space: nowrap;
            }

            .nav-more-chevron {
                display: inline-block;
                transition: transform 0.2s ease;
                font-size: 0.75rem;
                opacity: 0.75;
                margin-right: 2px;
            }

            .nav-dropdown-btn[aria-expanded="true"] .nav-more-chevron {
                transform: rotate(90deg);
            }

            .nav-link span:first-child {
                font-size: 1.1rem;
            }

            .nav-link:hover,
            .nav-link:focus {
                background: hsl(var(--tc-sidebar-accent, 182 30% 18%));
                color: hsl(var(--tc-sidebar-foreground, 40 30% 88%));
            }

            .nav-link.active {
                color: hsl(var(--tc-accent-foreground, 40 33% 99%));
                background: var(--brand-btn-primary, var(--tc-gradient-accent, linear-gradient(135deg, hsl(28 85% 55%) 0%, hsl(18 80% 50%) 100%)));
                border-color: transparent;
                box-shadow: var(--tc-shadow-glow, 0 8px 32px hsl(28 85% 55% / 0.18));
                font-weight: 600;
            }

            .nav-link-emphasis {
                background: hsl(var(--tc-accent, 28 85% 55%) / 0.18);
                border-color: hsl(var(--tc-accent, 28 85% 55%) / 0.35);
                color: hsl(var(--tc-sidebar-foreground, 40 30% 88%));
                font-weight: 600;
            }

            .nav-link-emphasis:hover,
            .nav-link-emphasis:focus {
                background: var(--brand-btn-primary, var(--tc-gradient-accent));
                color: hsl(var(--tc-accent-foreground, 40 33% 99%));
                border-color: transparent;
                box-shadow: var(--tc-shadow-glow, 0 8px 32px hsl(28 85% 55% / 0.18));
            }

            .nav-right {
                display: flex;
                align-items: center;
                gap: 14px;
            }

            .nav-dropdown {
                position: relative;
            }

            .nav-dropdown-btn,
            .nav-user-btn {
                display: inline-flex;
                align-items: center;
                gap: 10px;
            }

            .nav-dropdown-content {
                display: none;
                position: absolute;
                left: 100%;
                top: 0;
                margin-left: 8px;
                background: rgba(255, 255, 255, 0.98);
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                min-width: 240px;
                padding: 12px;
                z-index: 1001;
                border: 1px solid rgba(226, 232, 240, 0.8);
                backdrop-filter: blur(18px);
                -webkit-backdrop-filter: blur(18px);
            }

            .nav-dropdown-content.show {
                display: block !important;
            }

            .nav-dropdown-content a {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 11px 12px;
                color: #334155;
                text-decoration: none;
                border-radius: 10px;
                transition: background 0.2s ease, color 0.2s ease;
                font-weight: 500;
                font-size: 0.9rem;
            }

            .nav-dropdown-content a:hover,
            .nav-dropdown-content a:focus {
                background: rgba(59, 130, 246, 0.12);
                color: #1d4ed8;
            }

            .nav-dropdown-content a.active {
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                color: #ffffff;
            }

            .nav-dropdown-btn.active:not(:hover) {
                border-color: rgba(59, 130, 246, 0.45);
                background: rgba(59, 130, 246, 0.22);
            }

            .nav-dropdown-content hr {
                border: none;
                border-top: 1px solid rgba(148, 163, 184, 0.22);
                margin: 10px 0;
            }

            .nav-dropdown-content .nav-dropdown-category {
                padding: 6px 12px 4px;
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: #64748b;
            }

            .nav-user-menu {
                min-width: 240px;
            }

            #nav-user-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.45), rgba(37, 99, 235, 0.75));
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                color: #ffffff;
                box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
            }

            .nav-label {
                letter-spacing: 0.01em;
            }

            .iterum-nav-context-bar {
                padding: 10px 16px 12px;
                border-bottom: 1px solid rgba(226, 232, 240, 0.95);
                background: rgba(248, 250, 252, 0.92);
            }
            .iterum-nav-context-breadcrumb {
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                color: #64748b;
                margin-bottom: 6px;
            }
            .iterum-nav-context-row {
                display: flex;
                flex-wrap: wrap;
                gap: 4px 8px;
                align-items: baseline;
                font-size: 13px;
                color: #334155;
                font-weight: 600;
            }
            .iterum-nav-context-role {
                font-weight: 500;
                color: #64748b;
                font-size: 12px;
            }
            .nav-link-fa {
                width: 1.35rem;
                text-align: center;
                margin-right: 6px;
                opacity: 0.88;
            }
            .nav-dd-icon {
                margin-right: 8px;
                opacity: 0.85;
            }

                /* Legacy top bars only — avoid .page-header (used by audit-log and others as content heroes) */
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
    const roleEl = document.getElementById('iterum-nav-context-role');
    const bcEl = document.getElementById('iterum-nav-context-breadcrumb');
    let name = projectNameOverride;
    if (!name) {
      if (window.projectManager?.currentProject?.name) {
        name = window.projectManager.currentProject.name;
      } else {
        name =
          localStorage.getItem('active_project_name') ||
          localStorage.getItem('active_project') ||
          'Select project';
      }
    }
    if (projEl) {
      projEl.textContent = name;
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
    const ROLE_LABELS = {
      chef_leadership: 'Kitchen lead',
      operations_gm: 'Operations',
      purchasing: 'Purchasing',
      consultant_rd: 'Consultant / R&D',
      employee_line: 'Team member'
    };
    const rl = rk && ROLE_LABELS[rk] ? ROLE_LABELS[rk] : '';
    if (roleEl) {
      roleEl.textContent = rl ? ` · ${rl}` : '';
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
