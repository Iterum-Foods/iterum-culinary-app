/**
 * Thin data-access layer for the top-level Project entity in Firestore.
 * See docs/DATA_ACCESS_INVENTORY.md for paths and localStorage keys.
 *
 * All writes should flow through window.firestoreSync; this module adds stable
 * entry points for future refactors.
 */

export const UserScopedPaths = Object.freeze({
  /** @param {string} userId resolved Firestore user doc id */
  vendorPrices: userId => `users/${userId}/vendor_prices`
});

export const ProjectFirestorePaths = Object.freeze({
  collection: 'projects',
  /** @param {string} projectId */
  doc: projectId => `projects/${projectId}`,
  /** Company permissions: projects/{projectId}/members/{uid} */
  member: (projectId, uid) => `projects/${projectId}/members/${uid}`,
  /** @param {string} projectId */
  menus: projectId => `projects/${projectId}/menus`,
  /** @param {string} projectId */
  checklists: projectId => `projects/${projectId}/checklists`,
  /** @param {string} projectId */
  snapshots: projectId => `projects/${projectId}/snapshots`
});

/**
 * Ensure `projects/{projectId}` exists with `firebaseUid` for security rules.
 * @param {string} projectId
 * @param {Record<string, unknown>} [metadata]
 */
export async function ensureProjectForCurrentUser(projectId, metadata = {}) {
  const sync = window.firestoreSync;
  if (!sync?.initialized) {
    console.warn('project-data-access: Firestore not initialized');
    return null;
  }
  const uid =
    window.authManager?.currentUser?.uid || metadata.firebaseUid || null;
  return sync.ensureProjectDoc(projectId, { ...metadata, firebaseUid: uid });
}

/**
 * Persist menu + items snapshot under the project (delegates to firestore-sync).
 * @param {Record<string, unknown>} payload
 */
export async function saveProjectMenuSnapshot(payload) {
  const sync = window.firestoreSync;
  if (!sync?.initialized) {
    return false;
  }
  await ensureProjectForCurrentUser(sync.resolveProjectId(payload?.projectId), {
    ownerId: sync.resolveUserId(payload?.userId),
    projectName: payload?.menu?.name
  });
  return sync.saveMenuSnapshot(payload);
}

/**
 * Fetch latest menu snapshot for a project.
 * @param {string} [projectId]
 * @param {Record<string, unknown>} [options]
 */
export async function fetchProjectMenuSnapshot(projectId, options = {}) {
  return (
    window.firestoreSync?.fetchLatestMenuSnapshot?.(projectId, options) ?? null
  );
}

window.iterumProjectDataAccess = {
  UserScopedPaths,
  ProjectFirestorePaths,
  ensureProjectForCurrentUser,
  saveProjectMenuSnapshot,
  fetchProjectMenuSnapshot
};
