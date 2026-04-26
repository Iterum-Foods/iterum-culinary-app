/* Spec Library (Week 3): unified ingredient + vendor spec index */
(function () {
  'use strict';

  function escapeHtml(value) {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
      return [];
    }
  }

  function getIngredientSpecs() {
    const ingredients = readJson('ingredients_database');
    return (Array.isArray(ingredients) ? ingredients : [])
      .filter(ing => ing && (ing.productSpecUrl || ing.productSpecNotes))
      .map(ing => ({
        type: 'ingredient',
        name: ing.name || 'Unnamed ingredient',
        vendor: ing.supplier || ing.preferred_vendor || '—',
        specUrl: ing.productSpecUrl || '',
        specNotes: ing.productSpecNotes || '',
        updatedAt: ing.lastModified || ing.dateAdded || ''
      }));
  }

  function getVendorProductSpecs() {
    const vendors = readJson('iterum_vendors');
    const rows = [];
    (Array.isArray(vendors) ? vendors : []).forEach(vendor => {
      const products = Array.isArray(vendor?.products) ? vendor.products : [];
      products.forEach(product => {
        if (!product || (!product.specUrl && !product.specNotes)) {
          return;
        }
        rows.push({
          type: 'vendor_product',
          name: product.name || 'Unnamed product',
          vendor: vendor.name || vendor.company || 'Unknown vendor',
          specUrl: product.specUrl || '',
          specNotes: product.specNotes || '',
          updatedAt: vendor.updated_at || vendor.created_at || ''
        });
      });
    });
    return rows;
  }

  function formatDate(value) {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString();
  }

  function renderRows(rows) {
    const body = document.getElementById('spec-library-body');
    if (!body) {
      return;
    }
    if (!rows.length) {
      body.innerHTML =
        '<tr><td colspan="6" class="p-4 text-center text-slate-500">No specs found yet. Add product spec links from Ingredients or Vendor Manager.</td></tr>';
      return;
    }
    body.innerHTML = rows
      .map(
        row => `<tr class="border-b border-slate-100">
          <td class="p-3 text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(
            row.type === 'ingredient' ? 'Ingredient' : 'Vendor Item'
          )}</td>
          <td class="p-3 font-medium text-slate-800">${escapeHtml(row.name)}</td>
          <td class="p-3 text-slate-700">${escapeHtml(row.vendor)}</td>
          <td class="p-3">${
            row.specUrl
              ? `<a href="${escapeHtml(
                  row.specUrl
                )}" target="_blank" rel="noopener" class="text-blue-700 font-semibold hover:underline">Open spec</a>`
              : '<span class="text-slate-400">—</span>'
          }</td>
          <td class="p-3 text-slate-600">${escapeHtml(row.specNotes || '—')}</td>
          <td class="p-3 text-slate-500">${escapeHtml(formatDate(row.updatedAt))}</td>
        </tr>`
      )
      .join('');
  }

  function renderSummary(rows) {
    const stat = document.getElementById('spec-summary');
    if (!stat) {
      return;
    }
    const ing = rows.filter(r => r.type === 'ingredient').length;
    const prod = rows.filter(r => r.type === 'vendor_product').length;
    stat.textContent = `${rows.length} specs total (${ing} ingredient, ${prod} vendor item)`;
  }

  function applyFilter(rows) {
    const q = String(
      document.getElementById('spec-search')?.value || ''
    ).toLowerCase();
    const type = document.getElementById('spec-type-filter')?.value || 'all';
    return rows.filter(row => {
      if (type !== 'all' && row.type !== type) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        String(row.name).toLowerCase().includes(q) ||
        String(row.vendor).toLowerCase().includes(q) ||
        String(row.specNotes).toLowerCase().includes(q)
      );
    });
  }

  function initSpecLibrary() {
    const allRows = [...getIngredientSpecs(), ...getVendorProductSpecs()];
    allRows.sort((a, b) => String(a.name).localeCompare(String(b.name)));

    function redraw() {
      const filtered = applyFilter(allRows);
      renderRows(filtered);
      renderSummary(filtered);
    }

    document.getElementById('spec-search')?.addEventListener('input', redraw);
    document
      .getElementById('spec-type-filter')
      ?.addEventListener('change', redraw);
    redraw();
  }

  document.addEventListener('DOMContentLoaded', initSpecLibrary);
})();

