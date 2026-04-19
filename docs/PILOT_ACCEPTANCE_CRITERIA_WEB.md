# Pilot acceptance criteria — first 1–3 kitchens (web app)

**Purpose:** Single bar so **PM or CEO** can say **pilot passed** or **failed** without arguing over definitions.  
**Aligned with:** [EXEC_CHECKLIST Leadership log](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) (2026-03-29 analytics notes: project vs `projectId`, margin definitions).  
**COO role:** Publish and facilitate; **CEO** approves changes to the bar for a given pilot contract.

---

## Scope

Applies to **Iterum Culinary web** (and line log where used) for the **first 1–3** paying or structured design-partner kitchens, **after** Phase 0 sign-off and **ICP** lock.

---

## Definitions (use consistently in readouts)

| Term | Meaning for this pilot |
|------|-------------------------|
| **Workspace** | Firestore-backed **project**; reports segment on **`projectId`** until site IDs exist — do not label as “location” externally without caveat. |
| **Adoption** | At least **one** menu (or agreed artifact) **saved and visible** after sync in the pilot window for the workspace. |
| **Costing completeness** | % of menu lines with **recipe link** (or agreed equivalent) and **non-imputed** ingredient costs where costing is in scope. |
| **Economics** | Item-level **margin** (or food cost %) using **one** agreed formula **before vs after** any pricing or vendor change documented in the pilot — same formula both sides. |
| **Tax** | Document whether menu price and costs are **pre- or post-tax** for any margin slide (see Leadership log). |

---

## Pass / fail criteria (default bar — adjust in writing per deal)

| # | Criterion | Pass |
|---|-----------|------|
| 1 | **Trust** | No P0 security incident; auth and team access work per [PHASE_1_TEAMMATE_FLOW_CHECKLIST](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md) for pilot roles. |
| 2 | **Adoption** | ≥1 workspace meets **Adoption** definition above within **agreed weeks** (e.g. 2–4). |
| 3 | **Operational use** | Pilot agrees **line log** and/or **menu/recipe** flows are **used weekly** (subjective OK from named sponsor). |
| 4 | **Costing (if in scope)** | **Costing completeness** ≥ agreed threshold (e.g. 70% of lines) **or** documented gaps with plan. |
| 5 | **Support** | No unresolved **severity-1** issue past **agreed SLA** (define hours in pilot agreement). |

**Fail** if: sponsor withdraws; repeated data loss without recovery; or criteria 1–3 not met by end date.

---

## Evidence COO should collect

- Dated checklist: teammate flow **GO** on prod.  
- One **definitions** sheet (margin formula, tax note) shared with pilot.  
- **Before/after** snapshot for any pricing experiment (same formula).  
- Short **retro** note: what to build next (routed to CTO/PM as epics).

---

## Out of scope for “pass”

- Full multi-site SKU master data.  
- Warehouse / BI.  
- POS integration — unless explicitly added to a **paid** pilot SOW.
