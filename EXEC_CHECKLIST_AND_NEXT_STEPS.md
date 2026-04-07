# Executive checklist & next steps

**Purpose:** Single page for leadership to track launch readiness and foundation work.  
**Companions:** [CEO_BRIEF_CURRENT_STATE_AND_PRIORITIES.md](./CEO_BRIEF_CURRENT_STATE_AND_PRIORITIES.md) · [NEXT_STEPS_LEADERSHIP.md](./NEXT_STEPS_LEADERSHIP.md) · [LEADERSHIP_ROLE_ASSIGNMENTS.md](./LEADERSHIP_ROLE_ASSIGNMENTS.md) · [TEAM_ACTION_PLAN.md](./TEAM_ACTION_PLAN.md) · [docs/workflows/](./docs/workflows/) (e.g. sign-in UI redesign)  
**Last updated:** 29 March 2026  

---

## Leadership log (CEO / CTO)

<a id="leadership-log-ceo-cto"></a>

_Use this section for short, dated notes that do not belong in a checkbox row._

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

| Status | Step | Owner | Notes |
|--------|------|-------|--------|
| [ ] | **CI:** Workflow **Deploy Firebase** succeeded on `main` ([Actions · Deploy Firebase](https://github.com/Iterum-Foods/iterum-culinary-app/actions/workflows/firebase-deploy.yml)). | Eng / CTO | Requires repo secret `FIREBASE_TOKEN`. Deploys **Firestore + Storage** rules to `iterum-culinary-app2`. |
| [ ] | **App URL:** Smoke on **Vercel** production (`https://iterum-culinary-app.vercel.app/`) — not only localhost. | Eng | Confirms what pilots hit. |
| [ ] | **A1 record:** [docs/A1_P0_PROD_SMOKE_RECORD.md](./docs/A1_P0_PROD_SMOKE_RECORD.md) completed → **GO** (all required steps). | Ops / COO | Fills evidence for executive sign-off row below. |
| [ ] | **(Optional)** In Firebase Console → Firestore, confirm `projects/{projectId}/members/{yourUid}` exists with `role` after owner sync (see [docs/ROLES_AND_PERMISSIONS.md](./docs/ROLES_AND_PERMISSIONS.md)). | Eng | Verifies **company membership** rules are live. |

---

## P0 — Security, data contract, trust

| Status | Item | Owner | Notes |
|--------|------|-------|--------|
| [x] | Document Firestore paths + localStorage keys (technical inventory) | Eng | See [docs/DATA_ACCESS_INVENTORY.md](./docs/DATA_ACCESS_INVENTORY.md) |
| [x] | Align Firestore rules with real client usage (projects, snapshots, checklists) | Eng | `firestore.rules` — deploy to production when ready |
| [x] | Align Storage rules with client paths (incl. legacy recipe photo path) | Eng | `storage.rules` — deploy with Firestore |
| [x] | **Deploy** updated rules to production + smoke-test app (sign-in, menu sync, photos) | CTO + Eng / Ops | **2026-03-27:** Rules released to **`iterum-culinary-app2`**. **2026-03-29+:** `projects/.../members/{uid}` + company roles — redeploy via **Deploy Firebase** CI whenever `firestore.rules` changes; complete **Ship & verify** above. |
| [x] | Confirm no production code relies on **listing** all `projects` in a way that breaks under tightened rules | CTO + Eng | **Pass:** `firestore-sync.js` uses **`doc('projects', id)` only**. Root `projects` **query** only in `cloud-data-sync.js` (`where('userId','==',...)`). Rules now use **`allow read`** (not `list: false`) so filtered queries can be evaluated; `ensureProjectDoc` fields are `ownerId` / `firebaseUid` (legacy query may no-op). |
| [ ] | Executive sign-off: “Rules deployed + spot-check OK” | COO (package for CEO) | **Smoke record:** [docs/A1_P0_PROD_SMOKE_RECORD.md](./docs/A1_P0_PROD_SMOKE_RECORD.md) must show **GO** (all steps); then CEO OK. |

---

## P0 — Single data-access direction (phased)

| Status | Item | Owner | Notes |
|--------|------|-------|--------|
| [x] | Introduce thin wrapper for **Project** entity (`project-data-access.js`) | Eng | Menu builder wired as first consumer |
| [ ] | Route **checklists** and **recipe library** snapshots through same pattern (or document exceptions) | Eng | Reduces forked sync patterns |
| [ ] | Decide **source of truth** per entity (local-first vs cloud-first) for recipes, menus, vendors — document in one page | CTO + PM / Eng (COO if no PM yet) | Unblocks multi-site roadmap |

---

## P1 — Product: account → restaurants → menus

| Status | Item | Owner | Notes |
|--------|------|-------|--------|
| [ ] | Confirm ICP for next 90 days: multi-unit vs single venue vs consultant | COO (facilitate) · CEO (decide) | Drives naming and onboarding |
| [ ] | Define **acceptance criteria** for “one manager, multiple restaurants, shared vendors, comparable pricing” | PM (or COO) | Tie to CEO brief success metrics |
| [ ] | Epic breakdown + engineering estimate | CTO + PM / Eng | After ICP lock |

---

## P1 — Shared vendors & pricing

| Status | Item | Owner | Notes |
|--------|------|-------|--------|
| [ ] | Data model sketch: vendor directory, site/location linkage, price rows | CTO + PM / Eng | Depends on P1 product framing |
| [ ] | Pilot customer identified for design validation | COO / Sales | Optional but high leverage |

---

## P2 — Quality gates & velocity

| Status | Item | Owner | Notes |
|--------|------|-------|--------|
| [x] | ESLint required on `main`; Prettier required for `public/assets` JS/CSS | Eng | CI: `.github/workflows/lint.yml` |
| [x] | Playwright **smoke** tests (home, sign-in, dashboard, menu builder) | Eng | CI: `.github/workflows/e2e.yml` |
| [ ] | Expand E2E for **one authenticated** critical path (define env: test user or emulator) | Eng | CEO brief: “not yet at level we want” |
| [ ] | Split largest pages (e.g. menu builder) into loadable modules — phased plan only | Eng | No need to complete in one sprint |

---

## P3 — Hygiene

| Status | Item | Owner | Notes |
|--------|------|-------|--------|
| [ ] | Optional bundler (e.g. Vite) — decision and timeline | Eng | Only after P0–P1 momentum |
| [ ] | Consolidate Firebase / deploy runbooks (one “how we ship” path) | Eng / Ops | Cuts exec noise and on-call risk |

---

## Next 30 days (suggested sequence)

1. **Week 1:** Deploy Firestore + Storage rules; run production smoke tests; executive P0 sign-off row above.  
2. **Week 2–3:** Extend data-access pattern to one more entity (checklists **or** recipe snapshots); Product + Eng draft **source-of-truth** one-pager.  
3. **Week 4:** Lock ICP + acceptance criteria for multi-restaurant / shared vendor story; queue P1 epic for engineering.

---

## Risks to flag upward

| Risk | Mitigation |
|------|------------|
| Old clients or cached bundles until users refresh | Communicate if rules tighten; monitor support channels after deploy |
| Legacy `localStorage` key sprawl | Phased migration; document in DATA_ACCESS_INVENTORY |
| Team pulls engineering into net-new features before P0 deploy | Leadership priority: **rules + deploy first** |

---

## One-line ask for the exec team

**Deploy and verify the security-rules update, then keep P0 data-contract work unblocked until sign-off—new multi-site work ships faster on a hardened base.**

---

*Update the checkboxes and “Last updated” date when you review. For technical detail, engineers should use `docs/DATA_ACCESS_INVENTORY.md` and the CEO brief.*
