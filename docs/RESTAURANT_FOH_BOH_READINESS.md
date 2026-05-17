# Restaurant readiness — full FOH & BOH employee use

**Purpose:** Ordered path from **today’s codebase** to **daily use by front-of-house and back-of-house staff** on web + mobile shift tools, without pretending POS/ERP is in scope.  
**Pilot bar:** [PILOT_ACCEPTANCE_CRITERIA_WEB.md](./PILOT_ACCEPTANCE_CRITERIA_WEB.md) · **Engineering queue:** [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) · **Human gates:** [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md) · **QA script:** [QA_FEATURE_TEST_WORKFLOW.md](./QA_FEATURE_TEST_WORKFLOW.md)

**Last updated:** 16 May 2026

---

## Who this covers

| Side | Typical roles (Firestore `members.role`) | Primary surfaces |
|------|------------------------------------------|------------------|
| **BOH** | `kitchen_staff`, `line_cook`, `prep_cook`, `employee_line`, `expeditor`, `dishwasher`, `bakery_pastry` | `mobile-compliance.html` — prep lists, temps, opening checks, hub |
| **FOH** | `front_of_house`, `server`, `host`, `runner`, `bartender` | Same app — **role-aware Today panel**, **Bar** tab (pack + checklists), menu/recipes tab when published |
| **Bar lead** | `bar_manager`, `bartender` | Mobile **Bar** + dashboard **Bar drink drafts** / **Bar checklists** (manager publish) |
| **Managers** | `location_manager`, `account_admin`, `chef_leadership`, `operations_gm` | `dashboard.html`, `project-hub.html`, menu/recipe/vendor pages |

Role mapping and dashboard flags: [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md). Operator journeys: [USER_WORKFLOW_GUIDE.md](./USER_WORKFLOW_GUIDE.md) §C–D.

---

## Readiness tiers

| Tier | Definition | Target |
|------|------------|--------|
| **R0 — Trust** | Auth, prod deploy, teammate UID flow, demo opt-in, smoke green | **Now** |
| **R1 — Shift-ready** | Line/FOH/BOH can pick workspace, run one full shift on mobile (checks, temps, bar/prep as configured) | **1–2 weeks** after R0 human GO |
| **R2 — Kitchen + floor aligned** | Menus/recipes published to snapshots; FOH briefing + server sheets; manager dashboard reflects same `projectId` | **2–4 weeks** |
| **R3 — Pilot-complete** | Costing/vendor story for sponsor; cross-workspace compare if multi-unit; acceptance criteria 1–5 met | **P1 epics E3–E4** |

---

## Phase 0 — Trust & access (block everything else until green)

| # | Action | Owner | Done when |
|---|--------|-------|-----------|
| 0.1 | `npm run test:chromium` + `npm run test:smoke:prod` on `main` | Eng | CI / local green |
| 0.2 | Human **[PHASE_1_TEAMMATE_FLOW_CHECKLIST](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md)** on Vercel prod | COO | Admin adds line + FOH test accounts; workspace appears in picker |
| 0.3 | Deploy Firebase rules/indexes after any rules change | Eng | [HOW_WE_SHIP.md](./HOW_WE_SHIP.md) |
| 0.4 | [FUNCTIONAL_READINESS_GATE.md](./FUNCTIONAL_READINESS_GATE.md) items 1–6 reviewed | CEO/COO | Gaps logged, not hidden |

---

## Phase 1 — BOH daily shift (mobile-first)

**Surface:** `mobile-compliance.html` (installable; same Firebase identity as web).

| # | Capability | Verify with |
|---|------------|-------------|
| 1.1 | Sign-in → **Where are you working today?** → workspace persists | QA §2.1 |
| 1.2 | **Today** panel + role chip + quick actions | QA §2.2 |
| 1.3 | Temps / sanitizer validation | QA §2.3 |
| 1.4 | Prep / opening checklists tied to project | QA §2 + dashboard checklist deep link |
| 1.5 | Team log / shift notes (no manager-only blocks for line) | QA §2; `dashboard_manager_notes` hidden for line on web |

**Engineering backlog (BOH):**

- [ ] **E2** — Audit menu/recipe/checklist writers for correct `projectId` on save ([P1_EPIC_BREAKDOWN](./P1_EPIC_BREAKDOWN.md) E2a).
- [ ] **Rules** — Tighten member writes so line cannot edit menu masters (planned in [ROLES_AND_PERMISSIONS](./ROLES_AND_PERMISSIONS.md); today members may write broadly).
- [ ] **Offline queue** — Document “online required” for pilots until offline log ships.

