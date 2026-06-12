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
  Timestamp,
  updateDoc,
  where
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

import { attachLineEmployeeHub } from './mobile-line-employee.js';

const REF_UNITS = 'refrigeration_units';
const SAN_LOCS = 'sanitizer_locations';

/** @type {{ id: string, role?: string }[]} */
let myProjectRows = [];

/** Avoid duplicate visibility/pageshow handlers if init runs more than once. */
let workspaceResumeListenersBound = false;

/** @type {(() => void)[]} */
let readingsLogUnsubs = [];

/** @type {import('firebase/firestore').QueryDocumentSnapshot[] | null} */
let cachedTempReadingDocs = null;

/** @type {import('firebase/firestore').QueryDocumentSnapshot[] | null} */
let cachedSanReadingDocs = null;

let haccpReminderIntervalId = null;

/** @type {{ year: number, monthIndex: number }} Month in local time (monthIndex 0–11). */
let complianceCalendarCursor = {
  year: new Date().getFullYear(),
  monthIndex: new Date().getMonth()
};

/** @type {string | null} */
let complianceCalendarSelectedDay = null;

/** @type {Map<string, { temps: Record<string, unknown>[], sans: Record<string, unknown>[], posts: Record<string, unknown>[], checks: Record<string, unknown>[] }> | null} */
let complianceArchiveByDay = null;

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

/** Local calendar YYYY-MM-DD (kitchen “day” for logs and archive). */
function localDayKeyFromDate(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseEntryDay(entry) {
  if (
    entry?.dateKey &&
    typeof entry.dateKey === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.dateKey)
  ) {
    return entry.dateKey;
  }
  const raw = entry?.timestamp || entry?.createdAt || entry?.updatedAt || null;
  if (!raw) {
    return '';
  }
  if (raw?.toDate) {
    return localDayKeyFromDate(raw.toDate());
  }
  return localDayKeyFromDate(raw);
}

/**
 * @param {import('firebase/firestore').Timestamp | Date | null | undefined} ts
 */
function formatReadingDateTime(ts) {
  if (!ts) {
    return '—';
  }
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    if (Number.isNaN(d.getTime())) {
      return '—';
    }
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

function complianceReadingMatchesProject(data, projectId) {
  if (!projectId || projectId === 'mobile-default' || projectId === 'master') {
    return true;
  }
  return data.projectId === projectId || !data.projectId;
}

function stopReadingsLogListeners() {
  while (readingsLogUnsubs.length) {
    const u = readingsLogUnsubs.pop();
    try {
      u();
    } catch (e) {
      console.warn('stopReadingsLogListeners', e);
    }
  }
  cachedTempReadingDocs = null;
  cachedSanReadingDocs = null;
}

function rerenderComplianceLogLists() {
  if (cachedTempReadingDocs) {
    renderTemperatureLogList(cachedTempReadingDocs);
  } else {
    renderTemperatureLogList([]);
  }
  if (cachedSanReadingDocs) {
    renderSanitizerLogList(cachedSanReadingDocs);
  } else {
    renderSanitizerLogList([]);
  }
}

/**
 * @param {import('firebase/firestore').QueryDocumentSnapshot[]} docs
 */
function renderTemperatureLogList(docs) {
  const todayWrap = document.getElementById('temp-log-today');
  if (!todayWrap) {
    return;
  }
  const projectId = getProjectId();
  const todayKey = localDayKeyFromDate(new Date());
  const rows = [];
  docs.forEach(d => {
    const data = d.data() || {};
    if (!complianceReadingMatchesProject(data, projectId)) {
      return;
    }
    rows.push({ id: d.id, data });
  });
  const todayRows = rows.filter(r => parseEntryDay(r.data) === todayKey);

  const useF = $('unit-fahrenheit').checked;
  const fmtTemp = tempC => {
    const c = Number(tempC);
    if (!Number.isFinite(c)) {
      return '—';
    }
    if (useF) {
      const f = (c * 9) / 5 + 32;
      return String(Math.round(f * 10) / 10);
    }
    return String(Math.round(c * 10) / 10);
  };

  const lineHtml = list =>
    list
      .map(r => {
        const t = r.data.timestamp;
        const when = formatReadingDateTime(t);
        const unit = escapeHtml(r.data.unitName || r.data.unitId || '—');
        const suffix = useF ? '°F' : '°C';
        const val = fmtTemp(r.data.tempC ?? r.data.temperature);
        return `<li class="mc-log-line"><span class="mc-log-when">${escapeHtml(when)}</span><span class="mc-log-body"><strong>${unit}</strong> · ${escapeHtml(String(val))}${suffix}</span></li>`;
      })
      .join('');

  todayWrap.innerHTML = todayRows.length
    ? `<ul class="mc-list mc-log-list">${lineHtml(
        [...todayRows].sort((a, b) => {
          const ta = a.data.timestamp?.toMillis?.() || 0;
          const tb = b.data.timestamp?.toMillis?.() || 0;
          return tb - ta;
        })
      )}</ul>`
    : '<p class="mc-hint mc-hint-top0">No temperatures logged yet today. Open <strong>Compliance calendar</strong> for past days.</p>';
}

/**
 * @param {import('firebase/firestore').QueryDocumentSnapshot[]} docs
 */
function renderSanitizerLogList(docs) {
  const todayWrap = document.getElementById('san-log-today');
  if (!todayWrap) {
    return;
  }
  const projectId = getProjectId();
  const todayKey = localDayKeyFromDate(new Date());
  const rows = [];
  docs.forEach(d => {
    const data = d.data() || {};
    if (!complianceReadingMatchesProject(data, projectId)) {
      return;
    }
    rows.push({ id: d.id, data });
  });
  const todayRows = rows.filter(r => parseEntryDay(r.data) === todayKey);

  const lineHtml = list =>
    list
      .map(r => {
        const t = r.data.timestamp;
        const when = formatReadingDateTime(t);
        const loc = escapeHtml(r.data.locationName || r.data.locationId || '—');
        const ppm = r.data.ppm;
        const pass =
          r.data.passed === true
            ? '<span class="mc-pass">pass</span>'
            : r.data.passed === false
              ? '<span class="mc-fail">check</span>'
              : '';
        return `<li class="mc-log-line"><span class="mc-log-when">${escapeHtml(when)}</span><span class="mc-log-body"><strong>${loc}</strong> · ${escapeHtml(String(ppm ?? '—'))} ppm ${pass}</span></li>`;
      })
      .join('');

  todayWrap.innerHTML = todayRows.length
    ? `<ul class="mc-list mc-log-list">${lineHtml(
        [...todayRows].sort((a, b) => {
          const ta = a.data.timestamp?.toMillis?.() || 0;
          const tb = b.data.timestamp?.toMillis?.() || 0;
          return tb - ta;
        })
      )}</ul>`
    : '<p class="mc-hint mc-hint-top0">No sanitizer checks yet today. Past days are in the compliance calendar.</p>';
}

function monthKeyBounds(year, monthIndex) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return {
    monthStartKey: localDayKeyFromDate(start),
    monthEndKey: localDayKeyFromDate(end),
    daysInMonth: new Date(year, monthIndex + 1, 0).getDate()
  };
}

