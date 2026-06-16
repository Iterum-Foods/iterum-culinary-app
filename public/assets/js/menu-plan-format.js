/**
 * Canonical menu plan format — one structure for import, provision, and menu builder.
 * @version 1.0.0
 */
(function () {
  'use strict';

  const SCHEMA_VERSION = '1.0';

  const SECTION_PRESETS = {
    'fine-dining-dinner': [
      'To Begin',
      'From the Hearth & Field',
      'After',
      'Beverages'
    ],
    'boozy-brunch': [
      'Pastry & Bread',
      'Eggs & Savory',
      'Salads & Bowls',
      'Beverages'
    ],
    lunch: ['Starters', 'Mains', 'Sides', 'Desserts', 'Beverages'],
    tasting: [
      'Amuse',
      'First',
      'Second',
      'Main',
      'Dessert',
      'Wine Pairing Notes'
    ],
    'club-snacks': [
      'Snacks',
      'Small Plates',
      'Larger Plates',
      'Beverages'
    ],
    'fast-casual': ['Mains', 'Sides', 'Desserts', 'Beverages'],
    cocktails: [
      'Signature Cocktails',
      'Classics',
      'Zero-Proof',
      'Beer & Wine by the Glass'
    ],
    wine: ['Sparkling', 'White', 'Rosé', 'Red', 'Dessert & Fortified'],
    beer: ['On Draft', 'Bottles & Cans', 'Large Format'],
    mocktails: ['Signature Zero-Proof', 'Refreshers', 'Espresso & Tea'],
    'bar-full': ['Cocktails', 'Wine by the Glass', 'Beer', 'Zero-Proof'],
    blank: []
  };

  const BEVERAGE_MENU_TYPES = [
    'cocktails',
    'wine',
    'beer',
    'mocktails',
    'bar-full'
  ];

  const BEVERAGE_MENU_LABELS = {
    cocktails: 'Cocktail menu',
    wine: 'Wine list',
    beer: 'Beer list',
    mocktails: 'Mocktail menu',
    'bar-full': 'Full bar menu'
  };

  const MENU_TYPE_DEFAULTS = {
    dinner: {
      preset: 'fine-dining-dinner',
      mealPeriods: ['dinner'],
      targetCheck: 85,
      targetCheckIncludesBev: true
    },
    brunch: {
      preset: 'boozy-brunch',
      mealPeriods: ['brunch'],
      targetCheck: 48,
      targetCheckIncludesBev: true
    },
    lunch: {
      preset: 'lunch',
      mealPeriods: ['lunch'],
      targetCheck: 48,
      targetCheckIncludesBev: true
    },
    tasting: {
      preset: 'tasting',
      mealPeriods: ['dinner'],
      targetCheck: 95,
      targetCheckIncludesBev: false
    },
    club: {
      preset: 'club-snacks',
      mealPeriods: ['lunch', 'dinner'],
      targetCheck: 55,
      targetCheckIncludesBev: true
    },
    seasonal: {
      preset: 'fine-dining-dinner',
      mealPeriods: ['dinner'],
      targetCheck: 85,
      targetCheckIncludesBev: true
    },
    blank: {
      preset: 'blank',
      mealPeriods: ['dinner'],
      targetCheck: null,
      targetCheckIncludesBev: true
    },
    cocktails: {
      preset: 'cocktails',
      mealPeriods: ['dinner', 'brunch'],
      targetCheck: 16,
      targetCheckIncludesBev: false
    },
    wine: {
      preset: 'wine',
      mealPeriods: ['dinner', 'lunch', 'brunch'],
      targetCheck: 15,
      targetCheckIncludesBev: false
    },
    beer: {
      preset: 'beer',
      mealPeriods: ['dinner', 'lunch', 'brunch'],
      targetCheck: 9,
      targetCheckIncludesBev: false
    },
    mocktails: {
      preset: 'mocktails',
      mealPeriods: ['dinner', 'brunch', 'lunch'],
      targetCheck: 12,
      targetCheckIncludesBev: false
    },
    'bar-full': {
      preset: 'bar-full',
      mealPeriods: ['dinner', 'brunch', 'lunch'],
      targetCheck: 14,
      targetCheckIncludesBev: false
    }
  };

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function sectionObjects(names) {
    return (names || []).map((name, index) => ({
      id: slugify(name) || `section-${index + 1}`,
      name,
      sort: index + 1
    }));
  }

  function createEmptyPlan(overrides) {
    const menuType = overrides?.menuType || 'dinner';
    const defaults = MENU_TYPE_DEFAULTS[menuType] || MENU_TYPE_DEFAULTS.blank;
    const sectionNames =
      overrides?.sections ||
      SECTION_PRESETS[defaults.preset] ||
      SECTION_PRESETS.blank;

    return {
      schemaVersion: SCHEMA_VERSION,
      menu: {
        name: overrides?.name || '',
        description: overrides?.description || '',
        menuType,
        status: 'draft',
        service: {
          days: overrides?.days || [],
          mealPeriods: overrides?.mealPeriods || defaults.mealPeriods,
          targetCheck: overrides?.targetCheck ?? defaults.targetCheck,
          targetCheckIncludesBev:
            overrides?.targetCheckIncludesBev ?? defaults.targetCheckIncludesBev
        },
        sections: sectionObjects(sectionNames)
      },
      items: []
    };
  }

  function normalizeItem(raw, menu) {
    const sectionName =
      raw.section ||
      raw.category ||
      menu?.sections?.[0]?.name ||
      'Main Courses';
    const mealPeriods =
      raw.mealPeriods ||
      raw.availability?.mealPeriods ||
      menu?.service?.mealPeriods ||
      ['dinner'];

    return {
      id:
        raw.id ||
        `item_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name: String(raw.name || raw.title || '').trim(),
      description: raw.description || '',
      section: sectionName,
      category: sectionName,
      price: Number(raw.price) || 0,
      foodCost: raw.foodCost != null ? Number(raw.foodCost) : raw.cogs != null ? Number(raw.cogs) : null,
      targetFoodCostPercent:
        raw.targetFoodCostPercent != null
          ? Number(raw.targetFoodCostPercent)
          : 30,
      recipeId: raw.recipeId || null,
      recipeStatus: raw.recipeId ? 'linked' : raw.recipeStatus || 'stub',
      mealPeriods,
      availability: raw.availability || {
        daysAvailable: raw.days || menu?.service?.days?.length
          ? menu.service.days
          : ['all'],
        mealPeriods
      },
      status: raw.status || 'draft',
      sort: raw.sort != null ? raw.sort : null,
      beverageKind: raw.beverageKind || null,
      recipeType: raw.recipeType || null
    };
  }

  function normalizePlan(input) {
    if (!input || typeof input !== 'object') {
      throw new Error('menu_plan_invalid');
    }

    const menuType =
      input.menu?.menuType ||
      input.menuType ||
      input.menu?.menu_type ||
      'dinner';
    const base = createEmptyPlan({
      name: input.menu?.name || input.name || '',
      description: input.menu?.description || input.description || '',
      menuType,
      days: input.menu?.service?.days || input.service?.days || [],
      mealPeriods:
        input.menu?.service?.mealPeriods || input.service?.mealPeriods,
      targetCheck:
        input.menu?.service?.targetCheck ?? input.service?.targetCheck,
      targetCheckIncludesBev:
        input.menu?.service?.targetCheckIncludesBev ??
        input.service?.targetCheckIncludesBev
    });

    if (input.menu?.sections?.length) {
      base.menu.sections = input.menu.sections.map((s, i) =>
        typeof s === 'string'
          ? { id: slugify(s), name: s, sort: i + 1 }
          : {
              id: s.id || slugify(s.name),
              name: s.name,
              sort: s.sort != null ? s.sort : i + 1
            }
      );
    } else if (input.sections?.length) {
      base.menu.sections = sectionObjects(
        input.sections.map(s => (typeof s === 'string' ? s : s.name))
      );
    }

    const rawItems = input.items || input.menu?.items || input.menu || [];
    const itemList = Array.isArray(rawItems)
      ? rawItems
      : Array.isArray(input.menu)
        ? input.menu
        : [];

    base.items = itemList
      .filter(row => row && (row.name || row.title))
      .map(row => normalizeItem(row, base.menu));

    if (input.restaurant) {
      base.restaurant = input.restaurant;
    }

    if (input.menu?.id) base.menu.id = input.menu.id;
    if (input.menu?.status) base.menu.status = input.menu.status;

    return base;
  }

  function planToMenuRecord(plan, user) {
    const normalized = normalizePlan(plan);
    const now = new Date().toISOString();
    const projectId =
      window.projectManager?.getCurrentProject?.()?.id ||
      window.projectManager?.currentProject?.id ||
      null;

    return {
      id: normalized.menu.id || `menu_${Date.now()}`,
      name: normalized.menu.name,
      description: normalized.menu.description,
      menuType: normalized.menu.menuType,
      menu_type: normalized.menu.menuType,
      service: normalized.menu.service,
      categories: normalized.menu.sections.map(s => s.name),
      sections: normalized.menu.sections,
      items: normalized.items.map((item, index) => ({
        ...item,
        sort: item.sort != null ? item.sort : index + 1,
        projectId
      })),
      status: normalized.menu.status || 'draft',
      projectId,
      createdAt: now,
      updatedAt: now,
      userId: user?.userId || user?.id,
      userEmail: user?.email
    };
  }

  function planToProjectMenuPayload(plan, projectId) {
    const normalized = normalizePlan(plan);
    const menuId =
      normalized.menu.id || `menu_${projectId || 'workspace'}_${Date.now()}`;
    return {
      menu: {
        id: menuId,
        name: normalized.menu.name,
        description: normalized.menu.description,
        menuType: normalized.menu.menuType,
        service: normalized.menu.service,
        sections: normalized.menu.sections,
        projectId,
        status: normalized.menu.status || 'draft',
        updatedAt: new Date().toISOString()
      },
      items: normalized.items,
      updatedAt: new Date().toISOString()
    };
  }

  function getPresetOptions() {
    return Object.keys(MENU_TYPE_DEFAULTS).map(key => ({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' '),
      sections: SECTION_PRESETS[MENU_TYPE_DEFAULTS[key].preset] || [],
      defaults: MENU_TYPE_DEFAULTS[key]
    }));
  }

  function previewSectionsForType(menuType) {
    const defaults = MENU_TYPE_DEFAULTS[menuType] || MENU_TYPE_DEFAULTS.blank;
    return SECTION_PRESETS[defaults.preset] || [];
  }

  function isBeverageMenuType(menuType) {
    return BEVERAGE_MENU_TYPES.includes(menuType);
  }

  function beverageMenuLabel(menuType) {
    return BEVERAGE_MENU_LABELS[menuType] || menuType;
  }

  function inferBeverageKindFromSection(sectionName, menuType) {
    const s = String(sectionName || '').toLowerCase();
    if (s.includes('wine')) return 'wine';
    if (s.includes('beer') || s.includes('draft')) return 'beer';
    if (
      s.includes('zero') ||
      s.includes('mock') ||
      s.includes('na ') ||
      s.includes('non-alc')
    ) {
      return 'mocktail';
    }
    if (menuType === 'wine') return 'wine';
    if (menuType === 'beer') return 'beer';
    if (menuType === 'mocktails') return 'mocktail';
    return 'cocktail';
  }

  function fillCategorySelects(selectIds, categories, fallback) {
    const list =
      categories?.length ? categories : fallback || ['Main Courses'];
    (selectIds || []).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const current = el.value;
      el.innerHTML = list
        .map(
          name =>
            `<option value="${String(name).replace(/"/g, '&quot;')}">${name}</option>`
        )
        .join('');
      if (list.includes(current)) {
        el.value = current;
      } else {
        el.value = list[0];
      }
    });
  }

  window.MenuPlanFormat = {
    SCHEMA_VERSION,
    SECTION_PRESETS,
    MENU_TYPE_DEFAULTS,
    BEVERAGE_MENU_TYPES,
    BEVERAGE_MENU_LABELS,
    createEmptyPlan,
    normalizePlan,
    normalizeItem,
    planToMenuRecord,
    planToProjectMenuPayload,
    getPresetOptions,
    previewSectionsForType,
    fillCategorySelects,
    isBeverageMenuType,
    beverageMenuLabel,
    inferBeverageKindFromSection
  };
})();
