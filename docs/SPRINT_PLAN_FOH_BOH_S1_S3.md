# Sprint plan — FOH/BOH restaurant readiness (S1 → S3)

**Purpose:** Executable checklists for three sprints that take Iterum from **trust** to **pilot-complete** for front-of-house and back-of-house staff.  
**Parent map:** [RESTAURANT_FOH_BOH_READINESS.md](./RESTAURANT_FOH_BOH_READINESS.md)  
**Double-check command:** `npm run verify:sprints` (lint + format + Chromium smoke)

**Last updated:** 16 May 2026

---

## How to use this doc

| Column | Meaning |
|--------|---------|
| **ID** | Stable reference (e.g. `S1-E-01`) |
| **Owner** | Eng = engineering · COO = ops/human QA · CEO = sign-off |
| **Verify** | Command or doc section that proves done |
| **Status** | `[x]` done in repo · `[ ]` open · `[H]` human-only on prod |

---

## Sprint 1 — R0 trust + R1 shift-ready (week 1)

**Outcome:** Production teammate flow GO; mobile shift path validated for line + FOH test accounts.

### S1 — Engineering (automated)

| ID | Task | Owner | Verify | Status |
|----|------|-------|--------|--------|
| S1-E-01 | Chromium smoke green on `main` | Eng | `npm run test:chromium` | [x] |
| S1-E-02 | Prod smoke script exists | Eng | `npm run test:smoke:prod` | [x] |
| S1-E-03 | Demo seed gated (`?demo=1`, `iterum_demo_seed`, demo emails) | Eng | [FUNCTIONAL_READINESS_GATE.md](./FUNCTIONAL_READINESS_GATE.md) §4 | [x] |
| S1-E-04 | Golden-path script dedupe (menu, vendor, ingredients, equipment, recipe-library) | Eng | git history + smoke | [x] |
| S1-E-05 | Pilot-path `no-undef` cleanup + CDN ESLint globals | Eng | `npm run lint` (0 errors) | [x] |
| S1-E-06 | Equipment import toasts (`toast-notifications`, `loading-states`) | Eng | [equipment-management.html](../public/equipment-management.html) | [x] |
| S1-E-07 | Sprint verify script | Eng | `npm run verify:sprints` | [x] |

### S1 — Human QA (production)

| ID | Task | Owner | Verify | Status |
|----|------|-------|--------|--------|
| S1-H-01 | Run [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md) on Vercel | COO | All 8 steps pass | [H] |
| S1-H-02 | `npm run test:smoke:prod` recorded in checklist | COO | 6/6+ pass | [H] |
| S1-H-03 | QA §2.0–2.3 mobile (workspace, Today, temps) — **kitchen** account | COO | [QA_FEATURE_TEST_WORKFLOW.md](./QA_FEATURE_TEST_WORKFLOW.md) | [H] |
| S1-H-04 | QA §2.0–2.3 mobile — **FOH** account (`front_of_house` or `server`) | COO | Today actions include menu / team | [H] |
| S1-H-05 | Line user cannot see dashboard manager bar publish UI | COO | QA §2.5–2.6 line checks | [H] |
| S1-H-06 | Functional readiness gate §1–6 reviewed | CEO/COO | [FUNCTIONAL_READINESS_GATE.md](./FUNCTIONAL_READINESS_GATE.md) | [H] |

### S1 — Sign-off

| Role | Criteria | Status |
|------|----------|--------|
| Eng | S1-E-* all `[x]`; `verify:sprints` green | [x] |
| COO | S1-H-* all `[H]` ticked on prod | [ ] |
| CEO | Approves **R1 shift-ready** for pilot kitchens | [ ] |

---

## Sprint 2 — R2 kitchen + floor aligned (week 2)

**Outcome:** Published menu visible on mobile; FOH briefing works; field staff cannot write menu masters; `projectId` audit closed for P0 writers.

### S2 — Engineering

| ID | Task | Owner | Verify | Status |
|----|------|-------|--------|--------|
| S2-E-01 | E2 audit doc for high-traffic `projectId` writers | Eng | [E2_PROJECTID_AUDIT.md](./E2_PROJECTID_AUDIT.md) | [x] |
| S2-E-02 | Firestore: expand **field-staff** roles (menu/recipe read-only) | Eng | `firestore.rules` `isFieldStaffRole` | [x] |
| S2-E-03 | `menu-foh-manager.js` on kitchen management | Eng | [kitchen-management.html](../public/kitchen-management.html) | [x] |
| S2-E-04 | Mobile menu panel (`#menu-published-body` via `mobile-line-employee`) | Eng | smoke `mobile menu panel markup` | [x] |
| S2-E-05 | FOH first-shift quick card | Eng | [FOH_FIRST_SHIFT_QUICK_CARD.md](./FOH_FIRST_SHIFT_QUICK_CARD.md) | [x] |
| S2-E-06 | Invite message links mobile + FOH quick card | Eng | `project-hub-team.js` `buildInviteText` | [x] |
| S2-E-07 | Offline / online pilot note | Eng | [OFFLINE_PILOT_NOTE.md](./OFFLINE_PILOT_NOTE.md) | [x] |
| S2-E-08 | `bartender` in project-hub role dropdown + rules | Eng | project-hub + `isValidMemberRole` | [x] |

