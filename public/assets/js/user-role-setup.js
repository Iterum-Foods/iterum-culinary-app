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
      dashboard_quick_stats: true,
      quick_stats_ideas_column: false,
      header_cta: 'kitchen_hub'
    }
  };

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
    return hasOperatorProfile() ? 'dashboard.html' : 'setup.html';
  };

  global.getOperatorProfile = parseProfile;

  global.saveOperatorProfile = function (profile) {
    var payload = Object.assign(
      {},
      profile,
      { updatedAt: new Date().toISOString() }
    );
    global.localStorage.setItem(PROFILE_KEY, JSON.stringify(payload));
  };

  global.clearOperatorProfile = function () {
    global.localStorage.removeItem(PROFILE_KEY);
  };

  /** True when signed in but profile not saved (first run or cleared). */
  global.needsOperatorSetup = function () {
    try {
      if (global.localStorage.getItem('session_active') !== 'true') return false;
      if (!global.localStorage.getItem('current_user')) return false;
      return !hasOperatorProfile();
    } catch (e) {
      return false;
    }
  };

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

    var header = document.getElementById('dash-header-title');
    var sub = document.getElementById('dash-header-subtitle');
    if (header) {
      var labels = {
        chef_leadership: {
          t: 'Kitchen & R&D board',
          s: 'Ideas, recipe experiments, and line-ready compliance in one calm view.'
        },
        operations_gm: {
          t: 'Operations command',
          s: 'Ship the shift: tasks first, then temps, sanitizer, and handoffs to the kitchen hub.'
        },
        purchasing: {
          t: 'Purchasing & cost desk',
          s: 'Keep vendor, ingredient, and menu math one tap away—tasks and notes stay below.'
        },
        consultant_rd: {
          t: 'Consultant / R&D desk',
          s: 'Protect deep work: shortcuts to dev tools, ideas, and a lighter compliance surface.'
        },
        employee_line: {
          t: 'Team compliance',
          s: 'Log temps, sanitizer, and shift tasks for this venue—admin sets templates and reviews.'
        }
      };
      var L = labels[role] || labels.chef_leadership;
      header.textContent = L.t;
      if (sub) sub.textContent = L.s;
    }

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
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
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
      if (p && p.scope) {
        chip.textContent =
          p.scope === 'restaurant_group'
            ? 'Organization: restaurant group'
            : 'Organization: single venue';
        chip.style.display = '';
      } else {
        chip.style.display = 'none';
      }
    }

    var cta = document.getElementById('dash-header-primary-cta');
    if (cta) {
      if (role === 'purchasing') {
        cta.innerHTML =
          '<i class="fa-solid fa-store mr-2" aria-hidden="true"></i>Open vendors';
        cta.onclick = function () {
          global.location.href = 'vendor-management.html';
        };
      } else if (role === 'operations_gm' || role === 'employee_line') {
        cta.innerHTML =
          '<i class="fa-solid fa-kitchen-set mr-2" aria-hidden="true"></i>Kitchen hub';
        cta.onclick = function () {
          global.location.href = 'kitchen-management.html';
        };
      } else {
        cta.innerHTML =
          '<i class="fa-solid fa-plus mr-2" aria-hidden="true"></i>New experiment';
        cta.onclick = function () {
          global.location.href = 'recipe-developer.html';
        };
      }
    }

    if (typeof global.applyDashboardFeatureVisibility === 'function') {
      global.applyDashboardFeatureVisibility();
    }

    global.dispatchEvent(
      new CustomEvent('iterumDashboardRoleApplied', { detail: { roleKey: role } })
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
