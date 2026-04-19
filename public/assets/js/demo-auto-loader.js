/**
 * Auto-merge demo data for configured demo accounts (ITERUM_DEMO_EMAILS).
 * Runs on session_saved / session_loaded; catches up if AuthManager was already ready.
 */
(function () {
  'use strict';

  var LOCAL_SEED_VERSION = 5;
  var FIRESTORE_SEED_VERSION = 1;

  function normEmail(e) {
    return (e || '').trim().toLowerCase();
  }

  function demoEmailList() {
    var list = (typeof window !== 'undefined' && window.ITERUM_DEMO_EMAILS) || [
      'demo@iterumfoods.com'
    ];
    return list.map(normEmail);
  }

  function isDemoUser(user) {
    if (!user || !user.email) return false;
    return demoEmailList().indexOf(normEmail(user.email)) !== -1;
  }

  function localVersionKey(uid) {
    return 'iterum_demo_local_seed_applied_v_' + (uid || 'na');
  }

  function firestoreVersionKey(uid) {
    return 'iterum_demo_firestore_seed_v_' + (uid || 'na');
  }

  async function waitForFirebaseUser(expectedUid, maxMs) {
    maxMs = maxMs || 12000;
    var appMod = await import(
      'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'
    );
    var authMod = await import(
      'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'
    );

    if (!window.firebaseConfig) return null;

    var app = appMod.getApps().length
      ? appMod.getApp()
      : appMod.initializeApp(window.firebaseConfig);
    var auth = authMod.getAuth(app);

    if (auth.currentUser && auth.currentUser.uid === expectedUid) {
      return auth.currentUser;
    }

    return new Promise(function (resolve) {
      var finished = false;
      var unsub = authMod.onAuthStateChanged(auth, function (u) {
        if (finished) return;
        if (u && u.uid === expectedUid) {
          finished = true;
          try {
            unsub();
          } catch (e) {
            void e;
          }
          resolve(u);
        }
      });
      setTimeout(function () {
        if (finished) return;
        finished = true;
        try {
          unsub();
        } catch (e) {
          void e;
        }
        resolve(
          auth.currentUser && auth.currentUser.uid === expectedUid
            ? auth.currentUser
            : null
        );
      }, maxMs);
    });
  }

  async function seedDemoFirestore(uid) {
    if (!window.firebaseConfig) return;

    var doneKey = firestoreVersionKey(uid);
    if (
      parseInt(localStorage.getItem(doneKey) || '0', 10) >=
      FIRESTORE_SEED_VERSION
    ) {
      return;
    }

    var fu = await waitForFirebaseUser(uid);
    if (!fu) {
      console.warn(
        '[Iterum demo] Firestore seed skipped — Firebase session not ready for',
        uid
      );
      return;
    }

    var appMod = await import(
      'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'
    );
    var fs = await import(
      'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
    );

    var app = appMod.getApps().length
      ? appMod.getApp()
      : appMod.initializeApp(window.firebaseConfig);
    var db = fs.getFirestore(app);
    var doc = fs.doc;
    var setDoc = fs.setDoc;
    var Timestamp = fs.Timestamp;

    var projectId = window.ITERUM_DEMO_PROJECT_ID || 'demo_bistro_nord';
    var now = Date.now();
    var locPrep = 'demo_iterum_loc_prep';
    var locBar = 'demo_iterum_loc_bar';
    var unitWalk = 'demo_iterum_ref_walkin';

    function ts(msAgo) {
      return Timestamp.fromDate(new Date(now - msAgo));
    }

    await setDoc(
      doc(db, 'users', uid, 'sanitizer_locations', locPrep),
      {
        name: '3-bay sink — prep (demo)',
        requiredPPM: 150,
        projectId: projectId,
        lastReading: 145,
        lastReadingAt: ts(3600000),
        createdAt: Timestamp.now()
      },
      { merge: true }
    );

    await setDoc(
      doc(db, 'users', uid, 'sanitizer_locations', locBar),
      {
        name: 'Bar rinse (demo)',
        requiredPPM: 150,
        projectId: projectId,
        lastReading: 165,
        lastReadingAt: ts(7200000),
        createdAt: Timestamp.now()
      },
      { merge: true }
    );

    await setDoc(
      doc(db, 'users', uid, 'sanitizer_readings', 'demo_iterum_san_read_1'),
      {
        locationId: locPrep,
        locationName: '3-bay sink — prep (demo)',
        ppm: 145,
        passed: true,
        projectId: projectId,
        timestamp: ts(1800000)
      },
      { merge: true }
    );

    await setDoc(
      doc(db, 'users', uid, 'sanitizer_readings', 'demo_iterum_san_read_2'),
      {
        locationId: locBar,
        locationName: 'Bar rinse (demo)',
        ppm: 92,
        passed: false,
        projectId: projectId,
        timestamp: ts(5400000)
      },
      { merge: true }
    );

    await setDoc(
      doc(db, 'users', uid, 'refrigeration_units', unitWalk),
      {
        name: 'Walk-in cooler — demo',
        type: 'Refrigerator',
        minTemp: 0,
        maxTemp: 5,
        projectId: projectId,
        lastReading: 3.1,
        lastReadingAt: ts(3600000),
        createdAt: Timestamp.now()
      },
      { merge: true }
    );

    await setDoc(
      doc(db, 'users', uid, 'temperature_readings', 'demo_iterum_temp_read_1'),
      {
        unitId: unitWalk,
        unitName: 'Walk-in cooler — demo',
        tempC: 3.1,
        temperature: 3.1,
        projectId: projectId,
        timestamp: ts(1800000)
      },
      { merge: true }
    );

    localStorage.setItem(doneKey, String(FIRESTORE_SEED_VERSION));
    console.log('[Iterum demo] Firestore compliance sample saved for uid', uid);
  }

  function runLocalSeed(uid) {
    var key = localVersionKey(uid);
    if (parseInt(localStorage.getItem(key) || '0', 10) >= LOCAL_SEED_VERSION) {
      return;
    }
    if (typeof window.applyIterumDemoSeed !== 'function') {
      console.warn('[Iterum demo] demo-seed-data.js not loaded');
      return;
    }
    var result = window.applyIterumDemoSeed({});
    if (result && result.ok) {
      localStorage.setItem(key, String(LOCAL_SEED_VERSION));
      console.log('[Iterum demo] Local sample data merged for demo account');
    } else {
      console.warn('[Iterum demo] Local seed failed:', result && result.error);
    }
  }

  function scheduleDemoWork(user) {
    if (!isDemoUser(user)) return;
    var uid = user.id || user.userId;
    if (!uid) return;

    runLocalSeed(uid);

    seedDemoFirestore(uid).catch(function (err) {
      console.warn('[Iterum demo] Firestore seed error:', err && err.message);
    });
  }

  function attachToAuthManager() {
    var am = window.authManager;
    if (!am || typeof am.on !== 'function') return false;

    var scheduleTimer = null;
    var debounced = function (user) {
      if (!isDemoUser(user)) return;
      clearTimeout(scheduleTimer);
      scheduleTimer = setTimeout(function () {
        scheduleDemoWork(user);
      }, 500);
    };

    am.on('session_saved', debounced);
    am.on('session_loaded', debounced);

    if (am.currentUser && isDemoUser(am.currentUser)) {
      debounced(am.currentUser);
    }
    return true;
  }

  function tryAttach() {
    if (attachToAuthManager()) return;
    setTimeout(tryAttach, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryAttach);
  } else {
    tryAttach();
  }

  setTimeout(function () {
    if (window.authManager && window.authManager.currentUser) {
      scheduleDemoWork(window.authManager.currentUser);
    }
  }, 2000);
})();
