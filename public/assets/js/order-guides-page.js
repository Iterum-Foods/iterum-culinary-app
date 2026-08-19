/**
 * Order guides page — vendor catalog → par/on-hand → buy list + recipes.
 */
(function () {
  'use strict';

  var state = { pack: null, guide: null };

  function $(id) {
    return document.getElementById(id);
  }

  function pid() {
    return window.iterumOps.getProjectId();
  }

  function setStatus(msg, isError) {
    var el = $('og-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b45309' : '';
  }

  function inventoryIndex() {
    var inv = window.iterumBarInventory?.loadLocal(pid());
    return window.iterumBarInventory?.indexByName(inv) || {};
  }

  function fillVendors() {
    var sel = $('og-vendor');
    if (!sel) return;
    var vendors = window.iterumVendorCatalog.loadVendors();
    sel.innerHTML = vendors
      .map(function (v) {
        var n = Array.isArray(v.products) ? v.products.length : 0;
        return (
          '<option value="' +
          window.iterumOps.escapeHtml(v.id || '') +
          '">' +
          window.iterumOps.escapeHtml(v.name || 'Untitled') +
          ' — ' +
          n +
          ' SKUs</option>'
        );
      })
      .join('');
    if (!vendors.length) {
      sel.innerHTML = '<option value="">No vendors yet</option>';
    }
  }

  function currentVendor() {
    var id = $('og-vendor')?.value;
    return window.iterumVendorCatalog.loadVendors().find(function (v) {
      return String(v.id) === String(id);
    });
  }

  function collectItems() {
    var body = $('og-tbody');
    if (!body) return [];
    return Array.from(body.querySelectorAll('tr')).map(function (tr) {
      var g = function (f) {
        return tr.querySelector('[data-f="' + f + '"]')?.value || '';
      };
      return {
        id: tr.getAttribute('data-id') || '',
        name: tr.getAttribute('data-name') || g('name'),
        sku: tr.getAttribute('data-sku') || '',
        packSize: tr.getAttribute('data-pack') || '',
        unit: tr.getAttribute('data-unit') || 'ea',
        category: tr.getAttribute('data-cat') || '',
        par: parseFloat(g('par')) || 0,
        onHand: parseFloat(g('onHand')) || 0,
        orderQty: parseFloat(g('orderQty')) || 0,
        unitCost: window.iterumPriceListParser.parseMoney(g('unitCost')),
        notes: g('notes')
      };
    });
  }

  function renderItems(items) {
    var body = $('og-tbody');
    if (!body) return;
    if (!items.length) {
      body.innerHTML =
        '<tr><td colspan="8" class="bp-muted">Pick a vendor with a catalog, or upload a price list first.</td></tr>';
      return;
    }
    body.innerHTML = items
      .map(function (it) {
        var need = Number(it.orderQty) > 0;
        return (
          '<tr data-id="' +
          window.iterumOps.escapeHtml(it.id || '') +
          '" data-name="' +
          window.iterumOps.escapeHtml(it.name) +
          '" data-sku="' +
          window.iterumOps.escapeHtml(it.sku || '') +
          '" data-pack="' +
          window.iterumOps.escapeHtml(it.packSize || '') +
          '" data-unit="' +
          window.iterumOps.escapeHtml(it.unit || '') +
          '" data-cat="' +
          window.iterumOps.escapeHtml(it.category || '') +
          '">' +
          '<td><label><input type="checkbox" data-f="sel"' +
          (need ? ' checked' : '') +
          '> ' +
          window.iterumOps.escapeHtml(it.name) +
          '</label><div class="bp-muted">' +
          window.iterumOps.escapeHtml(it.sku || it.packSize || '') +
          '</div></td>' +
          '<td><input data-f="par" type="number" min="0" step="1" value="' +
          it.par +
          '"></td>' +
          '<td><input data-f="onHand" type="number" min="0" step="1" value="' +
          it.onHand +
          '"></td>' +
          '<td><input data-f="orderQty" type="number" min="0" step="1" value="' +
          it.orderQty +
          '" class="' +
          (need ? 'bp-warn' : '') +
          '"></td>' +
          '<td><input data-f="unitCost" value="' +
          (it.unitCost == null ? '' : it.unitCost) +
          '"></td>' +
          '<td>' +
          window.iterumOps.escapeHtml(it.packSize || '') +
          '</td>' +
          '<td><input data-f="notes" value="' +
          window.iterumOps.escapeHtml(it.notes || '') +
          '"></td>' +
          '</tr>'
        );
      })
      .join('');
    var totals = window.iterumOrderGuides.guideTotals({ items: items });
    var t = $('og-totals');
    if (t) {
      t.textContent =
        totals.lines + ' lines to order · est. $' + totals.subtotal.toFixed(2);
    }
  }

  function loadFromVendor() {
    var vendor = currentVendor();
    if (!vendor) {
      renderItems([]);
      return;
    }
    var items = window.iterumOrderGuides.itemsFromVendor(
      vendor,
      inventoryIndex()
    );
    var belowOnly = $('og-below')?.checked;
    if (belowOnly) {
      items = items.filter(function (it) {
        return it.orderQty > 0;
      });
    }
    state.guide = {
      id: state.guide?.id || '',
      name: vendor.name + ' — ' + new Date().toISOString().slice(0, 10),
      vendorId: vendor.id,
      vendorName: vendor.name,
      items: items
    };
    $('og-name').value = state.guide.name;
    renderItems(items);
    setStatus('Loaded ' + items.length + ' SKUs from ' + vendor.name + '.');
  }

  function recalcRow(tr) {
    var par = parseFloat(tr.querySelector('[data-f="par"]')?.value) || 0;
    var on = parseFloat(tr.querySelector('[data-f="onHand"]')?.value) || 0;
    var qty = tr.querySelector('[data-f="orderQty"]');
    if (qty && document.activeElement !== qty) {
      qty.value = String(Math.max(0, par - on));
    }
  }

  async function saveGuide() {
    var vendor = currentVendor();
    var items = collectItems();
    var guide = window.iterumOrderGuides.normalizeGuide({
      id: state.guide?.id,
      name: $('og-name')?.value.trim() || 'Order guide',
      vendorId: vendor?.id || '',
      vendorName: vendor?.name || '',
      items: items
    });
    var wasNew = !guide.id;
    state.pack = window.iterumOrderGuides.upsertGuide(state.pack, guide);
    state.guide = wasNew
      ? state.pack.guides[0]
      : (state.pack.guides || []).find(function (g) {
          return g.id === guide.id;
        });
    await window.iterumOrderGuides.saveState(
      window.iterumOps.getDb(),
      pid(),
      state.pack
    );
    renderSaved();
    setStatus('Saved order guide.');
    window.iterumOps.toast('Order guide saved', 'success');
  }

  function renderSaved() {
    var el = $('og-saved');
    if (!el) return;
    var guides = state.pack?.guides || [];
    if (!guides.length) {
      el.innerHTML = '<p class="bp-muted">No saved guides yet.</p>';
      return;
    }
    el.innerHTML = guides
      .map(function (g) {
        var tot = window.iterumOrderGuides.guideTotals(g);
        return (
          '<div class="bp-card"><h3>' +
          window.iterumOps.escapeHtml(g.name) +
          '</h3><p class="bp-muted">' +
          window.iterumOps.escapeHtml(g.vendorName) +
          ' · ' +
          tot.lines +
          ' to order · $' +
          tot.subtotal.toFixed(2) +
          '</p><div class="bp-toolbar"><button type="button" class="bp-btn" data-open="' +
          window.iterumOps.escapeHtml(g.id) +
          '">Open</button></div></div>'
        );
      })
      .join('');
  }

  function selectedProducts() {
    var items = collectItems().filter(function (it) {
      return it.orderQty > 0;
    });
    if (!items.length) items = collectItems();
    return items;
  }

  function createRecipes() {
    var vendor = currentVendor() || { name: 'Vendor' };
    var created = window.iterumVendorCatalog.createRecipesFromProducts(
      selectedProducts(),
      vendor
    );
    setStatus('Created ' + created.length + ' recipe stubs.');
    window.iterumOps.toast(created.length + ' recipes created', 'success');
  }

  function printGuide() {
    var items = collectItems().filter(function (it) {
      return Number(it.orderQty) > 0;
    });
    var vendor = currentVendor();
    var w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      '<html><head><title>Order guide</title><style>body{font-family:Inter,sans-serif;padding:24px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left}</style></head><body>'
    );
    w.document.write(
      '<h1>' +
        window.iterumOps.escapeHtml($('og-name')?.value || 'Order guide') +
        '</h1><p>' +
        window.iterumOps.escapeHtml(vendor?.name || '') +
        '</p><table><thead><tr><th>Item</th><th>SKU</th><th>Pack</th><th>Order</th><th>Cost</th></tr></thead><tbody>'
    );
    items.forEach(function (it) {
      w.document.write(
        '<tr><td>' +
          window.iterumOps.escapeHtml(it.name) +
          '</td><td>' +
          window.iterumOps.escapeHtml(it.sku) +
          '</td><td>' +
          window.iterumOps.escapeHtml(it.packSize) +
          '</td><td>' +
          it.orderQty +
          '</td><td>' +
          (it.unitCost == null ? '' : it.unitCost) +
          '</td></tr>'
      );
    });
    w.document.write('</tbody></table></body></html>');
    w.document.close();
    w.focus();
    w.print();
  }

  async function init() {
    fillVendors();
    state.pack = await window.iterumOrderGuides.loadState(
      window.iterumOps.getDb(),
      pid()
    );
    renderSaved();
    loadFromVendor();
    $('og-vendor')?.addEventListener('change', loadFromVendor);
    $('og-below')?.addEventListener('change', loadFromVendor);
    $('og-reload')?.addEventListener('click', loadFromVendor);
    $('og-save')?.addEventListener('click', saveGuide);
    $('og-print')?.addEventListener('click', printGuide);
    $('og-recipes')?.addEventListener('click', createRecipes);
    $('og-tbody')?.addEventListener('input', function (e) {
      var tr = e.target.closest('tr');
      if (tr) recalcRow(tr);
    });
    $('og-saved')?.addEventListener('click', function (e) {
      var id = e.target.getAttribute('data-open');
      if (!id) return;
      var g = (state.pack.guides || []).find(function (x) {
        return x.id === id;
      });
      if (!g) return;
      state.guide = g;
      $('og-name').value = g.name;
      if (g.vendorId) $('og-vendor').value = g.vendorId;
      renderItems(g.items || []);
    });
    document.addEventListener('projectChanged', init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
