/**
 * Workspace save indicator — active project + cloud sync status for golden-path pages.
 * Mount: <div id="workspace-save-indicator-root" data-workspace-save-indicator></div>
 */
(function () {
  function isSignedIn() {
    return !!(
      window.authManager?.currentUser || window.firebaseAuth?.auth?.currentUser
    );
  }

  function listRealProjects() {
    const list = window.projectManager?.projects || [];
    return list.filter(
      p =>
        p && !p.isArchived && p.id && p.id !== 'master' && p.type !== 'master'
    );
  }

  function resolveProjectContext() {
    const pm = window.projectManager;
    let id = null;
    let name = null;

    if (pm?.currentProject?.id) {
      id = pm.currentProject.id;
      name = pm.currentProject.name || pm.currentProject.id;
    }

    if (typeof window.firestoreSync?.resolveProjectId === 'function') {
      try {
        id = window.firestoreSync.resolveProjectId(id);
      } catch (e) {
        void e;
      }
    }

    if (!id) {
      id =
        localStorage.getItem('active_project') ||
        localStorage.getItem('iterum_current_project') ||
        'master';
    }

    if (!name) {
      name =
        localStorage.getItem('active_project_name') ||
        (pm?.projects || []).find(p => p.id === id)?.name ||
        id;
    }

    const masterId = pm?.masterProjectId || 'master';
    const isMasterLike = !id || id === 'master' || id === masterId;
    const realProjects = listRealProjects();

    return {
      id,
      name,
      isMasterLike,
      shouldWarnMaster: isMasterLike && realProjects.length > 0,
      realProjectCount: realProjects.length
    };
  }

  function resolveCloudStatus() {
    const signedIn = isSignedIn();
    const fsReady = !!(
      window.firestoreSync && window.firestoreSync.initialized
    );
    const online =
      typeof navigator !== 'undefined' ? navigator.onLine !== false : true;

    let queueLength = 0;
    let isSyncing = false;
    let lastSync = null;

    if (typeof window.cloudDataSync?.getSyncStatus === 'function') {
      try {
        const s = window.cloudDataSync.getSyncStatus();
        queueLength = s.queueLength || 0;
        isSyncing = !!s.isSyncing;
        lastSync = s.lastSync || null;
      } catch (e) {
        void e;
      }
    }

    let cloudLabel = 'Local only';
    let cloudState = 'local';

    if (!online) {
      cloudLabel = 'Offline';
      cloudState = 'offline';
    } else if (!signedIn) {
      cloudLabel = 'Sign in to sync';
      cloudState = 'local';
    } else if (!fsReady) {
      cloudLabel = 'Connecting…';
      cloudState = 'pending';
    } else if (isSyncing) {
      cloudLabel = 'Syncing…';
      cloudState = 'syncing';
    } else if (queueLength > 0) {
      cloudLabel = `Saving (${queueLength})`;
      cloudState = 'pending';
    } else {
      cloudLabel = 'Synced';
      cloudState = 'ok';
    }

    return {
      signedIn,
      fsReady,
      online,
      queueLength,
      isSyncing,
      lastSync,
      cloudLabel,
      cloudState
    };
  }

  function shortId(id) {
    if (!id || id.length < 14) {
      return id || '—';
    }
    return `${id.slice(0, 8)}…${id.slice(-4)}`;
  }

  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
  }

  function bannerState(project, cloud) {
    if (project.shouldWarnMaster) {
      return 'warn';
    }
    if (!cloud.online) {
      return 'offline';
    }
    if (!cloud.signedIn || !cloud.fsReady) {
      return 'local';
    }
    if (cloud.cloudState === 'syncing' || cloud.cloudState === 'pending') {
      return 'pending';
    }
    return 'ok';
  }

  function renderHost(host) {
    const project = resolveProjectContext();
    const cloud = resolveCloudStatus();
    const state = bannerState(project, cloud);

    const warnHtml = project.shouldWarnMaster
      ? `<p class="iterum-workspace-banner__warn"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Select a named workspace in the sidebar before saving — otherwise data may land on <strong>Master</strong>.</p>`
      : '';

    const idLine =
      project.id && !project.shouldWarnMaster
        ? `<span class="iterum-workspace-banner__id" title="${escapeHtml(project.id)}">ID: ${escapeHtml(shortId(project.id))}</span>`
        : '';

    host.className = 'iterum-workspace-banner-wrap';
    host.innerHTML = `
      <div class="iterum-workspace-banner" data-state="${state}" role="status" aria-live="polite">
        <div class="iterum-workspace-banner__main">
          <span class="iterum-workspace-banner__icon" aria-hidden="true"><i class="fa-solid fa-cloud"></i></span>
          <div class="iterum-workspace-banner__text">
            <span class="iterum-workspace-banner__label">Workspace</span>
            <strong class="iterum-workspace-banner__name">${escapeHtml(project.name)}</strong>
            ${idLine}
          </div>
        </div>
        <div class="iterum-workspace-banner__cloud" data-cloud="${cloud.cloudState}">
          <span class="iterum-workspace-banner__dot" aria-hidden="true"></span>
          <span class="iterum-workspace-banner__cloud-text">${escapeHtml(cloud.cloudLabel)}</span>
        </div>
        <a class="iterum-workspace-banner__link" href="project-hub.html">Manage</a>
      </div>
      ${warnHtml}
    `;
  }

  let lastMasterWarnAt = 0;
  const MASTER_WARN_COOLDOWN_MS = 45000;

  function showMasterWorkspaceToast(message) {
    if (typeof window.showWarning === 'function') {
      window.showWarning(message, 7000);
      return;
    }
    if (window.toast && typeof window.toast.warning === 'function') {
      window.toast.warning(message, 7000);
      return;
    }
    console.warn(message);
  }

  /**
   * @param {string} [actionLabel] e.g. "menu", "checklist"
   * @returns {boolean} true when save targets Master but named projects exist
   */
  function warnIfMasterWorkspace(actionLabel) {
    const project = resolveProjectContext();
    if (!project.shouldWarnMaster) {
      return false;
    }
    const now = Date.now();
    if (now - lastMasterWarnAt < MASTER_WARN_COOLDOWN_MS) {
      return true;
    }
    lastMasterWarnAt = now;
    const label = actionLabel ? String(actionLabel) : 'data';
    showMasterWorkspaceToast(
      `Saving ${label} to the Master workspace. Pick a named project in the sidebar first so your team sees it on the shift app.`
    );
    return true;
  }

  window.iterumGetWorkspaceContext = resolveProjectContext;
  window.iterumWarnIfMasterWorkspace = warnIfMasterWorkspace;

  function refreshAll() {
    document
      .querySelectorAll('[data-workspace-save-indicator]')
      .forEach(host => {
        renderHost(host);
      });
    if (
      window.syncStatusIndicator &&
      typeof window.syncStatusIndicator.checkSyncStatus === 'function'
    ) {
      window.syncStatusIndicator.checkSyncStatus();
    }
  }

  function mountMissingRoots() {
    const pages = [
      { selector: '.dash-page-header', insert: 'afterend' },
      { selector: '.menu-hero-top', insert: 'afterend' }
    ];
    pages.forEach(({ selector, insert }) => {
      const anchor = document.querySelector(selector);
      if (!anchor || document.getElementById('workspace-save-indicator-root')) {
        return;
      }
      const existing = anchor.parentElement?.querySelector(
        '#workspace-save-indicator-root'
      );
      if (existing) {
        return;
      }
      const root = document.createElement('div');
      root.id = 'workspace-save-indicator-root';
      root.setAttribute('data-workspace-save-indicator', '');
      if (insert === 'afterend') {
        anchor.insertAdjacentElement('afterend', root);
      } else {
        anchor.insertAdjacentElement('beforebegin', root);
      }
    });
  }

  function init() {
    mountMissingRoots();
    refreshAll();
  }

  window.refreshWorkspaceSaveIndicator = refreshAll;
  window.initWorkspaceSaveIndicator = init;

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, 400);
  });

  window.addEventListener('projectChanged', () => {
    setTimeout(refreshAll, 50);
  });

  window.addEventListener('storage', e => {
    const k = e.key || '';
    if (
      k.indexOf('project') >= 0 ||
      k === 'active_project' ||
      k === 'iterum_current_project'
    ) {
      refreshAll();
    }
  });

  window.addEventListener('cloudSyncComplete', () => {
    refreshAll();
  });

  window.addEventListener('userDataManagerReady', () => {
    refreshAll();
  });

  if (document.readyState !== 'loading') {
    setTimeout(init, 600);
  }

  console.log('✅ Workspace save indicator loaded');
})();
