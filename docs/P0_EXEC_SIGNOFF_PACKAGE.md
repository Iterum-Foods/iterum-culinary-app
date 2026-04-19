# P0 executive sign-off package (for CEO)

**Prepared by:** COO / Ops  
**Date:** _YYYY-MM-DD_  
**Purpose:** Single page of evidence so the CEO can record **formal P0 approval** on [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md).  
**Process:** [PHASE_0_ROLE_PROMPTS.md — COO / Ops](./PHASE_0_ROLE_PROMPTS.md)

---

## 1. Deploy Firebase CI — status

| Item | Value |
|------|--------|
| **Required** | Latest **Deploy Firebase** workflow on `main` is **success** |
| **Link to run** | _Paste: https://github.com/Iterum-Foods/iterum-culinary-app/actions/workflows/firebase-deploy.yml → latest green run_ |
| **Run ID / commit** | _e.g. run #______, SHA _______ |
| **If not green** | **Do not send this package.** CTO triages per [HOW_WE_SHIP.md](./HOW_WE_SHIP.md); CEO sign-off waits. |

---

## 2. A1 production smoke — status

| Item | Value |
|------|--------|
| **Smoke record** | [A1_P0_PROD_SMOKE_RECORD.md](./A1_P0_PROD_SMOKE_RECORD.md) |
| **Overall** | _GO / NO-GO / CONDITIONAL_ |
| **Human steps** | Step **2** (sign-in persistence after refresh): _Pass / Fail / N/A_ · Step **4** (recipe photo on Vercel): _Pass / Fail / N/A_ |
| **Production URL used** | _e.g. https://iterum-culinary-app.vercel.app_ |

**Rule:** CEO-facing **GO** only if A1 record says **GO** and human **2** + **4** are **Pass**.

---

## 3. Open risks (residual — CEO accepts for pilot-ready)

_Use 3–7 bullets. Be specific; no "general software risk."_

- _Risk 1_
- _Risk 2_
- _Risk 3_

**What we're watching next:** _e.g. Deploy Firebase token expiry, first multi-user membership pilot, support volume_

---

## 4. Recommendation to CEO

**Recommended action:** _[ ] Approve P0 (pilot-ready trust gate)_ · _[ ] Do not approve — see blockers below_

**Blockers (if any):** _none / list_

---

## 5. CEO acknowledgment (copy to checklist or Leadership log)

**I approve P0 as described above for pilot-ready work to proceed, with awareness of the open risks in section 3.**

**Name:** _________________________ **Date:** _________________________

---

_After sign-off: update EXEC_CHECKLIST row "Executive sign-off: Rules deployed + spot-check OK" and notify team in one line (P0 approved / not approved)._
