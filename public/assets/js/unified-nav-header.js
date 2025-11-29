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
        const path = window.location.pathname;
        if (path.includes('index')) return 'dashboard';
        if (path.includes('recipe-library')) return 'recipes';
        if (path.includes('recipe-developer')) return 'developer';
        if (path.includes('menu-builder')) return 'menu';
        if (path.includes('calendar')) return 'calendar';
        if (path.includes('kitchen-management')) return 'kitchen';
        if (path.includes('ingredients')) return 'ingredients';
        if (path.includes('vendor')) return 'vendors';
        if (path.includes('equipment')) return 'equipment';
        if (path.includes('user-profile')) return 'profile';
        if (path.includes('ingredient-highlights')) return 'highlights';
        if (path.includes('server-info')) return 'server';
        if (path.includes('audit-log')) return 'audit';
        return 'other';
    }

    init() {
        // Check if sidebar already exists
        if (document.querySelector('.unified-nav-sidebar')) {
            console.log('Navigation sidebar already exists');
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
                if (child !== sidebar && !child.classList.contains('main-content-wrapper')) {
                    wrapper.appendChild(child);
                }
            });
            
            document.body.appendChild(wrapper);
        }

        // Add styles
        this.injectStyles();

        // Setup dropdown hover delay
        this.setupDropdownHover();

        // Setup mobile toggle
        this.setupMobileToggle();

        console.log('✅ Navigation sidebar injected');
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
        return `
            <div class="sidebar-header">
                <a href="index.html" class="nav-logo">
                    <span class="nav-logo-icon">🍳</span>
                    <span class="nav-logo-text">Iterum</span>
                </a>
                <button class="sidebar-toggle-mobile" id="sidebar-toggle">
                    <i class="fa-solid fa-bars"></i>
                </button>
            </div>

            <nav class="sidebar-nav">
                <div class="nav-links">
                    <a href="index.html" class="nav-link nav-link-emphasis ${this.currentPage === 'dashboard' ? 'active' : ''}">
                        <span>🏠</span> Dashboard
                    </a>
                    <a href="recipe-library.html" class="nav-link ${this.currentPage === 'recipes' ? 'active' : ''}">
                        <span>📚</span> Recipes
                    </a>
                    <a href="menu-builder.html" class="nav-link ${this.currentPage === 'menu' ? 'active' : ''}">
                        <span>🍽️</span> Menus
                    </a>
                    <a href="calendar.html" class="nav-link ${this.currentPage === 'calendar' ? 'active' : ''}">
                        <span>📅</span> Calendar
                    </a>
                    <a href="kitchen-management.html" class="nav-link ${this.currentPage === 'kitchen' ? 'active' : ''}">
                        <span>🔪</span> Kitchen
                    </a>
                    <a href="ingredients.html" class="nav-link ${this.currentPage === 'ingredients' ? 'active' : ''}">
                        <span>🥬</span> Ingredients
                    </a>
                    <div class="nav-dropdown">
                        <button class="nav-link nav-dropdown-btn">
                            <span>☰</span> More
                        </button>
                        <div class="nav-dropdown-content">
                            <div class="nav-dropdown-category">Kitchen Tools</div>
                            <a href="kitchen-management.html">🔪 Kitchen Management</a>
                            <a href="kitchen-management.html?tab=pdf">📕 Recipe Book PDF</a>
                            <a href="kitchen-management.html?tab=preplist">📝 Prep Lists</a>
                            <a href="ingredient-highlights.html">✨ Ingredient Stories</a>
                            <a href="server-info-sheet.html">🗣️ Server Info</a>
                            <hr>
                            <div class="nav-dropdown-category">Inventory</div>
                            <a href="inventory.html">📦 Inventory</a>
                            <a href="vendor-management.html">🏪 Vendors</a>
                            <a href="vendor-price-comparison.html">💰 Price Compare</a>
                            <a href="equipment-management.html">🔧 Equipment</a>
                            <a href="production-planning.html">📋 Production</a>
                            <hr>
                            <div class="nav-dropdown-category">Import</div>
                            <a href="bulk-recipe-import.html">🚀 Recipe Import</a>
                            <a href="bulk-ingredient-import.html">📥 Ingredient Import</a>
                            <a href="recipe-photo-studio.html">📸 Photo Studio</a>
                            <hr>
                            <div class="nav-dropdown-category">System</div>
                            <a href="project-hub.html">📂 Project Hub</a>
                            <a href="data-backup-center.html">💾 Backup Center</a>
                            <a href="data-management-dashboard.html">🧠 Data Management</a>
                            <a href="audit-log.html">📜 Audit Log</a>
                        </div>
                    </div>
                </div>
            </nav>

            <div class="sidebar-footer">
                <div class="nav-project-chip" id="nav-project-chip">Project: Master Project</div>
                
                <!-- User Profile Section -->
                <div class="sidebar-user-profile">
                    <div class="flex items-center mb-2">
                        <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm sidebar-user-avatar" id="nav-user-avatar" style="background-color: #4d7c0f;">C</div>
                        <div class="ml-2.5 flex-1 min-w-0">
                            <div class="text-sm font-semibold truncate sidebar-user-name" id="nav-user-name" style="color: #78350f;">Chef</div>
                            <div class="text-xs truncate sidebar-user-email" id="nav-user-email" style="color: #b45309;">Loading...</div>
                        </div>
                    </div>
                    
                    <!-- User Menu Dropdown -->
                    <div class="nav-dropdown" style="width: 100%;">
                        <button class="nav-user-menu-btn" style="width: 100%; text-align: left; padding: 8px; border-radius: 4px; border: 1px solid rgba(252, 211, 77, 0.3); background: rgba(255, 251, 235, 0.5); cursor: pointer;">
                            <span style="font-size: 0.75rem;">⚙️ Settings</span>
                        </button>
                        <div class="nav-dropdown-content nav-user-menu">
                            <a href="user-profile.html">👤 Profile & Settings</a>
                            <a href="project-hub.html">📂 Project Hub</a>
                            <hr>
                            <a href="#" onclick="event.preventDefault(); if (window.authManager) { window.authManager.signOut(); } window.location.href='index.html';">🚪 Sign Out</a>
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
            });

            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && 
                    sidebar.classList.contains('mobile-open') &&
                    !sidebar.contains(e.target) &&
                    !toggle.contains(e.target)) {
                    sidebar.classList.remove('mobile-open');
                }
            });
        }
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
                background: rgba(255, 255, 255, 0.98);
                border-right: 1px solid rgba(226, 232, 240, 0.8);
                box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
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
                border-bottom: 1px solid rgba(226, 232, 240, 0.8);
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
                border-top: 1px solid rgba(226, 232, 240, 0.8);
                background: rgba(248, 250, 252, 0.5);
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

            .nav-link {
                color: #3E4C54;
                text-decoration: none;
                padding: 12px 16px;
                border-radius: 8px;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: 500;
                font-size: 0.95rem;
                background: transparent;
                border: 1px solid transparent;
                cursor: pointer;
                font-size: 0.98rem;
                white-space: nowrap;
            }

            .nav-link span:first-child {
                font-size: 1.1rem;
            }

            .nav-link:hover,
            .nav-link:focus {
                background: rgba(148, 163, 184, 0.1);
                color: #2C4A52;
            }

            .nav-link.active {
                color: #ffffff;
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                border-color: transparent;
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                font-weight: 600;
            }

            .nav-link-emphasis {
                background: rgba(59, 130, 246, 0.16);
                border-color: rgba(59, 130, 246, 0.35);
                color: rgba(226, 232, 240, 0.95);
            }

            .nav-link-emphasis:hover,
            .nav-link-emphasis:focus {
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.62) 0%, rgba(37, 99, 235, 0.82) 100%);
                color: #ffffff;
                border-color: transparent;
                box-shadow: 0 18px 36px rgba(37, 99, 235, 0.45);
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
                color: rgba(226, 232, 240, 0.9);
                text-decoration: none;
                border-radius: 12px;
                transition: background 0.2s ease, color 0.2s ease;
                font-weight: 500;
                font-size: 0.94rem;
            }

            .nav-dropdown-content a:hover {
                background: rgba(59, 130, 246, 0.18);
                color: #ffffff;
            }

            .nav-dropdown-content hr {
                border: none;
                border-top: 1px solid rgba(148, 163, 184, 0.22);
                margin: 10px 0;
            }

            .nav-dropdown-content .nav-dropdown-category {
                padding: 6px 12px 4px;
                font-size: 0.72rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: rgba(148, 163, 184, 0.78);
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

            /* Mobile Responsive */
            @media (max-width: 900px) {
                .nav-links {
                    display: none;
                }

                .nav-container {
                    justify-content: space-between;
                }

                .nav-logo-text {
                    display: none;
                }
            }

                /* Aggressively hide any legacy headers/navs to prevent double headers */
                header:not(.unified-nav-header) { display: none !important; }
                nav:not(.unified-nav-header) { display: none !important; }
                .page-header,
                .legacy-header,
                .site-header,
                .app-header,
                .old-header,
                .top-nav { display: none !important; }
        `;
        document.head.appendChild(style);
    }

    updateProjectChip(projectName = 'Master Project') {
        const chip = document.getElementById('nav-project-chip');
        if (chip) {
            chip.textContent = `Project: ${projectName}`;
        }
    }

    updateUserInfo(user) {
        const nameEl = document.getElementById('nav-user-name');
        const emailEl = document.getElementById('nav-user-email');
        const avatarEl = document.getElementById('nav-user-avatar');
        
        if (nameEl && user) {
            const displayName = user.displayName || user.name || user.email?.split('@')[0] || 'Chef';
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
                        window.unifiedNavHeader.updateUserInfo(window.authManager.currentUser);
                        clearInterval(checkAuth);
                    }
                }, 500);
                setTimeout(() => clearInterval(checkAuth), 10000); // Stop after 10s
            }
        }, 100);
        
        // Listen for auth events
        window.addEventListener('userLoggedIn', (e) => {
            if (e.detail?.user) {
                window.unifiedNavHeader.updateUserInfo(e.detail.user);
            }
        });
        
        // Listen for auth state changes
        if (window.authManager && typeof window.authManager.on === 'function') {
            window.authManager.on('auth_state_changed', (user) => {
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

document.addEventListener('projectChanged', (event) => {
    const detail = event.detail || {};
    const projectName = detail.project?.name || detail.projectName || detail.projectId || 'Master Project';
    window.unifiedNavHeader?.updateProjectChip(projectName);
});

document.addEventListener('iterumAppReady', () => {
    updateHeaderProjectChip();
});

// Also listen for project changes
document.addEventListener('projectChanged', (event) => {
    const detail = event.detail || {};
    const projectName = detail.project?.name || detail.projectName || 'Master Project';
    window.unifiedNavHeader?.updateProjectChip(projectName);
});

// Function to update header project chip
function updateHeaderProjectChip() {
    let projectName = 'Master Project';
    
    // Try to get from projectManager first
    if (window.projectManager?.currentProject?.name) {
        projectName = window.projectManager.currentProject.name;
    } else {
        // Try to get from localStorage (project ID stored, need to find project name)
        const projectId = localStorage.getItem(`iterum_current_project_${window.projectManager?.currentUserId || ''}`) || 
                         localStorage.getItem('iterum_current_project');
        
        if (projectId && window.projectManager) {
            // Load projects if not loaded
            if (!window.projectManager.projects || window.projectManager.projects.length === 0) {
                window.projectManager.loadProjects();
            }
            
            const project = window.projectManager.projects?.find(p => p.id === projectId);
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
window.signOut = function() {
    if (confirm('Are you sure you want to sign out?')) {
        if (window.authManager) {
            window.authManager.signOut();
        }
        localStorage.clear();
        window.location.href = 'index.html';
    }
};

console.log('✅ Unified Nav Header script loaded');

