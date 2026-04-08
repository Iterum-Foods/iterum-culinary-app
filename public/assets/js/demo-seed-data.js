/**
 * Client demo: merge rich local sample data after sign-in.
 * Safe to run multiple times — merges by stable ids.
 */
(function (global) {
  'use strict';

  var DASH_PREFIX = 'iterum.dashboard.simplified';
  var DEMO_PROJECT_ID = 'demo_bistro_nord';

  function sessionUserId() {
    try {
      var raw = global.localStorage.getItem('current_user');
      if (!raw) return null;
      var u = JSON.parse(raw);
      return u.userId || u.id || u.uid || null;
    } catch (e) {
      return null;
    }
  }

  function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
  }

  function yesterdayIsoDate() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  function parseJson(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      if (!raw) return fallback;
      var v = JSON.parse(raw);
      return v != null ? v : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function mergeByKey(existing, incoming, getKey) {
    var map = {};
    var i;
    for (i = 0; i < existing.length; i++) {
      map[getKey(existing[i])] = existing[i];
    }
    for (i = 0; i < incoming.length; i++) {
      var k = getKey(incoming[i]);
      map[k] = Object.assign({}, map[k] || {}, incoming[i]);
    }
    return Object.keys(map).map(function (id) {
      return map[id];
    });
  }

  function demoProjects() {
    var now = new Date().toISOString();
    return [
      {
        id: DEMO_PROJECT_ID,
        name: 'Bistro Nord — Spring tasting',
        description:
          'Showcase venue: seasonal lunch, pastry, and beverage alignment.',
        type: 'restaurant',
        status: 'active',
        createdAt: now,
        icon: '◇',
        color: '#5b7c5f',
        isDefault: false
      }
    ];
  }

  function demoDashboardMaps(projectId, userLabel) {
    var t = todayIsoDate();
    var y = yesterdayIsoDate();
    var tasks = {};
    tasks[y] = [
      {
        id: 'demo_task_1',
        text: 'Verify walk-in temps (AM)',
        done: true,
        createdAt: new Date(y + 'T08:00:00').toISOString()
      },
      {
        id: 'demo_task_2',
        text: 'Prep mis for evening service',
        done: true,
        createdAt: new Date(y + 'T14:00:00').toISOString()
      }
    ];
    tasks[t] = [
      {
        id: 'demo_task_3',
        text: 'Cost new spring veg specials',
        done: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo_task_4',
        text: 'HACCP review — saucier station',
        done: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo_task_5',
        text: 'Sync menu-builder prices with POS test',
        done: false,
        createdAt: new Date().toISOString()
      }
    ];

    var notes = {};
    notes[t] = {
      content:
        'Demo shift notes — ' +
        userLabel +
        ':\n• Tasting at 4pm — allergens flagged on beet tart.\n• Pastry bench: proof % logged in kitchen hub.\n• Keep yuzu foam off hot pass until pick-up.',
      updatedAt: new Date().toISOString()
    };

    return { tasks: tasks, notes: notes };
  }

  function demoIdeas() {
    var now = new Date().toISOString();
    return [
      {
        id: 'demo_idea_1',
        title: 'Smoked yeast butter — bread program',
        notes: 'Pair with koji rye; test hydration 68% vs 72%.',
        status: 'open',
        createdAt: now
      },
      {
        id: 'demo_idea_2',
        title: 'Zero-waste root peel broth',
        notes: 'Clarify for vegetarian demi stand-in.',
        status: 'open',
        createdAt: now
      },
      {
        id: 'demo_idea_3',
        title: 'Lunch prix fixe — $42',
        notes: 'Approved for print; needs menu-builder PDF pass.',
        status: 'done',
        createdAt: now
      }
    ];
  }

  function demoRecipes(uid) {
    var now = new Date().toISOString();
    return [
      {
        id: 'demo_recipe_charred_leek',
        title: 'Charred leek soup with brown butter',
        name: 'Charred leek soup with brown butter',
        description:
          'Silky allium base with crisp leek oil — strong vegetarian anchor.',
        category: 'soup',
        cuisine: 'Nordic',
        servings: 24,
        prepTime: 35,
        cookTime: 45,
        difficulty: 'medium',
        projectId: DEMO_PROJECT_ID,
        project: DEMO_PROJECT_ID,
        userId: uid,
        status: 'published',
        tags: ['vegetarian', 'spring', 'demo'],
        ingredients: [
          { name: 'Leeks, cleaned', amount: '3', unit: 'kg', notes: 'white + light green' },
          { name: 'Unsalted butter', amount: '200', unit: 'g', notes: 'brown in pan first' },
          { name: 'Yukon potatoes', amount: '800', unit: 'g', notes: 'diced' },
          { name: 'Vegetable stock', amount: '3', unit: 'L', notes: '' }
        ],
        instructions: [
          { step: 1, instruction: 'Char leeks hard on plancha; deglaze with stock.' },
          { step: 2, instruction: 'Sweat potatoes in brown butter; add leeks + stock; simmer 25 min.' },
          { step: 3, instruction: 'Blitz smooth; pass; finish with cold leek oil.' }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'demo_recipe_arctic_char',
        title: 'Arctic char — beet, horseradish, dill oil',
        name: 'Arctic char — beet, horseradish, dill oil',
        description: 'Plated main: gentle smoke, bright roots, dairy counterpoint.',
        category: 'entree',
        cuisine: 'Scandinavian',
        servings: 12,
        prepTime: 40,
        cookTime: 25,
        difficulty: 'medium',
        projectId: DEMO_PROJECT_ID,
        project: DEMO_PROJECT_ID,
        userId: uid,
        status: 'published',
        tags: ['fish', 'plated', 'demo'],
        ingredients: [
          { name: 'Arctic char fillet', amount: '1.8', unit: 'kg', notes: 'pin bone out' },
          { name: 'Golden beets', amount: '1', unit: 'kg', notes: 'roast, dice' },
          { name: 'Horseradish cream', amount: '300', unit: 'ml', notes: '' },
          { name: 'Dill oil', amount: '60', unit: 'ml', notes: '' }
        ],
        instructions: [
          { step: 1, instruction: 'Cold-smoke char 12 min; portion 120 g.' },
          { step: 2, instruction: 'Pan skin-side to crisp; finish in oven 120°C until 48°C internal.' },
          { step: 3, instruction: 'Swoosh cream; beets; fish; dill oil in strokes.' }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'demo_recipe_sunflower_tart',
        title: 'Sunflower seed tart — cloudberry',
        name: 'Sunflower seed tart — cloudberry',
        description: 'Pastry case: nut-free, strong counter to savory courses.',
        category: 'pastry',
        cuisine: 'Nordic',
        servings: 14,
        prepTime: 60,
        cookTime: 35,
        difficulty: 'hard',
        projectId: DEMO_PROJECT_ID,
        project: DEMO_PROJECT_ID,
        userId: uid,
        status: 'published',
        tags: ['dessert', 'allergen-aware', 'demo'],
        ingredients: [
          { name: 'Sunflower seeds, toasted', amount: '400', unit: 'g', notes: '' },
          { name: 'Pastry cream', amount: '1', unit: 'batch', notes: 'vanilla' },
          { name: 'Cloudberry preserves', amount: '200', unit: 'g', notes: '' },
          { name: 'Short dough', amount: '1', unit: 'batch', notes: 'blind bake' }
        ],
        instructions: [
          { step: 1, instruction: 'Grind seeds with sugar; fold into frangipane alternative.' },
          { step: 2, instruction: 'Fill tart shell; bake 165°C until set.' },
          { step: 3, instruction: 'Glaze with cloudberry; micro herbs optional.' }
        ],
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  function demoCustomIngredients() {
    return [
      {
        id: 'demo_ing_cloudberry',
        name: 'Cloudberry preserves',
        category: 'dry_grocery',
        unit: 'g',
        costPerUnit: 0.08,
        notes: 'Nordic supplier — demo line item'
      },
      {
        id: 'demo_ing_yuzu',
        name: 'Yuzu juice (frozen)',
        category: 'dry_grocery',
        unit: 'ml',
        costPerUnit: 0.06,
        notes: 'Beverage + pastry cross-use'
      },
      {
        id: 'demo_ing_char',
        name: 'Arctic char (fillet)',
        category: 'seafood',
        unit: 'g',
        costPerUnit: 0.045,
        notes: 'Sustainability note on spec sheet'
      }
    ];
  }

  function demoVendors() {
    var now = new Date().toISOString();
    return [
      {
        id: 'demo_vendor_nordic',
        name: 'Elin S.',
        company: 'Nordic Purveyors Cooperative',
        email: 'orders@nordic-purveyors.demo',
        phone: '555-0100',
        mobile: '',
        city: 'Oslo',
        state: '',
        zip_code: '',
        specialties: ['fish', 'berries', 'dairy'],
        notes: 'Demo vendor — seasonal air freight bundle.',
        products: [
          {
            name: 'Arctic char (whole fish)',
            packSize: '12–14 kg cases',
            unitCost: 19.2,
            sku: 'NPC-ACH14',
            notes: ''
          },
          {
            name: 'Cloudberry jar 720 ml',
            packSize: '6 jars',
            unitCost: 48,
            sku: 'NPC-CLO6',
            notes: ''
          }
        ],
        invoiceAttachment: null,
        is_active: true,
        created_at: now
      },
      {
        id: 'demo_vendor_local_green',
        name: 'M. Okonkwo',
        company: 'Greenbelt Microfarms',
        email: 'sales@greenbelt.demo',
        phone: '555-0200',
        mobile: '',
        city: 'Minneapolis',
        state: 'MN',
        zip_code: '55401',
        specialties: ['produce', 'herbs'],
        notes: 'Demo — hydro greens + baby roots Tuesday/Friday.',
        products: [
          {
            name: 'Hydro mizuna',
            packSize: '1 lb clamshell',
            unitCost: 6.5,
            sku: 'GRN-MIZ1',
            notes: ''
          }
        ],
        invoiceAttachment: null,
        is_active: true,
        created_at: now
      }
    ];
  }

  /**
   * Enhanced menu-builder + menus_${userId} list (recipe-linked items).
   */
  function demoMenuBuilderData(uid) {
    var now = new Date().toISOString();
    var menuMeta = {
      id: 'demo_menu_spring',
      name: 'Spring lunch — Bistro Nord (demo)',
      description: 'Client walkthrough — three recipe-linked dishes.',
      projectId: DEMO_PROJECT_ID,
      createdAt: now,
      updatedAt: now,
      version: '1.0'
    };
    var items = [
      {
        id: 'demo_mitem_soup',
        name: 'Charred leek soup',
        description: 'Brown butter · potato · leek oil',
        category: 'First',
        price: 14,
        targetFoodCost: 28,
        recipeId: 'demo_recipe_charred_leek',
        recipeName: 'Charred leek soup with brown butter',
        recipeLinkStatus: 'linked',
        allergens: [],
        dietaryInfo: [],
        projectedCovers: 40,
        portionSize: '250 ml',
        prepStation: 'Garde manger',
        prepLeadTime: 1,
        serviceNotes: 'Demo vegetarian course',
        spiceLevel: 'mild',
        isSignature: false,
        isNew: true,
        isSeasonal: true,
        availability: { daysAvailable: ['all'], mealPeriods: ['lunch', 'dinner'] },
        createdAt: now,
        updatedAt: now,
        projectId: DEMO_PROJECT_ID
      },
      {
        id: 'demo_mitem_char',
        name: 'Arctic char',
        description: 'Beet · horseradish · dill',
        category: 'Main Courses',
        price: 34,
        targetFoodCost: 32,
        recipeId: 'demo_recipe_arctic_char',
        recipeName: 'Arctic char — beet, horseradish, dill oil',
        recipeLinkStatus: 'linked',
        allergens: ['fish', 'dairy'],
        dietaryInfo: [],
        projectedCovers: 55,
        portionSize: '120 g',
        prepStation: 'Sauté',
        prepLeadTime: 0,
        serviceNotes: 'Demo allergen callout on print',
        spiceLevel: 'mild',
        isSignature: true,
        isNew: true,
        isSeasonal: true,
        availability: { daysAvailable: ['all'], mealPeriods: ['lunch', 'dinner'] },
        createdAt: now,
        updatedAt: now,
        projectId: DEMO_PROJECT_ID
      },
      {
        id: 'demo_mitem_tart',
        name: 'Sunflower tart',
        description: 'Cloudberry · seeds',
        category: 'Desserts',
        price: 13,
        targetFoodCost: 26,
        recipeId: 'demo_recipe_sunflower_tart',
        recipeName: 'Sunflower seed tart — cloudberry',
        recipeLinkStatus: 'linked',
        allergens: ['gluten', 'dairy'],
        dietaryInfo: [],
        projectedCovers: 35,
        portionSize: '1 slice',
        prepStation: 'Pastry',
        prepLeadTime: 4,
        serviceNotes: '',
        spiceLevel: 'mild',
        isSignature: false,
        isNew: true,
        isSeasonal: true,
        availability: { daysAvailable: ['all'], mealPeriods: ['lunch', 'dinner'] },
        createdAt: now,
        updatedAt: now,
        projectId: DEMO_PROJECT_ID
      }
    ];
    var listMenu = Object.assign({}, menuMeta, {
      items: items,
      categories: [
        { id: 1, name: 'First', items: [items[0]] },
        { id: 2, name: 'Main', items: [items[1]] },
        { id: 3, name: 'Dessert', items: [items[2]] }
      ]
    });
    return {
      menuDataPayload: { menu: menuMeta, items: items },
      listMenu: listMenu
    };
  }

  function demoMenuDraft(uid) {
    var now = new Date().toISOString();
    return {
      id: 9001,
      name: 'Spring lunch — Bistro Nord (demo)',
      type: 'tasting',
      description: 'Three-course narrative for client walkthrough.',
      season: 'Spring',
      validUntil: '',
      categories: [
        {
          id: 1,
          name: 'First',
          items: [
            {
              id: 1,
              name: 'Charred leek soup',
              description: 'Brown butter · potato · leek oil',
              price: 14
            }
          ]
        },
        {
          id: 2,
          name: 'Main',
          items: [
            {
              id: 2,
              name: 'Arctic char',
              description: 'Beet · horseradish · dill',
              price: 34
            }
          ]
        },
        {
          id: 3,
          name: 'Dessert',
          items: [
            {
              id: 3,
              name: 'Sunflower tart',
              description: 'Cloudberry · seeds',
              price: 13
            }
          ]
        }
      ],
      createdAt: now,
      createdBy: uid,
      projectId: DEMO_PROJECT_ID
    };
  }

  function setActiveProjectKeys(uid, projectId, projectName) {
    global.localStorage.setItem('iterum_current_project', projectId);
    global.localStorage.setItem('iterum_current_project_user_' + uid, projectId);
    global.localStorage.setItem(
      'iterum_current_project_' + uid,
      projectId
    );
    global.localStorage.setItem('active_project_id', projectId);
    global.localStorage.setItem('active_project_name', projectName);
    global.localStorage.setItem('active_project', projectId);
  }

  /**
   * @param {{ forceGuest?: boolean, skipProfile?: boolean }} [options]
   * @returns {{ ok: boolean, error?: string, summary?: object }}
   */
  global.applyIterumDemoSeed = function (options) {
    options = options || {};
    var uid = sessionUserId();
    if (!uid && !options.forceGuest) {
      return { ok: false, error: 'not_signed_in' };
    }
    if (!uid) uid = 'guest';

    var userLabel = 'Demo culinary lead';
    try {
      var cu = JSON.parse(global.localStorage.getItem('current_user') || '{}');
      userLabel = cu.name || cu.displayName || cu.email || userLabel;
    } catch (e) {}

    if (!options.skipProfile && typeof global.saveOperatorProfile === 'function') {
      global.saveOperatorProfile({
        roleKey: 'chef_leadership',
        scope: 'restaurant_group',
        demoSeeded: true
      });
    }

    var projectsKey = 'iterum_projects_user_' + uid;
    var existingProjects = parseJson(projectsKey, []);
    var masterExists = existingProjects.some(function (p) {
      return p.id === 'master';
    });
    if (!masterExists) {
      existingProjects.push({
        id: 'master',
        name: 'Master Project',
        description: 'Default project for all culinary data',
        type: 'master',
        createdAt: new Date().toISOString(),
        isDefault: demoProjects().length === 0,
        icon: '🏠',
        color: '#6366f1'
      });
    }
    existingProjects = mergeByKey(
      existingProjects,
      demoProjects(),
      function (p) {
        return p.id;
      }
    );
    global.localStorage.setItem(projectsKey, JSON.stringify(existingProjects));

    var demoName = 'Bistro Nord — Spring tasting';
    setActiveProjectKeys(uid, DEMO_PROJECT_ID, demoName);

    var maps = demoDashboardMaps(DEMO_PROJECT_ID, userLabel);
    var tasksKey = DASH_PREFIX + '.tasks.' + DEMO_PROJECT_ID;
    var notesKey = DASH_PREFIX + '.notes.' + DEMO_PROJECT_ID;
    var ideasKey = DASH_PREFIX + '.ideas.' + DEMO_PROJECT_ID;

    var prevTasks = parseJson(tasksKey, {});
    var mergedTasks = Object.assign({}, prevTasks, maps.tasks);
    global.localStorage.setItem(tasksKey, JSON.stringify(mergedTasks));

    var prevNotes = parseJson(notesKey, {});
    var mergedNotes = Object.assign({}, prevNotes, maps.notes);
    global.localStorage.setItem(notesKey, JSON.stringify(mergedNotes));

    var prevIdeas = parseJson(ideasKey, []);
    global.localStorage.setItem(
      ideasKey,
      JSON.stringify(mergeByKey(prevIdeas, demoIdeas(), function (i) {
        return i.id;
      }))
    );

    var newRecipes = demoRecipes(uid);
    var lib = parseJson('recipe_library', []);
    var rec = parseJson('recipes', []);
    lib = mergeByKey(lib, newRecipes, function (r) {
      return r.id;
    });
    rec = mergeByKey(rec, newRecipes, function (r) {
      return r.id;
    });
    global.localStorage.setItem('recipe_library', JSON.stringify(lib));
    global.localStorage.setItem('recipes', JSON.stringify(rec));

    var custom = parseJson('custom_ingredients', []);
    global.localStorage.setItem(
      'custom_ingredients',
      JSON.stringify(
        mergeByKey(custom, demoCustomIngredients(), function (x) {
          return x.id;
        })
      )
    );

    var vendors = parseJson('iterum_vendors', []);
    global.localStorage.setItem(
      'iterum_vendors',
      JSON.stringify(
        mergeByKey(vendors, demoVendors(), function (v) {
          return String(v.id);
        })
      )
    );

    var menuKey = 'iterum_menu_draft_' + uid + '_' + DEMO_PROJECT_ID;
    global.localStorage.setItem(menuKey, JSON.stringify(demoMenuDraft(uid)));

    var builder = demoMenuBuilderData(uid);
    global.localStorage.setItem(
      'menu_data_' + DEMO_PROJECT_ID,
      JSON.stringify(builder.menuDataPayload)
    );
    var menusKey = 'menus_' + uid;
    var menusList = parseJson(menusKey, []);
    global.localStorage.setItem(
      menusKey,
      JSON.stringify(
        mergeByKey(menusList, [builder.listMenu], function (m) {
          return m.id;
        })
      )
    );

    return {
      ok: true,
      summary: {
        projectId: DEMO_PROJECT_ID,
        recipes: newRecipes.length,
        vendors: demoVendors().length,
        menuItems: builder.menuDataPayload.items.length,
        menuKey: menuKey
      }
    };
  };

  global.ITERUM_DEMO_PROJECT_ID = DEMO_PROJECT_ID;
})(typeof window !== 'undefined' ? window : this);
