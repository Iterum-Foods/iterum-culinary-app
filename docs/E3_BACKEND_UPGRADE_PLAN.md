# E3 backend upgrade plan — shared vendors & workspace prices

**Purpose:** Concrete sequence to upgrade Iterum’s backend from **local-first + rules** to **shared vendor catalog + per-workspace pricing** without a traditional app server.  
**Prerequisites:** M1 human GO on prod · P0 rules deployed · [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md) current.  
**Companions:** [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) · [DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md) · [HOW_WE_SHIP.md](./HOW_WE_SHIP.md)  
**Last updated:** 17 July 2026

---

## What “backend upgrade” means here

Iterum has **no Cloud Functions** today. Backend = **Firebase** (Auth, Firestore, Storage, rules) + **client data layer** (`firestore-sync.js`, `project-data-access.js`).

| Upgrade type | Ships via | Example |
|--------------|-----------|---------|
| Permissions | `firestore.rules` → **Deploy Firebase** CI | Line staff read menus, write checklists only |
| Schema / paths | rules + indexes + client modules | `users/{uid}/vendor_prices/{id}` |
| Business logic | Client JS (bounded by rules) | Cost resolver: project override → account default → local |
| Server-only (future) | Vercel `api/*` or Cloud Functions | Email invite, webhooks, batch migration |

---

## Leadership decisions (locked 2 Jul 2026)

**Record:** [E3_DECISION_RECORD.md](./E3_DECISION_RECORD.md)

| Question | Decision |
|----------|----------|
| Vendor master list | **One shared list per account** |
| Prices | **Per workspace (`projectId`)** — location-specific unit costs |
| Who maintains | **Each chef** at their kitchen (not buyer-only) |

**Engineering consequence:** Firestore rules must allow **delegated read/write** for project members on catalog + workspace-scoped `vendor_prices` (today owner-only). See decision record for rules options.

---

## Current state (partial E3)

| Slice | Status | Notes |
|-------|--------|-------|
| **E3a** vendors sync | Partial | `users/{uid}/vendors` — `firestore-sync.js` + `vendorManager.js` |
| **E3b** legacy import | Partial | `iterum_vendors` merge in vendorManager |
| **E3c** price overrides | **UI shipped** | Panel on `vendor-management.html` via `vendor-price-overrides-panel.js` → `project-data-access`; dual-write user + project paths |
| **E3d** costing integration | Partial | `cost-calculator.js` applies overrides; ingredient / recipe price sources shipped |

---

## Upgrade sequence (engineering)

### Phase 0 — Gate (do not skip)

- [x] M1 human GO — CEO **16 Jul 2026** ([M1_COO_PROD_VERIFICATION.md](./M1_COO_PROD_VERIFICATION.md); COO prod walkthrough still recommended)
- [ ] Confirm **Deploy Firebase** green after E3 rules change — [E3_PROD_VERIFY.md](./E3_PROD_VERIFY.md) Gate 0
- [x] Lock E3 leadership answers — [E3_DECISION_RECORD.md](./E3_DECISION_RECORD.md)

### Phase 1 — Rules & indexes hardening (~1 eng-week)

**Goal:** Catalog paths are safe in prod before more UI.

1. [x] Audit / extend `firestore.rules` for `users/{uid}/vendor_prices` — delegated maintainer roles + `projects/{id}/vendor_prices` mirror
2. [x] Composite indexes — none new required for current price doc-id model (revisit if query patterns change)
3. [ ] Deploy via **Deploy Firebase**; run `npm run test:smoke:prod` + Gate 1 A≠B on [E3_PROD_VERIFY.md](./E3_PROD_VERIFY.md)

**Files:** `firestore.rules`, `firestore.indexes.json`, [DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md), `firestore-sync.js`, `project-data-access.js`

### Phase 2 — Data-access contract (~1 eng-week)

**Goal:** One front door for vendor writes — no scattered Firestore calls.

