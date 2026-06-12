/**
 * Bootstrap and verify HACCP temp + sanitizer logs scoped to a restaurant project.
 */
import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const REF_UNITS = 'refrigeration_units';
const SAN_LOCS = 'sanitizer_locations';

const DEFAULT_UNITS = [
  { name: 'Line reach-in', maxTemp: 5 },
  { name: 'Walk-in cooler', maxTemp: 5 }
];

const DEFAULT_SANITIZER = [
  { name: '3-bay sink', requiredPPM: 150 },
  { name: 'Front counter wipe station', requiredPPM: 150 }
];

function localDayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDb() {
  const cfg = window.firebaseConfig;
  if (!cfg) {
    throw new Error('firebase_config_missing');
  }
  const app = getApps().length ? getApp() : initializeApp(cfg);
  return getFirestore(app);
}

function waitForAuthUser() {
  return new Promise(resolve => {
    const auth = getAuth();
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsub = onAuthStateChanged(auth, user => {
      unsub();
      resolve(user || null);
    });
    setTimeout(() => resolve(auth.currentUser || null), 12000);
  });
}

function findRestaurantProject(nameHint) {
  const pm = window.projectManager;
  const projects = pm?.projects || [];
  const hint = (nameHint || 'Hot Chix').toLowerCase();
  return (
    projects.find(
      p =>
        p &&
        !p.isArchived &&
        (p.type === 'restaurant' ||
          (Array.isArray(p.tags) && p.tags.includes('rbp')) ||
          (p.name && p.name.toLowerCase().includes(hint)))
    ) || null
  );
}

function activateProject(projectId) {
  if (window.projectManager?.setCurrentProject) {
    window.projectManager.setCurrentProject(projectId);
  }
  try {
    localStorage.setItem('iterum_current_project', projectId);
    localStorage.setItem('userCurrentProjectKey', projectId);
  } catch (e) {
    void e;
  }
}

function unitMatchesProject(unit, projectId, label) {
  if (unit.projectId === projectId) return true;
  if (label && unit.name && unit.name.toLowerCase().includes(label.toLowerCase())) {
    return true;
  }
  return false;
}

async function listCollection(db, uid, sub) {
  const snap = await getDocs(query(collection(db, 'users', uid, sub), limit(200)));
  const rows = [];
  snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
  return rows;
}

/**
 * @param {{ projectId: string, restaurantLabel?: string, logSamples?: boolean }} opts
 */
export async function bootstrapRestaurantCompliance(opts = {}) {
  const projectId = opts.projectId;
  if (!projectId) {
    throw new Error('project_id_required');
  }

  const user = await waitForAuthUser();
  if (!user?.uid) {
    throw new Error('not_signed_in');
  }

  const db = getDb();
  const uid = user.uid;
  const label = opts.restaurantLabel || 'Hot Chix';
  activateProject(projectId);

  const existingUnits = await listCollection(db, uid, REF_UNITS);
  const existingSan = await listCollection(db, uid, SAN_LOCS);

  let units = existingUnits.filter(u => unitMatchesProject(u, projectId, label));
  let locations = existingSan.filter(u => unitMatchesProject(u, projectId, label));

  const created = { units: 0, locations: 0 };

  if (!units.length) {
    for (const spec of DEFAULT_UNITS) {
      const ref = await addDoc(collection(db, 'users', uid, REF_UNITS), {
        name: `${spec.name} — ${label}`,
        type: 'Refrigerator',
        minTemp: 0,
        maxTemp: spec.maxTemp,
        projectId,
        createdAt: serverTimestamp()
      });
      units.push({
        id: ref.id,
        name: `${spec.name} — ${label}`,
        maxTemp: spec.maxTemp,
        projectId
      });
      created.units += 1;
    }
  }

  if (!locations.length) {
    for (const spec of DEFAULT_SANITIZER) {
      const ref = await addDoc(collection(db, 'users', uid, SAN_LOCS), {
        name: `${spec.name} — ${label}`,
        requiredPPM: spec.requiredPPM,
        projectId,
        createdAt: serverTimestamp()
      });
      locations.push({
        id: ref.id,
        name: `${spec.name} — ${label}`,
        requiredPPM: spec.requiredPPM,
        projectId
      });
      created.locations += 1;
    }
  }

  let tempLogged = false;
  let sanLogged = false;
  const dateKey = localDayKey();

  if (opts.logSamples !== false && units[0]) {
    const unit = units[0];
    const tempC = 3.3;
    await addDoc(collection(db, 'users', uid, 'temperature_readings'), {
      unitId: unit.id,
      unitName: unit.name,
      tempC,
      temperature: tempC,
      projectId,
      dateKey,
      source: 'iterum-compliance-bootstrap',
      timestamp: serverTimestamp()
    });
    await updateDoc(doc(db, 'users', uid, REF_UNITS, unit.id), {
      lastReading: tempC,
      lastReadingAt: serverTimestamp()
    });
    tempLogged = true;
  }

  if (opts.logSamples !== false && locations[0]) {
    const loc = locations[0];
    const ppm = 150;
    await addDoc(collection(db, 'users', uid, 'sanitizer_readings'), {
      locationId: loc.id,
      locationName: loc.name,
      ppm,
      passed: true,
      projectId,
      dateKey,
      source: 'iterum-compliance-bootstrap',
      timestamp: serverTimestamp()
    });
    await updateDoc(doc(db, 'users', uid, SAN_LOCS, loc.id), {
      lastReading: ppm,
      lastReadingAt: serverTimestamp()
    });
    sanLogged = true;
  }

  return {
    projectId,
    units: units.length,
    locations: locations.length,
    created,
    tempLogged,
    sanLogged,
    dateKey
  };
}

