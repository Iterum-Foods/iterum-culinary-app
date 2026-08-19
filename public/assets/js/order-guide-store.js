/**
 * Order guides — built from vendor catalogs + bar/inventory pars.
 * Path: projects/{pid}/snapshots/order_guides
 * Local: iterum_order_guides_{pid}
 */
(function (global) {
  'use strict';

  var PACK_DOC = 'order_guides';

  function localKey(pid) {
    return 'iterum_order_guides_' + (pid || 'default');
  }

  function emptyState() {
    return { schemaVersion: '1.0', guides: [] };
  }

  function normalizeItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var name = String(raw.name || '').trim();
    if (!name) return null;
    var par = Number(raw.par);
    var onHand = Number(raw.onHand);
    var orderQty = Number(raw.orderQty);
    var unitCost = Number(raw.unitCost);
    if (!Number.isFinite(par)) par = 0;
    if (!Number.isFinite(onHand)) onHand = 0;
    if (!Number.isFinite(orderQty)) {
      orderQty = Math.max(0, par - onHand);
    }
    return {
      id: String(raw.id || ''),
      name: name,
      sku: String(raw.sku || ''),
      packSize: String(raw.packSize || ''),
      unit: String(raw.unit || 'ea'),
      category: String(raw.category || ''),
      par: par,
      onHand: onHand,
      orderQty: orderQty,
      unitCost: Number.isFinite(unitCost) ? unitCost : null,
      notes: String(raw.notes || '')
    };
  }

  function normalizeGuide(raw) {
    var items = Array.isArray(raw?.items)
      ? raw.items.map(normalizeItem).filter(Boolean)
      : [];
    return {
      id: String(raw?.id || ''),
      name: String(raw?.name || 'Order guide'),
      vendorId: String(raw?.vendorId || ''),
      vendorName: String(raw?.vendorName || ''),
      notes: String(raw?.notes || ''),
      items: items,
      createdAt: raw?.createdAt || new Date().toISOString(),
      updatedAt: raw?.updatedAt || new Date().toISOString()
    };
  }

  function normalizeState(raw) {
    var state = emptyState();
    if (!raw || typeof raw !== 'object') return state;
    state.guides = Array.isArray(raw.guides)
      ? raw.guides.map(normalizeGuide)
      : [];
    return state;
  }

  function loadLocal(pid) {
    try {
      var raw = localStorage.getItem(localKey(pid));
      return normalizeState(raw ? JSON.parse(raw) : null);
    } catch (e) {
      return emptyState();
    }
  }

  function saveLocal(pid, state) {
    localStorage.setItem(localKey(pid), JSON.stringify(normalizeState(state)));
  }

  async function loadState(db, pid) {
    var local = loadLocal(pid);
    if (!db || !pid) return local;
    try {
      var fs = await import(
        'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
      );
      var ref = fs.doc(db, 'projects', pid, 'snapshots', PACK_DOC);
      var snap = await fs.getDoc(ref);
      if (!snap.exists()) return local;
      var cloud = normalizeState(snap.data());
      saveLocal(pid, cloud);
      return cloud;
    } catch (e) {
      return local;
    }
  }

  async function saveState(db, pid, state) {
    var clean = normalizeState(state);
    saveLocal(pid, clean);
    if (!db || !pid) return clean;
    var fs = await import(
      'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
    );
    var ref = fs.doc(db, 'projects', pid, 'snapshots', PACK_DOC);
    await fs.setDoc(
      ref,
      Object.assign({}, clean, { updatedAt: fs.serverTimestamp() }),
      { merge: true }
    );
    return clean;
  }

  function itemsFromVendor(vendor, inventoryByName) {
    var products = Array.isArray(vendor?.products) ? vendor.products : [];
    return products.map(function (p, i) {
      var inv = inventoryByName
        ? inventoryByName[String(p.name || '').toLowerCase()]
        : null;
      var par = inv?.par != null ? Number(inv.par) : Number(p.par) || 0;
      var onHand = inv?.onHand != null ? Number(inv.onHand) : 0;
      return normalizeItem({
        id: p.sku || 'item_' + i,
        name: p.name,
        sku: p.sku,
        packSize: p.packSize,
        unit: p.unit,
        category: p.category,
        par: par,
        onHand: onHand,
        unitCost: p.unitCost,
        notes: p.notes
      });
    });
  }

  function guideTotals(guide) {
    var items = guide?.items || [];
    var lines = items.filter(function (it) {
      return Number(it.orderQty) > 0;
    });
    var subtotal = lines.reduce(function (sum, it) {
      var cost = Number(it.unitCost) || 0;
      return sum + cost * Number(it.orderQty || 0);
    }, 0);
    return { lines: lines.length, subtotal: subtotal, itemCount: items.length };
  }

  function upsertGuide(state, guide) {
    var next = normalizeState(state);
    var g = normalizeGuide(guide);
    if (!g.id) {
      g.id =
        (global.iterumOps && global.iterumOps.newId('og')) ||
        'og_' + Date.now();
    }
    g.updatedAt = new Date().toISOString();
    var idx = next.guides.findIndex(function (x) {
      return x.id === g.id;
    });
    if (idx >= 0) next.guides[idx] = g;
    else next.guides.unshift(g);
    return next;
  }

  global.iterumOrderGuides = {
    PACK_DOC: PACK_DOC,
    emptyState: emptyState,
    normalizeState: normalizeState,
    loadLocal: loadLocal,
    saveLocal: saveLocal,
    loadState: loadState,
    saveState: saveState,
    itemsFromVendor: itemsFromVendor,
    guideTotals: guideTotals,
    upsertGuide: upsertGuide,
    normalizeGuide: normalizeGuide
  };
})(typeof window !== 'undefined' ? window : globalThis);
