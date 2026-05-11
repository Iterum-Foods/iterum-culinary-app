/**
 * ID quick reference card — for servers and bartenders on the phone app.
 *
 * Computes the "must be born on or before" cutoff for 21+ and 18+ using the
 * device's local date. Recomputed every time the renderer runs, so the card
 * stays correct after midnight as soon as the user re-opens the tab.
 *
 * Public API (on `window.iterumIdQuickReference`):
 *   .computeDates(refDate?)   -> { today, twentyOne, eighteen }
 *   .formatDate(d, opts?)     -> "Mon, May 11, 2026"
 *   .render(targetEl)         -> writes the card HTML into targetEl
 */
(function (global) {
  'use strict';

  /**
   * Subtract `years` whole calendar years from `from` (a Date), clamping
   * Feb 29 → Feb 28 of the destination year so anyone born on the displayed
   * cutoff date IS truly age `years` today (no leap-day off-by-one bug).
   */
  function subtractYears(from, years) {
    var y = from.getFullYear() - years;
    var m = from.getMonth();
    var d = from.getDate();
    var out = new Date(y, m, d);
    if (out.getMonth() !== m) {
      // JS normalized Feb 29 of a non-leap year to Mar 1; back off to Feb 28.
      out.setDate(0);
    }
    return out;
  }

  function computeDates(refDate) {
    var t =
      refDate instanceof Date && !Number.isNaN(refDate.getTime())
        ? new Date(refDate.getTime())
        : new Date();
    var today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    return {
      today: today,
      twentyOne: subtractYears(today, 21),
      eighteen: subtractYears(today, 18)
    };
  }

  function formatDate(d, opts) {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
    var options = opts || {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    try {
      return d.toLocaleDateString(undefined, options);
    } catch (e) {
      return d.toDateString();
    }
  }

  function render(target) {
    var el =
      typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return null;
    var dates = computeDates();
    var todayStr = formatDate(dates.today);
    var d21 = formatDate(dates.twentyOne);
    var d18 = formatDate(dates.eighteen);
    el.innerHTML =
      '<div class="mc-id-card-head">' +
      '<strong>ID quick reference</strong>' +
      '<span class="mc-hint">' +
      todayStr +
      '</span>' +
      '</div>' +
      '<div class="mc-id-card-rows">' +
      '<div class="mc-id-card-row">' +
      '<span class="mc-id-card-tag mc-id-card-tag-21">21+</span>' +
      '<span class="mc-id-card-label">Born on or before</span>' +
      '<strong class="mc-id-card-date">' +
      d21 +
      '</strong>' +
      '</div>' +
      '<div class="mc-id-card-row">' +
      '<span class="mc-id-card-tag">18+</span>' +
      '<span class="mc-id-card-label">Born on or before</span>' +
      '<strong class="mc-id-card-date">' +
      d18 +
      '</strong>' +
      '</div>' +
      '</div>' +
      '<p class="mc-hint mc-id-card-foot">' +
      'Verify against a valid government-issued ID. Anyone born on or before the listed date is at least that age today.' +
      '</p>';
    el.hidden = false;
    return dates;
  }

  global.iterumIdQuickReference = {
    computeDates: computeDates,
    formatDate: formatDate,
    render: render
  };
})(typeof window !== 'undefined' ? window : globalThis);