### S2 — Human QA

| ID | Task | Owner | Verify | Status |
|----|------|-------|--------|--------|
| S2-H-01 | Manager publishes menu from web → FOH sees items on mobile **Menu** tab | COO | Same `projectId` | [H] |
| S2-H-02 | FOH briefing from kitchen management (no “script not loaded”) | COO | kitchen-management UI | [H] |
| S2-H-03 | Field account **cannot** save menu in menu-builder (permission denied) | COO | DevTools / rules | [H] |
| S2-H-04 | Bar pack + bar checklists E2E (QA §2.5–2.6) | COO | QA doc | [H] |
| S2-H-05 | Two-workspace switch demo (COO 5 min) | COO | [P1 E2b](./P1_EPIC_BREAKDOWN.md) | [H] |

### S2 — Sign-off

| Role | Criteria | Status |
|------|----------|--------|
| Eng | S2-E-* `[x]`; rules deployed after S2-E-02 | [x] eng code; [ ] deploy rules to prod |
| COO | S2-H-* on prod | [ ] |
| CEO | Approves **R2 floor+kitchen aligned** | [ ] |

---

## Sprint 3 — R3 pilot-complete (week 3)

**Outcome:** Vendor override UI verified; auth E2E path in CI (optional secrets); pilot definitions + evidence pack.

### S3 — Engineering

| ID | Task | Owner | Verify | Status |
|----|------|-------|--------|--------|
| S3-E-01 | Vendor price overrides panel on vendor-management | Eng | `#vendor-price-overrides-panel-root` + smoke | [x] |
| S3-E-02 | Cost calculator listens to `projectChanged` | Eng | [cost-calculator.js](../public/assets/js/cost-calculator.js) | [x] |
| S3-E-03 | Authenticated E2E spec (skips without secrets) | Eng | `tests/e2e/auth-workspace.spec.js` | [x] |
| S3-E-04 | Pilot definitions sheet template | Eng | [PILOT_DEFINITIONS_SHEET.md](./PILOT_DEFINITIONS_SHEET.md) | [x] |
| S3-E-05 | Kitchen-management smoke (loads) | Eng | deferred — page redirects when unsigned | [ ] optional |

### S3 — Human / business

| ID | Task | Owner | Verify | Status |
|----|------|-------|--------|--------|
| S3-H-01 | Fill pilot definitions (margin formula, tax note) | COO | [PILOT_DEFINITIONS_SHEET.md](./PILOT_DEFINITIONS_SHEET.md) | [H] |
| S3-H-02 | Three-role QA full pass (admin, kitchen, FOH) | COO | [QA_FEATURE_TEST_WORKFLOW.md](./QA_FEATURE_TEST_WORKFLOW.md) | [H] |
| S3-H-03 | [PILOT_ACCEPTANCE_CRITERIA_WEB.md](./PILOT_ACCEPTANCE_CRITERIA_WEB.md) evidence folder | COO | 5 criteria | [H] |
| S3-H-04 | Set `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` in GitHub repo secrets; auth spec runs in CI | Eng | [.github/workflows/e2e.yml](../.github/workflows/e2e.yml) | [ ] |
| S3-H-05 | Retro → P1 backlog (E4 compare, email invite) | CEO/PM | Ticket list | [H] |

### S3 — Sign-off

| Role | Criteria | Status |
|------|----------|--------|
| Eng | S3-E-* `[x]`; optional auth E2E green in CI when secrets set | [x] |
| COO | Pilot acceptance evidence complete | [ ] |
| CEO | **Pilot passed** or gaps documented in writing | [ ] |

---

## Double-check procedure (run before each sprint sign-off)

1. `npm run verify:sprints` — must exit 0.  
2. `git status` — clean or only intentional WIP.  
3. If `firestore.rules` changed: Firebase deploy workflow green on `main`.  
4. Re-read sprint **Human** rows — none marked done without prod evidence.  
5. Update **Status** column in this file; bump **Last updated** date.

---

## Revision history

| Date | Change |
|------|--------|
| 2026-05-16 | Initial S1–S3 plan with eng deliverables and verification IDs. |
