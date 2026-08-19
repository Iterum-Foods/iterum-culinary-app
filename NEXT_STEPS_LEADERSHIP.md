# Leadership next steps & meeting agenda

**Purpose:** One page for CEO + CTO (and ops sponsor) to run a short sync and lock the sequence for the next month.  
**Companions:** [CEO_BRIEF_CURRENT_STATE_AND_PRIORITIES.md](./CEO_BRIEF_CURRENT_STATE_AND_PRIORITIES.md) · [EXEC_CHECKLIST_AND_NEXT_STEPS.md](./EXEC_CHECKLIST_AND_NEXT_STEPS.md) · [docs/LAUNCH_CHECKLIST_NOW.md](./docs/LAUNCH_CHECKLIST_NOW.md) (19 Aug 2026 gates) · [docs/PILOT_ONE_PAGER.md](./docs/PILOT_ONE_PAGER.md) · [docs/APP_COMPLETION_PLAN.md](./docs/APP_COMPLETION_PLAN.md) (phased completion) · [LEADERSHIP_ROLE_ASSIGNMENTS.md](./LEADERSHIP_ROLE_ASSIGNMENTS.md) · [TEAM_ACTION_PLAN.md](./TEAM_ACTION_PLAN.md) (team tasks & `@` tags)  
**Suggested cadence:** 30 minutes weekly on **L1–L5** until first founding partner is live; then biweekly.

---

## Meeting goals (use as agenda)

1. **L1–L4 this week:** Vercel has bar/purchasing pages; Deploy Firebase green; COO teammate + two-workspace; E3 A≠B if token is live.  
2. **Founding partner:** Who are we sending [PILOT_ONE_PAGER.md](./docs/PILOT_ONE_PAGER.md) to, and by 2 Sep?  
3. **Scope lock:** Golden path only — recipes/menus, Shift, vendors/order guides, optional bar pack. No POS/SSO/stores in the SOW.  
4. **Papercut:** One thing that blocked last week’s demo.

---

## Decisions to record (fill in)

| Decision | Owner | Target date | Outcome (one line) |
|----------|-------|-------------|-------------------|
| P0: Rules deployed + spot-check OK | COO (process) · CEO (approval) — see role doc | | |
| ICP for next 90 days | COO (facilitate) · CEO (decide) | | |
| Source of truth per entity (local vs cloud emphasis) | CTO + PM (or COO if interim PM) | | |

---

## 30-day sequence (from engineering checklist)

| When | Focus | Done means |
|------|--------|------------|
| **19–22 Aug** | L1 Vercel confirm; L2 Firebase token + Deploy Firebase | Prod URLs live; CI deploy green |
| **23–26 Aug** | L3 COO teammate 1–8 + two-workspace | M1 hygiene GO on Vercel |
| **27 Aug** | L4 E3 A≠B prices | Pilot can trust workspace costing |
| **by 2 Sep** | L5 named partner + one-pager | Written 2–4 week founding-partner terms |
| **by 5 Sep** | L6 5-min prod demo | Recording for sales/setup |

---

## Quarter success (from CEO brief)

- Storage/Firestore **documented**; rules **verified** on production paths.  
- **One** canonical save pattern for core entities (migration can be incremental).  
- Criteria met for **one manager, multiple restaurants, shared vendors, price comparison** (definition owned by Product).  
- **Basic automated tests** on the main dev workflow (lint + smoke E2E baseline; expand auth path when ready).

---

## Prep (5 minutes before the meeting)

- **Before each leadership sync:** open [EXEC_CHECKLIST_AND_NEXT_STEPS.md](./EXEC_CHECKLIST_AND_NEXT_STEPS.md), read **Leadership log (CEO / CTO)**, especially **2026-03-29** (project vs location on `projectId`, margin/food cost & **tax** clarity, recipe cost & missing-price handling, **UOM-normalized** vendor drift, MVP **Firestore/CSV + definitions sheet** without a warehouse, pilot signals: adoption, costing completeness, margin before/after) — then skim checklist `[~]` / `[ ]` rows.  
- If deploy is pending: confirm who runs `firebase deploy` and who runs the smoke script or manual checklist.  
- Note any customer pilot dates that would force Week 1 completion.

---

## One-line executive priority

**Ship and verify security rules first; keep the data-access foundation unblocked—multi-site and purchasing features land faster on a hardened base.**

---

*Update the decision table and re-use this doc as the standing agenda until P1 epic is approved.*
