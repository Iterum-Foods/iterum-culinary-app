/**
 * Ingredient library — cost status + workspace vendor override hints (golden path slice 2).
 * Requires firestore-sync.js for live overrides; degrades gracefully offline.
 */
(function (global) {
  'use strict';

  function escapeHtml(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function nameKey(ingredient) {
    return String(ingredient?.name || '')
      .trim()
      .toLowerCase();
  }

  function getOverridesMap() {
    const sync = global.firestoreSync;
    if (sync && typeof sync.getVendorPriceOverridesMap === 'function') {
      return sync.getVendorPriceOverridesMap();
    }
    return new Map();
  }

  function lookupOverride(ingredient) {
    const map = getOverridesMap();
    const key = nameKey(ingredient);
    if (!key) return null;
    if (map.has(key)) return map.get(key);
    const id = ingredient?.id ? String(ingredient.id).toLowerCase() : '';
    if (id && map.has(id)) return map.get(id);
    return null;
  }

  function vendorOverrideUrl(ingredientName) {
    const q = encodeURIComponent(String(ingredientName || '').trim());
    return (
      'vendor-management.html?ingredient=' + q + '#vendor-pricing-workspace'
    );
  }

  /**
   * @returns {'missing'|'override_only'|'override_newer'|'has_cost'|'override_match'}
   */
  function analyzeCostStatus(ingredient) {
    const cost = Number(ingredient?.cost) || 0;
    const override = lookupOverride(ingredient);
    if (
      !override ||
      override.unitCost == null ||
      Number.isNaN(Number(override.unitCost))
    ) {
      return cost > 0
        ? { status: 'has_cost', cost, override: null }
        : { status: 'missing', cost: 0, override: null };
    }
    const oCost = Number(override.unitCost);
    if (cost <= 0) {
      return { status: 'override_only', cost, override, effectiveCost: oCost };
    }
    const diff = Math.abs(cost - oCost);
    if (diff < 0.0001) {
      return { status: 'override_match', cost, override, effectiveCost: oCost };
    }
    return { status: 'override_newer', cost, override, effectiveCost: oCost };
  }

  function renderCostHintHtml(ingredient, opts) {
    opts = opts || {};
    const compact = !!opts.compact;
    const a = analyzeCostStatus(ingredient);
    const name = ingredient?.name || 'Ingredient';
    const vendorUrl = vendorOverrideUrl(name);

    if (a.status === 'missing') {
      return (
        '<div class="ing-cost-hint ing-cost-hint--missing' +
        (compact ? ' ing-cost-hint--compact' : '') +
        '">' +
        '<span class="ing-cost-hint__badge">No cost</span>' +
        '<span class="ing-cost-hint__text">Add case pricing below or </span>' +
        '<a class="ing-cost-hint__link" href="' +
        escapeHtml(vendorUrl) +
        '">set a workspace price override</a>' +
        '</div>'
      );
    }

    if (a.status === 'override_only') {
      const unit = escapeHtml(a.override.unit || ingredient.unit || 'unit');
      const vendor = a.override.vendorName
        ? escapeHtml(a.override.vendorName)
        : 'vendor';
      return (
        '<div class="ing-cost-hint ing-cost-hint--override' +
        (compact ? ' ing-cost-hint--compact' : '') +
        '">' +
        '<span class="ing-cost-hint__badge">Workspace price</span>' +
        '<span class="ing-cost-hint__text">$' +
        Number(a.effectiveCost).toFixed(4) +
        '/' +
        unit +
        ' via ' +
        vendor +
        ' — used in recipe costing</span> ' +
        '<a class="ing-cost-hint__link" href="' +
        escapeHtml(vendorUrl) +
        '">Edit</a>' +
        '</div>'
      );
    }

    if (a.status === 'override_newer') {
      const unit = escapeHtml(a.override.unit || ingredient.unit || 'unit');
      return (
        '<div class="ing-cost-hint ing-cost-hint--warn' +
        (compact ? ' ing-cost-hint--compact' : '') +
        '">' +
        '<span class="ing-cost-hint__badge">Override</span>' +
        '<span class="ing-cost-hint__text">Library $' +
        costFmt(a.cost) +
        ' · workspace $' +
        Number(a.effectiveCost).toFixed(4) +
        '/' +
        unit +
        ' wins in costing</span> ' +
        '<a class="ing-cost-hint__link" href="' +
        escapeHtml(vendorUrl) +
        '">Review</a>' +
        '</div>'
      );
    }

    if (a.status === 'override_match' && !compact) {
      return (
        '<div class="ing-cost-hint ing-cost-hint--ok ing-cost-hint--compact">' +
        '<span class="ing-cost-hint__badge">Synced</span>' +
        '<span class="ing-cost-hint__text">Matches workspace override</span>' +
        '</div>'
      );
    }

    return '';
  }

  function costFmt(n) {
    return Number(n).toFixed(4);
  }

  function renderCostCellHtml(ingredient) {
    const cost = Number(ingredient?.cost) || 0;
    const a = analyzeCostStatus(ingredient);
    let main =
      cost > 0
        ? '<div style="display:flex;flex-direction:column;gap:4px;">' +
          '<span style="color:#6B8E6F;font-weight:700;font-size:1rem;">$' +
          costFmt(cost) +
          '</span>' +
          '<span style="color:#8A9299;font-size:0.7rem;">per ' +
          escapeHtml(ingredient.unit || 'unit') +
          '</span></div>'
        : a.status === 'override_only'
          ? '<div style="display:flex;flex-direction:column;gap:4px;">' +
            '<span style="color:#6B8E6F;font-weight:700;font-size:1rem;">$' +
            costFmt(a.effectiveCost) +
            '</span>' +
            '<span style="color:#8A9299;font-size:0.7rem;">override · per ' +
            escapeHtml(a.override?.unit || ingredient.unit || 'unit') +
            '</span></div>'
          : '<span style="color:#94a3b8;">—</span>';

    const hint = renderCostHintHtml(ingredient, { compact: true });
    return (
      main + (hint ? '<div style="margin-top:6px;">' + hint + '</div>' : '')
    );
  }

  function summarizeIngredients(ingredients) {
    const list = Array.isArray(ingredients) ? ingredients : [];
    let missing = 0;
    let overrideOnly = 0;
    let overrideDiff = 0;
    let ok = 0;
    list.forEach(function (ing) {
      if (!ing || !ing.name) return;
      const s = analyzeCostStatus(ing).status;
      if (s === 'missing') missing += 1;
      else if (s === 'override_only') overrideOnly += 1;
      else if (s === 'override_newer') overrideDiff += 1;
      else ok += 1;
    });
    return {
      total: list.length,
      missing,
      overrideOnly,
      overrideDiff,
      ok
    };
  }

  function renderSummaryBanner(ingredients) {
    const s = summarizeIngredients(ingredients);
    if (!s.total) return '';
    const parts = [];
    if (s.missing) {
      parts.push(
        '<strong>' + s.missing + '</strong> without library or override cost'
      );
    }
    if (s.overrideOnly) {
      parts.push(
        '<strong>' +
          s.overrideOnly +
          '</strong> costing from workspace overrides only'
      );
    }
    if (s.overrideDiff) {
      parts.push(
        '<strong>' +
          s.overrideDiff +
          '</strong> where override differs from library'
      );
    }
    if (!parts.length) {
      return (
        '<div class="ing-cost-summary ing-cost-summary--ok" id="ing-cost-summary-banner">' +
        '<span>✓ Cost signals look good for this workspace — overrides and library costs are aligned.</span>' +
        '</div>'
      );
    }
    return (
      '<div class="ing-cost-summary" id="ing-cost-summary-banner" role="status">' +
      '<div><span class="ing-cost-summary__title">Costing signals</span> ' +
      parts.join(' · ') +
      '</div>' +
      '<a class="ing-cost-summary__cta" href="vendor-management.html#vendor-pricing-workspace">Workspace price overrides</a>' +
      '</div>'
    );
  }

  function updateSummaryBanner(ingredients) {
    const el = document.getElementById('ing-cost-summary-root');
    if (!el) return;
    el.innerHTML = renderSummaryBanner(ingredients);
  }

  async function refreshOverrides() {
    const sync = global.firestoreSync;
    if (
      sync &&
      sync.initialized &&
      typeof sync.refreshVendorPricesFromFirestore === 'function'
    ) {
      try {
        await sync.refreshVendorPricesFromFirestore();
      } catch (e) {
        console.warn('Could not refresh vendor price overrides', e);
      }
    }
  }

  global.iterumIngredientCostHints = {
    lookupOverride,
    analyzeCostStatus,
    renderCostHintHtml,
    renderCostCellHtml,
    renderSummaryBanner,
    updateSummaryBanner,
    summarizeIngredients,
    vendorOverrideUrl,
    refreshOverrides,
    getOverridesMap
  };

  function onReady() {
    global.addEventListener('projectChanged', function () {
      if (typeof global.loadIngredients === 'function') {
        global.loadIngredients();
      }
    });
    global.addEventListener('firestoreSyncReady', function () {
      if (typeof global.loadIngredients === 'function') {
        global.loadIngredients();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})(typeof window !== 'undefined' ? window : this);
