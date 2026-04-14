# Phase 1 — COO agent delegation (paste into Agent)

**Use when:** Starting a **COO-shaped** Cursor Agent thread to close **Phase 1 — Web app pilot-ready**.  
**Persona baseline:** Paste after the [COO agent block](../LEADERSHIP_ROLE_ASSIGNMENTS.md#coo-agent) (or `@` your COO persona rule).  
**Master list:** [CEO_TEAM_TASK_LIST_TO_MARKET.md](./CEO_TEAM_TASK_LIST_TO_MARKET.md#phase-1--web-app-pilot-ready) · [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) (P1 tables).  
**Last updated:** 29 March 2026  

---

## Delegation prompt (copy everything below the line)

---

You are executing **Phase 1 — Web app pilot-ready** as the **COO** (operations + process owner). The **CEO** decides ICP; you **facilitate** and **package** evidence. You **do not** sign for the CEO or override the CTO on technical feasibility.

### Outcomes to produce (in order)

1. **ICP lock facilitation**  
   - Complete every field in [docs/ICP_DECISION_RECORD.md](./ICP_DECISION_RECORD.md) **except** the final “Decision” date and chosen segment if those require CEO sign-off—otherwise draft **recommended** text for CEO to approve in one pass.  
   - Add a **one-page CEO memo** (can be a new section at the bottom of `ICP_DECISION_RECORD.md` or a separate `docs/ICP_CEO_MEMO.md`): **2–3** segment options (e.g. multi-unit vs single venue vs consultant), **your recommendation**, trade-offs, and **explicit non-goals for 90 days**.  
   - **Done when:** Template is fill-ready or filled; CEO has a single decision surface; link the record from [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) P1 row “Confirm ICP…” (add the path in the Notes column if you edit that file).

2. **Teammate flow — verification pack**  
   - Produce a **short checklist** (markdown in `docs/` is fine, e.g. `docs/PHASE_1_TEAMMATE_FLOW_CHECKLIST.md`) that COO/Ops can run with Engineering: sign up → admin adds user on `public/project-hub.html` → user picks **Workspace** on `public/mobile-compliance.html` → confirm **projectId** is correct on dashboard/calendar (what to look for in UI or console, no secrets in the doc).  
   - **Done when:** Eng + COO can run it on **Vercel prod** without guessing steps.

3. **Support playbook (one page)**  
   - One file: e.g. `docs/SUPPORT_PLAYBOOK_PILOT.md` — **session reset** steps, **where to find UID** (Firebase Console path, high level), **when to escalate** to CTO (rules/auth/deploy) vs Eng (bugs). No passwords, no service account detail.  
   - **Done when:** Front-line person can follow it during a pilot.

4. **Pilot acceptance criteria**  
   - One section in `docs/` (new file or add to `APP_COMPLETION_PLAN.md` / exec checklist): success definition for **first 1–3 kitchens** — e.g. adoption signals, compliance/line-log expectations, optional costing—aligned with [EXEC_CHECKLIST analytics note](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) definitions where relevant.  
   - **Done when:** PM or CEO can say “pilot passed / failed” without argument over the bar.

### Operating rules

- Prefer **checklists, tables, and short memos** over code. If you change app code, only when explicitly required—default is **docs + checklist**.  
- **RACI:** ICP **decision** = CEO; **facilitation** = you. Teammate flow **verification** = you + Eng; you supply the runbook.  
- After edits, give the human COO a **3-line handoff**: what’s done, what needs CEO signature, what needs Eng time.

### References (open if needed)

- [LEADERSHIP_ROLE_ASSIGNMENTS.md](../LEADERSHIP_ROLE_ASSIGNMENTS.md) — COO accountabilities  
- [docs/ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md) — membership language  
- [docs/HOW_WE_SHIP.md](./HOW_WE_SHIP.md) — deploy escalation language for support playbook  

---

## After the agent finishes

- CEO: date + lock segment in `ICP_DECISION_RECORD.md`.  
- COO (human): run teammate checklist with Eng; tick Phase 1 rows in [CEO_TEAM_TASK_LIST_TO_MARKET.md](./CEO_TEAM_TASK_LIST_TO_MARKET.md).
