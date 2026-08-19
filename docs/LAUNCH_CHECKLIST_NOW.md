# Launch checklist — now (pilot first)

**Purpose:** One page with **owners and dates** so “launch” is a sequence, not a vibe.  
**Date:** 19 August 2026  
**Prod URL:** `https://iterum-culinary-app.vercel.app/`  
**Authority:** [APP_COMPLETION_PLAN.md](./APP_COMPLETION_PLAN.md) (pilot-ready vs scale-ready) · [PILOT_ACCEPTANCE_CRITERIA_WEB.md](./PILOT_ACCEPTANCE_CRITERIA_WEB.md) · [FUNCTIONAL_READINESS_GATE.md](./FUNCTIONAL_READINESS_GATE.md)  
**External one-pager:** [PILOT_ONE_PAGER.md](./PILOT_ONE_PAGER.md)  
**Ship runbook:** [HOW_WE_SHIP.md](./HOW_WE_SHIP.md)

---

## Decision (locked for this sprint)

**Launch target = first 1–3 web pilots**, not App Store / Play Store, not every HTML page, not POS/ERP.

| We sell in the pilot | We do **not** promise |
|----------------------|------------------------|
| Auth + workspaces (`projectId`) | `projectId` = “location” without a footnote |
| Recipes, menus, costing | 100% costing completeness on day one |
| Shift app: temps, checklists, Bar tab, How-to SOPs | Native store apps |
| Vendors + price-list upload + order guides (print) | Vendor EDI / emailed POs / warehouse |
| Bar program seed (Common Craft) + well pars | Full bottle-level ERP inventory |
| UID teammate add | SAML SSO, automated email invites |

**Done for “pilot launched”:** Gates **L1–L4** below are **GO**, plus **one named kitchen** with a signed (or written) 2–4 week partner agreement.

---

## Scoreboard (19 Aug 2026)

| Gate | Status | Owner | Due |
|------|--------|-------|-----|
| **L0** Code on `main` (bar + purchasing) | **GO** — `84b1cbe` | Eng | Done |
| **L1** Vercel prod has those pages | Confirm after this deploy | Eng | 20 Aug |
| **L2** Deploy Firebase green (E3 rules) | **Blocked** — `FIREBASE_TOKEN` | CTO | 22 Aug |
| **L3** COO teammate 1–8 + two-workspace demo | Open hygiene | COO | 26 Aug |
| **L4** E3 prices A ≠ B on prod | Blocked on L2 | CTO + COO | 27 Aug |
| **L5** Named pilot + SOW | Open | CEO / COO | 2 Sep |
| **L6** 5-min prod demo recorded | Open | COO | 5 Sep |

---

## L1 — Confirm this week’s ship is live (Eng)

**Due:** 20 Aug 2026

On **prod** (not localhost):

- [ ] `price-list-upload.html` loads  
- [ ] `order-guides.html` loads  
- [ ] `bar-ops.html` loads  
- [ ] Dashboard shows **Bar program** card  
- [ ] Sidebar: **Bar program** + **Order guides**

**Fail:** Vercel did not pick up `main` — check Actions / Vercel dashboard.

---

## L2 — Production trust (CTO) — **hard blocker**

**Due:** 22 Aug 2026  
**Packet:** [E3_PROD_VERIFY.md](./E3_PROD_VERIFY.md) Gate 0 · [HOW_WE_SHIP.md](./HOW_WE_SHIP.md)

- [ ] `firebase login:ci` → new **`FIREBASE_TOKEN`** in GitHub Actions secrets  
- [ ] Workflow **Deploy Firebase** **success** on `main`  
- [ ] If no rules change since last green deploy, write that fact on this row (still confirm latest run)

**Why it blocks:** Shared vendors + per-workspace prices are not trustworthy until rules are live.

---

## L3 — Human GO on prod (COO)

**Due:** 26 Aug 2026  
**Packet:** [M1_COO_PROD_VERIFICATION.md](./M1_COO_PROD_VERIFICATION.md) · [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md)

- [ ] Steps **1–8** teammate flow on Vercel  
- [ ] Two-workspace demo: menu-builder + Shift, no stuck permission-denied  
- [ ] Date + tester recorded (this file or M1 packet)