function readingMs(data) {
  const t = data?.timestamp;
  if (t?.toMillis) {
    return t.toMillis();
  }
  return 0;
}

/**
 * @param {string} uid
 * @param {'temperature_readings'|'sanitizer_readings'} subcoll
 * @param {string} monthStartKey
 * @param {string} monthEndKey
 * @param {string} projectId
 */
async function fetchUserReadingsForMonth(
  uid,
  subcoll,
  monthStartKey,
  monthEndKey,
  projectId
) {
  const byId = new Map();
  const ingest = snap => {
    snap.forEach(d => {
      const data = d.data() || {};
      if (!complianceReadingMatchesProject(data, projectId)) {
        return;
      }
      byId.set(d.id, { id: d.id, ...data });
    });
  };
  if (db) {
    try {
      const q1 = query(
        collection(db, 'users', uid, subcoll),
        where('dateKey', '>=', monthStartKey),
        where('dateKey', '<=', monthEndKey),
        limit(500)
      );
      ingest(await getDocs(q1));
    } catch (e) {
      console.warn('fetchUserReadingsForMonth dateKey', subcoll, e);
    }
    try {
      const start = new Date(`${monthStartKey}T00:00:00`);
      const end = new Date(`${monthEndKey}T23:59:59.999`);
      const q2 = query(
        collection(db, 'users', uid, subcoll),
        where('timestamp', '>=', Timestamp.fromDate(start)),
        where('timestamp', '<=', Timestamp.fromDate(end)),
        limit(500)
      );
      ingest(await getDocs(q2));
    } catch (e) {
      console.warn('fetchUserReadingsForMonth timestamp', subcoll, e);
    }
  }
  return [...byId.values()];
}

/**
 * @param {string} projectId
 * @param {string} monthStartKey
 * @param {string} monthEndKey
 */
