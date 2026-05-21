/**
 * Project Hub — Team management tab: list / add / update / remove project members.
 * Depends: firebase-config, auth-manager, firebase-auth, firestore-sync, user-role-setup.
 */

function roleLabel(value) {
  const opts = window.ITERUM_TEAM_MEMBER_ROLE_OPTIONS || [];
  const o = opts.find(x => x.value === value);
  return o ? o.label : value || '—';
}

function fillRoleSelect(selectId, defaultValue) {
  const sel = document.getElementById(selectId);
  if (!sel) {
    return;
  }
  const opts = window.ITERUM_TEAM_MEMBER_ROLE_OPTIONS || [];
  sel.innerHTML = '';
  opts.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    sel.appendChild(opt);
  });
  if (defaultValue) {
    sel.value = defaultValue;
  } else if (!sel.value && opts.length) {
    sel.value = 'employee_line';
  }
}

function fillTeamProjectSelect() {
  const sel = document.getElementById('team-project-select');
  if (!sel || !window.projectManager?.projects) {
    return;
  }
  const prev = sel.value;
  sel.innerHTML = '';
  const list = window.projectManager.projects.filter(p => !p.isArchived);
  if (!list.length) {
    const o = document.createElement('option');
    o.value = '';
    o.textContent = 'Create a project first';
    sel.appendChild(o);
    return;
  }
  list.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.name || p.id;
    sel.appendChild(o);
  });
  if (prev && list.some(p => p.id === prev)) {
    sel.value = prev;
  }
}

async function waitForFirestore(maxAttempts = 40) {
  for (let i = 0; i < maxAttempts; i++) {
    if (window.firestoreSync?.initialized) {
      return true;
    }
    await new Promise(r => setTimeout(r, 250));
  }
  return false;
}

function getFirebaseUid() {
  return (
    window.firebaseAuth?.auth?.currentUser?.uid ||
    window.authManager?.currentUser?.uid ||
    null
  );
}

function getSelectedProjectId() {
  return document.getElementById('team-project-select')?.value?.trim() || '';
}

function setHubSection(section) {
  const workspaces = document.getElementById('hub-tab-workspaces');
  const team = document.getElementById('hub-tab-team');
  const buttons = document.querySelectorAll('[data-hub-section]');
  const isTeam = section === 'team';
  if (workspaces) {
    workspaces.hidden = isTeam;
  }
  if (team) {
    team.hidden = !isTeam;
  }
  buttons.forEach(btn => {
    const active = btn.getAttribute('data-hub-section') === section;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  if (isTeam && getFirebaseUid()) {
    void refreshMembersList();
  }
}

function initHubTabs() {
  document.querySelectorAll('[data-hub-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.getAttribute('data-hub-section') || 'workspaces';
      setHubSection(section);
      const hash = section === 'team' ? '#team' : '';
      if (window.location.hash !== hash) {
        history.replaceState(null, '', window.location.pathname + hash);
      }
    });
  });
  const hash = (window.location.hash || '').replace('#', '');
  if (hash === 'team') {
    setHubSection('team');
  }
}

function buildInviteText() {
  const projectSel = document.getElementById('team-project-select');
  const projectName =
    projectSel?.selectedOptions?.[0]?.textContent?.trim() || 'our project';
  const origin =
    (typeof window !== 'undefined' &&
      window.location &&
      window.location.origin) ||
    '';
  const mobileUrl = origin
    ? `${origin}/mobile-compliance.html`
    : 'mobile-compliance.html';
  const quickCard = origin
    ? `${origin}/foh-first-shift.html`
    : '/foh-first-shift.html';
  return (
    `You are invited to join ${projectName} in Iterum.\n\n` +
    `Steps:\n` +
    `1) Open the shift app: ${mobileUrl}\n` +
    `2) Sign in / create your account (same email you gave us).\n` +
    `3) Tap Copy my user ID and send it back to me.\n` +
    `4) After I add you, reopen the app and pick this workspace.\n\n` +
    `Reply format: UID: <paste your full Firebase UID>\n\n` +
    `First-shift tips (FOH/bar/kitchen): ${quickCard}`
  );
}

