/**
 * Sample SOP / how-to pack — categories + guides for pilot testing.
 * Published to Firestore: projects/{pid}/snapshots/employee_line_pack
 */
(function (global) {
  'use strict';

  var SAMPLE_SOP_CATEGORIES = [
    { id: 'opening', name: 'Opening & closing', icon: '🌅', sort: 1 },
    { id: 'kitchen', name: 'Kitchen', icon: '👨‍🍳', sort: 2 },
    { id: 'bar', name: 'Bar & beverages', icon: '🍸', sort: 3 },
    { id: 'foh', name: 'Front of house', icon: '🛎️', sort: 4 },
    { id: 'safety', name: 'Safety & compliance', icon: '🛡️', sort: 5 }
  ];

  var SAMPLE_SOP_PACK = {
    schemaVersion: '1.0',
    categories: SAMPLE_SOP_CATEGORIES,
    sops: [
      {
        id: 'sop_welcome_demo',
        categoryId: 'opening',
        title: 'Welcome — sample restaurant workspace',
        sort: 0,
        jobTags: ['all'],
        body: 'This demo restaurant includes ready-made how-to guides. Managers edit them in **SOP Hub** on the office app, then tap **Publish to Shift** so crew sees updates on the mobile **How-to** tab.\n\nUse this pack as a starting template for opening, kitchen, bar, FOH, and safety standards.'
      },
      {
        id: 'sop_opening_keys',
        categoryId: 'opening',
        title: 'Opening — keys, alarms, and lights',
        sort: 1,
        jobTags: ['operations_gm', 'location_manager', 'account_admin', 'host'],
        body: '1. Arrive 45 minutes before service.\n2. Disarm alarm; log time in opening checklist.\n3. Turn on hoods, ovens, and coffee — verify pilots.\n4. Walk dining rooms: tables set, chairs down, music at low volume.\n5. Confirm bathrooms stocked and lights on path to kitchen.'
      },
      {
        id: 'sop_closing_secure',
        categoryId: 'opening',
        title: 'Closing — secure the building',
        sort: 2,
        jobTags: [
          'operations_gm',
          'location_manager',
          'chef_leadership',
          'kitchen_manager'
        ],
        body: '1. Last guest out — lock front door.\n2. Shut down kitchen line per station checklist.\n3. Set walk-in and reach-in temps; log on compliance tab.\n4. Take trash to dumpster; hose pad if required.\n5. Arm alarm; manager signs closing checklist.'
      },
      {
        id: 'sop_line_setup',
        categoryId: 'kitchen',
        title: 'Line setup before dinner',
        sort: 1,
        jobTags: [
          'line_cook',
          'prep_cook',
          'kitchen_staff',
          'sous_chef',
          'expeditor'
        ],
        body: '1. Pull mise from walk-in using tonight’s prep list.\n2. Verify sanitizer buckets (150–200 ppm) at each station.\n3. Taste stocks and sauces — re-season if flat.\n4. Confirm 86 list with FOH and update POS.\n5. Family meal timing communicated to the team.'
      },
      {
        id: 'sop_allergy',
        categoryId: 'kitchen',
        title: 'Allergy and dietary modification',
        sort: 2,
        jobTags: ['line_cook', 'expeditor', 'chef_leadership', 'server'],
        body: '1. Server rings allergy on POS — expo reads ticket aloud.\n2. Clean board, knives, and hands before new prep.\n3. Use dedicated allergen kit if shellfish/nut protocol applies.\n4. Manager verifies plate before it leaves the pass.\n5. Note the modification in the shift log if recurring.'
      },
      {
        id: 'sop_cocktail_build',
        categoryId: 'bar',
        title: 'Cocktail build standards',
        sort: 1,
        jobTags: ['bartender', 'bar_manager'],
        body: '1. Use jigger for spec pours unless menu says build.\n2. Shake 10–12 seconds with hard shake; stir 20–30 revolutions.\n3. Taste batched cocktails at open and after 2 hours idle.\n4. Garnish per spec — no fingerprints on rim.\n5. Say the drink name when placing; confirm guest name if busy.'
      },
      {
        id: 'sop_wine_service',
        categoryId: 'bar',
        title: 'Wine service — bottle and BTG',
        sort: 2,
        jobTags: ['bartender', 'bar_manager', 'server'],
        body: '1. Present bottle label facing guest; confirm selection.\n2. Open cleanly; wipe lip; pour taste for host on bottles.\n3. BTG: 5–6 oz pour, mark bottle date when opened.\n4. Replenish ice bucket and spare glasses before peak.\n5. Log 86’d wines on team board and POS.'
      },
      {
        id: 'sop_host_standards',
        categoryId: 'foh',
        title: 'Host stand — waitlist and pacing',
        sort: 1,
        jobTags: ['host', 'front_of_house', 'operations_gm'],
        body: '1. Greet within 30 seconds; eye contact and menu in hand.\n2. Quote accurate wait times — update every 10 minutes.\n3. Pace seatings with kitchen: no more than 2 four-tops per 10 min without chef OK.\n4. VIP and allergy notes flagged to server and manager.\n5. Maintain tidy stand; menus aligned, pens working.'
      },
      {
        id: 'sop_sidework',
        categoryId: 'foh',
        title: 'Server sidework (pre-shift)',
        sort: 2,
        jobTags: ['server', 'runner', 'front_of_house'],
        body: '1. Stock service station: napkins, straws, polish ware.\n2. Review tonight’s features and 86 list.\n3. Check table numbers match floor plan.\n4. Confirm POS login and printer paper.\n5. Read team log from previous shift.'
      },
      {
        id: 'sop_handwash',
        categoryId: 'safety',
        title: 'Handwash and glove policy',
        sort: 1,
        jobTags: ['all'],
        body: 'Wash hands 20 seconds: entering kitchen, after raw protein, after trash, after bathroom, before gloves.\nGloves change between tasks — never answer phone with gloved hands.\nLog sanitizer concentration at open, mid, and close.'
      },
      {
        id: 'sop_cooldown',
        categoryId: 'safety',
        title: 'Cooling and temp danger zone',
        sort: 2,
        jobTags: ['line_cook', 'prep_cook', 'kitchen_staff', 'kitchen_manager'],
        body: 'Hot food: 135°F → 70°F within 2 hours, then 70°F → 41°F within 4 hours.\nLabel date and time on every cooled pan.\nNever stack tight in walk-in — air must circulate.\nLog walk-in temp every 4 hours on compliance tab.'
      }
    ]
  };

  global.ITERUM_SOP_SAMPLE = SAMPLE_SOP_PACK;
  global.ITERUM_SOP_CATEGORIES = SAMPLE_SOP_CATEGORIES;
})(typeof window !== 'undefined' ? window : globalThis);
