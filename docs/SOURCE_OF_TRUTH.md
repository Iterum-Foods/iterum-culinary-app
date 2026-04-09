# Source of truth — core entities (v1)

**Purpose:** One place that states **canonical storage** for recipes, menus, vendors, and checklists until product and sync fully converge.  
**Companion:** [DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md) (paths, keys, rules).  
**Last updated:** March 2026  

---

## Summary table

| Entity | Primary (operator truth today) | Cloud (Firestore) | Direction |
|--------|----------------------------------|-------------------|-----------|
| **Recipes (working copy)** | Browser `localStorage` + app-specific keys | `users/{id}/recipes/*`, snapshots under `users/.../snapshots/recipeLibrary`; optional `projects/{id}/recipes` | **Local-first**; cloud is backup/sync where wired. |
| **Menus** | `localStorage` + enhanced menu manager keys | `projects/{projectId}/menus/*` via `firestore-sync` / menu snapshot flows | **Local-first** for editing; **project path** canonical for shared venue snapshot when saved. |
| **Vendors / ingredients** | `localStorage` + per-feature keys | Partial: user-scoped collections where implemented | **Local-first**; align incremental writes to `users/{id}/vendors` etc. per inventory doc. |
| **Checklists / HACCP-style** | Mix: dashboard compliance often `users/{id}/*` paths | `projects/{projectId}/checklists/*` where sync used | **Documented split:** compliance logs may stay **user-scoped** in rules today; **project checklists** for shared venue — prefer `project-data-access` pattern for new work. |

---

## Exceptions (why one pattern does not fit yet)

- **Recipe library snapshot** is a **blob** sync in `firestore-sync.js` — not yet forced through `project-data-access.js`. Exception is **intentional** until refactored; tracked in exec checklist as phased.
- **Checklists** may exist both under **`users/{userId}/...`** (compliance) and **`projects/{projectId}/checklists`** — rules allow both; product should **prefer project path** when the checklist belongs to a venue.
- **`employee_line`** members: **read** `projects/.../menus`, `recipes`, `snapshots`; **write** only **`checklists`** (see `firestore.rules`).

---

## Decisions still owned by leadership

- **ICP** (single vs multi-unit pilot) affects whether “per project” vs “per user” is stressed in UX and training — not a code-only choice. See [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) P1 rows.

---

## Change log

| Date | Change |
|------|--------|
| 2026-03-29 | Initial v1 table + exceptions + employee_line note. |