async function onCopyInviteClick() {
  const msg = document.getElementById('team-invite-msg');
  if (msg) {
    msg.textContent = '';
  }
  const text = buildInviteText();
  try {
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(text);
      if (msg) {
        msg.textContent = 'Invite message copied.';
      }
      return;
    }
  } catch (e) {
    console.warn('clipboard write failed', e);
  }
  try {
    window.prompt('Copy this invite message:', text);
    if (msg) {
      msg.textContent = 'Invite message ready to copy.';
    }
  } catch (e) {
    if (msg) {
      msg.textContent = 'Could not open copy helper. Please copy manually.';
    }
  }
}

function renderMembersTable(rows, projectId) {
  const tbody = document.getElementById('team-members-tbody');
  const status = document.getElementById('team-members-status');
  const me = getFirebaseUid();
  if (!tbody) {
    return;
  }
  if (!projectId) {
    tbody.innerHTML =
      '<tr><td colspan="4" style="color:#94a3b8;">Select a workspace to load members.</td></tr>';
    if (status) {
      status.textContent = '';
    }
    return;
  }
  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="4" style="color:#94a3b8;">No members yet — add someone below.</td></tr>';
    if (status) {
      status.textContent = '0 members on this project.';
    }
    return;
  }
  if (status) {
    status.textContent = `${rows.length} member${rows.length === 1 ? '' : 's'} on this project.`;
  }

  const opts = window.ITERUM_TEAM_MEMBER_ROLE_OPTIONS || [];
  tbody.innerHTML = '';
  rows.forEach(row => {
    const uid = row.uid || row.authUid || '';
    const tr = document.createElement('tr');

    const tdUid = document.createElement('td');
    tdUid.className = 'team-uid-cell';
    tdUid.title = uid;
    tdUid.textContent = uid.length > 18 ? `${uid.slice(0, 10)}…${uid.slice(-6)}` : uid;

    const tdEmail = document.createElement('td');
    tdEmail.textContent = row.email || '—';

    const tdRole = document.createElement('td');
    const roleSel = document.createElement('select');
    roleSel.className = 'team-role-select';
    roleSel.dataset.memberUid = uid;
    opts.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      roleSel.appendChild(opt);
    });
    roleSel.value = row.role || 'employee_line';
    roleSel.addEventListener('change', () => {
      void onMemberRoleChange(projectId, uid, roleSel);
    });
    tdRole.appendChild(roleSel);

    const tdAct = document.createElement('td');
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'team-btn-ghost';
    removeBtn.textContent = 'Remove';
    removeBtn.title = uid === me ? 'You cannot remove yourself here' : 'Remove from project';
    if (uid === me) {
      removeBtn.disabled = true;
    } else {
      removeBtn.addEventListener('click', () => {
        void onRemoveMember(projectId, uid);
      });
    }
    tdAct.appendChild(removeBtn);

    tr.appendChild(tdUid);
    tr.appendChild(tdEmail);
    tr.appendChild(tdRole);
    tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });
}

async function refreshMembersList() {
  const status = document.getElementById('team-members-status');
  const projectId = getSelectedProjectId();
  if (!projectId) {
    renderMembersTable([], '');
    return;
  }
  if (status) {
    status.textContent = 'Loading members…';
  }
  const fsOk = await waitForFirestore();
  if (!fsOk || !window.firestoreSync?.listProjectMembers) {
    if (status) {
      status.textContent = 'Firestore not ready — refresh the page.';
    }
    return;
  }
  try {
    const rows = await window.firestoreSync.listProjectMembers(projectId);
    rows.sort((a, b) => (a.email || a.uid).localeCompare(b.email || b.uid));
    renderMembersTable(rows, projectId);
  } catch (e) {
    console.error('refreshMembersList', e);
    if (status) {
      status.textContent =
        e?.message ||
        'Could not load members. You need owner or account_admin on this project.';
    }
    renderMembersTable([], projectId);
  }
}

async function onMemberRoleChange(projectId, memberUid, selectEl) {
  const status = document.getElementById('team-members-status');
  const role = selectEl?.value || 'employee_line';
  const fsOk = await waitForFirestore();
  if (!fsOk) {
    return;
  }
  try {
    await window.firestoreSync.ensureProjectMemberDoc(projectId, {
      firebaseUid: memberUid,
      role
    });
    if (status) {
      status.textContent = `Updated ${roleLabel(role)} for ${memberUid.slice(0, 8)}…`;
    }
  } catch (e) {
    console.error('onMemberRoleChange', e);
    if (status) {
      status.textContent = e?.message || 'Could not update role.';
    }
    void refreshMembersList();
  }
}

