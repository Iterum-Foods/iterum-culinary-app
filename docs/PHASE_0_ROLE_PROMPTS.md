# Phase 0 — copy-paste prompts by role

**Purpose:** Give each accountable role a single message they can paste into Slack, email, or their task tool.  
**Master list:** [CEO_TEAM_TASK_LIST_TO_MARKET.md](./CEO_TEAM_TASK_LIST_TO_MARKET.md) (Phase 0).  
**Status:** **Phase 0 closed** (2026-03-29) — prompts were run to completion; **next:** [CEO_TEAM_TASK_LIST → Phase 1](./CEO_TEAM_TASK_LIST_TO_MARKET.md#phase-1--web-app-pilot-ready).  
**Last updated:** 29 March 2026  

---

## Prompt for CTO

**Subject / title:** Phase 0 — unblock Deploy Firebase CI (you own technical gate)

You own getting **Deploy Firebase** green on `main` so rules, indexes, and storage stay in sync with the repo.

**Do this:**

1. Open the latest run of **Deploy Firebase** for repo `Iterum-Foods/iterum-culinary-app` on branch `main`:   https://github.com/Iterum-Foods/iterum-culinary-app/actions/workflows/firebase-deploy.yml  
2. If it fails, triage using [HOW_WE_SHIP.md → If Deploy Firebase fails in CI](./HOW_WE_SHIP.md#if-deploy-firebase-fails-in-ci) (typical causes: `FIREBASE_TOKEN`, project permissions, workflow config).  
3. Coordinate with Engineering until the **next run is success** (Firestore rules + indexes + storage as defined in the workflow).  
4. Post in the leadership channel: **link to green run** + one sentence on root cause if you fixed a failure.

**Done when:** Latest Deploy Firebase on `main` is **success**.

**Escalation:** If token/permissions are blocked on you alone, name what you need (who approves, which GCP/Firebase role) in writing same day.

---

## Prompt for Engineering

**Subject / title:** Phase 0 — CI green + verify Firestore indexes after deploy

You support Phase 0 by keeping **`main` deployable** and confirming Firebase state matches `firestore.indexes.json`.

**Do this:**

1. Work with **CTO** until **Deploy Firebase** CI succeeds on `main` (fix workflow, config, or code as needed).  
2. After a **successful** deploy, in **Firebase Console → Firestore → Indexes**, confirm the **collection group** index for **`members`** / **`authUid`** is present (as shipped in `firestore.indexes.json`).  
3. If **COO/Ops** hits failures during **A1** human smoke, reproduce, fix, and ask for a **re-smoke** on the Vercel production URL.

**References:** [HOW_WE_SHIP.md](./HOW_WE_SHIP.md) · [A1_P0_PROD_SMOKE_RECORD.md](./A1_P0_PROD_SMOKE_RECORD.md) · [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) (Ship & verify block)

**Done when:** CI deploy success + indexes confirmed + no open **P0** bugs blocking A1 steps **2** and **4**.

---

## Prompt for COO / Ops

**Subject / title:** Phase 0 — A1 human prod smoke + exec package for CEO

You own **human verification** on **production (Vercel)** and the **one-pager** that lets the CEO sign P0.

**Do this:**

1. Open [A1_P0_PROD_SMOKE_RECORD.md](./A1_P0_PROD_SMOKE_RECORD.md) and run **all required steps** on the **production** app URL (not localhost).  
2. Complete at minimum the **human** items called out in [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md): **step 2** (sign-in persistence) and **step 4** (recipe photo on Vercel).  
3. Update the smoke record to **GO** only if everything required passes; if not, file defects with repro steps and loop Engineering.  
4. Prepare **executive P0 sign-off package** for the CEO (one page): use the fill-in template [P0_EXEC_SIGNOFF_PACKAGE.md](./P0_EXEC_SIGNOFF_PACKAGE.md) — include:  
   - Deploy Firebase CI: **green** (link)  
   - A1: **GO** (link or attach [A1_P0_PROD_SMOKE_RECORD.md](./A1_P0_PROD_SMOKE_RECORD.md))  
   - **Open risks** (bullets: what could still bite pilots, what you’re watching)

**Done when:** A1 record is **GO** + COO has sent the CEO the completed one-pager (template above or equivalent).

---

## Prompt for CEO

**Subject / title:** Phase 0 — your formal P0 approval (after evidence)

Phase 0 is the **production trust** gate. You only need to act **after** CTO/Eng show **green Deploy Firebase**, COO shows **A1 GO**, and you’ve read the **risks** line.

**Do this:**

1. Confirm you have: **(a)** link to successful Deploy Firebase on `main`, **(b)** A1 smoke record **GO**, **(c)** COO one-pager with open risks.  
2. If you accept residual risk for **pilot-ready** work to proceed, record your **dated OK** in [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md): a short dated line under **[Leadership log (CEO / CTO)](../EXEC_CHECKLIST_AND_NEXT_STEPS.md#leadership-log-ceo-cto)** and mark the **Executive sign-off** row in **P0 — Security, data contract, trust** (checkbox + note).  
3. Communicate one line to the team: **P0 approved** or **P0 not approved** + what’s missing.

**Done when:** Dated CEO OK is recorded on the exec checklist and the team stops promising external dates until then.

---

## Optional: all-hands one-liner

**Phase 0:** CTO+Eng = green **Deploy Firebase** + indexes verified; COO/Ops = **A1 GO** on Vercel; COO = exec pack; CEO = **dated P0 OK**. No external pilot/store promises until that chain is complete — see [CEO_TEAM_TASK_LIST_TO_MARKET.md](./CEO_TEAM_TASK_LIST_TO_MARKET.md).