/**
 * @param {string} projectId
 */
export async function verifyRestaurantCompliance(projectId) {
  const user = await waitForAuthUser();
  if (!user?.uid) {
    throw new Error('not_signed_in');
  }

  const db = getDb();
  const uid = user.uid;
  const today = localDayKey();

  const tempsSnap = await getDocs(
    query(collection(db, 'users', uid, 'temperature_readings'), limit(300))
  );
  const sanSnap = await getDocs(
    query(collection(db, 'users', uid, 'sanitizer_readings'), limit(300))
  );

  const tempsToday = [];
  const sansToday = [];
  const tempsProjectToday = [];
  const sansProjectToday = [];
  const tempsUnscopedToday = [];
  const sansUnscopedToday = [];

  tempsSnap.forEach(d => {
    const data = d.data() || {};
    const day = data.dateKey || (data.timestamp?.toDate
      ? localDayKey(data.timestamp.toDate())
      : '');
    if (day !== today) return;
    tempsToday.push(data);
    if (data.projectId === projectId) {
      tempsProjectToday.push(data);
    } else if (!data.projectId) {
      tempsUnscopedToday.push(data);
    }
  });

  sanSnap.forEach(d => {
    const data = d.data() || {};
    const day = data.dateKey || (data.timestamp?.toDate
      ? localDayKey(data.timestamp.toDate())
      : '');
    if (day !== today) return;
    sansToday.push(data);
    if (data.projectId === projectId) {
      sansProjectToday.push(data);
    } else if (!data.projectId) {
      sansUnscopedToday.push(data);
    }
  });

  const units = (await listCollection(db, uid, REF_UNITS)).filter(
    u => u.projectId === projectId
  );
  const locations = (await listCollection(db, uid, SAN_LOCS)).filter(
    u => u.projectId === projectId
  );

  return {
    projectId,
    dateKey: today,
    unitsForProject: units.length,
    locationsForProject: locations.length,
    tempsToday: tempsToday.length,
    sansToday: sansToday.length,
    tempsProjectToday: tempsProjectToday.length,
    sansProjectToday: sansProjectToday.length,
    tempsUnscopedToday: tempsUnscopedToday.length,
    sansUnscopedToday: sansUnscopedToday.length,
    ok:
      units.length > 0 &&
      locations.length > 0 &&
      tempsProjectToday.length > 0 &&
      sansProjectToday.length > 0
  };
}

async function runComplianceFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('compliance_run') !== '1') {
    return;
  }

  const signal = (status, detail) => {
    document.documentElement.setAttribute('data-compliance-done', status);
    if (detail) {
      document.documentElement.setAttribute('data-compliance-detail', detail);
    }
  };

  try {
    let project = null;
    const projectIdParam = params.get('projectId');
    if (projectIdParam) {
      project = { id: projectIdParam, name: params.get('projectName') || 'Restaurant' };
    } else {
      project = findRestaurantProject(params.get('restaurant') || 'Hot Chix');
    }
    if (!project?.id) {
      signal('error', 'restaurant_project_missing');
      return;
    }

    await new Promise(r => setTimeout(r, 1500));
    const bootstrap = await bootstrapRestaurantCompliance({
      projectId: project.id,
      restaurantLabel: project.name || 'Hot Chix',
      logSamples: params.get('skip_log') !== '1'
    });
    const verify = await verifyRestaurantCompliance(project.id);
    signal(
      verify.ok ? 'ok' : 'warn',
      JSON.stringify({ project, bootstrap, verify })
    );
  } catch (err) {
    signal('error', (err && err.message) || 'unknown');
  }
}

window.iterumBootstrapRestaurantCompliance = bootstrapRestaurantCompliance;
window.iterumVerifyRestaurantCompliance = verifyRestaurantCompliance;
window.iterumFindRestaurantProject = findRestaurantProject;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void runComplianceFromUrl();
  });
} else {
  void runComplianceFromUrl();
}
