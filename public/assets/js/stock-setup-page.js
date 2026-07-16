/**
 * stock-setup.html — guided ingredient + opening inventory flow.
 */
(function () {
  'use strict';

  var STARTERS = [
    { name: 'Chicken breast', category: 'proteins', unit: 'lb' },
    { name: 'Yellow onion', category: 'vegetables', unit: 'lb' },
    { name: 'Kosher salt', category: 'spices', unit: 'lb' },
    { name: 'Olive oil', category: 'oils', unit: 'l' },
    { name: 'Unsalted butter', category: 'dairy', unit: 'lb' }
  ];

  var sessionIngredients = [];

  function $(id) {
    return document.getElementById(id);
  }

  function showError(msg) {
    var el = $('stock-error');
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  function ingredientRowHtml(data, index) {
    data = data || {};
    return (
      '<div class="grid sm:grid-cols-12 gap-2 items-end border border-slate-100 rounded-xl p-3" data-ing-row="' +
      index +
      '">' +
      '<div class="sm:col-span-5"><label class="block text-xs font-medium mb-1">Name</label>' +
      '<input type="text" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm ing-name" value="' +
      escapeAttr(data.name || '') +
      '" placeholder="e.g. Roma tomatoes"></div>' +
      '<div class="sm:col-span-3"><label class="block text-xs font-medium mb-1">Category</label>' +
      '<select class="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm ing-cat">' +
      categoryOptions(data.category) +
      '</select></div>' +
      '<div class="sm:col-span-2"><label class="block text-xs font-medium mb-1">Unit</label>' +
      '<select class="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm ing-unit">' +
      unitOptions(data.unit) +
      '</select></div>' +
      '<div class="sm:col-span-2 flex justify-end"><button type="button" class="text-slate-400 hover:text-red-600 text-lg btn-remove-row" title="Remove">×</button></div>' +
      '</div>'
    );
  }

  function countRowHtml(ing) {
    return (
      '<div class="grid sm:grid-cols-12 gap-2 items-end border border-slate-100 rounded-xl p-3" data-ing-id="' +
      escapeAttr(ing.id) +
      '">' +
      '<div class="sm:col-span-4"><span class="block text-sm font-medium">' +
      escapeHtml(ing.name) +
      '</span><span class="text-xs text-slate-500">' +
      escapeHtml(ing.unit || 'lb') +
      '</span></div>' +
      '<div class="sm:col-span-2"><label class="block text-xs font-medium mb-1">On hand</label>' +
      '<input type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm cnt-qty" value="0"></div>' +
      '<div class="sm:col-span-2"><label class="block text-xs font-medium mb-1">Par</label>' +
      '<input type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm cnt-par" placeholder="—"></div>' +
      '<div class="sm:col-span-2"><label class="block text-xs font-medium mb-1">Reorder</label>' +
      '<input type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm cnt-reorder" placeholder="—"></div>' +
      '<div class="sm:col-span-2"><label class="block text-xs font-medium mb-1">Location</label>' +
      '<select class="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm cnt-loc">' +
      '<option>Main Kitchen</option><option>Walk-in Cooler</option><option>Dry Storage</option><option>Prep Station</option>' +
      '</select></div></div>'
    );
  }

  function categoryOptions(selected) {
    var cats = [
      ['vegetables', 'Vegetables'],
      ['fruits', 'Fruits'],
      ['proteins', 'Proteins'],
      ['dairy', 'Dairy'],
      ['grains', 'Grains'],
      ['spices', 'Spices & herbs'],
      ['oils', 'Oils & fats'],
      ['other', 'Other']
    ];
    return cats
      .map(function (c) {
        return (
          '<option value="' +
          c[0] +
          '"' +
          (selected === c[0] ? ' selected' : '') +
          '>' +
          c[1] +
          '</option>'
        );
      })
      .join('');
  }

  function unitOptions(selected) {
    var units = ['lb', 'oz', 'kg', 'g', 'l', 'ml', 'each', 'case'];
    return units
      .map(function (u) {
        return (
          '<option value="' +
          u +
          '"' +
          (selected === u ? ' selected' : '') +
          '>' +
          u +
          '</option>'
        );
      })
      .join('');
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  function addIngredientRow(data) {
    var container = $('ingredient-rows');
    var index = container.querySelectorAll('[data-ing-row]').length;
    container.insertAdjacentHTML('beforeend', ingredientRowHtml(data, index));
    bindRemoveButtons();
  }

  function bindRemoveButtons() {
    document.querySelectorAll('.btn-remove-row').forEach(function (btn) {
      btn.onclick = function () {
        var row = btn.closest('[data-ing-row]');
        if (row) row.remove();
      };
    });
  }

  function collectIngredientRows() {
    var rows = [];
    document.querySelectorAll('[data-ing-row]').forEach(function (row) {
      var name = (row.querySelector('.ing-name') || {}).value || '';
      name = name.trim();
      if (!name) return;
      rows.push({
        name: name,
        category: (row.querySelector('.ing-cat') || {}).value || 'other',
        unit: (row.querySelector('.ing-unit') || {}).value || 'lb'
      });
    });
    return rows;
  }

  function showPanel(step) {
    var ing = step === 1;
    $('panel-ingredients').classList.toggle('hidden', !ing);
    $('panel-counts').classList.toggle('hidden', ing);
    $('tab-ingredients').classList.toggle('border-[#6b8e6f]', ing);
    $('tab-ingredients').classList.toggle('bg-emerald-50/60', ing);
    $('tab-ingredients').classList.toggle('border-slate-200', !ing);
    $('tab-ingredients').classList.toggle('bg-white', !ing);
    $('tab-counts').classList.toggle('border-[#6b8e6f]', !ing);
    $('tab-counts').classList.toggle('bg-emerald-50/60', !ing);
    $('tab-counts').classList.toggle('border-slate-200', ing);
    $('tab-counts').classList.toggle('bg-white', ing);
    $('tab-ingredients').setAttribute('aria-selected', ing ? 'true' : 'false');
    $('tab-counts').setAttribute('aria-selected', ing ? 'false' : 'true');
  }

  function saveIngredientsAndContinue() {
    showError('');
    var rows = collectIngredientRows();
    if (!rows.length) {
      showError('Add at least one ingredient name.');
      return;
    }
    var bridge = window.iterumIngredientInventory;
    if (!bridge) {
      showError('Ingredient system not ready — refresh and try again.');
      return;
    }
    sessionIngredients = [];
    rows.forEach(function (row) {
      try {
        var saved = bridge.addIngredient(row);
        if (saved) sessionIngredients.push(saved);
      } catch (e) {
        console.warn(e);
      }
    });
    if (!sessionIngredients.length) {
      showError('Could not save ingredients.');
      return;
    }
    renderCountRows();
    showPanel(2);
  }

  function renderCountRows() {
    var container = $('count-rows');
    var empty = $('counts-empty');
    container.innerHTML = '';
    if (!sessionIngredients.length) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    sessionIngredients.forEach(function (ing) {
      container.insertAdjacentHTML('beforeend', countRowHtml(ing));
    });
  }

  function saveCountsAndFinish() {
    showError('');
    var bridge = window.iterumIngredientInventory;
    if (!bridge) {
      showError('Inventory system not ready.');
      return;
    }
    var saved = 0;
    document
      .querySelectorAll('#count-rows [data-ing-id]')
      .forEach(function (row) {
        var id = row.getAttribute('data-ing-id');
        var qty = parseFloat((row.querySelector('.cnt-qty') || {}).value);
        if (!id || !Number.isFinite(qty)) return;
        var par = parseFloat((row.querySelector('.cnt-par') || {}).value);
        var reorder = parseFloat(
          (row.querySelector('.cnt-reorder') || {}).value
        );
        var loc = (row.querySelector('.cnt-loc') || {}).value || 'Main Kitchen';
        var ing = sessionIngredients.find(function (i) {
          return i.id === id;
        });
        try {
          bridge.addFoodStock({
            ingredientId: id,
            ingredientName: ing ? ing.name : id,
            quantity: qty,
            unit: ing ? ing.unit : 'lb',
            location: loc,
            parLevel: Number.isFinite(par) ? par : 0,
            reorderPoint: Number.isFinite(reorder) ? reorder : 0
          });
          saved += 1;
        } catch (e) {
          console.warn(e);
        }
      });
    if (!saved) {
      showError('Enter at least one opening count.');
      return;
    }
    try {
      localStorage.setItem(
        'iterum_pantry_setup_done',
        new Date().toISOString()
      );
    } catch (e) {
      void e;
    }
    window.location.href = 'dashboard.html';
  }

  function renderStarterChips() {
    var wrap = $('starter-chips');
    STARTERS.forEach(function (s) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:border-[#6b8e6f] hover:bg-emerald-50/50';
      btn.textContent = '+ ' + s.name;
      btn.addEventListener('click', function () {
        addIngredientRow(s);
      });
      wrap.appendChild(btn);
    });
  }

  function init() {
    renderStarterChips();
    addIngredientRow({});
    $('btn-add-row').addEventListener('click', function () {
      addIngredientRow({});
    });
    $('btn-save-ingredients').addEventListener(
      'click',
      saveIngredientsAndContinue
    );
    $('btn-save-counts').addEventListener('click', saveCountsAndFinish);
    $('btn-back').addEventListener('click', function () {
      showPanel(1);
    });
    $('tab-ingredients').addEventListener('click', function () {
      showPanel(1);
    });
    $('tab-counts').addEventListener('click', function () {
      if (sessionIngredients.length) {
        renderCountRows();
        showPanel(2);
      } else {
        showError('Save ingredients in step 1 first.');
      }
    });

    if (
      window.iterumIngredientInventory &&
      window.iterumIngredientInventory.isPantryReady()
    ) {
      var note = document.createElement('p');
      note.className = 'text-sm text-[#5a6d75] mb-4';
      note.innerHTML =
        'You already have ingredients and counts. Add more here or open <a href="inventory.html" class="text-[#6b8e6f] underline">inventory</a>.';
      document.querySelector('.mb-8').appendChild(note);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
