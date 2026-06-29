/**
 * Ingredient library ↔ food inventory bridge.
 * Used by stock-setup, inventory modal quick-add, dashboard, and owner bot.
 */
(function (global) {
  'use strict';

  function ensureIngredientsManager() {
    if (global.ingredientsManager) {
      return global.ingredientsManager;
    }
    return null;
  }

  function readLegacyIngredients() {
    try {
      var raw =
        global.localStorage.getItem('ingredients_database') ||
        global.localStorage.getItem('ingredients') ||
        '[]';
      var list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeLegacyIngredients(list) {
    try {
      global.localStorage.setItem('ingredients_database', JSON.stringify(list));
      global.localStorage.setItem('ingredients', JSON.stringify(list));
    } catch (e) {
      console.warn('Could not save ingredients', e);
    }
  }

  function addIngredient(opts) {
    opts = opts || {};
    var name = String(opts.name || '').trim();
    if (!name) {
      throw new Error('Ingredient name is required');
    }

    var payload = {
      name: name,
      category: opts.category || 'other',
      subcategory: opts.subcategory || null,
      unit: opts.unit || 'lb',
      cost: Number(opts.cost) || 0,
      supplier: opts.supplier || '',
      dateAdded: new Date().toISOString(),
      isCustom: true
    };

    var mgr = ensureIngredientsManager();
    if (mgr && typeof mgr.addCustomIngredient === 'function') {
      return mgr.addCustomIngredient(payload);
    }

    payload.id =
      'custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    var list = readLegacyIngredients();
    var dupe = list.find(function (ing) {
      return (ing.name || '').toLowerCase() === name.toLowerCase();
    });
    if (dupe) {
      Object.assign(dupe, payload);
      writeLegacyIngredients(list);
      return dupe;
    }
    list.push(payload);
    writeLegacyIngredients(list);
    return payload;
  }

  function listIngredients() {
    var mgr = ensureIngredientsManager();
    if (mgr && typeof mgr.getAllIngredients === 'function') {
      return mgr.getAllIngredients();
    }
    return readLegacyIngredients();
  }

  function countCustomIngredients() {
    var mgr = ensureIngredientsManager();
    if (mgr && typeof mgr.getStats === 'function') {
      return mgr.getStats().custom || 0;
    }
    return readLegacyIngredients().filter(function (ing) {
      return ing && (ing.isCustom || !/^ing_\d+$/.test(ing.id || ''));
    }).length;
  }

  function addFoodStock(opts) {
    opts = opts || {};
    var ingredientId = opts.ingredientId;
    var ingredientName = String(opts.ingredientName || '').trim();
    var quantity = Number(opts.quantity);
    var unit = opts.unit || 'lb';
    var location = opts.location || 'Main Kitchen';

    if (!ingredientId && !ingredientName) {
      throw new Error('ingredientId or ingredientName required');
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      throw new Error('Valid quantity required');
    }

    if (!ingredientId && ingredientName) {
      var match = listIngredients().find(function (ing) {
        return (ing.name || '').toLowerCase() === ingredientName.toLowerCase();
      });
      if (match) {
        ingredientId = match.id;
        if (!opts.unit && match.unit) unit = match.unit;
      } else {
        var created = addIngredient({
          name: ingredientName,
          category: opts.category || 'other',
          unit: unit,
          cost: opts.cost || 0
        });
        ingredientId = created.id;
        ingredientName = created.name;
      }
    }

    if (!ingredientName) {
      var found = listIngredients().find(function (ing) {
        return ing.id === ingredientId;
      });
      ingredientName = found ? found.name : ingredientId;
      if (found && found.unit && !opts.unit) unit = found.unit;
    }

    if (!global.inventoryManager) {
      throw new Error('Inventory manager not loaded');
    }

    var item = global.inventoryManager.upsertInventoryItem(
      ingredientId,
      ingredientName,
      quantity,
      unit,
      location
    );

    var par = Number(opts.parLevel);
    var reorder = Number(opts.reorderPoint);
    if (par > 0 || reorder > 0) {
      global.inventoryManager.setParLevel(
        ingredientId,
        par > 0 ? par : 0,
        reorder > 0 ? reorder : 0,
        location
      );
      if (item) {
        item.parLevel = par > 0 ? par : item.parLevel;
        item.reorderPoint = reorder > 0 ? reorder : item.reorderPoint;
      }
    }

    global.dispatchEvent(
      new CustomEvent('iterumFoodInventoryUpdated', {
        detail: { ingredientId: ingredientId, item: item }
      })
    );

    return item;
  }

  function getFoodInventoryStats() {
    var list =
      global.inventoryManager && global.inventoryManager.getInventory
        ? global.inventoryManager.getInventory()
        : [];
    var low = 0;
    var out = 0;
    list.forEach(function (item) {
      if (!item) return;
      if (item.quantity <= 0) out += 1;
      else if (item.reorderPoint > 0 && item.quantity <= item.reorderPoint) {
        low += 1;
      }
    });
    return {
      count: list.length,
      lowStock: low,
      outOfStock: out
    };
  }

  function isPantryReady() {
    return countCustomIngredients() > 0 && getFoodInventoryStats().count > 0;
  }

  global.iterumIngredientInventory = {
    addIngredient: addIngredient,
    listIngredients: listIngredients,
    countCustomIngredients: countCustomIngredients,
    addFoodStock: addFoodStock,
    getFoodInventoryStats: getFoodInventoryStats,
    isPantryReady: isPantryReady
  };
})(typeof window !== 'undefined' ? window : this);
