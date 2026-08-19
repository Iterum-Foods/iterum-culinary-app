/**
 * Bar program hub — standards, drinks, inventory, ordering.
 */
(function () {
  'use strict';

  var state = { inventory: null, tab: 'program' };

  function $(id) {
    return document.getElementById(id);
  }

  function pid() {
    return window.iterumOps.getProjectId();
  }

  function setStatus(msg, isError) {
    var el = $('bo-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b45309' : '';
  }

  function showTab(id) {
    state.tab = id;
    document.querySelectorAll('[data-bo-panel]').forEach(function (p) {
      p.hidden = p.getAttribute('data-bo-panel') !== id;
    });
    document.querySelectorAll('.bp-tab').forEach(function (t) {
      t.classList.toggle('is-active', t.getAttribute('data-tab') === id);
    });
  }

  function renderStandards() {
    var el = $('bo-standards');
    var pack = window.ITERUM_COMMON_CRAFT_BAR;
    if (!el || !pack) return;
    el.innerHTML = pack.STANDARDS.map(function (s) {
      return (
        '<article class="bp-card"><h3>' +
        window.iterumOps.escapeHtml(s.title) +
        '</h3><p class="bp-muted" style="white-space:pre-wrap">' +
        window.iterumOps.escapeHtml(s.body) +
        '</p></article>'
      );
    }).join('');
  }

  function renderDrinks() {
    var el = $('bo-drinks');
    var pack = window.ITERUM_COMMON_CRAFT_BAR;
    if (!el || !pack) return;
    el.innerHTML = pack.DRINKS.map(function (d) {
      var build = (d.build || [])
        .map(function (b) {
          return b.amount + (b.unit ? ' ' + b.unit : '') + ' ' + b.ingredient;
        })
        .join(' · ');
      return (
        '<article class="bp-card"><h3>' +
        window.iterumOps.escapeHtml(d.title) +
        '</h3><p class="bp-muted">' +
        window.iterumOps.escapeHtml(d.glass) +
        ' · ' +
        window.iterumOps.escapeHtml(d.method) +
        '</p><p>' +
        window.iterumOps.escapeHtml(build) +
        '</p><p class="bp-muted">' +
        window.iterumOps.escapeHtml(d.garnish) +
        ' · ' +
        window.iterumOps.escapeHtml(d.allergies) +
        '</p></article>'
      );
    }).join('');
  }

  function renderInventory() {
    var el = $('bo-inv-body');
    if (!el) return;
    var items = state.inventory?.items || [];
    if (!items.length) {
      el.innerHTML =
        '<tr><td colspan="7" class="bp-muted">No bar inventory yet. Import the Common Craft pack or add a line.</td></tr>';
      return;
    }
    el.innerHTML = items
      .map(function (it, i) {
        var low = Number(it.onHand) < Number(it.par);
        return (
          '<tr data-i="' +
          i +
          '">' +
          '<td><input data-f="name" value="' +
          window.iterumOps.escapeHtml(it.name) +
          '"></td>' +
          '<td><input data-f="category" value="' +
          window.iterumOps.escapeHtml(it.category) +
          '"></td>' +
          '<td><input data-f="location" value="' +
          window.iterumOps.escapeHtml(it.location) +
          '"></td>' +
          '<td><input data-f="par" type="number" min="0" step="1" value="' +
          it.par +
          '"></td>' +
          '<td><input data-f="onHand" type="number" min="0" step="1" value="' +
          it.onHand +
          '" class="' +
          (low ? 'bp-warn' : '') +
          '"></td>' +
          '<td><input data-f="vendor" value="' +
          window.iterumOps.escapeHtml(it.vendor) +
          '"></td>' +
          '<td><input data-f="unitCost" value="' +
          (it.unitCost == null ? '' : it.unitCost) +
          '"></td>' +
          '</tr>'
        );
      })
      .join('');
    var lowN = window.iterumBarInventory.belowPar(state.inventory).length;
    var s = $('bo-inv-summary');
    if (s) {
      s.textContent = items.length + ' items · ' + lowN + ' below par';
    }
  }

  function collectInventory() {
    var body = $('bo-inv-body');
    if (!body) return [];
    return Array.from(body.querySelectorAll('tr')).map(function (tr, i) {
      var prev = (state.inventory?.items || [])[i] || {};
      var g = function (f) {
        return tr.querySelector('[data-f="' + f + '"]')?.value || '';
      };
      return {
        id: prev.id,
        name: g('name'),
        category: g('category'),
        location: g('location'),
        par: parseFloat(g('par')) || 0,
        onHand: parseFloat(g('onHand')) || 0,
        vendor: g('vendor'),
        unitCost: window.iterumPriceListParser?.parseMoney(g('unitCost')),
        packSize: prev.packSize || '',
        unit: prev.unit || 'btl',
        sku: prev.sku || '',
        notes: prev.notes || ''
      };
    });
  }

  async function saveInventory() {
    state.inventory = {
      items: window.iterumBarInventory.mergeItems([], collectInventory())
    };
    await window.iterumBarInventory.saveState(
      window.iterumOps.getDb(),
      pid(),
      state.inventory
    );
    renderInventory();
    setStatus('Bar inventory saved.');
  }

  async function importProgram() {
    var pack = window.ITERUM_COMMON_CRAFT_BAR;
    if (!pack) {
      setStatus('Seed pack not loaded.', true);
      return;
    }
    var db = window.iterumOps.getDb();
    var projectId = pid();

    if (window.iterumSopPack) {
      var sop =
        window.iterumSopPack.loadLocal(projectId) ||
        window.iterumSopPack.emptyPack();
      var incoming = window.iterumSopPack.normalizePack({
        categories: window.ITERUM_SOP_CATEGORIES || sop.categories,
        sops: pack.STANDARDS
      });
      sop = window.iterumSopPack.mergePack(sop, incoming);
      window.iterumSopPack.saveLocal(projectId, sop);
      if (db) {
        try {
          await window.iterumSopPack.savePack(db, projectId, sop);
        } catch (e) {
          /* local is enough */
        }
      }
    }

    if (db && window.iterumBarDrafts?.importSampleDrafts) {
      try {
        await window.iterumBarDrafts.importSampleDrafts(
          db,
          projectId,
          pack.DRINKS,
          pack.SOURCE,
          window.iterumOps.currentUserName()
        );
      } catch (e2) {
        /* drafts stay local via dashboard if unsigned */
      }
    }

    if (db && window.iterumBarChecklists?.savePack) {
      try {
        await window.iterumBarChecklists.savePack(
          db,
          projectId,
          pack.checklistPack()
        );
      } catch (e3) {
        /* ignore */
      }
    }

    state.inventory = {
      items: window.iterumBarInventory.mergeItems(
        state.inventory?.items || [],
        pack.INVENTORY
      )
    };
    await window.iterumBarInventory.saveState(db, projectId, state.inventory);

    var byVendor = {};
    pack.INVENTORY.forEach(function (it) {
      if (!it.vendor || it.vendor === 'In-house') return;
      if (!byVendor[it.vendor]) byVendor[it.vendor] = [];
      byVendor[it.vendor].push({
        name: it.name,
        packSize: it.packSize,
        unitCost: it.unitCost,
        category: it.category,
        unit: it.unit,
        par: it.par,
        notes: 'Common Craft seed'
      });
    });
    var names = Object.keys(byVendor);
    for (var i = 0; i < names.length; i++) {
      await window.iterumVendorCatalog.commitCatalog({
        vendorName: names[i],
        products: byVendor[names[i]],
        mode: 'merge',
        createIngredients: true,
        writePrices: true,
        createRecipes: false,
        projectId: projectId
      });
    }

    renderInventory();
    setStatus(
      'Imported Common Craft standards, drinks, station pars, inventory, and vendor SKUs. Publish drinks from the dashboard Bar drafts card when ready.'
    );
    window.iterumOps.toast('Common Craft pack imported', 'success');
  }

  async function sendBelowParToOrderGuide() {
    await saveInventory();
    var low = window.iterumBarInventory.belowPar(state.inventory);
    if (!low.length) {
      setStatus('Nothing is below par.');
      return;
    }
    var byVendor = {};
    low.forEach(function (it) {
      var key = it.vendor || 'Unassigned';
      if (!byVendor[key]) byVendor[key] = [];
      byVendor[key].push(it);
    });
    var firstVendor = Object.keys(byVendor)[0];
    await window.iterumVendorCatalog.commitCatalog({
      vendorName: firstVendor,
      products: byVendor[firstVendor].map(function (it) {
        return {
          name: it.name,
          packSize: it.packSize,
          unitCost: it.unitCost,
          category: it.category,
          unit: it.unit,
          par: it.par
        };
      }),
      mode: 'merge',
      createIngredients: false,
      writePrices: false,
      projectId: pid()
    });
    var og = window.iterumOrderGuides.loadLocal(pid());
    var guide = window.iterumOrderGuides.normalizeGuide({
      name: 'Bar below-par — ' + new Date().toISOString().slice(0, 10),
      vendorName: firstVendor,
      items: byVendor[firstVendor].map(function (it) {
        return {
          name: it.name,
          par: it.par,
          onHand: it.onHand,
          orderQty: Math.max(0, Number(it.par) - Number(it.onHand)),
          unitCost: it.unitCost,
          packSize: it.packSize,
          unit: it.unit,
          category: it.category
        };
      })
    });
    og = window.iterumOrderGuides.upsertGuide(og, guide);
    await window.iterumOrderGuides.saveState(
      window.iterumOps.getDb(),
      pid(),
      og
    );
    setStatus(
      'Created an order guide for ' +
        firstVendor +
        ' with ' +
        byVendor[firstVendor].length +
        ' below-par lines. Open Order guides to print.'
    );
    window.location.href = 'order-guides.html';
  }

  async function init() {
    renderStandards();
    renderDrinks();
    state.inventory = await window.iterumBarInventory.loadState(
      window.iterumOps.getDb(),
      pid()
    );
    renderInventory();
    document.querySelectorAll('.bp-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showTab(btn.getAttribute('data-tab'));
      });
    });
    $('bo-import')?.addEventListener('click', importProgram);
    $('bo-save-inv')?.addEventListener('click', saveInventory);
    $('bo-add-inv')?.addEventListener('click', function () {
      state.inventory.items = window.iterumBarInventory.mergeItems(
        collectInventory(),
        [
          {
            name: 'New bar item',
            category: 'Spirit',
            location: 'Well',
            par: 1,
            onHand: 0
          }
        ]
      );
      renderInventory();
    });
    $('bo-order-low')?.addEventListener('click', sendBelowParToOrderGuide);
    showTab('program');
    document.addEventListener('projectChanged', init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
