# M1 — COO production verification (paste prompt)

**Purpose:** Close the **human + prod** gate for milestone **M1** after engineering landed **`2e28c70`** (`projectId` alignment).  
**Persona:** [LEADERSHIP_ROLE_ASSIGNMENTS.md](../LEADERSHIP_ROLE_ASSIGNMENTS.md#coo-agent) — use `@iterum-persona-coo` or paste the COO agent block first.  
**Context:** [M1_CTO_AGENT_DELEGATION.md](./M1_CTO_AGENT_DELEGATION.md) · [M1_PROJECTID_AUDIT.md](./M1_PROJECTID_AUDIT.md)  
**Last updated:** 2026-03-29  

### At a glance (prod: `https://iterum-culinary-app.vercel.app`)

| # | Check | Pass? |
|---|--------|-------|
| 1 | [Teammate flow](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md) steps **1–8** | ☐ |
| 2 | [Deploy Firebase](https://github.com/Iterum-Foods/iterum-culinary-app/actions/workflows/firebase-deploy.yml) **green** since last rules change | ☐ |
| 3 | Two-workspace demo (menu-builder + Shift) — no stuck **permission-denied** / index errors | ☐ |

---

## Engineering handoff (after each `main` deploy)

1. Wait for **Vercel** production deployment for the latest `main` commit (dashboard shows green).  
2. If the commit changed **`firestore.rules`**, **`firestore.indexes.json`**, or **`storage.rules`**, confirm [**Deploy Firebase**](https://github.com/Iterum-Foods/iterum-culinary-app/actions/workflows/firebase-deploy.yml) completed successfully on `main`.  
3. Run the **three checks** below on **`https://iterum-culinary-app.vercel.app`** only.

---

## Delegation prompt (copy everything below the line)

---

You are running **M1 production verification** for Iterum Culinary. Engineering merged **`2e28c70`** on `main` (Firestore sync + menu flows `projectId` cascade). Your job is **three checks** on **Vercel production** only — not localhost.

### Check 1 — Teammate flow (E1a)

Run every step in [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md) on **`https://iterum-culinary-app.vercel.app`** (or the org’s current prod base URL).  
**Pass:** All steps **1–8** pass; document date + tester in the checklist or a one-line note to leadership.  
**Fail:** Open a **non-public** thread to Eng with repro (no passwords); copy symptom lines from the checklist “If something fails” table.

### Check 2 — Deploy Firebase (CTO gate — you confirm status)

Ask **CTO** (or check [Deploy Firebase Actions](https://github.com/Iterum-Foods/iterum-culinary-app/actions/workflows/firebase-deploy.yml)) whether the latest run on `main` is **success** after any recent `firestore.rules` / `firestore.indexes.json` / `storage.rules` change.  
**Pass:** Green run linked or CTO confirms no deploy needed since last rules change.  
**Fail:** Do **not** declare M1 closed; CTO triages per [HOW_WE_SHIP.md](./HOW_WE_SHIP.md) (*If Deploy Firebase fails in CI*).

### Check 3 — Two-workspace demo (E2b sanity)

On **prod**, with an account that has **at least two** workspaces:

1. Note **Workspace A** in the header chip or project selector.  
2. Open **menu-builder** — confirm draft / context matches **Workspace A** (or clearly switches when you change workspace without a full tab reload).  
3. Switch to **Workspace B** in the selector — reopen or refresh menu-builder if needed — confirm draft/context tracks **B**.  
4. Open **mobile-compliance.html** — **Workspace** dropdown lists both; select one and complete **one harmless** action (e.g. open a tab or a test line log if policy allows).  
5. No persistent **permission denied** or stuck Firestore index error.

**Pass:** You can complete the demo in **~5 minutes** and would show a pilot sponsor.  
**Fail:** Log exact page, workspace ids (non-secret labels), and console/network symptom; route to Eng.

### When done

Post a **short summary** to leadership: Check 1 **GO / NO-GO**, Check 2 **green / blocked**, Check 3 **pass / fail**. If all **GO**, M1 human bar is met for **E1a + E2b prod verification** (E2c / calendar remains backlog unless in scope).

---

## After verification

- **CEO / COO:** Update [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) leadership log with dated M1 human **GO** when appropriate.  
- **Next engineering:** **E3** vendor catalog per [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) after sign-off.
