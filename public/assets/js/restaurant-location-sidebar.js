/**
 * Left-sidebar control: multi-location restaurant groups — "All" or one location.
 * Depends on project-management-system.js (ProjectManagementSystem).
 */
(function () {
  function escapeHtml(s) {
    if (s === null || s === undefined) {
      return '';
    }
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function getPm() {
    return window.projectManager;
  }

  function syncSelectValues(selects, value) {
    selects.forEach(sel => {
      if (sel.value !== value) {
        sel.value = value;
      }
    });
  }

  function renderOptions(select) {
    const pm = getPm();
    if (!pm || !select) {
      return;
    }
    const wrap = select.closest('.sidebar-restaurant-scope-wrap');
    const members = pm.getRestaurantGroupMembersForCurrentProject
      ? pm.getRestaurantGroupMembersForCurrentProject()
      : [];
    if (!wrap) {
      return;
    }

    if (!members || members.length < 2) {
      wrap.style.display = 'none';
      select.innerHTML = '';
      return;
    }

    wrap.style.display = '';
    const scope = pm.getRestaurantLocationScope
      ? pm.getRestaurantLocationScope()
      : 'single';
    const curId = pm.currentProject?.id || '';

    const optAll =
      scope === 'all'
        ? '<option value="__all__" selected>All locations</option>'
        : '<option value="__all__">All locations</option>';
    const rest = members
      .map(m => {
        const sel =
          scope === 'single' && m.id === curId ? ' selected' : '';
        return `<option value="${escapeHtml(m.id)}"${sel}>${escapeHtml(m.name)}</option>`;
      })
      .join('');
    select.innerHTML = optAll + rest;
  }

  function onChange(e) {
    const select = e.target;
    const pm = getPm();
    if (!pm) {
      return;
    }
    const val = select.value;
    const all = document.querySelectorAll(
      '[data-restaurant-location-select]'
    );

    if (val === '__all__') {
      pm.setRestaurantLocationScope('all');
      syncSelectValues(Array.from(all), '__all__');
    } else {
      pm.setRestaurantLocationScope('single');
      const ok = pm.setCurrentProject(val);
      if (window.unifiedProjectSelector?.setCurrentProject) {
        window.unifiedProjectSelector.setCurrentProject(val);
      }
      if (ok) {
        syncSelectValues(Array.from(all), val);
      }
    }
  }

  function bindSelects() {
    document.querySelectorAll('[data-restaurant-location-select]').forEach(
      sel => {
        if (sel.dataset.rlBound === '1') {
          return;
        }
        sel.dataset.rlBound = '1';
        sel.addEventListener('change', onChange);
      }
    );
  }

  function refresh() {
    const pm = getPm();
    if (!pm?.loadProjects) {
      return;
    }
    bindSelects();
    document
      .querySelectorAll('[data-restaurant-location-select]')
      .forEach(renderOptions);
  }

  window.initRestaurantLocationSidebar = function () {
    refresh();
  };

  window.refreshRestaurantLocationSidebar = refresh;

  document.addEventListener('projectChanged', () =>
    setTimeout(refresh, 0)
  );
  document.addEventListener('locationScopeChanged', () =>
    setTimeout(refresh, 0)
  );
  window.addEventListener('storage', ev => {
    if (
      (ev.key && ev.key.indexOf('iterum_current_project') === 0) ||
      (ev.key && ev.key.indexOf('restaurant_location_scope') !== -1)
    ) {
      setTimeout(refresh, 50);
    }
  });

  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () =>
        setTimeout(refresh, 100)
      );
    } else {
      setTimeout(refresh, 100);
    }
  }
  boot();
})();
