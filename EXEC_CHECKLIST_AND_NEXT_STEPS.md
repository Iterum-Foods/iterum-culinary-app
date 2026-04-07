# Executive checklist & next steps

**Purpose:** Single page for leadership to track launch readiness and foundation work.  
**Companions:** [CEO_BRIEF_CURRENT_STATE_AND_PRIORITIES.md](./CEO_BRIEF_CURRENT_STATE_AND_PRIORITIES.md) · [NEXT_STEPS_LEADERSHIP.md](./NEXT_STEPS_LEADERSHIP.md) · [LEADERSHIP_ROLE_ASSIGNMENTS.md](./LEADERSHIP_ROLE_ASSIGNMENTS.md) · [TEAM_ACTION_PLAN.md](./TEAM_ACTION_PLAN.md) · [docs/workflows/](./docs/workflows/) (e.g. sign-in UI redesign)  
**Last updated:** 29 March 2026  

---

## Leadership log (CEO / CTO)

_Use this section for short, dated notes that do not belong in a checkbox row._

**2026-03-29 — Analytics & pilot reporting (Data Analyst proxy; no warehouse assumed)**  
Recorded for consistent definitions once Firestore/export data is trusted:

- **Project vs location:** Today’s primary segment is **`projectId`** (workspace). Do not label it “location” in reports until the product ships a stable **restaurant / site** key; document that gap on every margin or vendor comparison deck.
- **Margin:** Pick one formula org-wide — e.g. **gross margin %** = (price − allocated recipe cost) / price, or **food cost %** = recipe cost / price — and define whether **selling price** is pre- or post-tax per what the app stores.
- **Recipe cost:** Ingredient quantities × normalized unit costs, including sub-recipes where modeled. Treat **missing/zero vendor price** as a **data-quality flag**, not as real margin.
- **Vendor price drift:** Compare **unit price in a standard UOM** over time for **vendor × SKU (or ingredient key)**; across “locations” use **project** until site IDs exist.
- **MVP reporting path:** Scheduled **Firestore export** or **manual CSV/JSON export** + a one-page **definitions sheet** (Sheets/notebook is enough); expand to event funnels only when the product logs anonymized usage.
- **Pilot success signals (examples):** Adoption = projects with ≥1 menu saved/synced in window; quality = % menu lines with recipe link + non-imputed costs; economics = item-level margin distribution before/after a pricing or vendor change (same formula both sides).

_Companion inventory:_ [docs/DATA_ACCESS_INVENTORY.md](./docs/DATA_ACCESS_INVENTORY.md). _Data analyst prompt (role block):_ [LEADERSHIP_ROLE_ASSIGNMENTS.md → Data analyst agent](./LEADERSHIP_ROLE_ASSIGNMENTS.md#data-analyst-agent-nice-to-have).

---

## How to use this doc

- Treat **[ ]** as not started, **[~]** as in progress, **[x]** as done (update as you close items).
- **Owner** = name or role; leave blank until assigned.
- Review **monthly** or before any major customer pilot.

---

## P0 — Security, data contract, trust

| Status | Item | Owner | Notes |
|--------|------|-------|--------|
| [x] | Document Firestore paths + localStorage keys (technical inventory) | Eng | See [docs/DATA_ACCESS_INVENTORY.md](./docs/DATA_ACCESS_INVENTORY.md) |
| [x] | Align Firestore rules with real client usage (projects, snapshots, checklists) | Eng | `firestore.rules` — deploy to production when ready |
| [x] | Align Storage rules with client paths (incl. legacy recipe photo path) | Eng | `storage.rules` — deploy with Firestore |
| [x] | **Deploy** updated rules to production + smoke-test app (sign-in, menu sync, photos) | CTO + Eng / Ops | **2026-03-27:** Rules released to **`iterum-culinary-app2`** — Firestore (`firebase deploy --only firestore:rules`) + Storage (`firebase deploy --only storage`). Confirm prod smoke (sign-in, menu sync, recipe photo) on your side, then exec sign-off row. |
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
