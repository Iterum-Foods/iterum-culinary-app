/**
 * Bar inventory (well / bottle / garnish / batch) with par + on-hand.
 * Path: projects/{pid}/snapshots/bar_inventory
 * Local: iterum_bar_inventory_{pid}
 */
(function (global) {
  'use strict';

  var PACK_DOC = 'bar_inventory';

  function localKey(pid) {
    return 'iterum_bar_inventory_' + (pid || 'default');
  }

  function emptyState() {
    return { schemaVersion: '1.0', items: [] };
  }

  function normalizeItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var name = String(raw.name || '').trim();
    if (!name) return null;
    var par = Number(raw.par);
    var onHand = Number(raw.onHand);
    var unitCost = Number(raw.unitCost);
    return {
      id: String(raw.id || ''),
      name: name,
      category: String(raw.category || 'Spirit'),
      sku: String(raw.sku || ''),
      vendor: String(raw.vendor || ''),
      packSize: String(raw.packSize || ''),
      location: String(raw.location || 'Well'),
      par: Number.isFinite(par) ? par : 0,
      onHand: Number.isFinite(onHand) ? onHand : 0,
      unitCost: Number.isFinite(unitCost) ? unitCost : null,
      unit: String(raw.unit || 'btl'),
      notes: String(raw.notes || '')
    };
  }

  function normalizeState(raw) {
    var state = emptyState();
    if (!raw || typeof raw !== 'object') return state;
    state.items = Array.isArray(raw.items)
      ? raw.items.map(normalizeItem).filter(Boolean)
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

  function belowPar(state) {
    return (state?.items || []).filter(function (it) {
      return Number(it.onHand) < Number(it.par);
    });
  }

  function indexByName(state) {
    var map = {};
    (state?.items || []).forEach(function (it) {
      map[String(it.name).toLowerCase()] = it;
    });
    return map;
  }

  function mergeItems(existing, incoming) {
    var list = Array.isArray(existing) ? existing.slice() : [];
    var idx = new Map();
    list.forEach(function (it, i) {
      idx.set(String(it.name).toLowerCase(), i);
    });
    (incoming || []).forEach(function (raw) {
      var it = normalizeItem(raw);
      if (!it) return;
      if (!it.id) {
        it.id =
          (global.iterumOps && global.iterumOps.newId('barinv')) ||
          'barinv_' + Date.now();
      }
      var key = it.name.toLowerCase();
      if (idx.has(key)) {
        var prev = list[idx.get(key)];
        list[idx.get(key)] = Object.assign({}, prev, it, {
          id: prev.id,
          onHand: prev.onHand
        });
      } else {
        idx.set(key, list.length);
        list.push(it);
      }
    });
    return list;
  }

  global.iterumBarInventory = {
    PACK_DOC: PACK_DOC,
    emptyState: emptyState,
    normalizeState: normalizeState,
    loadLocal: loadLocal,
    saveLocal: saveLocal,
    loadState: loadState,
    saveState: saveState,
    belowPar: belowPar,
    indexByName: indexByName,
    mergeItems: mergeItems
  };
})(typeof window !== 'undefined' ? window : globalThis);