async function fetchShiftPostsForMonth(projectId, monthStartKey, monthEndKey) {
  const out = [];
  if (!db || !projectId || projectId === 'mobile-default') {
    return out;
  }
  try {
    const q = query(
      collection(db, 'projects', projectId, 'shift_day_posts'),
      where('dateKey', '>=', monthStartKey),
      where('dateKey', '<=', monthEndKey),
      limit(500)
    );
    const snap = await getDocs(q);
    snap.forEach(d => out.push({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('fetchShiftPostsForMonth', e);
  }
  return out;
}

/**
 * @param {string} projectId
 * @param {string} monthStartKey
 * @param {string} monthEndKey
 */
async function fetchChecklistsForMonth(projectId, monthStartKey, monthEndKey) {
  const out = [];
  if (!db || !projectId || projectId === 'mobile-default') {
    return out;
  }
  try {
    let snap;
    try {
      snap = await getDocs(
        query(
          collection(db, 'projects', projectId, 'checklists'),
          orderBy('timestamp', 'desc'),
          limit(400)
        )
      );
    } catch {
      snap = await getDocs(
        query(collection(db, 'projects', projectId, 'checklists'), limit(400))
      );
    }
    snap.forEach(d => {
      const data = d.data() || {};
      if (!complianceReadingMatchesProject(data, projectId)) {
        return;
      }
      const day = parseEntryDay(data);
      if (day && day >= monthStartKey && day <= monthEndKey) {
        out.push({ id: d.id, ...data });
      }
    });
  } catch (e) {
    console.warn('fetchChecklistsForMonth', e);
  }
  return out;
}

function buildComplianceArchiveByDay(temps, sans, posts, checks) {
  /** @type {Map<string, { temps: Record<string, unknown>[], sans: Record<string, unknown>[], posts: Record<string, unknown>[], checks: Record<string, unknown>[] }>} */
  const byDay = new Map();
  const touch = dayKey => {
    if (!byDay.has(dayKey)) {
      byDay.set(dayKey, {
        temps: [],
        sans: [],
        posts: [],
        checks: []
      });
    }
    return byDay.get(dayKey);
  };
  for (const row of temps) {
    const k = parseEntryDay(row);
    if (k) {
      touch(k).temps.push(row);
    }
  }
  for (const row of sans) {
    const k = parseEntryDay(row);
    if (k) {
      touch(k).sans.push(row);
    }
  }
  for (const row of posts) {
    const k =
      typeof row.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.dateKey)
        ? row.dateKey
        : parseEntryDay(row);
    if (k) {
      touch(k).posts.push(row);
    }
  }
  for (const row of checks) {
    const k = parseEntryDay(row);
    if (k) {
      touch(k).checks.push(row);
    }
  }
  for (const [, bundle] of byDay) {
    bundle.temps.sort((a, b) => readingMs(b) - readingMs(a));
    bundle.sans.sort((a, b) => readingMs(b) - readingMs(a));
    bundle.posts.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return tb - ta;
    });
    bundle.checks.sort((a, b) => {
      const sa = String(a.timestamp || a.createdAt || '');
      const sb = String(b.timestamp || b.createdAt || '');
      return sb.localeCompare(sa);
    });
  }
  return byDay;
}

function setComplianceArchiveModalOpen(open) {
  const modal = document.getElementById('compliance-archive-modal');
  if (!modal) {
    return;
  }
  modal.hidden = !open;
  modal.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (open) {
    document.getElementById('btn-close-compliance-calendar')?.focus();
  }
}

function renderComplianceCalendarGrid(year, monthIndex, byDay) {
  const grid = document.getElementById('cal-grid');
  const label = document.getElementById('cal-month-label');
  if (!grid || !label) {
    return;
  }
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  label.textContent = `${monthNames[monthIndex]} ${year}`;

  const firstDow = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();
  const todayK = localDayKeyFromDate(new Date());
  const cells = [];

  for (let i = 0; i < firstDow; i += 1) {
    const d = prevMonthDays - firstDow + i + 1;
    cells.push({ type: 'muted', day: d, key: null });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ type: 'day', day: d, key });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ type: 'muted', day: null, key: null });
  }

  grid.innerHTML = '';
  for (const c of cells) {
    if (c.type === 'muted') {
      const placeholder = document.createElement('div');
      placeholder.className = 'mc-cal-day mc-cal-day--muted';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.innerHTML =
        c.day != null ? `<span class="mc-cal-day-num">${c.day}</span>` : '';
      grid.appendChild(placeholder);
      continue;
    }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mc-cal-day';
    const bundle = c.key ? byDay?.get(c.key) : null;
    const busy =
      bundle &&
      (bundle.temps.length > 0 ||
        bundle.sans.length > 0 ||
        bundle.posts.length > 0 ||
        bundle.checks.length > 0);
    if (busy) {
      btn.classList.add('mc-cal-day--busy');
    }
    if (c.key === todayK) {
      btn.classList.add('mc-cal-day--today');
    }
    if (c.key && c.key === complianceCalendarSelectedDay) {
      btn.classList.add('mc-cal-day--selected');
    }
    btn.dataset.dayKey = c.key || '';
    btn.innerHTML = `<span class="mc-cal-day-num">${c.day}</span>`;
    btn.addEventListener('click', () => {
      if (!c.key) {
        return;
      }
      complianceCalendarSelectedDay = c.key;
      renderComplianceCalendarGrid(year, monthIndex, byDay);
      const b = byDay?.get(c.key) || {
        temps: [],
        sans: [],
        posts: [],
        checks: []
      };
      renderComplianceCalendarDayDetail(c.key, b);
    });
    grid.appendChild(btn);
  }
}

