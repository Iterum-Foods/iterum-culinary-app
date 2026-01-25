/**
 * Notebook Sidebar Template
 * Provides a function to generate the notebook-style sidebar HTML
 * Used across all main application pages
 */

function getNotebookSidebarHTML(currentPage) {
  const pages = {
    'dashboard': { name: 'Dashboard', icon: 'fa-gauge-high', active: currentPage === 'dashboard' },
    'project-hub': { name: 'Projects', icon: 'fa-folder-tree', active: currentPage === 'project-hub' },
    'menu-builder': { name: 'Menu Builder', icon: 'fa-utensils', active: currentPage === 'menu-builder' },
    'recipe-library': { name: 'Recipe Index', icon: 'fa-book-open', active: currentPage === 'recipe-library' },
    'ingredients': { name: 'Ingredients', icon: 'fa-carrot', active: currentPage === 'ingredients' },
    'recipe-developer': { name: 'Recipe Developer', icon: 'fa-flask', active: currentPage === 'recipe-developer' },
    'calendar': { name: 'Calendar', icon: 'fa-calendar-days', active: currentPage === 'calendar' },
    'kitchen-management': { name: 'Kitchen', icon: 'fa-kitchen-set', active: currentPage === 'kitchen-management' },
    'inventory': { name: 'Inventory', icon: 'fa-boxes-stacked', active: currentPage === 'inventory' },
    'vendor-management': { name: 'Vendors', icon: 'fa-store', active: currentPage === 'vendor-management' }
  };

  const tools = {
    'recipe-photo-studio': { name: 'Photo Studio', icon: 'fa-camera', active: currentPage === 'recipe-photo-studio' },
    'recipe-scaling-tool': { name: 'Recipe Scaling', icon: 'fa-calculator', active: currentPage === 'recipe-scaling-tool' }
  };

  let sidebarHTML = `
    <aside class="w-56 flex-shrink-0 border-r p-4 hidden md:block" style="background-color: var(--brand-bg-primary); border-color: var(--brand-border-light);">
      <div class="h-full flex flex-col">
        <!-- Logo/Title -->
        <div class="mb-8 flex items-center">
          <a href="dashboard.html" class="text-2xl font-extrabold" style="color: var(--brand-primary-accent); text-decoration: none;">Iterum</a>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-grow space-y-1">
          <div class="text-xs uppercase font-semibold mb-3 px-2" style="color: var(--brand-text-muted);">Main</div>
  `;

  // Main navigation links
  Object.entries(pages).forEach(([pageId, page]) => {
    const activeClass = page.active ? 'text-white font-semibold' : 'font-medium';
    const activeBg = page.active ? `style="background-color: var(--brand-primary-accent);"` : '';
    sidebarHTML += `
          <a href="${pageId}.html" class="flex items-center px-3 py-2.5 rounded-md hover:bg-gray-100 cursor-pointer text-sm transition-colors ${activeClass}" ${activeBg} style="color: ${page.active ? 'white' : 'var(--brand-text-primary)'};">
            <i class="fa-solid ${page.icon}" style="width: 18px; font-size: 0.9rem;"></i>
            <span class="ml-2.5">${page.name}</span>
          </a>
    `;
  });

  sidebarHTML += `
          <div class="text-xs uppercase font-semibold mt-5 mb-2 pt-4 px-2 border-t" style="border-color: var(--brand-border-light); color: var(--brand-text-muted);">Tools</div>
  `;

  // Tools links
  Object.entries(tools).forEach(([pageId, tool]) => {
    sidebarHTML += `
          <a href="${pageId}.html" class="flex items-center px-3 py-2.5 rounded-md hover:bg-gray-100 cursor-pointer font-medium text-sm transition-colors" style="color: var(--brand-text-primary);">
            <i class="fa-solid ${tool.icon}" style="width: 18px; font-size: 0.9rem;"></i>
            <span class="ml-2.5">${tool.name}</span>
          </a>
    `;
  });

  sidebarHTML += `
          <div class="text-xs uppercase font-semibold mt-5 mb-2 pt-4 px-2 border-t" style="border-color: var(--brand-border-light); color: var(--brand-text-muted);">Project</div>
          <div id="sidebar-project-chip" class="text-xs font-semibold px-2" style="color: var(--brand-text-secondary);">Master Project</div>
        </nav>

        <!-- User Profile -->
        <div class="mt-auto pt-4 border-t" style="border-color: var(--brand-border-light);">
          <div class="flex items-center">
            <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm" style="background-color: var(--brand-secondary-accent);" id="user-avatar">C</div>
            <div class="ml-2.5 flex-1 min-w-0">
              <div class="text-sm font-semibold truncate" id="user-name" style="color: var(--brand-text-primary);">Chef</div>
              <div class="text-xs truncate" style="color: var(--brand-text-muted);" id="user-email">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  `;

  return sidebarHTML;
}

// Export for use in pages
window.getNotebookSidebarHTML = getNotebookSidebarHTML;