**CEO already directed M1 closed (16 Jul).** This is **hygiene** before a paying or structured partner.

---

## L4 — E3 price isolation (CTO + COO)

**Due:** 27 Aug 2026  
**Packet:** [E3_PROD_VERIFY.md](./E3_PROD_VERIFY.md) Gate 1

- [ ] Workspace **A** and **B** show **different** vendor unit costs for the same ingredient when overrides exist  
- [ ] Costing on a menu/recipe in A does not silently use B’s price

---

## L5 — One kitchen (CEO + COO)

**Due:** 2 Sep 2026  
**Offer:** [COMPANY_LAUNCH_GAMEPLAN.md](./COMPANY_LAUNCH_GAMEPLAN.md) §2 · send [PILOT_ONE_PAGER.md](./PILOT_ONE_PAGER.md)

- [ ] Named venue / group (2+ workspaces preferred; 1 chef-led independent OK as discovery lane)  
- [ ] Written 2–4 week terms: white-glove setup, weekly 15–30 min debrief, no POS/SSO promises  
- [ ] Pilot bar: [PILOT_ACCEPTANCE_CRITERIA_WEB.md](./PILOT_ACCEPTANCE_CRITERIA_WEB.md) attached  
- [ ] **Definitions sheet:** margin formula, tax note, `projectId` ≠ location footnote  
- [ ] Support: [SUPPORT_PLAYBOOK_PILOT.md](./SUPPORT_PLAYBOOK_PILOT.md) + SLA hours for sev-1

---

## L6 — Demo evidence (COO)

**Due:** 5 Sep 2026  
**Script:** [MARKET_READINESS_SPRINT.md](./MARKET_READINESS_SPRINT.md) (5-minute demo)

Record once on **prod**:

1. Sign-in → pick workspace  
2. Menu or recipe visible  
3. Shift: How-to or Bar tab  
4. Optional for bar-led pilots: **Bar program** import **or** price-list CSV → order guide  

- [ ] Link to recording stored privately (not in git)

---

## Golden path to walk with the first partner

**Office (30 min setup)**

1. Account + workspace ([setup.html](../public/setup.html) / project hub)  
2. Stock or ingredients as needed  
3. One menu + costing (or import)  
4. Add one teammate via UID ([ADD_TEAMMATE_UID_PATH.md](./ADD_TEAMMATE_UID_PATH.md))

**Bar / FOH (if in scope)**

5. [bar-ops.html](../public/bar-ops.html) → Import Common Craft pack **or** customize SOPs in [sop-hub.html](../public/sop-hub.html) → Publish to Shift  
6. Dashboard → publish bar drink drafts  
7. [price-list-upload.html](../public/price-list-upload.html) → CSV preferred; PDF review table required  
8. [order-guides.html](../public/order-guides.html) → par / on-hand → print buy list  

**Floor**

9. [mobile-compliance.html](../public/mobile-compliance.html) — workspace match, one checklist or temp log, Bar tab if published  

---

## After first pilot GO — 90-day ICP (not launch blockers)

| When | Work | Owner |
|------|------|--------|
| Sep | Finish E3 operator UI + costing tests | Eng |
| Oct | E4 cross-workspace compare/export | Eng + PM |
| Parallel | E5 one authenticated Playwright path | Eng |
| After functional gate | Lane A stores — [PHASE_2_3_EXECUTION.md](./PHASE_2_3_EXECUTION.md) | CEO |

**Do not** start store review until [FUNCTIONAL_READINESS_GATE.md](./FUNCTIONAL_READINESS_GATE.md) is green.

---

## Risks this month

| Risk | Owner | Action |
|------|--------|--------|
| Firebase token still expired | CTO | L2 this week |
| Bar PDF parser junk rows | Eng / operator | Prefer CSV; never skip review table |
| Inventory still local-first | CEO | Say so in the one-pager |
| Scope creep (every page) | CEO | Cut to golden path above |

---

## Weekly 30-min standup (use this agenda)

1. L1–L4: GO / blocked / evidence link  
2. Pilot name: yes / still hunting  
3. One papercut from last week  
4. Explicit **no** for anything not on the golden path  

Log dated notes in [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) **Leadership log**.
