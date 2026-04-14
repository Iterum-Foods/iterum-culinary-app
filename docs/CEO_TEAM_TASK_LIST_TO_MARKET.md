# CEO team task list — web app, phone app, and market

**From:** CEO (working persona)  
**For:** CTO, COO, Engineering, Product/Marketing, Ops  
**Purpose:** One delegable list from **today** through **first market motion** (pilot + store presence).  
**Living trackers:** [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) · [APP_COMPLETION_PLAN.md](./APP_COMPLETION_PLAN.md) · [HOW_WE_SHIP.md](./HOW_WE_SHIP.md)  
**Last updated:** 14 April 2026  

---

## How to use

- Assign a **name** next to each **Owner role** in your standup tool; keep dates in one place (Notion, Asana, etc.).
- **Phase 0** is **complete** (2026-03-29): evidence on [EXEC_CHECKLIST](../EXEC_CHECKLIST_AND_NEXT_STEPS.md). **Phase 1** is **complete** (2026-04-14): ICP ratified in [ICP_DECISION_RECORD.md](./ICP_DECISION_RECORD.md); handoff [PHASE_1_CEO_HANDOFF.md](./PHASE_1_CEO_HANDOFF.md). **Next:** P1 engineering epic + estimate; Phase 2 mobile / Phase 3 GTM per tables below. Historical: [PHASE_0_ROLE_PROMPTS.md](./PHASE_0_ROLE_PROMPTS.md).
- Use `[ ]` / `[x]` here or mirror rows into your PM tool; this file stays the **narrative + links**.

---

## Phase 0 — Production trust (closed 2026-03-29)

| Done | Task | Owner | Done when |
|------|------|-------|-----------|
| [x] | Fix **Deploy Firebase** CI | CTO + Eng | Latest [Deploy Firebase](https://github.com/Iterum-Foods/iterum-culinary-app/actions/workflows/firebase-deploy.yml) on `main` is **success** (rules + indexes + storage). Use [HOW_WE_SHIP: If Deploy Firebase fails](./HOW_WE_SHIP.md#if-deploy-firebase-fails-in-ci) if needed. |
| [x] | Confirm **Firestore indexes** built | Eng | Console shows collection group index for **members** / **authUid** after deploy of `firestore.indexes.json`. |
| [x] | **A1 human smoke** complete | COO / Ops | [A1_P0_PROD_SMOKE_RECORD.md](./A1_P0_PROD_SMOKE_RECORD.md) set to **GO** (steps **2** sign-in persistence + **4** recipe photo on Vercel). |
| [x] | **Executive P0 sign-off** package | COO | One-pager for CEO: CI green + A1 GO + open risks. |
| [x] | **CEO** formal P0 approval | CEO | Dated OK on [EXEC_CHECKLIST](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) executive row. |

---

## Phase 1 — Web app pilot-ready (closed 2026-04-14)

**COO Agent delegation (historical):** [PHASE_1_COO_AGENT_DELEGATION.md](./PHASE_1_COO_AGENT_DELEGATION.md)

| Done | Task | Owner | Done when |
|------|------|-------|-----------|
| [x] | **ICP ratification** (90-day lock) | **CEO** | **Locked:** [ICP_DECISION_RECORD.md](./ICP_DECISION_RECORD.md) (ratified 2026-04-14). |
| [x] | **Teammate flow** | Runbook + prod smoke | [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md) — automated **6/6** prod smoke; **optional** full UID path before first paid pilot (~15 min). |
| [x] | **Support playbook** (one page) | COO agent | [SUPPORT_PLAYBOOK_PILOT.md](./SUPPORT_PLAYBOOK_PILOT.md) |
| [x] | **Pilot acceptance criteria** | COO agent | [PILOT_ACCEPTANCE_CRITERIA_WEB.md](./PILOT_ACCEPTANCE_CRITERIA_WEB.md) |

---

## Phase 2 — Phone app (store-ready)

| Done | Task | Owner | Done when |
|------|------|-------|-----------|
| [ ] | **Android** release candidate | Eng, CTO review | Signed **AAB**; device smoke vs production URL. [android/README.md](../android/README.md). |
| [ ] | **iOS** release candidate | Eng (Mac) | Xcode **Archive** after `pod install`; TestFlight or internal smoke. |
| [ ] | **Store assets** | Marketing + Eng | App icons, screenshots, short description, **privacy policy URL**, support URL/email. |
| [ ] | **Play / App Store** listings + data safety | Ops or COO + Eng | Submitted; Firebase/Auth/Firestore disclosures accurate. |
| [ ] | **Versioning** before each submit | Eng | `versionCode` / marketing version bumped; note in [HOW_WE_SHIP](./HOW_WE_SHIP.md) or android README. |

---

## Phase 3 — Go-to-market (first wave)

| Done | Task | Owner | Done when |
|------|------|-------|-----------|
| [ ] | **Pilot shortlist** (3–10 targets) | COO / Sales | Named venues; ICP fit; design-partner consent. |
| [ ] | **Offer** (free line log + full Iterum path) | CEO + Marketing | Landing copy matches [index / mobile](../public/index.html); no over-claim on beta features. |
| [ ] | **Launch comms** | Marketing | Dated campaign; Vercel + store links when live. |
| [ ] | **Pilot feedback loop** | COO | Weekly check-in template; log requests to CTO/PM. |
| [ ] | **Stretch: email invite** (no UID paste) | CTO + Eng | Cloud Function + Admin SDK; optional after Phase 0–1 stable. |

---

## Dependencies (do not skip)

1. **Phase 0 before Phase 3** — Phase 0 **done** (2026-03-29); still avoid big GTM ahead of **Phase 1** pilot readiness (ICP, teammate path).  
2. **ICP before heavy multi-site engineering** — **ICP locked 2026-04-14**; P1 estimates in [EXEC_CHECKLIST](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) can proceed.  
3. **Store review** — WebView shell must match policy; privacy and data use must match Firebase.

---

## Escalation

- **Technical** (deploy, rules, indexes, auth): **CTO** to Eng.  
- **Pilot and sign-off**: **COO** to **CEO**.  
- **Scope:** **CEO** vs ICP and [APP_COMPLETION_PLAN](./APP_COMPLETION_PLAN.md) pilot-ready bar.

---

*Update Phase tables and **Last updated** when this list drifts.*