function summarizeChecklistEntry(data) {
  const raw = data?.data;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const st = raw.station != null ? String(raw.station) : '';
    const n = raw.notes != null ? String(raw.notes) : '';
    const bits = [st, n].filter(Boolean);
    if (bits.length) {
      return bits.join(' — ');
    }
  }
  if (raw != null && typeof raw !== 'object') {
    return String(raw).slice(0, 180);
  }
  return '';
}

function renderComplianceCalendarDayDetail(dayKey, bundle) {
  const el = document.getElementById('cal-day-detail');
  if (!el) {
    return;
  }
  if (!dayKey) {
    el.innerHTML =
      '<p class="mc-hint">Select a date on the calendar to see details.</p>';
    return;
  }
  const b = bundle || {
    temps: [],
    sans: [],
    posts: [],
    checks: []
  };
  if (
    !b.temps.length &&
    !b.sans.length &&
    !b.posts.length &&
    !b.checks.length
  ) {
    el.innerHTML = `<h3 class="mc-section-title mc-section-title-top0">${escapeHtml(dayKey)}</h3><p class="mc-hint">No temperatures, sanitizer checks, team notes, or checklist entries for this day.</p>`;
    return;
  }
  const useF = document.getElementById('unit-fahrenheit')?.checked !== false;
  const fmtTemp = tempC => {
    const c = Number(tempC);
    if (!Number.isFinite(c)) {
      return '—';
    }
    if (useF) {
      const f = (c * 9) / 5 + 32;
      return String(Math.round(f * 10) / 10);
    }
    return String(Math.round(c * 10) / 10);
  };
  const suffix = useF ? '°F' : '°C';

  const tempSection =
    b.temps.length === 0
      ? ''
      : `<div class="mc-cal-detail-section"><h4>Temperatures</h4><ul class="mc-cal-detail-list">${b.temps
          .map(row => {
            const when = formatReadingDateTime(row.timestamp);
            const unit = escapeHtml(String(row.unitName || row.unitId || '—'));
            const val = fmtTemp(row.tempC ?? row.temperature);
            return `<li><span class="mc-log-when">${escapeHtml(when)}</span> — <strong>${unit}</strong> ${escapeHtml(String(val))}${suffix}</li>`;
          })
          .join('')}</ul></div>`;

  const sanSection =
    b.sans.length === 0
      ? ''
      : `<div class="mc-cal-detail-section"><h4>Sanitizer</h4><ul class="mc-cal-detail-list">${b.sans
          .map(row => {
            const when = formatReadingDateTime(row.timestamp);
            const loc = escapeHtml(
              String(row.locationName || row.locationId || '—')
            );
            const pass =
              row.passed === true
                ? 'pass'
                : row.passed === false
                  ? 'review'
                  : '';
            return `<li><span class="mc-log-when">${escapeHtml(when)}</span> — <strong>${loc}</strong> ${escapeHtml(String(row.ppm ?? '—'))} ppm${pass ? ` · ${escapeHtml(pass)}` : ''}</li>`;
          })
          .join('')}</ul></div>`;

  const postSection =
    b.posts.length === 0
      ? ''
      : `<div class="mc-cal-detail-section"><h4>Team log</h4><ul class="mc-cal-detail-list">${b.posts
          .map(row => {
            const author = escapeHtml(String(row.authorName || 'Team'));
            const kind = escapeHtml(String(row.category || row.priority || ''));
            const body = escapeHtml(
              String(row.body || '')
                .trim()
                .slice(0, 800)
            );
            return `<li><strong>${author}</strong>${kind ? ` · ${kind}` : ''}<div class="mc-hint mc-note-inline">${body}</div></li>`;
          })
          .join('')}</ul></div>`;

  const checkSection =
    b.checks.length === 0
      ? ''
      : `<div class="mc-cal-detail-section"><h4>Checks &amp; changes</h4><ul class="mc-cal-detail-list">${b.checks
          .map(row => {
            const title = escapeHtml(
              String(row.templateName || row.templateId || 'Check')
            );
            const when = escapeHtml(
              String(row.timestamp || row.createdAt || '—')
            );
            const detail = summarizeChecklistEntry(row);
            const detailHtml = detail
              ? `<div class="mc-hint mc-note-inline">${escapeHtml(detail)}</div>`
              : '';
            return `<li><strong>${title}</strong><div class="mc-hint">${when}</div>${detailHtml}</li>`;
          })
          .join('')}</ul></div>`;

  el.innerHTML = `<h3 class="mc-section-title mc-section-title-top0">${escapeHtml(dayKey)}</h3>${tempSection}${sanSection}${postSection}${checkSection}`;
}

