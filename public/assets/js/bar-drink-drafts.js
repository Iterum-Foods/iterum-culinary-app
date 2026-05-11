/**
 * Bar drink drafts — shared helpers.
 *
 * Firestore layout (single-doc snapshots; reuses existing rules surface):
 *   projects/{pid}/snapshots/bar_drink_drafts   { drinks: DrinkDraft[] }
 *   projects/{pid}/snapshots/bar_line_pack      { drinks: [{title, spec}], ... }
 *
 * A DrinkDraft has:
 *   { id, title, build[], glass, method, garnish, allergies, status,
 *     source, createdBy, createdAt, updatedAt }
 *
 * Used by:
 *  - dashboard.html ("Bar drink drafts (in progress)" card)
 *  - mobile-line-employee.js (admin quick-add form on Bar tab)
 *
 * No new rules required: writes only to projects/{pid}/snapshots/{docId}.
 */
(function (global) {
  'use strict';

  var DRAFTS_DOC = 'bar_drink_drafts';
  var PACK_DOC = 'bar_line_pack';

  function newId() {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return crypto.randomUUID();
    }
    return 'draft_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
  }

  /**
   * Render a draft to the same `{title, spec}` shape the published bar_line_pack uses.
   */
  function draftToPublished(draft) {
    var text =
      typeof global.iterumDrinkSpecToText === 'function'
        ? global.iterumDrinkSpecToText(draft)
        : '';
    return {
      title: draft.title || 'Untitled drink',
      spec: text,
      source: draft.source || '',
      garnish: draft.garnish || '',
      glass: draft.glass || '',
      method: draft.method || '',
      allergies: draft.allergies || '',
      publishedFromDraftId: draft.id || ''
    };
  }

  /**
   * Async loader for a Firestore snapshot doc that may be either drafts or pack.
   * @param {import('firebase/firestore').Firestore} db
   * @param {string} pid
   * @param {string} docId
   */
  async function loadSnapshot(db, pid, docId) {
    var fs = await import(
      'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
    );
    var ref = fs.doc(db, 'projects', pid, 'snapshots', docId);
    var snap = await fs.getDoc(ref);
    return {
      fs: fs,
      ref: ref,
      data: snap.exists() ? snap.data() || {} : {}
    };
  }

  /**
   * @param {import('firebase/firestore').Firestore} db
   * @param {string} pid
   * @returns {Promise<object[]>}
   */
  async function loadDrafts(db, pid) {
    var loaded = await loadSnapshot(db, pid, DRAFTS_DOC);
    var arr = Array.isArray(loaded.data.drinks) ? loaded.data.drinks : [];
    return arr;
  }

  async function saveDrafts(db, pid, drinks) {
    var fs = await import(
      'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
    );
    var ref = fs.doc(db, 'projects', pid, 'snapshots', DRAFTS_DOC);
    await fs.setDoc(
      ref,
      {
        drinks: drinks,
        updatedAt: fs.serverTimestamp()
      },
      { merge: true }
    );
  }

  /**
   * Add or replace a draft drink (matched by id).
   */
  async function upsertDraft(db, pid, draft, opts) {
    opts = opts || {};
    var existing = await loadDrafts(db, pid);
    var d = Object.assign({}, draft);
    if (!d.id) d.id = newId();
    if (!d.status) d.status = 'in_progress';
    if (!d.source) d.source = opts.source || '';
    if (!d.createdAt) d.createdAt = new Date().toISOString();
    d.updatedAt = new Date().toISOString();
    if (opts.createdBy && !d.createdBy) d.createdBy = opts.createdBy;
    var i = existing.findIndex(function (x) {
      return x && x.id === d.id;
    });
    if (i >= 0) {
      existing[i] = Object.assign({}, existing[i], d);
    } else {
      existing.unshift(d);
    }
    await saveDrafts(db, pid, existing);
    return d;
  }

  /**
   * Bulk replace drafts (used by "Import Wusong sample" → fresh seed).
   * Existing drafts are preserved; only drafts with `source === sampleSource`
   * are replaced so the importer is idempotent.
   */
  async function importSampleDrafts(
    db,
    pid,
    sampleDrinks,
    sampleSource,
    createdBy
  ) {
    var existing = await loadDrafts(db, pid);
    var kept = existing.filter(function (d) {
      return d && d.source !== sampleSource;
    });
    var nowIso = new Date().toISOString();
    var seeded = (sampleDrinks || []).map(function (d) {
      return Object.assign({}, d, {
        id: newId(),
        status: 'in_progress',
        source: sampleSource,
        createdBy: createdBy || '',
        createdAt: nowIso,
        updatedAt: nowIso
      });
    });
    var next = seeded.concat(kept);
    await saveDrafts(db, pid, next);
    return seeded.length;
  }

  async function deleteDraft(db, pid, draftId) {
    var existing = await loadDrafts(db, pid);
    var next = existing.filter(function (d) {
      return !d || d.id !== draftId;
    });
    await saveDrafts(db, pid, next);
  }

  /**
   * Publish a draft into bar_line_pack.drinks[] and remove from drafts.
   * Both writes are sequential; if the pack write fails we leave the draft in
   * place so the manager can retry safely.
   */
  async function publishDraft(db, pid, draftId) {
    var fs = await import(
      'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
    );
    var draftsRef = fs.doc(db, 'projects', pid, 'snapshots', DRAFTS_DOC);
    var packRef = fs.doc(db, 'projects', pid, 'snapshots', PACK_DOC);

    var draftsSnap = await fs.getDoc(draftsRef);
    var drafts = draftsSnap.exists()
      ? Array.isArray(draftsSnap.data().drinks)
        ? draftsSnap.data().drinks
        : []
      : [];
    var draft = drafts.find(function (d) {
      return d && d.id === draftId;
    });
    if (!draft) {
      throw new Error('Draft not found.');
    }

    var packSnap = await fs.getDoc(packRef);
    var packDrinks = packSnap.exists()
      ? Array.isArray(packSnap.data().drinks)
        ? packSnap.data().drinks
        : []
      : [];
    var published = draftToPublished(draft);
    var existingIdx = packDrinks.findIndex(function (p) {
      return p && p.title && p.title === published.title;
    });
    if (existingIdx >= 0) {
      packDrinks[existingIdx] = Object.assign(
        {},
        packDrinks[existingIdx],
        published
      );
    } else {
      packDrinks.push(published);
    }

    await fs.setDoc(
      packRef,
      {
        drinks: packDrinks,
        updatedAt: fs.serverTimestamp()
      },
      { merge: true }
    );

    var remaining = drafts.filter(function (d) {
      return !d || d.id !== draftId;
    });
    await fs.setDoc(
      draftsRef,
      {
        drinks: remaining,
        updatedAt: fs.serverTimestamp()
      },
      { merge: true }
    );

    return published;
  }

  global.iterumBarDrafts = {
    DRAFTS_DOC: DRAFTS_DOC,
    PACK_DOC: PACK_DOC,
    loadDrafts: loadDrafts,
    upsertDraft: upsertDraft,
    deleteDraft: deleteDraft,
    publishDraft: publishDraft,
    importSampleDrafts: importSampleDrafts,
    draftToPublished: draftToPublished,
    newId: newId
  };
})(typeof window !== 'undefined' ? window : globalThis);
