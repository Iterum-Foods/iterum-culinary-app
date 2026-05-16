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

  function parseJsonObject(key, fallback) {
    var v = parseJson(key, fallback);
    if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    return fallback;
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

  function isoHoursAgo(h) {
    var d = new Date();
    d.setHours(d.getHours() - h);
    return d.toISOString();
  }

  function mergeObject(existing, incoming) {
    return Object.assign({}, existing || {}, incoming || {});
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
    var nowIso = new Date().toISOString();
    notes[t] = {
      daily:
        'Demo daily notes — ' +
        userLabel +
        ':\n• Tasting at 4pm — allergens flagged on beet tart.\n• Pastry bench: proof % logged in kitchen hub.\n• Keep yuzu foam off hot pass until pick-up.',
      dailyUpdatedAt: nowIso,
      manager:
        'Manager handoff (demo): review walk-in alarm log; schedule vendor for Friday dairy; private: performance check-in with AM lead.',
      managerUpdatedAt: nowIso
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
          {
            name: 'Leeks, cleaned',
            amount: '3',
            unit: 'kg',
            notes: 'white + light green'
          },
          {
            name: 'Unsalted butter',
            amount: '200',
            unit: 'g',
            notes: 'brown in pan first'
          },
          {
            name: 'Yukon potatoes',
            amount: '800',
            unit: 'g',
            notes: 'diced'
          },
          { name: 'Vegetable stock', amount: '3', unit: 'L', notes: '' }
        ],
        instructions: [
          {
            step: 1,
            instruction: 'Char leeks hard on plancha; deglaze with stock.'
          },
          {
            step: 2,
            instruction:
              'Sweat potatoes in brown butter; add leeks + stock; simmer 25 min.'
          },
          {
            step: 3,
            instruction: 'Blitz smooth; pass; finish with cold leek oil.'
          }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'demo_recipe_arctic_char',
        title: 'Arctic char — beet, horseradish, dill oil',
        name: 'Arctic char — beet, horseradish, dill oil',
        description:
          'Plated main: gentle smoke, bright roots, dairy counterpoint.',
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
          {
            name: 'Arctic char fillet',
            amount: '1.8',
            unit: 'kg',
            notes: 'pin bone out'
          },
          {
            name: 'Golden beets',
            amount: '1',
            unit: 'kg',
            notes: 'roast, dice'
          },
          { name: 'Horseradish cream', amount: '300', unit: 'ml', notes: '' },
          { name: 'Dill oil', amount: '60', unit: 'ml', notes: '' }
        ],
        instructions: [
          { step: 1, instruction: 'Cold-smoke char 12 min; portion 120 g.' },
          {
            step: 2,
            instruction:
              'Pan skin-side to crisp; finish in oven 120°C until 48°C internal.'
          },
          {
            step: 3,
            instruction: 'Swoosh cream; beets; fish; dill oil in strokes.'
          }
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
          {
            name: 'Sunflower seeds, toasted',
            amount: '400',
            unit: 'g',
            notes: ''
          },
          {
            name: 'Pastry cream',
            amount: '1',
            unit: 'batch',
            notes: 'vanilla'
          },
          {
            name: 'Cloudberry preserves',
            amount: '200',
            unit: 'g',
            notes: ''
          },
          {
            name: 'Short dough',
            amount: '1',
            unit: 'batch',
            notes: 'blind bake'
          }
        ],
        instructions: [
          {
            step: 1,
            instruction:
              'Grind seeds with sugar; fold into frangipane alternative.'
          },
          { step: 2, instruction: 'Fill tart shell; bake 165°C until set.' },
          {
            step: 3,
            instruction: 'Glaze with cloudberry; micro herbs optional.'
          }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'demo_recipe_beet_tartare',
        title: 'Golden beet tartare — capers & mustard oil',
        name: 'Golden beet tartare — capers & mustard oil',
        description: 'Amuse: raw-finished beets, no animal protein.',
        category: 'appetizer',
        cuisine: 'Nordic',
        servings: 20,
        prepTime: 25,
        cookTime: 35,
        difficulty: 'easy',
        projectId: DEMO_PROJECT_ID,
        project: DEMO_PROJECT_ID,
        userId: uid,
        status: 'published',
        tags: ['vegetarian', 'amuse', 'demo'],
        ingredients: [
          {
            name: 'Golden beets',
            amount: '1.2',
            unit: 'kg',
            notes: 'roast, brunoise'
          },
          { name: 'Shallot', amount: '60', unit: 'g', notes: 'minced' },
          {
            name: 'Capers',
            amount: '30',
            unit: 'g',
            notes: 'fried for garnish'
          },
          { name: 'Mustard oil', amount: '15', unit: 'ml', notes: 'finish' }
        ],
        instructions: [
          {
            step: 1,
            instruction: 'Roast beets wrapped; peel while warm; cool.'
          },
          {
            step: 2,
            instruction: 'Cut fine tartare; bind with shallot, salt, lemon.'
          },
          { step: 3, instruction: 'Quenelle on plate; capers; micro sorrel.' }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'demo_recipe_seaweed_oyster',
        title: 'Chilled oysters — seaweed mignonette',
        name: 'Chilled oysters — seaweed mignonette',
        description: 'Shuck to order · kelp–shallot mignonette.',
        category: 'appetizer',
        cuisine: 'Nordic',
        servings: 12,
        prepTime: 15,
        cookTime: 0,
        difficulty: 'easy',
        projectId: DEMO_PROJECT_ID,
        project: DEMO_PROJECT_ID,
        userId: uid,
        status: 'published',
        tags: ['shellfish', 'bar', 'demo', 'bar_pass'],
        ingredients: [
          { name: 'Oysters', amount: '24', unit: 'pc', notes: 'shucked' },
          {
            name: 'Mignonette',
            amount: '1',
            unit: 'batch',
            notes: 'kelp vinegar + shallot + white pepper'
          }
        ],
        instructions: [
          {
            step: 1,
            instruction: 'Ice + mignonette cup; shuck; check liquor.'
          }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'demo_recipe_koji_rye',
        title: 'Koji rye loaf',
        name: 'Koji rye loaf',
        description: 'Pastry batch — slice cold for pass.',
        category: 'bakery',
        cuisine: 'Nordic',
        servings: 2,
        prepTime: 20,
        cookTime: 45,
        difficulty: 'medium',
        projectId: DEMO_PROJECT_ID,
        project: DEMO_PROJECT_ID,
        userId: uid,
        status: 'published',
        tags: ['bread', 'fermentation', 'demo', 'bar_pass'],
        ingredients: [
          {
            name: 'Rye dough (bulk)',
            amount: '1',
            unit: 'batch',
            notes: 'rye + koji syrup + salt + water — baked off AM'
          },
          {
            name: 'Cultured butter',
            amount: '1',
            unit: 'quart',
            notes: 'whipped'
          }
        ],
        instructions: [
          {
            step: 1,
            instruction:
              'Pull from pastry; 6 mm slices; butter ramekin on tray.'
          }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'demo_recipe_maitake_skewer',
        title: 'Charred maitake — smoked cream',
        name: 'Charred maitake — smoked cream',
        description: 'Grill skewer · dip smoked cream (vegan).',
        category: 'appetizer',
        cuisine: 'Nordic',
        servings: 16,
        prepTime: 12,
        cookTime: 10,
        difficulty: 'easy',
        projectId: DEMO_PROJECT_ID,
        project: DEMO_PROJECT_ID,
        userId: uid,
        status: 'published',
        tags: ['vegetarian', 'bar', 'demo', 'bar_pass'],
        ingredients: [
          {
            name: 'Maitake + oil + salt',
            amount: '1',
            unit: 'mis',
            notes: 'skewer 80 g clusters'
          },
          {
            name: 'Smoked cashew cream',
            amount: '200',
            unit: 'ml',
            notes: 'hot'
          }
        ],
        instructions: [
          {
            step: 1,
            instruction: 'Char skewers; ramekin of cream on pick-up tray.'
          }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'demo_recipe_yuzu_spritzer',
        title: 'Yuzu–honey spritzer (NA)',
        name: 'Yuzu–honey spritzer (NA)',
        description: 'Build in glass: yuzu + honey 1:1 + soda.',
        category: 'beverage',
        cuisine: 'Fusion',
        servings: 1,
        prepTime: 2,
        cookTime: 0,
        difficulty: 'easy',
        projectId: DEMO_PROJECT_ID,
        project: DEMO_PROJECT_ID,
        userId: uid,
        status: 'published',
        tags: ['na-bev', 'bar', 'demo', 'bar_pass'],
        ingredients: [
          {
            name: 'Yuzu 20 ml + honey syrup 15 ml + soda 120 ml',
            amount: '1',
            unit: 'serve',
            notes: 'wine glass, ice'
          }
        ],
        instructions: [
          {
            step: 1,
            instruction: 'Pour yuzu + syrup; top soda; one gentle stir.'
          }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'demo_recipe_cloudberry_shrub',
        title: 'Cloudberry shrub cordial',
        name: 'Cloudberry shrub cordial',
        description: 'Batch cordial — 20 ml shot or lengthen with soda.',
        category: 'beverage',
        cuisine: 'Nordic',
        servings: 12,
        prepTime: 10,
        cookTime: 8,
        difficulty: 'easy',
        projectId: DEMO_PROJECT_ID,
        project: DEMO_PROJECT_ID,
        userId: uid,
        status: 'published',
        tags: ['na-bev', 'bar', 'demo', 'bar_pass'],
        ingredients: [
          {
            name: 'Cordial base',
            amount: '1',
            unit: 'batch',
            notes: 'cloudberry + sugar simmer, cool, strain, add vinegar'
          }
        ],
        instructions: [
          {
            step: 1,
            instruction: 'Bottle dated; service: 20 ml neat or + soda.'
          }
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
      },
      {
        id: 'demo_ing_leek',
        name: 'Leeks (case)',
        category: 'produce',
        unit: 'kg',
        costPerUnit: 2.8,
        notes: 'Demo pars — trim for soup'
      },
      {
        id: 'demo_ing_brown_butter',
        name: 'Brown butter prep',
        category: 'dairy',
        unit: 'kg',
        costPerUnit: 14.5,
        notes: 'Clarified phase captured separately'
      },
      {
        id: 'demo_ing_sunflower',
        name: 'Sunflower seeds (toasted)',
        category: 'dry_grocery',
        unit: 'kg',
        costPerUnit: 9.2,
        notes: 'Pastry — nut-free'
      },
      {
        id: 'demo_ing_horseradish',
        name: 'Horseradish root (fresh)',
        category: 'produce',
        unit: 'kg',
        costPerUnit: 11,
        notes: 'Grate to order'
      },
      {
        id: 'demo_ing_oyster',
        name: 'Oysters (live)',
        category: 'seafood',
        unit: 'piece',
        costPerUnit: 2.1,
        notes: 'Demo count — overnight tag'
      },
      {
        id: 'demo_ing_kelp_vinegar',
        name: 'Kelp vinegar',
        category: 'dry_grocery',
        unit: 'L',
        costPerUnit: 18,
        notes: 'Mignonette base'
      },
      {
        id: 'demo_ing_rye_flour',
        name: 'Rye flour (whole)',
        category: 'dry_grocery',
        unit: 'kg',
        costPerUnit: 2.4,
        notes: 'Bread program'
      },
      {
        id: 'demo_ing_maitake',
        name: 'Maitake mushrooms',
        category: 'produce',
        unit: 'kg',
        costPerUnit: 16,
        notes: 'Grill station'
      },
      {
        id: 'demo_ing_quat_sanitizer',
        name: 'Quat sanitizer concentrate',
        category: 'chemicals',
        unit: 'L',
        costPerUnit: 6.5,
        notes: '3-compartment sink — demo par stock'
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

  function baseMenuItem(uid, partial) {
    var now = new Date().toISOString();
    return Object.assign(
      {
        allergens: [],
        dietaryInfo: [],
        projectedCovers: 40,
        portionSize: '',
        prepStation: 'General',
        prepLeadTime: 0,
        serviceNotes: '',
        spiceLevel: 'mild',
        isSignature: false,
        isNew: true,
        isSeasonal: true,
        availability: {
          daysAvailable: ['all'],
          mealPeriods: ['lunch', 'dinner']
        },
        createdAt: now,
        updatedAt: now,
        projectId: DEMO_PROJECT_ID
      },
      partial,
      { userId: uid }
    );
  }

  /**
   * Enhanced menu-builder + menus_${userId} list (recipe-linked items).
   */
  function demoMenuBuilderData(uid) {
    var now = new Date().toISOString();
    var menuMeta = {
      id: 'demo_menu_spring',
      name: 'Spring lunch — Bistro Nord (demo)',
      description: 'Client walkthrough — four-course recipe-linked lunch.',
      projectId: DEMO_PROJECT_ID,
      createdAt: now,
      updatedAt: now,
      version: '1.0'
    };
    var items = [
      baseMenuItem(uid, {
        id: 'demo_mitem_beet',
        name: 'Golden beet tartare',
        description: 'Capers · mustard oil · sorrel',
        category: 'Amuse',
        price: 9,
        targetFoodCost: 22,
        recipeId: 'demo_recipe_beet_tartare',
        recipeName: 'Golden beet tartare — capers & mustard oil',
        recipeLinkStatus: 'linked',
        projectedCovers: 45,
        portionSize: '40 g',
        prepStation: 'Garde manger',
        serviceNotes: 'Demo vegetarian amuse'
      }),
      baseMenuItem(uid, {
        id: 'demo_mitem_soup',
        name: 'Charred leek soup',
        description: 'Brown butter · potato · leek oil',
        category: 'First',
        price: 14,
        targetFoodCost: 28,
        recipeId: 'demo_recipe_charred_leek',
        recipeName: 'Charred leek soup with brown butter',
        recipeLinkStatus: 'linked',
        projectedCovers: 40,
        portionSize: '250 ml',
        prepStation: 'Garde manger',
        prepLeadTime: 1,
        serviceNotes: 'Demo vegetarian course'
      }),
      baseMenuItem(uid, {
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
        projectedCovers: 55,
        portionSize: '120 g',
        prepStation: 'Sauté',
        serviceNotes: 'Demo allergen callout on print',
        isSignature: true
      }),
      baseMenuItem(uid, {
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
        projectedCovers: 35,
        portionSize: '1 slice',
        prepStation: 'Pastry',
        prepLeadTime: 4
      })
    ];
    var listMenu = Object.assign({}, menuMeta, {
      items: items,
      categories: [
        { id: 1, name: 'Amuse', items: [items[0]] },
        { id: 2, name: 'First', items: [items[1]] },
        { id: 3, name: 'Main', items: [items[2]] },
        { id: 4, name: 'Dessert', items: [items[3]] }
      ]
    });
    return {
      menuDataPayload: { menu: menuMeta, items: items },
      listMenu: listMenu
    };
  }

  /** Second menu card — bar & bites (same project). */
  function demoBarMenuList(uid) {
    var now = new Date().toISOString();
    var menuMeta = {
      id: 'demo_menu_bar',
      name: 'Bar & bites — Nordic lounge (demo)',
      description: 'Pass-around + NA cocktails for walkthrough.',
      projectId: DEMO_PROJECT_ID,
      createdAt: now,
      updatedAt: now,
      version: '1.0'
    };
    var items = [
      baseMenuItem(uid, {
        id: 'demo_mitem_oyster',
        name: 'Chilled oysters',
        description: 'Seaweed mignonette',
        category: 'Raw bar',
        price: 18,
        targetFoodCost: 30,
        recipeId: 'demo_recipe_seaweed_oyster',
        recipeName: 'Chilled oysters — seaweed mignonette',
        recipeLinkStatus: 'linked',
        allergens: ['shellfish'],
        projectedCovers: 30,
        portionSize: '2 pc',
        prepStation: 'Raw bar',
        availability: {
          daysAvailable: ['all'],
          mealPeriods: ['dinner', 'lunch']
        }
      }),
      baseMenuItem(uid, {
        id: 'demo_mitem_rye',
        name: 'Koji rye & butter',
        description: 'Whipped cultured butter',
        category: 'Bread',
        price: 8,
        targetFoodCost: 18,
        recipeId: 'demo_recipe_koji_rye',
        recipeName: 'Koji rye loaf',
        recipeLinkStatus: 'linked',
        allergens: ['gluten', 'dairy'],
        projectedCovers: 25,
        portionSize: '2 slices',
        prepStation: 'Pastry'
      }),
      baseMenuItem(uid, {
        id: 'demo_mitem_maitake',
        name: 'Charred maitake skewer',
        description: 'Smoked cream',
        category: 'Vegetable',
        price: 12,
        targetFoodCost: 24,
        recipeId: 'demo_recipe_maitake_skewer',
        recipeName: 'Charred maitake — smoked cream',
        recipeLinkStatus: 'linked',
        projectedCovers: 20,
        portionSize: '1 skewer',
        prepStation: 'Grill',
        dietaryInfo: ['vegan']
      }),
      baseMenuItem(uid, {
        id: 'demo_mitem_yuzu',
        name: 'Yuzu-honey spritzer',
        description: 'NA · bubbles',
        category: 'Beverage',
        price: 7,
        targetFoodCost: 12,
        recipeId: 'demo_recipe_yuzu_spritzer',
        recipeName: 'Yuzu–honey spritzer (NA)',
        recipeLinkStatus: 'linked',
        projectedCovers: 80,
        portionSize: '350 ml',
        prepStation: 'Bar',
        availability: {
          daysAvailable: ['all'],
          mealPeriods: ['lunch', 'dinner']
        }
      }),
      baseMenuItem(uid, {
        id: 'demo_mitem_shrub',
        name: 'Cloudberry shrub shot',
        description: 'Lengthen with soda optional',
        category: 'Beverage',
        price: 6,
        targetFoodCost: 15,
        recipeId: 'demo_recipe_cloudberry_shrub',
        recipeName: 'Cloudberry shrub cordial',
        recipeLinkStatus: 'linked',
        projectedCovers: 40,
        portionSize: '60 ml',
        prepStation: 'Bar'
      })
    ];
    return Object.assign({}, menuMeta, {
      items: items,
      categories: [
        { id: 1, name: 'Raw bar', items: [items[0]] },
        { id: 2, name: 'Bread', items: [items[1]] },
        { id: 3, name: 'Hot', items: [items[2]] },
        { id: 4, name: 'Drinks', items: [items[3], items[4]] }
      ]
    });
  }

  function demoMenuDraft(uid) {
    var now = new Date().toISOString();
    return {
      id: 9001,
      name: 'Spring lunch — Bistro Nord (demo)',
      type: 'tasting',
      description: 'Four-course narrative for client walkthrough.',
      season: 'Spring',
      validUntil: '',
      categories: [
        {
          id: 1,
          name: 'Amuse',
          items: [
            {
              id: 1,
              name: 'Golden beet tartare',
              description: 'Capers · mustard oil',
              price: 9
            }
          ]
        },
        {
          id: 2,
          name: 'First',
          items: [
            {
              id: 2,
              name: 'Charred leek soup',
              description: 'Brown butter · potato · leek oil',
              price: 14
            }
          ]
        },
        {
          id: 3,
          name: 'Main',
          items: [
            {
              id: 3,
              name: 'Arctic char',
              description: 'Beet · horseradish · dill',
              price: 34
            }
          ]
        },
        {
          id: 4,
          name: 'Dessert',
          items: [
            {
              id: 4,
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

  function demoSanitizerTests() {
    return [
      {
        id: 'demo_san_1',
        location: '3-bay sink — prep',
        type: 'Quaternary (200-400 ppm)',
        sanitizer_type: 'quaternary',
        concentration: 280,
        time_slot: 'morning',
        timestamp: isoHoursAgo(3),
        status: 'normal',
        notes: 'Demo strip + meter agreement'
      },
      {
        id: 'demo_san_2',
        location: 'Bar rinse',
        type: 'Chlorine (50-200 ppm)',
        sanitizer_type: 'chlorine',
        concentration: 120,
        time_slot: 'afternoon',
        timestamp: isoHoursAgo(6),
        status: 'normal',
        notes: ''
      },
      {
        id: 'demo_san_3',
        location: 'Dish pit — mop sink',
        type: 'Chlorine (50-200 ppm)',
        sanitizer_type: 'chlorine',
        concentration: 85,
        time_slot: 'afternoon',
        timestamp: isoHoursAgo(10),
        status: 'normal',
        notes: ''
      },
      {
        id: 'demo_san_4',
        location: 'Server station',
        type: 'Quaternary (200-400 ppm)',
        sanitizer_type: 'quaternary',
        concentration: 140,
        time_slot: 'evening',
        timestamp: isoHoursAgo(20),
        status: 'too_low',
        notes: 'Demo corrective action: remade bucket + re-logged'
      },
      {
        id: 'demo_san_5',
        location: 'Pastry small sink',
        type: 'Iodine (12.5-25 ppm)',
        sanitizer_type: 'iodine',
        concentration: 18,
        time_slot: 'morning',
        timestamp: isoHoursAgo(26),
        status: 'normal',
        notes: ''
      },
      {
        id: 'demo_san_6',
        location: '3-bay sink — prep',
        type: 'Quaternary (200-400 ppm)',
        sanitizer_type: 'quaternary',
        concentration: 310,
        time_slot: 'night',
        timestamp: isoHoursAgo(30),
        status: 'normal',
        notes: 'Overnight close check'
      }
    ];
  }

  function demoTemperatureReadings() {
    return [
      {
        id: 'demo_temp_1',
        refrigerator_id: 'demo_eq_walkin',
        refrigerator_name: 'Walk-in cooler — demo',
        temperature: 38,
        time_slot: 'morning',
        timestamp: isoHoursAgo(2),
        notes: 'Line check',
        status: 'normal'
      },
      {
        id: 'demo_temp_2',
        refrigerator_id: 'demo_eq_walkin',
        refrigerator_name: 'Walk-in cooler — demo',
        temperature: 39,
        time_slot: 'afternoon',
        timestamp: isoHoursAgo(8),
        notes: '',
        status: 'normal'
      },
      {
        id: 'demo_temp_3',
        refrigerator_id: 'demo_eq_line',
        refrigerator_name: 'Reach-in — hot line',
        temperature: 37,
        time_slot: 'afternoon',
        timestamp: isoHoursAgo(5),
        notes: 'Fish drawer',
        status: 'normal'
      },
      {
        id: 'demo_temp_4',
        refrigerator_id: 'demo_eq_pastry',
        refrigerator_name: 'Pastry low boy',
        temperature: 36,
        time_slot: 'evening',
        timestamp: isoHoursAgo(12),
        notes: '',
        status: 'normal'
      },
      {
        id: 'demo_temp_5',
        refrigerator_id: 'demo_eq_freezer',
        refrigerator_name: 'Batch freezer',
        temperature: -2,
        time_slot: 'morning',
        timestamp: isoHoursAgo(28),
        notes: 'Ice cream hold',
        status: 'normal'
      }
    ];
  }

  function demoDishwasherTests() {
    return [
      {
        id: 'demo_dw_1',
        dishwasher: 'Hobart conveyor — demo',
        temperature: 186,
        sanitizer: 95,
        cycle_time: 2.1,
        time_slot: 'afternoon',
        timestamp: isoHoursAgo(4),
        status: 'passed',
        temp_status: 'passed',
        sanitizer_status: 'passed',
        cycle_status: 'passed',
        notes: ' Lunch rack run'
      },
      {
        id: 'demo_dw_2',
        dishwasher: 'Hobart conveyor — demo',
        temperature: 182,
        sanitizer: 205,
        cycle_time: 1.6,
        time_slot: 'evening',
        timestamp: isoHoursAgo(18),
        status: 'warning',
        temp_status: 'passed',
        sanitizer_status: 'warning',
        cycle_status: 'passed',
        notes: 'Demo — sanitizer high after refill; adjusted dilution'
      }
    ];
  }

  function demoEquipmentFridges() {
    var now = new Date().toISOString();
    return [
      {
        id: 'demo_eq_walkin',
        name: 'Walk-in cooler — demo',
        category: 'Refrigeration',
        type: 'walk-in',
        location: 'Receiving',
        notes: 'HACCP demo unit',
        createdAt: now
      },
      {
        id: 'demo_eq_line',
        name: 'Reach-in — hot line',
        category: 'Refrigeration',
        type: 'reach-in',
        location: 'Kitchen',
        notes: 'Demo',
        createdAt: now
      },
      {
        id: 'demo_eq_pastry',
        name: 'Pastry low boy',
        category: 'Refrigeration',
        type: 'undercounter',
        location: 'Pastry',
        notes: 'Demo',
        createdAt: now
      },
      {
        id: 'demo_eq_freezer',
        name: 'Batch freezer',
        category: 'Refrigeration',
        type: 'freezer',
        location: 'Pastry',
        notes: 'Demo',
        createdAt: now
      }
    ];
  }

  function demoInventoryItems() {
    var t = new Date().toISOString();
    return [
      {
        id: 'demo_inv_1',
        ingredientId: 'demo_ing_char',
        ingredientName: 'Arctic char (fillet)',
        quantity: 12,
        unit: 'kg',
        location: 'Walk-in',
        parLevel: 8,
        reorderPoint: 5,
        cost: 0,
        lastUpdated: t,
        createdAt: t
      },
      {
        id: 'demo_inv_2',
        ingredientId: 'demo_ing_leek',
        ingredientName: 'Leeks (case)',
        quantity: 24,
        unit: 'kg',
        location: 'Walk-in',
        parLevel: 15,
        reorderPoint: 10,
        cost: 0,
        lastUpdated: t,
        createdAt: t
      },
      {
        id: 'demo_inv_3',
        ingredientId: 'demo_ing_quat_sanitizer',
        ingredientName: 'Quat sanitizer concentrate',
        quantity: 4,
        unit: 'L',
        location: 'Chemical cage',
        parLevel: 2,
        reorderPoint: 1,
        cost: 0,
        lastUpdated: t,
        createdAt: t
      }
    ];
  }

  function demoRecipeIdeas(uid) {
    var now = new Date().toISOString();
    return [
      {
        id: 'demo_idea_rec_1',
        title: 'Birch syrup panna cotta',
        description:
          'Pilot for fall menu — replace cloudberry garnish with lingon.',
        tags: ['dessert', 'pilot'],
        projectId: DEMO_PROJECT_ID,
        userId: uid,
        status: 'brainstorm',
        createdAt: now
      },
      {
        id: 'demo_idea_rec_2',
        title: 'Fermented potato bread',
        description: 'Use koji steam in dough; tie to rye program.',
        tags: ['bread', 'rd'],
        projectId: DEMO_PROJECT_ID,
        userId: uid,
        status: 'brainstorm',
        createdAt: now
      }
    ];
  }

  function demoRecipesInProgress(uid) {
    var now = new Date().toISOString();
    return [
      {
        id: 'demo_recipe_wip_scallop',
        title: 'Scallop crudo — rhubarb kosho (WIP)',
        name: 'Scallop crudo — rhubarb kosho (WIP)',
        description: 'R&D plate — not yet on menu.',
        category: 'appetizer',
        projectId: DEMO_PROJECT_ID,
        userId: uid,
        status: 'draft',
        ingredients: [
          { name: 'Dry scallops', amount: '12', unit: 'pc', notes: '' },
          {
            name: 'Rhubarb kosho',
            amount: '80',
            unit: 'g',
            notes: 'test batch'
          }
        ],
        instructions: [
          {
            step: 1,
            instruction: 'Slice scallop thin; dot kosho; finish evoo.'
          }
        ],
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  function menuItemsForDatabase(menuItems, menuId, uid) {
    var now = new Date().toISOString();
    return menuItems.map(function (it) {
      return {
        id: it.id,
        name: it.name,
        description: it.description || '',
        category: it.category || 'Uncategorized',
        price: it.price,
        targetFoodCost: it.targetFoodCost,
        recipeId: it.recipeId,
        recipeName: it.recipeName,
        recipeLinkStatus: it.recipeLinkStatus || 'linked',
        allergens: it.allergens || [],
        dietaryInfo: it.dietaryInfo || [],
        projectedCovers: it.projectedCovers,
        portionSize: it.portionSize,
        prepStation: it.prepStation,
        prepLeadTime: it.prepLeadTime,
        serviceNotes: it.serviceNotes,
        spiceLevel: it.spiceLevel,
        isSignature: it.isSignature,
        isNew: it.isNew,
        isSeasonal: it.isSeasonal,
        availability: it.availability,
        menuIds: [menuId],
        projectId: DEMO_PROJECT_ID,
        userId: uid,
        createdAt: now,
        updatedAt: now
      };
    });
  }

  function menuRecipeLinkMap(menuItems, uid) {
    var map = {};
    var now = new Date().toISOString();
    var i;
    for (i = 0; i < menuItems.length; i++) {
      var it = menuItems[i];
      if (it.id && it.recipeId) {
        map[it.id] = {
          recipeId: it.recipeId,
          linkedAt: now,
          linkedBy: uid || 'demo-seed',
          source: 'demo-seed',
          recipeStatus: 'linked'
        };
      }
    }
    return map;
  }

  function setActiveProjectKeys(uid, projectId, projectName) {
    global.localStorage.setItem('iterum_current_project', projectId);
    global.localStorage.setItem(
      'iterum_current_project_user_' + uid,
      projectId
    );
    global.localStorage.setItem('iterum_current_project_' + uid, projectId);
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
    } catch (err) {
      void err; // ignore malformed current_user when building demo label
    }

    if (
      !options.skipProfile &&
      typeof global.saveOperatorProfile === 'function'
    ) {
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
      JSON.stringify(
        mergeByKey(prevIdeas, demoIdeas(), function (i) {
          return i.id;
        })
      )
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

    var customIngs = demoCustomIngredients();
    var custom = parseJson('custom_ingredients', []);
    global.localStorage.setItem(
      'custom_ingredients',
      JSON.stringify(
        mergeByKey(custom, customIngs, function (x) {
          return x.id;
        })
      )
    );
    var ingDb = parseJson('ingredients_database', []);
    global.localStorage.setItem(
      'ingredients_database',
      JSON.stringify(
        mergeByKey(ingDb, customIngs, function (x) {
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
    var barList = demoBarMenuList(uid);
    global.localStorage.setItem(
      'menu_data_' + DEMO_PROJECT_ID,
      JSON.stringify(builder.menuDataPayload)
    );
    var menusKey = 'menus_' + uid;
    var menusList = parseJson(menusKey, []);
    menusList = mergeByKey(menusList, [builder.listMenu], function (m) {
      return m.id;
    });
    menusList = mergeByKey(menusList, [barList], function (m) {
      return m.id;
    });
    global.localStorage.setItem(menusKey, JSON.stringify(menusList));

    var dbRows = menuItemsForDatabase(
      builder.menuDataPayload.items,
      'demo_menu_spring',
      uid
    ).concat(menuItemsForDatabase(barList.items, 'demo_menu_bar', uid));
    var menuDb = parseJson('menu_items_database', []);
    global.localStorage.setItem(
      'menu_items_database',
      JSON.stringify(
        mergeByKey(menuDb, dbRows, function (x) {
          return x.id;
        })
      )
    );

    var linkObj = parseJsonObject('menu_recipe_links', {});
    global.localStorage.setItem(
      'menu_recipe_links',
      JSON.stringify(
        Object.assign(
          {},
          linkObj,
          menuRecipeLinkMap(builder.menuDataPayload.items, uid),
          menuRecipeLinkMap(barList.items, uid)
        )
      )
    );

    var ideas = parseJson('recipe_ideas', []);
    global.localStorage.setItem(
      'recipe_ideas',
      JSON.stringify(
        mergeByKey(ideas, demoRecipeIdeas(uid), function (x) {
          return x.id;
        })
      )
    );
    var wip = parseJson('recipes_in_progress', []);
    global.localStorage.setItem(
      'recipes_in_progress',
      JSON.stringify(
        mergeByKey(wip, demoRecipesInProgress(uid), function (x) {
          return x.id;
        })
      )
    );

    var sanMerge = function (arr) {
      return mergeByKey(arr, demoSanitizerTests(), function (x) {
        return String(x.id);
      });
    };
    global.localStorage.setItem(
      'iterum_haccp_sanitizer',
      JSON.stringify(sanMerge(parseJson('iterum_haccp_sanitizer', [])))
    );
    global.localStorage.setItem(
      'haccp_sanitizer_' + uid,
      JSON.stringify(sanMerge(parseJson('haccp_sanitizer_' + uid, [])))
    );

    var tempMerge = function (arr) {
      return mergeByKey(arr, demoTemperatureReadings(), function (x) {
        return String(x.id);
      });
    };
    global.localStorage.setItem(
      'iterum_haccp_readings',
      JSON.stringify(tempMerge(parseJson('iterum_haccp_readings', [])))
    );
    global.localStorage.setItem(
      'haccp_readings_' + uid,
      JSON.stringify(tempMerge(parseJson('haccp_readings_' + uid, [])))
    );

    var dwMerge = function (arr) {
      return mergeByKey(arr, demoDishwasherTests(), function (x) {
        return String(x.id);
      });
    };
    global.localStorage.setItem(
      'iterum_haccp_dishwasher',
      JSON.stringify(dwMerge(parseJson('iterum_haccp_dishwasher', [])))
    );
    global.localStorage.setItem(
      'haccp_dishwasher_' + uid,
      JSON.stringify(dwMerge(parseJson('haccp_dishwasher_' + uid, [])))
    );

    var eq = parseJson('iterum_equipment', []);
    global.localStorage.setItem(
      'iterum_equipment',
      JSON.stringify(
        mergeByKey(eq, demoEquipmentFridges(), function (e) {
          return String(e.id);
        })
      )
    );

    var inv = parseJson('inventory_items', []);
    global.localStorage.setItem(
      'inventory_items',
      JSON.stringify(
        mergeByKey(inv, demoInventoryItems(), function (x) {
          return x.id;
        })
      )
    );

    return {
      ok: true,
      summary: {
        projectId: DEMO_PROJECT_ID,
        recipes: newRecipes.length,
        vendors: demoVendors().length,
        menuCards: 2,
        menuItems: builder.menuDataPayload.items.length + barList.items.length,
        sanitizerChecks: demoSanitizerTests().length,
        temperatureLogs: demoTemperatureReadings().length,
        menuKey: menuKey
      }
    };
  };

  /**
   * Same paths as office Firestore sync: projects/{projectId}/menus/primary (Shift hub).
   * @param {string} [uid]
   */
  global.getIterumDemoFirestoreMenuMirror = function (uid) {
    uid = uid || sessionUserId() || 'guest';
    var builder = demoMenuBuilderData(uid);
    return {
      projectId: DEMO_PROJECT_ID,
      menu: builder.menuDataPayload.menu,
      items: builder.menuDataPayload.items,
      links: menuRecipeLinkMap(builder.menuDataPayload.items, uid),
      itemCount: builder.menuDataPayload.items.length
    };
  };

  /**
   * users/{uid}/snapshots/recipeLibrary — lean objects for mobile list + Firestore limits.
   * @param {string} [uid]
   */
  global.getIterumDemoRecipeLibraryMirror = function (uid) {
    uid = uid || sessionUserId() || 'guest';
    return demoRecipes(uid).map(function (r) {
      var o = {
        id: r.id,
        name: r.name || r.title,
        title: r.title || r.name,
        description: r.description || '',
        servings: r.servings
      };
      if (r.yield != null && r.yield !== '') {
        o.yield = r.yield;
      }
      return o;
    });
  };

  global.ITERUM_DEMO_PROJECT_ID = DEMO_PROJECT_ID;
  global.ITERUM_DEMO_EMAILS = ['demo@iterumfoods.com'];
})(typeof window !== 'undefined' ? window : this);
