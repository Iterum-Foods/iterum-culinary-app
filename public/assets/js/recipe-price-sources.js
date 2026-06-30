/**
 * Recipe / menu costing — price source labels (golden path slice 3).
 * Shows whether each ingredient cost came from library, vendor, or workspace override.
 */
(function (global) {
  'use strict';

  var SOURCE_META = {
    firestore_vendor_price: {
      label: 'Workspace override',
      hint: 'Firestore vendor_prices row for the active workspace — wins over library prices.'
    },
    ingredient_library: {
      label: 'Ingredient library',
      hint: 'Cost stored on the ingredient record in your library.'
    },
    vendor_catalog: {
      label: 'Vendor catalog',
      hint: 'Best vendor price linked to the ingredient.'
    },
    vendor_price_list: {
      label: 'Vendor price list',
      hint: 'Legacy vendor price list entry.'
    },
    case_pricing: {
      label: 'Case pricing',
      hint: 'Derived from case size and conversion on the ingredient.'
    },
    missing: {
      label: 'Missing price',
      hint: 'No library or override price — costing may be incomplete.'
    },
    unknown: {
      label: 'Unknown',
      hint: 'Price resolved but source not tagged.'
    }
  };

  function escapeHtml(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getSourceLabel(key) {
    return (SOURCE_META[key] || SOURCE_META.unknown).label;
  }

  function summarizePriceSources(ingredientCosts) {
    const list = Array.isArray(ingredientCosts) ? ingredientCosts : [];
    const counts = {};
    const lines = [];
    list.forEach(function (ing) {
      const key = ing.priceFound
        ? ing.priceSource || 'unknown'
        : 'missing';
      counts[key] = (counts[key] || 0) + 1;
      if (key === 'firestore_vendor_price') {
        lines.push({
          name: ing.name,
          source: key,
          price: ing.pricePerUnit,
          unit: ing.priceUnit,
          previousPrice: ing.previousPrice,
          previousSource: ing.previousSource
        });
      }
    });
    return {
      total: list.length,
      counts: counts,
      overrideLines: lines,
      overrideCount: counts.firestore_vendor_price || 0,
      missingCount: counts.missing || 0
    };
  }

  function renderPriceSourcesPanel(costData) {
    const ings = costData?.ingredientCosts || [];
    if (!ings.length) {
      return '';
    }
    const summary = summarizePriceSources(ings);
    const chips = Object.keys(summary.counts)
      .map(function (key) {
        const meta = SOURCE_META[key] || SOURCE_META.unknown;
        return (
          '<span class="rp-src-chip rp-src-chip--' +
          escapeHtml(key) +
          '" title="' +
          escapeHtml(meta.hint) +
          '">' +
          '<strong>' +
          summary.counts[key] +
          '</strong> ' +
          escapeHtml(meta.label) +
          '</span>'
        );
      })
      .join('');

    let overrideDetail = '';
    if (summary.overrideLines.length) {
      overrideDetail =
        '<ul class="rp-src-list">' +
        summary.overrideLines
          .map(function (row) {
            let extra = '';
            if (row.previousPrice > 0) {
              extra =
                ' <span class="rp-src-was">(was $' +
                Number(row.previousPrice).toFixed(4) +
                ' from ' +
                escapeHtml(getSourceLabel(row.previousSource || 'ingredient_library')) +
                ')</span>';
            }
            return (
              '<li><strong>' +
              escapeHtml(row.name) +
              '</strong> — $' +
              Number(row.price).toFixed(4) +
              '/' +
              escapeHtml(row.unit || 'unit') +
              extra +
              '</li>'
            );
          })
          .join('') +
        '</ul>';
    }

    return (
      '<details class="rp-price-sources" open>' +
      '<summary class="rp-price-sources__summary">' +
      '<span class="rp-price-sources__title">Price sources</span>' +
      '<span class="rp-price-sources__hint">Where ingredient unit costs came from for this recipe</span>' +
      '</summary>' +
      '<div class="rp-price-sources__chips">' +
      chips +
      '</div>' +
      (summary.overrideCount
        ? '<p class="rp-price-sources__note">Workspace overrides apply to the active project and refresh when you change vendor prices or switch workspaces.</p>' +
          overrideDetail
        : '') +
      (summary.missingCount
        ? '<p class="rp-price-sources__warn">' +
          summary.missingCount +
          ' ingredient(s) still missing a price — add library cost or a workspace override.</p>'
        : '') +
      '<a class="rp-price-sources__link" href="vendor-management.html#vendor-pricing-workspace">Manage workspace overrides</a>' +
      '</details>'
    );
  }

  function renderCompactPanel(costData) {
    const summary = summarizePriceSources(costData?.ingredientCosts || []);
    if (!summary.total) {
      return '<p class="rp-src-empty">Add ingredients to see price sources.</p>';
    }
    return renderPriceSourcesPanel(costData);
  }

  async function refreshVendorPrices() {
    const fs = global.firestoreSync;
    if (fs?.initialized && typeof fs.refreshVendorPricesFromFirestore === 'function') {
      try {
        await fs.refreshVendorPricesFromFirestore();
      } catch (e) {
        console.warn('Could not refresh vendor overrides for costing', e);
      }
    }
    if (global.costCalculator) {
      global.costCalculator.loadIngredientPrices();
    }
  }

  function gatherRecipeDeveloperData() {
    const servings =
      parseInt(document.getElementById('recipe-servings')?.value, 10) || 4;
    const ingredients =
      typeof global.collectIngredientsFromRows === 'function'
        ? global.collectIngredientsFromRows()
        : [];
    return {
      name: document.getElementById('recipe-name')?.value || 'Recipe',
      servings: servings,
      yieldQuantity: servings,
      prepTime: '0',
      cookTime: '0',
      ingredients: ingredients
    };
  }

  function updateRecipeDeveloperCostCard() {
    const cc = global.costCalculator;
    if (!cc || !document.getElementById('tc-rd-cost-card')) {
      return;
    }
    const recipe = gatherRecipeDeveloperData();
    const panel = document.getElementById('tc-rd-price-sources');
    const batchEl = document.getElementById('tc-rd-batch-cost');
    const portionEl = document.getElementById('tc-rd-cost-portion');
    const suggestEl = document.getElementById('tc-rd-suggested-price');

    if (!recipe.ingredients?.length) {
      if (batchEl) batchEl.textContent = '$0.00';
      if (portionEl) portionEl.textContent = '$0.00';
      if (suggestEl) suggestEl.textContent = '$0.00';
      if (panel) {
        panel.innerHTML =
          '<p class="rp-src-empty">Add ingredients to see live costing and price sources.</p>';
      }
      return;
    }

    const costData = cc.calculateRecipeCost(recipe);
    const batch = parseFloat(costData.totalCost) || 0;
    const portion = parseFloat(costData.costPerServing) || 0;
    const suggested = portion > 0 ? portion / 0.28 : 0;

    if (batchEl) batchEl.textContent = '$' + batch.toFixed(2);
    if (portionEl) portionEl.textContent = '$' + portion.toFixed(2);
    if (suggestEl) suggestEl.textContent = '$' + suggested.toFixed(2);
    if (panel) {
      panel.innerHTML = renderCompactPanel(costData);
    }
  }

  function scheduleRecipeDeveloperRefresh() {
    clearTimeout(global._rpSrcRdTimer);
    global._rpSrcRdTimer = setTimeout(function () {
      refreshVendorPrices().then(updateRecipeDeveloperCostCard);
    }, 400);
  }

  function initRecipeDeveloper() {
    if (!global.location.pathname.includes('recipe-developer')) {
      return;
    }
    const container = document.getElementById('ingredients-container');
    if (container) {
      const observer = new MutationObserver(scheduleRecipeDeveloperRefresh);
      observer.observe(container, { childList: true, subtree: true });
      container.addEventListener('input', scheduleRecipeDeveloperRefresh);
      container.addEventListener('change', scheduleRecipeDeveloperRefresh);
    }
    ['recipe-servings', 'recipe-name'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', scheduleRecipeDeveloperRefresh);
        el.addEventListener('change', scheduleRecipeDeveloperRefresh);
      }
    });
    refreshVendorPrices().then(updateRecipeDeveloperCostCard);
  }

  function refreshMenuPriceSources() {
    const root = document.getElementById('menu-price-sources-root');
    if (!root || !global.costCalculator) {
      return;
    }
    const items = global.enhancedMenuManager?.menuItems || [];
    const recipes = [];
    const allRecipes = JSON.parse(global.localStorage.getItem('recipes') || '[]');

    items.forEach(function (item) {
      if (!item.recipeId) {
        return;
      }
      const recipe = allRecipes.find(function (r) {
        return r.id === item.recipeId;
      });
      if (recipe) {
        recipes.push(recipe);
      }
    });

    if (!recipes.length) {
      root.innerHTML =
        '<p class="rp-src-empty">Link recipes to menu items to see aggregated price sources.</p>';
      return;
    }

    const merged = { ingredientCosts: [], missingPrices: [] };
    recipes.forEach(function (recipe) {
      const costData = global.costCalculator.calculateRecipeCost(recipe);
      if (costData.ingredientCosts) {
        merged.ingredientCosts = merged.ingredientCosts.concat(
          costData.ingredientCosts
        );
      }
      if (costData.missingPrices) {
        merged.missingPrices = merged.missingPrices.concat(costData.missingPrices);
      }
    });

    root.innerHTML = renderCompactPanel(merged);
  }

  function initMenuBuilder() {
    if (!global.location.pathname.includes('menu-builder')) {
      return;
    }
    const stats = document.getElementById('menu-statistics');
    if (stats) {
      const observer = new MutationObserver(function () {
        refreshMenuPriceSources();
      });
      observer.observe(stats, { childList: true, subtree: true });
    }
    refreshVendorPrices().then(refreshMenuPriceSources);
  }

  function onWorkspaceChange() {
    refreshVendorPrices().then(function () {
      updateRecipeDeveloperCostCard();
      refreshMenuPriceSources();
      if (typeof global.refreshRecipeCost === 'function') {
        global.refreshRecipeCost();
      }
    });
  }

  global.iterumRecipePriceSources = {
    SOURCE_META: SOURCE_META,
    getSourceLabel: getSourceLabel,
    summarizePriceSources: summarizePriceSources,
    renderPriceSourcesPanel: renderPriceSourcesPanel,
    renderCompactPanel: renderCompactPanel,
    refreshVendorPrices: refreshVendorPrices,
    updateRecipeDeveloperCostCard: updateRecipeDeveloperCostCard,
    refreshMenuPriceSources: refreshMenuPriceSources
  };

  function boot() {
    initRecipeDeveloper();
    initMenuBuilder();
    global.addEventListener('projectChanged', onWorkspaceChange);
    global.addEventListener('firestoreSyncReady', onWorkspaceChange);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : this);