async function loadComplianceArchiveMonthIntoModal() {
  const statusEl = document.getElementById('compliance-archive-status');
  const uid = auth?.currentUser?.uid;
  const projectId = getProjectId();
  const { year, monthIndex } = complianceCalendarCursor;

  if (!uid) {
    if (statusEl) {
      statusEl.textContent = 'Sign in to load the compliance calendar.';
    }
    complianceArchiveByDay = new Map();
    complianceCalendarSelectedDay = null;
    renderComplianceCalendarGrid(year, monthIndex, complianceArchiveByDay);
    const det = document.getElementById('cal-day-detail');
    if (det) {
      det.innerHTML =
        '<p class="mc-hint">Sign in, then reopen the calendar.</p>';
    }
    return;
  }
  if (!projectId || projectId === 'mobile-default') {
    if (statusEl) {
      statusEl.textContent =
        'Pick a workspace to load team notes, checks, and logs on the calendar.';
    }
    complianceArchiveByDay = new Map();
    complianceCalendarSelectedDay = null;
    renderComplianceCalendarGrid(year, monthIndex, complianceArchiveByDay);
    const det = document.getElementById('cal-day-detail');
    if (det) {
      det.innerHTML =
        '<p class="mc-hint">Choose your location above, then reload the calendar.</p>';
    }
    return;
  }

  if (statusEl) {
    statusEl.textContent = 'Loading this month…';
  }
  const bounds = monthKeyBounds(year, monthIndex);
  try {
    const [temps, sans, posts, checks] = await Promise.all([
      fetchUserReadingsForMonth(
        uid,
        'temperature_readings',
        bounds.monthStartKey,
        bounds.monthEndKey,
        projectId
      ),
      fetchUserReadingsForMonth(
        uid,
        'sanitizer_readings',
        bounds.monthStartKey,
        bounds.monthEndKey,
        projectId
      ),
      fetchShiftPostsForMonth(
        projectId,
        bounds.monthStartKey,
        bounds.monthEndKey
      ),
      fetchChecklistsForMonth(
        projectId,
        bounds.monthStartKey,
        bounds.monthEndKey
      )
    ]);
    complianceArchiveByDay = buildComplianceArchiveByDay(
      temps,
      sans,
      posts,
      checks
    );

    const todayK = localDayKeyFromDate(new Date());
    let selectKey = null;
    if (todayK >= bounds.monthStartKey && todayK <= bounds.monthEndKey) {
      selectKey = todayK;
    } else {
      for (let d = bounds.daysInMonth; d >= 1; d -= 1) {
        const k = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const b = complianceArchiveByDay.get(k);
        if (
          b &&
          (b.temps.length > 0 ||
            b.sans.length > 0 ||
            b.posts.length > 0 ||
            b.checks.length > 0)
        ) {
          selectKey = k;
          break;
        }
      }
    }
    complianceCalendarSelectedDay = selectKey;
    renderComplianceCalendarGrid(year, monthIndex, complianceArchiveByDay);
    if (selectKey) {
      renderComplianceCalendarDayDetail(
        selectKey,
        complianceArchiveByDay.get(selectKey)
      );
    } else {
      complianceCalendarSelectedDay = null;
      const det = document.getElementById('cal-day-detail');
      if (det) {
        det.innerHTML =
          '<p class="mc-hint">No temperatures, sanitizer checks, team log posts, or checklist entries for this month in this workspace.</p>';
      }
    }
    if (statusEl) {
      statusEl.textContent = `${bounds.monthStartKey} — ${bounds.monthEndKey} · Tap a date (dot = activity).`;
    }
  } catch (e) {
    console.error('loadComplianceArchiveMonthIntoModal', e);
    if (statusEl) {
      statusEl.textContent =
        'Could not load this month. Check connection or Firestore indexes (console may show a link).';
    }
    complianceArchiveByDay = new Map();
    complianceCalendarSelectedDay = null;
    renderComplianceCalendarGrid(year, monthIndex, complianceArchiveByDay);
    const det = document.getElementById('cal-day-detail');
    if (det) {
      det.innerHTML = '<p class="mc-hint">Try again or pick another month.</p>';
    }
  }
}

