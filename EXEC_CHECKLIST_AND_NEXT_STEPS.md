# Executive checklist & next steps

**Purpose:** Single page for leadership to track launch readiness and foundation work.  
**Companions:** [CEO_BRIEF_CURRENT_STATE_AND_PRIORITIES.md](./CEO_BRIEF_CURRENT_STATE_AND_PRIORITIES.md) · [NEXT_STEPS_LEADERSHIP.md](./NEXT_STEPS_LEADERSHIP.md) · [LEADERSHIP_ROLE_ASSIGNMENTS.md](./LEADERSHIP_ROLE_ASSIGNMENTS.md) · [TEAM_ACTION_PLAN.md](./TEAM_ACTION_PLAN.md) · [docs/CEO_TEAM_TASK_LIST_TO_MARKET.md](./docs/CEO_TEAM_TASK_LIST_TO_MARKET.md) (delegated CEO task list) · [docs/PILOT_APP_COMPLETION_MASTER.md](./docs/PILOT_APP_COMPLETION_MASTER.md) (completion definition + backlog) · [docs/P1_EPIC_BREAKDOWN.md](./docs/P1_EPIC_BREAKDOWN.md) (E1–E5) · [docs/M1_COO_PROD_VERIFICATION.md](./docs/M1_COO_PROD_VERIFICATION.md) (M1 human gate) · [docs/APP_COMPLETION_PLAN.md](./docs/APP_COMPLETION_PLAN.md) · [docs/HOW_WE_SHIP.md](./docs/HOW_WE_SHIP.md) · [docs/SOURCE_OF_TRUTH.md](./docs/SOURCE_OF_TRUTH.md) · [docs/workflows/](./docs/workflows/) (e.g. sign-in UI redesign)  
**Last updated:** 29 March 2026

---

## Next steps (pick up here)

**Close M1 (human + prod)** — [M1_COO_PROD_VERIFICATION.md](./docs/M1_COO_PROD_VERIFICATION.md)

