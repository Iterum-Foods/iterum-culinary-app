# Data access inventory (storage keys & Firestore)

Snapshot for supply-chain / security review. Regenerate diffs with ripgrep as code changes.  
**Operator UI roles** (not Firestore): [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md). **Source-of-truth (entity storage):** [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md). **Ship runbook:** [HOW_WE_SHIP.md](./HOW_WE_SHIP.md).

## Firestore paths (client: `public/assets/js/firestore-sync.js`)

| Path pattern | Operations | Notes |
|--------------|------------|--------|
| `users/{userId}` | setDoc merge, getDoc, updateDoc, deleteDoc, collection query | `userId` often normalized email/id from app, not always Firebase Auth UID |
| `users/{userId}/snapshots/recipeLibrary` | setDoc merge, getDoc | Recipe library blob snapshot |
| `users/{userId}/vendors/{vendorId}` | allow read/write per `firestore.rules` (owner or email-matched profile) | **E3a (client):** `firestore-sync.js` — `syncVendorsToFirestore` / `fetchVendorsFromFirestore`; **`vendorManager.js`** merges on load (cloud wins per stable doc key) and pushes on **`saveVendorsToFile`**. Local / `iterum_vendors` still used offline or when sync is unavailable. |
| `users/{userId}/vendor_prices/{priceId}` | allow read/write same as `vendors` subcollection (`isOwner` + size) | **E3c:** `syncVendorPriceRowToFirestore`, `fetchVendorPricesFromFirestore`, in-memory **`vendorPriceRows`** + **`getVendorPriceOverridesMap(projectId)`**. **`projectId` null** = account-wide default; non-null = workspace-specific (wins over default). **E3d:** **`cost-calculator.js`** applies overrides after local ingredient prices. **Deploy `firestore.rules`** when promoting. |
| `projects/{projectId}` | setDoc merge (`ensureProjectDoc`) | Metadata: `ownerId`, `ownerEmail`, `firebaseUid` (new), tags, names |
| `projects/{projectId}/members/{userId}` | setDoc merge (`ensureProjectMemberDoc`) | Company role: `role`, `email`, `updatedAt` — see [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md) |
| `projects/{projectId}/menus/{menuId}` | setDoc merge, getDoc | Menu + items + links snapshot |
| `projects/{projectId}/checklists/{entryId}` | setDoc merge, collection query | Checklists / HACCP-style entries |
| `projects/{projectId}/snapshots/bar_line_pack` | getDoc (shift app) | Bar: `drinks[]` (title + spec/build), `liquorsInStock` (string or list) — managers publish; same read rules as other snapshots |
| `users/{userId}/notes/{id}` (`lineAppType: bar_note`) | owner read/write | Shift app bar notes: optional `barTopic` drink\|stock\|general, `relatedDrink` |

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
| `iterum_vendors`, `iterum_vendors_e3b_imported_v1_*`, vendor connector keys | Vendors; E3b one-shot import flag per profile |
| `menus_{userId}`, `menu_data`, `menu_recipe_links` | Menus |
| `recipe_photos_{recipeId}` | Recipe photos metadata (local) |
| `user_file_{filepath}` | `userControlledStorage` virtual FS |
| `storage_encryption_key` | `secure-storage-manager` |
| `onboarding_completed`, `audit_log`, `robust_notes`, etc. | UX / misc |

### E3b — legacy vendor import (`vendorManager.js`)

| Item | Detail |
|------|--------|
| **Sources** | `iterum_vendors`; ingredient arrays **`ingredients_database`**, **`custom_ingredients`**, **`ingredients`** (`supplier`, `primaryVendor`, `vendor_info`, `vendorPrices[].vendor`). |
| **When** | Once per profile after cloud merge on vendor page load; **Import → Merge legacy data** re-runs with `force` (clears flag first). |
| **Merge** | Same stable key as E3a; **current list wins** over legacy rows and ingredient stubs. |
| **Flag** | `iterum_vendors_e3b_imported_v1__guest` or `iterum_vendors_e3b_imported_v1_{userId}` — delete key to treat next load as first import again. |
| **Rollback** | Export vendors before merging; restore prior **`iterum_vendors`** / user vendor file from backup; remove E3b flag and reload. |

### E3c — `vendor_prices` row (console / integration)

Minimal write (signed in, Firestore initialized):

```javascript
await window.firestoreSync.syncVendorPriceRowToFirestore({
  vendorDocId: 'normalized_vendor_doc_id',
  projectId: 'your_workspace_id_or_null',
  ingredientName: 'heavy cream',
  unitCost: 4.25,
  unit: 'qt',
  vendorName: 'Supplier display name'
});
```

`vendorDocId` should match **`iterumVendorDocId`** / stable id used under **`users/{uid}/vendors`**. Optional: **`ingredientId`**, **`sku`**.

## Firestore rules alignment (after patch)

- **`users/{userId}/snapshots/{id}`** — allowed if `userId == auth.uid` **or** the linked `users/{userId}` profile `email` matches `request.auth.token.email`.
- **`projects/{projectId}`** — **`allow read: if canAccessProjectDoc(projectId)`** (covers **get** and **list/query**). Each document in a query must pass ownership; broad unfiltered scans still fail rule evaluation.
- **`projects/.../checklists/...`** — allowed when parent project passes `canAccessProjectDoc`.
- **`isValidSize()`** — treats delete (`request.resource == null`) as valid so subcollection deletes are not blocked.

## Follow-ups

1. Prefer **Firebase Auth UID** in Storage paths and in `projects.firebaseUid` for rules.
2. Migrate `recipe-photo-manager` to `recipes/{uid}/{recipeId}/{photoId}` and remove the permissive legacy Storage rule.
3. Gradually move Firestore reads/writes for projects/menus through `project-data-access.js`.