function wireComplianceArchiveCalendar() {
  const openBtn = document.getElementById('btn-open-compliance-calendar');
  const closeBtn = document.getElementById('btn-close-compliance-calendar');
  const backdrop = document.getElementById('compliance-archive-backdrop');
  const prevBtn = document.getElementById('btn-cal-prev');
  const nextBtn = document.getElementById('btn-cal-next');

  if (openBtn && !openBtn.dataset.bound) {
    openBtn.dataset.bound = '1';
    openBtn.addEventListener('click', () => {
      const now = new Date();
      complianceCalendarCursor = {
        year: now.getFullYear(),
        monthIndex: now.getMonth()
      };
      setComplianceArchiveModalOpen(true);
      void loadComplianceArchiveMonthIntoModal();
    });
  }
  const closeModal = () => {
    setComplianceArchiveModalOpen(false);
  };
  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.dataset.bound = '1';
    closeBtn.addEventListener('click', closeModal);
  }
  if (backdrop && !backdrop.dataset.bound) {
    backdrop.dataset.bound = '1';
    backdrop.addEventListener('click', closeModal);
  }
  if (prevBtn && !prevBtn.dataset.bound) {
    prevBtn.dataset.bound = '1';
    prevBtn.addEventListener('click', () => {
      complianceCalendarCursor.monthIndex -= 1;
      if (complianceCalendarCursor.monthIndex < 0) {
        complianceCalendarCursor.monthIndex = 11;
        complianceCalendarCursor.year -= 1;
      }
      void loadComplianceArchiveMonthIntoModal();
    });
  }
  if (nextBtn && !nextBtn.dataset.bound) {
    nextBtn.dataset.bound = '1';
    nextBtn.addEventListener('click', () => {
      complianceCalendarCursor.monthIndex += 1;
      if (complianceCalendarCursor.monthIndex > 11) {
        complianceCalendarCursor.monthIndex = 0;
        complianceCalendarCursor.year += 1;
      }
      void loadComplianceArchiveMonthIntoModal();
    });
  }
  if (!document.documentElement.dataset.complianceCalEsc) {
    document.documentElement.dataset.complianceCalEsc = '1';
    document.addEventListener('keydown', ev => {
      if (ev.key !== 'Escape') {
        return;
      }
      const modal = document.getElementById('compliance-archive-modal');
      if (modal && !modal.hidden) {
        closeModal();
      }
    });
  }
}

function startReadingsLogListeners(uid) {
  stopReadingsLogListeners();
  if (!db || !uid) {
    rerenderComplianceLogLists();
    return;
  }
  const tempQ = query(
    collection(db, 'users', uid, 'temperature_readings'),
    orderBy('timestamp', 'desc'),
    limit(200)
  );
  const sanQ = query(
    collection(db, 'users', uid, 'sanitizer_readings'),
    orderBy('timestamp', 'desc'),
    limit(200)
  );
  readingsLogUnsubs.push(
    onSnapshot(
      tempQ,
      snap => {
        cachedTempReadingDocs = snap.docs.slice();
        renderTemperatureLogList(snap.docs);
      },
      err => {
        console.error('temperature_readings listener', err);
      }
    )
  );
  readingsLogUnsubs.push(
    onSnapshot(
      sanQ,
      snap => {
        cachedSanReadingDocs = snap.docs.slice();
        renderSanitizerLogList(snap.docs);
      },
      err => {
        console.error('sanitizer_readings listener', err);
      }
    )
  );
}

const HACCP_REMIND_FLAG = 'iterum_haccp_remind_enabled';

function readReminderConfig() {
  try {
    const raw = localStorage.getItem('iterum_haccp_remind_windows');
    if (raw) {
      const j = JSON.parse(raw);
      const am = j?.am || {};
      const pm = j?.pm || {};
      return {
        amStartHour: Number(am.h) || 10,
        amStartMin: Number(am.m) || 0,
        amEndHour: Number(am.endH) || 12,
        amEndMin: Number(am.endM) || 0,
        pmStartHour: Number(pm.h) || 15,
        pmStartMin: Number(pm.m) || 0,
        pmEndHour: Number(pm.endH) || 17,
        pmEndMin: Number(pm.endM) || 30
      };
    }
  } catch {
    /* default */
  }
  return {
    amStartHour: 10,
    amStartMin: 0,
    amEndHour: 12,
    amEndMin: 0,
    pmStartHour: 15,
    pmStartMin: 0,
    pmEndHour: 17,
    pmEndMin: 30
  };
}

function minutesNow(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}

function minutesFrom(h, m) {
  return h * 60 + m;
}

function tryFireHaccpReminders() {
  if (localStorage.getItem(HACCP_REMIND_FLAG) !== '1') {
    return;
  }
  if (
    typeof document !== 'undefined' &&
    document.visibilityState !== 'visible'
  ) {
    return;
  }
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  const cfg = readReminderConfig();
  const now = new Date();
  const today = localDayKeyFromDate(now);
  const mn = minutesNow(now);
  const amA = minutesFrom(cfg.amStartHour, cfg.amStartMin);
  const amB = minutesFrom(cfg.amEndHour, cfg.amEndMin);
  const pmA = minutesFrom(cfg.pmStartHour, cfg.pmStartMin);
  const pmB = minutesFrom(cfg.pmEndHour, cfg.pmEndMin);

  const keyAm = `iterum_haccp_fired_am_${today}`;
  const keyPm = `iterum_haccp_fired_pm_${today}`;

  if (mn >= amA && mn < amB && localStorage.getItem(keyAm) !== '1') {
    localStorage.setItem(keyAm, '1');
    try {
      new Notification('Iterum Shift — morning checks', {
        body: 'Log refrigerator temperatures and sanitizer PPM for your workspace.',
        tag: `haccp-am-${today}`
      });
    } catch (e) {
      console.warn('Notification', e);
    }
  }
  if (mn >= pmA && mn < pmB && localStorage.getItem(keyPm) !== '1') {
    localStorage.setItem(keyPm, '1');
    try {
      new Notification('Iterum Shift — afternoon checks', {
        body: 'Second round: confirm temps and sanitizer on the Temps tab.',
        tag: `haccp-pm-${today}`
      });
    } catch (e) {
      console.warn('Notification', e);
    }
  }
}

