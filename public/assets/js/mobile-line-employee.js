/**
 * Team mobile hub — daily ops for all workspace roles: published menu, personal notes/lists,
 * project checklists, SOP pack. Same Firestore paths as the web app; requires project membership.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const SNAPSHOT_SOP_DOC = 'employee_line_pack';
const SNAPSHOT_BAR_DOC = 'bar_line_pack';

/** @typedef {{ getDb: () => import('firebase/firestore').Firestore | null, getAuth: () => import('firebase/auth').Auth | null, getProjectId: () => string, setStatus: (msg: string, isErr?: boolean) => void, escapeHtml: (s: unknown) => string }} LineHubApi */

/**
 * @param {LineHubApi} api
 */
export function attachLineEmployeeHub(api) {
  const { getDb, getAuth, getProjectId, setStatus, escapeHtml } = api;

  const sections = [
    'hub',
    'menu',
    'notes',
    'lists',
    'checks',
    'sops',
    'bar',
    'team',
    'temps'
  ];

  /** @type {null | (() => void)} */
  let teamBoardUnsub = null;

  function localDateKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function showSection(key) {
    const gate =
      typeof window.__iterumShiftWorkspaceReady === 'function'
        ? window.__iterumShiftWorkspaceReady()
        : true;
    if (!gate && key !== 'temps' && key !== 'hub') {
      setStatus(
        'Choose a team location or create a personal workspace above first.'
      );
      return;
    }
    sections.forEach(s => {
      const el = document.getElementById(`panel-section-${s}`);
      if (el) el.hidden = s !== key;
    });
    document.querySelectorAll('[data-hub-tab]').forEach(btn => {
      const k = btn.getAttribute('data-hub-tab');
      const on = k === key;
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (key !== 'team') {
      if (typeof teamBoardUnsub === 'function') {
        try {
          teamBoardUnsub();
        } catch (e) {
          /* ignore */
        }
        teamBoardUnsub = null;
      }
    }
    if (key === 'team') {
      ensureTeamBoardDateInput();
      attachTeamBoardListener();
    }
    if (key === 'temps' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lineShowTemps'));
    }
  }

  function pid() {
    const p = getProjectId();
    return p && p !== '' ? p : '';
  }

  function teamProjectSelected() {
    const v = pid();
    return v !== '' && v !== 'mobile-default';
  }

  async function loadPublishedMenu() {
    const db = getDb();
    const body = document.getElementById('menu-published-body');
    if (!db || !body) return;
    if (!teamProjectSelected()) {
      body.innerHTML =
        '<p class="mc-empty">Pick your <strong>location</strong> above to see today’s menu.</p>';
      return;
    }
    body.innerHTML = '<p class="mc-hint">Loading menu…</p>';
    try {
      const projectRef = doc(db, 'projects', pid());
      let menuSnap = await getDoc(
        doc(collection(projectRef, 'menus'), 'primary')
      );
      if (!menuSnap.exists()) {
        const menusCol = collection(projectRef, 'menus');
        const mq = query(menusCol, limit(5));
        const list = await getDocs(mq);
        if (!list.empty) {
          menuSnap = list.docs[0];
        }
      }
      if (!menuSnap.exists()) {
        body.innerHTML =
          '<p class="mc-empty">No menu here yet. Ask a manager to publish it from the office app.</p>';
        return;
      }
      const data = menuSnap.data();
      const items = Array.isArray(data.items) ? data.items : [];
      const menuName =
        (data.menu && data.menu.name) || data.name || 'Published menu';
      if (!items.length) {
        body.innerHTML = `<p><strong>${escapeHtml(menuName)}</strong></p><p class="mc-empty">No items in this snapshot.</p>`;
        return;
      }
      const rows = items
        .map(it => {
          const name = it.name || it.title || it.itemName || it.label || 'Item';
          const price = it.price != null ? String(it.price) : '';
          const cat = it.category || it.section || '';
          return `<li class="mc-card"><strong>${escapeHtml(name)}</strong>${cat ? `<div class="mc-hint">${escapeHtml(cat)}</div>` : ''}${price ? `<div class="mc-hint">${escapeHtml(price)}</div>` : ''}</li>`;
        })
        .join('');
      body.innerHTML = `<p style="margin:0 0 0.5rem;font-weight:700;">${escapeHtml(menuName)}</p><ul class="mc-list">${rows}</ul>`;
    } catch (e) {
      console.error(e);
      body.innerHTML =
        '<p class="mc-empty">Can’t load the menu. Check your location above, or ask a manager if you’re on the team.</p>';
    }
  }

  async function loadMyNotes() {
    const db = getDb();
    const uid = getAuth()?.currentUser?.uid;
    const listEl = document.getElementById('notes-my-list');
    if (!db || !uid || !listEl) return;
    listEl.innerHTML = '<p class="mc-hint">Loading…</p>';
    try {
      const ref = collection(db, 'users', uid, 'notes');
      const snap = await getDocs(query(ref, limit(80)));
      const project = pid();
      const rows = [];
      snap.forEach(d => {
        const x = d.data();
        if (
          x.lineAppType !== 'menu_note' &&
          x.lineAppType !== 'ingredient_note'
        ) {
          return;
        }
        if (project && x.projectId && x.projectId !== project) {
          return;
        }
        rows.push({ id: d.id, ...x });
      });
      const sec = t =>
        typeof t?.seconds === 'number'
          ? t.seconds
          : typeof t?._seconds === 'number'
            ? t._seconds
            : 0;
      rows.sort((a, b) => {
        const d = sec(b.updatedAt) - sec(a.updatedAt);
        if (d !== 0) return d;
        return String(b.title || '').localeCompare(String(a.title || ''));
      });
      if (!rows.length) {
        listEl.innerHTML =
          '<p class="mc-empty">No notes yet. Add one above.</p>';
        return;
      }
      listEl.innerHTML = rows
        .slice(0, 40)
        .map(
          r =>
            `<li class="mc-card"><span class="mc-hint">${escapeHtml(r.lineAppType === 'menu_note' ? 'Menu' : 'Ingredient')}</span><strong>${escapeHtml(r.title || 'Note')}</strong><div style="margin-top:0.35rem;white-space:pre-wrap;font-size:0.9rem;">${escapeHtml(r.body || '')}</div></li>`
        )
        .join('');
    } catch (e) {
      console.error(e);
      listEl.innerHTML = '<p class="mc-empty">Could not load notes.</p>';
    }
  }

  async function saveNoteFromForm() {
    const db = getDb();
    const uid = getAuth()?.currentUser?.uid;
    if (!db || !uid) {
      setStatus('Sign in to save notes.', true);
      return;
    }
    const typeSel = document.getElementById('note-type');
    const titleEl = document.getElementById('note-title');
    const bodyEl = document.getElementById('note-body');
    const type =
      typeSel?.value === 'ingredient_note' ? 'ingredient_note' : 'menu_note';
    const title = (titleEl?.value || '').trim();
    const body = (bodyEl?.value || '').trim();
    if (!body) {
      setStatus('Add note text before saving.', true);
      return;
    }
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `n_${Date.now()}`;
    try {
      await setDoc(
        doc(db, 'users', uid, 'notes', id),
        {
          lineAppType: type,
          title:
            title || (type === 'menu_note' ? 'Menu note' : 'Ingredient note'),
          body,
          projectId: teamProjectSelected() ? pid() : null,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      if (titleEl) titleEl.value = '';
      if (bodyEl) bodyEl.value = '';
      setStatus('Note saved to your account.');
      await loadMyNotes();
    } catch (e) {
      console.error(e);
      setStatus('Could not save note.', true);
    }
  }

  async function loadPrepStock() {
    const db = getDb();
    const uid = getAuth()?.currentUser?.uid;
    const prepEl = document.getElementById('prep-list-body');
    const stockEl = document.getElementById('stock-list-body');
    if (!db || !uid) return;
    try {
      const ref = collection(db, 'users', uid, 'notes');
      const snap = await getDocs(query(ref, limit(100)));
      const project = pid();
      const ts = x =>
        typeof x?.updatedAt?.seconds === 'number'
          ? x.updatedAt.seconds
          : typeof x?.updatedAt?._seconds === 'number'
            ? x.updatedAt._seconds
            : 0;
      const latestBody = type => {
        let best = '';
        let bestT = -1;
        snap.forEach(d => {
          const x = d.data();
          if (x.lineAppType !== type) return;
          if (project && x.projectId && x.projectId !== project) {
            return;
          }
          const t = ts(x);
          if (t >= bestT) {
            bestT = t;
            best = x.body || '';
          }
        });
        return best;
      };
      if (prepEl) prepEl.value = latestBody('prep_list');
      if (stockEl) stockEl.value = latestBody('stock_list');
    } catch (e) {
      console.error(e);
    }
  }

  async function savePrepStock(which) {
    const db = getDb();
    const uid = getAuth()?.currentUser?.uid;
    if (!db || !uid) {
      setStatus('Sign in to save.', true);
      return;
    }
    const type = which === 'stock' ? 'stock_list' : 'prep_list';
    const ta =
      which === 'stock'
        ? document.getElementById('stock-list-body')
        : document.getElementById('prep-list-body');
    const body = (ta?.value || '').trim();
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${which}_${Date.now()}`;
    try {
      await setDoc(
        doc(db, 'users', uid, 'notes', id),
        {
          lineAppType: type,
          title: which === 'stock' ? 'Stock list' : 'Prep list',
          body,
          projectId: teamProjectSelected() ? pid() : null,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      setStatus(which === 'stock' ? 'Stock list saved.' : 'Prep list saved.');
    } catch (e) {
      console.error(e);
      setStatus('Could not save list.', true);
    }
  }

  async function loadStationChecks() {
    const db = getDb();
    const body = document.getElementById('checks-project-list');
    if (!db || !body) return;
    if (!teamProjectSelected()) {
      body.innerHTML =
        '<p class="mc-empty">Pick your <strong>location</strong> above to see team checks.</p>';
      return;
    }
    body.innerHTML = '<p class="mc-hint">Loading…</p>';
    try {
      const ref = collection(db, 'projects', pid(), 'checklists');
      let snap;
      try {
        snap = await getDocs(
          query(ref, orderBy('timestamp', 'desc'), limit(40))
        );
      } catch {
        snap = await getDocs(query(ref, limit(40)));
      }
      if (snap.empty) {
        body.innerHTML =
          '<p class="mc-empty">No checklist entries yet. Submit a quick check below.</p>';
        return;
      }
      const parts = [];
      snap.forEach(d => {
        const x = d.data();
        const title = x.templateName || x.templateId || 'Check';
        const ts = x.timestamp || x.createdAt || '';
        let detail = '';
        const raw = x.data;
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          const st = raw.station != null ? String(raw.station) : '';
          const n = raw.notes != null ? String(raw.notes) : '';
          if (st || n) {
            detail = st
              ? `<div style="font-size:0.9rem;margin-top:0.35rem;"><strong>${escapeHtml(st)}</strong>${n ? `<div class="mc-hint" style="margin-top:0.25rem;white-space:pre-wrap;">${escapeHtml(n)}</div>` : ''}</div>`
              : '';
          }
        }
        if (!detail && raw != null) {
          detail =
            typeof raw === 'object'
              ? `<div class="mc-hint" style="margin-top:0.35rem;font-size:0.8rem;">${escapeHtml(JSON.stringify(raw).slice(0, 160))}</div>`
              : `<div class="mc-hint" style="margin-top:0.35rem;">${escapeHtml(String(raw).slice(0, 200))}</div>`;
        }
        parts.push(
          `<li class="mc-card"><strong>${escapeHtml(title)}</strong><div class="mc-hint">${escapeHtml(String(ts))}</div>${detail}</li>`
        );
      });
      body.innerHTML = `<ul class="mc-list">${parts.join('')}</ul>`;
    } catch (e) {
      console.error(e);
      body.innerHTML =
        '<p class="mc-empty">Could not load checklists. Check team access.</p>';
    }
  }

  async function submitQuickCheck() {
    const db = getDb();
    const uid = getAuth()?.currentUser?.uid;
    if (!db || !uid) {
      setStatus('Sign in first.', true);
      return;
    }
    if (!teamProjectSelected()) {
      setStatus('Pick a team workspace first.', true);
      return;
    }
    const station = (
      document.getElementById('check-station')?.value || ''
    ).trim();
    const notes = (document.getElementById('check-notes')?.value || '').trim();
    if (!station) {
      setStatus('Enter station or area name.', true);
      return;
    }
    const entryId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `chk_${Date.now()}`;
    const now = new Date().toISOString();
    try {
      await setDoc(
        doc(db, 'projects', pid(), 'checklists', entryId),
        {
          id: entryId,
          templateId: 'line_station_round',
          templateName: 'Station check (mobile)',
          projectId: pid(),
          ownerId: uid,
          data: { station, notes, source: 'mobile_line_app' },
          status: 'completed',
          timestamp: now,
          createdAt: now,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      setStatus('Checklist saved to project.');
      document.getElementById('check-notes').value = '';
      await loadStationChecks();
    } catch (e) {
      console.error(e);
      setStatus('Could not save checklist.', true);
    }
  }

  async function loadSops() {
    const db = getDb();
    const body = document.getElementById('sops-body');
    if (!db || !body) return;
    if (!teamProjectSelected()) {
      body.innerHTML =
        '<p class="mc-empty">Pick your <strong>location</strong> above for how-to guides.</p>';
      return;
    }
    body.innerHTML = '<p class="mc-hint">Loading…</p>';
    try {
      const sref = doc(db, 'projects', pid(), 'snapshots', SNAPSHOT_SOP_DOC);
      const snap = await getDoc(sref);
      if (!snap.exists()) {
        body.innerHTML =
          '<p class="mc-empty">No guides uploaded yet. Your manager can add them from the office side.</p>';
        return;
      }
      const data = snap.data();
      const sops = Array.isArray(data.sops) ? data.sops : [];
      if (!sops.length) {
        body.innerHTML =
          '<p class="mc-empty">SOP pack is empty. Ask your manager to add entries.</p>';
        return;
      }
      body.innerHTML = sops
        .map(
          (s, i) =>
            `<article class="mc-card" style="margin-bottom:0.65rem;"><strong>${escapeHtml(s.title || `SOP ${i + 1}`)}</strong><div style="margin-top:0.5rem;white-space:pre-wrap;font-size:0.88rem;line-height:1.45;">${escapeHtml(s.body || '')}</div></article>`
        )
        .join('');
    } catch (e) {
      console.error(e);
      body.innerHTML = '<p class="mc-empty">Could not load SOPs.</p>';
    }
  }

  function renderLiquorsBlock(raw) {
    if (raw == null || raw === '') {
      return '<p class="mc-empty">Nothing listed yet. Ask a manager to publish bar stock.</p>';
    }
    if (Array.isArray(raw)) {
      if (!raw.length) {
        return '<p class="mc-empty">Nothing listed yet.</p>';
      }
      if (typeof raw[0] === 'object' && raw[0] !== null) {
        return (
          '<ul class="mc-list">' +
          raw
            .map(o => {
              const name = o.name || o.title || o.label || 'Item';
              const note = o.note || o.detail || o.line || '';
              return `<li class="mc-card"><strong>${escapeHtml(name)}</strong>${note ? `<div class="mc-hint" style="margin-top:0.25rem;white-space:pre-wrap;">${escapeHtml(String(note))}</div>` : ''}</li>`;
            })
            .join('') +
          '</ul>'
        );
      }
      return (
        '<ul class="mc-list">' +
        raw
          .map(s => `<li class="mc-card">${escapeHtml(String(s))}</li>`)
          .join('') +
        '</ul>'
      );
    }
    return `<div class="mc-card" style="white-space:pre-wrap;font-size:0.9rem;line-height:1.45;">${escapeHtml(String(raw))}</div>`;
  }

  async function loadBarPack() {
    const db = getDb();
    const drinksEl = document.getElementById('bar-drinks-body');
    const liqEl = document.getElementById('bar-liquor-body');
    if (!db || !drinksEl || !liqEl) return;
    if (!teamProjectSelected()) {
      drinksEl.innerHTML =
        '<p class="mc-empty">Pick your <strong>location</strong> above for bar specs and stock.</p>';
      liqEl.innerHTML = '';
      return;
    }
    drinksEl.innerHTML = '<p class="mc-hint">Loading…</p>';
    liqEl.innerHTML = '<p class="mc-hint">Loading…</p>';
    try {
      const bref = doc(db, 'projects', pid(), 'snapshots', SNAPSHOT_BAR_DOC);
      const snap = await getDoc(bref);
      if (!snap.exists()) {
        drinksEl.innerHTML =
          '<p class="mc-empty">No drink recipes here yet. Ask a manager to publish the bar pack for this location.</p>';
        liqEl.innerHTML =
          '<p class="mc-empty">No liquor / stock list yet — your manager publishes it with the drink specs.</p>';
        return;
      }
      const data = snap.data();
      const drinks = Array.isArray(data.drinks) ? data.drinks : [];
      if (!drinks.length) {
        drinksEl.innerHTML =
          '<p class="mc-empty">Drink builds aren’t filled in yet. Ask your manager to add them to the bar pack.</p>';
      } else {
        drinksEl.innerHTML = drinks
          .map((d, i) => {
            const title = d.title || d.name || `Drink ${i + 1}`;
            const spec = d.spec || d.body || d.recipe || d.build || '';
            return `<article class="mc-card" style="margin-bottom:0.65rem;"><strong>${escapeHtml(title)}</strong><div style="margin-top:0.5rem;white-space:pre-wrap;font-size:0.88rem;line-height:1.45;">${escapeHtml(spec)}</div></article>`;
          })
          .join('');
      }
      const liqRaw =
        data.liquorsInStock != null
          ? data.liquorsInStock
          : data.liquors != null
            ? data.liquors
            : data.barStock != null
              ? data.barStock
              : '';
      liqEl.innerHTML = renderLiquorsBlock(liqRaw);
    } catch (e) {
      console.error(e);
      drinksEl.innerHTML = '<p class="mc-empty">Could not load bar pack.</p>';
      liqEl.innerHTML = '';
    }
  }

  function barTopicLabel(topic, relatedDrink) {
    if (topic === 'drink') {
      return relatedDrink ? `Drink: ${relatedDrink}` : 'Drink';
    }
    if (topic === 'stock') return 'Stock';
    return 'Bar';
  }

  async function loadBarNotes() {
    const db = getDb();
    const uid = getAuth()?.currentUser?.uid;
    const listEl = document.getElementById('bar-notes-list');
    if (!db || !uid || !listEl) return;
    listEl.innerHTML = '<p class="mc-hint">Loading…</p>';
    try {
      const ref = collection(db, 'users', uid, 'notes');
      const snap = await getDocs(query(ref, limit(100)));
      const project = pid();
      const rows = [];
      snap.forEach(d => {
        const x = d.data();
        if (x.lineAppType !== 'bar_note') return;
        if (project && x.projectId && x.projectId !== project) {
          return;
        }
        rows.push({ id: d.id, ...x });
      });
      const sec = t =>
        typeof t?.seconds === 'number'
          ? t.seconds
          : typeof t?._seconds === 'number'
            ? t._seconds
            : 0;
      rows.sort((a, b) => sec(b.updatedAt) - sec(a.updatedAt));
      if (!rows.length) {
        listEl.innerHTML =
          '<p class="mc-empty">No bar notes yet. Add one above.</p>';
        return;
      }
      listEl.innerHTML = rows
        .slice(0, 35)
        .map(r => {
          const topic =
            r.barTopic === 'stock'
              ? 'stock'
              : r.barTopic === 'general'
                ? 'general'
                : 'drink';
          const chip = barTopicLabel(topic, r.relatedDrink || '');
          return `<li class="mc-card"><span class="mc-hint">${escapeHtml(chip)}</span><strong>${escapeHtml(r.title || 'Note')}</strong><div style="margin-top:0.35rem;white-space:pre-wrap;font-size:0.9rem;">${escapeHtml(r.body || '')}</div></li>`;
        })
        .join('');
    } catch (e) {
      console.error(e);
      listEl.innerHTML = '<p class="mc-empty">Could not load bar notes.</p>';
    }
  }

  async function saveBarNoteFromForm() {
    const db = getDb();
    const uid = getAuth()?.currentUser?.uid;
    if (!db || !uid) {
      setStatus('Sign in to save.', true);
      return;
    }
    const topicEl = document.getElementById('bar-note-topic');
    const drinkEl = document.getElementById('bar-note-drink');
    const titleEl = document.getElementById('bar-note-title');
    const bodyEl = document.getElementById('bar-note-body');
    let barTopic =
      topicEl?.value === 'stock'
        ? 'stock'
        : topicEl?.value === 'general'
          ? 'general'
          : 'drink';
    const relatedDrink = (drinkEl?.value || '').trim();
    const title = (titleEl?.value || '').trim();
    const body = (bodyEl?.value || '').trim();
    if (!body) {
      setStatus('Add note text before saving.', true);
      return;
    }
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `bn_${Date.now()}`;
    try {
      await setDoc(
        doc(db, 'users', uid, 'notes', id),
        {
          lineAppType: 'bar_note',
          barTopic,
          relatedDrink: barTopic === 'drink' ? relatedDrink || null : null,
          title: title || barTopicLabel(barTopic, relatedDrink),
          body,
          projectId: teamProjectSelected() ? pid() : null,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      if (titleEl) titleEl.value = '';
      if (bodyEl) bodyEl.value = '';
      if (drinkEl) drinkEl.value = '';
      setStatus('Bar note saved.');
      await loadBarNotes();
    } catch (e) {
      console.error(e);
      setStatus('Could not save bar note.', true);
    }
  }

  function syncBarDrinkFieldVisibility() {
    const topicEl = document.getElementById('bar-note-topic');
    const wrap = document.getElementById('bar-note-drink-wrap');
    if (!topicEl || !wrap) return;
    const show = topicEl.value === 'drink';
    wrap.hidden = !show;
  }

  function ensureTeamBoardDateInput() {
    const inp = document.getElementById('team-board-date');
    if (inp && !inp.value) {
      inp.value = localDateKey();
    }
  }

  function getTeamLogDateKey() {
    const inp = document.getElementById('team-board-date');
    const v = (inp && inp.value && String(inp.value).trim()) || '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return v;
    }
    return localDateKey();
  }

  function postCreatedMs(p) {
    if (p.createdAt && typeof p.createdAt.toMillis === 'function') {
      return p.createdAt.toMillis();
    }
    if (p.createdAt?.seconds != null) {
      return p.createdAt.seconds * 1000;
    }
    if (p.createdAt?._seconds != null) {
      return p.createdAt._seconds * 1000;
    }
    return 0;
  }

  function paintTeamBoardRows(rows, listEl) {
    if (!listEl) {
      return;
    }
    if (!teamProjectSelected()) {
      listEl.innerHTML =
        '<p class="mc-empty">Pick your <strong>location</strong> above to see the team log.</p>';
      return;
    }
    if (!rows.length) {
      listEl.innerHTML =
        '<p class="mc-empty">No posts for this date yet. Add a shift or stock note below.</p>';
      return;
    }
    const items = rows
      .map(r => {
        const cat = r.category === 'inventory' ? 'inventory' : 'shift';
        const pr =
          r.priority === 'out'
            ? 'out'
            : r.priority === 'low'
              ? 'low'
              : 'normal';
        const badge =
          cat === 'inventory'
            ? pr === 'out'
              ? '[OUT]'
              : pr === 'low'
                ? '[LOW]'
                : '[STOCK]'
            : '[SHIFT]';
        const who = escapeHtml(r.authorName || 'Team');
        const body = escapeHtml(String(r.body || ''));
        return `<li class="mc-card"><span class="mc-hint">${escapeHtml(badge)} ${who}</span><div style="margin-top:0.35rem;white-space:pre-wrap;font-size:0.9rem;">${body}</div></li>`;
      })
      .join('');
    listEl.innerHTML = `<ul class="mc-list">${items}</ul>`;
  }

  function attachTeamBoardListener() {
    const db = getDb();
    const listEl = document.getElementById('team-board-feed');
    if (!db || !listEl) {
      return;
    }
    if (typeof teamBoardUnsub === 'function') {
      try {
        teamBoardUnsub();
      } catch (e) {
        /* ignore */
      }
      teamBoardUnsub = null;
    }
    if (!teamProjectSelected()) {
      paintTeamBoardRows([], listEl);
      return;
    }
    const dateKey = getTeamLogDateKey();
    listEl.innerHTML = '<p class="mc-hint">Loading…</p>';
    const col = collection(db, 'projects', pid(), 'shift_day_posts');
    const q = query(col, where('dateKey', '==', dateKey));
    teamBoardUnsub = onSnapshot(
      q,
      snap => {
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
        rows.sort((a, b) => postCreatedMs(a) - postCreatedMs(b));
        paintTeamBoardRows(rows, listEl);
      },
      err => {
        console.error(err);
        listEl.innerHTML =
          '<p class="mc-empty">Could not load team log. Check connection and Firestore rules.</p>';
      }
    );
  }

  async function submitTeamBoardPost() {
    const db = getDb();
    const uid = getAuth()?.currentUser?.uid;
    const bodyEl = document.getElementById('team-board-body');
    const kindEl = document.getElementById('team-board-kind');
    if (!db || !uid) {
      setStatus('Sign in to post.', true);
      return;
    }
    if (!teamProjectSelected()) {
      setStatus('Pick a location first.', true);
      return;
    }
    const body = (bodyEl?.value || '').trim();
    if (!body) {
      setStatus('Write something before posting.', true);
      return;
    }
    const kind = kindEl?.value || 'shift';
    const category =
      kind === 'inv_low' || kind === 'inv_out' ? 'inventory' : 'shift';
    const priority =
      kind === 'inv_out' ? 'out' : kind === 'inv_low' ? 'low' : 'normal';
    const user = getAuth()?.currentUser;
    const authorName =
      user?.displayName ||
      (user?.email ? user.email.split('@')[0] : '') ||
      'Team member';
    const dateKey = getTeamLogDateKey();
    try {
      const ref = doc(collection(db, 'projects', pid(), 'shift_day_posts'));
      await setDoc(ref, {
        dateKey,
        body: body.slice(0, 8000),
        category,
        priority,
        authorUid: uid,
        authorName: String(authorName).slice(0, 120),
        source: 'shift_app',
        createdAt: serverTimestamp()
      });
      if (bodyEl) bodyEl.value = '';
      setStatus(
        'Posted to team log — managers see it for this date on the dashboard.'
      );
    } catch (e) {
      console.error(e);
      setStatus('Could not post. Check team access and Firestore rules.', true);
    }
  }

  document.querySelectorAll('[data-hub-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-hub-tab');
      if (!k) return;
      showSection(k);
      if (k === 'menu') void loadPublishedMenu();
      if (k === 'notes') void loadMyNotes();
      if (k === 'lists') void loadPrepStock();
      if (k === 'checks') void loadStationChecks();
      if (k === 'sops') void loadSops();
      if (k === 'bar') {
        void loadBarPack();
        void loadBarNotes();
      }
    });
  });

  const saveNoteBtn = document.getElementById('btn-save-note');
  if (saveNoteBtn)
    saveNoteBtn.addEventListener('click', () => saveNoteFromForm());

  const savePrepBtn = document.getElementById('btn-save-prep');
  if (savePrepBtn)
    savePrepBtn.addEventListener('click', () => savePrepStock('prep'));

  const saveStockBtn = document.getElementById('btn-save-stock');
  if (saveStockBtn)
    saveStockBtn.addEventListener('click', () => savePrepStock('stock'));

  const saveCheckBtn = document.getElementById('btn-save-quick-check');
  if (saveCheckBtn)
    saveCheckBtn.addEventListener('click', () => submitQuickCheck());

  const saveBarNoteBtn = document.getElementById('btn-save-bar-note');
  if (saveBarNoteBtn)
    saveBarNoteBtn.addEventListener('click', () => saveBarNoteFromForm());

  const teamPostBtn = document.getElementById('btn-team-board-post');
  if (teamPostBtn)
    teamPostBtn.addEventListener('click', () => submitTeamBoardPost());

  const barTopicSel = document.getElementById('bar-note-topic');
  if (barTopicSel) {
    barTopicSel.addEventListener('change', syncBarDrinkFieldVisibility);
    syncBarDrinkFieldVisibility();
  }

  const picker = document.getElementById('project-picker');
  if (picker) {
    picker.addEventListener('change', () => {
      const active = document.querySelector(
        '[data-hub-tab][aria-selected="true"]'
      );
      const k = active?.getAttribute('data-hub-tab');
      if (k === 'menu') void loadPublishedMenu();
      if (k === 'notes') void loadMyNotes();
      if (k === 'lists') void loadPrepStock();
      if (k === 'checks') void loadStationChecks();
      if (k === 'sops') void loadSops();
      if (k === 'bar') {
        void loadBarPack();
        void loadBarNotes();
      }
      if (k === 'team') attachTeamBoardListener();
    });
  }

  const teamDateInp = document.getElementById('team-board-date');
  if (teamDateInp) {
    teamDateInp.addEventListener('change', () => {
      const active = document.querySelector(
        '[data-hub-tab][aria-selected="true"]'
      );
      if (active?.getAttribute('data-hub-tab') === 'team') {
        attachTeamBoardListener();
      }
    });
  }

  showSection('hub');
}