---

## Phase 2 — FOH & bar daily shift

**Surface:** same `mobile-compliance.html`; UI branches on **raw** `members.role` (e.g. `front_of_house` → Today actions: menu, team, jobs).

| # | Capability | Verify with |
|---|------------|-------------|
| 2.1 | FOH/server/host **Today** quick actions (menu, team, jobs) | Sign in as `front_of_house` member; QA §2.2 |
| 2.2 | **Bar** tab — published drink builds from dashboard | QA §2.5 |
| 2.3 | **Bar checklists** — manager publish on dashboard, staff Done/Need on mobile | QA §2.6 |
| 2.4 | **ID quick reference** (21+ / 18+) on Hub + Bar | QA §2.7 |
| 2.5 | **FOH briefing / server sheets** — manager path | `kitchen-management.html` + `menu-foh-manager.js` loaded; export/server-info flows |

**Engineering backlog (FOH):**

- [x] Load `menu-foh-manager.js` on kitchen management (FOH briefing was falling back without script).
- [ ] Expose **read-only menu snapshot** on mobile **Menu** tab for FOH when menu published to project snapshots (confirm data path in [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md)).
- [ ] Staff one-pager: “FOH first shift” (link from project-hub invite helper).

---

## Phase 3 — Managers & back office (web)

Needed so FOH/BOH see **correct** menus, specs, and checklists.

| # | Workflow | Pages |
|---|----------|--------|
| 3.1 | Workspace + team | `project-hub.html`, [ADD_TEAMMATE_UID_PATH.md](./ADD_TEAMMATE_UID_PATH.md) |
| 3.2 | Menu build / import | `menu-builder.html`, [MENU_IMPORT_WORKFLOW.md](./MENU_IMPORT_WORKFLOW.md) |
| 3.3 | Recipes & library | `recipe-developer.html`, `recipe-library.html` |
| 3.4 | Purchasing & plate cost | `vendor-management.html`, `ingredients.html` |
| 3.5 | Opening / ops rhythm | `dashboard.html` (checklists, bar publish, team prep board) |
| 3.6 | Equipment / specs | `equipment-management.html`, `spec-library.html` |

**Engineering backlog (managers):**

- [ ] **E3c** — Operator UI for vendor **price overrides** (not console-only).
- [ ] **E3d** — Costing tests: menu lines pull overrides after `projectChanged`.
- [ ] **E5** — One authenticated Playwright path (sign-in → dashboard or mobile workspace select).

---

## Phase 4 — Pilot sign-off

Run [QA_FEATURE_TEST_WORKFLOW.md](./QA_FEATURE_TEST_WORKFLOW.md) end-to-end with **three accounts**: `account_admin`, `kitchen_staff` (or `employee_line`), `front_of_house` (or `bartender`).

Collect evidence for [PILOT_ACCEPTANCE_CRITERIA_WEB.md](./PILOT_ACCEPTANCE_CRITERIA_WEB.md):

1. Trust (teammate flow GO)  
2. Adoption (≥1 menu saved in workspace)  
3. Operational use (weekly line log / menu sponsor sign-off)  
4. Costing (if in SOW)  
5. Support SLA  

---

## Suggested sprint order (next 3 engineering slices)

| Sprint | Focus | Outcome |
|--------|--------|---------|
| **S1** | R0 + R1 QA fixes | Prod teammate flow GO; mobile shift checklist fully passed |
| **S2** | R2 snapshots + FOH | Menu/bar packs visible on mobile; kitchen FOH briefing works; E2 P0 writers fixed |
| **S3** | R3 pilot | E3 override UI + E5 auth E2E; pilot definitions sheet + retro |

---

## Out of scope (do not block “restaurant ready” on these)

- POS integration, payroll, scheduling  
- Full SAML / email invite automation (UID path is acceptable for pilot)  
- Every legacy HTML tool page redesigned ([UI_AND_WORKFLOW_ROADMAP.md](./UI_AND_WORKFLOW_ROADMAP.md))

---

## Revision history

| Date | Change |
|------|--------|
| 2026-05-16 | Initial FOH/BOH readiness map; kitchen-management FOH script wired. |
