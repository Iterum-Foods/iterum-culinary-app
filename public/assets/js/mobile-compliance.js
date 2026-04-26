/**
 * Mobile-first fridge temperature + sanitizer log.
 * Uses same Firestore paths as dashboard.html for sync with the full Iterum app.
 */
import {
  initializeApp,
  getApp,
  getApps
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

import { attachLineEmployeeHub } from './mobile-line-employee.js';

const REF_UNITS = 'refrigeration_units';
const SAN_LOCS = 'sanitizer_locations';

/** @type {{ id: string, role?: string }[]} */
let myProjectRows = [];

const PROJECTS_STORE_PREFIX = 'iterum_projects_user_';

function projectsStorageKey(uid) {
  return `${PROJECTS_STORE_PREFIX}${uid}`;
}

function loadPersonalProjects(uid) {
  try {
    const raw = localStorage.getItem(projectsStorageKey(uid));
    if (!raw) {
      return [];
    }
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function savePersonalProjects(uid, projects) {
  localStorage.setItem(projectsStorageKey(uid), JSON.stringify(projects));
}

/** Any non-master project the user created (named workspace). */
function hasNamedPersonalWorkspace(uid) {
  return loadPersonalProjects(uid).some(p => p && p.id && p.id !== 'master');
}

function getProjectId() {
  try {
    const v =
      localStorage.getItem('iterum_current_project') ||
      localStorage.getItem('userCurrentProjectKey') ||
      '';
    return v || '';
  } catch {
    return '';
  }
}

/**
 * Team location picked OR any saved personal project selected — enough to use shift tools.
 * @param {string} uid
 */
function isWorkspaceReady(uid) {
  if (myProjectRows.length > 0) {
    return true;
  }
  if (hasNamedPersonalWorkspace(uid)) {
    return true;
  }
  const cur = getProjectId();
  if (!cur || cur === 'mobile-default') {
    return false;
  }
  const pl = loadPersonalProjects(uid);
  return pl.some(p => p && p.id === cur);
}

function setWorkspaceReadyGlobally(uid) {
  window.__iterumShiftWorkspaceReady = () => isWorkspaceReady(uid);
}

async function bootstrapPersonalProjectInFirestore(
  uid,
  projectId,
  name,
  description,
  email
) {
  if (!db) {
    return;
  }
  await setDoc(
    doc(db, 'projects', projectId),
    {
      firebaseUid: uid,
      name,
      description: description || '',
      projectName: name,
      ownerId: uid,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
  await setDoc(
    doc(db, 'projects', projectId, 'members', uid),
    {
      authUid: uid,
      role: 'account_admin',
      email: email || '',
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function createPersonalWorkspace(uid, name, about, email) {
  const n = (name || '').trim();
  if (!n) {
    return { ok: false, error: 'Name your workspace first.' };
  }
  const description = (about || '').trim();
  const id = `project_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const projects = loadPersonalProjects(uid);
  const newProject = {
    id,
    name: n,
    description,
    type: 'culinary',
    status: 'active',
    createdAt: new Date().toISOString(),
    isMaster: false,
    icon: '📋',
    userId: uid,
    source: 'mobile_shift'
  };
  projects.push(newProject);
  savePersonalProjects(uid, projects);
  try {
    await bootstrapPersonalProjectInFirestore(uid, id, n, description, email);
  } catch (e) {
    console.warn('bootstrapPersonalProjectInFirestore', e);
  }
  persistProjectId(uid, id);
  try {
    localStorage.setItem('active_project_name', n);
    localStorage.setItem('active_project_id', id);
    localStorage.setItem('active_project', id);
    localStorage.setItem(`iterum_current_project_user_${uid}`, id);
  } catch {
    /* ignore */
  }
  try {
    document.dispatchEvent(
      new CustomEvent('projectChanged', {
        bubbles: true,
        detail: { projectId: id, project: newProject, userId: uid }
      })
    );
  } catch {
    /* ignore */
  }
  return { ok: true, project: newProject };
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function isNativeCapacitor() {
  try {
    return (
      typeof window.Capacitor !== 'undefined' &&
      typeof window.Capacitor.isNativePlatform === 'function' &&
      window.Capacitor.isNativePlatform() === true
    );
  } catch {
    return false;
  }
}

/** @param {unknown} err */
function friendlyAuthMessage(err) {
  const code = err && typeof err === 'object' && 'code' in err ? err.code : '';
  const msg =
    err && typeof err === 'object' && 'message' in err
      ? String(err.message)
      : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try Sign in, or reset your password on the web app.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Wrong email or password. Check caps lock and try again.';
    case 'auth/user-not-found':
      return 'No account for that email. Tap Create free account.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a minute and try again.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/network-request-failed':
      return 'Network error. Check connection and try again.';
    default:
      return msg || 'Something went wrong. Try again.';
  }
}

/** @param {import('firebase/auth').User} user */
function persistLocalWebSession(user) {
  if (!user) return;
  try {
    const name =
      user.displayName || (user.email ? user.email.split('@')[0] : 'Chef');
    const profile = {
      id: user.uid,
      userId: user.uid,
      name,
      email: user.email || '',
      type: user.providerData?.some(p => p?.providerId === 'google.com')
        ? 'google'
        : 'email',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    localStorage.setItem('current_user', JSON.stringify(profile));
    localStorage.setItem('session_active', 'true');
    localStorage.setItem('last_login', new Date().toISOString());
  } catch (e) {
    console.warn('persistLocalWebSession', e);
  }
}

/** @param {import('firebase/auth').User} user */
async function ensureUserProfileDoc(user) {
  if (!db || !user) return;
  const name =
    user.displayName || (user.email ? user.email.split('@')[0] : 'User');
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        userId: user.uid,
        email: user.email || '',
        name,
        updatedAt: serverTimestamp(),
        lastMobileSignInAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('ensureUserProfileDoc', e);
  }
}

function fToC(f) {
  return ((Number(f) - 32) * 5) / 9;
}

/** @type {import('firebase/auth').Auth | null} */
let auth = null;
/** @type {import('firebase/firestore').Firestore | null} */
let db = null;

function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
}

function setStatus(msg, isErr) {
  const color = isErr ? '#b91c1c' : 'var(--mc-muted)';
  ['status-line', 'status-line-app'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = msg;
      el.style.color = color;
    }
  });
}

function isoDayKey(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toISOString().slice(0, 10);
}

function parseEntryDay(entry) {
  const raw = entry?.timestamp || entry?.createdAt || entry?.updatedAt || null;
  if (!raw) {
    return '';
  }
  if (raw?.toDate) {
    return isoDayKey(raw.toDate());
  }
  return isoDayKey(raw);
}

function currentRoleForProject(projectId) {
  if (!projectId || projectId === 'master') {
    return 'account_admin';
  }
  const matched = myProjectRows.find(row => row.id === projectId);
  return matched?.role || 'employee_line';
}

function roleLabel(role) {
  const mapping = {
    account_admin: 'Admin',
    location_manager: 'Manager',
    operations_gm: 'Manager',
    employee_line: 'Line',
    kitchen_staff: 'Kitchen',
    front_of_house: 'FOH',
    support_staff: 'Support'
  };
  return mapping[role] || 'Team';
}

function renderTodayPanel(model) {
  const summaryEl = document.getElementById('today-summary');
  const metricsEl = document.getElementById('today-metrics');
  const actionsEl = document.getElementById('today-actions');
  const roleChip = document.getElementById('today-role-chip');
  if (!summaryEl || !metricsEl || !actionsEl || !roleChip) {
    return;
  }

  roleChip.textContent = `Role: ${roleLabel(model.role)}`;
  summaryEl.textContent = model.summary;
  metricsEl.innerHTML = model.metrics
    .map(
      item => `<div style="border:1px solid var(--mc-border);border-radius:10px;padding:0.5rem 0.55rem;">
        <div style="font-size:0.72rem;color:var(--mc-muted);">${escapeHtml(item.label)}</div>
        <div style="font-size:1rem;font-weight:700;color:var(--mc-text);">${escapeHtml(String(item.value))}</div>
      </div>`
    )
    .join('');
  actionsEl.innerHTML = model.actions
    .map(
      action =>
        `<button type="button" class="mc-btn mc-btn-ghost" data-today-action="${escapeHtml(action.key)}">${escapeHtml(action.label)}</button>`
    )
    .join('');

  actionsEl.querySelectorAll('[data-today-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-today-action');
      const tab = key || 'hub';
      document
        .querySelector(`[data-hub-tab="${tab}"]`)
        ?.dispatchEvent(new Event('click', { bubbles: true }));
    });
  });
}

async function refreshTodayPanel(uid) {
  const projectId = getProjectId();
  if (!uid) {
    renderTodayPanel({
      role: 'employee_line',
      summary: 'Sign in to load your shift priorities.',
      metrics: [
        { label: 'Opening checks', value: '—' },
        { label: 'Attention flags', value: '—' },
        { label: 'Temp logs today', value: '—' },
        { label: 'Team posts today', value: '—' }
      ],
      actions: [{ key: 'hub', label: 'Open Home' }]
    });
    return;
  }

  if (!db || !projectId || projectId === 'mobile-default') {
    renderTodayPanel({
      role: currentRoleForProject(projectId),
      summary: 'Pick a workspace above to load checks, logs, and handoff activity.',
      metrics: [
        { label: 'Opening checks', value: '0' },
        { label: 'Attention flags', value: '0' },
        { label: 'Temp logs today', value: '0' },
        { label: 'Team posts today', value: '0' }
      ],
      actions: [
        { key: 'hub', label: 'Open Home' },
        { key: 'temps', label: 'Log temps' }
      ]
    });
    return;
  }

  const today = isoDayKey();
  const model = {
    role: currentRoleForProject(projectId),
    summary: 'Loading today’s priorities…',
    metrics: [
      { label: 'Opening checks', value: '0' },
      { label: 'Attention flags', value: '0' },
      { label: 'Temp logs today', value: '0' },
      { label: 'Team posts today', value: '0' }
    ],
    actions: [
      { key: 'checks', label: 'Run checks' },
      { key: 'team', label: 'Open team log' },
      { key: 'temps', label: 'Log temps' }
    ]
  };

  try {
    const checksSnap = await getDocs(
      query(
        collection(db, 'projects', projectId, 'checklists'),
        orderBy('timestamp', 'desc'),
        limit(40)
      )
    );
    let openingCount = 0;
    let attentionCount = 0;
    checksSnap.forEach(docSnap => {
      const data = docSnap.data() || {};
      if (parseEntryDay(data) !== today) {
        return;
      }
      openingCount += 1;
      if (data.status === 'attention' || data.requiresAttention) {
        attentionCount += 1;
      }
    });
    model.metrics[0].value = String(openingCount);
    model.metrics[1].value = String(attentionCount);
  } catch (error) {
    console.warn('refreshTodayPanel checklists', error);
  }

  try {
    const tempSnap = await getDocs(
      query(
        collection(db, 'users', uid, 'temperature_readings'),
        orderBy('timestamp', 'desc'),
        limit(40)
      )
    );
    let tempCount = 0;
    tempSnap.forEach(docSnap => {
      const data = docSnap.data() || {};
      if (parseEntryDay(data) !== today) {
        return;
      }
      if (data.projectId === projectId || !data.projectId) {
        tempCount += 1;
      }
    });
    model.metrics[2].value = String(tempCount);
  } catch (error) {
    console.warn('refreshTodayPanel temps', error);
  }

  try {
    const dayPostsSnap = await getDocs(
      query(
        collection(db, 'projects', projectId, 'shift_day_posts'),
        where('postDate', '==', today),
        limit(40)
      )
    );
    model.metrics[3].value = String(dayPostsSnap.size || 0);
  } catch (error) {
    console.warn('refreshTodayPanel team posts', error);
  }

  const attention = Number(model.metrics[1].value) || 0;
  model.summary =
    attention > 0
      ? `${attention} check${attention === 1 ? '' : 's'} need corrective action before service.`
      : 'Shift checks look healthy. Keep logs current and post handoff notes.';

  if (
    model.role === 'account_admin' ||
    model.role === 'location_manager' ||
    model.role === 'operations_gm'
  ) {
    model.actions.unshift({ key: 'team', label: 'Review team handoff' });
  }

  renderTodayPanel(model);
}

function showPanel(name) {
  $('auth-panel').hidden = name !== 'auth';
  $('app-panel').hidden = name !== 'app';
}

function switchTab(which) {
  const fridge = which === 'fridge';
  $('tab-fridge').setAttribute('aria-selected', fridge ? 'true' : 'false');
  $('tab-san').setAttribute('aria-selected', fridge ? 'false' : 'true');
  $('panel-fridge').hidden = !fridge;
  $('panel-san').hidden = fridge;
}

function renderFridgeList(units) {
  const ul = $('fridge-list');
  ul.innerHTML = '';
  if (!units.length) {
    ul.innerHTML =
      '<li class="mc-empty">No units yet. Tap <strong>Add fridge</strong>.</li>';
    return;
  }
  for (const u of units) {
    const li = document.createElement('li');
    li.className = 'mc-card';
    const last =
      u.lastReading != null && u.lastReading !== ''
        ? `${u.lastReading}°C last`
        : 'No reading yet';
    li.innerHTML = `
      <div class="mc-card-row">
        <strong>${escapeHtml(u.name)}</strong>
        <span class="mc-hint">${escapeHtml(last)}</span>
      </div>
      <button type="button" class="mc-btn mc-btn-primary" data-act="temp" data-id="${escapeHtml(u.id)}" data-name="${escapeHtml(u.name)}">
        Log temperature
      </button>`;
    ul.appendChild(li);
  }
  ul.querySelectorAll('button[data-act="temp"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      if (id && name) recordTemp(id, name);
    });
  });
}

function renderSanList(locs) {
  const ul = $('san-list');
  ul.innerHTML = '';
  if (!locs.length) {
    ul.innerHTML =
      '<li class="mc-empty">No stations yet. Tap <strong>Add station</strong>.</li>';
    return;
  }
  for (const loc of locs) {
    const li = document.createElement('li');
    li.className = 'mc-card';
    const req = loc.requiredPPM != null ? loc.requiredPPM : 150;
    const last =
      loc.lastReading != null && loc.lastReading !== ''
        ? `${loc.lastReading} ppm last`
        : 'No check yet';
    li.innerHTML = `
      <div class="mc-card-row">
        <strong>${escapeHtml(loc.name)}</strong>
        <span class="mc-hint">Target ~${escapeHtml(String(req))} ppm · ${escapeHtml(last)}</span>
      </div>
      <button type="button" class="mc-btn mc-btn-primary" data-act="san" data-id="${escapeHtml(loc.id)}" data-name="${escapeHtml(loc.name)}">
        Log sanitizer (ppm)
      </button>`;
    ul.appendChild(li);
  }
  ul.querySelectorAll('button[data-act="san"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      if (id && name) recordSan(id, name);
    });
  });
}

function startListeners(uid) {
  if (!db) return;
  onSnapshot(
    query(collection(db, 'users', uid, REF_UNITS)),
    snap => {
      const units = [];
      snap.forEach(d => units.push({ id: d.id, ...d.data() }));
      renderFridgeList(units);
    },
    err => {
      console.error(err);
      setStatus('Could not load fridges. Check connection and sign-in.', true);
    }
  );
  onSnapshot(
    query(collection(db, 'users', uid, SAN_LOCS)),
    snap => {
      const locs = [];
      snap.forEach(d => locs.push({ id: d.id, ...d.data() }));
      renderSanList(locs);
    },
    err => {
      console.error(err);
      setStatus('Could not load sanitizer stations.', true);
    }
  );
}

async function recordTemp(unitId, unitName) {
  const uid = auth?.currentUser?.uid;
  if (!db || !uid) {
    setStatus('Sign in to save readings.', true);
    return;
  }
  const useF = $('unit-fahrenheit').checked;
  const label = useF ? '°F (cold-holding ≤ 41°F)' : '°C (cold-holding ≤ 5°C)';
  const raw = window.prompt(`Temperature for ${unitName} in ${label}?`, '');
  if (raw == null || raw === '' || Number.isNaN(Number(raw))) return;
  const n = parseFloat(raw);
  const tempC = useF ? fToC(n) : n;
  try {
    await addDoc(collection(db, 'users', uid, 'temperature_readings'), {
      unitId,
      unitName,
      tempC,
      temperature: tempC,
      projectId: getProjectId(),
      timestamp: serverTimestamp()
    });
    await updateDoc(doc(db, 'users', uid, REF_UNITS, unitId), {
      lastReading: tempC,
      lastReadingAt: serverTimestamp()
    });
    setStatus(`Saved ${useF ? `${n}°F` : `${n}°C`} for ${unitName}.`);
  } catch (e) {
    console.error(e);
    setStatus('Could not save temperature. Rules or network issue.', true);
  }
}

async function recordSan(locationId, locationName) {
  const uid = auth?.currentUser?.uid;
  if (!db || !uid) {
    setStatus('Sign in to save checks.', true);
    return;
  }
  const raw = window.prompt(`Sanitizer PPM at ${locationName}?`, '');
  if (raw == null || raw === '' || Number.isNaN(Number(raw))) return;
  const ppm = parseFloat(raw);
  const passed = ppm >= 100 && ppm <= 200;
  try {
    await addDoc(collection(db, 'users', uid, 'sanitizer_readings'), {
      locationId,
      locationName,
      ppm,
      passed,
      projectId: getProjectId(),
      timestamp: serverTimestamp()
    });
    await updateDoc(doc(db, 'users', uid, SAN_LOCS, locationId), {
      lastReading: ppm,
      lastReadingAt: serverTimestamp()
    });
    setStatus(`Saved ${ppm} ppm for ${locationName}.`);
  } catch (e) {
    console.error(e);
    setStatus('Could not save sanitizer check.', true);
  }
}

async function addFridge() {
  const uid = auth?.currentUser?.uid;
  if (!db || !uid) return;
  const name = window.prompt('Fridge or cooler name (e.g. Walk-in 1)?', '');
  if (!name || !name.trim()) return;
  try {
    await addDoc(collection(db, 'users', uid, REF_UNITS), {
      name: name.trim(),
      type: 'Refrigerator',
      minTemp: 0,
      maxTemp: 5,
      projectId: getProjectId(),
      createdAt: serverTimestamp()
    });
    setStatus(`Added ${name.trim()}.`);
  } catch (e) {
    console.error(e);
    setStatus('Could not add unit.', true);
  }
}

async function addSanStation() {
  const uid = auth?.currentUser?.uid;
  if (!db || !uid) return;
  const name = window.prompt('Sanitizer station name (e.g. 3-comp sink)?', '');
  if (!name || !name.trim()) return;
  try {
    await addDoc(collection(db, 'users', uid, SAN_LOCS), {
      name: name.trim(),
      requiredPPM: 150,
      projectId: getProjectId(),
      createdAt: serverTimestamp()
    });
    setStatus(`Added ${name.trim()}.`);
  } catch (e) {
    console.error(e);
    setStatus('Could not add station.', true);
  }
}

function ensureSiteId() {
  if (localStorage.getItem('iterum_mobile_site_prompted')) return;
  const site = window.prompt(
    'Kitchen or site label for these logs (optional — helps separate sites in reports):',
    localStorage.getItem('iterum_mobile_site_id') || ''
  );
  localStorage.setItem('iterum_mobile_site_prompted', '1');
  if (site && site.trim()) {
    localStorage.setItem('iterum_mobile_site_id', site.trim());
  }
}

function persistProjectId(uid, projectId) {
  try {
    localStorage.setItem('iterum_current_project', projectId);
    localStorage.setItem('userCurrentProjectKey', projectId);
    localStorage.setItem(`iterum_current_project_user_${uid}`, projectId);
  } catch {
    /* ignore */
  }
}

function migrateLegacyMobileDefault() {
  try {
    const cur =
      localStorage.getItem('iterum_current_project') ||
      localStorage.getItem('userCurrentProjectKey');
    if (cur === 'mobile-default') {
      localStorage.removeItem('iterum_current_project');
      localStorage.removeItem('userCurrentProjectKey');
    }
  } catch {
    /* ignore */
  }
}

function updateWorkspaceFirstRunVisibility(uid) {
  const personalList = loadPersonalProjects(uid);
  const card = document.getElementById('workspace-first-run');
  const addBtn = document.getElementById('btn-add-personal-workspace');
  if (card) {
    const showFirstRun =
      myProjectRows.length === 0 &&
      !hasNamedPersonalWorkspace(uid) &&
      personalList.length === 0;
    card.style.display = showFirstRun ? 'block' : 'none';
  }
  if (addBtn) {
    addBtn.style.display =
      myProjectRows.length > 0 || personalList.length > 0 ? 'block' : 'none';
  }
  setWorkspaceReadyGlobally(uid);
}

function wirePersonalWorkspaceUi(uid, email) {
  const firstSave = document.getElementById('btn-save-workspace-first');
  const nameEl = document.getElementById('ws-name');
  const aboutEl = document.getElementById('ws-about');
  const addBtn = document.getElementById('btn-add-personal-workspace');
  const extraWrap = document.getElementById('extra-workspace-fields');
  const extraName = document.getElementById('ws-extra-name');
  const extraAbout = document.getElementById('ws-extra-about');
  const extraSave = document.getElementById('btn-save-extra-workspace');
  const extraCancel = document.getElementById('btn-cancel-extra-workspace');

  if (firstSave && !firstSave.dataset.bound) {
    firstSave.dataset.bound = '1';
    firstSave.addEventListener('click', async () => {
      const name = (nameEl && nameEl.value) || '';
      const about = (aboutEl && aboutEl.value) || '';
      setStatus('Saving…');
      const res = await createPersonalWorkspace(uid, name, about, email);
      if (!res.ok) {
        setStatus(res.error || 'Could not save.', true);
        return;
      }
      if (nameEl) {
        nameEl.value = '';
      }
      if (aboutEl) {
        aboutEl.value = '';
      }
      setStatus('Workspace saved. Pick it above if needed, then use Home.');
      await refreshProjectPicker(uid);
    });
  }

  if (addBtn && !addBtn.dataset.bound) {
    addBtn.dataset.bound = '1';
    addBtn.addEventListener('click', () => {
      if (extraWrap) {
        extraWrap.style.display =
          extraWrap.style.display === 'none' ? 'block' : 'none';
      }
      if (extraName) {
        extraName.value = '';
      }
      if (extraAbout) {
        extraAbout.value = '';
      }
    });
  }

  if (extraSave && !extraSave.dataset.bound) {
    extraSave.dataset.bound = '1';
    extraSave.addEventListener('click', async () => {
      const name = (extraName && extraName.value) || '';
      const about = (extraAbout && extraAbout.value) || '';
      setStatus('Saving…');
      const res = await createPersonalWorkspace(uid, name, about, email);
      if (!res.ok) {
        setStatus(res.error || 'Could not save.', true);
        return;
      }
      if (extraWrap) {
        extraWrap.style.display = 'none';
      }
      setStatus('Personal workspace added.');
      await refreshProjectPicker(uid);
    });
  }

  if (extraCancel && !extraCancel.dataset.bound) {
    extraCancel.dataset.bound = '1';
    extraCancel.addEventListener('click', () => {
      if (extraWrap) {
        extraWrap.style.display = 'none';
      }
    });
  }
}

async function refreshProjectPicker(uid) {
  migrateLegacyMobileDefault();
  const sel = document.getElementById('project-picker');
  const uidEl = document.getElementById('my-firebase-uid');
  if (uidEl) {
    uidEl.textContent = uid;
  }
  if (!sel) {
    return;
  }
  myProjectRows = [];
  const personalList = loadPersonalProjects(uid);

  if (db) {
    try {
      const q = query(
        collectionGroup(db, 'members'),
        where('authUid', '==', uid)
      );
      const snap = await getDocs(q);
      snap.forEach(d => {
        const pid = d.ref.parent.parent.id;
        myProjectRows.push({ id: pid, role: d.data().role });
      });
    } catch (e) {
      console.error('refreshProjectPicker members', e);
      setStatus(
        'Could not load team projects. If this is new, deploy Firestore indexes (members / authUid).',
        true
      );
    }
  }

  sel.innerHTML = '';

  const opt0 = document.createElement('option');
  opt0.value = '';
  opt0.textContent = 'Choose a workspace…';
  sel.appendChild(opt0);

  if (myProjectRows.length) {
    const og = document.createElement('optgroup');
    og.label = 'Team locations';
    for (const row of myProjectRows) {
      let label = row.id;
      try {
        if (db) {
          const ps = await getDoc(doc(db, 'projects', row.id));
          if (ps.exists()) {
            const data = ps.data();
            const n = data.name || data.projectName;
            if (n) {
              label = n;
            }
          }
        }
      } catch {
        /* keep id */
      }
      const o = document.createElement('option');
      o.value = row.id;
      o.textContent = label;
      og.appendChild(o);
    }
    sel.appendChild(og);
  }

  if (personalList.length) {
    const ogP = document.createElement('optgroup');
    ogP.label = 'My workspaces';
    for (const p of personalList) {
      if (!p || !p.id) {
        continue;
      }
      const o = document.createElement('option');
      o.value = p.id;
      const isMaster = p.id === 'master';
      o.textContent = isMaster
        ? `${p.name || 'Master'} (all my data)`
        : p.name || p.id;
      ogP.appendChild(o);
    }
    sel.appendChild(ogP);
  }

  let cur = getProjectId();
  if (cur === 'mobile-default' || !cur) {
    cur = '';
  }

  if (
    cur &&
    (myProjectRows.some(r => r.id === cur) ||
      personalList.some(p => p.id === cur))
  ) {
    sel.value = cur;
  } else if (myProjectRows.length === 1 && !hasNamedPersonalWorkspace(uid)) {
    sel.value = myProjectRows[0].id;
    persistProjectId(uid, myProjectRows[0].id);
  } else if (
    personalList.length === 1 &&
    myProjectRows.length === 0 &&
    personalList[0].id === 'master'
  ) {
    sel.value = 'master';
    persistProjectId(uid, 'master');
  } else if (
    personalList.length === 1 &&
    hasNamedPersonalWorkspace(uid) &&
    myProjectRows.length === 0
  ) {
    const only = personalList.find(p => p.id !== 'master') || personalList[0];
    if (only) {
      sel.value = only.id;
      persistProjectId(uid, only.id);
    }
  } else {
    sel.value = '';
  }

  sel.onchange = () => {
    const v = sel.value;
    if (v) {
      persistProjectId(uid, v);
      try {
        const picked = personalList.find(p => p.id === v);
        if (picked && picked.name) {
          localStorage.setItem('active_project_name', picked.name);
        }
      } catch {
        /* ignore */
      }
      setStatus('Workspace saved.');
    }
    setWorkspaceReadyGlobally(uid);
    void refreshTodayPanel(uid);
  };

  updateWorkspaceFirstRunVisibility(uid);

  const u = auth?.currentUser;
  wirePersonalWorkspaceUi(uid, u?.email || '');
}

function ensureSiteIdIfNoTeamProjects() {
  if (myProjectRows.length > 0) {
    return;
  }
  ensureSiteId();
}

function wireAuth() {
  $('btn-signin').addEventListener('click', async () => {
    const email = $('auth-email').value.trim();
    const pass = $('auth-password').value;
    if (!email || !pass) {
      setStatus('Enter email and password.', true);
      return;
    }
    try {
      setStatus('Signing in…');
      await signInWithEmailAndPassword(auth, email, pass);
      setStatus('Signed in.');
    } catch (e) {
      console.error(e);
      setStatus(friendlyAuthMessage(e), true);
    }
  });

  $('btn-signup').addEventListener('click', async () => {
    const nameRaw = $('auth-name').value.trim();
    const email = $('auth-email').value.trim();
    const pass = $('auth-password').value;
    const pass2 = $('auth-password2').value;
    if (!email || !pass) {
      setStatus('Enter email and password (min 6 characters).', true);
      return;
    }
    if (pass.length < 6) {
      setStatus('Password must be at least 6 characters.', true);
      return;
    }
    if (pass !== pass2) {
      setStatus('Passwords do not match. Re-enter confirm password.', true);
      return;
    }
    const displayName =
      nameRaw || (email.includes('@') ? email.split('@')[0] : email) || 'User';
    try {
      setStatus('Creating account…');
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const u = cred.user;
      if (displayName && u) {
        await updateProfile(u, { displayName });
      }
      try {
        if (u) {
          await sendEmailVerification(u);
        }
      } catch (verErr) {
        console.warn('sendEmailVerification', verErr);
      }
      setStatus(
        'Account created. Check your email to verify. You are signed in.'
      );
    } catch (e) {
      console.error(e);
      setStatus(friendlyAuthMessage(e), true);
    }
  });

  $('btn-google').addEventListener('click', async () => {
    try {
      setStatus('Opening Google…');
      const prov = new GoogleAuthProvider();
      prov.setCustomParameters({ prompt: 'select_account' });
      if (isNativeCapacitor()) {
        await signInWithRedirect(auth, prov);
        return;
      }
      await signInWithPopup(auth, prov);
      setStatus('Signed in with Google.');
    } catch (e) {
      console.error(e);
      setStatus(friendlyAuthMessage(e), true);
    }
  });

  $('btn-signout').addEventListener('click', async () => {
    try {
      await signOut(auth);
      setStatus('Signed out.');
    } catch (e) {
      console.error(e);
    }
  });

  const copyBtn = document.getElementById('copy-uid');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const uid = auth?.currentUser?.uid;
      if (!uid) {
        setStatus('Sign in first.', true);
        return;
      }
      try {
        await navigator.clipboard.writeText(uid);
        setStatus('ID copied. Send it to your manager.');
      } catch {
        setStatus(
          'Could not copy automatically. Long-press the ID above.',
          true
        );
      }
    });
  }

  $('tab-fridge').addEventListener('click', () => switchTab('fridge'));
  $('tab-san').addEventListener('click', () => switchTab('san'));
  $('btn-add-fridge').addEventListener('click', () => addFridge());
  $('btn-add-san').addEventListener('click', () => addSanStation());

  window.addEventListener('lineShowTemps', () => switchTab('fridge'));
}

export function initMobileCompliance() {
  if (!window.firebaseConfig) {
    setStatus('Firebase config missing.', true);
    return;
  }
  wireAuth();
  const app = getApps().length
    ? getApp()
    : initializeApp(window.firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  let profileEnsuredThisSession = false;

  getRedirectResult(auth)
    .then(() => {
      /* user available via onAuthStateChanged */
    })
    .catch(e => {
      console.warn('getRedirectResult', e);
    });

  onAuthStateChanged(auth, user => {
    if (user) {
      persistLocalWebSession(user);
      if (!profileEnsuredThisSession) {
        profileEnsuredThisSession = true;
        void ensureUserProfileDoc(user);
      }
      const chip = user.displayName || user.email || user.uid.slice(0, 8) + '…';
      $('user-chip').textContent = chip;
      showPanel('app');
      startListeners(user.uid);
      switchTab('fridge');
      refreshProjectPicker(user.uid)
        .then(() => {
          void refreshTodayPanel(user.uid);
          ensureSiteIdIfNoTeamProjects();
          setStatus(
            isWorkspaceReady(user.uid)
              ? 'Pick a workspace above, then open Home for menu, lists, and checks.'
              : 'Name your workspace below, or choose a team location when your manager adds you.'
          );
        })
        .catch(() => {
          setStatus('Signed in — set workspace if prompted.', true);
        });
    } else {
      profileEnsuredThisSession = false;
      showPanel('auth');
      $('user-chip').textContent = '';
      myProjectRows = [];
      void refreshTodayPanel('');
      setStatus('Sign in to use shift tools.');
    }
  });

  attachLineEmployeeHub({
    getDb: () => db,
    getAuth: () => auth,
    getProjectId,
    setStatus,
    escapeHtml
  });
}
