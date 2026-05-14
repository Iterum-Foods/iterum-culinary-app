/**
 * Bar checklist pack — Firestore read/write helpers.
 *
 * Path:  projects/{pid}/snapshots/bar_checklist_pack
 * Shape: { opening: string[], midday: string[], closing: string[], station_stock: string[], updatedAt }
 *
 * Reuses the existing `projects/{pid}/snapshots/*` rules surface — no new rules needed.
 *
 * Used by:
 *  - dashboard.html (admin "Bar checklists" card)
 *  - mobile-line-employee.js (Bar tab renders these for bartenders)
 */
(function (global) {
  'use strict';

  var PACK_DOC = 'bar_checklist_pack';
  var SECTIONS = ['opening', 'midday', 'closing', 'station_stock'];

  function emptyPack() {
    return { opening: [], midday: [], closing: [], station_stock: [] };
  }

  function normalizePack(raw) {
    var p = emptyPack();
    if (!raw || typeof raw !== 'object') {
      return p;
    }
    SECTIONS.forEach(function (k) {
      var v = raw[k];
      p[k] = Array.isArray(v)
        ? v.filter(function (x) {
            return typeof x === 'string' && x.trim();
          })
        : [];
    });
    return p;
  }

  async function loadPack(db, pid) {
    var fs = await import(
      'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
    );
    var ref = fs.doc(db, 'projects', pid, 'snapshots', PACK_DOC);
    var snap = await fs.getDoc(ref);
    if (!snap.exists()) return emptyPack();
    return normalizePack(snap.data());
  }

  async function savePack(db, pid, pack) {
    var fs = await import(
      'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
    );
    var ref = fs.doc(db, 'projects', pid, 'snapshots', PACK_DOC);
    var clean = normalizePack(pack);
    await fs.setDoc(
      ref,
      Object.assign({}, clean, { updatedAt: fs.serverTimestamp() }),
      { merge: true }
    );
    return clean;
  }

  /**
   * Replace the pack with the bundled sample. Used by the dashboard "Import sample" button.
   * Caller is expected to confirm intent because this overwrites the current pack.
   */
  async function importSample(db, pid) {
    var sample =
      typeof global.ITERUM_BAR_CHECKLISTS_SAMPLE === 'object' &&
      global.ITERUM_BAR_CHECKLISTS_SAMPLE
        ? global.ITERUM_BAR_CHECKLISTS_SAMPLE
        : null;
    if (!sample) {
      throw new Error('Bar checklist sample not loaded.');
    }
    return await savePack(db, pid, sample);
  }

  global.iterumBarChecklists = {
    PACK_DOC: PACK_DOC,
    SECTIONS: SECTIONS,
    emptyPack: emptyPack,
    normalizePack: normalizePack,
    loadPack: loadPack,
    savePack: savePack,
    importSample: importSample
  };
})(typeof window !== 'undefined' ? window : globalThis);
