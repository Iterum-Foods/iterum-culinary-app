# Source of truth — core entities (v1)

**Purpose:** One place that states **canonical storage** for recipes, menus, vendors, and checklists until product and sync fully converge.  
**Companion:** [DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md) (paths, keys, rules).  
**Last updated:** 2026-03-29    

---

## Summary table

| Entity | Primary (operator truth today) | Cloud (Firestore) | Direction |
|--------|----------------------------------|-------------------|-----------|
| **Recipes (working copy)** | Browser `localStorage` + app-specific keys | `users/{id}/recipes/*`, snapshots under `users/.../snapshots/recipeLibrary`; optional `projects/{id}/recipes` | **Local-first**; cloud is backup/sync where wired. |
| **Menus** | `localStorage` + enhanced menu manager keys | `projects/{projectId}/menus/*` via `firestore-sync` / menu snapshot flows | **Local-first** for editing; **project path** canonical for shared venue snapshot when saved. |
| **Vendors / ingredients** | `localStorage` + per-feature keys (`iterum_vendors`, user file via `userDataManager`) | **`users/{id}/vendors/*`**; **`users/{id}/vendor_prices/*`** (per-workspace or account-default unit costs) | **Local-first** with vendor **bidirectional sync** when signed in. **E3b** legacy merge. **E3c–d:** `cost-calculator` applies **`vendor_prices`** for active **`projectId`** after local ingredient prices. |
| **Checklists / HACCP-style** | Mix: dashboard compliance often `users/{id}/*` paths | `projects/{projectId}/checklists/*` where sync used | **Documented split:** compliance logs may stay **user-scoped** in rules today; **project checklists** for shared venue — prefer `project-data-access` pattern for new work. |

---

## Exceptions (why one pattern does not fit yet)

- **Recipe library snapshot** is a **blob** sync in `firestore-sync.js` — not yet forced through `project-data-access.js`. Exception is **intentional** until refactored; tracked in exec checklist as phased.
- **Checklists** may exist both under **`users/{userId}/...`** (compliance) and **`projects/{projectId}/checklists`** — rules allow both; product should **prefer project path** when the checklist belongs to a venue.
- **Field-staff roles** (`employee_line`, `front_of_house`, `kitchen_staff`, `support_staff`): **read** `projects/.../menus`, `recipes`, `snapshots`; **write** **`checklists`** (not menu/recipe/snapshot masters) — see `isFieldStaffMember` in `firestore.rules`.

---

## Decisions still owned by leadership

- **ICP** (single vs multi-unit pilot) affects whether “per project” vs “per user” is stressed in UX and training — not a code-only choice. See [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) P1 rows.

---

## Week 1 contracts (operations workflows)

- Canonical contracts for checklist definitions, checklist logs, corrective actions, and spec docs live in:
  - [contracts/WEEK1_CANONICAL_CONTRACTS.md](./contracts/WEEK1_CANONICAL_CONTRACTS.md)
  - [contracts/checklist-definition.schema.json](./contracts/checklist-definition.schema.json)
  - [contracts/checklist-log-entry.schema.json](./contracts/checklist-log-entry.schema.json)
  - [contracts/corrective-action.schema.json](./contracts/corrective-action.schema.json)
  - [contracts/spec-document.schema.json](./contracts/spec-document.schema.json)

## Change log

| Date | Change |
|------|--------|
| 2026-04-25 | Added Week 1 canonical operations contract pack references (checklist, logs, corrective actions, specs). |
| 2026-03-29 | Initial v1 table + exceptions + employee_line note. |
