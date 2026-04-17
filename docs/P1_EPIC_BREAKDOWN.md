# P1 epic breakdown + engineering estimate

**Purpose:** Decompose post–ICP-lock work into shippable epics with **rough eng-week** sizing so CTO/Eng can sequence sprints.  
**Locked ICP:** [ICP_DECISION_RECORD.md](./ICP_DECISION_RECORD.md) (2026-04-14) — multi-unit **2–8** primary; consultant secondary.  
**Pilot bar:** [PILOT_ACCEPTANCE_CRITERIA_WEB.md](./PILOT_ACCEPTANCE_CRITERIA_WEB.md).  
**Plan phases:** [APP_COMPLETION_PLAN.md](./APP_COMPLETION_PLAN.md) (B–D).  
**Last updated:** 14 April 2026  

---

## How to read estimates

| Unit | Meaning |
|------|--------|
| **Eng-week** | One senior-ish full-time engineer for one calendar week (design + implement + test + doc handoff). |
| **Range** | Uncertainty in integration / rules / UX polish—not pad for “unknown unknowns” beyond normal. |
| **Parallel** | Epics that can run alongside others if you have capacity (called out in the epic map). |

**Reality check:** Vendors today lean on **localStorage** (`iterum_vendors`, `ingredients_database` vendor arrays per [DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md)). **Cross-workspace shared vendor truth** is the largest lift; team access and `projectId` hygiene are prerequisites for trustworthy pilots.

---

## Epic map (recommended order)

| ID | Epic | User / business outcome | Eng-weeks (range) | Depends on |
|----|------|-------------------------|-------------------|------------|
| **E1** | **Team access & roles (Phase B)** | Owner / `account_admin` can onboard teammates without Console; line roles scoped by rules. | **2–4** | P0 rules live |
| **E2** | **Multi-workspace correctness** | Switching workspace updates **all** critical surfaces; no silent wrong-`projectId` writes. | **2–3** | E1 partial |
| **E3** | **Shared vendor directory + prices** | One buyer maintains vendor list usable across **2–8** projects; prices comparable per workspace. | **5–8** | E2; data sketch below |
| **E4** | **Cross-workspace costing / compare** | Sponsor sees margin or unit-cost story **across** workspaces with one definitions sheet. | **2–4** | E3 MVP |
| **E5** | **Authenticated E2E + smoke** | One **authenticated** Playwright path; fewer regressions on sign-in / dashboard / menu. | **2–3** | Secrets + test user; **parallel** with E2–E3 |
| **—** | **Mobile store track** | Phase 2 — see [CEO_TEAM_TASK_LIST_TO_MARKET.md](./CEO_TEAM_TASK_LIST_TO_MARKET.md); not counted in P1 web total. | (separate) | Brand + privacy |

**Sequential P1 web (rough):** **13–22** eng-weeks if one engineer; **~8–12** calendar weeks with **two** engineers and E5 parallel.

---

## E1 — Team access & roles (Phase B)

**Maps to:** [APP_COMPLETION_PLAN.md](./APP_COMPLETION_PLAN.md) B1–B3.

| Slice | Scope | Done when |
|-------|--------|-----------|
| E1a | **Admin path** stable on prod: project hub + membership doc shape matches rules (`authUid` / `memberId`). | [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md) human **GO** on paid pilot. |
| E1b | **`employee_line` (or agreed role)** rules: write only where policy says; read paths for menus/recipes/vendor as decided. | Spot-check with test accounts; doc in [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md). |
| E1c | **Ops doc** — “add teammate” without Firebase Console (UID steps until email invite exists). | Linked from [SUPPORT_PLAYBOOK_PILOT.md](./SUPPORT_PLAYBOOK_PILOT.md) or setup doc. |

**Estimate:** **2–4** eng-weeks (wider if rules need iteration after first pilot account).

**Out of scope (ICP):** SAML SSO; automated email invite (stretch / Phase 3).

---

## E2 — Multi-workspace correctness

**Why:** ICP buyer runs **multiple** `projectId`s; wrong workspace is a trust killer.

| Slice | Scope | Done when |
|-------|--------|-----------|
| E2a | Audit **high-traffic** writers (menu builder, dashboard, calendar, costing) for `projectId` source of truth. | Short audit note in repo (`docs/` or ticket); P0 bugs fixed. |
| E2b | **Switcher UX** — obvious current workspace; persist selection; reload-safe. | COO can demo **2** workspaces in 5 minutes on prod. |
| E2c | Align **localStorage** keys that are still per-device with “active project” (reduce forked state vs Firestore). | [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md) updated for any changed pattern. |

**Estimate:** **2–3** eng-weeks.

---

## E3 — Shared vendor directory + per-workspace prices (largest epic)

**Why:** Today vendors/prices are mostly **local** and **per-ingredient**; multi-unit needs **shared catalog** + **per-site price** without duplicating vendor master data.

### MVP slices (sequenced)

| Slice | Scope | Done when |
|-------|--------|-----------|
| E3a | **Data model** implemented in Firestore + rules (use sketch below); read path from one screen (e.g. vendor list). | CTO + Eng sign off rules deploy + smoke. |
| E3b | **Import / sync** from existing `iterum_vendors` + ingredient vendor arrays (one-time or incremental). | No data loss on test account; rollback doc. |
| E3c | **Project override** — price or SKU differs by `projectId` while vendor **name/identity** is shared. | Pilot can set two prices for same vendor item across two workspaces. |
| E3d | **Menu costing** reads shared + override layers (align with [cost-calculator.js](../public/assets/js/cost-calculator.js) / ingredients path). | Costing completeness measurable per pilot bar. |

