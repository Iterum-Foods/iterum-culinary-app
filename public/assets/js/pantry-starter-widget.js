/**
 * Dashboard — next step uses pantry readiness.
 * Card stays visible until ingredients and opening counts exist.
 */
(function (global) {
  'use strict';

  function show(el) {
    if (!el) return;
    el.removeAttribute('hidden');
    el.style.display = '';
  }

  function hide(el) {
    if (!el) return;
    el.setAttribute('hidden', '');
    el.style.display = 'none';
  }

  function updatePantryCard() {
    var card = document.getElementById('pantry-starter-card');
    if (!card) return;
    var fallback = document.getElementById('dash-next-fallback');
    var ready =
      global.iterumIngredientInventory &&
      typeof global.iterumIngredientInventory.isPantryReady === 'function' &&
      global.iterumIngredientInventory.isPantryReady();
    if (ready) {
      hide(card);
      show(fallback);
    } else {
      show(card);
      hide(fallback);
    }
    if (typeof global.applyDashboardWorkspaceHero === 'function') {
      global.applyDashboardWorkspaceHero();
    }
    if (
      global.iterumMenuLaunchChecklist &&
      global.iterumMenuLaunchChecklist.refresh
    ) {
      global.iterumMenuLaunchChecklist.refresh();
    }
  }

  function init() {
    setTimeout(updatePantryCard, 400);
  }

  global.addEventListener('iterumFoodInventoryUpdated', updatePantryCard);
  global.addEventListener('iterumDashboardRoleApplied', updatePantryCard);
  global.addEventListener('storage', updatePantryCard);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
