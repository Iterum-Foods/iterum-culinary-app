# CEO directive — single-user chef & bartender first

**Date:** 16 September 2026  
**Authority:** CEO (Matthew McPherson)  
**Status:** **Locked for go-to-market** — supersedes multi-unit-as-primary for the next 90 days of *sales and product sequencing*. Multi-unit / org connecting remains **Phase 2**, not abandoned.

**Companions:** [ICP_DECISION_RECORD.md](./ICP_DECISION_RECORD.md) · [ICP_AUDIENCE_PERSONAS.md](./ICP_AUDIENCE_PERSONAS.md) · [LAUNCH_CHECKLIST_NOW.md](./LAUNCH_CHECKLIST_NOW.md) · [THREE_PILLARS_PRODUCT_MODEL.md](./THREE_PILLARS_PRODUCT_MODEL.md) · [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md)

---

## Decision

| Field | Value |
|--------|--------|
| **Primary buyer (now)** | **Single professional user** — chef (BOH / R&D / launch) **or** bartender / bar lead (FOH beverage program) |
| **Job we win first** | One person can **sign up → stock → recipes/cocktails → cost → run today’s shift tools → export/backup** without needing a second account or org admin |
| **Explicit defer** | Multi-restaurant org hierarchy, cross-site compare as a sales promise, SSO, POS/ERP, automated email invites |
| **Phase 2 (after single-user works)** | Organizations + connecting venues / teams under one account — build on existing `projectId` / members model |

**Rationale:** The product already has deep Develop + Shift + Archive surfaces. Multi-unit and shared-vendor complexity (E3 A≠B, teammate RBAC) is **valuable later** but has been **blocking “finished and operational”** for the person who actually cooks or tends bar. First market proof = **one chef or one bartender getting daily value**.

---

## “Finished” for this phase (definition of done)

A **solo** chef or bartender on **prod** can:

1. Create an account and one workspace (restaurant or bar) without confusion.  
2. Complete **stock / ingredients** (or bar well pars) in one sitting.  
3. Build **recipes or cocktails**, attach costs, put items on a **menu** (or bar program).  
4. Use **dashboard / Shift** for today’s logs or checklists relevant to their role.  
5. **Export / archive** so their work is portable (career cook / personal IP story).  
6. Do all of the above **without** a second user, Firebase Console, or “Master Project” dead ends.

**Not required for this phase:** Teammate invite success, Workspace A≠B price isolation, org admin hub polish.

---

## What we stop prioritizing (until Phase 2)

| Park | Why |
|------|-----|
| Multi-unit as the **sales** primary story | Wrong first proof; confuses onboarding |
| E3 A≠B as a **launch gate** for solo pilots | Still ship rules for trust, but don’t hold solo GTM on L4 |
| Heavy org / connecting UX | Phase 2 after solo retention |

**Keep (trust, not org sales):** Deploy Firebase green, auth, single-workspace cloud save, backups.

---

## RACI — who does what next

| Owner | Prime task | Done when |
|-------|------------|-----------|
| **CTO** | Unblock Firebase deploy; harden **single-user** data path (one workspace, recipes/menus/bar, save indicator); cut “org-first” friction in setup defaults | Deploy green + solo golden path tech notes |
| **COO** | Rewrite pilot offer + 5-min demo for **chef OR bartender**; name 1–2 founding partners who are solo leads; acceptance checklist without teammate requirement | Partner packet + recorded demo path |
| **Eng** | Confirm prod pages (bar-ops, stock, menu, shift); fix single-user onboarding dead ends; keep smoke green | L1 + solo smoke |
| **CEO** | Hold the line on Phase 2 defer; approve partner SOW language; re-ratify ICP record | This directive + ICP update |

---

## Agent handoff (Cursor)

- **CTO thread:** `@iterum-persona-cto` — start from [E3_PROD_VERIFY.md](./E3_PROD_VERIFY.md) Gate 0 + solo path audit (setup → stock → recipe/bar → menu → dashboard).  
- **COO thread:** `@iterum-persona-coo` — rewrite [PILOT_ONE_PAGER.md](./PILOT_ONE_PAGER.md) + [MARKET_READINESS_SPRINT.md](./MARKET_READINESS_SPRINT.md) demo for chef/bartender solo; park teammate demo as optional hygiene.  
- **Eng:** Execute CTO punch list; do not expand multi-site UI.

---

## Revision history

| Date | Change |
|------|--------|
| 2026-09-16 | CEO locks single-user chef/bartender GTM; org connecting = Phase 2. |
