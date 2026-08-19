/**
 * Shared helpers for purchasing / bar-ops pages.
 */
(function (global) {
  'use strict';

  function getProjectId() {
    try {
      if (global.projectManager) {
        var pm = global.projectManager;
        if (typeof pm.getCurrentProject === 'function') {
          var cur = pm.getCurrentProject();
          if (cur && cur.id) return String(cur.id);
        }
        if (typeof pm.getActiveProject === 'function') {
          var act = pm.getActiveProject();
          if (act && act.id) return String(act.id);
        }
        if (pm.currentProject && pm.currentProject.id) {
          return String(pm.currentProject.id);
        }
        if (pm.currentProjectId) return String(pm.currentProjectId);
      }
    } catch (e) {
      /* ignore */
    }
    return (
      localStorage.getItem('iterum_current_project') ||
      localStorage.getItem('active_project') ||
      localStorage.getItem('iterum_current_project_id') ||
      'master'
    );
  }

  function getDb() {
    return (
      global.firestoreSync?.db ||
      global.firebaseDb ||
      global.firestoreDB ||
      null
    );
  }

  function getAuthUid() {
    return (
      global.authManager?.currentUser?.uid ||
      global.firebaseAuth?.auth?.currentUser?.uid ||
      global.firebaseAuth?.currentUser?.uid ||
      null
    );
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c];
    });
  }

  function toast(msg, type) {
    if (typeof global.showToast === 'function') {
      global.showToast(msg, type || 'info');
      return;
    }
    if (typeof global.vendorManager?.showNotification === 'function') {
      global.vendorManager.showNotification(msg, type || 'info');
    }
  }

  function newId(prefix) {
    var p = prefix || 'id';
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return p + '_' + crypto.randomUUID();
    }
    return p + '_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
  }

  function currentUserName() {
    return (
      global.authManager?.currentUser?.name ||
      global.authManager?.currentUser?.displayName ||
      'manager'
    );
  }

  global.iterumOps = {
    getProjectId: getProjectId,
    getDb: getDb,
    getAuthUid: getAuthUid,
    escapeHtml: escapeHtml,
    toast: toast,
    newId: newId,
    currentUserName: currentUserName
  };
})(typeof window !== 'undefined' ? window : globalThis);
