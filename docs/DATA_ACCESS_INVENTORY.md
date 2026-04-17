# Data access inventory (storage keys & Firestore)

Snapshot for supply-chain / security review. Regenerate diffs with ripgrep as code changes.  
**Operator UI roles** (not Firestore): [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md). **Source-of-truth (entity storage):** [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md). **Ship runbook:** [HOW_WE_SHIP.md](./HOW_WE_SHIP.md).

## Firestore paths (client: `public/assets/js/firestore-sync.js`)

| Path pattern | Operations | Notes |
|--------------|------------|--------|
| `users/{userId}` | setDoc merge, getDoc, updateDoc, deleteDoc, collection query | `userId` often normalized email/id from app, not always Firebase Auth UID |
| `users/{userId}/snapshots/recipeLibrary` | setDoc merge, getDoc | Recipe library blob snapshot |
| `users/{userId}/vendors/{vendorId}` | allow read/write per `firestore.rules` (owner or email-matched profile) | **E3 target:** wire `vendorManager` / costing to this path; today often **localStorage** `iterum_vendors` only |
| `projects/{projectId}` | setDoc merge (`ensureProjectDoc`) | Metadata: `ownerId`, `ownerEmail`, `firebaseUid` (new), tags, names |
| `projects/{projectId}/members/{userId}` | setDoc merge (`ensureProjectMemberDoc`) | Company role: `role`, `email`, `updatedAt` — see [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md) |
| `projects/{projectId}/menus/{menuId}` | setDoc merge, getDoc | Menu + items + links snapshot |
| `projects/{projectId}/checklists/{entryId}` | setDoc merge, collection query | Checklists / HACCP-style entries |

**Queries:** `collection('users')` (all users, trial filter).

Rules must allow: **`users/*/snapshots/*`** and **`projects/*/checklists/*`** (previously missing).

## Firebase Storage paths (client)

| Pattern | Source | Notes |
|---------|--------|--------|
| `users/{userId}/{category}/{entityId}/{file}` | `cloud-photo-manager.js` | `userId` from `authManager.currentUser.userId` — should align with `request.auth.uid` |
| `recipes/{recipeId}/{photoId}` | `recipe-photo-manager.js` | **Two-segment path**; rules must allow or client should move to `recipes/{uid}/{recipeId}/…` |
| `recipes/{userId}/{recipeId}/**` | `storage.rules` (intended) | Canonical shape for multi-tenant recipe files |

## IndexedDB (`secure-storage-manager.js` schema)

| Object store | keyPath |
|--------------|---------|
| `recipes` | `id` |
| `ingredients` | `id` |
| `projects` | `id` |
| `menus` | `id` |
| `cache` | `key` |

## localStorage — high-traffic keys (non-exhaustive)

| Key / pattern | Typical use |
|---------------|-------------|
| `current_user`, `session_active`, `saved_users`, `last_login`, `last_activity` | Auth |
| `iterum_auth_token`, `access_token` | API token |
| `iterum_projects`, `iterum_current_project`, `iterum_current_project_user_{userId}`, `active_project` | Projects |
| `recipes`, `recipe_ideas`, `recipe_stubs`, `pendingRecipes`, `recipe_library_{userId}` | Recipes |
| `ingredients`, `ingredients_database` | Ingredients |
| `iterum_vendors`, vendor connector keys | Vendors |
| `menus_{userId}`, `menu_data`, `menu_recipe_links` | Menus |
| `recipe_photos_{recipeId}` | Recipe photos metadata (local) |
| `user_file_{filepath}` | `userControlledStorage` virtual FS |
| `storage_encryption_key` | `secure-storage-manager` |
| `onboarding_completed`, `audit_log`, `robust_notes`, etc. | UX / misc |

## Firestore rules alignment (after patch)

- **`users/{userId}/snapshots/{id}`** — allowed if `userId == auth.uid` **or** the linked `users/{userId}` profile `email` matches `request.auth.token.email`.
- **`projects/{projectId}`** — **`allow read: if canAccessProjectDoc(projectId)`** (covers **get** and **list/query**). Each document in a query must pass ownership; broad unfiltered scans still fail rule evaluation.
- **`projects/.../checklists/...`** — allowed when parent project passes `canAccessProjectDoc`.
- **`isValidSize()`** — treats delete (`request.resource == null`) as valid so subcollection deletes are not blocked.

## Follow-ups

1. Prefer **Firebase Auth UID** in Storage paths and in `projects.firebaseUid` for rules.
2. Migrate `recipe-photo-manager` to `recipes/{uid}/{recipeId}/{photoId}` and remove the permissive legacy Storage rule.
3. Gradually move Firestore reads/writes for projects/menus through `project-data-access.js`.
