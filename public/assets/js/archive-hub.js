/**
 * Archive hub — per-workspace data inventory, export, and links to backup/audit.
 */
(function () {
  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
  }

  function getUserId() {
    const u = window.authManager?.currentUser;
    return u?.userId || u?.id || null;
  }

  function listProjects() {
    const raw = window.projectManager?.projects || [];
    return raw.filter(p => p && p.id);
  }

  function parseJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function countMenuForProject(projectId) {
    const data = parseJson(`menu_data_${projectId}`, null);
    if (!data) return 0;
    if (Array.isArray(data.items)) return data.items.length;
    if (data.items && Array.isArray(data.items)) return data.items.length;
    if (data.menu) return 1;
    return data.items ? Object.keys(data.items).length : 0;
  }

  function countTagged(items, projectId) {
    if (!Array.isArray(items)) return 0;
    return items.filter(
      item =>
        item &&
        (item.projectId === projectId ||
          item.project === projectId ||
          !item.projectId)
    ).length;
  }

  function inventoryForProject(projectId) {
    const uid = getUserId();
    const recipes = uid
      ? parseJson(`recipes_${uid}`, parseJson('recipes', []))
      : parseJson('recipes', []);
    const menus = countMenuForProject(projectId);
    const vendors = uid
      ? parseJson(`vendors_${uid}`, parseJson('iterum_vendors', []))
      : parseJson('iterum_vendors', []);
    const ingredients = uid
      ? parseJson(`user_ingredients_${uid}`, [])
      : parseJson('ingredients_database', []);

    return {
      recipes: countTagged(recipes, projectId),
      menus,
      vendors: Array.isArray(vendors) ? vendors.length : 0,
      ingredients: Array.isArray(ingredients) ? ingredients.length : 0,
      menuKey: `menu_data_${projectId}`
    };
  }

  function buildProjectExport(projectId) {
    const project = listProjects().find(p => p.id === projectId);
    const inv = inventoryForProject(projectId);
    return {
      exportType: 'iterum_project_archive_bundle',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      project: {
        id: projectId,
        name: project?.name || projectId,
        isArchived: !!project?.isArchived
      },
      localData: {
        menu: parseJson(inv.menuKey, null),
        menuRecipeLinks: parseJson('menu_recipe_links', {}),
        activeProjectKeys: {
          iterum_current_project: localStorage.getItem(
            'iterum_current_project'
          ),
          active_project: localStorage.getItem('active_project')
        }
      },
      inventory: inv,
      note: 'Cloud menus and checklists may also exist under projects/{projectId}/ in Firestore when sync is enabled.'
    };
  }

  function downloadJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderProjectRows() {
    const tbody = document.getElementById('archive-projects-tbody');
    const status = document.getElementById('archive-inventory-status');
    if (!tbody) return;

    const projects = listProjects();
    if (!projects.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="color:#64748b;">No workspaces yet — create one in Project hub.</td></tr>';
      if (status) status.textContent = '';
      return;
    }

    const currentId =
      window.projectManager?.currentProject?.id ||
      localStorage.getItem('active_project') ||
      '';

    tbody.innerHTML = '';
    projects.forEach(p => {
      const inv = inventoryForProject(p.id);
      const tr = document.createElement('tr');
      const isCurrent = p.id === currentId;
      tr.innerHTML = `
        <td>
          <strong>${escapeHtml(p.name || p.id)}</strong>
          ${isCurrent ? '<span class="archive-badge-current">Active</span>' : ''}
          ${p.isArchived ? '<span class="archive-badge-archived">Archived</span>' : ''}
        </td>
        <td>${inv.recipes}</td>
        <td>${inv.menus}</td>
        <td>${inv.vendors}</td>
        <td>${inv.ingredients}</td>
        <td>
          <button type="button" class="archive-btn-sm" data-export-project="${escapeHtml(p.id)}">Export JSON</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-export-project]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-export-project');
        if (!pid) return;
        const bundle = buildProjectExport(pid);
        const safeName = (bundle.project.name || pid).replace(/[^\w\-]+/g, '_');
        downloadJson(
          `iterum-archive_${safeName}_${pid.slice(0, 8)}.json`,
          bundle
        );
        if (typeof window.showSuccess === 'function') {
          window.showSuccess(
            `Exported archive bundle for ${bundle.project.name}`
          );
        }
      });
    });

    if (status) {
      status.textContent = `${projects.length} workspace(s) inventoried from this browser.`;
    }
  }

  function bindActions() {
    const fullBtn = document.getElementById('archive-full-backup-btn');
    if (fullBtn) {
      fullBtn.addEventListener('click', () => {
        if (window.backupManager?.downloadBackup) {
          window.backupManager.downloadBackup();
          return;
        }
        if (window.userDataManager?.exportAllUserData) {
          const data = window.userDataManager.exportAllUserData();
          if (data) {
            downloadJson(
              `iterum-full-backup_${new Date().toISOString().slice(0, 10)}.json`,
              data
            );
          }
          return;
        }
        window.location.href = 'data-backup-center.html';
      });
    }

    const refreshBtn = document.getElementById('archive-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => renderProjectRows());
    }
  }

  function init() {
    renderProjectRows();
    bindActions();
    if (typeof window.initWorkspaceSaveIndicator === 'function') {
      window.initWorkspaceSaveIndicator();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, 400);
  });
  window.addEventListener('projectChanged', () => {
    setTimeout(renderProjectRows, 100);
  });

  console.log('✅ Archive hub loaded');
})();
