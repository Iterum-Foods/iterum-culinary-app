# M1 — `projectId` source-of-truth audit (E2a)

**Purpose:** Track where the **active workspace** comes from and where writes go, so multi-unit pilots do not corrupt the wrong `projectId`.  
**Owner:** CTO / Eng (M1). **Status:** **In progress** — engineering pass 2026-04-14 (code alignment); **human GO** on E1a still requires Vercel checklist.  
**Related:** [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) (E2a–b) · [DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md) · [M1_CTO_AGENT_DELEGATION.md](./M1_CTO_AGENT_DELEGATION.md)  

---

## Canonical mechanisms (today)

| Mechanism | Location | Notes |
|-----------|----------|--------|
| **Unified selector** | `public/assets/js/unified-project-selector.js` | `currentProjectId`; keys `iterum_current_project_user_{userId}` + legacy globals. Prefer **delegating** to `projectManager.setCurrentProject` when present. |
| **Project manager** | `public/assets/js/project-management-system.js` | Writes `iterum_current_project`, user-scoped keys, **`active_project*`** (dashboard / sync). |
| **State persistence** | `public/assets/js/state-persistence-manager.js` | `PROJECT_USER`; loads into `projectManager`. |
| **Thin Firestore API** | `public/assets/js/project-data-access.js` | Path helpers for `projects/{projectId}/...`. |
| **Firestore sync** | `public/assets/js/firestore-sync.js` | **`resolveProjectId()`** now follows: explicit → unified selector → PM → `iterum_current_project_user_*` → `iterum_current_project` → master → `active_project`. |

---

## E1 — Team access (M1 scope)

| Slice | Status | Notes |
|-------|--------|--------|
| **E1a** | **Code ready; prod checklist pending** | `project-hub-team.js` → `ensureProjectDoc` + `ensureProjectMemberDoc` with `authUid` + doc id = Firebase UID. Rules: `members/{memberId}` with `authUid == memberId`. **Human:** [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md) on Vercel. **CI:** Deploy Firebase must be green after rules/index changes. |
| **E1b** | **Reviewed** | `employee_line`: **`canWriteProjectMenusRecipesSnapshots`** is false; **`projects/.../checklists`** allow read/write for any `canAccessProjectDoc` (including line). Menus/recipes/snapshots: write denied for line. Matches intent in [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md) (line sees compliance-oriented dashboard tiles; not menu masters). |
| **E1c** | **OK** | [ADD_TEAMMATE_UID_PATH.md](./ADD_TEAMMATE_UID_PATH.md) matches `#team-access-panel`, `#team-project-select`, `#team-target-uid`, `#team-member-role`, `#team-add-member-btn`, `#team-access-msg`. |

---

## High-traffic modules

| Module / surface | How it resolves `projectId` | Firestore / API writes? | Risk | Status |
|------------------|----------------------------|-------------------------|------|--------|
| `menuManager.js` (`MenuManagerLegacy`) | **Updated:** unified → PM → `iterum_current_project_user_*` → `iterum_current_project` (JSON or raw id). Listens to **`projectChanged`** to reload draft storage key. | Local draft only; menu metadata tags `projectId` | Was **high** if only global key or PM stale; **lower** after cascade + listener | **Improved (PR)** |
| `dashboard-core.js` | `projectManager`, `active_project_*`, `project-changed` / `projectChanged` detail | `localStorage` keys scoped by `projectId` | Medium — relies on PM + events; aligned with `active_project*` set on switch | **OK** (monitor) |
| `universal-recipe-manager.js` | Unified → PM → user-scoped + global storage (`userId` or `id`) | Recipe tags | **OK** (prior fix) | **OK** |
| `firestore-sync.js` | **`resolveProjectId`** (unified-first cascade) | Menus, snapshots, checklists, members | Was **high** if PM lagged unified; **lower** now | **Improved (PR)** |
| `menu-recipe-integration.js` | **Updated:** unified → PM → user storage → `master` (replaces **`default`**) | Uses id for linkage | **Medium** → **lower** | **Improved (PR)** |
| `mobile-compliance.html` | `#project-picker`; membership via collectionGroup + `authUid` index | Compliance writes per selected project | **High** for pilots; depends on index deploy + rules | **Needs prod verify** |
| `project-hub.html` / `project-hub-team.js` | Admin-selected `#team-project-select` | `projects/{id}/members/{uid}` | **OK** if rules + UID path followed | **OK** (verify on prod) |
| `calendarManager.js` | Mostly `userDataManager` / globals; no `projectId` in class | Journal blobs | **Review** — pilot may expect per-workspace calendar later (E2c / backlog) | **TBD** |
| Menu builder page | `MenuManagerLegacy` + `menuManager` / Firestore sync when publishing | Mixed | Sync with selector after this PR | **Improved** |

---

## P0 issues found

| ID | Symptom | Repro | Fix / PR |
|----|---------|-------|----------|
| P0-1 | Firestore menu/snapshot writes could follow **stale `projectManager`** while header showed unified workspace | Switch project quickly; sync before PM in-memory update | **`resolveProjectId`** prefers `unifiedProjectSelector` + user-scoped storage — **fixed in repo** |
| P0-2 | Menu builder draft stayed on **old** `projectId` after switch | Change project on `menu-builder.html` without full reload | **`projectChanged`** handler on `MenuManagerLegacy` — **fixed in repo** |
| P0-3 | `menu-recipe-integration` used **`default`** when PM missing | Edge init order | **Cascade + `master`** — **fixed in repo** |

---

## E2b UX notes

| Observation | Status |
|-------------|--------|
| **Unified nav** exposes `#nav-project-chip` on shell pages using `unified-nav-header.js`. | **OK** on dashboard and other injected-nav pages. |
| **Unified project selector** loads on many HTML pages (`unified-project-selector.js`). | Dropdown shows current workspace; ensure pilot demos use a page with **header chip or dropdown** visible. |
| Pages with **only** legacy header and no chip | **Gap:** spot-check any straggler HTML without `unified-nav-header.js` / selector in pilot list — add in a follow-up PR if COO flags. |

**Single write path (E2c):** Optional follow-up in [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md); M1 stops at alignment + UX visibility above.

---

## Change log

| Date | Change |
|------|--------|
| 2026-04-14 | Seed audit table; CTO delegation [M1_CTO_AGENT_DELEGATION.md](./M1_CTO_AGENT_DELEGATION.md). |
| 2026-04-14 | Filled module table; E1a–c status; P0 fixes: `firestore-sync` `resolveProjectId`, `menuManager` cascade + `projectChanged`, `menu-recipe-integration` ids. |
