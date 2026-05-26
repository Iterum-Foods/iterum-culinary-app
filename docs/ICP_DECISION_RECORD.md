# ICP decision record

**Purpose:** Capture the **ideal customer profile** lock for the next 90 days so product and engineering align.  
**Exec checklist:** [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) P1 row “Confirm ICP…”  
**CEO memo (options + analysis):** [ICP_CEO_MEMO.md](./ICP_CEO_MEMO.md)  
**Audience personas (GTM / product copy):** [ICP_AUDIENCE_PERSONAS.md](./ICP_AUDIENCE_PERSONAS.md) — owner (compliance + data ownership), launch chef, career cook; mapped to three pillars. Does **not** replace the Decision table until CEO re-ratifies.  
**RACI:** **CEO** = final ratification (signature below). **COO (operations agent)** = packaged this recommendation; **CTO** = technical feasibility.

---

## Status

| Item | State |
|------|--------|
| **COO package** | **Complete** — recommended ICP filled below; ratified 2026-04-14. |
| **CEO ratification** | **Complete** (2026-04-14) — Matthew McPherson, CEO (initials MKM). |

---

## Decision (locked 2026-04-14 — 90-day ICP)

| Field | Value |
|--------|--------|
| **Chosen segment (primary)** | **Multi-unit operator** — **2–8 venues**, one culinary leadership team, shared procurement and menu strategy. |
| **Secondary (opportunistic only)** | **Culinary consultant / multi-client** — one lead managing multiple client workspaces (`projectId` per client). Say no to deals that require custom ERP before pilot value is proven. |
| **Rationale (one paragraph)** | Iterum’s roadmap centers on **multiple workspaces**, **shared vendor comparison**, and **menu economics**—the multi-unit buyer exercises those stories without waiting for perfect “site ID” semantics. Product truth today segments on **`projectId`** (see Leadership log); we will **not** label that as “location” in external decks without a footnote until first-class restaurant/site IDs ship. Consultants fit the same data model and can be served with clear workspace isolation and the existing admin invite path on project hub. |
| **Explicit non-goals for 90 days** | **No** enterprise SSO (SAML) as a gate to first pilots. **No** POS or accounting integration committed in pilot SOWs. **No** data warehouse / BI product—**Firestore export + CSV + definitions sheet** only. **No** promise of automated email invites (UID paste path is acceptable per current product). **No** custom legal terms per pilot without CEO review. |

---

## Implications

| Area | Note |
|------|------|
| **Onboarding copy** | Use **“workspace”** or **“project”** in-app; avoid calling `projectId` a **“location”** in customer-facing analytics until site IDs exist. |
| **Pricing / packaging** | Anchor on **venues/workspaces** or **seats**—CEO sets numbers; default story: multi-unit pays for coverage across projects under one account. |
| **Pilot shortlist** | Prioritize groups where **one buyer** can authorize **2+ kitchens** or a **consultant** with **2+ active clients** on Iterum. |
| **Engineering narrative** | P1 “multi-restaurant” epics stay aligned to **shared vendors + comparable pricing**; **restaurant/site ID** remains explicit backlog, not a blocker to first paid pilot if footnotes are used. |

---

## CEO ratification

**By signing below, I adopt the Decision above as the ICP lock for the next 90 days (or I note revisions inline).**

| Field | Value |
|--------|--------|
| **Date** | 2026-04-14 |
| **Name / role** | Matthew McPherson, CEO |
| **Initials** | MKM |

---

## Revision history

| Date | Change |
|------|--------|
| 2026-03-27 | COO operations agent: recommended ICP filled; CEO ratification pending. |
| 2026-04-14 | CEO ratification signed; ICP locked 90 days (primary: multi-unit 2–8; secondary: consultant opportunistic). |
| 2026-05-19 | Linked [ICP_AUDIENCE_PERSONAS.md](./ICP_AUDIENCE_PERSONAS.md) — founder audience definition (owner / launch chef / career cook). |