- [ ] **Vercel** production reflects latest `main` (dashboard green).
- [ ] **Deploy Firebase** last run on `main` is **success** ([workflow](https://github.com/Iterum-Foods/iterum-culinary-app/actions/workflows/firebase-deploy.yml)).
- [ ] **M1 — three checks** on `https://iterum-culinary-app.vercel.app`: teammate flow, Firebase status, two-workspace demo.
- [ ] **Teammate checklist** — [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./docs/PHASE_1_TEAMMATE_FLOW_CHECKLIST.md) steps **1–8** on prod.

**After M1 GO — E3 (vendor catalog)**

- [ ] Answer **E3 prep** in [HOW_WE_SHIP.md](./docs/HOW_WE_SHIP.md) (shared list vs per-venue, price overrides, owner role).
- [ ] Eng sequences **E3** in [P1_EPIC_BREAKDOWN.md](./docs/P1_EPIC_BREAKDOWN.md).
- [ ] File map + golden-path tasks: [GOLDEN_PATH_AUDIT.md](./docs/GOLDEN_PATH_AUDIT.md).

**Owner Bot (pilot walkthrough)**

- [ ] `npm run owner-bot:init` → edit `scripts/owner-bot/.env.owner-bot` with test Firebase user
- [ ] Terminal 1: `npm run serve:test` · Terminal 2: `npm run owner-bot:run` — see [scripts/owner-bot/README.md](./scripts/owner-bot/README.md)

**CI / automation (optional)**

- [ ] If you use **Automated Dependency Updates**: repo **Settings → Actions → General** — allow Actions to **create pull requests** (see comment in [dependency-update.yml](./.github/workflows/dependency-update.yml)).

---

## Leadership log (CEO / CTO)

<a id="leadership-log-ceo-cto"></a>

_Use this section for short, dated notes that do not belong in a checkbox row._

**2026-03-29 — Quick wins (parallel to M1 human checks):** Project chip sync extended to **`kitchen-project-chip`** and **`menu-project-chip`** via [unified-nav-header.js](./public/assets/js/unified-nav-header.js); runbook expanded — [HOW_WE_SHIP.md](./docs/HOW_WE_SHIP.md) (custom domain, 5-minute pilot demo, E3 prep questions).

**2026-03-29 — M1 engineering ship batch (pre–human GO):** Pushed to **`main`** **`a6ece5d`** — Iterum **Shift** branded mobile layer (`mobile-shift-brand.css`, `mobile-compliance.html`, `manifest-compliance.json`), Playwright smoke fix for Shift landing (`tests/e2e/smoke.spec.js`), **`npm run test:chromium`** for local/CI parity. **COO next:** run [M1_COO_PROD_VERIFICATION.md](./docs/M1_COO_PROD_VERIFICATION.md) on Vercel prod after deploy lands; **CTO:** confirm **Deploy Firebase** green (this batch touched `firestore.rules` / `firestore.indexes.json` / `storage.rules`).

**2026-03-29 — Phase 0 closed (production trust):** Deploy Firebase CI green on `main`; Firestore **members** / **authUid** collection group index verified; [A1_P0_PROD_SMOKE_RECORD.md](./docs/A1_P0_PROD_SMOKE_RECORD.md) → **GO** (human steps **2** + **4**); COO executive pack + **CEO P0 approval** recorded below. **Next organizational gate:** Phase 1 — [CEO_TEAM_TASK_LIST_TO_MARKET.md](./docs/CEO_TEAM_TASK_LIST_TO_MARKET.md#phase-1--web-app-pilot-ready) (ICP lock, teammate path, support playbook, pilot acceptance criteria).

**2026-04-14 — P1 engineering plan:** [P1_EPIC_BREAKDOWN.md](./docs/P1_EPIC_BREAKDOWN.md) (E1–E5, **~13–22** eng-weeks sequential; vendor_catalog sketch). **M1 in progress:** [M1_CTO_AGENT_DELEGATION.md](./docs/M1_CTO_AGENT_DELEGATION.md) (CTO/Eng agent) · [M1_PROJECTID_AUDIT.md](./docs/M1_PROJECTID_AUDIT.md) (E2a).

**2026-04-14 — M1 code landed (`2e28c70`):** `projectId` resolution aligned in `firestore-sync.js`, `menuManager.js`, `menu-recipe-integration.js`; audit doc updated (E1b reviewed, E2a/E2b, P0 fixes recorded). **M1 not closed until:** human [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./docs/PHASE_1_TEAMMATE_FLOW_CHECKLIST.md) on **Vercel prod** + **Deploy Firebase** green if rules/indexes changed. **COO:** re-run two-workspace demo on prod (menu-builder draft follows switch; mobile-compliance). **Follow-up PR:** nav chip / selector on straggler pages; calendar scope → E2c/backlog.

**CEO directive — “Finish” = pilot-ready trust, not feature-complete**  
**Decision:** We ship **pilot-ready** as defined in [docs/APP_COMPLETION_PLAN.md](./docs/APP_COMPLETION_PLAN.md) (prod URL, **green** Firebase rules deploy, **A1 GO**, exec sign-off, documented teammate path). Everything else is **sequenced P1–P2**, not a blocker to the first paying or structured pilot **once P0 is green**.

| Delegate                        | Owns (now)                                                                                                                                                   | Done when                                                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CTO** (technical accountable) | **`FIREBASE_TOKEN`** / permissions; **Deploy Firebase** CI green on `main`; optional `members/{uid}` spot-check                                              | Latest [Deploy Firebase](https://github.com/Iterum-Foods/iterum-culinary-app/actions/workflows/firebase-deploy.yml) run **success**; [HOW_WE_SHIP](./docs/HOW_WE_SHIP.md) triage applied if needed |
| **COO** (process accountable)   | **A1** human steps **2** + **4** on Vercel URL; fill [A1_P0_PROD_SMOKE_RECORD](./docs/A1_P0_PROD_SMOKE_RECORD.md); package **executive P0 sign-off** for CEO | Smoke record → **GO**; checklist **Executive sign-off** row ready for CEO **yes**                                                                                                                  |
| **Eng**                         | **P1 delivery** per [P1_EPIC_BREAKDOWN](./docs/P1_EPIC_BREAKDOWN.md); keep `main` healthy (lint/smoke); **Ship & verify** on rules changes                   | **M1 eng:** `2e28c70` on `main`; **next:** straggler nav/chip PRs optional; E3 when M1 human GO                                                                                                    |
| **CEO** (me)                    | **ICP** locked 2026-04-14 ([ICP_DECISION_RECORD](./docs/ICP_DECISION_RECORD.md)); steer P1 delivery + pilots                                                 | **Next:** confirm M1 human bar (teammate checklist + COO demo), then green-light **E3** vendor catalog with CTO                                                                                    |
| **PM or COO**                   | P1 acceptance criteria + pilot shortlist                                                                                                                     | Rows closed in P1 tables below                                                                                                                                                                     |

**Cursor / AI personas:** Do not run one generic thread for “the whole app.” Use the role prompts in [LEADERSHIP_ROLE_ASSIGNMENTS.md → AI agent prompts](./LEADERSHIP_ROLE_ASSIGNMENTS.md#ai-agent-prompts) — e.g. **CTO-shaped** session for deploy/rules/security, **COO-shaped** for checklist and pilot comms, **engineering** session for code. Same RACI as humans; agents are tools, not owners of sign-off.

---

**2026-03-29 — Analytics & pilot reporting (Data Analyst proxy; no warehouse assumed)**  
Recorded so exports and decks use one set of definitions (see paths/keys in [docs/DATA_ACCESS_INVENTORY.md](./docs/DATA_ACCESS_INVENTORY.md)):

- **Project vs location:** Segment everything on **`projectId`** until first-class **restaurant/site IDs** exist in the product. Do not call `projectId` “location” in external reporting; label the gap on every margin or vendor comparison.
- **Margin & food cost:** Adopt one org-wide pair of definitions—e.g. **gross margin %** = (price − allocated recipe cost) / price and/or **food cost %** = recipe cost / price. **Tax:** document whether **menu/selling price** and **vendor/ingredient costs** in the app are **pre-tax or post-tax** (or mixed) so reports do not mix bases.
- **Recipe cost & missing price:** Ingredient quantities × **unit costs in a normalized UOM**, including sub-recipes where modeled. **Missing or zero vendor price** = **data-quality flag** only—do not treat as trustworthy margin.
- **Vendor price drift:** Track **UOM-normalized** unit price over time per **vendor × SKU (or canonical ingredient key)**; cross-venue splits use **project** until site IDs exist.
- **MVP reporting:** **Firestore export** and/or **manual CSV/JSON** plus a **definitions sheet** (one page in Sheets/notebook); **no data warehouse** required for MVP. Expand to event funnels only when the product logs anonymized usage.
- **Pilot success signals (examples):** **Adoption** — projects with ≥1 menu saved/synced in window; **costing completeness** — % menu lines with recipe link and non-imputed costs; **economics** — item-level margin (same formula) **before vs after** a pricing or vendor change.

_Data paths / keys:_ [docs/DATA_ACCESS_INVENTORY.md](./docs/DATA_ACCESS_INVENTORY.md). _Data analyst role block:_ [LEADERSHIP_ROLE_ASSIGNMENTS.md → Data analyst agent](./LEADERSHIP_ROLE_ASSIGNMENTS.md#data-analyst-agent-nice-to-have).

---

## How to use this doc

- Treat **[ ]** as not started, **[~]** as in progress, **[x]** as done (update as you close items).
- **Owner** = name or role; leave blank until assigned.
- Review **monthly** or before any major customer pilot.

---

## Ship & verify (after each rules / membership change)

Run this block whenever `firestore.rules`, `storage.rules`, or membership-related client code ships to `main`.

| Status | Step                                                                                                                                                                                                         | Owner     | Notes                                                                                                                                                                                                                                                                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [x]    | **CI:** Workflow **Deploy Firebase** succeeded on `main` ([Actions · Deploy Firebase](https://github.com/Iterum-Foods/iterum-culinary-app/actions/workflows/firebase-deploy.yml)).                           | Eng / CTO | **2026-03-29:** Phase 0 — green run recorded after role-prompt completion. _Historic triage:_ prior failure `fccef3a` [24173148382](https://github.com/Iterum-Foods/iterum-culinary-app/actions/runs/24173148382); see [HOW_WE_SHIP → If Deploy Firebase fails](./docs/HOW_WE_SHIP.md#if-deploy-firebase-fails-in-ci) if regressions. |
| [x]    | **App URL:** Smoke on **Vercel** production (`https://iterum-culinary-app.vercel.app/`) — not only localhost.                                                                                                | Eng       | **`npm run test:smoke:prod`** — 4/4 Playwright checks passed (2026-03-29).                                                                                                                                                                                                                                                            |
| [x]    | **A1 record:** [docs/A1_P0_PROD_SMOKE_RECORD.md](./docs/A1_P0_PROD_SMOKE_RECORD.md) → **GO** (all required steps).                                                                                           | Ops / COO | **2026-03-29:** **GO** — human **2** (sign-in persistence) + **4** (recipe photo on Vercel) completed per Phase 0 close.                                                                                                                                                                                                              |
| [ ]    | **(Optional)** In Firebase Console → Firestore, confirm `projects/{projectId}/members/{yourUid}` exists with `role` after owner sync (see [docs/ROLES_AND_PERMISSIONS.md](./docs/ROLES_AND_PERMISSIONS.md)). | Eng       | Verifies **company membership** rules are live.                                                                                                                                                                                                                                                                                       |

---

## P0 — Security, data contract, trust

| Status | Item                                                                                                       | Owner                 | Notes                                                                                                                                                                                                                                                                                                                              |
| ------ | ---------------------------------------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [x]    | Document Firestore paths + localStorage keys (technical inventory)                                         | Eng                   | See [docs/DATA_ACCESS_INVENTORY.md](./docs/DATA_ACCESS_INVENTORY.md)                                                                                                                                                                                                                                                               |
| [x]    | Align Firestore rules with real client usage (projects, snapshots, checklists)                             | Eng                   | `firestore.rules` — deploy to production when ready                                                                                                                                                                                                                                                                                |
| [x]    | Align Storage rules with client paths (incl. legacy recipe photo path)                                     | Eng                   | `storage.rules` — deploy with Firestore                                                                                                                                                                                                                                                                                            |
| [x]    | **Deploy** updated rules to production + smoke-test app (sign-in, menu sync, photos)                       | CTO + Eng / Ops       | **2026-03-27:** Rules released to **`iterum-culinary-app2`**. **2026-03-29+:** `projects/.../members/{uid}` + company roles — redeploy via **Deploy Firebase** CI whenever `firestore.rules` changes; complete **Ship & verify** above.                                                                                            |
| [x]    | Confirm no production code relies on **listing** all `projects` in a way that breaks under tightened rules | CTO + Eng             | **Pass:** `firestore-sync.js` uses **`doc('projects', id)` only**. Root `projects` **query** only in `cloud-data-sync.js` (`where('userId','==',...)`). Rules now use **`allow read`** (not `list: false`) so filtered queries can be evaluated; `ensureProjectDoc` fields are `ownerId` / `firebaseUid` (legacy query may no-op). |
| [x]    | Executive sign-off: “Rules deployed + spot-check OK”                                                       | COO (package for CEO) | **2026-03-29:** CEO **P0 approved** after CI green + A1 **GO** + risks reviewed (Phase 0).                                                                                                                                                                                                                                         |

---

## P0 — Single data-access direction (phased)

| Status | Item                                                                                                                  | Owner                             | Notes                                                                                                                                                    |
| ------ | --------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [x]    | Introduce thin wrapper for **Project** entity (`project-data-access.js`)                                              | Eng                               | Menu builder wired as first consumer                                                                                                                     |
| [x]    | Route **checklists** and **recipe library** snapshots through same pattern (or document exceptions)                   | Eng                               | **Exceptions documented:** [docs/SOURCE_OF_TRUTH.md](./docs/SOURCE_OF_TRUTH.md) (split paths + phased refactor). Code consolidation remains incremental. |
| [x]    | Decide **source of truth** per entity (local-first vs cloud-first) for recipes, menus, vendors — document in one page | CTO + PM / Eng (COO if no PM yet) | **Done:** [docs/SOURCE_OF_TRUTH.md](./docs/SOURCE_OF_TRUTH.md) v1; refine after ICP lock.                                                                |

---

## P1 — Product: account → restaurants → menus

| Status | Item                                                                                                       | Owner            | Notes                                                                                                                          |
| ------ | ---------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [x]    | Confirm ICP for next 90 days: multi-unit vs single venue vs consultant                                     | **CEO** (ratify) | **2026-04-14:** Ratified — [docs/ICP_DECISION_RECORD.md](./docs/ICP_DECISION_RECORD.md).                                       |
| [x]    | Define **acceptance criteria** for “one manager, multiple restaurants, shared vendors, comparable pricing” | COO agent        | **Web pilot bar:** [docs/PILOT_ACCEPTANCE_CRITERIA_WEB.md](./docs/PILOT_ACCEPTANCE_CRITERIA_WEB.md); CEO brief success metrics |
| [x]    | Epic breakdown + engineering estimate                                                                      | CTO + PM / Eng   | **2026-04-14:** [docs/P1_EPIC_BREAKDOWN.md](./docs/P1_EPIC_BREAKDOWN.md) — E1–E5 + eng-week ranges + milestones.               |

---

## P1 — Shared vendors & pricing

| Status | Item                                                                   | Owner          | Notes                                                                                                                                                  |
| ------ | ---------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [x]    | Data model sketch: vendor directory, site/location linkage, price rows | CTO + PM / Eng | **2026-04-14:** [docs/P1_EPIC_BREAKDOWN.md](./docs/P1_EPIC_BREAKDOWN.md#p1-vendor-data-sketch) (`users/{uid}/vendor_catalog/...`). Refine after pilot. |
| [ ]    | Pilot customer identified for design validation                        | COO / Sales    | Optional but high leverage                                                                                                                             |

---

## P2 — Quality gates & velocity

| Status | Item                                                                                   | Owner | Notes                                 |
| ------ | -------------------------------------------------------------------------------------- | ----- | ------------------------------------- |
| [x]    | ESLint required on `main`; Prettier required for `public/assets` JS/CSS                | Eng   | CI: `.github/workflows/lint.yml`      |
| [x]    | Playwright **smoke** tests (home, sign-in, dashboard, menu builder)                    | Eng   | CI: `.github/workflows/e2e.yml`       |
| [ ]    | Expand E2E for **one authenticated** critical path (define env: test user or emulator) | Eng   | CEO brief: “not yet at level we want” |
| [ ]    | Split largest pages (e.g. menu builder) into loadable modules — phased plan only       | Eng   | No need to complete in one sprint     |

---

## P3 — Hygiene

| Status | Item                                                            | Owner     | Notes                                                                                                                       |
| ------ | --------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| [ ]    | Optional bundler (e.g. Vite) — decision and timeline            | Eng       | Only after P0–P1 momentum                                                                                                   |
| [x]    | Consolidate Firebase / deploy runbooks (one “how we ship” path) | Eng / Ops | [docs/HOW_WE_SHIP.md](./docs/HOW_WE_SHIP.md) + link from [FIREBASE_SETUP_VERIFICATION.md](./FIREBASE_SETUP_VERIFICATION.md) |

---

## Next 30 days (suggested sequence)

1. **Week 1:** Deploy Firestore + Storage rules; run production smoke tests; executive P0 sign-off row above — use **Ship & verify** and [docs/APP_COMPLETION_PLAN.md](./docs/APP_COMPLETION_PLAN.md) **Phase A**.
2. **Week 2–3:** Phase **B–C** in completion plan (team access, source-of-truth); extend data-access pattern to one more entity (checklists **or** recipe snapshots).
3. **Week 4:** Lock ICP + acceptance criteria for multi-restaurant / shared vendor story; queue P1 epic for engineering.

---

## Risks to flag upward

| Risk                                                          | Mitigation                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| Old clients or cached bundles until users refresh             | Communicate if rules tighten; monitor support channels after deploy |
| Legacy `localStorage` key sprawl                              | Phased migration; document in DATA_ACCESS_INVENTORY                 |
| Team pulls engineering into net-new features before P0 deploy | Leadership priority: **rules + deploy first**                       |

---

## One-line ask for the exec team

**Deploy and verify the security-rules update, then keep P0 data-contract work unblocked until sign-off—new multi-site work ships faster on a hardened base.**

---

_Update the checkboxes and “Last updated” date when you review. For technical detail, engineers should use `docs/DATA_ACCESS_INVENTORY.md` and the CEO brief._
