/**
 * Price list upload page — PDF/CSV/XLSX → vendor catalog.
 */
(function () {
  'use strict';

  var state = { rows: [], source: '' };

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, isError) {
    var el = $('pl-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b45309' : '';
  }

  function fillVendorSelect() {
    var sel = $('pl-vendor');
    if (!sel || !window.iterumVendorCatalog) return;
    var current = sel.value;
    var vendors = window.iterumVendorCatalog.loadVendors();
    sel.innerHTML =
      '<option value="">Create new vendor…</option>' +
      vendors
        .map(function (v) {
          return (
            '<option value="' +
            window.iterumOps.escapeHtml(v.id || '') +
            '">' +
            window.iterumOps.escapeHtml(v.name || 'Untitled') +
            ' (' +
            (Array.isArray(v.products) ? v.products.length : 0) +
            ' items)</option>'
          );
        })
        .join('');
    if (current) sel.value = current;
  }

  function collectRowsFromTable() {
    var body = $('pl-tbody');
    if (!body) return [];
    return Array.from(body.querySelectorAll('tr')).map(function (tr) {
      var g = function (field) {
        return tr.querySelector('[data-f="' + field + '"]')?.value.trim() || '';
      };
      var cost = window.iterumPriceListParser.parseMoney(g('unitCost'));
      var parN = parseFloat(g('par'));
      return {
        name: g('name'),
        sku: g('sku'),
        packSize: g('packSize'),
        unitCost: cost,
        category: g('category'),
        unit: g('unit') || 'ea',
        par: Number.isFinite(parN) ? parN : null,
        notes: g('notes'),
        sourceFile: state.source
      };
    });
  }

  function renderRows() {
    var body = $('pl-tbody');
    var count = $('pl-count');
    if (!body) return;
    if (!state.rows.length) {
      body.innerHTML =
        '<tr><td colspan="8" class="bp-muted">No rows yet. Upload a PDF, CSV, or Excel price list.</td></tr>';
      if (count) count.textContent = '0 items';
      return;
    }
    body.innerHTML = state.rows
      .map(function (r, i) {
        var cost = r.unitCost == null ? '' : String(r.unitCost);
        var par = r.par == null ? '' : String(r.par);
        return (
          '<tr data-i="' +
          i +
          '">' +
          '<td><input data-f="name" value="' +
          window.iterumOps.escapeHtml(r.name || '') +
          '"></td>' +
          '<td><input data-f="sku" value="' +
          window.iterumOps.escapeHtml(r.sku || '') +
          '"></td>' +
          '<td><input data-f="packSize" value="' +
          window.iterumOps.escapeHtml(r.packSize || '') +
          '"></td>' +
          '<td><input data-f="unitCost" value="' +
          window.iterumOps.escapeHtml(cost) +
          '"></td>' +
          '<td><input data-f="category" value="' +
          window.iterumOps.escapeHtml(r.category || '') +
          '"></td>' +
          '<td><input data-f="unit" value="' +
          window.iterumOps.escapeHtml(r.unit || 'ea') +
          '"></td>' +
          '<td><input data-f="par" value="' +
          window.iterumOps.escapeHtml(par) +
          '"></td>' +
          '<td><input data-f="notes" value="' +
          window.iterumOps.escapeHtml(r.notes || '') +
          '"></td>' +
          '</tr>'
        );
      })
      .join('');
    if (count) count.textContent = state.rows.length + ' items';
  }

  async function ingestFile(file) {
    if (!file) return;
    setStatus('Reading ' + file.name + '…');
    try {
      var parsed = await window.iterumPriceListParser.parseFile(file);
      state.rows = parsed.rows || [];
      state.source = parsed.source || file.name;
      renderRows();
      setStatus(
        'Parsed ' +
          state.rows.length +
          ' rows from ' +
          file.name +
          ' (' +
          (parsed.mode || 'auto') +
          '). Review before saving.'
      );
    } catch (err) {
      setStatus(err.message || 'Could not parse that file.', true);
    }
  }

  async function commit() {
    state.rows = collectRowsFromTable();
    var vendorSel = $('pl-vendor');
    var vendorId = vendorSel?.value || '';
    var vendorName = $('pl-vendor-name')?.value.trim();
    if (!vendorId && !vendorName) {
      setStatus('Name a vendor or pick an existing one.', true);
      return;
    }
    if (vendorId) {
      var v = window.iterumVendorCatalog.loadVendors().find(function (x) {
        return String(x.id) === vendorId;
      });
      if (v) vendorName = v.name;
    }
    var btn = $('pl-commit');
    if (btn) btn.disabled = true;
    setStatus('Saving catalog…');
    try {
      var result = await window.iterumVendorCatalog.commitCatalog({
        vendorId: vendorId,
        vendorName: vendorName,
        products: state.rows,
        mode: $('pl-mode')?.value || 'merge',
        createIngredients: $('pl-ingredients')?.checked !== false,
        writePrices: $('pl-prices')?.checked !== false,
        createRecipes: $('pl-recipes')?.checked === true,
        projectId: window.iterumOps.getProjectId()
      });
      fillVendorSelect();
      setStatus(
        'Loaded ' +
          result.imported +
          ' items under ' +
          result.vendor.name +
          ' (catalog now ' +
          result.productCount +
          '). Prices written: ' +
          result.prices.wrote +
          '. Recipes: ' +
          (result.recipes?.length || 0) +
          '.'
      );
      window.iterumOps.toast(
        'Price list saved to ' + result.vendor.name,
        'success'
      );
    } catch (err) {
      setStatus(err.message || 'Save failed.', true);
    }
    if (btn) btn.disabled = false;
  }

  function bind() {
    fillVendorSelect();
    var input = $('pl-file');
    var drop = $('pl-drop');
    if (input) {
      input.addEventListener('change', function () {
        ingestFile(input.files && input.files[0]);
      });
    }
    if (drop) {
      drop.addEventListener('click', function () {
        input?.click();
      });
      drop.addEventListener('dragover', function (e) {
        e.preventDefault();
        drop.classList.add('is-over');
      });
      drop.addEventListener('dragleave', function () {
        drop.classList.remove('is-over');
      });
      drop.addEventListener('drop', function (e) {
        e.preventDefault();
        drop.classList.remove('is-over');
        ingestFile(e.dataTransfer?.files && e.dataTransfer.files[0]);
      });
    }
    $('pl-commit')?.addEventListener('click', commit);
    $('pl-clear')?.addEventListener('click', function () {
      state.rows = [];
      renderRows();
      setStatus('Cleared.');
    });
    document.addEventListener('projectChanged', fillVendorSelect);
    renderRows();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
