/**
 * Common Craft bar program seed (from "Bar Program 8.12.26" workbook).
 * Import from Bar program hub — merges SOPs, drinks, station pars, inventory.
 */
(function (global) {
  'use strict';

  var SOURCE = 'Common Craft Bar Program 8.12.26';

  var STANDARDS = [
    {
      id: 'cc_foh_hospitality',
      categoryId: 'foh',
      title: 'Hospitality standard — anticipatory service',
      sort: 10,
      jobTags: [
        'server',
        'host',
        'front_of_house',
        'bartender',
        'operations_gm'
      ],
      body:
        'Service is anticipatory, never reactive.\n' +
        '1. Greet guests within 30 seconds of arrival.\n' +
        '2. Maintain water glasses at greater than 50% capacity.\n' +
        '3. Clear plates silently within 60 seconds of meal completion.\n' +
        '4. Read the table: never ask “are you still working on that?” — watch utensils and pace.'
    },
    {
      id: 'cc_foh_ambiance',
      categoryId: 'foh',
      title: 'Ambiance control — light and audio presets',
      sort: 11,
      jobTags: [
        'operations_gm',
        'bar_manager',
        'bartender',
        'location_manager'
      ],
      body:
        'Lighting and audio are highly controlled.\n' +
        '1. Operations Director and Lead Bartender set dimmers and sound at 4:00 PM, 7:00 PM, and 10:00 PM.\n' +
        '2. Do not override presets without a manager.\n' +
        '3. If a zone is off-spec, log the time and correct it before the next preset.'
    },
    {
      id: 'cc_foh_tableware',
      categoryId: 'foh',
      title: 'Pristine tableware — steam-and-vinegar polish',
      sort: 12,
      jobTags: [
        'server',
        'runner',
        'bartender',
        'dishwasher',
        'front_of_house'
      ],
      body:
        'No cloudy glass, water-spotted silverware, or smudged menu may hit a table.\n' +
        '1. All silverware and glassware go through the steam-and-vinegar polish protocol before the shift.\n' +
        '2. Spot-check rims under light; reject anything with lipstick, chips, or haze.\n' +
        '3. Menus wiped and aligned; replace any with stains or bent corners.'
    },
    {
      id: 'cc_boh_tasting',
      categoryId: 'kitchen',
      title: 'Tasting protocol — sauces before 3:30 PM',
      sort: 10,
      jobTags: ['sous_chef', 'line_cook', 'chef_leadership', 'kitchen_manager'],
      body:
        'Sous Chef and line cooks must physically taste every batch of sauce, puree, jus, and vinaigrette before 3:30 PM daily.\n' +
        '1. No element is served unapproved.\n' +
        '2. Log tasting time and who tasted on the prep list.\n' +
        '3. Re-season and re-taste if flat, broken, or oxidized.'
    },
    {
      id: 'cc_boh_labeling',
      categoryId: 'kitchen',
      title: 'Mise en place & labeling',
      sort: 11,
      jobTags: ['line_cook', 'prep_cook', 'bartender', 'kitchen_staff'],
      body:
        'Every squeeze bottle, hotel pan, and deli container must be cleanly taped, labeled with scissors-cut tape (never torn), dated, and signed.\n' +
        '1. Name of item, date, time, initials.\n' +
        '2. Color-cap cheaters at the bar match the station par list.\n' +
        '3. Discard anything unlabeled or past shelf life.'
    },
    {
      id: 'cc_boh_pass',
      categoryId: 'kitchen',
      title: 'Pass control',
      sort: 12,
      jobTags: ['expeditor', 'chef_leadership', 'line_cook', 'runner'],
      body:
        'The pass is sacred.\n' +
        '1. Wipe plates clean of grease, fingerprints, or splashes before handing to the food runner.\n' +
        '2. Kitchen communication stays urgent but quiet — no yelling, screaming, or panic.\n' +
        '3. Expo calls tickets once; cooks repeat back.'
    },
    {
      id: 'cc_bar_cocktail_build',
      categoryId: 'bar',
      title: 'Cocktail build standards (Common Craft)',
      sort: 10,
      jobTags: ['bartender', 'bar_manager'],
      body:
        '1. Build from the published spec — jigger every pour unless the drink is batched.\n' +
        '2. Shake hard 10–12 seconds; stir 20–30 revolutions; dry-shake egg drinks before ice.\n' +
        '3. Taste batched cocktails at open and after 2 hours idle.\n' +
        '4. Garnish per spec; no fingerprints on the rim.\n' +
        '5. Call the drink name when placing. Flag allergens (nuts, egg, dairy, sulfites) to the server.'
    }
  ];

  var DRINKS = [
    {
      title: 'Flamingo Fizz',
      build: [
        { ingredient: "Tito's Vodka", amount: '1.5', unit: 'oz' },
        { ingredient: 'Lillet Rouge', amount: '0.5', unit: 'oz' },
        { ingredient: 'House almond orgeat', amount: '0.5', unit: 'oz' },
        { ingredient: 'Fresh strawberry puree', amount: '0.5', unit: 'oz' },
        { ingredient: 'Clarified lemon juice', amount: '0.5', unit: 'oz' }
      ],
      glass: 'Coupe',
      method: 'Shake hard with ice and fine strain into a chilled coupe.',
      garnish: 'Dried rose petals and dehydrated lime',
      allergies: 'Tree nuts (almond orgeat), citrus, sulfites (Lillet). Vegan.',
      source: SOURCE
    },
    {
      title: 'Southie Hard Sell',
      build: [
        { ingredient: 'Barr Hill Raw Honey Gin', amount: '1.0', unit: 'oz' },
        { ingredient: 'Mount Rigi Alpine liqueur', amount: '1.0', unit: 'oz' },
        { ingredient: "Jeppson's Malört", amount: '0.5', unit: 'oz' },
        { ingredient: 'Fresh lime juice', amount: '0.5', unit: 'oz' },
        { ingredient: 'Passionfruit cordial', amount: '0.5', unit: 'oz' }
      ],
      glass: 'Double old fashioned',
      method: 'Stir over ice and strain over a large clear ice block.',
      garnish: 'Expressed lemon peel twist',
      allergies: 'Citrus, honey (non-vegan).',
      source: SOURCE
    },
    {
      title: 'Red Line: Expect Delays',
      build: [
        { ingredient: 'Apaluz Joven Mezcal', amount: '2.0', unit: 'oz' },
        { ingredient: 'Sweet vermouth', amount: '1.0', unit: 'oz' },
        { ingredient: 'Chambord', amount: '0.75', unit: 'oz' },
        { ingredient: 'Absinthe rinse', amount: '1', unit: 'rinse' }
      ],
      glass: 'Nick & Nora',
      method:
        'Rinse Nick & Nora with absinthe. Shake remaining ingredients with ice and double strain.',
      garnish: 'Lemon peel wrapped Luxardo cherry',
      allergies: 'Sulfites (vermouth). Vegan.',
      source: SOURCE
    },
    {
      title: 'Old Colliny',
      build: [
        { ingredient: 'Lunazul Reposado Tequila', amount: '2.0', unit: 'oz' },
        { ingredient: 'Dragonfruit pepper syrup', amount: '0.75', unit: 'oz' },
        { ingredient: 'Fresh lime juice', amount: '0.75', unit: 'oz' },
        { ingredient: "Peychaud's bitters", amount: '2', unit: 'dashes' }
      ],
      glass: 'Rocks',
      method:
        'Shake with ice and strain over a large ice block in a black pepper-salted rim rocks glass.',
      garnish: 'Cracked pepper salt rim and lime wheel',
      allergies: 'Citrus. Vegan.',
      source: SOURCE
    },
    {
      title: 'Greenhouse Tonic',
      build: [
        { ingredient: 'Fords London Dry Gin', amount: '2.0', unit: 'oz' },
        { ingredient: 'Cardamom honey syrup', amount: '0.75', unit: 'oz' },
        { ingredient: 'Fresh lemon juice', amount: '0.75', unit: 'oz' },
        { ingredient: 'English cucumber', amount: '3', unit: 'slices' },
        { ingredient: 'Fever-Tree tonic', amount: '3.0', unit: 'oz' }
      ],
      glass: 'Highball',
      method:
        'Muddle cucumber, add gin, honey, and lemon. Shake, strain over ice, top with tonic.',
      garnish: 'Cucumber ribbon and mint sprig',
      allergies: 'Citrus, honey (non-vegan).',
      source: SOURCE
    },
    {
      title: 'Palm Royale',
      build: [
        { ingredient: 'Privateer Reserve Rum', amount: '1.5', unit: 'oz' },
        { ingredient: 'Velvet falernum', amount: '0.5', unit: 'oz' },
        {
          ingredient: 'Caramelized pineapple syrup',
          amount: '1.0',
          unit: 'oz'
        },
        { ingredient: 'Fresh lime juice', amount: '0.75', unit: 'oz' },
        { ingredient: 'Coconut cream', amount: '0.5', unit: 'oz' }
      ],
      glass: 'Tiki mug / highball',
      method:
        'Flash blend with crushed ice for 5 seconds and dump into tiki mug.',
      garnish: 'Dehydrated pineapple wheel and mint sprig',
      allergies: 'Tree nuts (falernum almonds), coconut, citrus. Vegan.',
      source: SOURCE
    },
    {
      title: 'Castle Island Sour',
      build: [
        {
          ingredient: 'Elijah Craig Small Batch Bourbon',
          amount: '2.0',
          unit: 'oz'
        },
        { ingredient: 'Fresh lemon juice', amount: '0.75', unit: 'oz' },
        { ingredient: 'Rich demerara syrup 2:1', amount: '0.75', unit: 'oz' },
        { ingredient: 'Pasteurized egg white', amount: '1.0', unit: 'oz' },
        { ingredient: 'Angostura bitters', amount: '3', unit: 'drops' }
      ],
      glass: 'Double old fashioned',
      method:
        'Dry shake 15s, add ice, shake hard 10s, double strain into DOF. Bitters art on foam.',
      garnish: 'Angostura dropper design',
      allergies: 'Egg white, citrus.',
      source: SOURCE
    },
    {
      title: 'Dot Ave Espresso Martini',
      build: [
        { ingredient: 'Triple Eight Vodka', amount: '1.5', unit: 'oz' },
        {
          ingredient: 'Mr. Black cold brew liqueur',
          amount: '0.75',
          unit: 'oz'
        },
        { ingredient: 'Fresh espresso', amount: '1.0', unit: 'oz' },
        { ingredient: 'Vanilla bean liqueur', amount: '0.25', unit: 'oz' },
        { ingredient: 'Chocolate bitters', amount: '2', unit: 'dashes' }
      ],
      glass: 'Coupe',
      method:
        'Shake vigorously with ice for maximum crema. Double strain into chilled coupe.',
      garnish: '3 espresso beans and cocoa dust',
      allergies: 'Caffeine. Vegan.',
      source: SOURCE
    },
    {
      title: 'Southie Carajillo',
      build: [
        { ingredient: 'Licor 43', amount: '1.5', unit: 'oz' },
        { ingredient: 'Fresh espresso', amount: '1.5', unit: 'oz' },
        { ingredient: 'Orange blossom water', amount: '1', unit: 'pinch' }
      ],
      glass: 'Rocks',
      method:
        'Shake Licor 43 and espresso extra hard with ice for 15s. Strain over fresh ice.',
      garnish: 'Spiced cinnamon sugar rim',
      allergies: 'Caffeine. Vegan.',
      source: SOURCE
    },
    {
      title: 'No-Proof Botanical Spritz',
      build: [
        {
          ingredient: 'House lavender sparkle syrup',
          amount: '1.0',
          unit: 'oz'
        },
        { ingredient: 'Fresh lemon juice', amount: '0.75', unit: 'oz' },
        {
          ingredient: 'Fever-Tree elderflower tonic',
          amount: '4.0',
          unit: 'oz'
        }
      ],
      glass: 'Wine glass',
      method:
        'Build syrup and lemon over ice. Top with non-alcoholic tonic and stir gently.',
      garnish: 'Lavender sprig and lemon wheel',
      allergies: 'Citrus. Vegan. Zero-proof.',
      source: SOURCE
    },
    {
      title: "Kuzco's Poison",
      build: [
        { ingredient: 'House rum batch', amount: '3.5', unit: 'oz' },
        { ingredient: 'Fresh lime juice', amount: '0.5', unit: 'oz' }
      ],
      glass: 'Nick & Nora',
      method:
        'Shake batch and lime; double strain. Batch: rum, lime, passionfruit, Licor 43.',
      garnish: 'Smoked pineapple',
      allergies: 'Citrus. Vegan.',
      source: SOURCE
    },
    {
      title: 'Black Mass',
      build: [
        { ingredient: 'Black Mass batch', amount: '2.5', unit: 'oz' },
        { ingredient: 'Angostura bitters', amount: '2', unit: 'dashes' },
        { ingredient: 'Orange bitters', amount: '2', unit: 'dashes' }
      ],
      glass: 'Rocks',
      method:
        'Stir batch and bitters over ice; strain over large cube. Batch: Irish whiskey, scotch, Averna, black rum.',
      garnish: 'Burnt cinnamon stick',
      allergies: 'None listed. Vegan.',
      source: SOURCE
    }
  ];

  var STATION_STOCK = [
    "House vodka cheater (Tito's / Triple Eight) — 2 x 1.0L — Well 1 & 2 speed rail",
    'House gin (Fords) — 2 x 1.0L — Well 1 & 2 speed rail',
    'House tequila blanco (Lunazul) — 2 x 1.0L — Well 1 & 2 speed rail',
    'House mezcal (Monte Alban) — 2 x 1.0L — Well 1 & 2 speed rail',
    'House bourbon (Elijah Craig) — 2 x 1.0L — Well 1 & 2 speed rail',
    'Clarified lime juice (green cap) — 4 x 750ml — 3 day shelf life, keep cold',
    'Clarified lemon juice (yellow cap) — 4 x 750ml — 3 day shelf life, keep cold',
    'Simple syrup 1:1 (clear cap) — 2 x 750ml — 14 days',
    'Rich demerara 2:1 (brown cap) — 2 x 750ml — 30 days',
    'Mount Rigi — 1 x 750ml — side well rail',
    "Jeppson's Malört — 1 x 750ml — side well rail",
    'Licor 43 — 2 x 1.0L — side well rail',
    'Mango puree (MBTA) — 2 x 1.0L — reach-in, 7 days',
    'Strawberry puree (Flamingo Fizz) — 2 x 1.0L — reach-in, 7 days',
    'Angostura aromatic — 2 droppers — bitters caddy',
    'Angostura orange — 2 droppers — bitters caddy',
    'Dragonfruit pepper syrup — 2 x 1.0L — 21 days',
    'Cardamom honey syrup — 1 x 1.0L — 30 days',
    'Lavender sparkle syrup — 2 x 1.0L — 30 days',
    'House almond orgeat — 2 x 1.0L — allergen rail, 14 days',
    'Dehydrated lime & lemon wheels — 1 tub each (100 ct) — 30 days dry',
    '2x2 clear ice + pebbled ice — 50 cubes / full bin — shift fresh'
  ];

  var INVENTORY = [
    {
      name: "Tito's Handmade Vodka",
      category: 'Vodka',
      vendor: 'Martignetti',
      packSize: '1 L',
      location: 'Well',
      par: 14,
      onHand: 10,
      unitCost: 22.5,
      unit: 'btl'
    },
    {
      name: 'Triple Eight Vodka',
      category: 'Vodka',
      vendor: 'Cisco Brewers',
      packSize: '1 L',
      location: 'Well',
      par: 11,
      onHand: 7,
      unitCost: 22,
      unit: 'btl'
    },
    {
      name: 'Fords London Dry Gin',
      category: 'Gin',
      vendor: "Southern Glazer's",
      packSize: '1 L',
      location: 'Well',
      par: 7,
      onHand: 5,
      unitCost: 25,
      unit: 'btl'
    },
    {
      name: 'Barr Hill Gin',
      category: 'Gin',
      vendor: 'Craft Collective',
      packSize: '750 mL',
      location: 'Side well',
      par: 5,
      onHand: 3,
      unitCost: 32,
      unit: 'btl'
    },
    {
      name: 'Lunazul Blanco Tequila',
      category: 'Tequila',
      vendor: 'MS Walker',
      packSize: '1 L',
      location: 'Well',
      par: 12,
      onHand: 6,
      unitCost: 21,
      unit: 'btl'
    },
    {
      name: 'Lunazul Reposado Tequila',
      category: 'Tequila',
      vendor: 'MS Walker',
      packSize: '1 L',
      location: 'Well',
      par: 8,
      onHand: 4,
      unitCost: 22,
      unit: 'btl'
    },
    {
      name: 'Del Maguey Vida Mezcal',
      category: 'Mezcal',
      vendor: 'Martignetti',
      packSize: '1 L',
      location: 'Well',
      par: 5,
      onHand: 3,
      unitCost: 34,
      unit: 'btl'
    },
    {
      name: 'Mezcal Apaluz Joven',
      category: 'Mezcal',
      vendor: 'Burke',
      packSize: '750 mL',
      location: 'Back bar',
      par: 5,
      onHand: 3,
      unitCost: 34,
      unit: 'btl'
    },
    {
      name: 'Plantation 3 Stars White Rum',
      category: 'Rum',
      vendor: 'MS Walker',
      packSize: '1 L',
      location: 'Well',
      par: 7,
      onHand: 5,
      unitCost: 22,
      unit: 'btl'
    },
    {
      name: 'Privateer New England Reserve',
      category: 'Rum',
      vendor: 'Privateer',
      packSize: '1 L',
      location: 'Back bar',
      par: 8,
      onHand: 4,
      unitCost: 32,
      unit: 'btl'
    },
    {
      name: 'Elijah Craig Small Batch Bourbon',
      category: 'Whiskey',
      vendor: 'MS Walker',
      packSize: '1 L',
      location: 'Well',
      par: 8,
      onHand: 4,
      unitCost: 28.5,
      unit: 'btl'
    },
    {
      name: 'Licor 43',
      category: 'Liqueur',
      vendor: "Southern Glazer's",
      packSize: '1 L',
      location: 'Side well',
      par: 4,
      onHand: 2,
      unitCost: null,
      unit: 'btl'
    },
    {
      name: 'Mount Rigi Alpine Liqueur',
      category: 'Liqueur',
      vendor: 'Burke',
      packSize: '750 mL',
      location: 'Side well',
      par: 2,
      onHand: 1,
      unitCost: null,
      unit: 'btl'
    },
    {
      name: "Jeppson's Malört",
      category: 'Liqueur',
      vendor: 'Burke',
      packSize: '750 mL',
      location: 'Side well',
      par: 2,
      onHand: 1,
      unitCost: null,
      unit: 'btl'
    },
    {
      name: 'House almond orgeat',
      category: 'Syrup',
      vendor: 'In-house',
      packSize: '1 L',
      location: 'Modifier rack',
      par: 2,
      onHand: 1,
      unitCost: null,
      unit: 'btl'
    },
    {
      name: 'Clarified lime juice',
      category: 'Juice',
      vendor: 'In-house',
      packSize: '750 mL',
      location: 'Well ice rack',
      par: 4,
      onHand: 2,
      unitCost: null,
      unit: 'btl'
    }
  ];

  var VENDOR_PRODUCTS = INVENTORY.filter(function (it) {
    return it.vendor && it.vendor !== 'In-house';
  }).map(function (it) {
    return {
      name: it.name,
      packSize: it.packSize,
      sku: '',
      unitCost: it.unitCost,
      category: it.category,
      unit: it.unit,
      par: it.par,
      notes: 'Seeded from Common Craft bar program'
    };
  });

  function checklistPack() {
    var sample =
      global.ITERUM_BAR_CHECKLISTS_SAMPLE &&
      typeof global.ITERUM_BAR_CHECKLISTS_SAMPLE === 'object'
        ? JSON.parse(JSON.stringify(global.ITERUM_BAR_CHECKLISTS_SAMPLE))
        : { opening: [], midday: [], closing: [], station_stock: [] };
    sample.station_stock = STATION_STOCK.slice();
    return sample;
  }

  global.ITERUM_COMMON_CRAFT_BAR = {
    SOURCE: SOURCE,
    STANDARDS: STANDARDS,
    DRINKS: DRINKS,
    STATION_STOCK: STATION_STOCK,
    INVENTORY: INVENTORY,
    VENDOR_PRODUCTS: VENDOR_PRODUCTS,
    checklistPack: checklistPack
  };
})(typeof window !== 'undefined' ? window : globalThis);
