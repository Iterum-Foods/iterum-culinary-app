/**
 * Operator setup page — profile, pilot features, first restaurant workspace.
 * Requires: user-role-setup.js, workspace-features.js, project-management-system.js
 */
(function () {
  'use strict';

  var form = document.getElementById('setup-form');
  if (!form) return;

  var errEl = document.getElementById('setup-error');
  var submitBtn = document.getElementById('setup-submit');
  var createBlock = document.getElementById('setup-create-restaurant');
  var pickBlock = document.getElementById('setup-pick-restaurant');
  var nameInput = document.getElementById('setup-restaurant-name');
  var addAnotherCb = document.getElementById('setup-add-restaurant');

  function labelForRole(key) {
    var map = {
      chef_leadership: 'Executive chef / Kitchen lead',
      operations_gm: 'GM & operations',
      purchasing: 'Purchasing & costing',
      consultant_rd: 'Consultant / R&D',
      employee_line: 'Shift team (kitchen, FOH, support)'
    };
    return map[key] || key;
  }

  function labelForScope(scope) {
    return scope === 'restaurant_group'
      ? 'Restaurant group'
      : 'Single restaurant';
  }

  function isRealRestaurantProject(project) {
    if (!project || !project.id) return false;
    if (
      project.id === 'master' ||
      project.isMaster ||
      project.type === 'master'
    ) {
      return false;
    }
    return true;
  }

  function getSetupProjects() {
    if (
      !window.projectManager ||
      !Array.isArray(window.projectManager.projects)
    ) {
      return [];
    }
    return window.projectManager.projects.filter(isRealRestaurantProject);
  }

  function collectFeatures() {
    var features = {};
    document.querySelectorAll('.feat-cb').forEach(function (cb) {
      var k = cb.getAttribute('data-fkey');
      if (k) features[k] = cb.checked;
    });
    return features;
  }

  function pilotFeatures() {
    if (typeof window.iterumGetPilotFeaturePreset === 'function') {
      return window.iterumGetPilotFeaturePreset();
    }
    return collectFeatures();
  }

  function applyFeatureMap(features) {
    if (!features) return;
    document.querySelectorAll('.feat-cb').forEach(function (cb) {
      var k = cb.getAttribute('data-fkey');
      if (k && Object.prototype.hasOwnProperty.call(features, k)) {
        cb.checked = !!features[k];
      }
    });
  }

  function applyPilotFeatureDefaults() {
    try {
      var existing =
        typeof window.getOperatorProfile === 'function'
          ? window.getOperatorProfile()
          : null;
      if (existing && existing.features) return;
    } catch (e) {
      /* ignore */
    }
    applyFeatureMap(pilotFeatures());
  }

  function restoreExistingProfile() {
    try {
      var existing =
        typeof window.getOperatorProfile === 'function'
          ? window.getOperatorProfile()
          : null;
      if (!existing) return;
      if (existing.scope) {
        var s = document.querySelector(
          'input[name="scope"][value="' + existing.scope + '"]'
        );
        if (s) s.checked = true;
      }
      if (existing.roleKey) {
        var r = document.querySelector(
          'input[name="roleKey"][value="' + existing.roleKey + '"]'
        );
        if (r) r.checked = true;
      }
      if (existing.features) {
        applyFeatureMap(existing.features);
      }
    } catch (e) {
      /* ignore */
    }
  }

  function populateDefaultProjectOptions() {
    var select = document.getElementById('default-project-select');
    if (!select) return;

    while (select.options.length > 1) {
      select.remove(1);
    }

    var projects = getSetupProjects();
    var currentProjectId = '';
    try {
      currentProjectId =
        localStorage.getItem('iterum_current_project') ||
        localStorage.getItem('userCurrentProjectKey') ||
        '';
    } catch (e) {
      /* ignore */
    }

    if (currentProjectId === 'master') {
      currentProjectId = '';
    }

    projects.forEach(function (project) {
      var option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name || project.id;
      if (currentProjectId && currentProjectId === project.id) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  function syncRestaurantSection() {
    var projects = getSetupProjects();
    var hasExisting = projects.length > 0;

    if (createBlock) {
      createBlock.classList.toggle(
        'hidden',
        hasExisting && !(addAnotherCb && addAnotherCb.checked)
      );
    }
    if (pickBlock) {
      pickBlock.classList.toggle('hidden', !hasExisting);
    }
    if (nameInput) {
      if (!hasExisting) {
        nameInput.required = true;
        nameInput.setAttribute('aria-required', 'true');
      } else if (addAnotherCb && addAnotherCb.checked) {
        nameInput.required = true;
        nameInput.setAttribute('aria-required', 'true');
      } else {
        nameInput.required = false;
        nameInput.removeAttribute('aria-required');
      }
    }
    populateDefaultProjectOptions();
  }

  function createRestaurantProject(name) {
    if (!window.projectManager || !name) return null;
    var userId = window.authManager?.currentUser?.userId || 'guest';
    var userName = window.authManager?.currentUser?.displayName || 'Owner';
    return window.projectManager.createProject(
      {
        name: name,
        description:
          'Restaurant workspace — menus, compliance, and shift operations',
        type: 'restaurant',
        icon: '🍽️',
        color: '#6b8e6f',
        isPrivate: true,
        createdBy: userId,
        createdByName: userName,
        settings: {
          enableCosting: true,
          enableMenuBuilder: true,
          enableTesting: true
        }
      },
      { setAsCurrent: true }
    );
  }

  function seedProjectJobs(projectId) {
    if (!projectId) return;
    var roleOptions = Array.isArray(window.ITERUM_TEAM_MEMBER_ROLE_OPTIONS)
      ? window.ITERUM_TEAM_MEMBER_ROLE_OPTIONS
      : [];
    if (!roleOptions.length) return;
    var key = 'iterum_project_jobs_' + projectId;
    var rows = [];
    try {
      var raw = localStorage.getItem(key);
      rows = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(rows)) rows = [];
    } catch (e) {
      rows = [];
    }
    var seen = {};
    rows.forEach(function (row) {
      if (row && row.roleKey) seen[row.roleKey] = true;
    });
    roleOptions.forEach(function (opt) {
      if (!opt || !opt.value || seen[opt.value]) return;
      rows.push({
        id: 'job_' + opt.value,
        roleKey: opt.value,
        label: opt.label || opt.value,
        active: true,
        source: 'setup_seed',
        createdAt: new Date().toISOString()
      });
    });
    try {
      localStorage.setItem(key, JSON.stringify(rows));
    } catch (e) {
      console.warn('Could not seed jobs for project', projectId, e);
    }
  }

  function setActiveProject(projectId) {
    if (!projectId || projectId === 'master') return false;
    if (
      window.projectManager &&
      typeof window.projectManager.setCurrentProject === 'function'
    ) {
      try {
        window.projectManager.setCurrentProject(projectId);
      } catch (e) {
        console.warn('Could not set project through projectManager', e);
      }
    }
    try {
      localStorage.setItem('iterum_current_project', projectId);
      localStorage.setItem('userCurrentProjectKey', projectId);
      localStorage.setItem('active_project', projectId);
      localStorage.setItem('active_project_id', projectId);
    } catch (e) {
      /* ignore */
    }
    return true;
  }

  function ensureRestaurantWorkspace() {
    var projects = getSetupProjects();
    var newName = nameInput ? nameInput.value.trim() : '';
    var selectedId =
      (document.getElementById('default-project-select') || {}).value || '';
    var addingAnother = !!(addAnotherCb && addAnotherCb.checked);

    if (newName && (!projects.length || addingAnother || !selectedId)) {
      var created = createRestaurantProject(newName);
      return created ? created.id : null;
    }

    if (selectedId && selectedId !== 'master') {
      setActiveProject(selectedId);
      return selectedId;
    }

    if (projects.length === 1) {
      setActiveProject(projects[0].id);
      return projects[0].id;
    }

    return null;
  }

  function applyProjectSetupDefaults(projectId) {
    var activeId = projectId || ensureRestaurantWorkspace();
    var shouldSeedJobs = !!(document.getElementById('setup-seed-jobs') || {})
      .checked;

    if (activeId) {
      setActiveProject(activeId);
    }

    if (shouldSeedJobs && activeId) {
      seedProjectJobs(activeId);
      getSetupProjects().forEach(function (project) {
        if (project && project.id) seedProjectJobs(project.id);
      });
    }

    return activeId;
  }

  function saveAndGo(profile) {
    var projectId = applyProjectSetupDefaults();
    if (typeof window.saveOperatorProfile === 'function') {
      window.saveOperatorProfile(profile);
    }
    try {
      if (projectId) {
        localStorage.setItem('iterum_onboarding_restaurant_created', projectId);
      }
    } catch (e) {
      /* ignore */
    }
    window.location.href =
      typeof window.getPostAuthDestination === 'function'
        ? window.getPostAuthDestination()
        : 'dashboard.html';
  }

  function validateRestaurantStep() {
    var projects = getSetupProjects();
    var newName = nameInput ? nameInput.value.trim() : '';
    var selectedId =
      (document.getElementById('default-project-select') || {}).value || '';
    var addingAnother = !!(addAnotherCb && addAnotherCb.checked);

    if (!projects.length && !newName) {
      return 'Enter your restaurant name to create your workspace.';
    }
    if (projects.length && addingAnother && !newName) {
      return 'Enter a name for the new restaurant location.';
    }
    if (projects.length && !selectedId && !newName && !addingAnother) {
      return 'Pick a workspace or add a new restaurant name.';
    }
    return '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errEl.classList.add('hidden');

    var scope = (form.querySelector('input[name="scope"]:checked') || {}).value;
    var roleKey = (form.querySelector('input[name="roleKey"]:checked') || {})
      .value;
    if (!scope || !roleKey) {
      errEl.textContent = 'Please select both options.';
      errEl.classList.remove('hidden');
      return;
    }

    var restaurantErr = validateRestaurantStep();
    if (restaurantErr) {
      errEl.textContent = restaurantErr;
      errEl.classList.remove('hidden');
      if (nameInput) nameInput.focus();
      return;
    }

    submitBtn.disabled = true;
    saveAndGo({
      scope: scope,
      roleKey: roleKey,
      label: labelForRole(roleKey) + ' — ' + labelForScope(scope),
      features: collectFeatures()
    });
  });

  var skipBtn = document.getElementById('setup-skip');
  if (skipBtn) {
    skipBtn.addEventListener('click', function () {
      var restaurantErr = validateRestaurantStep();
      if (restaurantErr) {
        if (nameInput && !nameInput.value.trim()) {
          nameInput.value = 'My restaurant';
        }
      }
      saveAndGo({
        scope: 'single_restaurant',
        roleKey: 'chef_leadership',
        label: 'Pilot kitchen dashboard (skipped)',
        features: pilotFeatures()
      });
    });
  }

  if (addAnotherCb) {
    addAnotherCb.addEventListener('change', syncRestaurantSection);
  }

  function waitForProjectManager(cb) {
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      if (
        window.projectManager &&
        Array.isArray(window.projectManager.projects)
      ) {
        clearInterval(timer);
        cb();
      } else if (tries > 60) {
        clearInterval(timer);
        cb();
      }
    }, 150);
  }

  function initSetupPage() {
    restoreExistingProfile();
    applyPilotFeatureDefaults();
    waitForProjectManager(function () {
      syncRestaurantSection();
      var projects = getSetupProjects();
      if (projects.length === 0 && nameInput && !nameInput.value.trim()) {
        nameInput.value = 'My restaurant';
        nameInput.select();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSetupPage);
  } else {
    initSetupPage();
  }
})();
