/**
 * Project Hub — add a Firebase user to projects/{id}/members/{theirUid} (owner / account_admin only).
 * Depends: firebase-config, auth-manager, firebase-auth (module), firestore-sync (module).
 */
function fillTeamProjectSelect() {
  const sel = document.getElementById('team-project-select');
  if (!sel || !window.projectManager?.projects) {
    return;
  }
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

async function onAddTeamMemberClick() {
  const msg = document.getElementById('team-access-msg');
  const targetUid = document.getElementById('team-target-uid')?.value?.trim();
  const projectId = document
    .getElementById('team-project-select')
    ?.value?.trim();
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
        'Saved. They should sign in on the phone app and choose this project in Workspace.';
    }
    const uidInput = document.getElementById('team-target-uid');
    if (uidInput) {
      uidInput.value = '';
    }
  } catch (e) {
    console.error('addTeamMember', e);
    if (msg) {
      msg.textContent =
        e?.message ||
        'Could not save. You must be project owner or account_admin, and Deploy Firebase rules must be current.';
    }
  }
}

function showTeamPanelIfSignedIn() {
  const panel = document.getElementById('team-access-panel');
  if (!panel) {
    return;
  }
  panel.style.display = getFirebaseUid() ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('team-add-member-btn');
  if (btn) {
    btn.addEventListener('click', () => onAddTeamMemberClick());
  }
  const inviteBtn = document.getElementById('team-copy-invite-btn');
  if (inviteBtn) {
    inviteBtn.addEventListener('click', () => {
      void onCopyInviteClick();
    });
  }
  let ticks = 0;
  const t = setInterval(() => {
    fillTeamProjectSelect();
    showTeamPanelIfSignedIn();
    ticks++;
    if (ticks > 40) {
      clearInterval(t);
    }
  }, 500);
});