async function onRemoveMember(projectId, memberUid) {
  const status = document.getElementById('team-members-status');
  const label = memberUid.length > 12 ? `${memberUid.slice(0, 8)}…` : memberUid;
  if (
    !window.confirm(
      `Remove this teammate from the project?\n\nUser: ${label}\nThey will lose access until added again.`
    )
  ) {
    return;
  }
  const fsOk = await waitForFirestore();
  if (!fsOk || !window.firestoreSync?.removeProjectMemberDoc) {
    return;
  }
  try {
    await window.firestoreSync.removeProjectMemberDoc(projectId, memberUid);
    if (status) {
      status.textContent = 'Member removed.';
    }
    await refreshMembersList();
  } catch (e) {
    console.error('onRemoveMember', e);
    if (status) {
      status.textContent = e?.message || 'Could not remove member.';
    }
  }
}

async function onAddTeamMemberClick() {
  const msg = document.getElementById('team-access-msg');
  const targetUid = document.getElementById('team-target-uid')?.value?.trim();
  const projectId = getSelectedProjectId();
  const role =
    document.getElementById('team-member-role')?.value || 'employee_line';
  const email =
    document.getElementById('team-target-email')?.value?.trim() || null;

  if (msg) {
    msg.textContent = '';
  }

  if (!projectId || !targetUid) {
    if (msg) {
      msg.textContent =
        'Choose a project and enter the teammate’s Firebase User UID.';
    }
    return;
  }

  if (!getFirebaseUid()) {
    if (msg) {
      msg.textContent =
        'Sign in (Firebase) first — open Sign in from the header if needed.';
    }
    return;
  }

  const fsOk = await waitForFirestore();
  if (!fsOk || !window.firestoreSync?.ensureProjectDoc) {
    if (msg) {
      msg.textContent =
        'Firestore is not ready. Refresh the page and try again.';
    }
    return;
  }

  const projMeta = window.projectManager?.projects?.find(
    p => p.id === projectId
  );

  try {
    await window.firestoreSync.ensureProjectDoc(projectId, {
      name: projMeta?.name,
      description: projMeta?.description
    });
    await window.firestoreSync.ensureProjectMemberDoc(projectId, {
      firebaseUid: targetUid,
      role,
      email
    });
    if (msg) {
      msg.textContent =
        `Added as ${roleLabel(role)}. They should sign in on the shift app and pick this workspace.`;
    }
    const uidInput = document.getElementById('team-target-uid');
    if (uidInput) {
      uidInput.value = '';
    }
    await refreshMembersList();
  } catch (e) {
    console.error('addTeamMember', e);
    if (msg) {
      msg.textContent =
        e?.message ||
        'Could not save. You must be project owner or account_admin, and Deploy Firebase rules must be current.';
    }
  }
}

function updateTeamPanelAuthState() {
  const hint = document.getElementById('team-signin-hint');
  const body = document.getElementById('team-admin-body');
  const signedIn = !!getFirebaseUid();
  if (body) {
    body.style.display = signedIn ? 'block' : 'none';
  }
  if (hint) {
    hint.style.display = signedIn ? 'none' : 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fillRoleSelect('team-member-role', 'employee_line');
  initHubTabs();

  const addBtn = document.getElementById('team-add-member-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      void onAddTeamMemberClick();
    });
  }
  const inviteBtn = document.getElementById('team-copy-invite-btn');
  if (inviteBtn) {
    inviteBtn.addEventListener('click', () => {
      void onCopyInviteClick();
    });
  }
  const refreshBtn = document.getElementById('team-refresh-members-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      void refreshMembersList();
    });
  }
  const projectSel = document.getElementById('team-project-select');
  if (projectSel) {
    projectSel.addEventListener('change', () => {
      void refreshMembersList();
    });
  }

  let ticks = 0;
  const t = setInterval(() => {
    fillTeamProjectSelect();
    updateTeamPanelAuthState();
    ticks++;
    if (ticks > 40) {
      clearInterval(t);
    }
  }, 500);

  if (window.authManager?.onAuthStateChanged) {
    window.authManager.onAuthStateChanged(() => {
      updateTeamPanelAuthState();
      if (getFirebaseUid() && !document.getElementById('hub-tab-team')?.hidden) {
        void refreshMembersList();
      }
    });
  }
});
