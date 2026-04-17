# Pilot app completion — owner runbook (single page)

**Purpose:** One place that defines what **“complete”** means for Iterum Culinary, **who** does what next, and **honest** limits—so nobody expects a full rewrite in one sprint.  
**Authority:** [APP_COMPLETION_PLAN.md](./APP_COMPLETION_PLAN.md) (“pilot-ready” vs “scale-ready”). **Engineering queue:** [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md).  
**Last updated:** 14 April 2026  

---

## What “complete” does **not** mean

- Every HTML tool page redesigned.  
- Full ERP, POS, warehouse BI, or SAML SSO (explicit **ICP non-goals** in [ICP_DECISION_RECORD.md](./ICP_DECISION_RECORD.md)).  
- A single AI session “finishing” months of product work without human pilot feedback.

## What **complete** means (use the right tier)

| Tier | Definition | Typical horizon |
|------|------------|-----------------|
| **Pilot-ready** | Trust: auth, prod URL, rules deployed, A1-style smoke, **team access** without Console-only hacks, **workspace** clarity, documented support. | **Now → few weeks** (M1 human gate + E3 slices). |
| **ICP-complete (90 days)** | Multi-unit buyer can run **2–8 workspaces** with **shared vendor/costing story** per [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) E3–E4 + pilot acceptance bar. | **~2–3 months** eng capacity. |
| **Scale-ready** | Auth E2E, stricter RBAC, invite flow, modular ship discipline. | **Quarter+** after pilots. |

---

## Current engineering position (snapshot)

| Area | Status | Next action |
|------|--------|-------------|
| **P0 / Phase A** | Closed in trackers | Maintain **Ship & verify** on rules changes. |
| **M1 (E1 + E2a–b)** | Code on `main` (**`2e28c70`**); human gate open | [M1_COO_PROD_VERIFICATION.md](./M1_COO_PROD_VERIFICATION.md) on Vercel + Deploy Firebase green. |
| **E3 Vendors / Firestore** | **Rules already allow** `users/{userId}/vendors/{vendorId}` — client still mostly localStorage; E3 = wire + schema + costing | CTO-sized epic; see [DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md) update + P1 sketch. |
| **E4 Compare / export** | After E3 MVP | PM + Eng. |
| **E5 Auth E2E** | Open | Test user + Playwright path. |
| **Mobile store (Phase 2)** | Capacitor present; listings/legal | [CEO_TEAM_TASK_LIST_TO_MARKET.md](./CEO_TEAM_TASK_LIST_TO_MARKET.md) Phase 2. |

---

## Roles (who “owns” completion)

| Role | Owns |
|------|------|
| **CEO** | ICP, pilot contracts, “pilot-ready vs build more” calls. |
| **CTO** | Rules, deploy CI, architecture, E3 technical sign-off. |
| **COO / Ops** | Human checklists, pilot comms, evidence for pass/fail. |
| **Eng** | P1 epics, minimal diffs, smoke tests. |

**AI / agents:** Execute **delegation docs** ([M1_CTO_AGENT_DELEGATION.md](./M1_CTO_AGENT_DELEGATION.md), [M1_COO_PROD_VERIFICATION.md](./M1_COO_PROD_VERIFICATION.md)); they do **not** replace CEO sign-off or production testing.

---

## Ordered backlog (do not skip for paid pilots)

1. **M1 human GO** — teammate flow + two-workspace demo + CI.  
2. **E3a–b** — Persist vendor catalog to Firestore under existing `users/{uid}/vendors` (or agreed schema); import from `iterum_vendors` / ingredients.  
3. **E3c–d** — Per-`projectId` price overrides; costing reads layered data.  
4. **E4** — Cross-workspace compare / export for sponsor reviews.  
5. **E5** — One authenticated E2E in CI.  
6. **Phase 2** — Store-ready mobile shell + assets.  
7. **Phase 3** — GTM only after pilot bar is real.

---

## Change log

| Date | Change |
|------|--------|
| 2026-04-14 | Initial owner runbook; aligns “complete” with APP_COMPLETION_PLAN + P1. |