1. [x] Extend [project-data-access.js](../public/assets/js/project-data-access.js) with `VendorFirestorePaths`, `listVendorPrices(projectId?)`, `upsertVendorPrice`, `deleteVendorPrice`
2. [x] Route vendor price CRUD from overrides panel through these helpers (`vendor-management.html` loads the module)
3. [x] Resolution order documented in decision record + panel copy: `projectId` override → account default → local

### Phase 3 — Product UI: vendor price overrides (~1.5–2 eng-weeks)

**Goal:** Buyers edit overrides without Firebase Console.

| Surface | Change | Status |
|---------|--------|--------|
| `vendor-management.html` | Panel: workspace / account override | **Done** |
| `ingredients.html` | Link to override editor | **Done** (slice 2) |
| `menu-builder` / recipes | Price sources panel | **Done** (slice 3) |

**Done when:** COO can set a different unit cost for Workspace B vs A on the same vendor SKU in under 2 minutes on prod — [E3_PROD_VERIFY.md](./E3_PROD_VERIFY.md) Gate 1 (blocked on Phase 0 deploy).

### Phase 4 — Costing completeness (~1 eng-week)

1. Ensure `cost-calculator.js` reloads overrides on `projectChanged` and after vendor save.
2. Add owner-bot or Playwright path: create override → menu line margin updates.
3. Update pilot definitions sheet (margin formula + tax note per EXEC checklist).

### Phase 5 — Cross-workspace compare (E4, optional for pilot)

- Read-only export or view: same recipe across N projects with one margin formula.
- Defer until first pilot asks for multi-site economics slide.

---

## Deploy checklist (every backend phase)

```text
1. Update rules / indexes / client data layer
2. Merge to main
3. Vercel deploy (static UI) — automatic
4. Deploy Firebase — automatic if rules/indexes changed
5. Prod verification:
     npm run test:smoke:prod
     npm run owner-bot:onboarding
6. Human spot-check: vendor page + menu costing on prod
7. Update EXEC_CHECKLIST Ship & verify rows
```

---

## When to add Cloud Functions

Add **only** when client + rules cannot safely do the job:

| Need | Option |
|------|--------|
| Email teammate invite | Cloud Function on `members` write or Auth trigger |
| Privileged batch migration | Admin-only Callable Function |
| External webhook (POS, vendor API) | Vercel serverless or Cloud Function |
| Secrets (API keys) | Never in client — Function or Vercel env |

**First candidate after pilot:** teammate email invite (reduces UID copy/paste friction).

---

## Milestones

| Milestone | Delivers | Depends on |
|-----------|----------|------------|
| **M1** | Trust + teammate + 2-workspace demo | Human GO |
| **M2 — Catalog alpha** | E3a–b stable on prod | M1 |
| **M3 — Economics** | E3c–d UI + costing tests | M2 + leadership answers |
| **M4** | E4 compare (if pilot needs) | M3 |

---

## Risks

| Risk | Mitigation |
|------|------------|
| `users/{slug}` vs Auth UID mismatch | Prefer `firebaseUid` in user doc paths; audit with [M1_PROJECTID_AUDIT.md](./M1_PROJECTID_AUDIT.md) pattern |
| localStorage fork | E2c — reload on workspace switch; show “unsynced” indicator |
| Rules too tight for `account_admin` | Staging test with two Firebase users before prod |
| Old cached bundles | Communicate refresh after rules tighten |

---

## Next engineering ticket (suggested)

**Title:** E3 prod gate — Deploy Firebase + A≠B verify  
**Doc:** [E3_PROD_VERIFY.md](./E3_PROD_VERIFY.md)  
**Acceptance:**

- `FIREBASE_TOKEN` refreshed; Deploy Firebase **green** on `main`
- Workspace A unit cost ≠ Workspace B for same ingredient on prod
- `npm run test:smoke:prod` green

---

_Update this doc when leadership locks E3 prep answers or M1 closes._
