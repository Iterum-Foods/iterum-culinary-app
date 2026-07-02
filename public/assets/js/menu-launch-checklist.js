/**
 * Menu Launch checklist — guided new-menu cycle (roadmap E1).
 * Auto-checks from menu, SOP, and prep data; manual steps persist per workspace.
 */
(function (global) {
  'use strict';

  var MANUAL_IDS = [
    'vendor_prices',
    'specs_ready',
    'server_sheet',
    'archive_snapshot',
    'pos_loaded',
    'team_briefed'
  ];

  var STEPS = [
    {
      id: 'menu_structure',
      phase: 'develop',
      label: 'Menu structure in place',
      hint: 'Add sections and dishes in Menu Builder.',
      href: 'menu-builder.html',
      auto: true
    },
    {
      id: 'recipes_costed',
      phase: 'develop',
      label: 'Recipes linked and costed',
      hint: 'Every item needs a recipe link and food cost.',
      href: 'dish-creator.html',
      auto: true
    },
    {
      id: 'vendor_prices',
      phase: 'develop',
      label: 'Vendor prices updated',
      hint: 'Confirm ingredient costs match current invoices.',
      href: 'vendor-management.html',
      auto: false
    },
    {
      id: 'ingredients_library',
      phase: 'develop',
      label: 'Ingredient library started',
      hint: 'Add products you buy — feeds recipe and menu costing.',
      href: 'stock-setup.html',
      auto: true
    },
    {
      id: 'food_inventory',
      phase: 'develop',
      label: 'Opening food counts',
      hint: 'Record on-hand stock for variance and ordering.',
      href: 'inventory.html',
      auto: true
    },
    {
      id: 'specs_ready',
      phase: 'develop',
      label: 'Specs and ingredients complete',
      hint: 'Plate specs and ingredient library are ready for service.',
      href: 'spec-library.html',
      auto: false
    },
    {
      id: 'prep_list',
      phase: 'prep',
      label: 'Prep list generated',
      hint: 'Build tomorrow’s prep from the menu in Kitchen Hub.',
      href: 'kitchen-management.html',
      auto: true
    },
    {
      id: 'sops_published',
      phase: 'prep',
      label: 'How-to guides ready',
      hint: 'Publish SOPs so Shift staff see them in How-to.',
      href: 'sop-hub.html',
      auto: true
    },
    {
      id: 'publish_shift',
      phase: 'prep',
      label: 'Menu published to Shift',
      hint: 'Use Publish to Shift so the Menu tab updates for the team.',
      href: 'menu-builder.html',
      auto: true
    },
    {
      id: 'server_sheet',
      phase: 'golive',
      label: 'FOH / server sheet ready',
      hint: 'Allergens, pairings, and talking points for servers.',
      href: 'server-info-sheet.html',
      auto: false
    },
    {
      id: 'archive_snapshot',
      phase: 'golive',
      label: 'Archive snapshot taken',
      hint: 'Export a bundle before go-live.',
      href: 'archive-hub.html',
      auto: false
    },
    {
      id: 'pos_loaded',
      phase: 'golive',
      label: 'POS / pricing loaded',
      hint: 'Menu prices and PLUs match what guests will see.',
      href: null,
      auto: false
    },
    {
      id: 'team_briefed',
      phase: 'golive',
      label: 'Team briefed on new menu',
      hint: 'Line and FOH walked through changes.',
      href: 'project-hub.html',
      auto: false
    }
  ];

  var PHASE_LABELS = {
    develop: 'Develop',
    prep: 'Prep & publish',
    golive: 'Go-live'
  };

  var mounts = [];

  function storageKey(projectId) {
    return 'iterum_menu_launch_' + (projectId || 'default');
  }

  function resolveProjectId() {
    if (global.firestoreSync?.resolveProjectId) {
      var fromSync = global.firestoreSync.resolveProjectId();
      if (fromSync && fromSync !== 'master') return fromSync;
    }
    if (global.workspaceIdentity?.getCurrentProject) {
      var wp = global.workspaceIdentity.getCurrentProject();
      if (wp?.id && wp.id !== 'master') return wp.id;
    }
    var pm = global.projectManager;
    if (pm?.currentProject?.id && pm.currentProject.id !== 'master') {
      return pm.currentProject.id;
    }
  var uid =
      global.authManager?.currentUser?.userId ||
      global.authManager?.currentUser?.id ||
      '';
    if (uid) {
      var scoped = localStorage.getItem('iterum_current_project_user_' + uid);
      if (scoped && scoped !== 'master') return scoped;
    }
    var id =
      localStorage.getItem('iterum_current_project') ||
      localStorage.getItem('active_project') ||
      '';
    return id && id !== 'master' ? id : null;
  }

  function loadManual(projectId) {
    try {
      var raw = localStorage.getItem(storageKey(projectId));
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveManual(projectId, state) {
    try {
      localStorage.setItem(storageKey(projectId), JSON.stringify(state));
    } catch (e) {
      void e;
    }
  }

  function itemCost(item) {
    if (item.cost != null && item.cost !== '') return Number(item.cost);
    if (item.recipeId && global.foodCostingWorkflow) {
      var costData = global.foodCostingWorkflow.getRecipeCostFromRecipeBuilder(
        item.recipeId
      );
      if (costData) {
        return parseFloat(
          costData.costPerYieldUnit || costData.costPerServing || 0
        );
      }
    }
    return 0;
  }

  function itemStatus(item) {
    if (item.status) return item.status;
    if (item.recipeId || item.recipeLinkStatus === 'linked') return 'published';
    return 'draft';
  }

  function computeMenuStats(items) {
    var list = Array.isArray(items) ? items : [];
    var drafts = 0;
    var missingCost = 0;
    list.forEach(function (item) {
      if (itemStatus(item) === 'draft') drafts += 1;
      if (!itemCost(item)) missingCost += 1;
    });
    return {
      count: list.length,
      drafts: drafts,
      missingCost: missingCost
    };
  }

  function loadMenuData(projectId) {
    var em = global.enhancedMenuManager;
    if (
      em &&
      em.getCurrentProjectId &&
      em.getCurrentProjectId() === projectId &&
      Array.isArray(em.menuItems)
    ) {
      return { menu: em.currentMenu || null, items: em.menuItems };
    }
    try {
      var raw = localStorage.getItem('menu_data_' + projectId);
      if (!raw) return { menu: null, items: [] };
      var parsed = JSON.parse(raw);
      return {
        menu: parsed.menu || null,
        items: Array.isArray(parsed.items) ? parsed.items : []
      };
    } catch (e) {
      return { menu: null, items: [] };
    }
  }

  function hasPrepList(projectId) {
    var uid =
      global.authManager?.currentUser?.userId ||
      global.authManager?.currentUser?.id ||
      '';
    var keys = uid ? ['prep_lists_' + uid, 'prep_lists'] : ['prep_lists'];
    for (var i = 0; i < keys.length; i += 1) {
      try {
        var raw = localStorage.getItem(keys[i]);
        if (!raw) continue;
        var list = JSON.parse(raw);
        if (!Array.isArray(list) || !list.length) continue;
        if (
          list.some(function (p) {
            return !p.projectId || p.projectId === projectId;
          })
        ) {
          return true;
        }
      } catch (e) {
        void e;
      }
    }
    return false;
  }

  function sopCount(projectId) {
    if (global.iterumSopPack?.loadLocal) {
      var pack = global.iterumSopPack.loadLocal(projectId);
      return (pack?.sops || []).filter(function (s) {
        return s && (s.title || s.body);
      }).length;
    }
    try {
      var raw = localStorage.getItem('iterum_sop_pack_' + projectId);
      if (!raw) return 0;
      var parsed = JSON.parse(raw);
      return (parsed.sops || []).filter(function (s) {
        return s && (s.title || s.body);
      }).length;
    } catch (e) {
      return 0;
    }
  }

  function customIngredientCount() {
    if (global.iterumIngredientInventory?.countCustomIngredients) {
      return global.iterumIngredientInventory.countCustomIngredients();
    }
    try {
      var custom = global.localStorage.getItem('custom_ingredients');
      if (custom) {
        var list = JSON.parse(custom);
        if (Array.isArray(list) && list.length) return list.length;
      }
      var legacy = global.localStorage.getItem('ingredients_database');
      if (!legacy) return 0;
      var all = JSON.parse(legacy);
      if (!Array.isArray(all)) return 0;
      return all.filter(function (ing) {
        return ing && (ing.isCustom || !/^ing_\d+$/.test(ing.id || ''));
      }).length;
    } catch (e) {
      return 0;
    }
  }

  function foodInventoryCount() {
    if (global.iterumIngredientInventory?.getFoodInventoryStats) {
      return global.iterumIngredientInventory.getFoodInventoryStats().count;
    }
    try {
      var raw = global.localStorage.getItem('inventory_items');
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list.length : 0;
    } catch (e) {
      return 0;
    }
  }

  function autoDone(stepId, ctx) {
    switch (stepId) {
      case 'menu_structure':
        return ctx.stats.count > 0;
      case 'recipes_costed':
        return (
          ctx.stats.count > 0 &&
          ctx.stats.missingCost === 0 &&
          ctx.stats.drafts === 0
        );
      case 'ingredients_library':
        return ctx.customIngredients > 0;
      case 'food_inventory':
        return ctx.foodInventoryCount > 0;
      case 'prep_list':
        return ctx.hasPrepList;
      case 'sops_published':
        return ctx.sopCount > 0;
      case 'publish_shift':
        return !!ctx.menuPublished;
      default:
        return false;
    }
  }

  function buildContext(projectId) {
    var menuData = loadMenuData(projectId);
    var stats = computeMenuStats(menuData.items);
    var menu = menuData.menu;
    return {
      projectId: projectId,
      stats: stats,
      menuPublished: !!(menu && menu.isPublished),
      publishedAt: menu?.publishedAt || null,
      hasPrepList: hasPrepList(projectId),
      sopCount: sopCount(projectId),
      customIngredients: customIngredientCount(),
      foodInventoryCount: foodInventoryCount()
    };
  }

  function evaluate(projectId) {
    var manual = loadManual(projectId);
    var ctx = buildContext(projectId);
    return STEPS.map(function (step) {
      var done = step.auto ? autoDone(step.id, ctx) : !!manual[step.id];
      var detail = '';
      if (step.id === 'menu_structure' && !done) {
        detail = 'Add dishes in Menu Builder';
      } else if (step.id === 'recipes_costed' && !done && ctx.stats.count) {
        if (ctx.stats.missingCost) {
          detail = ctx.stats.missingCost + ' missing cost';
        } else if (ctx.stats.drafts) {
          detail = ctx.stats.drafts + ' draft' + (ctx.stats.drafts === 1 ? '' : 's');
        }
      } else if (step.id === 'ingredients_library' && !done) {
        detail = ctx.customIngredients
          ? ctx.customIngredients + ' product(s)'
          : 'Add via Stock setup';
      } else if (step.id === 'food_inventory' && !done) {
        detail = ctx.foodInventoryCount
          ? ctx.foodInventoryCount + ' count(s)'
          : 'Add opening stock';
      } else if (step.id === 'sops_published') {
        detail = ctx.sopCount
          ? ctx.sopCount + ' guide' + (ctx.sopCount === 1 ? '' : 's')
          : 'Publish from SOP Hub';
      } else if (step.id === 'publish_shift' && done && ctx.publishedAt) {
        try {
          detail = 'Published ' + new Date(ctx.publishedAt).toLocaleDateString();
        } catch (e) {
          detail = 'Published';
        }
      }
      return Object.assign({}, step, { done: done, detail: detail });
    });
  }

  function progress(steps) {
    var done = steps.filter(function (s) {
      return s.done;
    }).length;
    return {
      done: done,
      total: steps.length,
      pct: steps.length ? Math.round((done / steps.length) * 100) : 0
    };
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderStepRow(step, variant) {
    var icon = step.done
      ? 'fa-circle-check mlc-icon--ok'
      : step.auto
        ? 'fa-circle mlc-icon--pending'
        : 'fa-square mlc-icon--manual';
    var rowClass =
      'mlc-row' +
      (step.done ? ' is-done' : '') +
      (step.auto ? ' is-auto' : ' is-manual');
    var action = '';
    if (step.href && !step.done) {
      action =
        '<a class="mlc-link" href="' +
        escapeHtml(step.href) +
        '">Open <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>';
    }
    var toggle = '';
    if (!step.auto) {
      toggle =
        '<button type="button" class="mlc-toggle" data-mlc-id="' +
        escapeHtml(step.id) +
        '" aria-pressed="' +
        (step.done ? 'true' : 'false') +
        '" aria-label="' +
        escapeHtml((step.done ? 'Mark incomplete: ' : 'Mark complete: ') + step.label) +
        '" title="Mark complete">' +
        '<i class="fa-solid ' +
        (step.done ? 'fa-check' : 'fa-plus') +
        '" aria-hidden="true"></i></button>';
    }
    var detail = step.detail
      ? '<span class="mlc-detail">' + escapeHtml(step.detail) + '</span>'
      : '';
    return (
      '<li class="' +
      rowClass +
      '" data-step="' +
      escapeHtml(step.id) +
      '">' +
      '<i class="fa-solid ' +
      icon +
      '" aria-hidden="true"></i>' +
      '<div class="mlc-row__body">' +
      '<span class="mlc-label">' +
      escapeHtml(step.label) +
      '</span>' +
      detail +
      '</div>' +
      action +
      toggle +
      '</li>'
    );
  }

  function renderHtml(steps, variant, projectId) {
    var prog = progress(steps);
    var phases = ['develop', 'prep', 'golive'];
    var body = phases
      .map(function (phase) {
        var phaseSteps = steps.filter(function (s) {
          return s.phase === phase;
        });
        if (!phaseSteps.length) return '';
        return (
          '<div class="mlc-phase">' +
          '<h4 class="mlc-phase__title">' +
          escapeHtml(PHASE_LABELS[phase]) +
          '</h4>' +
          '<ul class="mlc-list">' +
          phaseSteps.map(function (s) {
            return renderStepRow(s, variant);
          }).join('') +
          '</ul></div>'
        );
      })
      .join('');

    var workspaceNote = projectId
      ? ''
      : '<p class="mlc-empty">Select a restaurant workspace to track menu launch progress.</p>';

    return (
      '<div class="mlc-card' +
      (variant === 'compact' ? ' mlc-card--compact' : '') +
      '" data-mlc-project="' +
      escapeHtml(projectId || '') +
      '">' +
      '<div class="mlc-head">' +
      '<div>' +
      '<h3 class="mlc-title"><i class="fa-solid fa-rocket" aria-hidden="true"></i> Menu launch</h3>' +
      '<p class="mlc-sub">From development through publish and go-live.</p>' +
      '</div>' +
      '<div class="mlc-progress-wrap" aria-label="' +
      prog.done +
      ' of ' +
      prog.total +
      ' complete">' +
      '<span class="mlc-progress__value">' +
      prog.pct +
      '%</span>' +
      '<div class="mlc-progress"><div class="mlc-progress__fill" style="width:' +
      prog.pct +
      '%"></div></div>' +
      '<span class="mlc-progress__meta">' +
      prog.done +
      '/' +
      prog.total +
      '</span>' +
      '</div>' +
      '</div>' +
      workspaceNote +
      body +
      '</div>'
    );
  }

  function bindContainer(container, projectId) {
    container.querySelectorAll('.mlc-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!projectId) return;
        var id = btn.getAttribute('data-mlc-id');
        if (!id || MANUAL_IDS.indexOf(id) < 0) return;
        var manual = loadManual(projectId);
        manual[id] = !manual[id];
        saveManual(projectId, manual);
        refresh();
        global.dispatchEvent(
          new CustomEvent('menuLaunchChecklistUpdated', {
            detail: { projectId: projectId, stepId: id, done: manual[id] }
          })
        );
      });
    });
  }

  function mount(selector, options) {
    options = options || {};
    var container =
      typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;
    if (!container) return null;

    var entry = mounts.find(function (m) {
      return m.container === container;
    });
    if (!entry) {
      entry = { container: container, variant: options.variant || 'dashboard' };
      mounts.push(entry);
    } else {
      entry.variant = options.variant || entry.variant;
    }

    var projectId = resolveProjectId();
    var steps = projectId ? evaluate(projectId) : STEPS.map(function (s) {
      return Object.assign({}, s, { done: false, detail: '' });
    });
    container.innerHTML = renderHtml(steps, entry.variant, projectId);
    bindContainer(container, projectId);
    return entry;
  }

  function refresh() {
    mounts.forEach(function (entry) {
      mount(entry.container, { variant: entry.variant });
    });
  }

  function initAutoMount() {
    mount('#mb-launch-checklist-root', { variant: 'compact' });
    mount('#menu-launch-checklist-dashboard', { variant: 'dashboard' });
  }

  global.iterumMenuLaunchChecklist = {
    STEPS: STEPS,
    mount: mount,
    refresh: refresh,
    evaluate: evaluate,
    resolveProjectId: resolveProjectId
  };

  ['projectChanged', 'menuPublishedToShift', 'menuWorkflowUpdated', 'menuLaunchChecklistUpdated', 'iterumFoodInventoryUpdated'].forEach(
    function (evt) {
      global.addEventListener(evt, function () {
        refresh();
      });
    }
  );

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(initAutoMount, 300);
    });
  } else {
    setTimeout(initAutoMount, 300);
  }
})(window);
