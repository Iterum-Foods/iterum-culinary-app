/**
 * Supplies tabs UI for inventory.html (paper goods + plateware & tableware).
 */
(function (global) {
  'use strict';

  var activeType = 'paper_goods';
  var editingId = null;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function statusLabel(item) {
    var st = global.iterumSuppliesInventory.stockStatus(item);
    if (st === 'out')
      return {
        text: 'Out of stock',
        cls: 'tc-status-pill tc-status-pill--critical'
      };
    if (st === 'low')
      return {
        text: 'Low stock',
        cls: 'tc-status-pill tc-status-pill--warning'
      };
    return { text: 'Good', cls: 'tc-status-pill tc-status-pill--ok' };
  }

  function renderTable() {
    var tbody = $('supplies-tbody');
    if (!tbody || !global.iterumSuppliesInventory) return;

    var items = global.iterumSuppliesInventory.getByType(activeType);
    if (!items.length) {
      var meta = global.iterumSuppliesInventory.TYPES[activeType];
      var label = meta ? meta.label.toLowerCase() : 'items';
      tbody.innerHTML =
        '<tr><td colspan="8" class="inv-empty">No ' +
        label +
        ' yet. Click “Add item” or load samples.</td></tr>';
      return;
    }

    tbody.innerHTML = items
      .map(function (item) {
        var st = statusLabel(item);
        return (
          '<tr class="' +
          (st.text === 'Low stock'
            ? 'is-low'
            : st.text === 'Out of stock'
              ? 'is-out'
              : '') +
          '">' +
          '<td class="inv-name">' +
          escapeHtml(item.name) +
          (item.description
            ? '<div class="inv-muted" style="font-size:0.75rem;">' +
              escapeHtml(item.description) +
              '</div>'
            : '') +
          '</td>' +
          '<td>' +
          Number(item.quantity).toFixed(0) +
          '</td>' +
          '<td class="inv-muted">' +
          escapeHtml(item.unit) +
          '</td>' +
          '<td>' +
          escapeHtml(item.location) +
          '</td>' +
          '<td class="inv-muted">' +
          (item.parLevel || '—') +
          '</td>' +
          '<td class="inv-muted">' +
          (item.reorderPoint || '—') +
          '</td>' +
          '<td><span class="' +
          st.cls +
          '">' +
          st.text +
          '</span></td>' +
          '<td><div class="inv-actions">' +
          '<button type="button" class="inv-qty-btn" data-sup-add="' +
          item.id +
          '" title="Add">+</button>' +
          '<button type="button" class="inv-qty-btn inv-qty-btn--minus" data-sup-rem="' +
          item.id +
          '" title="Remove">−</button>' +
          '<button type="button" class="inv-qty-btn" data-sup-edit="' +
          item.id +
          '" title="Edit" style="width:auto;padding:0 8px;font-size:0.7rem;">Edit</button>' +
          '</div></td></tr>'
        );
      })
      .join('');
  }

  function updateSuppliesStats() {
    var stats = global.iterumSuppliesInventory.stats();
    var el = $('supplies-stats');
    if (el) {
      el.textContent =
        stats.total +
        ' supply items · ' +
        stats.low +
        ' low · ' +
        stats.out +
        ' out';
    }
  }

  function openModal(item) {
    editingId = item ? item.id : null;
    var meta = global.iterumSuppliesInventory.TYPES[activeType];
    $('supplies-modal-title').textContent = item
      ? 'Edit item'
      : 'Add ' + (meta ? meta.label.toLowerCase() : 'item');
    $('sup-f-name').value = item ? item.name : '';
    $('sup-f-desc').value = item ? item.description : '';
    $('sup-f-sku').value = item ? item.sku : '';
    $('sup-f-qty').value = item ? item.quantity : 0;
    $('sup-f-unit').value = item ? item.unit : 'each';
    $('sup-f-location').value = item
      ? item.location
      : meta?.defaultLocation || '';
    $('sup-f-par').value = item ? item.parLevel : '';
    $('sup-f-reorder').value = item ? item.reorderPoint : '';
    $('sup-f-cost').value = item ? item.cost : '';
    $('supplies-modal').classList.add('is-open');
  }

  function closeModal() {
    editingId = null;
    $('supplies-modal')?.classList.remove('is-open');
  }

  function saveModal() {
    var name = ($('sup-f-name').value || '').trim();
    if (!name) {
      alert('Enter an item name.');
      return;
    }
    global.iterumSuppliesInventory.upsert({
      id: editingId || undefined,
      type: activeType,
      name: name,
      description: ($('sup-f-desc').value || '').trim(),
      sku: ($('sup-f-sku').value || '').trim(),
      quantity: parseFloat($('sup-f-qty').value) || 0,
      unit: $('sup-f-unit').value || 'each',
      location: $('sup-f-location').value || '',
      parLevel: parseFloat($('sup-f-par').value) || 0,
      reorderPoint: parseFloat($('sup-f-reorder').value) || 0,
      cost: parseFloat($('sup-f-cost').value) || 0
    });
    closeModal();
    renderTable();
    updateSuppliesStats();
  }

  function renderSuppliesTabs() {
    var root = $('supplies-tabs-root');
    if (!root || !global.iterumSuppliesInventory) return;
    var order = global.iterumSuppliesInventory.TYPE_ORDER || [];
    root.innerHTML = order
      .map(function (type) {
        var meta = global.iterumSuppliesInventory.TYPES[type];
        if (!meta) return '';
        return (
          '<button type="button" class="inv-supplies-tab' +
          (activeType === type ? ' is-active' : '') +
          '" data-supplies-tab="' +
          type +
          '">' +
          escapeHtml(meta.label) +
          '</button>'
        );
      })
      .join('');
  }

  function switchSuppliesTab(type) {
    activeType = type;
    renderSuppliesTabs();
    renderTable();
  }

  function bind() {
    document.querySelectorAll('[data-inv-main-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.dataset.invMainTab;
        document.querySelectorAll('[data-inv-main-tab]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        $('inv-panel-food').hidden = tab !== 'food';
        $('inv-panel-supplies').hidden = tab !== 'supplies';
        if (tab === 'supplies') {
          renderSuppliesTabs();
          renderTable();
        }
      });
    });

    $('supplies-tabs-root')?.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-supplies-tab]');
      if (!btn) return;
      switchSuppliesTab(btn.dataset.suppliesTab);
    });

    $('supplies-btn-add')?.addEventListener('click', function () {
      openModal(null);
    });
    $('supplies-btn-seed')?.addEventListener('click', function () {
      global.iterumSuppliesInventory.seedSamples(null, true);
      renderTable();
      updateSuppliesStats();
    });
    $('supplies-btn-cancel')?.addEventListener('click', closeModal);
    $('supplies-btn-save')?.addEventListener('click', saveModal);

    $('supplies-tbody')?.addEventListener('click', function (e) {
      var add = e.target.closest('[data-sup-add]');
      var rem = e.target.closest('[data-sup-rem]');
      var edit = e.target.closest('[data-sup-edit]');
      if (add) {
        global.iterumSuppliesInventory.adjustQty(add.dataset.supAdd, 1);
        renderTable();
        updateSuppliesStats();
      } else if (rem) {
        global.iterumSuppliesInventory.adjustQty(rem.dataset.supRem, -1);
        renderTable();
        updateSuppliesStats();
      } else if (edit) {
        var item = global.iterumSuppliesInventory.getById(edit.dataset.supEdit);
        if (item) openModal(item);
      }
    });

    global.addEventListener('projectChanged', function () {
      renderTable();
      updateSuppliesStats();
    });
  }

  function init() {
    if (!$('inv-panel-supplies') || !global.iterumSuppliesInventory) return;
    global.iterumSuppliesInventory.ensureMissingTypeSamples();
    bind();
    renderSuppliesTabs();
    updateSuppliesStats();
  }

  global.iterumSuppliesInventoryUI = { init: init, render: renderTable };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
