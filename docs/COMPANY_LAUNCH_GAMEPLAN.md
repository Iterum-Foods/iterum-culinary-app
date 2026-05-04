# Company launch gameplan

**Purpose:** Single orchestration doc for **building the product**, **shipping reliably**, and **launching**—including a **chef / local restaurateur** motion for fast feedback with people you can reach in person.  
**Last updated:** 2026-05-04

**Canonical references (do not duplicate here):**

| Topic | Doc |
|--------|-----|
| 90-day ICP lock (multi-unit primary, consultant secondary) | [ICP_DECISION_RECORD.md](./ICP_DECISION_RECORD.md) |
| Engineering epic order + sizing | [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) |
| CEO phase checklist (web, mobile stores, GTM) | [CEO_TEAM_TASK_LIST_TO_MARKET.md](./CEO_TEAM_TASK_LIST_TO_MARKET.md) |
| Deploy + smoke + pilot demo | [HOW_WE_SHIP.md](./HOW_WE_SHIP.md) |
| Pilot acceptance + support | [PILOT_ACCEPTANCE_CRITERIA_WEB.md](./PILOT_ACCEPTANCE_CRITERIA_WEB.md), [SUPPORT_PLAYBOOK_PILOT.md](./SUPPORT_PLAYBOOK_PILOT.md) |
| Operator journeys in the app | [USER_WORKFLOW_GUIDE.md](./USER_WORKFLOW_GUIDE.md) |
| Release validation | [QA_FEATURE_TEST_WORKFLOW.md](./QA_FEATURE_TEST_WORKFLOW.md) |

---

## 1) Strategic spine (what “launch” means)

1. **Maintain the ratified ICP** in [ICP_DECISION_RECORD.md](./ICP_DECISION_RECORD.md) for pricing, packaging, and “what we say no to” in deals.
2. **Ship product in epic order** from [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md): team access → multi-workspace correctness → shared vendor + per-workspace prices → cross-workspace compare → authenticated E2E in parallel where possible.
3. **Every production change** follows [HOW_WE_SHIP.md](./HOW_WE_SHIP.md): merge to `main`, Vercel green, Deploy Firebase when rules change, human smoke on the **pilot URL**.
4. **Store and broad GTM** follow [CEO_TEAM_TASK_LIST_TO_MARKET.md](./CEO_TEAM_TASK_LIST_TO_MARKET.md) Phase 2–3 when you deliberately widen the funnel; until then, **local pilots** below are enough to learn.

**RACI (short):** CEO — ICP, offer, pilot yes/no; CTO — deploy, rules, technical risk; COO / ops — pilot runbook, acceptance, weekly feedback; Eng — epic delivery; Marketing — store assets and launch comms when you open Phase 3.

---

## 2) Near-term focus: chefs and local restaurateurs

**Intent:** People you can **visit**, **trust**, and **iterate with weekly**. This is your **discovery and refinement** lane: it does not replace the formal ICP doc, but it **feeds** product truth and testimonials before you chase larger groups.

### 2.1 Who to invite

| Segment | Why |
|---------|-----|
| **Owner-operators and chef-led independents** | 1–3 sites; fast decisions; hands-on feedback. |
| **Working chefs / KMs** | Honest signal on line workflow, mobile, prep, checklists. |

### 2.2 Founding partner offer (2–4 weeks)

- **You** do white-glove setup: account, project, menu path, team add ([USER_WORKFLOW_GUIDE.md](./USER_WORKFLOW_GUIDE.md), [ADD_TEAMMATE_UID_PATH.md](./ADD_TEAMMATE_UID_PATH.md)).
- **They** use it in real service where safe, and commit to **one short weekly** debrief (15–30 min).
- **Optional:** testimonial or referral **only if** they would honestly recommend.

### 2.3 Outreach (short script)

Use your own voice; keep it concrete:

> “I’m building tools for chefs and small restaurants—prep, safety rhythm, menus, and day-of ops. I’m taking a handful of founding partners locally: I’ll set everything up with you, two to four weeks, no cost [or your terms]. I need blunt feedback on what’s annoying or slow vs what actually helps. Interested?”

### 2.4 Five outcomes to track per site

| # | Metric (qualitative OK) |
|---|-------------------------|
| 1 | Time or friction to complete **opening / shift** rhythm (checklist, line log). |
| 2 | **Menu update** path: import or edit → “good enough for service.” |
| 3 | **Team adoption**: who used it daily vs once. |
| 4 | **Top 3 papercuts** they name twice. |
| 5 | **Keep score** 1–10: “Would you keep this next month if we fixed X?” |

### 2.5 Weekly feedback questions

- What felt **slower than text, paper, or your old tool**?
- What did **staff skip or avoid**?
- What would make this **indispensable next week**?
- If we **removed one feature**, what must **never** be removed?

### 2.6 Product bias for this lane (next builds)

Prioritize: fast onboarding, mobile shift reliability, prep/checklists, menu import/edit, simple roles. Defer heavy enterprise asks (see ICP non-goals) until this lane is consistently “would keep 7+.”

### 2.7 Thirty-day cadence (repeat per cohort)

| Week | You | Them |
|------|-----|------|
| 1 | Setup + shadow one service or prep window | First real use |
| 2 | Ship 2–3 fixes from week 1 | Retest same workflows |
| 3 | Compare before/after; tighten docs | Short written or voice note |
| 4 | Keep/cancel decision + ask for **one** intro to a peer | Optional referral |

---

## 3) Ninety-day company rhythm (suggested)

| Month | Product / engineering | Local GTM |
|-------|------------------------|-----------|
| **1** | E1–E2; start E3; keep smoke green ([P1](./P1_EPIC_BREAKDOWN.md), [HOW_WE_SHIP](./HOW_WE_SHIP.md)) | 3–5 conversations; 1–2 live pilots |
| **2** | E3 MVP + costing alignment | Weekly feedback loop; second cohort if stable |
| **3** | E4 slice if multi-site story matters; harden mobile | Summarize learnings; optional widen to ICP shortlist ([CEO_TEAM_TASK_LIST](./CEO_TEAM_TASK_LIST_TO_MARKET.md)) |

---

## 4) Minimum company infrastructure

| Area | Minimum |
|------|---------|
| **Support** | One channel + [SUPPORT_PLAYBOOK_PILOT.md](./SUPPORT_PLAYBOOK_PILOT.md). |
| **Legal / stores** | Privacy policy URL before public store listing; pilot terms CEO-reviewed if paid ([ICP](./ICP_DECISION_RECORD.md)). |
| **Metrics** | Pilots active, weekly feedback captured, top bugs—spreadsheet is enough until ICP allows more. |

---

## 5) Revision history

| Date | Change |
|------|--------|
| 2026-05-04 | Initial gameplan: exec spine + chef/local pilot playbook. |
