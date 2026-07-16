/**
 * Supplies inventory — paper goods, service ware, office, first aid, cleaning (per workspace).
 * Used by Inventory page and attachable to dishes / SOPs.
 */
(function (global) {
  'use strict';

  var TYPES = {
    paper_goods: {
      id: 'paper_goods',
      label: 'Paper goods',
      icon: 'fa-scroll',
      defaultLocation: 'Dry Storage'
    },
    plateware: {
      id: 'plateware',
      label: 'Plateware',
      icon: 'fa-bowl-food',
      defaultLocation: 'FOH Storage'
    },
    tableware: {
      id: 'tableware',
      label: 'Tableware',
      icon: 'fa-utensils',
      defaultLocation: 'FOH Storage'
    },
    office_supplies: {
      id: 'office_supplies',
      label: 'Office supplies',
      icon: 'fa-paperclip',
      defaultLocation: 'Office'
    },
    first_aid: {
      id: 'first_aid',
      label: 'First aid',
      icon: 'fa-kit-medical',
      defaultLocation: 'Office / BOH'
    },
    cleaning_chemicals: {
      id: 'cleaning_chemicals',
      label: 'Cleaning chemicals',
      icon: 'fa-pump-soap',
      defaultLocation: 'Janitor closet'
    }
  };

  /** Tab order on Inventory → Supplies panel */
  var TYPE_ORDER = [
    'paper_goods',
    'plateware',
    'tableware',
    'office_supplies',
    'first_aid',
    'cleaning_chemicals'
  ];

  /** Types attachable on dishes (Dish Creator) */
  var DISH_ATTACH_TYPES = ['plateware', 'tableware'];

  /** Types attachable on SOPs */
  var SOP_ATTACH_TYPES = TYPE_ORDER.slice();

  function storageKey(projectId) {
    return 'iterum_supplies_' + (projectId || 'default');
  }

  function resolveProjectId() {
    if (global.firestoreSync?.resolveProjectId) {
      var fromSync = global.firestoreSync.resolveProjectId();
      if (fromSync && fromSync !== 'master') return fromSync;
    }
    if (global.projectManager?.currentProject?.id) {
      var id = global.projectManager.currentProject.id;
      if (id !== 'master') return id;
    }
    var uid =
      global.authManager?.currentUser?.userId ||
      global.authManager?.currentUser?.id ||
      '';
    if (uid) {
      var scoped = localStorage.getItem('iterum_current_project_user_' + uid);
      if (scoped && scoped !== 'master') return scoped;
    }
    return (
      localStorage.getItem('iterum_current_project') ||
      localStorage.getItem('active_project') ||
      'default'
    );
  }

  function normalizeItem(raw, type) {
    if (!raw || typeof raw !== 'object') return null;
    var t = raw.type || type;
    if (!TYPES[t]) return null;
    return {
      id: String(
        raw.id ||
          'sup_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
      ),
      projectId: raw.projectId || resolveProjectId(),
      type: t,
      name: String(raw.name || 'Unnamed item').trim(),
      description: String(raw.description || ''),
      sku: String(raw.sku || ''),
      location: String(raw.location || TYPES[t].defaultLocation),
      quantity: Number(raw.quantity) || 0,
      unit: String(raw.unit || 'each'),
      parLevel: Number(raw.parLevel) || 0,
      reorderPoint: Number(raw.reorderPoint) || 0,
      cost: Number(raw.cost) || 0,
      notes: String(raw.notes || ''),
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function sampleItems(projectId) {
    var pid = projectId || 'default';
    return [
      {
        type: 'paper_goods',
        name: 'Guest napkins (dinner)',
        unit: 'case',
        quantity: 4,
        parLevel: 2,
        reorderPoint: 2,
        location: 'Dry Storage'
      },
      {
        type: 'paper_goods',
        name: 'Thermal receipt rolls',
        unit: 'case',
        quantity: 6,
        parLevel: 3,
        reorderPoint: 2,
        location: 'FOH Storage'
      },
      {
        type: 'paper_goods',
        name: 'Parchment sheets (full pan)',
        unit: 'box',
        quantity: 8,
        parLevel: 4,
        reorderPoint: 3,
        location: 'Dry Storage'
      },
      {
        type: 'paper_goods',
        name: 'Carry-out bags (medium)',
        unit: 'case',
        quantity: 3,
        parLevel: 2,
        reorderPoint: 1,
        location: 'FOH Storage'
      },
      {
        type: 'plateware',
        name: '10″ dinner plate',
        unit: 'each',
        quantity: 120,
        parLevel: 80,
        reorderPoint: 60,
        location: 'FOH Storage',
        description: 'White coupe rim'
      },
      {
        type: 'plateware',
        name: '8″ salad plate',
        unit: 'each',
        quantity: 80,
        parLevel: 60,
        reorderPoint: 40,
        location: 'FOH Storage'
      },
      {
        type: 'plateware',
        name: 'Pasta bowl',
        unit: 'each',
        quantity: 48,
        parLevel: 36,
        reorderPoint: 24,
        location: 'FOH Storage'
      },
      {
        type: 'plateware',
        name: 'Coupe cocktail glass',
        unit: 'each',
        quantity: 72,
        parLevel: 48,
        reorderPoint: 36,
        location: 'Bar Storage'
      },
      {
        type: 'tableware',
        name: 'Dinner fork',
        unit: 'each',
        quantity: 150,
        parLevel: 100,
        reorderPoint: 75,
        location: 'FOH Storage'
      },
      {
        type: 'tableware',
        name: 'Dinner knife',
        unit: 'each',
        quantity: 150,
        parLevel: 100,
        reorderPoint: 75,
        location: 'FOH Storage'
      },
      {
        type: 'tableware',
        name: 'Soup spoon',
        unit: 'each',
        quantity: 80,
        parLevel: 60,
        reorderPoint: 40,
        location: 'FOH Storage'
      },
      {
        type: 'tableware',
        name: 'Water glass',
        unit: 'each',
        quantity: 100,
        parLevel: 72,
        reorderPoint: 48,
        location: 'FOH Storage'
      },
      {
        type: 'office_supplies',
        name: 'Printer paper (letter)',
        unit: 'ream',
        quantity: 6,
        parLevel: 4,
        reorderPoint: 2,
        location: 'Office',
        description: '20 lb white'
      },
      {
        type: 'office_supplies',
        name: 'Ballpoint pens',
        unit: 'box',
        quantity: 3,
        parLevel: 2,
        reorderPoint: 1,
        location: 'Office'
      },
      {
        type: 'office_supplies',
        name: 'Employee time cards / log sheets',
        unit: 'pad',
        quantity: 4,
        parLevel: 2,
        reorderPoint: 1,
        location: 'Office'
      },
      {
        type: 'office_supplies',
        name: 'Staples & tape refills',
        unit: 'pack',
        quantity: 2,
        parLevel: 1,
        reorderPoint: 1,
        location: 'Office'
      },
      {
        type: 'first_aid',
        name: 'Adhesive bandages (assorted)',
        unit: 'box',
        quantity: 2,
        parLevel: 1,
        reorderPoint: 1,
        location: 'Office / BOH'
      },
      {
        type: 'first_aid',
        name: 'Burn gel packets',
        unit: 'each',
        quantity: 12,
        parLevel: 6,
        reorderPoint: 4,
        location: 'Kitchen office'
      },
      {
        type: 'first_aid',
        name: 'Nitrile exam gloves (first aid kit)',
        unit: 'box',
        quantity: 2,
        parLevel: 1,
        reorderPoint: 1,
        location: 'Office / BOH'
      },
      {
        type: 'first_aid',
        name: 'First aid kit — wall mount (refill)',
        unit: 'kit',
        quantity: 1,
        parLevel: 1,
        reorderPoint: 1,
        location: 'FOH',
        description: 'Check expiry monthly'
      },
      {
        type: 'cleaning_chemicals',
        name: 'Quat sanitizer concentrate',
        unit: 'gallon',
        quantity: 2,
        parLevel: 1,
        reorderPoint: 1,
        location: 'Janitor closet',
        description: 'Food-contact sanitizer — follow dilution chart'
      },
      {
        type: 'cleaning_chemicals',
        name: 'Degreaser (grill / flat top)',
        unit: 'gallon',
        quantity: 2,
        parLevel: 1,
        reorderPoint: 1,
        location: 'Kitchen chemical shelf'
      },
      {
        type: 'cleaning_chemicals',
        name: 'Glass cleaner',
        unit: 'bottle',
        quantity: 4,
        parLevel: 2,
        reorderPoint: 2,
        location: 'Janitor closet'
      },
      {
        type: 'cleaning_chemicals',
        name: 'Floor cleaner (neutral pH)',
        unit: 'gallon',
        quantity: 2,
        parLevel: 1,
        reorderPoint: 1,
        location: 'Janitor closet'
      },
      {
        type: 'cleaning_chemicals',
        name: 'Oven cleaner (caustic)',
        unit: 'can',
        quantity: 3,
        parLevel: 2,
        reorderPoint: 1,
        location: 'Kitchen chemical shelf',
        description: 'PPE required — see safety SOP'
      }
    ].map(function (row) {
      return normalizeItem(Object.assign({ projectId: pid }, row));
    });
  }

  function loadAll(projectId) {
    var pid = projectId || resolveProjectId();
    try {
      var raw = localStorage.getItem(storageKey(pid));
      if (!raw) return [];
      var list = JSON.parse(raw);
      return (Array.isArray(list) ? list : [])
        .map(function (item) {
          return normalizeItem(item);
        })
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function saveAll(projectId, items) {
    var pid = projectId || resolveProjectId();
    localStorage.setItem(storageKey(pid), JSON.stringify(items));
    global.dispatchEvent(
      new CustomEvent('suppliesInventoryUpdated', {
        detail: { projectId: pid }
      })
    );
  }

  function getByType(type, projectId) {
    return loadAll(projectId).filter(function (item) {
      return item.type === type;
    });
  }

  function getById(id, projectId) {
    return (
      loadAll(projectId).find(function (item) {
        return item.id === id;
      }) || null
    );
  }

  function upsert(data, projectId) {
    var pid = projectId || resolveProjectId();
    var item = normalizeItem(data);
    if (!item) return null;
    item.projectId = pid;
    var list = loadAll(pid);
    var idx = list.findIndex(function (x) {
      return x.id === item.id;
    });
    if (idx >= 0) {
      item.createdAt = list[idx].createdAt;
      list[idx] = item;
    } else {
      list.push(item);
    }
    saveAll(pid, list);
    return item;
  }

  function remove(id, projectId) {
    var pid = projectId || resolveProjectId();
    var list = loadAll(pid).filter(function (item) {
      return item.id !== id;
    });
    saveAll(pid, list);
  }

  function adjustQty(id, delta, projectId) {
    var item = getById(id, projectId);
    if (!item) return null;
    item.quantity = Math.max(0, (Number(item.quantity) || 0) + delta);
    return upsert(item, projectId);
  }

  function seedSamples(projectId, force) {
    var pid = projectId || resolveProjectId();
    var existing = loadAll(pid);
    if (force) {
      var seeded = sampleItems(pid);
      saveAll(pid, seeded);
      return seeded;
    }
    if (!existing.length) {
      var initial = sampleItems(pid);
      saveAll(pid, initial);
      return initial;
    }
    return ensureMissingTypeSamples(pid, existing);
  }

  /** Add starter rows for supply types that have no catalog items yet */
  function ensureMissingTypeSamples(projectId, list) {
    var pid = projectId || resolveProjectId();
    var items = list || loadAll(pid);
    var samples = sampleItems(pid);
    var added = false;
    TYPE_ORDER.forEach(function (type) {
      if (
        items.some(function (i) {
          return i.type === type;
        })
      )
        return;
      samples
        .filter(function (s) {
          return s.type === type;
        })
        .forEach(function (s) {
          items.push(s);
          added = true;
        });
    });
    if (added) saveAll(pid, items);
    return items;
  }

  function emptyServiceWare() {
    var out = {};
    TYPE_ORDER.forEach(function (type) {
      out[type] = [];
    });
    return out;
  }

  function stockStatus(item) {
    if (!item || item.quantity <= 0) return 'out';
    if (item.reorderPoint > 0 && item.quantity <= item.reorderPoint)
      return 'low';
    return 'good';
  }

  function stats(projectId) {
    var list = loadAll(projectId);
    var low = 0;
    var out = 0;
    var value = 0;
    list.forEach(function (item) {
      var st = stockStatus(item);
      if (st === 'low') low += 1;
      if (st === 'out') out += 1;
      value += (Number(item.quantity) || 0) * (Number(item.cost) || 0);
    });
    return { total: list.length, low: low, out: out, value: value };
  }

  global.iterumSuppliesInventory = {
    TYPES: TYPES,
    TYPE_ORDER: TYPE_ORDER,
    DISH_ATTACH_TYPES: DISH_ATTACH_TYPES,
    SOP_ATTACH_TYPES: SOP_ATTACH_TYPES,
    resolveProjectId: resolveProjectId,
    loadAll: loadAll,
    getByType: getByType,
    getById: getById,
    upsert: upsert,
    remove: remove,
    adjustQty: adjustQty,
    seedSamples: seedSamples,
    ensureMissingTypeSamples: ensureMissingTypeSamples,
    emptyServiceWare: emptyServiceWare,
    stockStatus: stockStatus,
    stats: stats,
    sampleItems: sampleItems
  };
})(window);
