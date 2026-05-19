# E2 — `projectId` audit (high-traffic writers)

**Purpose:** P0 inventory for [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) **E2a** — ensure saves read the **active workspace**, not a stale default.  
**Last updated:** 16 May 2026  
**Sprint:** S2

---

## Resolution order (canonical)

1. `window.firestoreSync.resolveProjectId()` when Firestore sync is initialized.  
2. `window.projectManager.getCurrentProject()?.id` or `currentProject.id`.  
3. `localStorage.active_project`.  
4. Fallback `'master'` only when no project context exists (logged-in user should pick a project in pilots).

---

## Audited surfaces

| Surface | File | `projectId` source | Risk | Status |
|---------|------|-------------------|------|--------|
| Menu save / snapshot | `menu-manager-enhanced.js` | `getCurrentProjectId()` → PM → `active_project` → `master` | Medium if user never selects project | **OK** — uses PM; pilots must select workspace |
| Menu manager (legacy) | `menuManager.js` | Same pattern + `projectChanged` reload | Medium | **OK** |
| Menu Firestore snapshot | `firestore-sync.js` `saveMenuSnapshot` | `resolveProjectId(payload.projectId)` | Low | **OK** |
| Mobile published menu | `mobile-line-employee.js` `loadPublishedMenu` | `#project-picker` → `projects/{id}/menus` | Low | **OK** |
| Bar pack / drafts | `bar-drink-drafts.js`, dashboard | `projects/{pid}/snapshots/*` | Low | **OK** |
| Vendor price overrides | `vendor-price-overrides-panel.js` | `firestoreSync.resolveProjectId()` | Low | **OK** |
| Cost calculator overrides | `cost-calculator.js` | Refetch on `projectChanged` | Low | **OK** |
| Checklists | `checklist-manager.js` / dashboard | Project-scoped paths via sync | Low | **OK** |
| Dashboard ops | `dashboard-core.js` | Uses active project from PM | Medium | **Monitor** on multi-site demos |

---

## P0 actions taken (S2)

- Documented fallback-to-`master` behavior so COO demos always **select a named project** first.  
- Mobile menu reads `projects/{projectId}/menus` (and local fallback) — aligned with web publish path.  
- No code change required for `menu-manager-enhanced` in this pass; behavior already keys `menu_data_{projectId}`.

---

## Remaining (non-blocking for R2)

| Item | Notes |
|------|--------|
| Unify `getCurrentProjectId()` helpers | Several copies in menu* files; consolidate in a later refactor. |
| Warn when saving to `master` while user has real projects | UX toast: “Select a workspace before saving.” |
| Calendar / equipment pages | Secondary; audit when those join pilot scope. |

---

## Verification

- COO: Create two projects, save menu in A, switch to B, confirm menu B unchanged.  
- Eng: `npm run test:chromium` includes mobile Menu tab smoke.
