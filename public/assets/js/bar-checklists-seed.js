/**
 * Sample bar checklists — generic starter content for a cocktail bar.
 * Managers can import this once, then edit per location.
 *
 * Pack shape (also used at Firestore `projects/{pid}/snapshots/bar_checklist_pack`):
 *   { opening: string[], midday: string[], closing: string[], station_stock: string[] }
 */
(function (global) {
  'use strict';

  /** @type {{opening: string[], midday: string[], closing: string[], station_stock: string[]}} */
  var SAMPLE_BAR_CHECKLISTS = {
    opening: [
      'Wipe down bar top, back bar, speed rails, and POS stations',
      'Empty and rinse fruit fly traps, replace traps where used',
      'Check ice machine — clear bin, refill ice wells (front + service)',
      'Cut citrus garnish (lemons, limes, oranges) — date container',
      'Pull batch cocktails from walk-in, label and stage at the well',
      'Stock juices (lime, lemon, grapefruit, pineapple) to par',
      'Verify all syrups (orgeat, falernum, passionfruit, fassionola, peach) dated and within shelf life',
      'Check beer kegs and CO2 — replace empties, log',
      'Run sanitizer test (target 150–200 ppm) and log on compliance tab',
      'Wipe glassware spot-check — pull any chipped glass',
      'Test POS / printer / receipt paper',
      'Read team log notes from previous shift'
    ],
    midday: [
      'Refresh garnish trays (citrus, picks, herbs) — pull anything wilted',
      'Top off juices, syrups, and well bottles to par',
      'Empty bar trash + glass recycling',
      'Wipe pour spouts; replace any stuck or sticky',
      'Walk bar floor: spills, broken glass, wet mats',
      'Re-test sanitizer; refresh if below 150 ppm',
      'Check ice well; refill from machine before service push',
      'Review 86 list and update guests/servers/POS'
    ],
    closing: [
      'Strain and store batches; date and label in walk-in',
      'Pull and refrigerate citrus + perishable garnish',
      'Drain ice wells; clean and sanitize',
      'Wash, dry, and reset all glassware to correct rail positions',
      'Wipe down speed rails, well, back bar, soda guns',
      'Empty and rinse fruit fly traps',
      'Take inventory of liquors at 86 or near-empty — leave list for purchasing',
      'Run closing POS reports; reconcile cash drawer with manager',
      'Empty trash + recycling; mop bar floor (back-of-bar last)',
      'Lock back bar storage; secure register; confirm doors / coolers',
      'Log shift notes for the next opener on the team log'
    ],
    station_stock: [
      'Lime juice — par 1 quart',
      'Lemon juice — par 1 quart',
      'Grapefruit juice — par 1 quart',
      'Pineapple juice — par 1 quart',
      'Orgeat — par 750 ml',
      'Falernum — par 750 ml',
      'Passionfruit syrup — par 750 ml',
      'Wusong fassionola — par 750 ml',
      'Mala peach syrup — par 750 ml',
      'Pina gomme — par 750 ml',
      'Lychee pomegranate molasses — par 750 ml',
      'Angostura bitters — par 1 bottle',
      'Orange bitters — par 1 bottle',
      '5-spice bitters — par 1 bottle',
      'Soda guns (water, soda, tonic, ginger) — primed',
      'Glassware: rocks (24), coupe (24), highball (24), mugs (per service)',
      'Garnish: lime wheels, mint, grapefruit peels, picks, umbrellas'
    ]
  };

  /**
   * Trim and de-duplicate raw lines pasted into the dashboard textarea.
   * @param {string|string[]} raw
   * @returns {string[]}
   */
  function normalizeChecklistItems(raw) {
    var lines = Array.isArray(raw)
      ? raw
      : String(raw == null ? '' : raw).split(/\r?\n/);
    var out = [];
    var seen = Object.create(null);
    for (var i = 0; i < lines.length; i++) {
      var t = String(lines[i] || '')
        .replace(/^[-•\s]+/, '')
        .trim();
      if (!t) continue;
      if (seen[t]) continue;
      seen[t] = true;
      out.push(t);
    }
    return out;
  }

  global.ITERUM_BAR_CHECKLISTS_SAMPLE = SAMPLE_BAR_CHECKLISTS;
  global.iterumBarChecklistNormalize = normalizeChecklistItems;
})(typeof window !== 'undefined' ? window : globalThis);
