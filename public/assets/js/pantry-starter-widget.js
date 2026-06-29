/**
 * Dashboard — show pantry starter card until ingredients + inventory exist.
 */
(function (global) {
  'use strict';

  function updatePantryCard() {
    var card = document.getElementById('pantry-starter-card');
    if (!card) return;
    var ready =
      global.iterumIngredientInventory &&
      typeof global.iterumIngredientInventory.isPantryReady === 'function' &&
      global.iterumIngredientInventory.isPantryReady();
    if (ready) {
      card.setAttribute('hidden', '');
    } else {
      card.removeAttribute('hidden');
    }
    if (global.iterumMenuLaunchChecklist && global.iterumMenuLaunchChecklist.refresh) {
      global.iterumMenuLaunchChecklist.refresh();
    }
  }

  function init() {
    setTimeout(updatePantryCard, 400);
  }

  global.addEventListener('iterumFoodInventoryUpdated', updatePantryCard);
  global.addEventListener('storage', updatePantryCard);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
