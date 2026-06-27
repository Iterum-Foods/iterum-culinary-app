/**
 * Reusable picker — attach supplies to dishes or SOPs.
 */
(function (global) {
  'use strict';

  function typeOrder(options) {
    if (options.types && options.types.length) return options.types;
    if (global.iterumSuppliesInventory?.SOP_ATTACH_TYPES) {
      return global.iterumSuppliesInventory.SOP_ATTACH_TYPES;
    }
    return ['paper_goods', 'plateware', 'tableware'];
  }

  function emptyGrouped(types) {
    var grouped = {};
    types.forEach(function (type) {
      grouped[type] = [];
    });
    return grouped;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function normalizeSelection(raw) {
    if (!raw || typeof raw !== 'object') return null;
    return {
      id: String(raw.id || ''),
      type: String(raw.type || ''),
      name: String(raw.name || ''),
      qty: Math.max(1, parseInt(raw.qty, 10) || 1)
    };
  }

  function flattenServiceWare(serviceWare, types) {
    if (!serviceWare || typeof serviceWare !== 'object') return [];
    var order = types || typeOrder({});
    var out = [];
    order.forEach(function (type) {
      (serviceWare[type] || []).forEach(function (row) {
        var sel = normalizeSelection(row);
        if (sel && sel.id) {
          sel.type = sel.type || type;
          out.push(sel);
        }
      });
    });
    return out;
  }

  function groupSelections(list, types) {
    var grouped = emptyGrouped(types || typeOrder({}));
    (list || []).forEach(function (row) {
      var sel = normalizeSelection(row);
      if (!sel || !sel.id) return;
      var type = sel.type;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(sel);
    });
    return grouped;
  }

  function formatSummary(serviceWare) {
    var flat = flattenServiceWare(serviceWare);
    if (!flat.length) return '';
    return flat
      .map(function (s) {
        return s.qty > 1 ? s.qty + '× ' + s.name : s.name;
      })
      .join(', ');
  }

  function mount(container, options) {
    options = options || {};
    var el =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;
    if (!el || !global.iterumSuppliesInventory) return null;

    var types = typeOrder(options);
    var projectId = options.projectId || global.iterumSuppliesInventory.resolveProjectId();
    var selections = flattenServiceWare(
      options.selections || options.serviceWare || {},
      types
    );

    function render() {
      var catalog = global.iterumSuppliesInventory.loadAll(projectId);
      var byType = {};
      types.forEach(function (t) {
        byType[t] = catalog.filter(function (item) {
          return item.type === t;
        });
      });

      var empty =
        !catalog.length &&
        '<p class="sw-picker__empty">No supplies yet. Add items under <a href="inventory.html">Inventory → Paper goods / Plateware</a>.</p>';

      var sections = types
        .map(function (type) {
          var meta = global.iterumSuppliesInventory.TYPES[type];
          var items = byType[type] || [];
          if (!items.length) {
            return (
              '<div class="sw-picker__section">' +
              '<h4 class="sw-picker__heading">' +
              escapeHtml(meta ? meta.label : type) +
              '</h4>' +
              '<p class="sw-picker__muted">No items in catalog.</p>' +
              '</div>'
            );
          }
          var rows = items
            .map(function (item) {
              var sel = selections.find(function (s) {
                return s.id === item.id;
              });
              var checked = !!sel;
              return (
                '<label class="sw-picker__row">' +
                '<input type="checkbox" class="sw-picker__cb" data-sw-id="' +
                escapeHtml(item.id) +
                '" data-sw-type="' +
                escapeHtml(type) +
                '" data-sw-name="' +
                escapeHtml(item.name) +
                '"' +
                (checked ? ' checked' : '') +
                ' />' +
                '<span class="sw-picker__name">' +
                escapeHtml(item.name) +
                '</span>' +
                '<input type="number" class="sw-picker__qty" min="1" value="' +
                (sel ? sel.qty : 1) +
                '" data-sw-qty-for="' +
                escapeHtml(item.id) +
                '"' +
                (checked ? '' : ' disabled') +
                ' aria-label="Quantity" />' +
                '</label>'
              );
            })
            .join('');
          return (
            '<div class="sw-picker__section">' +
            '<h4 class="sw-picker__heading">' +
            escapeHtml(meta ? meta.label : type) +
            '</h4>' +
            rows +
            '</div>'
          );
        })
        .join('');

      el.innerHTML =
        '<div class="sw-picker" data-sw-picker="1">' +
        (empty || sections) +
        '<button type="button" class="sw-picker__seed tc-btn tc-btn-outline tc-btn-sm">Load sample supplies</button>' +
        '</div>';

      el.querySelector('.sw-picker__seed')?.addEventListener('click', function () {
        global.iterumSuppliesInventory.seedSamples(projectId, true);
        render();
        if (typeof options.onChange === 'function') options.onChange(getValue());
      });

      el.querySelectorAll('.sw-picker__cb').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var qty = el.querySelector('[data-sw-qty-for="' + cb.dataset.swId + '"]');
          if (qty) {
            qty.disabled = !cb.checked;
            if (!cb.checked) qty.value = '1';
          }
          syncSelections();
        });
      });

      el.querySelectorAll('.sw-picker__qty').forEach(function (input) {
        input.addEventListener('input', syncSelections);
      });
    }

    function syncSelections() {
      selections = [];
      el.querySelectorAll('.sw-picker__cb:checked').forEach(function (cb) {
        var qtyEl = el.querySelector('[data-sw-qty-for="' + cb.dataset.swId + '"]');
        selections.push({
          id: cb.dataset.swId,
          type: cb.dataset.swType,
          name: cb.dataset.swName,
          qty: Math.max(1, parseInt(qtyEl?.value, 10) || 1)
        });
      });
      if (typeof options.onChange === 'function') options.onChange(getValue());
    }

    function getValue() {
      return groupSelections(selections, types);
    }

    render();

    return {
      getValue: getValue,
      refresh: render
    };
  }

  global.iterumServiceWarePicker = {
    mount: mount,
    flatten: flattenServiceWare,
    group: groupSelections,
    formatSummary: formatSummary
  };

  global.addEventListener('suppliesInventoryUpdated', function () {
    document.querySelectorAll('[data-sw-picker-host]').forEach(function (host) {
      if (host._swPicker && host._swPicker.refresh) host._swPicker.refresh();
    });
  });
})(window);
