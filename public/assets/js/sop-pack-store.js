/**
 * SOP / how-to pack — Firestore + local cache.
 *
 * Path:  projects/{pid}/snapshots/employee_line_pack
 * Shape: { schemaVersion, categories: [], sops: [{ id, categoryId, title, body, sort, jobTags? }] }
 *
 * Mobile Shift app reads this doc in the How-to tab (mobile-line-employee.js).
 */
(function (global) {
  'use strict';

  var PACK_DOC = 'employee_line_pack';
  var SCHEMA_VERSION = '1.0';

  function localKey(pid) {
    return 'iterum_sop_pack_' + (pid || 'default');
  }

  function defaultCategories() {
    return Array.isArray(global.ITERUM_SOP_CATEGORIES)
      ? JSON.parse(JSON.stringify(global.ITERUM_SOP_CATEGORIES))
      : [
          { id: 'general', name: 'General', icon: '📋', sort: 1 },
          { id: 'kitchen', name: 'Kitchen', icon: '👨‍🍳', sort: 2 },
          { id: 'bar', name: 'Bar', icon: '🍸', sort: 3 }
        ];
  }

  function emptyPack() {
    return {
      schemaVersion: SCHEMA_VERSION,
      categories: defaultCategories(),
      sops: []
    };
  }

  function normalizeServiceWare(raw) {
    var types = global.iterumSuppliesInventory?.TYPE_ORDER || [
      'paper_goods',
      'plateware',
      'tableware',
      'office_supplies',
      'first_aid',
      'cleaning_chemicals'
    ];
    var out = {};
    types.forEach(function (type) {
      out[type] = [];
    });
    if (!raw || typeof raw !== 'object') return out;
    types.forEach(function (type) {
      out[type] = (Array.isArray(raw[type]) ? raw[type] : [])
        .filter(function (row) {
          return row && (row.id || row.name);
        })
        .map(function (row, i) {
          return {
            id: String(row.id || 'sw_' + type + '_' + i),
            type: type,
            name: String(row.name || 'Item'),
            qty: row.qty != null ? Math.max(1, parseInt(row.qty, 10) || 1) : 1
          };
        });
    });
    return out;
  }

  function normalizePack(raw) {
    var pack = emptyPack();
    if (!raw || typeof raw !== 'object') return pack;

    if (Array.isArray(raw.categories) && raw.categories.length) {
      pack.categories = raw.categories
        .map(function (c, i) {
          if (typeof c === 'string') {
            return {
              id: c.toLowerCase().replace(/\s+/g, '_'),
              name: c,
              sort: i + 1
            };
          }
          return {
            id: String(c.id || 'cat_' + i),
            name: String(c.name || 'Category'),
            icon: c.icon || '📋',
            sort: c.sort != null ? c.sort : i + 1
          };
        })
        .sort(function (a, b) {
          return (a.sort || 0) - (b.sort || 0);
        });
    }

    var catIds = pack.categories.map(function (c) {
      return c.id;
    });
    var fallbackCat = catIds[0] || 'general';

    pack.sops = (Array.isArray(raw.sops) ? raw.sops : [])
      .filter(function (s) {
        return s && (s.title || s.body);
      })
      .map(function (s, i) {
        return {
          id: String(s.id || 'sop_' + Date.now() + '_' + i),
          categoryId:
            s.categoryId && catIds.indexOf(s.categoryId) >= 0
              ? s.categoryId
              : fallbackCat,
          title: String(s.title || 'Untitled guide'),
          body: String(s.body || ''),
          sort: s.sort != null ? s.sort : i + 1,
          serviceWare: normalizeServiceWare(s.serviceWare),
          jobTags:
            global.iterumSopJobTags &&
            typeof global.iterumSopJobTags.normalizeJobTags === 'function'
              ? global.iterumSopJobTags.normalizeJobTags(s.jobTags)
              : Array.isArray(s.jobTags) && s.jobTags.length
                ? s.jobTags.map(String)
                : ['all']
        };
      });

    return pack;
  }

  function saveLocal(pid, pack) {
    try {
      localStorage.setItem(localKey(pid), JSON.stringify(normalizePack(pack)));
    } catch (e) {
      void e;
    }
  }

  function loadLocal(pid) {
    try {
      var raw = localStorage.getItem(localKey(pid));
      if (!raw) return null;
      return normalizePack(JSON.parse(raw));
    } catch (e) {
      return null;
    }
  }

  async function loadPack(db, pid) {
    if (!db || !pid) {
      return loadLocal(pid) || emptyPack();
    }
    try {
      var fs = await import(
        'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
      );
      var ref = fs.doc(db, 'projects', pid, 'snapshots', PACK_DOC);
      var snap = await fs.getDoc(ref);
      if (!snap.exists()) {
        return loadLocal(pid) || emptyPack();
      }
      var pack = normalizePack(snap.data());
      saveLocal(pid, pack);
      return pack;
    } catch (e) {
      console.warn('sop-pack load failed', e);
      return loadLocal(pid) || emptyPack();
    }
  }

  async function savePack(db, pid, pack) {
    var clean = normalizePack(pack);
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

  function getSamplePack() {
    if (
      typeof global.ITERUM_SOP_SAMPLE === 'object' &&
      global.ITERUM_SOP_SAMPLE
    ) {
      return normalizePack(global.ITERUM_SOP_SAMPLE);
    }
    return null;
  }

  function seedSampleLocal(pid) {
    var sample = getSamplePack();
    if (!sample || !pid) {
      return null;
    }
    saveLocal(pid, sample);
    return sample;
  }

  async function importSample(db, pid) {
    var sample = getSamplePack();
    if (!sample) throw new Error('SOP sample pack not loaded.');
    return await savePack(db, pid, sample);
  }

  /** Local cache + optional Firestore publish (Shift How-to tab). */
  async function seedSamplePack(db, pid) {
    var sample = seedSampleLocal(pid);
    if (!sample) {
      throw new Error('SOP sample pack not loaded.');
    }
    if (db && pid) {
      return await savePack(db, pid, sample);
    }
    return sample;
  }

  function categoryName(pack, categoryId) {
    var cat = (pack.categories || []).find(function (c) {
      return c.id === categoryId;
    });
    return cat ? cat.name : 'General';
  }

  function sopsByCategory(pack) {
    var map = new Map();
    (pack.categories || []).forEach(function (c) {
      map.set(c.id, []);
    });
    (pack.sops || []).forEach(function (s) {
      var list = map.get(s.categoryId) || [];
      list.push(s);
      map.set(s.categoryId, list);
    });
    map.forEach(function (list) {
      list.sort(function (a, b) {
        return (a.sort || 0) - (b.sort || 0);
      });
    });
    return map;
  }

  function mergePack(base, incoming) {
    var pack = normalizePack(base);
    var add = normalizePack(incoming);
    var catIds = new Set(
      pack.categories.map(function (c) {
        return c.id;
      })
    );
    add.categories.forEach(function (c) {
      if (!catIds.has(c.id)) {
        pack.categories.push(c);
        catIds.add(c.id);
      }
    });
    var sopIds = new Map();
    pack.sops.forEach(function (s, i) {
      sopIds.set(s.id, i);
    });
    add.sops.forEach(function (s) {
      if (sopIds.has(s.id)) {
        pack.sops[sopIds.get(s.id)] = Object.assign(
          {},
          pack.sops[sopIds.get(s.id)],
          s
        );
      } else {
        pack.sops.push(s);
      }
    });
    return normalizePack(pack);
  }

  global.iterumSopPack = {
    PACK_DOC: PACK_DOC,
    SCHEMA_VERSION: SCHEMA_VERSION,
    emptyPack: emptyPack,
    normalizePack: normalizePack,
    mergePack: mergePack,
    loadPack: loadPack,
    savePack: savePack,
    importSample: importSample,
    getSamplePack: getSamplePack,
    seedSampleLocal: seedSampleLocal,
    seedSamplePack: seedSamplePack,
    loadLocal: loadLocal,
    saveLocal: saveLocal,
    categoryName: categoryName,
    sopsByCategory: sopsByCategory
  };
})(typeof window !== 'undefined' ? window : globalThis);
