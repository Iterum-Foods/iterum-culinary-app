# M1 — `projectId` source-of-truth audit (E2a)

**Purpose:** Track where the **active workspace** comes from and where writes go, so multi-unit pilots do not corrupt the wrong `projectId`.  
**Owner:** CTO / Eng (M1). **Status:** **In progress** — started 2026-04-14.  
**Related:** [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) (E2a–b) · [DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md)  

---

## Canonical mechanisms (today)

| Mechanism | Location | Notes |
|-----------|----------|--------|
| **Unified selector** | `public/assets/js/unified-project-selector.js` | `currentProjectId`, `STORAGE_KEYS.CURRENT_PROJECT` + `currentUserId`. |
| **Project manager** | `public/assets/js/project-management-system.js` | `iterum_current_project`, `iterum_current_project_user_{userId}`. |
| **State persistence** | `public/assets/js/state-persistence-manager.js` | Keys `PROJECT`, `PROJECT_USER`; syncs with `projectManager`. |
| **Thin Firestore API** | `public/assets/js/project-data-access.js` | Path helpers for `projects/{projectId}/...`. |

---

## High-traffic modules (fill in)

| Module / surface | How it resolves `projectId` | Firestore / API writes? | Risk | Status |
|------------------|----------------------------|-------------------------|------|--------|
| `menuManager.js` | `getCurrentProjectId()` → selector / `projectManager` / localStorage | Yes (menus) | Medium — verify event sync when switching | **TBD** |
| `dashboard-core.js` | `projectManager`, `storedId`, `project-changed` event | Mostly localStorage keys scoped by `projectId` | Medium — must subscribe to project changes | **TBD** |
| `universal-recipe-manager.js` | `getCurrentProjectId()` mirrors selector / localStorage | Recipes / tags | Medium | **TBD** |
| `firestore-sync.js` | (audit: `projectId` from caller) | Menus, projects, checklists | **High** — core path | **TBD** |
| `mobile-compliance.html` + picker JS | `#project-picker` / membership | Compliance logs per project | **High** for line log pilots | **TBD** |
| `project-hub.html` | Admin selects **target** project for **members** | Writes `members/{uid}` | **High** — must match rules | **TBD** |
| `calendarManager.js` | Mostly `userDataManager` / global keys; **no** `projectId` in class | Journal / maintenance blobs | **Review** — confirm if pilot needs per-project calendar | **TBD** |
| Menu builder page scripts | Via `menuManager` / imports | Mixed | **TBD** | **TBD** |

---

## P0 issues found

| ID | Symptom | Repro | Fix / PR |
|----|---------|-------|----------|
| — | — | — | — |

---

## E2b UX notes

- Header / selector visibility: list pages where **current workspace** is invisible today.  
- Single write path proposal (optional M1 follow-up): document in [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md) when E2c starts.

---

## Change log

| Date | Change |
|------|--------|
| 2026-04-14 | Seed audit table; CTO delegation [M1_CTO_AGENT_DELEGATION.md](./M1_CTO_AGENT_DELEGATION.md). |
