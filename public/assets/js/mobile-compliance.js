/**
 * Mobile-first fridge temperature + sanitizer log.
 * Uses same Firestore paths as dashboard.html for sync with the full Iterum app.
 */
import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const REF_UNITS = 'refrigeration_units';
const SAN_LOCS = 'sanitizer_locations';

/** @type {{ id: string, role?: string }[]} */
let myProjectRows = [];

function getProjectId() {
  try {
    return (
      localStorage.getItem('iterum_current_project') ||
      localStorage.getItem('userCurrentProjectKey') ||
      'mobile-default'
    );
  } catch {
    return 'mobile-default';
  }
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
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

async function refreshProjectPicker(uid) {
  const sel = document.getElementById('project-picker');
  const uidEl = document.getElementById('my-firebase-uid');
  if (uidEl) {
    uidEl.textContent = uid;
  }
  if (!db || !sel) {
    return;
  }
  myProjectRows = [];
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
    sel.innerHTML = '';
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = myProjectRows.length
      ? 'Choose workspace…'
      : 'No shared projects yet (ask your manager)';
    sel.appendChild(opt0);
    for (const row of myProjectRows) {
      let label = row.id;
      try {
        const ps = await getDoc(doc(db, 'projects', row.id));
        if (ps.exists) {
          const data = ps.data();
          const n = data.name || data.projectName;
          if (n) {
            label = n;
          }
        }
      } catch {
        /* keep id */
      }
      const o = document.createElement('option');
      o.value = row.id;
      o.textContent = label;
      sel.appendChild(o);
    }
    const personal = document.createElement('option');
    personal.value = 'mobile-default';
    personal.textContent = 'Personal logs (not a team project)';
    sel.appendChild(personal);

    const cur = getProjectId();
    if (myProjectRows.some(r => r.id === cur)) {
      sel.value = cur;
    } else if (myProjectRows.length === 1) {
      sel.value = myProjectRows[0].id;
      persistProjectId(uid, myProjectRows[0].id);
    } else if (myProjectRows.length === 0) {
      sel.value = 'mobile-default';
      persistProjectId(uid, 'mobile-default');
    } else {
      sel.value = '';
    }

    sel.onchange = () => {
      const v = sel.value;
      if (v) {
        persistProjectId(uid, v);
        setStatus(
          v === 'mobile-default'
            ? 'Logging as personal workspace.'
            : 'Workspace saved for new readings.'
        );
      }
    };
  } catch (e) {
    console.error('refreshProjectPicker', e);
    setStatus(
      'Could not load team projects. If this is new, deploy Firestore indexes (members / authUid).',
      true
    );
  }
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
      setStatus(e?.message || 'Sign-in failed.', true);
    }
  });

  $('btn-signup').addEventListener('click', async () => {
    const email = $('auth-email').value.trim();
    const pass = $('auth-password').value;
    if (!email || !pass) {
      setStatus('Enter email and password (min 6 chars).', true);
      return;
    }
    try {
      setStatus('Creating account…');
      await createUserWithEmailAndPassword(auth, email, pass);
      setStatus('Account ready — you are signed in.');
    } catch (e) {
      console.error(e);
      setStatus(e?.message || 'Sign-up failed.', true);
    }
  });

  $('btn-google').addEventListener('click', async () => {
    try {
      setStatus('Opening Google…');
      const prov = new GoogleAuthProvider();
      await signInWithPopup(auth, prov);
      setStatus('Signed in with Google.');
    } catch (e) {
      console.error(e);
      setStatus(e?.message || 'Google sign-in failed.', true);
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

  $('tab-fridge').addEventListener('click', () => switchTab('fridge'));
  $('tab-san').addEventListener('click', () => switchTab('san'));
  $('btn-add-fridge').addEventListener('click', () => addFridge());
  $('btn-add-san').addEventListener('click', () => addSanStation());
}

export function initMobileCompliance() {
  if (!window.firebaseConfig) {
    setStatus('Firebase config missing.', true);
    return;
  }
  wireAuth();
  const app = getApps().length ? getApp() : initializeApp(window.firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  onAuthStateChanged(auth, user => {
    if (user) {
      $('user-chip').textContent = user.email || user.uid.slice(0, 8) + '…';
      showPanel('app');
      startListeners(user.uid);
      switchTab('fridge');
      refreshProjectPicker(user.uid)
        .then(() => {
          ensureSiteIdIfNoTeamProjects();
          setStatus('Choose your workspace, then log temps or sanitizer.');
        })
        .catch(() => {
          setStatus('Signed in — set workspace if prompted.', true);
        });
    } else {
      showPanel('auth');
      $('user-chip').textContent = '';
      myProjectRows = [];
      setStatus('Sign in to sync logs with the web app.');
    }
  });
}