**Estimate:** **5–8** eng-weeks total (E3a alone **1.5–2.5** if rules are straightforward).

**Explicit backlog (not MVP):** Org-wide analytics labeled “location”; POS; warehouse pricing feeds.

---

## E4 — Cross-workspace costing / compare

**Why:** Sponsor validates **menu economics** across venues (ICP).

| Slice | Scope | Done when |
|-------|--------|-----------|
| E4a | **Export** or **read-only view**: selected recipes/menus across **N** projects with same margin formula. | Matches definitions in [PILOT_ACCEPTANCE_CRITERIA_WEB.md](./PILOT_ACCEPTANCE_CRITERIA_WEB.md). |
| E4b | **Tax / UOM** footnotes on any customer-facing number (per Leadership log). | One-pager for pilot attached to definitions sheet. |

**Estimate:** **2–4** eng-weeks after E3 MVP.

---

## E5 — Pilot quality (parallel)

**Maps to:** [APP_COMPLETION_PLAN.md](./APP_COMPLETION_PLAN.md) D1; EXEC_CHECKLIST P2 E2E row.

| Slice | Scope | Done when |
|-------|--------|-----------|
| E5a | Test user + env vars documented; **one** auth path in Playwright against staging or prod test account. | CI or nightly green; no secrets in repo. |
| E5b | Extend smoke to **dashboard** or **menu** action post-login (minimal assertion). | Reduces regression risk for E2/E3. |

**Estimate:** **2–3** eng-weeks (typically **parallel** with E2–E3).

---

<a id="p1-vendor-data-sketch"></a>

## Data model sketch — shared vendors (P1)

**Goal:** Support **one catalog** of vendors (and optional canonical SKUs) **shared by one account** across **many** `projects/{projectId}`, with **price rows** that can vary by project.

### Recommended MVP shape (Firestore)

**Reality:** `firestore.rules` already exposes **`users/{userId}/vendors/{vendorId}`** with owner-style access (see [DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md)). **Prefer extending this path** for E3 rather than introducing a parallel `vendor_catalog` tree unless CTO decides otherwise.

| Path | Contents |
|------|----------|
| `users/{accountOwnerUid}/vendors/{vendorId}` | Stable vendor record: `displayName`, optional `externalRef`, `createdAt`, `archived`. |
| `users/{accountOwnerUid}/vendor_prices/{priceRowId}` *(or fields on vendor doc)* | `vendorId`, `ingredientKey` or `sku`, `unit`, `basePrice`, **`projectId` nullable** for workspace override. *New subcollection needs a **rules patch** + deploy.* |
| `projects/{projectId}/...` (existing) | Menus, checklists, etc. unchanged; **menu costing** resolves price by: project override → account default → ingredient local fallback (policy TBD in E3). |

**Rules:** Today, `users/.../vendors` is **isOwner(userId) || userProfileEmailMatches**; delegated `account_admin` on a **project** does not automatically grant another user’s `users/{slug}` path—**E3** may need `firebaseUid`-keyed user docs or catalog under `projects/{id}` for multi-admin accounts (CTO decision).

**Alternatives (defer):** Top-level `organizations/{orgId}`; multi-user org billing.

**Client:** Thin module for `users/{uid}/vendors` (and future `vendor_prices` if added); migrate [vendorManager.js](../public/assets/js/vendorManager.js) / [vendor-price-comparator.js](../public/assets/js/vendor-price-comparator.js) gradually.

**This sketch closes:** EXEC_CHECKLIST row *Data model sketch: vendor directory, site/location linkage, price rows* — refine after first pilot feedback.

---

## Milestones (suggested)

| Milestone | Contents | Target (indicative) |
|-----------|----------|---------------------|
| **M1 — Trust** | E1 done + E2a–b | End of sprint +2 · **CTO prompt:** [M1_CTO_AGENT_DELEGATION.md](./M1_CTO_AGENT_DELEGATION.md) · **Audit:** [M1_PROJECTID_AUDIT.md](./M1_PROJECTID_AUDIT.md) |
| **M2 — Catalog alpha** | E3a–b behind flag or admin-only | +4–6 eng-weeks from M1 |
| **M3 — Pilot-ready economics** | E3c–d + E4a | +6–10 from M1 |
| **M4 — Quality** | E5a–b green | Parallel to M2–M3 |

Adjust in PM tool when sprint capacity is known.

---

## Risks & decisions (CTO / CEO)

| Risk | Mitigation |
|------|------------|
| Rules complexity for catalog + members | Ship E3a in **dev/staging** first; small blast radius on prod. |
| localStorage vs Firestore fork | E2c + explicit “source of truth” per entity in [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md). |
| Pilot expects “site” not “project” | ICP allows footnotes; onboarding copy uses **workspace** (see ICP implications). |

---

## Change log

| Date | Change |
|------|--------|
| 2026-04-14 | Initial breakdown after ICP lock; eng-week ranges; vendor_catalog sketch. |
| 2026-04-14 | **M1 kickoff:** [M1_CTO_AGENT_DELEGATION.md](./M1_CTO_AGENT_DELEGATION.md), [M1_PROJECTID_AUDIT.md](./M1_PROJECTID_AUDIT.md), [ADD_TEAMMATE_UID_PATH.md](./ADD_TEAMMATE_UID_PATH.md). |
| 2026-04-14 | **`2e28c70`:** `resolveProjectId` + menu/menu-recipe `projectId` cascade; [M1_PROJECTID_AUDIT.md](./M1_PROJECTID_AUDIT.md) updated. M1 awaits human E1a + prod verification. |
| 2026-04-14 | Vendor sketch aligned to existing Firestore **`users/.../vendors`** rules; optional `vendor_prices` subcollection noted. |
