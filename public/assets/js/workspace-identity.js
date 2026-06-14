/**
 * Workspace identity — persona + pillar hints per project type (ICP-aligned).
 */
(function () {
  'use strict';

  const PROFILES = {
    restaurant: {
      persona: 'owner',
      personaLabel: 'Owner / operator',
      pillar: 'run',
      pillarLabel: 'Run the shift',
      tagline: 'Compliance, logs, and backups sized for your restaurant—not enterprise IT.',
      actions: [
        { href: 'dashboard.html#temperature', label: 'Temperature log' },
        { href: 'mobile-compliance.html', label: 'Shift app' },
        { href: 'archive-hub.html', label: 'Archive & export' }
      ]
    },
    'restaurant-menu': {
      persona: 'chef',
      personaLabel: 'Chef launching',
      pillar: 'develop',
      pillarLabel: 'Develop',
      tagline: 'Cost the menu, publish recipes, and open with one organized workspace.',
      actions: [
        { href: 'recipe-library.html', label: 'Recipe library' },
        { href: 'menu-builder.html', label: 'Menu builder' },
        { href: 'kitchen-management.html', label: 'Prep lists' }
      ]
    },
    'home-cookbook': {
      persona: 'cook',
      personaLabel: 'Career portfolio',
      pillar: 'develop',
      pillarLabel: 'Develop',
      tagline: 'Your recipes, portable across jobs—back up when you move on.',
      actions: [
        { href: 'recipe-library.html', label: 'Recipe library' },
        { href: 'recipe-developer.html', label: 'Recipe developer' },
        { href: 'archive-hub.html', label: 'Download archive' }
      ]
    },
    'catering-event': {
      persona: 'chef',
      personaLabel: 'Event / catering',
      pillar: 'develop',
      pillarLabel: 'Develop',
      tagline: 'Batch recipes, timelines, and shopping for the next event.',
      actions: [
        { href: 'menu-builder.html', label: 'Event menu' },
        { href: 'production-planning.html', label: 'Production plan' },
        { href: 'ingredients.html', label: 'Ingredients' }
      ]
    },
    'recipe-testing': {
      persona: 'cook',
      personaLabel: 'R&D lab',
      pillar: 'develop',
      pillarLabel: 'Develop',
      tagline: 'Version ideas, test batches, and promote winners to the library.',
      actions: [
        { href: 'recipe-developer.html', label: 'Recipe developer' },
        { href: 'recipe-library.html', label: 'Library' },
        { href: 'archive-hub.html', label: 'Archive versions' }
      ]
    },
    'seasonal-menu': {
      persona: 'chef',
      personaLabel: 'Seasonal menu',
      pillar: 'develop',
      pillarLabel: 'Develop',
      tagline: 'Rotate menus with seasonal ingredients and costing intact.',
      actions: [
        { href: 'menu-builder.html', label: 'Menu builder' },
        { href: 'ingredients.html', label: 'Ingredients' },
        { href: 'archive-hub.html', label: 'Snapshot menu' }
      ]
    },
    sample_project: {
      persona: 'owner',
      personaLabel: 'Demo workspace',
      pillar: 'run',
      pillarLabel: 'Run the shift',
      tagline: 'Explore sample recipes, menus, and compliance logs in a safe sandbox.',
      actions: [
        { href: 'dashboard.html', label: 'Dashboard' },
        { href: 'menu-builder.html', label: 'Sample menus' },
        { href: 'archive-hub.html', label: 'Archive demo' }
      ]
    },
    general: {
      persona: 'chef',
      personaLabel: 'Workspace',
      pillar: 'develop',
      pillarLabel: 'Develop',
      tagline: 'Recipes and menus organized per project—pick a pillar to start.',
      actions: [
        { href: 'recipe-library.html', label: 'Recipes' },
        { href: 'dashboard.html', label: 'Dashboard' },
        { href: 'project-hub.html', label: 'Project hub' }
      ]
    }
  };

  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
  }

  function resolveProfile(project) {
    if (!project) {
      return PROFILES.general;
    }
    const type = String(project.type || 'general').toLowerCase();
    const tags = Array.isArray(project.tags) ? project.tags : [];
    if (type === 'restaurant' || tags.includes('rbp') || tags.includes('owner-bot')) {
      return PROFILES.restaurant;
    }
    if (project.id === 'sample_project' || tags.includes('demo')) {
      return PROFILES.sample_project;
    }
    return PROFILES[type] || PROFILES.general;
  }

  function loadProjectsFromStorage(uid) {
    if (!uid) return [];
    try {
      const raw = localStorage.getItem(`iterum_projects_user_${uid}`);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function getCurrentProject() {
    const pm = window.projectManager;
    if (pm?.currentProject && pm.currentProject.id !== 'master') {
      return pm.currentProject;
    }
    const id =
      localStorage.getItem('iterum_current_project') ||
      localStorage.getItem('active_project') ||
      '';
    if (!id || id === 'master') {
      return null;
    }
    const fromPm = (pm?.projects || []).find(p => p.id === id);
    if (fromPm) {
      return fromPm;
    }
    try {
      const user = JSON.parse(localStorage.getItem('current_user') || '{}');
      const uid = user.userId || user.id;
      const fromStore = loadProjectsFromStorage(uid).find(p => p.id === id);
      if (fromStore) {
        return fromStore;
      }
    } catch (e) {
      void e;
    }
    return { id, name: id, type: 'general' };
  }

  function renderIdentity(host) {
    const project = getCurrentProject();
    if (!project || project.id === 'master' || project.type === 'master') {
      host.innerHTML = '';
      host.setAttribute('hidden', '');
      return;
    }

    const profile = resolveProfile(project);
    const actions = (profile.actions || [])
      .map(
        a =>
          `<a class="iterum-workspace-identity__link" href="${escapeHtml(a.href)}">${escapeHtml(a.label)}</a>`
      )
      .join('');

    host.removeAttribute('hidden');
    host.className = 'iterum-workspace-identity';
    host.setAttribute('data-persona', profile.persona);
    host.setAttribute('data-pillar', profile.pillar);
    host.setAttribute('data-project-type', project.type || 'general');
    host.innerHTML = `
      <div class="iterum-workspace-identity__inner" role="complementary" aria-label="Workspace identity">
        <span class="iterum-workspace-identity__badge">${escapeHtml(profile.personaLabel)}</span>
        <span class="iterum-workspace-identity__pillar">${escapeHtml(profile.pillarLabel)}</span>
        <p class="iterum-workspace-identity__tagline">${escapeHtml(profile.tagline)}</p>
        <nav class="iterum-workspace-identity__actions" aria-label="Suggested next steps">${actions}</nav>
      </div>
    `;
  }

  function mountAll() {
    document.querySelectorAll('[data-workspace-identity]').forEach(renderIdentity);
  }

  function iterumResolveWorkspaceProfile(project) {
    return resolveProfile(project || getCurrentProject());
  }

  window.iterumResolveWorkspaceProfile = iterumResolveWorkspaceProfile;
  window.iterumRenderWorkspaceIdentity = mountAll;

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(mountAll, 600);
  });
  window.addEventListener('projectChanged', () => {
    setTimeout(mountAll, 200);
  });
  document.addEventListener('projectChanged', () => {
    setTimeout(mountAll, 200);
  });
})();
