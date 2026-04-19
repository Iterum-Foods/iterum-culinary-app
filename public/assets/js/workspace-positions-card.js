/**
 * Dashboard card: default profile role + per-project position (workspace_prefs).
 * Team access level comes from projects/.../members (read-only here).
 */
import {
  getApp,
  getApps,
  initializeApp
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

function roleLabel(value) {
  var opts =
    (typeof window !== 'undefined' && window.ITERUM_TEAM_MEMBER_ROLE_OPTIONS) ||
    [];
  var o = opts.find(function (x) {
    return x.value === value;
  });
  return o ? o.label : value || '—';
}

function primaryRoleLabel(key) {
  var opts =
    (typeof window !== 'undefined' && window.ITERUM_PRIMARY_ROLE_OPTIONS) || [];
  var o = opts.find(function (x) {
    return x.value === key;
  });
  return o ? o.label : key || '—';
}

export function mountWorkspacePositionsCard(rootId) {
  var root = document.getElementById(rootId);
  if (!root) return;

  if (!window.firebaseConfig) {
    root.innerHTML =
      '<p class="text-sm" style="color: var(--brand-text-muted);">Firebase not configured.</p>';
    return;
  }

  var app = getApps().length ? getApp() : initializeApp(window.firebaseConfig);

  var db = getFirestore(app);
  var auth = getAuth(app);

  function renderSignedOut() {
    root.innerHTML =
      '<p class="text-sm" style="color: var(--brand-text-muted);">Sign in with your team account to load workspaces.</p>';
  }

  function renderAnonymous() {
    root.innerHTML =
      '<p class="text-sm" style="color: var(--brand-text-muted);">You’re signed in as a guest. Use your Iterum email or Google sign-in to manage team positions.</p>';
  }

  async function loadProjectName(projectId) {
    try {
      var ps = await getDoc(doc(db, 'projects', projectId));
      if (ps.exists()) {
        var d = ps.data();
        return d.name || d.projectName || projectId;
      }
    } catch (e) {
      console.warn('workspace-positions project name', e);
    }
    return projectId;
  }

  async function savePref(uid, projectId, positionKey) {
    await setDoc(
      doc(db, 'users', uid, 'workspace_prefs', projectId),
      { positionKey: positionKey, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  async function loadPrefs(uid, projectIds) {
    var map = {};
    await Promise.all(
      projectIds.map(async function (pid) {
        try {
          var s = await getDoc(doc(db, 'users', uid, 'workspace_prefs', pid));
          if (s.exists()) {
            var p = s.data();
            if (p && p.positionKey) map[pid] = p.positionKey;
          }
        } catch (e) {
          console.warn('workspace_prefs', pid, e);
        }
      })
    );
    return map;
  }

  async function renderForUser(user) {
    var uid = user.uid;
    var profile =
      typeof window.getOperatorProfile === 'function'
        ? window.getOperatorProfile()
        : null;
    var defaultRole =
      profile && profile.roleKey ? profile.roleKey : 'chef_leadership';
    var defaultScope =
      profile && profile.scope ? profile.scope : 'single_restaurant';

    var memberRows = [];
    try {
      var mq = query(
        collectionGroup(db, 'members'),
        where('authUid', '==', uid)
      );
      var snap = await getDocs(mq);
      snap.forEach(function (d) {
        var parent = d.ref.parent;
        if (!parent || !parent.parent) return;
        var projectId = parent.parent.id;
        var data = d.data() || {};
        memberRows.push({
          projectId: projectId,
          assignedRole: data.role || ''
        });
      });
    } catch (e) {
      console.error('workspace-positions members query', e);
      root.innerHTML =
        '<p class="text-sm text-amber-800">Could not load team list. If this is new, deploy the Firestore index for <code>members.authUid</code>.</p>';
      return;
    }

    var prefMap = await loadPrefs(
      uid,
      memberRows.map(function (r) {
        return r.projectId;
      })
    );

    var teamOpts =
      (typeof window !== 'undefined' &&
        window.ITERUM_TEAM_MEMBER_ROLE_OPTIONS) ||
      [];

    var defaultSection =
      '<div class="mb-5 pb-5 border-b" style="border-color: var(--brand-border-light);">' +
      '<h3 class="text-sm font-semibold mb-1" style="color: var(--brand-text-primary);">Your profile (default)</h3>' +
      '<p class="text-xs mb-2" style="color: var(--brand-text-muted);">Used for your dashboard when no team membership is loaded. Does not change permissions — your manager sets access per project in Team hub.</p>' +
      '<p class="text-sm"><strong style="color: var(--brand-text-secondary);">Position:</strong> ' +
      primaryRoleLabel(defaultRole) +
      '</p>' +
      '<p class="text-xs mt-1" style="color: var(--brand-text-muted);">Organization: ' +
      (defaultScope === 'restaurant_group'
        ? 'Restaurant group'
        : 'Single restaurant') +
      '</p>' +
      '<a href="setup.html" class="inline-block mt-2 text-sm font-semibold" style="color: var(--brand-primary-accent);">Change in workspace setup →</a>' +
      '</div>';

    if (!memberRows.length) {
      root.innerHTML =
        defaultSection +
        '<p class="text-sm" style="color: var(--brand-text-muted);">You’re not on a shared team project yet. Ask your manager to add your user ID from the team mobile app, or open <a href="project-hub.html" class="font-semibold" style="color: var(--brand-primary-accent);">Team hub</a>.</p>';
      return;
    }

    var names = {};
    await Promise.all(
      memberRows.map(async function (row) {
        names[row.projectId] = await loadProjectName(row.projectId);
      })
    );

    var rowsHtml = memberRows
      .map(function (row) {
        var pid = row.projectId;
        var assigned = row.assignedRole;
        var saved = prefMap[pid] || assigned || '';
        var options = teamOpts
          .map(function (opt) {
            var sel = opt.value === saved ? ' selected' : '';
            return (
              '<option value="' +
              opt.value +
              '"' +
              sel +
              '>' +
              opt.label +
              '</option>'
            );
          })
          .join('');

        return (
          '<div class="workspace-pos-row border rounded-lg p-3 mb-3" style="border-color: var(--brand-border-light); background: var(--brand-bg-primary);">' +
          '<div class="font-semibold text-sm mb-1" style="color: var(--brand-text-primary);">' +
          names[pid] +
          '</div>' +
          '<p class="text-xs mb-2" style="color: var(--brand-text-muted);"><strong>Team access</strong> (set by admin): ' +
          roleLabel(assigned) +
          '</p>' +
          '<label class="block text-xs font-semibold mb-1" style="color: var(--brand-text-secondary);">Your position on this project</label>' +
          '<select class="workspace-pos-select w-full text-sm py-2 px-2 rounded-md border" style="border-color: var(--brand-border-light);" data-project-id="' +
          pid +
          '">' +
          options +
          '</select>' +
          '<p class="text-xs mt-1" style="color: var(--brand-text-muted);">Saved to your account for labels and the mobile app. Permissions still follow <strong>Team access</strong>.</p>' +
          '</div>'
        );
      })
      .join('');

    root.innerHTML =
      defaultSection +
      '<h3 class="text-sm font-semibold mb-2" style="color: var(--brand-text-primary);">Per team project</h3>' +
      rowsHtml;

    root.querySelectorAll('.workspace-pos-select').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        var projectId = sel.getAttribute('data-project-id');
        if (!projectId) return;
        try {
          await savePref(uid, projectId, sel.value);
          sel.style.boxShadow = '0 0 0 2px var(--brand-primary-accent)';
          setTimeout(function () {
            sel.style.boxShadow = '';
          }, 600);
        } catch (e) {
          console.error(e);
          alert(
            'Could not save. Deploy latest Firestore rules if this persists.'
          );
        }
      });
    });
  }

  onAuthStateChanged(auth, function (user) {
    if (!user) {
      renderSignedOut();
      return;
    }
    if (user.isAnonymous) {
      renderAnonymous();
      return;
    }
    void renderForUser(user);
  });
}
