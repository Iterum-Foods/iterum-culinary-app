/**
 * Company / workspace membership: projects/{projectId}/members/{uid}
 * Server role (Firestore) overrides local setup role when present.
 * See docs/ROLES_AND_PERMISSIONS.md and firestore.rules.
 */
(function (global) {
  'use strict';

  var MEMBER_TO_UI_ROLE = {
    account_admin: 'chef_leadership',
    location_manager: 'operations_gm',
    employee_line: 'employee_line',
    chef_leadership: 'chef_leadership',
    operations_gm: 'operations_gm',
    purchasing: 'purchasing',
    consultant_rd: 'consultant_rd'
  };

  function mapMemberRoleToRoleKey(raw) {
    if (!raw || typeof raw !== 'string') return null;
    return MEMBER_TO_UI_ROLE[raw] || null;
  }

  function clearMembership() {
    global.iterumMembership = null;
  }

  /**
   * Load membership for projectId and set global.iterumMembership for UI resolution.
   * @param {string} projectId
   * @returns {Promise<{ rawRole: string, roleKey: string, projectId: string } | null>}
   */
  global.iterumRefreshProjectMembership = async function (projectId) {
    if (!projectId) {
      clearMembership();
      return null;
    }

    var fs = global.firestoreSync;
    if (!fs || !fs.initialized || !fs.db) {
      clearMembership();
      return null;
    }

    var uid =
      global.authManager && global.authManager.currentUser
        ? global.authManager.currentUser.uid
        : null;
    if (!uid) {
      clearMembership();
      return null;
    }

    try {
      var mod = await import(
        'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
      );
      var docRef = mod.doc(fs.db, 'projects', projectId, 'members', uid);
      var snap = await mod.getDoc(docRef);
      if (!snap.exists()) {
        global.iterumMembership = {
          rawRole: null,
          roleKey: null,
          projectId: projectId,
          hasMemberDoc: false
        };
        if (typeof global.applyDashboardLayoutForRole === 'function') {
          global.applyDashboardLayoutForRole();
        }
        global.dispatchEvent(
          new CustomEvent('iterumMembershipLoaded', {
            detail: global.iterumMembership
          })
        );
        return null;
      }

      var data = snap.data() || {};
      var rawRole = data.role || null;
      var roleKey = mapMemberRoleToRoleKey(rawRole) || 'chef_leadership';

      global.iterumMembership = {
        rawRole: rawRole,
        roleKey: roleKey,
        projectId: projectId,
        hasMemberDoc: true,
        email: data.email || null
      };

      if (typeof global.applyDashboardLayoutForRole === 'function') {
        global.applyDashboardLayoutForRole();
      }
      global.dispatchEvent(
        new CustomEvent('iterumMembershipLoaded', {
          detail: global.iterumMembership
        })
      );

      return global.iterumMembership;
    } catch (e) {
      console.warn('iterumRefreshProjectMembership:', e);
      clearMembership();
      return null;
    }
  };

  global.iterumRefreshMembershipForActiveProject = async function () {
    var fs = global.firestoreSync;
    var pid = fs && fs.resolveProjectId ? fs.resolveProjectId() : null;
    return global.iterumRefreshProjectMembership(pid);
  };
})(typeof window !== 'undefined' ? window : this);
