/**
 * Merge parsed price-list SKUs onto vendor.products, vendor_prices, and ingredients.
 */
(function (global) {
  'use strict';

  function loadVendors() {
    if (Array.isArray(global.vendorManager?.vendors)) {
      return global.vendorManager.vendors;
    }
    try {
      var raw = localStorage.getItem('iterum_vendors');
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function persistVendors(vendors) {
    if (global.vendorManager) {
      global.vendorManager.vendors = vendors;
      if (typeof global.vendorManager.saveVendorsToFile === 'function') {
        global.vendorManager.saveVendorsToFile();
        return;
      }
    }
    localStorage.setItem('iterum_vendors', JSON.stringify(vendors));
    if (global.firestoreSync?.syncVendorsToFirestore) {
      global.firestoreSync.syncVendorsToFirestore(vendors).catch(function () {
        /* local copy is enough */
      });
    }
  }

  function vendorKey(v) {
    return String(v?.id || v?.name || '')
      .trim()
      .toLowerCase();
  }

  function productKey(p) {
    var sku = String(p?.sku || '')
      .trim()
      .toLowerCase();
    if (sku) return 'sku:' + sku;
    return (
      'name:' +
      String(p?.name || '')
        .trim()
        .toLowerCase()
    );
  }

  function findVendor(vendors, vendorId, vendorName) {
    if (vendorId) {
      var byId = vendors.find(function (v) {
        return String(v.id) === String(vendorId);
      });
      if (byId) return byId;
    }
    var want = String(vendorName || '')
      .trim()
      .toLowerCase();
    if (!want) return null;
    return (
      vendors.find(function (v) {
        return (
          vendorKey(v) === want || String(v.name || '').toLowerCase() === want
        );
      }) || null
    );
  }

  function createVendor(name) {
    return {
      id:
        (global.iterumOps && global.iterumOps.newId('v')) || 'v_' + Date.now(),
      name: name,
      company: name,
      products: [],
      is_active: true,
      created_at: new Date().toISOString(),
      specialties: [],
      notes: 'Created from price list upload'
    };
  }

  function normalizeProduct(raw) {
    var name = String(raw?.name || '').trim();
    if (!name) return null;
    var unitCost = raw.unitCost;
    if (typeof unitCost === 'string') {
      unitCost =
        global.iterumPriceListParser?.parseMoney(unitCost) ??
        parseFloat(unitCost);
    }
    if (!Number.isFinite(unitCost)) unitCost = null;
    var par = raw.par;
    if (par != null && par !== '') {
      par = Number(par);
      if (!Number.isFinite(par)) par = null;
    } else {
      par = null;
    }
    return {
      name: name,
      packSize: String(raw.packSize || '').trim(),
      sku: String(raw.sku || '').trim(),
      notes: String(raw.notes || '').trim(),
      specUrl: String(raw.specUrl || '').trim(),
      specNotes: String(raw.specNotes || '').trim(),
      unitCost: unitCost,
      category: String(raw.category || '').trim(),
      unit: String(raw.unit || '').trim() || 'ea',
      par: par,
      sourceFile: String(raw.sourceFile || '').trim()
    };
  }

  function mergeProducts(existing, incoming, mode) {
    var list = Array.isArray(existing) ? existing.slice() : [];
    var rows = (incoming || []).map(normalizeProduct).filter(Boolean);
    if (mode === 'replace') return rows;
    var index = new Map();
    list.forEach(function (p, i) {
      index.set(productKey(p), i);
    });
    rows.forEach(function (p) {
      var k = productKey(p);
      if (mode !== 'append' && index.has(k)) {
        var prev = list[index.get(k)];
        list[index.get(k)] = Object.assign({}, prev, p, {
          notes: p.notes || prev.notes,
          specUrl: p.specUrl || prev.specUrl
        });
      } else {
        index.set(k, list.length);
        list.push(p);
      }
    });
    return list;
  }

  function upsertIngredients(products, vendor) {
    var custom = [];
    var all = [];
    try {
      custom = JSON.parse(localStorage.getItem('custom_ingredients') || '[]');
    } catch (e) {
      custom = [];
    }
    try {
      all = JSON.parse(localStorage.getItem('ingredients_database') || '[]');
    } catch (e2) {
      all = [];
    }
    if (!Array.isArray(custom)) custom = [];
    if (!Array.isArray(all)) all = [];

    var added = 0;
    products.forEach(function (p) {
      var want = String(p.name).toLowerCase();
      var match = all.find(function (ing) {
        return String(ing.name || '').toLowerCase() === want;
      });
      var payload = {
        id: match?.id || 'ing_vendor_' + Date.now() + '_' + added,
        name: p.name,
        category: p.category || 'Purchased',
        default_unit: p.unit || 'ea',
        pack_size: p.packSize || '',
        sku: p.sku || '',
        cost_per_unit: p.unitCost,
        supplier: vendor.name,
        primaryVendor: vendor.name,
        vendor_info: {
          primaryVendor: vendor.name,
          vendorSKU: p.sku || '',
          packSize: p.packSize || '',
          unitPrice: p.unitCost
        },
        source: 'vendor_price_list',
        updated_at: new Date().toISOString()
      };
      if (match) {
        Object.assign(match, payload, { id: match.id });
      } else {
        all.push(payload);
        custom.push(payload);
        added += 1;
      }
    });
    localStorage.setItem('ingredients_database', JSON.stringify(all));
    localStorage.setItem('custom_ingredients', JSON.stringify(custom));
    return added;
  }

  function createRecipesFromProducts(products, vendor) {
    var recipes = [];
    try {
      recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
    } catch (e) {
      recipes = [];
    }
    if (!Array.isArray(recipes)) recipes = [];
    var created = [];
    var now = new Date().toISOString();
    products.forEach(function (p) {
      var title = p.name;
      var existing = recipes.find(function (r) {
        return (
          String(r.title || r.name || '').toLowerCase() ===
            title.toLowerCase() && r.source === 'Vendor catalog: ' + vendor.name
        );
      });
      if (existing) return;
      var recipe = {
        id:
          (global.iterumOps && global.iterumOps.newId('recipe')) ||
          'recipe_' + Date.now(),
        title: title,
        name: title,
        description:
          'Purchased item from ' +
          vendor.name +
          (p.sku ? ' (SKU ' + p.sku + ')' : '') +
          '. Finish the recipe with yield and prep method.',
        category: p.category || 'Purchased item',
        type: 'vendor-product',
        status: 'draft',
        recipe_status: 'needs-development',
        source: 'Vendor catalog: ' + vendor.name,
        servings: 1,
        ingredients: [
          {
            name: p.name,
            amount: p.packSize || '1',
            unit: p.unit || 'ea',
            cost: p.unitCost,
            vendor: vendor.name,
            sku: p.sku || ''
          }
        ],
        instructions: [
          'Receive and check against the ' + vendor.name + ' order guide.',
          'Store per spec. Update par and on-hand on the bar/inventory page.'
        ],
        createdAt: now,
        updatedAt: now
      };
      recipes.push(recipe);
      created.push(recipe);
      if (global.universalRecipeManager?.addToLibrary) {
        global.universalRecipeManager.addToLibrary(recipe, 'vendor_catalog');
      }
    });
    localStorage.setItem('recipes', JSON.stringify(recipes));
    try {
      var lib = JSON.parse(localStorage.getItem('recipe_library') || '[]');
      if (!Array.isArray(lib)) lib = [];
      created.forEach(function (r) {
        if (
          !lib.some(function (x) {
            return x.id === r.id;
          })
        ) {
          lib.push(r);
        }
      });
      localStorage.setItem('recipe_library', JSON.stringify(lib));
    } catch (e2) {
      /* ignore */
    }
    return created;
  }

  async function writeVendorPrices(vendor, products, projectId) {
    var sync = global.firestoreSync;
    if (!sync?.syncVendorPriceRowToFirestore)
      return { wrote: 0, skipped: products.length };
    var vendorDocId =
      typeof sync.vendorFirestoreDocId === 'function'
        ? sync.vendorFirestoreDocId(vendor)
        : String(vendor.id || vendor.name);
    var wrote = 0;
    var cap = Math.min(products.length, 400);
    for (var i = 0; i < cap; i++) {
      var p = products[i];
      if (p.unitCost == null) continue;
      try {
        var result = await sync.syncVendorPriceRowToFirestore({
          vendorDocId: vendorDocId,
          projectId: projectId || null,
          ingredientName: p.name,
          sku: p.sku || null,
          unitCost: p.unitCost,
          unit: p.unit || 'ea',
          vendorName: vendor.name
        });
        if (result && result.ok !== false) wrote += 1;
      } catch (e) {
        /* continue remaining rows */
      }
    }
    return { wrote: wrote, skipped: products.length - wrote };
  }

  async function commitCatalog(opts) {
    opts = opts || {};
    var vendorName = String(opts.vendorName || '').trim();
    if (!vendorName && !opts.vendorId) {
      throw new Error('Choose or name a vendor first.');
    }
    var products = (opts.products || []).map(normalizeProduct).filter(Boolean);
    if (!products.length) throw new Error('No catalog rows to save.');
    if (products.length > 1500) {
      products = products.slice(0, 1500);
    }

    var vendors = loadVendors();
    var vendor = findVendor(vendors, opts.vendorId, vendorName);
    if (!vendor) {
      vendor = createVendor(vendorName);
      vendors.push(vendor);
    }
    vendor.products = mergeProducts(
      vendor.products,
      products,
      opts.mode || 'merge'
    );
    vendor.updated_at = new Date().toISOString();
    persistVendors(vendors);

    var ingredientAdds = 0;
    if (opts.createIngredients !== false) {
      ingredientAdds = upsertIngredients(products, vendor);
    }

    var prices = { wrote: 0, skipped: 0 };
    if (opts.writePrices !== false) {
      var pid =
        opts.projectId ||
        (global.iterumOps && global.iterumOps.getProjectId()) ||
        null;
      prices = await writeVendorPrices(vendor, products, pid);
    }

    var recipes = [];
    if (opts.createRecipes) {
      recipes = createRecipesFromProducts(products, vendor);
    }

    return {
      vendor: vendor,
      productCount: vendor.products.length,
      imported: products.length,
      ingredientAdds: ingredientAdds,
      prices: prices,
      recipes: recipes
    };
  }

  global.iterumVendorCatalog = {
    loadVendors: loadVendors,
    persistVendors: persistVendors,
    findVendor: findVendor,
    mergeProducts: mergeProducts,
    normalizeProduct: normalizeProduct,
    upsertIngredients: upsertIngredients,
    createRecipesFromProducts: createRecipesFromProducts,
    commitCatalog: commitCatalog
  };
})(typeof window !== 'undefined' ? window : globalThis);
