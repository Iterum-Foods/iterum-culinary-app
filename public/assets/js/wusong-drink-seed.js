/**
 * Wusong cocktail seed pack (sample).
 * Source: "Wusong Cheat Sheet - Menu Cocktails" PDF, transcribed.
 *
 * Quantities are oz unless the line ends in `dashes` (typical for bitters).
 * Allergies are kept as a free-form string to match the original sheet.
 *
 * Used by:
 *  - public/dashboard.html (admin "Import Wusong sample" button)
 *  - bar-drink-drafts.js (writes to projects/{pid}/snapshots/bar_drink_drafts)
 */
(function (global) {
  'use strict';

  /** @typedef {{ ingredient: string, amount: string, unit?: string }} BuildLine */
  /** @typedef {{ title: string, build: BuildLine[], glass: string, method: string, garnish: string, allergies: string, source: string }} DrinkSpec */

  /** @type {DrinkSpec[]} */
  var WUSONG_DRINKS = [
    {
      title: "Vic's Mai Tai",
      build: [
        { ingredient: 'Lime juice', amount: '0.75', unit: 'oz' },
        { ingredient: 'Orgeat', amount: '0.5', unit: 'oz' },
        { ingredient: 'MT batch', amount: '2.75', unit: 'oz' }
      ],
      glass: 'MT glass',
      method: 'Pebble, blend, MT glass, cubes, pebble top.',
      garnish: 'Lime wheel, mint, swizzle.',
      allergies: 'Almond.',
      source: 'Wusong menu cheat sheet'
    },
    {
      title: 'Zombie',
      build: [
        { ingredient: 'Lime juice', amount: '0.5', unit: 'oz' },
        { ingredient: 'Grapefruit', amount: '0.25', unit: 'oz' },
        { ingredient: 'Falernum', amount: '0.5', unit: 'oz' },
        { ingredient: 'Zombie batch', amount: '4.5', unit: 'oz' }
      ],
      glass: 'Zombie mug',
      method: 'Half pebble, blend, Zombie mug, top pebble.',
      garnish: 'Mint, grapefruit peel, smoking cinnamon, herbstura.',
      allergies: 'Almond, grapefruit, cinnamon.',
      source: 'Wusong menu cheat sheet'
    },
    {
      title: 'Enter the Dragon',
      build: [
        { ingredient: 'Lime juice', amount: '0.75', unit: 'oz' },
        { ingredient: 'Grapefruit', amount: '1', unit: 'oz' },
        { ingredient: 'Pina gomme', amount: '0.5', unit: 'oz' },
        { ingredient: 'BotD batch', amount: '2.5', unit: 'oz' }
      ],
      glass: 'Death whistle mug',
      method: 'Half cube, shake, death whistle mug.',
      garnish: '',
      allergies: 'Strawberry, grapefruit, cinnamon.',
      source: 'Wusong menu cheat sheet'
    },
    {
      title: 'Mango Sticky Rice Colada',
      build: [
        { ingredient: 'Lime juice', amount: '0.5', unit: 'oz' },
        { ingredient: 'Mango puree', amount: '3', unit: 'oz' },
        { ingredient: 'Sticky rice coconut', amount: '2', unit: 'oz' },
        { ingredient: 'Angostura bitters', amount: '2', unit: 'dashes' },
        { ingredient: 'Tanduay Silver', amount: '2', unit: 'oz' }
      ],
      glass: 'Radish spirit mug',
      method: 'Pebble, long blend, radish spirit mug, top pebble.',
      garnish: '',
      allergies: 'Mango, pineapple, coconut.',
      source: 'Wusong menu cheat sheet'
    },
    {
      title: 'Big Game Hunter',
      build: [
        { ingredient: 'Lime juice', amount: '0.75', unit: 'oz' },
        { ingredient: 'Pineapple juice', amount: '1', unit: 'oz' },
        { ingredient: 'Kiwi puree', amount: '1.5', unit: 'oz' },
        { ingredient: 'Orange bitters', amount: '3', unit: 'dashes' },
        { ingredient: 'BGH batch', amount: '3', unit: 'oz' }
      ],
      glass: 'Merlion mug',
      method: 'Pebble, blend, Merlion mug, cubes, leave 0.25 inch.',
      garnish: 'Pineapple frond, banana foam, kiwi salt dust.',
      allergies: 'Pineapple, kiwi, banana.',
      source: 'Wusong menu cheat sheet'
    },
    {
      title: 'Last Flight to Paradise',
      build: [
        { ingredient: 'Lemon juice', amount: '0.25', unit: 'oz' },
        { ingredient: 'Orgeat', amount: '0.75', unit: 'oz' },
        { ingredient: 'Yuzu apricot puree', amount: '1.25', unit: 'oz' },
        { ingredient: '5-spice bitters', amount: '5', unit: 'dashes' },
        { ingredient: 'PIP batch', amount: '2.5', unit: 'oz' }
      ],
      glass: 'Bora Bora mug',
      method: 'Pebble, blend, Bora Bora mug, top pebble.',
      garnish: 'Umbrella-skewered lemon wheel, shaved toasted coconut flakes.',
      allergies: 'Almond, apricot.',
      source: 'Wusong menu cheat sheet'
    },
    {
      title: 'Tiger Balm',
      build: [
        { ingredient: 'Lime juice', amount: '0.25', unit: 'oz' },
        { ingredient: 'Passionfruit syrup', amount: '0.5', unit: 'oz' },
        { ingredient: 'Wusong fassionola', amount: '3', unit: 'oz' },
        { ingredient: 'Bacardi White', amount: '2', unit: 'oz' }
      ],
      glass: 'Cat mug',
      method: 'Pebble, blend, cat mug, top pebble.',
      garnish: 'Seashell pick.',
      allergies: 'Strawberry, guava, hibiscus.',
      source: 'Wusong menu cheat sheet'
    },
    {
      title: 'Flight Risk',
      build: [
        { ingredient: 'Lime juice', amount: '0.75', unit: 'oz' },
        { ingredient: 'Mango curry puree', amount: '2', unit: 'oz' },
        { ingredient: 'Coconut cream', amount: '1.5', unit: 'oz' },
        { ingredient: 'Roku Gin', amount: '1.5', unit: 'oz' }
      ],
      glass: 'Phoenix mug',
      method: 'Pebble, blend, phoenix mug.',
      garnish: 'Firestick flower; smoking palo santo stick clipped on.',
      allergies: 'Mango, coconut.',
      source: 'Wusong menu cheat sheet'
    },
    {
      title: 'Temple Tantrum',
      build: [
        { ingredient: 'Lime juice', amount: '0.5', unit: 'oz' },
        { ingredient: 'Passionfruit syrup', amount: '0.75', unit: 'oz' },
        { ingredient: 'Temple batch', amount: '3', unit: 'oz' }
      ],
      glass: 'Takeout mug',
      method: 'Half pebble, blend, takeout mug, pebble; leave 0.25 inch.',
      garnish: 'Lime wheel, mint, small boat, powdered sugar.',
      allergies: '',
      source: 'Wusong menu cheat sheet'
    },
    {
      title: 'Cosmo Cabana',
      build: [
        { ingredient: 'Grapefruit juice', amount: '0.25', unit: 'oz' },
        { ingredient: 'Lychee pomegranate molasses', amount: '2', unit: 'oz' },
        { ingredient: 'Orange bitters', amount: '3', unit: 'dashes' },
        { ingredient: 'CC batch', amount: '0.75', unit: 'oz' },
        { ingredient: 'Haku or Roku', amount: '1.5', unit: 'oz' }
      ],
      glass: 'Panda mug',
      method: 'Half pebble, blend, panda mug, top pebble.',
      garnish: 'Grapefruit-peel-wrapped lychee, skewered Wusong pick.',
      allergies: 'Grapefruit.',
      source: 'Wusong menu cheat sheet'
    },
    {
      title: 'Forbidden Peach',
      build: [
        { ingredient: 'Lemon juice', amount: '0.75', unit: 'oz' },
        { ingredient: 'Orgeat', amount: '0.5', unit: 'oz' },
        { ingredient: 'Mala peach syrup', amount: '2.25', unit: 'oz' },
        { ingredient: 'Angostura bitters', amount: '3', unit: 'dashes' },
        { ingredient: 'Peach batch', amount: '2', unit: 'oz' }
      ],
      glass: 'Headhunter mug',
      method: 'Pebble, blend, headhunter mug, top pebble.',
      garnish: 'Mint, swizzle, lemon wheel.',
      allergies: 'Almond, peach.',
      source: 'Wusong menu cheat sheet'
    }
  ];

  /**
   * Compact pass-sheet text for bar_line_pack / Shift (short lines, no heavy bullets).
   * @param {DrinkSpec} d
   * @returns {string}
   */
  function specToText(d) {
    var parts = [];
    if (Array.isArray(d.build) && d.build.length) {
      var buildLine = d.build
        .map(function (b) {
          var amt = String(b.amount || '').trim();
          var unit = (b.unit || '').trim();
          var u = unit ? ' ' + unit : '';
          return (b.ingredient || '').trim() + ' ' + amt + u;
        })
        .join(' · ');
      parts.push(buildLine);
    }
    var gm = [];
    if (d.glass) {
      gm.push(d.glass);
    }
    if (d.method) {
      gm.push(d.method);
    }
    if (gm.length) {
      parts.push(gm.join(' — '));
    }
    if (d.garnish) {
      parts.push('Garnish: ' + d.garnish);
    }
    if (d.allergies) {
      parts.push('Allergies: ' + d.allergies);
    }
    return parts.join('\n');
  }

  global.ITERUM_WUSONG_DRINKS = WUSONG_DRINKS;
  global.iterumDrinkSpecToText = specToText;
})(typeof window !== 'undefined' ? window : globalThis);
