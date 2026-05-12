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
const SAFETY_PREP_BLOCK_START = '--- AUTO SAFETY CHECKS (6h) ---';
const SAFETY_PREP_BLOCK_END = '--- END AUTO SAFETY CHECKS ---';
const SAFETY_INTERVAL_MS = 6 * 60 * 60 * 1000;
const PREP_CHECK_RE = /^-\s*\[( |x|X)\]\s*(.+)$/;

/** @typedef {{ getDb: () => import('firebase/firestore').Firestore | null, getAuth: () => import('firebase/auth').Auth | null, getProjectId: () => string, setStatus: (msg: string, isErr?: boolean) => void, escapeHtml: (s: unknown) => string }} LineHubApi */

/**
 * @param {LineHubApi} api
 */
export function attachLineEmployeeHub(api) {
  const { getDb, getAuth, getProjectId, setStatus, escapeHtml } = api;
  /** @type {{ text: string, done: boolean }[]} */
  let prepChecklistItems = [];

  const sections = [
    'hub',
    'menu',
    'recipes',
    'jobs',
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

  const FALLBACK_JOB_OPTIONS = [
    { value: 'account_admin', label: 'Account admin / owner' },
    { value: 'operations_gm', label: 'Operations / GM' },
    { value: 'location_manager', label: 'Location manager' },
    { value: 'chef_leadership', label: 'Executive chef / chef lead' },
    { value: 'sous_chef', label: 'Sous chef' },
    { value: 'kitchen_manager', label: 'Kitchen manager' },
    { value: 'employee_line', label: 'Kitchen line / crew' },
    { value: 'kitchen_staff', label: 'Kitchen staff' },
    { value: 'prep_cook', label: 'Prep cook' },
    { value: 'line_cook', label: 'Line cook' },
    { value: 'expeditor', label: 'Expo / pass' },
    { value: 'dishwasher', label: 'Dish / porter' },
    { value: 'bakery_pastry', label: 'Bakery / pastry' },
    { value: 'bar_manager', label: 'Bar manager' },
    { value: 'bartender', label: 'Bartender' },
    { value: 'host', label: 'Host / hostess' },
    { value: 'front_of_house', label: 'Front of house' },
    { value: 'server', label: 'Server' },
    { value: 'runner', label: 'Runner / busser' },
    { value: 'support_staff', label: 'Support' },
    { value: 'purchasing', label: 'Purchasing' },
    { value: 'inventory_clerk', label: 'Inventory / receiving' },
    { value: 'consultant_rd', label: 'Consultant / R&D' }
  ];

  function roleLabel(role) {
    const options = Array.isArray(window.ITERUM_TEAM_MEMBER_ROLE_OPTIONS)
      ? window.ITERUM_TEAM_MEMBER_ROLE_OPTIONS
      : FALLBACK_JOB_OPTIONS;
    const matched = options.find(opt => opt.value === role);
    return matched?.label || role || 'Team member';
  }

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
    let activeNavBtn = null;
    document.querySelectorAll('[data-hub-tab]').forEach(btn => {
      const k = btn.getAttribute('data-hub-tab');
      const on = k === key;
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on && btn.closest('.mc-hub-nav')) activeNavBtn = btn;
    });
    if (activeNavBtn) {
      try {
        activeNavBtn.scrollIntoView({
          inline: 'center',
          block: 'nearest',
          behavior: 'smooth'
        });
      } catch (e) {
        try {
          activeNavBtn.scrollIntoView();
        } catch (_) {
          /* ignore */
        }
      }
    }
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

  function timestampToMs(value) {
    if (!value) {
      return 0;
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value?.toDate === 'function') {
      return value.toDate().getTime();
    }
    if (typeof value?.seconds === 'number') {
      return value.seconds * 1000;
    }
    if (typeof value?._seconds === 'number') {
      return value._seconds * 1000;
    }
    return 0;
  }

  function shouldCountReadingForProject(reading, projectId) {
    if (!reading || !projectId) {
      return true;
    }
    if (!reading.projectId) {
      return true;
    }
    return reading.projectId === projectId;
  }

  async function readLatestSafetyTimestamp(collectionName, db, uid, projectId) {
    const snap = await getDocs(
      query(collection(db, 'users', uid, collectionName), limit(60))
    );
    let latest = 0;
    snap.forEach(docSnap => {
      const row = docSnap.data() || {};
      if (!shouldCountReadingForProject(row, projectId)) {
        return;
      }
      const ts = timestampToMs(row.timestamp || row.createdAt || row.updatedAt);
      if (ts > latest) {
        latest = ts;
      }
    });
    return latest;
  }

  async function buildSafetyReminderItems() {
    const db = getDb();
    const uid = getAuth()?.currentUser?.uid;
    const projectId = pid();
    if (!db || !uid) {
      return [];
    }
    const now = Date.now();
    const latestTemp = await readLatestSafetyTimestamp(
      'temperature_readings',
      db,
      uid,
      projectId
    );
    const latestSan = await readLatestSafetyTimestamp(
      'sanitizer_readings',
      db,
      uid,
      projectId
    );
    const reminders = [];
    if (!latestTemp || now - latestTemp >= SAFETY_INTERVAL_MS) {
      reminders.push('Log fridge temperature check (required every 6 hours)');
    }
    if (!latestSan || now - latestSan >= SAFETY_INTERVAL_MS) {
      reminders.push('Log sanitizer PPM check (required every 6 hours)');
    }
    return reminders;
  }

  function injectSafetyBlock(prepText, reminders) {
    const source = String(prepText || '');
    const pattern = new RegExp(
      `${SAFETY_PREP_BLOCK_START}[\\s\\S]*?${SAFETY_PREP_BLOCK_END}\\n?`,
      'g'
    );
    const cleaned = source.replace(pattern, '').trim();
    if (!reminders.length) {
      return cleaned;
    }
    const block = `${SAFETY_PREP_BLOCK_START}
- [ ] ${reminders.join('\n- [ ] ')}
${SAFETY_PREP_BLOCK_END}`.trim();
    return cleaned ? `${block}\n\n${cleaned}` : block;
  }

  function parsePrepChecklistItems(text) {
    const source = String(text || '')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .filter(
        line =>
          line !== SAFETY_PREP_BLOCK_START && line !== SAFETY_PREP_BLOCK_END
      );
    return source
      .map(line => {
        const checkMatch = line.match(PREP_CHECK_RE);
        if (checkMatch) {
          return { text: checkMatch[2].trim(), done: checkMatch[1] !== ' ' };
        }
        if (line.startsWith('- ')) {
          return { text: line.slice(2).trim(), done: false };
        }
        return { text: line, done: false };
      })
      .filter(item => item.text);
  }

  function serializePrepChecklistItems(items) {
    return items
      .map(item => `- [${item.done ? 'x' : ' '}] ${item.text}`)
      .join('\n');
  }

  function renderPrepChecklist() {
    const listEl = document.getElementById('prep-checklist-items');
    const prepBodyEl = document.getElementById('prep-list-body');
    if (!listEl || !prepBodyEl) {
      return;
    }
    prepBodyEl.value = serializePrepChecklistItems(prepChecklistItems);
    if (!prepChecklistItems.length) {
      listEl.innerHTML =
        '<li class="mc-card"><span class="mc-hint">No prep items yet. Add your first checklist task above.</span></li>';
      return;
    }
    listEl.innerHTML = prepChecklistItems
      .map(
        (item, idx) => `<li class="mc-card mc-card-split">
          <label class="mc-check-row">
            <input type="checkbox" data-prep-check-index="${idx}" ${item.done ? 'checked' : ''} class="mc-check-input" />
            <span class="${item.done ? 'mc-check-text done' : 'mc-check-text'}">${escapeHtml(item.text)}</span>
          </label>
          <button type="button" class="mc-btn" data-prep-remove-index="${idx}" aria-label="Remove prep item">Remove</button>
        </li>`
      )
      .join('');
  }

  function addPrepChecklistItem() {
    const inputEl = document.getElementById('prep-check-item-input');
    if (!inputEl) {
      return;
    }
    const text = String(inputEl.value || '').trim();
    if (!text) {
      setStatus('Enter a prep checklist item first.', true);
      return;
    }
    prepChecklistItems.push({ text, done: false });
    inputEl.value = '';
    renderPrepChecklist();
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
      body.innerHTML = `<p class="mc-panel-title">${escapeHtml(menuName)}</p><ul class="mc-list">${rows}</ul>`;
    } catch (e) {
      console.error(e);
      body.innerHTML =
        '<p class="mc-empty">Can’t load the menu. Check your location above, or ask a manager if you’re on the team.</p>';
    }
  }

  async function loadPublishedRecipes() {
    const db = getDb();
    const uid = getAuth()?.currentUser?.uid;
    const body = document.getElementById('recipes-mobile-body');
    if (!db || !uid || !body) return;
    if (!teamProjectSelected()) {
      body.innerHTML =
        '<p class="mc-empty">Pick your <strong>location</strong> above to view recipes.</p>';
      return;
    }
    body.innerHTML = '<p class="mc-hint">Loading recipes…</p>';
    try {
      const userSnap = await getDoc(
        doc(db, 'users', uid, 'snapshots', 'recipeLibrary')
      );
      if (!userSnap.exists()) {
        body.innerHTML =
          '<p class="mc-empty">No recipes found yet. Publish or sync recipes from the web app first.</p>';
        return;
      }
      const recipes = Array.isArray(userSnap.data()?.recipes)
        ? userSnap.data().recipes
        : [];
      if (!recipes.length) {
        body.innerHTML =
          '<p class="mc-empty">Recipe list is empty for this account.</p>';
        return;
      }
      body.innerHTML = `<ul class="mc-list">${recipes
        .slice(0, 80)
        .map(recipe => {
          const name =
            recipe.name || recipe.title || recipe.recipeName || 'Recipe';
          const yieldText = recipe.yield
            ? `Yield: ${recipe.yield}`
            : recipe.servings
              ? `Servings: ${recipe.servings}`
              : '';
          const noteText = recipe.description || recipe.notes || '';
          return `<li class="mc-card">
            <strong>${escapeHtml(name)}</strong>
            ${yieldText ? `<div class="mc-hint">${escapeHtml(String(yieldText))}</div>` : ''}
            ${noteText ? `<div style="margin-top:0.35rem;white-space:pre-wrap;font-size:0.88rem;line-height:1.45;">${escapeHtml(String(noteText).slice(0, 240))}</div>` : ''}
          </li>`;
        })
        .join('')}</ul>`;
    } catch (e) {
      console.error(e);
      body.innerHTML = '<p class="mc-empty">Could not load recipes.</p>';
    }
  }

  async function loadJobsPanel() {
    const db = getDb();
    const uid = getAuth()?.currentUser?.uid;
    const selectEl = document.getElementById('job-position-select');
    const listEl = document.getElementById('jobs-team-list');
    if (!db || !uid || !selectEl || !listEl) return;
    if (!teamProjectSelected()) {
      selectEl.innerHTML = '<option value="">Pick a location first</option>';
      listEl.innerHTML =
        '<p class="mc-empty">Pick your workspace to load team jobs.</p>';
      return;
    }
    const options = Array.isArray(window.ITERUM_TEAM_MEMBER_ROLE_OPTIONS)
      ? window.ITERUM_TEAM_MEMBER_ROLE_OPTIONS
      : FALLBACK_JOB_OPTIONS;
    selectEl.innerHTML = options
      .map(
        opt =>
          `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`
      )
      .join('');
    try {
      const prefSnap = await getDoc(
        doc(db, 'users', uid, 'workspace_prefs', pid())
      );
      if (prefSnap.exists()) {
        const pref = prefSnap.data() || {};
        if (pref.positionKey) {
          selectEl.value = pref.positionKey;
        }
      }
    } catch (e) {
      console.warn('load workspace_prefs', e);
    }

    listEl.innerHTML = '<p class="mc-hint">Loading team jobs…</p>';
    try {
      const memberSnap = await getDocs(
        query(collection(db, 'projects', pid(), 'members'), limit(100))
      );
      if (memberSnap.empty) {
        listEl.innerHTML =
          '<p class="mc-empty">No team members found for this workspace.</p>';
        return;
      }
      const rows = [];
      for (const memberDoc of memberSnap.docs) {
        const m = memberDoc.data() || {};
        const memberUid = memberDoc.id;
        let display = m.email || memberUid;
        try {
          const userSnap = await getDoc(doc(db, 'users', memberUid));
          if (userSnap.exists()) {
            const u = userSnap.data() || {};
            display = u.name || u.displayName || u.email || display;
          }
        } catch {
          /* ignore profile lookup failures */
        }
        let positionKey = m.role || '';
        try {
          const prefSnap = await getDoc(
            doc(db, 'users', memberUid, 'workspace_prefs', pid())
          );
          if (prefSnap.exists()) {
            const pref = prefSnap.data() || {};
            positionKey = pref.positionKey || positionKey;
          }
        } catch {
          /* ignore preference lookup failures */
        }
        rows.push({
          id: memberUid,
          display,
          role: positionKey || m.role || ''
        });
      }
      listEl.innerHTML = `<ul class="mc-list">${rows
        .map(
          row => `<li class="mc-card">
            <strong>${escapeHtml(row.display)}</strong>
            <div class="mc-hint">${escapeHtml(roleLabel(row.role))}</div>
          </li>`
        )
        .join('')}</ul>`;
    } catch (e) {
      console.error(e);
      listEl.innerHTML = '<p class="mc-empty">Could not load team jobs.</p>';
    }
  }

  async function saveMyJobPosition() {
    const db = getDb();
    const uid = getAuth()?.currentUser?.uid;
    const selectEl = document.getElementById('job-position-select');
    if (!db || !uid || !selectEl) {
      setStatus('Sign in to save your job.', true);
      return;
    }
    if (!teamProjectSelected()) {
      setStatus('Pick a workspace first.', true);
      return;
    }
    const positionKey = String(selectEl.value || '').trim();
    if (!positionKey) {
      setStatus('Choose a job position first.', true);
      return;
    }
    try {
      await setDoc(
        doc(db, 'users', uid, 'workspace_prefs', pid()),
        { positionKey, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setStatus('Job updated for this workspace.');
      await loadJobsPanel();
    } catch (e) {
      console.error(e);
      setStatus('Could not save job position.', true);
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
            `<li class="mc-card"><span class="mc-hint">${escapeHtml(r.lineAppType === 'menu_note' ? 'Menu' : 'Ingredient')}</span><strong>${escapeHtml(r.title || 'Note')}</strong><div class="mc-note-body">${escapeHtml(r.body || '')}</div></li>`
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
      if (prepEl) {
        const reminders = await buildSafetyReminderItems();
        prepEl.value = injectSafetyBlock(prepEl.value, reminders);
        prepChecklistItems = parsePrepChecklistItems(prepEl.value);
        renderPrepChecklist();
      }
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
    if (which === 'prep' && ta) {
      ta.value = serializePrepChecklistItems(prepChecklistItems);
    }
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
      const fs = window.firestoreSync;
      if (
        fs &&
        typeof fs.saveProjectPrepListEntry === 'function' &&
        teamProjectSelected()
      ) {
        await fs.saveProjectPrepListEntry({
          projectId: pid(),
          type,
          body,
          source: 'mobile_line_app'
        });
      }
      setStatus(which === 'stock' ? 'Stock list saved.' : 'Prep list saved.');
    } catch (e) {
      console.error(e);
      setStatus('Could not save list.', true);
    }
  }

  const FP250_ITEM_KEYS = [
    'crowd_managers_count',
    'employees_trained',
    'egress_clear',
    'exit_doors_operable',
    'exit_signs_operable',
    'emergency_lighting_operable',
    'extinguishers_working',
    'exterior_clear',
    'cert_inspection_posted',
    'sprinkler_inspection_year',
    'fire_alarm_inspection_year',
    'exhaust_cleaned',
    'suppression_six_months'
  ];

  const FP250_DATE_FIELDS = [
    'extinguisherLast',
    'sprinklerDate',
    'fireAlarmDate',
    'exhaustDate',
    'suppressionDate',
    'capExpiration'
  ];

  function fp250TodayKey(projectId) {
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return `iterum.checks.crowd_manager.${projectId}.${iso}`;
  }

  function fp250PrefillKey(projectId) {
    return `iterum.checks.crowd_manager.prefill.${projectId}`;
  }

  function renderFp250Radios() {
    const items = document.querySelectorAll('#fp250-items [data-fp250-item]');
    items.forEach(li => {
      const key = li.getAttribute('data-fp250-item');
      const wrap = li.querySelector('[role="radiogroup"]');
      if (!wrap || wrap.dataset.built === '1') return;
      wrap.dataset.built = '1';
      wrap.innerHTML = `
        <label class="mc-inline-row" style="gap:0.35rem;cursor:pointer;">
          <input type="radio" name="fp250-q-${key}" value="yes" />
          <span class="mc-note-body-sm">Yes</span>
        </label>
        <label class="mc-inline-row" style="gap:0.35rem;cursor:pointer;margin-left:0.75rem;">
          <input type="radio" name="fp250-q-${key}" value="no" />
          <span class="mc-note-body-sm">No</span>
        </label>
      `;
    });
  }

  function readFp250Form() {
    const items = {};
    FP250_ITEM_KEYS.forEach(k => {
      const sel = document.querySelector(`input[name="fp250-q-${k}"]:checked`);
      items[k] = sel ? sel.value : null;
    });
    return {
      date: document.getElementById('fp250-date')?.value || '',
      items,
      extinguisherLast:
        document.getElementById('fp250-extinguisher-last')?.value || '',
      sprinklerDate:
        document.getElementById('fp250-sprinkler-date')?.value || '',
      fireAlarmDate:
        document.getElementById('fp250-fire-alarm-date')?.value || '',
      exhaustDate: document.getElementById('fp250-exhaust-date')?.value || '',
      suppressionDate:
        document.getElementById('fp250-suppression-date')?.value || '',
      exitAnnouncer:
        document.getElementById('fp250-exit-announcer')?.value?.trim() || '',
      occupantLoad:
        document.getElementById('fp250-occupant-load')?.value?.trim() || '',
      maxCapacity:
        document.getElementById('fp250-max-capacity')?.value?.trim() || '',
      capExpiration:
        document.getElementById('fp250-cap-expiration')?.value || '',
      managerName:
        document.getElementById('fp250-manager-name')?.value?.trim() || '',
      managerCert:
        document.getElementById('fp250-manager-cert')?.value?.trim() || '',
      signature:
        document.getElementById('fp250-signature')?.value?.trim() || '',
      attest: !!document.getElementById('fp250-attest')?.checked
    };
  }

  function writeFp250Form(payload) {
    if (!payload || typeof payload !== 'object') return;
    const dateInp = document.getElementById('fp250-date');
    if (dateInp && payload.date) dateInp.value = payload.date;
    if (payload.items && typeof payload.items === 'object') {
      FP250_ITEM_KEYS.forEach(k => {
        const v = payload.items[k];
        if (v === 'yes' || v === 'no') {
          const radio = document.querySelector(
            `input[name="fp250-q-${k}"][value="${v}"]`
          );
          if (radio) radio.checked = true;
        }
      });
    }
    const map = {
      extinguisherLast: 'fp250-extinguisher-last',
      sprinklerDate: 'fp250-sprinkler-date',
      fireAlarmDate: 'fp250-fire-alarm-date',
      exhaustDate: 'fp250-exhaust-date',
      suppressionDate: 'fp250-suppression-date',
      exitAnnouncer: 'fp250-exit-announcer',
      occupantLoad: 'fp250-occupant-load',
      maxCapacity: 'fp250-max-capacity',
      capExpiration: 'fp250-cap-expiration',
      managerName: 'fp250-manager-name',
      managerCert: 'fp250-manager-cert'
    };
    Object.entries(map).forEach(([k, id]) => {
      const el = document.getElementById(id);
      if (el && payload[k] != null) el.value = payload[k];
    });
  }

  function renderFp250Banner(entry) {
    const banner = document.getElementById('fp250-today-banner');
    if (!banner) return;
    if (!entry) {
      banner.hidden = true;
      banner.innerHTML = '';
      return;
    }
    const noCount = Object.values(entry.items || {}).filter(
      v => v === 'no'
    ).length;
    const statusLabel =
      noCount > 0
        ? `<span class="mc-hint" style="color:#b45309;">${noCount} item${noCount === 1 ? '' : 's'} marked No — must be resolved.</span>`
        : '<span class="mc-hint" style="color:#1e3d28;">All items clear.</span>';
    const ts = entry.signedAt ? new Date(entry.signedAt).toLocaleString() : '';
    banner.hidden = false;
    banner.innerHTML = `
      <strong>FP-250 signed today</strong>
      <div class="mc-note-body-sm">Crowd manager: ${escapeHtml(entry.managerName || '—')}${entry.managerCert ? ` · Cert #${escapeHtml(entry.managerCert)}` : ''}</div>
      <div class="mc-hint">Signed by ${escapeHtml(entry.signature || '—')} at ${escapeHtml(ts)}</div>
      ${statusLabel}
    `;
  }

  function loadFp250Today() {
    if (!teamProjectSelected()) {
      renderFp250Banner(null);
      return;
    }
    const projectId = pid();
    renderFp250Radios();
    const dateInp = document.getElementById('fp250-date');
    if (dateInp && !dateInp.value) {
      const d = new Date();
      dateInp.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    let entry = null;
    try {
      const raw = localStorage.getItem(fp250TodayKey(projectId));
      if (raw) entry = JSON.parse(raw);
    } catch {
      entry = null;
    }
    if (entry) {
      writeFp250Form(entry);
      renderFp250Banner(entry);
      return;
    }
    try {
      const prefillRaw = localStorage.getItem(fp250PrefillKey(projectId));
      if (prefillRaw) {
        const prefill = JSON.parse(prefillRaw);
        writeFp250Form({
          ...prefill,
          date: dateInp ? dateInp.value : prefill.date,
          signature: '',
          attest: false
        });
      }
    } catch {
      /* ignore prefill failure */
    }
    renderFp250Banner(null);
  }

  async function submitCrowdManager() {
    const setFp250Status = (msg, isErr) => {
      const el = document.getElementById('fp250-status');
      if (el) {
        el.textContent = msg || '';
        el.style.color = isErr ? '#b45309' : '#1e3d28';
      }
      setStatus(msg, isErr);
    };
    if (!teamProjectSelected()) {
      setFp250Status('Pick a team location first.', true);
      return;
    }
    const payload = readFp250Form();
    if (!payload.date) {
      setFp250Status('Pick the date of operation.', true);
      return;
    }
    if (!payload.managerName) {
      setFp250Status('Enter the crowd manager name.', true);
      return;
    }
    if (!payload.signature) {
      setFp250Status('Type your name to sign.', true);
      return;
    }
    if (payload.signature.toLowerCase() !== payload.managerName.toLowerCase()) {
      setFp250Status(
        'Signature must match the crowd manager name above.',
        true
      );
      return;
    }
    if (!payload.attest) {
      setFp250Status('Tick the attestation box to sign.', true);
      return;
    }
    const projectId = pid();
    const nowIso = new Date().toISOString();
    const entry = { ...payload, signedAt: nowIso, projectId };
    try {
      localStorage.setItem(fp250TodayKey(projectId), JSON.stringify(entry));
      const prefill = {};
      FP250_DATE_FIELDS.forEach(k => {
        if (entry[k]) prefill[k] = entry[k];
      });
      prefill.managerCert = entry.managerCert;
      prefill.maxCapacity = entry.maxCapacity;
      prefill.exitAnnouncer = entry.exitAnnouncer;
      prefill.occupantLoad = entry.occupantLoad;
      localStorage.setItem(fp250PrefillKey(projectId), JSON.stringify(prefill));
    } catch (e) {
      console.warn('FP-250 localStorage write failed', e);
    }
    const db = getDb();
    const uid = getAuth()?.currentUser?.uid;
    if (db && uid) {
      const entryId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `fp250_${Date.now()}`;
      try {
        await setDoc(
          doc(db, 'projects', projectId, 'checklists', entryId),
          {
            id: entryId,
            templateId: 'crowd_manager_fp250',
            templateName: 'Crowd Manager (FP-250)',
            projectId,
            ownerId: uid,
            data: entry,
            status: 'completed',
            timestamp: nowIso,
            createdAt: nowIso,
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
      } catch (e) {
        console.warn('FP-250 Firestore write failed', e);
      }
    }
    renderFp250Banner(entry);
    setFp250Status('FP-250 signed and saved.');
    await loadStationChecks();
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
              ? `<div class="mc-detail-block"><strong>${escapeHtml(st)}</strong>${n ? `<div class="mc-hint mc-note-inline">${escapeHtml(n)}</div>` : ''}</div>`
              : '';
          }
        }
        if (!detail && raw != null) {
          detail =
            typeof raw === 'object'
              ? `<div class="mc-hint mc-detail-json">${escapeHtml(JSON.stringify(raw).slice(0, 160))}</div>`
              : `<div class="mc-hint mc-note-inline">${escapeHtml(String(raw).slice(0, 200))}</div>`;
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
            `<article class="mc-card mc-stack-gap"><strong>${escapeHtml(s.title || `SOP ${i + 1}`)}</strong><div class="mc-note-body mc-note-body-sm">${escapeHtml(s.body || '')}</div></article>`
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
              return `<li class="mc-card"><strong>${escapeHtml(name)}</strong>${note ? `<div class="mc-hint mc-note-inline">${escapeHtml(String(note))}</div>` : ''}</li>`;
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
    return `<div class="mc-card mc-note-body">${escapeHtml(String(raw))}</div>`;
  }

  const BAR_CHECKLIST_LABELS = {
    opening: 'Opening',
    midday: 'Midday stock / check',
    closing: 'Closing',
    station_stock: 'Station stock list'
  };

  const BAR_CHECKLIST_KINDS = ['opening', 'midday', 'closing', 'station_stock'];

  function emptyBarChecklistFlags() {
    return {
      opening: {},
      midday: {},
      closing: {},
      station_stock: {}
    };
  }

  /** @returns {{ done: Record<string, Record<string, boolean>>, need: Record<string, Record<string, boolean>> }} */
  function migrateBarChecklistState(raw) {
    const done = emptyBarChecklistFlags();
    const need = emptyBarChecklistFlags();
    if (!raw || typeof raw !== 'object') {
      return { done, need };
    }
    if (raw.done && typeof raw.done === 'object') {
      const needSrc = raw.need && typeof raw.need === 'object' ? raw.need : {};
      BAR_CHECKLIST_KINDS.forEach(k => {
        if (raw.done[k] && typeof raw.done[k] === 'object') {
          done[k] = { ...raw.done[k] };
        }
        if (needSrc[k] && typeof needSrc[k] === 'object') {
          need[k] = { ...needSrc[k] };
        }
      });
      return { done, need };
    }
    BAR_CHECKLIST_KINDS.forEach(k => {
      const bucket = raw[k];
      if (bucket && typeof bucket === 'object' && !Array.isArray(bucket)) {
        for (const [idx, val] of Object.entries(bucket)) {
          if (val === true) {
            done[k][idx] = true;
          }
        }
      }
    });
    return { done, need };
  }

  function todayDateStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function barChecklistStateKey(projectId, uid) {
    return `iterum.bar_checklist_state.${projectId}.${uid || 'anon'}.${todayDateStr()}`;
  }

  function loadBarChecklistState() {
    if (!teamProjectSelected()) {
      return migrateBarChecklistState(null);
    }
    const uid = getAuth()?.currentUser?.uid || '';
    try {
      const raw = localStorage.getItem(barChecklistStateKey(pid(), uid));
      return migrateBarChecklistState(raw ? JSON.parse(raw) : null);
    } catch {
      return migrateBarChecklistState(null);
    }
  }

  function saveBarChecklistState(state) {
    if (!teamProjectSelected()) return;
    const uid = getAuth()?.currentUser?.uid || '';
    try {
      localStorage.setItem(
        barChecklistStateKey(pid(), uid),
        JSON.stringify(state || { done: {}, need: {} })
      );
    } catch (e) {
      console.warn('bar checklist state write failed', e);
    }
  }

  function barChecklistSectionCounts(kind, itemCount, state) {
    const doneMap = state?.done?.[kind] || {};
    const needMap = state?.need?.[kind] || {};
    let doneN = 0;
    let needN = 0;
    for (let i = 0; i < itemCount; i++) {
      const k = String(i);
      if (doneMap[k]) doneN += 1;
      if (needMap[k]) needN += 1;
    }
    return { doneN, needN };
  }

  function updateBarChecklistSectionHeader(kind, itemCount) {
    const wrap = document.querySelector(`[data-bar-checklist-kind="${kind}"]`);
    if (!wrap) return;
    const head = wrap.querySelector('h4 .mc-bar-checklist-progress');
    if (!head) return;
    const st = loadBarChecklistState();
    const { doneN, needN } = barChecklistSectionCounts(kind, itemCount, st);
    head.textContent = `${doneN}/${itemCount} done · ${needN} need`;
  }

  let barNeedQueue = Promise.resolve();

  function enqueueBarNeedFollowUp(kind, itemText) {
    const next = barNeedQueue.then(
      () => appendBarNeedFollowUp(kind, itemText),
      () => appendBarNeedFollowUp(kind, itemText)
    );
    barNeedQueue = next.catch(() => undefined);
    return next;
  }

  async function appendBarNeedFollowUp(kind, itemText) {
    const label = BAR_CHECKLIST_LABELS[kind] || kind;
    const prefix =
      kind === 'station_stock' ? '(Bar · need stock)' : `(Bar · ${label})`;
    const line = `${prefix} ${String(itemText || '').trim()}`.trim();
    const db = getDb();
    const uid = getAuth()?.currentUser?.uid;
    if (!db || !uid) {
      setStatus(
        'Sign in to add Needs to your Prep or Stock list (Lists tab).',
        true
      );
      return { ok: false, reason: 'signin' };
    }
    const norm = s =>
      String(s || '')
        .trim()
        .toLowerCase();
    const keyLine = norm(line);
    try {
      await loadPrepStock();
      if (kind === 'station_stock') {
        const ta = document.getElementById('stock-list-body');
        const lines = String(ta?.value || '')
          .split(/\r?\n/)
          .map(l => l.trim())
          .filter(Boolean);
        if (lines.some(l => norm(l) === keyLine)) {
          setStatus('Already on your stock list.');
          return { ok: true, reason: 'duplicate' };
        }
        ta.value = lines.length ? `${lines.join('\n')}\n${line}` : line;
        await savePrepStock('stock');
        setStatus('Added to Stock list — open Lists tab.');
        return { ok: true, reason: 'added' };
      }
      if (
        prepChecklistItems.some(
          it => norm(it.text) === keyLine || norm(it.text) === norm(line)
        )
      ) {
        setStatus('Already on your prep list.');
        return { ok: true, reason: 'duplicate' };
      }
      prepChecklistItems.push({ text: line, done: false });
      renderPrepChecklist();
      await savePrepStock('prep');
      setStatus('Added to Prep list — open Lists tab.');
      return { ok: true, reason: 'added' };
    } catch (e) {
      console.warn('appendBarNeedFollowUp failed', e);
      setStatus(
        'Could not add to Prep/Stock list. Try Lists tab → Save.',
        true
      );
      return { ok: false, reason: 'error' };
    }
  }

  function renderBarChecklists(pack) {
    const body = document.getElementById('bar-checklists-body');
    if (!body) return;
    if (!teamProjectSelected()) {
      body.innerHTML =
        '<p class="mc-empty">Pick your <strong>location</strong> above for bar checklists.</p>';
      return;
    }
    const hasAny = BAR_CHECKLIST_KINDS.some(
      k => Array.isArray(pack?.[k]) && pack[k].length
    );
    if (!hasAny) {
      body.innerHTML =
        '<p class="mc-empty">No bar checklists yet. Ask a manager to publish them from the dashboard.</p>';
      return;
    }
    const state = loadBarChecklistState();
    body.innerHTML = BAR_CHECKLIST_KINDS.map(kind => {
      const items = Array.isArray(pack?.[kind]) ? pack[kind] : [];
      if (!items.length) return '';
      const { doneN, needN } = barChecklistSectionCounts(
        kind,
        items.length,
        state
      );
      const doneMap = state.done?.[kind] || {};
      const needMap = state.need?.[kind] || {};
      const rows = items
        .map((text, idx) => {
          const itemKey = String(idx);
          const done = !!doneMap[itemKey];
          const need = !!needMap[itemKey];
          return `<li class="mc-card mc-bar-check-item" data-bar-item-kind="${kind}" data-bar-item-index="${itemKey}">
            <div class="mc-bar-check-actions" role="group" aria-label="Item status">
              <label class="mc-bar-check-mini">
                <input type="checkbox" data-bar-check-field="done" data-bar-check-kind="${kind}" data-bar-check-index="${itemKey}" ${done ? 'checked' : ''} class="mc-check-input" />
                <span>Done</span>
              </label>
              <label class="mc-bar-check-mini">
                <input type="checkbox" data-bar-check-field="need" data-bar-check-kind="${kind}" data-bar-check-index="${itemKey}" ${need ? 'checked' : ''} class="mc-check-input" />
                <span>Need</span>
              </label>
            </div>
            <div class="mc-bar-check-body ${done ? 'mc-check-text done' : ''}">${escapeHtml(text)}</div>
          </li>`;
        })
        .join('');
      return `
          <div class="mc-stack-gap" data-bar-checklist-kind="${kind}" data-bar-checklist-count="${items.length}">
            <h4 class="mc-section-title mc-section-title-top0" style="display:flex;align-items:center;flex-wrap:wrap;gap:0.4rem;">
              ${escapeHtml(BAR_CHECKLIST_LABELS[kind] || kind)}
              <span class="mc-hint mc-bar-checklist-progress">${doneN}/${items.length} done · ${needN} need</span>
            </h4>
            <ul class="mc-list">${rows}</ul>
          </div>
        `;
    }).join('');
  }

  async function loadBarChecklists() {
    const db = getDb();
    if (!db || !window.iterumBarChecklists) {
      renderBarChecklists(null);
      return;
    }
    if (!teamProjectSelected()) {
      renderBarChecklists(null);
      return;
    }
    try {
      const pack = await window.iterumBarChecklists.loadPack(db, pid());
      renderBarChecklists(pack);
    } catch (e) {
      console.warn('bar checklists load failed', e);
      const body = document.getElementById('bar-checklists-body');
      if (body)
        body.innerHTML =
          '<p class="mc-empty">Could not load bar checklists.</p>';
    }
  }

  function bindBarChecklistInteractions() {
    const body = document.getElementById('bar-checklists-body');
    if (!body || body.dataset.bound === '1') return;
    body.dataset.bound = '1';
    body.addEventListener('change', async e => {
      const cb = e.target;
      if (!(cb instanceof HTMLInputElement)) return;
      if (cb.type !== 'checkbox') return;
      const field = cb.getAttribute('data-bar-check-field');
      const kind = cb.getAttribute('data-bar-check-kind');
      const idx = cb.getAttribute('data-bar-check-index');
      if (!field || !kind || idx == null) return;
      const wrap = cb.closest('[data-bar-checklist-kind]');
      const itemCount = wrap
        ? parseInt(wrap.getAttribute('data-bar-checklist-count') || '0', 10)
        : 0;
      const itemLi = cb.closest('[data-bar-item-kind]');
      const bodyEl = itemLi?.querySelector('.mc-bar-check-body');
      const itemText =
        bodyEl?.textContent != null ? String(bodyEl.textContent) : '';

      const state = loadBarChecklistState();
      if (!state.done[kind]) state.done[kind] = {};
      if (!state.need[kind]) state.need[kind] = {};

      if (field === 'done') {
        if (cb.checked) state.done[kind][idx] = true;
        else delete state.done[kind][idx];
        saveBarChecklistState(state);
        if (bodyEl) {
          bodyEl.className = cb.checked
            ? 'mc-bar-check-body mc-check-text done'
            : 'mc-bar-check-body';
        }
        updateBarChecklistSectionHeader(kind, itemCount);
        return;
      }

      if (field === 'need') {
        if (cb.checked) {
          state.need[kind][idx] = true;
          saveBarChecklistState(state);
          updateBarChecklistSectionHeader(kind, itemCount);
          const res = await enqueueBarNeedFollowUp(kind, itemText);
          if (
            res &&
            !res.ok &&
            (res.reason === 'signin' || res.reason === 'error')
          ) {
            const fresh = loadBarChecklistState();
            if (fresh.need[kind]) delete fresh.need[kind][idx];
            saveBarChecklistState(fresh);
            cb.checked = false;
            updateBarChecklistSectionHeader(kind, itemCount);
          }
        } else {
          delete state.need[kind][idx];
          saveBarChecklistState(state);
          updateBarChecklistSectionHeader(kind, itemCount);
        }
      }
    });
  }

  function canEditBarDrafts() {
    if (typeof window === 'undefined') return false;
    if (typeof window.iterumCanViewManagerNotes === 'function') {
      return !!window.iterumCanViewManagerNotes();
    }
    return false;
  }

  function syncBarQuickAddVisibility() {
    const wrap = document.getElementById('bar-quick-add');
    if (!wrap) return;
    const allowed = canEditBarDrafts() && teamProjectSelected();
    wrap.hidden = !allowed;
  }

  function parseBuildLines(raw) {
    const lines = String(raw || '')
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);
    return lines.map(line => {
      const m = line.match(/^(.*?)\s*[—\-:]\s*([\d./\s]+)\s*(\S+)?\s*$/);
      if (m) {
        return {
          ingredient: m[1].trim(),
          amount: m[2].trim(),
          unit: (m[3] || '').trim()
        };
      }
      return { ingredient: line, amount: '', unit: '' };
    });
  }

  async function saveBarDraftFromForm() {
    const setBarStatus = (msg, isErr) => {
      const el = document.getElementById('bar-draft-status');
      if (el) {
        el.textContent = msg || '';
        el.style.color = isErr ? '#b45309' : '#1e3d28';
      }
      setStatus(msg, isErr);
    };
    if (!teamProjectSelected()) {
      setBarStatus('Pick a team location first.', true);
      return;
    }
    if (!canEditBarDrafts()) {
      setBarStatus('Admin role required to add drinks.', true);
      return;
    }
    const db = getDb();
    const uid = getAuth()?.currentUser?.uid;
    if (!db || !uid) {
      setBarStatus('Sign in to save.', true);
      return;
    }
    if (!window.iterumBarDrafts) {
      setBarStatus('Bar drafts module not loaded.', true);
      return;
    }
    const titleEl = document.getElementById('bar-draft-title');
    const title = (titleEl?.value || '').trim();
    if (!title) {
      setBarStatus('Drink name is required.', true);
      return;
    }
    const draft = {
      title,
      build: parseBuildLines(
        document.getElementById('bar-draft-build')?.value || ''
      ),
      glass: (document.getElementById('bar-draft-glass')?.value || '').trim(),
      method: (document.getElementById('bar-draft-method')?.value || '').trim(),
      garnish: (
        document.getElementById('bar-draft-garnish')?.value || ''
      ).trim(),
      allergies: (
        document.getElementById('bar-draft-allergies')?.value || ''
      ).trim(),
      source: 'mobile_admin_quick_add'
    };
    try {
      await window.iterumBarDrafts.upsertDraft(db, pid(), draft, {
        createdBy: uid,
        source: draft.source
      });
      setBarStatus(`Saved "${title}" as in progress.`);
      const ids = [
        'bar-draft-title',
        'bar-draft-build',
        'bar-draft-glass',
        'bar-draft-method',
        'bar-draft-garnish',
        'bar-draft-allergies'
      ];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && 'value' in el) el.value = '';
      });
    } catch (e) {
      console.error('bar draft save failed', e);
      setBarStatus('Could not save draft. Check team access.', true);
    }
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
            return `<article class="mc-card mc-stack-gap"><strong>${escapeHtml(title)}</strong><div class="mc-note-body mc-note-body-sm">${escapeHtml(spec)}</div></article>`;
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
          return `<li class="mc-card"><span class="mc-hint">${escapeHtml(chip)}</span><strong>${escapeHtml(r.title || 'Note')}</strong><div class="mc-note-body">${escapeHtml(r.body || '')}</div></li>`;
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
        return `<li class="mc-card"><span class="mc-hint">${escapeHtml(badge)} ${who}</span><div class="mc-note-body">${body}</div></li>`;
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

  function refreshIdQuickReference() {
    const api = window.iterumIdQuickReference;
    if (!api || typeof api.render !== 'function') return;
    const hubEl = document.getElementById('hub-id-quickref');
    if (hubEl) api.render(hubEl);
    const barEl = document.getElementById('bar-id-quickref');
    if (barEl) api.render(barEl);
  }

  refreshIdQuickReference();

  document.querySelectorAll('[data-hub-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.getAttribute('data-hub-tab');
      if (!k) return;
      showSection(k);
      if (k === 'hub' || k === 'bar') refreshIdQuickReference();
      if (k === 'menu') void loadPublishedMenu();
      if (k === 'recipes') void loadPublishedRecipes();
      if (k === 'jobs') void loadJobsPanel();
      if (k === 'notes') void loadMyNotes();
      if (k === 'lists') void loadPrepStock();
      if (k === 'checks') {
        loadFp250Today();
        void loadStationChecks();
      }
      if (k === 'sops') void loadSops();
      if (k === 'bar') {
        syncBarQuickAddVisibility();
        void loadBarPack();
        void loadBarNotes();
        void loadBarChecklists();
        bindBarChecklistInteractions();
      }
    });
  });

  const saveNoteBtn = document.getElementById('btn-save-note');
  if (saveNoteBtn)
    saveNoteBtn.addEventListener('click', () => saveNoteFromForm());

  const savePrepBtn = document.getElementById('btn-save-prep');
  if (savePrepBtn)
    savePrepBtn.addEventListener('click', () => savePrepStock('prep'));

  const addPrepItemBtn = document.getElementById('btn-add-prep-item');
  if (addPrepItemBtn) {
    addPrepItemBtn.addEventListener('click', addPrepChecklistItem);
  }

  const prepItemInput = document.getElementById('prep-check-item-input');
  if (prepItemInput) {
    prepItemInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addPrepChecklistItem();
      }
    });
  }

  const prepChecklistList = document.getElementById('prep-checklist-items');
  if (prepChecklistList) {
    prepChecklistList.addEventListener('change', event => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }
      const index = Number.parseInt(
        target.getAttribute('data-prep-check-index') || '',
        10
      );
      if (!Number.isInteger(index) || !prepChecklistItems[index]) {
        return;
      }
      prepChecklistItems[index].done = !!target.checked;
      renderPrepChecklist();
    });
    prepChecklistList.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const button = target.closest('[data-prep-remove-index]');
      if (!button) {
        return;
      }
      const index = Number.parseInt(
        button.getAttribute('data-prep-remove-index') || '',
        10
      );
      if (!Number.isInteger(index) || !prepChecklistItems[index]) {
        return;
      }
      prepChecklistItems.splice(index, 1);
      renderPrepChecklist();
    });
  }

  const saveStockBtn = document.getElementById('btn-save-stock');
  if (saveStockBtn)
    saveStockBtn.addEventListener('click', () => savePrepStock('stock'));

  const saveCheckBtn = document.getElementById('btn-save-quick-check');
  if (saveCheckBtn)
    saveCheckBtn.addEventListener('click', () => submitQuickCheck());

  const fp250Btn = document.getElementById('btn-fp250-submit');
  if (fp250Btn)
    fp250Btn.addEventListener('click', () => {
      void submitCrowdManager();
    });

  const barDraftBtn = document.getElementById('btn-bar-draft-save');
  if (barDraftBtn) {
    barDraftBtn.addEventListener('click', () => {
      void saveBarDraftFromForm();
    });
  }

  const saveBarNoteBtn = document.getElementById('btn-save-bar-note');
  if (saveBarNoteBtn)
    saveBarNoteBtn.addEventListener('click', () => saveBarNoteFromForm());

  const teamPostBtn = document.getElementById('btn-team-board-post');
  if (teamPostBtn)
    teamPostBtn.addEventListener('click', () => submitTeamBoardPost());

  const saveJobBtn = document.getElementById('btn-save-job-position');
  if (saveJobBtn)
    saveJobBtn.addEventListener('click', () => saveMyJobPosition());

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
      if (k === 'hub' || k === 'bar') refreshIdQuickReference();
      if (k === 'menu') void loadPublishedMenu();
      if (k === 'recipes') void loadPublishedRecipes();
      if (k === 'jobs') void loadJobsPanel();
      if (k === 'notes') void loadMyNotes();
      if (k === 'lists') void loadPrepStock();
      if (k === 'checks') {
        loadFp250Today();
        void loadStationChecks();
      }
      if (k === 'sops') void loadSops();
      if (k === 'bar') {
        syncBarQuickAddVisibility();
        void loadBarPack();
        void loadBarNotes();
        void loadBarChecklists();
        bindBarChecklistInteractions();
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