function startHaccpReminderScheduler() {
  if (haccpReminderIntervalId) {
    clearInterval(haccpReminderIntervalId);
  }
  haccpReminderIntervalId = setInterval(() => tryFireHaccpReminders(), 60000);
  tryFireHaccpReminders();
}

function wireHaccpReminderControls() {
  const btn = document.getElementById('btn-haccp-notify');
  const hint = document.getElementById('haccp-reminder-hint');
  if (!btn || btn.dataset.bound === '1') {
    return;
  }
  btn.dataset.bound = '1';

  const syncHint = () => {
    const on = localStorage.getItem(HACCP_REMIND_FLAG) === '1';
    const cfg = readReminderConfig();
    const perm =
      typeof Notification !== 'undefined' ? Notification.permission : 'denied';
    if (hint) {
      hint.textContent =
        on && perm === 'granted'
          ? `Reminders on: morning ${cfg.amStartHour}:${String(cfg.amStartMin).padStart(2, '0')}–${cfg.amEndHour}:${String(cfg.amEndMin).padStart(2, '0')}, afternoon ${cfg.pmStartHour}:${String(cfg.pmStartMin).padStart(2, '0')}–${cfg.pmEndHour}:${String(cfg.pmEndMin).padStart(2, '0')} (device local time). Logs show today below; past days move to Archive.`
          : 'Tap the button to allow notifications. We ping once per window (late morning + afternoon) to log temps and sanitizer on this device.';
    }
    btn.textContent =
      on && perm === 'granted'
        ? 'Reminders on (tap to turn off)'
        : 'Enable twice-daily reminders';
  };

  btn.addEventListener('click', async () => {
    const on = localStorage.getItem(HACCP_REMIND_FLAG) === '1';
    if (on) {
      localStorage.removeItem(HACCP_REMIND_FLAG);
      syncHint();
      setStatus('HACCP reminders off for this device.');
      return;
    }
    if (!('Notification' in window)) {
      setStatus('Notifications are not supported in this browser.', true);
      return;
    }
    let perm = Notification.permission;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
    }
    if (perm !== 'granted') {
      setStatus(
        'Allow notifications in the browser or OS settings to use reminders.',
        true
      );
      syncHint();
      return;
    }
    localStorage.setItem(HACCP_REMIND_FLAG, '1');
    syncHint();
    tryFireHaccpReminders();
    setStatus(
      'Twice-daily reminders enabled. Keep this app installed or tab available around shift times.'
    );
  });

  syncHint();
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
    kitchen_manager: 'Manager',
    operations_gm: 'Manager',
    chef_leadership: 'Chef lead',
    sous_chef: 'Sous chef',
    employee_line: 'Line',
    kitchen_staff: 'Kitchen',
    prep_cook: 'Prep',
    line_cook: 'Line cook',
    expeditor: 'Expo',
    dishwasher: 'Dish',
    bakery_pastry: 'Pastry',
    bar_manager: 'Bar manager',
    bartender: 'Bartender',
    host: 'Host',
    front_of_house: 'FOH',
    server: 'Server',
    runner: 'Runner',
    purchasing: 'Purchasing',
    inventory_clerk: 'Inventory',
    consultant_rd: 'R&D',
    support_staff: 'Support'
  };
  return mapping[role] || 'Team';
}

