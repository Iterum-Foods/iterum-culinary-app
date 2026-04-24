/**
 * Vendor management — workspace / account price overrides (E3c UI).
 * Uses users/{uid}/vendor_prices via window.firestoreSync.
 */
(function () {
  'use strict';

  function escapeHtml(text) {
    if (text === null || text === undefined) {
      return '';
    }
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getFs() {
    return window.firestoreSync;
  }

  function currentProjectId() {
    const fs = getFs();
    if (fs && typeof fs.resolveProjectId === 'function') {
      return String(fs.resolveProjectId() || '').trim();
    }
    const pm = window.projectManager;
    if (
      pm &&
      pm.currentProject &&
      pm.currentProject.id !== undefined &&
      pm.currentProject.id !== null
    ) {
      return String(pm.currentProject.id).trim();
    }
    return '';
  }

  function currentProjectName() {
    const pm = window.projectManager;
    const p = pm && pm.currentProject;
    if (p && p.name) {
      return String(p.name);
    }
    return '';
  }

  function vendorDocIdForVendor(v) {
    const fs = getFs();
    if (fs && typeof fs.vendorFirestoreDocId === 'function') {
      return fs.vendorFirestoreDocId(v);
    }
    if (v && v.iterumVendorDocId) {
      return String(v.iterumVendorDocId);
    }
    return v &&
      v.id !== undefined &&
      v.id !== null &&
      String(v.id).trim() !== ''
      ? String(v.id)
      : '';
  }

  function filterRowsForDisplay(rows, activePid) {
    const list = Array.isArray(rows) ? rows : [];
    return list.filter(r => {
      if (!r || typeof r !== 'object') {
        return false;
      }
      const rpid =
        r.projectId !== undefined &&
        r.projectId !== null &&
        String(r.projectId).trim() !== ''
          ? String(r.projectId).trim()
          : null;
      if (!activePid) {
        return true;
      }
      return rpid === activePid || rpid === null;
    });
  }

  function buildVendorOptions() {
    const vendors =
      window.vendorManager && Array.isArray(window.vendorManager.vendors)
        ? window.vendorManager.vendors
        : [];
    const opts = ['<option value="">— Optional: pick vendor —</option>'];
    for (const v of vendors) {
      if (!v || typeof v !== 'object') {
        continue;
      }
      const id = vendorDocIdForVendor(v);
      const label = v.name || v.company || id || 'Vendor';
      opts.push(
        `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`
      );
    }
    return opts.join('');
  }

  function redraw(mount) {
    const fs = getFs();
    const pid = currentProjectId();
    const pname = currentProjectName() || '(select a workspace in the sidebar)';
    const ready = !!(fs && fs.initialized);
    const rows = ready
      ? filterRowsForDisplay(fs.vendorPriceRows || [], pid)
      : [];
    const vendorOpts = buildVendorOptions();

    const rowsHtml =
      rows.length === 0
        ? `<tr><td colspan="6" class="py-4 text-slate-500">No overrides yet for this filter. Add one below — recipe costing matches <strong>ingredient name</strong> (or SKU) when present.</td></tr>`
        : rows
            .map(r => {
              const rpid =
                r.projectId !== undefined &&
                r.projectId !== null &&
                String(r.projectId).trim() !== ''
                  ? String(r.projectId)
                  : '';
              const scopeLabel = rpid ? 'This workspace' : 'All workspaces';
              const docId = escapeHtml(
                String(r.iterumVendorPriceDocId || '').trim()
              );
              return `<tr>
              <td class="py-2 pr-2">${escapeHtml(r.ingredientName || '—')}</td>
              <td class="py-2 pr-2">${escapeHtml(r.sku || '—')}</td>
              <td class="py-2 pr-2">${escapeHtml(r.vendorName || '—')}</td>
              <td class="py-2 pr-2">${escapeHtml(String(r.unitCost ?? ''))} / ${escapeHtml(String(r.unit || 'ea'))}</td>
              <td class="py-2 pr-2 text-xs">${escapeHtml(scopeLabel)}</td>
              <td class="py-2 pr-2"><button type="button" class="vp-del-btn text-red-600 font-medium hover:underline" data-vp-doc="${docId}">Remove</button></td>
            </tr>`;
            })
            .join('');

    mount.innerHTML = `
      <div class="vp-panel text-sm text-slate-800">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p class="text-slate-600">
            <span class="font-semibold text-slate-800">Active workspace:</span>
            ${escapeHtml(pname)}
            ${pid ? `<code class="ml-1 text-xs bg-slate-100 px-1.5 py-0.5 rounded">${escapeHtml(pid)}</code>` : '<span class="text-amber-700 ml-1">(no project id — overrides will use account default)</span>'}
          </p>
          <button type="button" id="vp-refresh-btn" class="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50">Refresh from cloud</button>
        </div>
        <p id="vp-status" class="text-sm mb-3 min-h-[1.25rem]" role="status">${ready ? '' : 'Waiting for cloud sync…'}</p>
        <form id="vp-form" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div class="sm:col-span-2 lg:col-span-1">
            <label class="block text-xs font-semibold text-slate-600 mb-1" for="vp-ing">Ingredient name *</label>
            <input id="vp-ing" required class="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="e.g. Heavy cream" autocomplete="off" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1" for="vp-sku">SKU (optional)</label>
            <input id="vp-sku" class="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Vendor SKU" autocomplete="off" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1" for="vp-cost">Unit cost *</label>
            <input id="vp-cost" type="number" step="0.0001" min="0" required class="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="0.00" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1" for="vp-unit">Unit</label>
            <select id="vp-unit" class="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="ea">ea</option>
              <option value="lb">lb</option>
              <option value="oz">oz</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="L">L</option>
              <option value="gal">gal</option>
              <option value="qt">qt</option>
              <option value="case">case</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1" for="vp-vendor">Vendor</label>
            <select id="vp-vendor" class="w-full rounded-lg border border-slate-300 px-3 py-2">${vendorOpts}</select>
          </div>
          <div class="sm:col-span-2">
            <span class="block text-xs font-semibold text-slate-600 mb-1">Applies to</span>
            <label class="inline-flex items-center gap-2 mr-4"><input type="radio" name="vp-scope" value="workspace" checked /> This workspace only</label>
            <label class="inline-flex items-center gap-2"><input type="radio" name="vp-scope" value="account" /> All my workspaces (default)</label>
          </div>
          <div class="sm:col-span-2 lg:col-span-3 flex flex-wrap gap-2">
            <button type="submit" class="px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800">Save override</button>
          </div>
        </form>
        <div class="overflow-x-auto border border-slate-200 rounded-xl">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-100 text-slate-700">
              <tr>
                <th class="py-2 px-3 font-semibold">Ingredient</th>
                <th class="py-2 px-3 font-semibold">SKU</th>
                <th class="py-2 px-3 font-semibold">Vendor</th>
                <th class="py-2 px-3 font-semibold">Cost</th>
                <th class="py-2 px-3 font-semibold">Scope</th>
                <th class="py-2 px-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">${rowsHtml}</tbody>
          </table>
        </div>
      </div>`;

    const statusEl = mount.querySelector('#vp-status');
    const form = mount.querySelector('#vp-form');

    mount.querySelector('#vp-refresh-btn').addEventListener('click', () => {
      loadAndRedraw(mount);
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const f = getFs();
      if (!f || !f.initialized) {
        statusEl.textContent =
          'Cloud sync is not ready. Sign in and try Refresh.';
        return;
      }
      const ing = mount.querySelector('#vp-ing').value.trim();
      const sku = mount.querySelector('#vp-sku').value.trim();
      const cost = parseFloat(mount.querySelector('#vp-cost').value);
      const unit = mount.querySelector('#vp-unit').value || 'ea';
      const scope = (
        mount.querySelector('input[name="vp-scope"]:checked') || {}
      ).value;
      const vid = mount.querySelector('#vp-vendor').value.trim();
      let vendorName = null;
      if (
        vid &&
        window.vendorManager &&
        Array.isArray(window.vendorManager.vendors)
      ) {
        const match = window.vendorManager.vendors.find(
          v => vendorDocIdForVendor(v) === vid
        );
        if (match && match.name) {
          vendorName = match.name;
        }
      }
      const projectId =
        scope === 'workspace' && currentProjectId() ? currentProjectId() : null;
      if (scope === 'workspace' && !currentProjectId()) {
        statusEl.textContent =
          'Select a workspace in the sidebar before saving a workspace-only override.';
        return;
      }
      if (!ing || Number.isNaN(cost)) {
        statusEl.textContent = 'Ingredient name and unit cost are required.';
        return;
      }
      statusEl.textContent = 'Saving…';
      const row = {
        vendorDocId: vid || null,
        projectId,
        ingredientName: ing,
        sku: sku || null,
        unitCost: cost,
        unit,
        vendorName
      };
      const res = await f.syncVendorPriceRowToFirestore(row);
      if (res && res.ok) {
        statusEl.textContent =
          'Saved. Recipe costing will pick this up for the active workspace.';
        form.reset();
        mount.querySelector('#vp-unit').value = 'ea';
        mount.querySelector(
          'input[name="vp-scope"][value="workspace"]'
        ).checked = true;
        await f.refreshVendorPricesFromFirestore();
        redraw(mount);
      } else {
        statusEl.textContent =
          'Save failed: ' + (res && res.reason ? res.reason : 'unknown');
      }
    });

    mount.querySelectorAll('.vp-del-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const docId = btn.getAttribute('data-vp-doc');
        if (!docId || !getFs() || !getFs().initialized) {
          return;
        }
        if (!window.confirm('Remove this price override?')) {
          return;
        }
        statusEl.textContent = 'Removing…';
        const res = await getFs().deleteVendorPriceFromFirestore(docId);
        if (res && res.ok) {
          statusEl.textContent = 'Removed.';
          redraw(mount);
        } else {
          statusEl.textContent =
            'Remove failed: ' + (res && res.reason ? res.reason : 'unknown');
        }
      });
    });
  }

  async function loadAndRedraw(mount) {
    const fs = getFs();
    if (fs && fs.initialized) {
      try {
        await fs.refreshVendorPricesFromFirestore();
      } catch (e) {
        /* ignore */
      }
    }
    redraw(mount);
    const statusEl = mount.querySelector('#vp-status');
    if (statusEl && fs && fs.initialized) {
      statusEl.textContent = '';
    }
  }

  async function waitInitAndRedraw(mount) {
    for (let i = 0; i < 60; i++) {
      if (getFs() && getFs().initialized) {
        await loadAndRedraw(mount);
        return;
      }
      await new Promise(r => setTimeout(r, 250));
    }
    redraw(mount);
  }

  window.initVendorPriceOverridesPanel =
    function initVendorPriceOverridesPanel() {
      const mount = document.getElementById(
        'vendor-price-overrides-panel-root'
      );
      if (!mount || mount.dataset.vpBound === '1') {
        return;
      }
      mount.dataset.vpBound = '1';
      waitInitAndRedraw(mount);
      [1500, 3500].forEach(ms => {
        setTimeout(() => {
          if (mount.isConnected) {
            redraw(mount);
          }
        }, ms);
      });
      document.addEventListener('projectChanged', () => {
        waitInitAndRedraw(mount);
      });
      document.addEventListener('firestoreSyncReady', () => {
        waitInitAndRedraw(mount);
      });
    };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('vendor-price-overrides-panel-root')) {
      window.initVendorPriceOverridesPanel();
    }
  });
})();
