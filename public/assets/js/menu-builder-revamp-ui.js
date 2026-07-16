/**
 * Menu Builder revamp UI — taste-craft-revamp MenuBuilder layout (vanilla JS).
 * Wires into menus_${userId}, selectMenuToEdit, enhancedMenuManager, existing modals.
 */
(function () {
  'use strict';

  const WORKFLOW = [
    { key: 'build', label: 'Build' },
    { key: 'cost', label: 'Cost' },
    { key: 'review', label: 'Review' },
    { key: 'publish', label: 'Publish' }
  ];

  const DEFAULT_CATEGORIES = [
    'Appetizers',
    'Salads',
    'Main Courses',
    'Sides',
    'Desserts',
    'Beverages'
  ];

  const state = {
    menus: [],
    activeMenuIndex: 0,
    search: '',
    view: 'list',
    stage: 'build',
    defaultCategory: null
  };

  function currency(n) {
    return Number(n || 0).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getUserMenus() {
    const user = window.authManager?.currentUser;
    if (!user) return [];
    const userId = user.userId || user.id;
    const key = `menus_${userId}`;
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  function saveUserMenus(menus) {
    const user = window.authManager?.currentUser;
    if (!user) return;
    const userId = user.userId || user.id;
    localStorage.setItem(`menus_${userId}`, JSON.stringify(menus));
  }

  function getActiveMenu() {
    return state.menus[state.activeMenuIndex] || null;
  }

  function getItems() {
    const menu = getActiveMenu();
    return menu?.items || [];
  }

  function itemGlobalIndex(menu, item) {
    if (!menu?.items?.length || !item) return -1;
    if (item.id != null) {
      const byId = menu.items.findIndex(x => x.id === item.id);
      if (byId >= 0) return byId;
    }
    return menu.items.indexOf(item);
  }

  function getMenuCategories(menu, items) {
    if (menu?.categories?.length) {
      return menu.categories
        .map(c => (typeof c === 'string' ? c : c.name || c.title || ''))
        .filter(Boolean);
    }
    const fromItems = [...new Set(items.map(i => i.category).filter(Boolean))];
    return fromItems.length ? fromItems : [...DEFAULT_CATEGORIES];
  }

  function itemCost(item) {
    if (item.cost != null && item.cost !== '') return Number(item.cost);
    if (item.recipeId && window.foodCostingWorkflow) {
      const costData =
        window.foodCostingWorkflow.getRecipeCostFromRecipeBuilder(
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

  function menuService(menu) {
    const type = menu?.menuType || menu?.menu_type;
    if (
      type &&
      window.MenuPlanFormat?.beverageMenuLabel &&
      window.MenuPlanFormat.isBeverageMenuType(type)
    ) {
      return window.MenuPlanFormat.beverageMenuLabel(type);
    }
    return (
      menu?.service?.mealPeriods?.join(' · ') ||
      menu?.menuType ||
      menu?.menu_type ||
      'Menu'
    );
  }

  function formatUpdated(menu) {
    const d = menu.updatedAt || menu.createdAt;
    if (!d) return 'Recently';
    try {
      return new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  }

  function computeStats(items) {
    const count = items.length;
    let totalRevenue = 0;
    let totalCost = 0;
    let marginSum = 0;
    let drafts = 0;
    let missingCost = 0;

    items.forEach(item => {
      const price = Number(item.price) || 0;
      const cost = itemCost(item);
      totalRevenue += price;
      totalCost += cost;
      if (price > 0) marginSum += (price - cost) / price;
      if (itemStatus(item) === 'draft') drafts += 1;
      if (!cost) missingCost += 1;
    });

    const avgMargin = count ? marginSum / count : 0;
    const foodCostPct = totalRevenue ? totalCost / totalRevenue : 0;

    return {
      count,
      avgPrice: count ? totalRevenue / count : 0,
      foodCostPct,
      margin: avgMargin,
      drafts,
      missingCost
    };
  }

  function computeHealth(stats) {
    const foodCostScore = Math.max(0, 100 - stats.foodCostPct * 100 * 2.2);
    const draftPenalty = (stats.drafts / Math.max(1, stats.count)) * 30;
    const missingPenalty = (stats.missingCost / Math.max(1, stats.count)) * 20;
    return Math.round(
      Math.max(10, Math.min(99, foodCostScore - draftPenalty - missingPenalty))
    );
  }

  function filteredItems() {
    const q = state.search.trim().toLowerCase();
    const items = getItems();
    if (!q) return items;
    return items.filter(
      it =>
        (it.name || '').toLowerCase().includes(q) ||
        (it.description || '').toLowerCase().includes(q)
    );
  }

  function groupedItems() {
    const menu = getActiveMenu();
    if (!menu) return [];
    const items = filteredItems();
    const categories = getMenuCategories(menu, getItems());
    const map = new Map();
    categories.forEach(c => map.set(c, []));
    items.forEach(it => {
      const cat = it.category || categories[0] || 'Main Courses';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(it);
    });
    return Array.from(map.entries());
  }

  function syncGlobals(menu, index) {
    if (!menu) return;
    window.currentSelectedMenu = { ...menu, index };
    if (window.enhancedMenuManager) {
      window.enhancedMenuManager.currentMenu = menu;
      window.enhancedMenuManager.menuItems = menu.items || [];
      const projectId =
        window.enhancedMenuManager.getCurrentProjectId?.() || 'master';
      localStorage.setItem(
        `menu_data_${projectId}`,
        JSON.stringify({ menu, items: menu.items || [] })
      );
    }
    if (typeof window.displayMenuItems === 'function') {
      window.displayMenuItems(menu);
    }
  }

  function selectMenuByIndex(index) {
    if (index < 0 || index >= state.menus.length) return;
    state.activeMenuIndex = index;
    const menu = state.menus[index];
    syncGlobals(menu, index);
    if (typeof window.selectMenuToEdit === 'function') {
      window.selectMenuToEdit(index);
    }
    render();
  }

  function refreshMenusFromStorage() {
    state.menus = getUserMenus();
    if (state.activeMenuIndex >= state.menus.length) {
      state.activeMenuIndex = Math.max(0, state.menus.length - 1);
    }
    const cur = window.currentSelectedMenu;
    if (cur && typeof cur.index === 'number') {
      state.activeMenuIndex = cur.index;
    }
  }

  function persistActiveMenuItems(items) {
    const idx = state.activeMenuIndex;
    if (idx < 0 || !state.menus[idx]) return;
    state.menus[idx].items = items;
    state.menus[idx].updatedAt = new Date().toISOString();
    saveUserMenus(state.menus);
    syncGlobals(state.menus[idx], idx);
  }

  function showToast(msg, type) {
    if (window.enhancedMenuManager?.showToast) {
      window.enhancedMenuManager.showToast(msg, type || 'success');
    } else {
      console.log('[Menu Builder]', msg);
    }
  }

  function openAddItem(category) {
    const params = new URLSearchParams({ return: 'menu-builder.html' });
    if (category) params.set('category', category);
    const menu = getActiveMenu();
    if (menu?.id) params.set('menuId', menu.id);
    window.location.href = `dish-creator.html?${params.toString()}`;
  }

  function removeItem(itemIndex) {
    const menu = getActiveMenu();
    if (!menu) return;
    const items = [...(menu.items || [])];
    const item = items[itemIndex];
    if (!item) return;

    if (item.id && window.enhancedMenuManager?.deleteMenuItem) {
      window.enhancedMenuManager.deleteMenuItem(item.id).then(() => {
        refreshMenusFromStorage();
        render();
      });
      return;
    }

    if (!confirm(`Remove "${item.name || 'this item'}" from this menu?`))
      return;

    items.splice(itemIndex, 1);
    persistActiveMenuItems(items);
    showToast(`Removed "${item.name || 'item'}"`);
    render();
  }

  function duplicateItem(itemIndex) {
    const menu = getActiveMenu();
    if (!menu?.id) return;
    if (typeof window.duplicateMenuItem === 'function') {
      window.duplicateMenuItem(menu.id, itemIndex);
      setTimeout(() => {
        refreshMenusFromStorage();
        render();
        showToast('Item duplicated');
      }, 300);
    }
  }

  function editItem(itemIndex) {
    const menu = getActiveMenu();
    if (!menu?.id) return;
    if (typeof window.editMenuItem === 'function') {
      window.editMenuItem(menu.id, itemIndex);
    } else if (window.enhancedMenuManager?.showEditItemModal) {
      const item = menu.items?.[itemIndex];
      if (item?.id) window.enhancedMenuManager.showEditItemModal(item.id);
    }
  }

  function statusPillHtml(status) {
    const key = (status || 'draft').toLowerCase().replace(/\s+/g, '-');
    return `<span class="mb-status-pill mb-status-pill--${escapeHtml(key)}">${escapeHtml(status)}</span>`;
  }

  function marginClass(margin) {
    if (margin >= 0.7) return 'mb-item-card__margin--high';
    if (margin >= 0.55) return 'mb-item-card__margin--mid';
    return 'mb-item-card__margin--low';
  }

  function renderItemActions(menu, itemIndex) {
    return `
      <button type="button" class="mb-icon-btn" title="Duplicate" data-mb-dup="${itemIndex}" aria-label="Duplicate">
        <i class="fa-regular fa-copy" aria-hidden="true"></i>
      </button>
      <button type="button" class="mb-icon-btn" title="Edit" data-mb-edit="${itemIndex}" aria-label="Edit">
        <i class="fa-solid fa-pencil" aria-hidden="true"></i>
      </button>
      <button type="button" class="mb-icon-btn mb-icon-btn--danger" title="Remove" data-mb-rm="${itemIndex}" aria-label="Remove">
        <i class="fa-solid fa-trash" aria-hidden="true"></i>
      </button>`;
  }

  function renderListSection(category, list) {
    const menu = getActiveMenu();
    return `
      <section class="mb-category-section" data-mb-category="${escapeHtml(category)}">
        <header class="mb-category-section__head">
          <h3 class="mb-category-section__title">
            ${escapeHtml(category)}
            <span class="mb-category-section__count">${list.length}</span>
          </h3>
          <button type="button" class="tc-btn tc-btn-ghost tc-btn-sm" data-mb-add-cat="${escapeHtml(category)}">
            <i class="fa-solid fa-plus" aria-hidden="true"></i> Add
          </button>
        </header>
        <ul class="mb-item-list" role="list">
          ${list
            .map(item => {
              const idx = itemGlobalIndex(menu, item);
              if (idx < 0) return '';
              const price = Number(item.price) || 0;
              const cost = itemCost(item);
              const margin = price ? (price - cost) / price : 0;
              const dietary = item.dietaryInfo || item.dietary || [];
              const allergens = item.allergens || [];
              return `
            <li class="mb-item-row" data-item-index="${idx}">
              <div class="mb-item-row__top">
                <div>
                  <div class="mb-item-row__name">${escapeHtml(item.name)} ${statusPillHtml(itemStatus(item))}</div>
                  <p class="mb-item-row__desc">${escapeHtml(item.description || '')}</p>
                  <div class="mb-item-badges">
                    ${dietary
                      .slice(0, 3)
                      .map(
                        d => `<span class="mb-badge">${escapeHtml(d)}</span>`
                      )
                      .join('')}
                    ${allergens
                      .slice(0, 3)
                      .map(
                        a =>
                          `<span class="mb-badge mb-badge--outline">${escapeHtml(a)}</span>`
                      )
                      .join('')}
                  </div>
                </div>
                <div>
                  <div class="mb-item-row__price">${currency(price)}</div>
                  <div class="mb-item-row__sub">cost ${currency(cost)} · ${Math.round(margin * 100)}% margin</div>
                  <div class="mb-item-row__actions">${renderItemActions(menu, idx)}</div>
                </div>
              </div>
            </li>`;
            })
            .join('')}
        </ul>
      </section>`;
  }

  function renderBoardLane(category, list) {
    const menu = getActiveMenu();
    const cards =
      list.length === 0
        ? `<button type="button" class="mb-add-lane-btn" data-mb-add-cat="${escapeHtml(category)}">
            <i class="fa-solid fa-plus" aria-hidden="true"></i> Add first item
          </button>`
        : list
            .map(item => {
              const idx = itemGlobalIndex(menu, item);
              if (idx < 0) return '';
              const price = Number(item.price) || 0;
              const cost = itemCost(item);
              const margin = price ? (price - cost) / price : 0;
              const dietary = item.dietaryInfo || item.dietary || [];
              const allergens = item.allergens || [];
              return `
          <article class="mb-item-card" data-item-index="${idx}">
            <div class="mb-item-card__head">
              <span class="mb-item-card__name">${escapeHtml(item.name)}</span>
              <span class="font-semibold text-sm">${currency(price)}</span>
            </div>
            <p class="mt-1 text-xs text-muted-foreground" style="color:hsl(var(--tc-muted-foreground))">${escapeHtml((item.description || '').slice(0, 80))}</p>
            <div class="mt-2 flex justify-between items-center">
              ${statusPillHtml(itemStatus(item))}
              <span class="mb-item-card__margin ${marginClass(margin)}">${Math.round(margin * 100)}% margin</span>
            </div>
            <div class="mb-item-badges mt-2">
              ${dietary
                .slice(0, 2)
                .map(d => `<span class="mb-badge">${escapeHtml(d)}</span>`)
                .join('')}
              ${allergens
                .slice(0, 2)
                .map(
                  a =>
                    `<span class="mb-badge mb-badge--outline">${escapeHtml(a)}</span>`
                )
                .join('')}
            </div>
            <div class="mt-2 flex justify-end gap-1">${renderItemActions(menu, idx)}</div>
          </article>`;
            })
            .join('');

    return `
      <section class="mb-board-lane">
        <header class="mb-board-lane__head">
          <h3 class="mb-category-section__title">${escapeHtml(category)} <span class="mb-category-section__count">${list.length}</span></h3>
          <button type="button" class="mb-icon-btn" data-mb-add-cat="${escapeHtml(category)}" aria-label="Add item">
            <i class="fa-solid fa-plus" aria-hidden="true"></i>
          </button>
        </header>
        <div class="mb-board-lane__body">${cards}</div>
      </section>`;
  }

  function renderItems() {
    const el = document.getElementById('mb-revamp-items');
    if (!el) return;

    const menu = getActiveMenu();
    if (!menu) {
      el.innerHTML = `
        <div class="mb-empty">
          <div class="mb-empty__icon"><i class="fa-solid fa-utensils" aria-hidden="true"></i></div>
          <h3 class="mb-meta__title" style="font-size:1.125rem">No menus yet</h3>
          <p class="mb-meta__desc">Create a menu to start building your service.</p>
          <button type="button" class="tc-btn tc-btn-accent mt-4" id="mb-empty-create">Create menu</button>
        </div>`;
      document
        .getElementById('mb-empty-create')
        ?.addEventListener('click', () => {
          if (typeof window.openCreateMenuModal === 'function')
            window.openCreateMenuModal();
        });
      return;
    }

    const grouped = groupedItems();
    const nonEmpty = grouped.filter(([, list]) => list.length > 0);

    if (nonEmpty.length === 0) {
      el.innerHTML = `
        <div class="mb-empty">
          <div class="mb-empty__icon"><i class="fa-solid fa-list-check" aria-hidden="true"></i></div>
          <h3 class="mb-meta__title" style="font-size:1.125rem">No items match</h3>
          <p class="mb-meta__desc">Try clearing search or add a new ${window.MenuBeverageHelper?.isBeverageMenuActive(menu) ? 'drink' : 'dish'}.</p>
          <button type="button" class="tc-btn tc-btn-accent mt-4" id="mb-empty-add">Add ${window.MenuBeverageHelper?.isBeverageMenuActive(menu) ? 'drink' : 'menu item'}</button>
        </div>`;
      document
        .getElementById('mb-empty-add')
        ?.addEventListener('click', () => openAddItem());
      return;
    }

    if (state.view === 'board') {
      el.innerHTML = `<div class="mb-board-grid">${grouped.map(([cat, list]) => renderBoardLane(cat, list)).join('')}</div>`;
    } else {
      el.innerHTML = `<div class="space-y-6">${nonEmpty.map(([cat, list]) => renderListSection(cat, list)).join('')}</div>`;
    }
  }

  function renderWorkflow() {
    const el = document.getElementById('mb-workflow-stepper');
    if (!el) return;
    const idx = WORKFLOW.findIndex(s => s.key === state.stage);
    el.innerHTML = WORKFLOW.map((s, i) => {
      const active = s.key === state.stage;
      const done = i < idx;
      return `
        <button type="button" class="mb-workflow-step${active ? ' is-active' : ''}${done ? ' is-done' : ''}" data-mb-stage="${s.key}">
          <span class="mb-workflow-step__num">${done ? '<i class="fa-solid fa-check" style="font-size:0.5rem"></i>' : i + 1}</span>
          ${escapeHtml(s.label)}
        </button>`;
    }).join('');
  }

  function renderMenuTabs() {
    const el = document.getElementById('mb-menu-tabs');
    if (!el) return;
    if (!state.menus.length) {
      el.innerHTML = `<span class="text-sm" style="color:hsl(var(--tc-muted-foreground))">No menus — create one to begin</span>`;
      return;
    }
    el.innerHTML = state.menus
      .map((m, i) => {
        const active = i === state.activeMenuIndex;
        return `
        <button type="button" class="mb-menu-tab${active ? ' is-active' : ''}" data-mb-menu-index="${i}">
          <span>${escapeHtml(m.name)}</span>
          <span class="mb-menu-tab__badge">${escapeHtml(menuService(m))}</span>
        </button>`;
      })
      .join('');
  }

  function renderMetaAndStats() {
    const menu = getActiveMenu();
    const items = getItems();
    const stats = computeStats(items);
    const health = computeHealth(stats);

    const titleEl = document.getElementById('mb-active-menu-title');
    const descEl = document.getElementById('mb-active-menu-desc');
    const metaEl = document.getElementById('mb-active-menu-meta');
    if (titleEl) titleEl.textContent = menu?.name || 'Select a menu';
    if (descEl) descEl.textContent = menu?.description || '';
    if (metaEl && menu) {
      const icon = window.MenuBeverageHelper?.isBeverageMenuActive(menu)
        ? 'fa-wine-glass'
        : 'fa-hat-chef';
      metaEl.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i> ${escapeHtml(menuService(menu))} · updated ${formatUpdated(menu)}`;
    }

    const costLabel =
      document.querySelector('#mb-stat-food-cost')?.previousElementSibling;
    if (costLabel && menu) {
      costLabel.innerHTML = window.MenuBeverageHelper?.isBeverageMenuActive(
        menu
      )
        ? '<i class="fa-solid fa-percent" aria-hidden="true"></i> Pour cost'
        : '<i class="fa-solid fa-percent" aria-hidden="true"></i> Food cost';
    }

    window.MenuBeverageHelper?.updateQuickBarVisibility?.();

    const set = (id, val) => {
      const n = document.getElementById(id);
      if (n) n.textContent = val;
    };
    set('mb-stat-health', String(health));
    const prog = document.getElementById('mb-health-progress-fill');
    if (prog) prog.style.width = `${health}%`;

    set('mb-stat-items', String(stats.count));
    set('mb-stat-avg-price', currency(stats.avgPrice));
    set('mb-stat-food-cost', `${Math.round(stats.foodCostPct * 100)}%`);
    set('mb-stat-margin', `${Math.round(stats.margin * 100)}%`);

    const checkCost = document.getElementById('mb-check-cost');
    const checkDrafts = document.getElementById('mb-check-drafts');
    if (checkCost) {
      const ok = stats.missingCost === 0;
      checkCost.className = `mb-checklist__row${ok ? ' is-ok' : ''}`;
      checkCost.innerHTML = `
        <i class="fa-solid ${ok ? 'fa-circle-check mb-checklist__icon--ok' : 'fa-triangle-exclamation mb-checklist__icon--warn'}" aria-hidden="true"></i>
        <span>${ok ? 'All items costed' : `${stats.missingCost} missing cost`}</span>`;
    }
    if (checkDrafts) {
      const ok = stats.drafts === 0;
      checkDrafts.className = `mb-checklist__row${ok ? ' is-ok' : ''}`;
      checkDrafts.innerHTML = `
        <i class="fa-solid ${ok ? 'fa-circle-check mb-checklist__icon--ok' : 'fa-triangle-exclamation mb-checklist__icon--warn'}" aria-hidden="true"></i>
        <span>${ok ? 'No drafts' : `${stats.drafts} drafts to review`}</span>`;
    }
  }

  function render() {
    renderMenuTabs();
    renderWorkflow();
    renderMetaAndStats();
    renderItems();
    window.iterumMenuLaunchChecklist?.refresh?.();
  }

  function bindRoot() {
    const root = document.getElementById('mb-revamp-app');
    if (!root || root.dataset.mbBound === '1') return;
    root.dataset.mbBound = '1';

    document.getElementById('mb-btn-import')?.addEventListener('click', () => {
      if (typeof window.showImportModal === 'function')
        window.showImportModal();
    });
    document.getElementById('mb-btn-preview')?.addEventListener('click', () => {
      showToast('Preview opened in new tab', 'success');
    });
    document
      .getElementById('mb-btn-publish')
      ?.addEventListener('click', async () => {
        if (window.enhancedMenuManager?.publishMenuToShift) {
          await window.enhancedMenuManager.publishMenuToShift();
        } else {
          showToast('Menu manager not ready — refresh and try again.', 'error');
        }
      });
    document
      .getElementById('mb-btn-new-menu')
      ?.addEventListener('click', () => {
        if (typeof window.openCreateMenuModal === 'function')
          window.openCreateMenuModal();
      });
    document
      .getElementById('mb-btn-new-dish')
      ?.addEventListener('click', () => {
        openAddItem(state.defaultCategory);
      });
    document
      .getElementById('mb-btn-add-item')
      ?.addEventListener('click', () => openAddItem(state.defaultCategory));

    document
      .getElementById('mb-beverage-quick-bar')
      ?.addEventListener('click', e => {
        const btn = e.target.closest('[data-bev-quick]');
        if (!btn) return;
        if (window.MenuBeverageHelper?.openQuickAdd) {
          window.MenuBeverageHelper.openQuickAdd({
            kind: btn.dataset.bevQuick
          });
        }
      });
    document.getElementById('mb-btn-filters')?.addEventListener('click', () => {
      showToast('Filters coming soon', 'info');
    });

    document.getElementById('mb-search')?.addEventListener('input', e => {
      state.search = e.target.value;
      renderItems();
    });

    document.getElementById('mb-view-list')?.addEventListener('click', () => {
      state.view = 'list';
      document.getElementById('mb-view-list')?.classList.add('is-active');
      document.getElementById('mb-view-board')?.classList.remove('is-active');
      renderItems();
    });
    document.getElementById('mb-view-board')?.addEventListener('click', () => {
      state.view = 'board';
      document.getElementById('mb-view-board')?.classList.add('is-active');
      document.getElementById('mb-view-list')?.classList.remove('is-active');
      renderItems();
    });

    root.addEventListener('click', e => {
      const menuBtn = e.target.closest('[data-mb-menu-index]');
      if (menuBtn) {
        selectMenuByIndex(parseInt(menuBtn.dataset.mbMenuIndex, 10));
        return;
      }
      const stageBtn = e.target.closest('[data-mb-stage]');
      if (stageBtn) {
        state.stage = stageBtn.dataset.mbStage;
        const targetId =
          state.stage === 'cost'
            ? 'mb-revamp-health'
            : state.stage === 'publish'
              ? 'mb-revamp-ai'
              : 'mb-revamp-items';
        document
          .getElementById(targetId)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        renderWorkflow();
        return;
      }
      const addCat = e.target.closest('[data-mb-add-cat]');
      if (addCat) {
        openAddItem(addCat.dataset.mbAddCat);
        return;
      }
      const dup = e.target.closest('[data-mb-dup]');
      if (dup) {
        duplicateItem(parseInt(dup.dataset.mbDup, 10));
        return;
      }
      const edit = e.target.closest('[data-mb-edit]');
      if (edit) {
        editItem(parseInt(edit.dataset.mbEdit, 10));
        return;
      }
      const rm = e.target.closest('[data-mb-rm]');
      if (rm) {
        removeItem(parseInt(rm.dataset.mbRm, 10));
      }
    });

    ['mb-ai-rebalance', 'mb-ai-rewrite', 'mb-ai-pairings'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => {
        const labels = {
          'mb-ai-rebalance': 'Analyzing food cost…',
          'mb-ai-rewrite': 'Drafting descriptions…',
          'mb-ai-pairings': 'Looking for pairings…'
        };
        showToast(labels[id] || 'Working…', 'info');
      });
    });
  }

  function patchLegacyHooks() {
    if (window.__mbRevampPatched) return;
    window.__mbRevampPatched = true;

    const origPopulate = window.populateMenuSelector;
    if (typeof origPopulate === 'function') {
      window.populateMenuSelector = function () {
        origPopulate.apply(this, arguments);
        refreshMenusFromStorage();
        render();
      };
    }

    const origSelect = window.selectMenuToEdit;
    if (typeof origSelect === 'function') {
      window.selectMenuToEdit = function (index) {
        origSelect.apply(this, arguments);
        refreshMenusFromStorage();
        state.activeMenuIndex = index;
        render();
      };
    }

    const origDisplay = window.displayMenuItems;
    window.displayMenuItems = function (menu) {
      if (typeof origDisplay === 'function') origDisplay(menu);
      refreshMenusFromStorage();
      render();
    };
  }

  function init() {
    const app = document.getElementById('mb-revamp-app');
    if (!app) return;
    refreshMenusFromStorage();
    bindRoot();
    patchLegacyHooks();
    if (state.menus.length) {
      if (!window.currentSelectedMenu) {
        selectMenuByIndex(0);
      } else {
        syncGlobals(state.menus[state.activeMenuIndex], state.activeMenuIndex);
        render();
      }
    } else {
      render();
    }
    console.log('✅ Menu Builder revamp UI ready');
  }

  window.menuBuilderRevampUI = {
    refresh: function () {
      refreshMenusFromStorage();
      render();
    },
    render,
    selectMenuByIndex
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 200));
  } else {
    setTimeout(init, 200);
  }

  window.addEventListener('projectChanged', () => {
    refreshMenusFromStorage();
    render();
  });
})();