function actionsForRole(role) {
  if (
    role === 'account_admin' ||
    role === 'location_manager' ||
    role === 'operations_gm' ||
    role === 'kitchen_manager'
  ) {
    return [
      { key: 'team', label: 'Review team handoff' },
      { key: 'checks', label: 'Run checks' },
      { key: 'jobs', label: 'Update team jobs' },
      { key: 'temps', label: 'Log temps' }
    ];
  }
  if (role === 'purchasing' || role === 'inventory_clerk') {
    return [
      { key: 'lists', label: 'Review prep/stock' },
      { key: 'team', label: 'Open team log' },
      { key: 'jobs', label: 'Set my job' },
      { key: 'temps', label: 'Log temps' }
    ];
  }
  if (
    role === 'chef_leadership' ||
    role === 'sous_chef' ||
    role === 'consultant_rd'
  ) {
    return [
      { key: 'recipes', label: 'Open recipes' },
      { key: 'checks', label: 'Run checks' },
      { key: 'lists', label: 'Open prep list' },
      { key: 'team', label: 'Open team log' }
    ];
  }
  if (
    role === 'front_of_house' ||
    role === 'server' ||
    role === 'runner' ||
    role === 'host'
  ) {
    return [
      { key: 'menu', label: 'Open menu' },
      { key: 'team', label: 'Open team log' },
      { key: 'jobs', label: 'Set my job' }
    ];
  }
  if (role === 'bartender' || role === 'bar_manager') {
    return [
      { key: 'bar', label: 'Open bar pack' },
      { key: 'team', label: 'Open team log' },
      { key: 'checks', label: 'Run checks' }
    ];
  }
  return [
    { key: 'checks', label: 'Run checks' },
    { key: 'lists', label: 'Open prep list' },
    { key: 'team', label: 'Open team log' },
    { key: 'temps', label: 'Log temps' }
  ];
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
  const summaryAlert =
    typeof model.metrics?.[1]?.value !== 'undefined' &&
    Number(model.metrics[1].value) > 0;
  summaryEl.classList.toggle('alert', summaryAlert);
  metricsEl.innerHTML = model.metrics
    .map(
      item => `<div class="mc-kpi-card">
        <div class="mc-kpi-label">${escapeHtml(item.label)}</div>
        <div class="mc-kpi-value">${escapeHtml(String(item.value))}</div>
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
      summary:
        'Pick a workspace above to load checks, logs, and handoff activity.',
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

  const today = localDayKeyFromDate(new Date());
  const model = {
    role: currentRoleForProject(projectId),
    summary: 'Loading today’s priorities…',
    metrics: [
      { label: 'Opening checks', value: '0' },
      { label: 'Attention flags', value: '0' },
      { label: 'Temp logs today', value: '0' },
      { label: 'Team posts today', value: '0' }
    ],
    actions: actionsForRole(currentRoleForProject(projectId))
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
      if (complianceReadingMatchesProject(data, projectId)) {
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
        where('dateKey', '==', today),
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
  startReadingsLogListeners(uid);
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
  const dateKey = localDayKeyFromDate(new Date());
  try {
    await addDoc(collection(db, 'users', uid, 'temperature_readings'), {
      unitId,
      unitName,
      tempC,
      temperature: tempC,
      projectId: getProjectId(),
      dateKey,
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
  if (raw == null || raw.trim() === '') {
    return;
  }
  const sanitized = raw.replace(/[^0-9.-]/g, '');
  const ppm = Number.parseFloat(sanitized);
  if (!Number.isFinite(ppm)) {
    setStatus(
      'Enter sanitizer PPM as a number (for example: 150 or 150 ppm).',
      true
    );
    return;
  }
  const passed = ppm >= 100 && ppm <= 200;
  const dateKey = localDayKeyFromDate(new Date());
  try {
    await addDoc(collection(db, 'users', uid, 'sanitizer_readings'), {
      locationId,
      locationName,
      ppm,
      passed,
      projectId: getProjectId(),
      dateKey,
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

function updateMobileWorkspaceContext() {
  const el = document.getElementById('mobile-workspace-context');
  const sel = document.getElementById('project-picker');
  if (!el || !sel) {
    return;
  }
  const v = sel.value;
  if (!v) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  const label = sel.options[sel.selectedIndex]?.textContent?.trim() || v;
  el.textContent = `Saving to workspace: ${label}`;
  el.hidden = false;
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
    rerenderComplianceLogLists();
    const modal = document.getElementById('compliance-archive-modal');
    if (modal && !modal.hidden) {
      void loadComplianceArchiveMonthIntoModal();
    }
    updateMobileWorkspaceContext();
  };

  updateMobileWorkspaceContext();
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

  const fToggle = document.getElementById('unit-fahrenheit');
  if (fToggle && !fToggle.dataset.boundLogRerender) {
    fToggle.dataset.boundLogRerender = '1';
    fToggle.addEventListener('change', () => rerenderComplianceLogLists());
  }

  wireHaccpReminderControls();
  wireComplianceArchiveCalendar();
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

  if (!workspaceResumeListenersBound) {
    workspaceResumeListenersBound = true;
    const refreshTeamWorkspacesOnResume = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      const uid = auth.currentUser?.uid;
      if (!uid) {
        return;
      }
      void refreshProjectPicker(uid).then(() => {
        ensureSiteIdIfNoTeamProjects();
      });
    };
    document.addEventListener(
      'visibilitychange',
      refreshTeamWorkspacesOnResume
    );
    window.addEventListener('pageshow', ev => {
      if (ev.persisted) {
        refreshTeamWorkspacesOnResume();
      }
    });
  }

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
      stopReadingsLogListeners();
      setComplianceArchiveModalOpen(false);
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

  startHaccpReminderScheduler();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      tryFireHaccpReminders();
    }
  });
}
