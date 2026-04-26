/* Week 4: exception engine (missing spec, stale price, failed opening checks) */
(function () {
  'use strict';

  const STALE_DAYS = 14;

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
      return [];
    }
  }

  function parseDate(value) {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function daysSince(value) {
    const date = parseDate(value);
    if (!date) {
      return Number.POSITIVE_INFINITY;
    }
    const diff = Date.now() - date.getTime();
    return Math.floor(diff / 86400000);
  }

  function computeMissingSpecAlerts() {
    const ingredients = readJson('ingredients_database');
    const alerts = [];
    const seen = new Set();
    (Array.isArray(ingredients) ? ingredients : []).forEach(ing => {
      if (!ing || ing.isVariant) {
        return;
      }
      const hasSpec = Boolean(ing.productSpecUrl || ing.productSpecNotes);
      if (!hasSpec) {
        const key = String(ing.name || '').toLowerCase().trim();
        if (seen.has(key)) {
          return;
        }
        seen.add(key);
        alerts.push({
          type: 'missing_spec',
          severity: 'medium',
          message: `Missing product spec for ingredient: ${
            ing.name || 'Unnamed ingredient'
          }`,
          actionHref: 'spec-library.html#missing-specs',
          actionLabel: 'Add spec now'
        });
      }
    });
    return alerts;
  }

  function computeStalePriceAlerts() {
    const ingredients = readJson('ingredients_database');
    const alerts = [];
    const seen = new Set();
    (Array.isArray(ingredients) ? ingredients : []).forEach(ing => {
      if (!ing || ing.isVariant) {
        return;
      }
      const stamp =
        ing.casePricing?.lastUpdated ||
        ing.lastModified ||
        ing.dateAdded ||
        null;
      const age = daysSince(stamp);
      if (age > STALE_DAYS) {
        const key = String(ing.name || '').toLowerCase().trim();
        if (seen.has(key)) {
          return;
        }
        seen.add(key);
        alerts.push({
          type: 'stale_price',
          severity: 'high',
          message: `Price is stale (${age}d): ${
            ing.name || 'Unnamed ingredient'
          }`,
          actionHref: 'ingredients.html#stale-pricing',
          actionLabel: 'Refresh price'
        });
      }
    });
    return alerts;
  }

  function computeFailedOpeningAlerts() {
    if (!window.checklistManager) {
      return [];
    }
    const entries = window.checklistManager.getEntries() || [];
    return entries
      .filter(
        entry =>
          entry.templateId === 'opening_line_check' &&
          (entry.requiresAttention || entry.status === 'attention')
      )
      .slice(0, 8)
      .map(entry => ({
        type: 'failed_opening_check',
        severity: 'critical',
        message: `Opening checklist failed: ${
          entry.data?.station || 'station not set'
        }`,
        actionHref: 'dashboard.html#checklist-opening',
        actionLabel: 'Resolve checklist'
      }));
  }

  function computeExceptions() {
    const rows = [
      ...computeMissingSpecAlerts(),
      ...computeStalePriceAlerts(),
      ...computeFailedOpeningAlerts()
    ];
    const bySeverity = {
      critical: rows.filter(r => r.severity === 'critical').length,
      high: rows.filter(r => r.severity === 'high').length,
      medium: rows.filter(r => r.severity === 'medium').length
    };
    return { rows, bySeverity };
  }

  function renderExceptions() {
    const mount = document.getElementById('ops-exception-panel');
    if (!mount) {
      return;
    }
    const model = computeExceptions();
    const header = `<div class="text-xs text-slate-500 mb-2">Critical ${model.bySeverity.critical} • High ${model.bySeverity.high} • Medium ${model.bySeverity.medium}</div>`;
    if (!model.rows.length) {
      mount.innerHTML = `${header}<div class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">No active exceptions.</div>`;
      return;
    }
    mount.innerHTML = `${header}<ul class="space-y-2 max-h-72 overflow-y-auto pr-1">${model.rows
      .slice(0, 12)
      .map(
        row =>
          `<li class="text-sm rounded-lg border px-3 py-2 ${
            row.severity === 'critical'
              ? 'border-red-200 bg-red-50 text-red-700'
              : row.severity === 'high'
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-sky-200 bg-sky-50 text-sky-800'
          }">${row.message}${
            row.actionHref
              ? ` <a href="${row.actionHref}" class="underline font-semibold ml-1">${row.actionLabel || 'Review'}</a>`
              : ''
          }</li>`
      )
      .join('')}</ul>`;
  }

  function initOpsExceptions() {
    renderExceptions();
    window.addEventListener('storage', renderExceptions);
    document.addEventListener('projectChanged', renderExceptions);
    if (window.checklistManager?.on) {
      window.checklistManager.on('entryAdded', renderExceptions);
      window.checklistManager.on('entriesLoaded', renderExceptions);
    }
    setInterval(renderExceptions, 30000);
  }

  document.addEventListener('DOMContentLoaded', initOpsExceptions);
})();

