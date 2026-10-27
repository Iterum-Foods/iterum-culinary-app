/**
 * Operator profile: restaurant scope + role → dashboard layout & post-auth routing.
 * Stored in localStorage (key iterum_operator_profile); independent of AuthManager shape.
 */
(function (global) {
  'use strict';

  var PROFILE_KEY = 'iterum_operator_profile';

  /**
   * UI-level capability flags by roleKey (dashboard + header CTA). Mirrors docs/ROLES_AND_PERMISSIONS.md.
   * Not enforced by Firestore — server rules are separate.
   */
  global.ITERUM_ROLE_PERMISSIONS = {
    chef_leadership: {
      dashboard_idea_pad: true,
      dashboard_rd_pipeline: true,
      dashboard_rd_shortcuts: false,
      dashboard_purchasing_tile: false,
      dashboard_compliance_block: true,
      dashboard_daily_tasks: true,
      dashboard_shift_notes: true,
      dashboard_manager_notes: true,
      dashboard_quick_stats: true,
      quick_stats_ideas_column: true,
      header_cta: 'recipe_experiment'
    },
    operations_gm: {
      dashboard_idea_pad: false,
      dashboard_rd_pipeline: false,
      dashboard_rd_shortcuts: false,
      dashboard_purchasing_tile: false,
      dashboard_compliance_block: true,
      dashboard_daily_tasks: true,
      dashboard_shift_notes: true,
      dashboard_manager_notes: true,
      dashboard_quick_stats: true,
      quick_stats_ideas_column: false,
      header_cta: 'kitchen_hub'
    },
    purchasing: {
      dashboard_idea_pad: false,
      dashboard_rd_pipeline: false,
      dashboard_rd_shortcuts: false,
      dashboard_purchasing_tile: true,
      dashboard_compliance_block: false,
      dashboard_daily_tasks: true,
      dashboard_shift_notes: true,
      dashboard_manager_notes: true,
      dashboard_quick_stats: true,
      quick_stats_ideas_column: false,
      header_cta: 'vendors'
    },
    consultant_rd: {
      dashboard_idea_pad: true,
      dashboard_rd_pipeline: true,
      dashboard_rd_shortcuts: true,
      dashboard_purchasing_tile: false,
      dashboard_compliance_block: false,
      dashboard_daily_tasks: true,
      dashboard_shift_notes: true,
      dashboard_manager_notes: true,
      dashboard_quick_stats: true,
      quick_stats_ideas_column: true,
      header_cta: 'recipe_experiment'
    },
    employee_line: {
      dashboard_idea_pad: false,
      dashboard_rd_pipeline: false,
      dashboard_rd_shortcuts: false,
      dashboard_purchasing_tile: false,
      dashboard_compliance_block: true,
      dashboard_daily_tasks: true,
      dashboard_shift_notes: true,
      dashboard_manager_notes: false,
      dashboard_quick_stats: true,
      quick_stats_ideas_column: false,
      header_cta: 'kitchen_hub'
    }
  };

  /** Setup + profile: primary dashboard role (keys must exist in ITERUM_ROLE_PERMISSIONS). */
  global.ITERUM_PRIMARY_ROLE_OPTIONS = [
    { value: 'chef_leadership', label: 'Executive chef / Kitchen lead' },
    { value: 'operations_gm', label: 'GM & operations' },
    { value: 'purchasing', label: 'Purchasing & costing' },
    { value: 'consultant_rd', label: 'Consultant / R&D' },
    {
      value: 'employee_line',
      label: 'Shift team — kitchen, FOH, or support (daily ops focus)'
    }
  ];

  /** Per-project self-service position (also used for members.role labels). */
  global.ITERUM_TEAM_MEMBER_ROLE_OPTIONS = [
    { value: 'account_admin', label: 'Account admin / owner' },
    { value: 'operations_gm', label: 'Operations / GM' },
    { value: 'location_manager', label: 'Location manager' },
    { value: 'chef_leadership', label: 'Executive chef / chef lead' },
    { value: 'sous_chef', label: 'Sous chef' },
    { value: 'kitchen_manager', label: 'Kitchen manager' },
    { value: 'employee_line', label: 'Kitchen line / crew' },
    { value: 'kitchen_staff', label: 'Kitchen / prep' },
    { value: 'prep_cook', label: 'Prep cook' },
    { value: 'line_cook', label: 'Line cook' },
    { value: 'expeditor', label: 'Expo / pass' },
    { value: 'dishwasher', label: 'Dish / porter' },
    { value: 'bakery_pastry', label: 'Bakery / pastry' },
    { value: 'bar_manager', label: 'Bar manager' },
    { value: 'bartender', label: 'Bartender' },
    { value: 'host', label: 'Host / hostess' },
    { value: 'front_of_house', label: 'Front of house' },
    { value: 'server', label: 'Server' },
    { value: 'runner', label: 'Runner / busser' },
    { value: 'support_staff', label: 'Support' },
    { value: 'purchasing', label: 'Purchasing' },
    { value: 'inventory_clerk', label: 'Inventory / receiving' },
    { value: 'consultant_rd', label: 'Consultant / R&D' }
  ];

  global.iterumGetRolePermissions = function (optionalRoleKey) {
    var perms = global.ITERUM_ROLE_PERMISSIONS;
    var k =
      optionalRoleKey ||
      (typeof global.iterumGetEffectiveRoleKey === 'function'
        ? global.iterumGetEffectiveRoleKey()
        : 'chef_leadership');
    if (!perms[k]) k = 'chef_leadership';
    return perms[k];
  };

  /** Nightly manager handoff notes (UI-level; not a server secret). */
  global.iterumCanViewManagerNotes = function () {
    var p = global.iterumGetRolePermissions();
    return !!(p && p.dashboard_manager_notes);
  };

  function parseProfile() {
    try {
      var raw = global.localStorage.getItem(PROFILE_KEY);
      if (!raw) return null;
      var p = JSON.parse(raw);
      if (!p || !p.roleKey || !p.scope) return null;
      return p;
    } catch (e) {
      return null;
    }
  }

  /** Prefer Firestore `projects/{id}/members/{uid}.role` when loaded (see project-membership.js). */
  global.iterumGetEffectiveRoleKey = function () {
    var m = global.iterumMembership;
    if (m && m.roleKey) return m.roleKey;
    var pr = parseProfile();
    return (pr && pr.roleKey) || 'chef_leadership';
  };

  function hasOperatorProfile() {
    return !!parseProfile();
  }

  global.iterumOperatorProfileKey = PROFILE_KEY;

  global.getPostAuthDestination = function () {
    if (!hasOperatorProfile()) return 'setup.html';
    var r =
      typeof global.iterumGetEffectiveRoleKey === 'function'
        ? global.iterumGetEffectiveRoleKey()
        : (parseProfile() || {}).roleKey || 'chef_leadership';
    if (r === 'employee_line') return 'mobile-compliance.html';
    return 'dashboard.html';
  };

  global.getOperatorProfile = parseProfile;

  global.saveOperatorProfile = function (profile) {
    var payload = Object.assign({}, profile, {
      updatedAt: new Date().toISOString()
    });
    global.localStorage.setItem(PROFILE_KEY, JSON.stringify(payload));
  };

  global.clearOperatorProfile = function () {
    global.localStorage.removeItem(PROFILE_KEY);
  };

  /** True when signed in but profile not saved (first run or cleared). */
  global.needsOperatorSetup = function () {
    try {
      if (global.localStorage.getItem('session_active') !== 'true')
        return false;
      if (!global.localStorage.getItem('current_user')) return false;
      return !hasOperatorProfile();
    } catch (e) {
      return false;
    }
  };

  function isMasterWorkspaceName(name) {
    return !name || /^master project$/i.test(String(name).trim());
  }

  /** Bartender / bar lead board vs chef board. Solo workspace only. */
  global.iterumIsBarBoard = function () {
    var membership = global.iterumMembership;
    var raw = membership && membership.rawRole;
    if (raw === 'bartender' || raw === 'bar_manager') return true;
    var role =
      typeof global.iterumGetEffectiveRoleKey === 'function'
        ? global.iterumGetEffectiveRoleKey()
        : '';
    if (role === 'bartender' || role === 'bar_manager') return true;
    var profile = parseProfile();
    if (
      profile &&
      (profile.roleKey === 'bartender' ||
        profile.roleKey === 'bar_manager' ||
        profile.board === 'bar')
    ) {
      return true;
    }
    try {
      var pm = global.projectManager;
      var project =
        (pm && pm.currentProject) ||
        (pm && typeof pm.getActiveProject === 'function'
          ? pm.getActiveProject()
          : null);
      if (project) {
        var tags = Array.isArray(project.tags) ? project.tags.join(' ') : '';
        var blob = [project.type, project.venue, project.trade, project.board, tags]
          .join(' ')
          .toLowerCase();
        if (/\bbar\b|bartender|cocktail/.test(blob)) return true;
      }
    } catch (e) {
      /* ignore */
    }
    return false;
  };

  global.iterumResolveWorkspaceDisplayName = function (explicit) {
    var candidates = [];
    if (explicit) candidates.push(explicit);
    try {
      var pm = global.projectManager;
      if (pm) {
        if (pm.currentProject && pm.currentProject.name) {
          candidates.push(pm.currentProject.name);
        }
        if (pm.currentProjectName) candidates.push(pm.currentProjectName);
        if (typeof pm.preferSoloWorkspace === 'function') {
          var solo = pm.preferSoloWorkspace();
          if (solo && solo.name) candidates.push(solo.name);
        }
      }
      var stored = global.localStorage.getItem('active_project_name');
      if (stored) candidates.push(stored);
    } catch (e) {
      /* ignore */
    }
    for (var i = 0; i < candidates.length; i++) {
      var name = String(candidates[i] || '').trim();
      if (name && !isMasterWorkspaceName(name)) return name;
    }
    return global.iterumIsBarBoard() ? 'Your bar' : 'Your kitchen';
  };

  global.applyDashboardWorkspaceHero = function (explicitName) {
    var bar = global.iterumIsBarBoard();
    var name = global.iterumResolveWorkspaceDisplayName(explicitName);
    var header = document.getElementById('dash-header-title');
    if (header) header.textContent = name;
    var sub = document.getElementById('dash-header-subtitle');
    if (sub) sub.textContent = bar ? 'Bar board' : 'Chef board';
    var projectChip = document.getElementById('header-project-chip');
    if (projectChip) projectChip.textContent = 'Project: ' + name;
    applyGoldenPathLabels(bar);
    applyNextStepFallback(bar);
    return name;
  };

  function applyGoldenPathLabels(bar) {
    var rail = document.getElementById('dash-golden-path');
    if (!rail) return;
    var links = rail.querySelectorAll('a[data-chef-label]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var label = bar
        ? link.getAttribute('data-bar-label')
        : link.getAttribute('data-chef-label');
      var href = bar
        ? link.getAttribute('data-bar-href')
        : link.getAttribute('data-chef-href');
      var span = link.querySelector('span');
      if (span && label) span.textContent = label;
      if (href) link.setAttribute('href', href);
    }
  }

  function applyNextStepFallback(bar) {
    var copy = document.getElementById('dash-next-fallback-copy');
    var cta = document.getElementById('dash-next-fallback-cta');
    if (bar) {
      if (copy) {
        copy.textContent =
          'Open the bar program and check the well before service.';
      }
      if (cta) {
        cta.textContent = 'Open bar program';
        cta.setAttribute('href', 'bar-ops.html');
      }
    } else {
      if (copy) {
        copy.textContent = 'Open your recipes and keep this workspace moving.';
      }
      if (cta) {
        cta.textContent = 'Open recipes';
        cta.setAttribute('href', 'recipe-library.html');
      }
    }
  }

  function setHeaderPrimaryCta(cta, bar) {
    if (!cta) return;
    var href = bar ? 'bar-ops.html' : 'recipe-library.html';
    var label = bar ? 'Open bar program' : 'Open recipes';
    var icon = bar ? 'fa-martini-glass-citrus' : 'fa-book-open';
    cta.innerHTML =
      '<i class="fa-solid ' + icon + '" aria-hidden="true"></i> ' + label;
    if (cta.tagName === 'A') {
      cta.setAttribute('href', href);
      cta.onclick = null;
    } else {
      cta.onclick = function () {
        global.location.href = href;
      };
    }
  }

  /**
   * Toggle [data-dash-roles] cards. Role must appear in comma-list, or list contains "all".
   * Cards without attribute are always shown.
   */
  global.applyDashboardLayoutForRole = function () {
    var p = parseProfile();
    var role = global.iterumGetEffectiveRoleKey();
    document.body.setAttribute('data-operator-role', role);
    if (p && p.scope) {
      document.body.setAttribute('data-operator-scope', p.scope);
    }

    var cards = document.querySelectorAll('[data-dash-roles]');
    for (var i = 0; i < cards.length; i++) {
      var el = cards[i];
      var attr = el.getAttribute('data-dash-roles') || '';
      var roles = attr
        .split(',')
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      if (roles.length === 0 || roles.indexOf('all') !== -1) {
        el.removeAttribute('hidden');
        el.style.display = '';
        continue;
      }
      if (roles.indexOf(role) === -1) {
        el.setAttribute('hidden', '');
        el.style.display = 'none';
      } else {
        el.removeAttribute('hidden');
        el.style.display = '';
      }
    }

    global.applyDashboardWorkspaceHero();

    var ROLE_BADGE_LABELS = {
      chef_leadership: 'Kitchen lead',
      operations_gm: 'Operations',
      purchasing: 'Purchasing',
      consultant_rd: 'Consultant / R&D',
      employee_line: 'Team member'
    };
    var badge = document.getElementById('dash-role-badge');
    if (badge) {
      if (p || (global.iterumMembership && global.iterumMembership.roleKey)) {
        badge.textContent = ROLE_BADGE_LABELS[role] || 'Workspace';
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }

    if (badge && global.iterumIsBarBoard()) {
      var rawRole = global.iterumMembership && global.iterumMembership.rawRole;
      badge.textContent = rawRole === 'bar_manager' ? 'Bar lead' : 'Bartender';
      badge.style.display = 'inline-flex';
    }
    var ideasCol = document.getElementById('quick-stat-ideas-col');
    var statGrid = document.getElementById('quick-stat-grid');
    if (ideasCol && statGrid) {
      var hideIdeas =
        role === 'operations_gm' ||
        role === 'purchasing' ||
        role === 'employee_line';
      if (hideIdeas) {
        ideasCol.style.display = 'none';
        statGrid.classList.remove('cols-3');
        statGrid.classList.add('cols-2');
      } else {
        ideasCol.style.display = '';
        statGrid.classList.remove('cols-2');
        statGrid.classList.add('cols-3');
      }
    }

    var chip = document.getElementById('dash-scope-chip');
    if (chip) {
      chip.textContent = '';
      chip.style.display = 'none';
    }

    setHeaderPrimaryCta(
      document.getElementById('dash-header-primary-cta'),
      global.iterumIsBarBoard()
    );

    if (typeof global.applyDashboardFeatureVisibility === 'function') {
      global.applyDashboardFeatureVisibility();
    }

    global.dispatchEvent(
      new CustomEvent('iterumDashboardRoleApplied', {
        detail: { roleKey: role }
      })
    );
  };

  global.getRoleBadgeLabel = function (roleKey) {
    var ROLE_BADGE_LABELS = {
      chef_leadership: 'Kitchen lead',
      operations_gm: 'Operations',
      purchasing: 'Purchasing',
      consultant_rd: 'Consultant / R&D',
      employee_line: 'Team member'
    };
    return ROLE_BADGE_LABELS[roleKey] || '';
  };
})(typeof window !== 'undefined' ? window : this);
