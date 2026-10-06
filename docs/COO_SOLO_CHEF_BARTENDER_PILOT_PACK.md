# COO execution packet — solo chef / bartender pilots

**Authority:** [CEO_DIRECTIVE_SINGLE_USER_LAUNCH.md](./CEO_DIRECTIVE_SINGLE_USER_LAUNCH.md) (locked **16 Sep 2026**)  
**Role:** COO packaging for GTM / pilots — not a product override of CTO tech or CEO strategy  
**Prod:** https://iterum-culinary-app.vercel.app/  
**Companions:** [PILOT_ONE_PAGER.md](./PILOT_ONE_PAGER.md) · [MARKET_READINESS_SPRINT.md](./MARKET_READINESS_SPRINT.md) · [LAUNCH_CHECKLIST_NOW.md](./LAUNCH_CHECKLIST_NOW.md) · [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md)

**Status:** COO draft for CEO/Eng handoff — apply copy into `PILOT_ONE_PAGER.md` and gate language into LAUNCH/EXEC when leadership edits those files.

---

## 0. Framing (what changed)

| Before (multi-unit primary) | Now (90-day GTM) |
|-----------------------------|------------------|
| Sell 1–8 kitchens / shared vendors / teammate join | Sell **one person** getting daily value |
| Pilot GO leaned on teammate 1–8 + A≠B prices | **Solo golden path** is the GO bar |
| Demo: kitchen + optional bar + team | **Two tracks:** chef **or** bartender |

**Phase 2 (not abandoned):** org connecting, multi-unit compare, teammate RBAC polish — after solo retention proof.

---

## 1. Pilot offer rewrite — concrete copy edits

**Source file:** [PILOT_ONE_PAGER.md](./PILOT_ONE_PAGER.md)  
**Audience:** solo chef-owner / culinary lead **or** solo bartender / bar lead (not multi-unit primary).

### Headline / for-line

| Location | Current | Proposed |
|----------|---------|----------|
| Title subtitle | “chef-led independents and small groups (1–8 kitchens)” | “solo chefs and bartenders who will use the tool themselves during service” |
| Updated date | 19 August 2026 | **16 September 2026** (align to CEO lock) |

**Proposed for-line:**

> **For:** one chef **or** one bartender who owns the program — recipes/cocktails, costing, today’s shift tools, and a portable backup — without needing a second account or an org admin.

### What this is

| Current | Proposed |
|---------|----------|
| “…professional kitchens: recipes and menus… Shift… vendors… bar-program pack” | Keep product facts; lead with **solo job**: “sign up → stock/well → recipes/cocktails → cost → run today’s tools → export.” Drop “staff on Shift with the same login” as a primary promise. |

**Proposed body (replace first paragraph):**

> Iterum is a **web app for professional kitchens and bars**. One person can build recipes or cocktails with costing, run **Shift** tools for today’s checks and builds, and **export/backup** so the work stays theirs. We are not replacing your POS, accountant, or distributor portal. Multi-site and full team rollout come later — this partner window proves **your** daily path.

### What you get (table rewrite)

| You (proposed) | We (proposed) |
|----------------|---------------|
| One account, **one workspace** (kitchen **or** bar) | White-glove setup: login, workspace, first menu **or** bar pack |
| You run Develop + Shift + Archive yourself | Walk the 5-min path on prod; fix what you actually hit |
| Weekly 15–30 min debrief | Training only on modules you used |
| Honest “would I keep this for myself?” | Optional testimonial **only if** you would recommend it |

**Remove / demote from primary table:** “Staff on Shift with the same login”; “Add teammates by user ID”; “one or more workspaces (two sites).”

**Optional footnote (hygiene, not the offer):**

> Team invite and second workspace are available later; they are **not** required for this founding window.

### Typical week (solo)

- **Chef track:** update a recipe; cost a dish; stock ingredients; Shift temps/checks if you open; Archive export after a menu push.  
- **Bartender track:** bar program / drink specs; well pars; Shift Bar tab + opening/closing; optional price list → order guide; Archive export after a program change.

### Pass / fail (partner-facing) — aligned to solo

We call the window a **success** if:

1. You can **sign in** and keep **one workspace** active without Firebase Console.  
2. At least one **menu, recipe pack, or bar pack** is **saved and used** after the first week.  
3. **You** use Shift **or** Develop weekly (checks, Bar tab, How-to, or recipe/menu edits).  
4. You complete **one export/backup** (Archive / backup center) so work is portable.  
5. No unresolved **severity-1** past hours agreed in writing.

We **fail** if you withdraw, data is lost without recovery, or (1)–(4) are not true at the end date.

**Internal attach:** still [PILOT_ACCEPTANCE_CRITERIA_WEB.md](./PILOT_ACCEPTANCE_CRITERIA_WEB.md) — with solo amendments in §3 of this pack (do not require teammate checklist for pass).

### What we will not promise

Keep existing bullets (POS, EDI, perfect PDF, location semantics, store apps). **Add:**

- Multi-restaurant org hierarchy or “connect all your venues” as a pilot deliverable  
- Guaranteed teammate invite / SSO in this window  

### Next step

> Reply with **two dates** for a 30–45 minute setup (screenshare OK) and whether you are on the **chef** or **bartender** track. Owner of the workspace = **you**.

---

## 2. Two 5-minute demo scripts (prod)

**Base URL:** `https://iterum-culinary-app.vercel.app/`  
**Rule:** One continuous take ≤5 min; **no** Firebase Console; **no** second user.  
**Vs [MARKET_READINESS_SPRINT.md](./MARKET_READINESS_SPRINT.md):** old script ended at optional Shift and implied kitchen-only; **new** scripts end on **Archive** and split **chef vs bartender**. Teammate / two-workspace / A≠B = **optional hygiene demos**, not the recorded pilot tape.

### Track A — Solo chef (BOH / launch / career cook)

| # | Beat | Click path | Talking point |
|---|------|------------|---------------|
| 1 | Sign in | `/signin.html` → continue to setup if new | “One account. You’re the operator — no org admin.” |
| 2 | One kitchen | `/setup.html` — restaurant + chef role (not Master Project) | “This is your workspace. Phase 2 is connecting more later.” |
| 3 | Stock | `/stock-setup.html` — 2–3 ingredients + counts | “Costing starts with real items, not empty recipes.” |
| 4 | Today | `/dashboard.html` — checklist / idea pad | “Shift board for what matters today.” |
| 5 | Recipe | Dish Creator (`/dish-creator.html`) — 2 ingredients | “Recipes stay yours and portable.” |
| 6 | Menu + cost | Menu Builder (`/menu-builder.html`) — add dish; show cost/checklist | “Menu and cost in one place — launch-ready.” |
| 7 | Floor (phone) | `/mobile-compliance.html` — one check or temp | “Same workspace on the phone when you’re on the line.” |
| 8 | Own it | `/archive-hub.html` or `/data-backup-center.html` — show export/backup | “Your IP leaves with you — Archive is the trust close.” |

**Pass:** Continuous ≤5 min; workspace stays one kitchen; no teammate step.

### Track B — Solo bartender / bar lead

| # | Beat | Click path | Talking point |
|---|------|------------|---------------|
| 1 | Sign in | `/signin.html` → setup | “Bar program owner — one account.” |
| 2 | One bar workspace | `/setup.html` — bar / FOH-leaning role if offered; name the program | “One workspace for the well and the book.” |
| 3 | Stock / well | Stock or ingredients path — 2–3 bottles/items **or** well pars from bar pack | “Pars and specs before the shift starts.” |
| 4 | Bar program | `/bar-ops.html` — Import Common Craft **or** open existing pack; show standards/specs | “Program hub — not a PDF in a drawer.” |
| 5 | Publish / drinks | Dashboard → bar drink drafts / publish path (as live) | “What you publish is what the floor sees.” |
| 6 | Shift Bar | `/mobile-compliance.html` — Bar tab: open/close or build check | “Phone layer for tonight’s service.” |
| 7 | Optional buy list | `/price-list-upload.html` (CSV) → `/order-guides.html` print | “Only if time — purchasing without EDI.” |
| 8 | Own it | Archive / backup export | “Program backup when you change houses or seasons.” |

**Pass:** Continuous ≤5 min; **must** hit bar-ops + Shift Bar + Archive; price-list optional if clock is tight.

### Optional hygiene (do **not** gate solo GO; do **not** put on founding-partner tape)

| Demo | When | Doc |
|------|------|-----|
| Teammate UID add 1–8 | After first solo partners live | [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md) |
| Two-workspace switch | Phase 2 sales prep | M1 / LAUNCH L3 |
| E3 A≠B prices | After Deploy Firebase green | [E3_PROD_VERIFY.md](./E3_PROD_VERIFY.md) |

**Recording ask:** COO records **both** tracks once on prod; file links in leadership chat; tick LAUNCH **L6** (reframed) + EXEC demo row.

---

## 3. Acceptance criteria — “solo pilot ready” (COO GO)

COO signs **GO for structured solo pilots** when **all required** rows are true. Optional hygiene does **not** block.

### Required — product / trust (solo)

| ID | Criterion | Evidence |
|----|-----------|----------|
| S1 | Prod URL loads auth + setup without Console | Fresh account on Vercel |
| S2 | **One** workspace created; not stuck on Master Project | Screenshot / notes |
| S3 | Stock **or** bar well/ingredients completable in one sitting | 2+ items saved |
| S4 | Recipe **or** cocktail + menu/program path works | Saved artifact after reload/sign-in |
| S5 | Dashboard / Shift usable for role (chef checks **or** Bar tab) | One completed action |
| S6 | Export / Archive / backup path works | File downloaded or backup confirmed |
| S7 | No Firebase Console required for S1–S6 | Operator-only walkthrough |
| S8 | Eng: L1 pages live (`bar-ops`, stock/menu/shift as needed) + smoke green | [LAUNCH_CHECKLIST_NOW.md](./LAUNCH_CHECKLIST_NOW.md) L1 + `test:smoke:prod` |
| S9 | CTO: auth + single-workspace cloud save trustworthy enough for partner data | Deploy Firebase **preferred**; if token still blocked, CEO risk accept in writing for **discovery** partners only — **paid** SOWs wait for green deploy |

### Required — GTM packaging

| ID | Criterion | Evidence |
|----|-----------|----------|
| G1 | Pilot one-pager copy matches solo offer (§1 applied or attached) | This pack + edited one-pager |
| G2 | One 5-min demo recorded per track (or one track if first partner is known) | Private Loom/link |
| G3 | Support hours + sev-1 SLA named | [SUPPORT_PLAYBOOK_PILOT.md](./SUPPORT_PLAYBOOK_PILOT.md) |
| G4 | Definitions sheet (margin/tax; `projectId` ≠ location) | [PILOT_DEFINITIONS_SHEET.md](./PILOT_DEFINITIONS_SHEET.md) |
| G5 | Named founding partner candidate shortlist (≥2) | §4 |

### Partner window pass/fail (during pilot)

Align partner-facing §1 pass/fail. Internally: amend [PILOT_ACCEPTANCE_CRITERIA_WEB.md](./PILOT_ACCEPTANCE_CRITERIA_WEB.md) criterion **1** — replace “team access per teammate checklist” with “**solo auth + workspace membership for the owner**.” Keep adoption, weekly use, costing-if-scoped, support SLA.

### Optional hygiene (explicitly **not** GO gates)

| ID | Item | Status treatment |
|----|------|------------------|
| H1 | Teammate flow steps **1–8** | Optional; was LAUNCH **L3** |
| H2 | Two-workspace menu/Shift demo | Optional; Phase 2 prep |
| H3 | E3 **A≠B** vendor prices on prod | Optional for solo GTM; keep for trust roadmap / Phase 2 |
| H4 | Multi-unit ICP sales story | Deferred per CEO directive |

**COO GO sentence (for CEO):**

> “Solo pilot ready: S1–S8 [and S9 as decided], G1–G5 complete; H1–H3 parked as hygiene. Ready to send one-pager to shortlist.”

---

## 4. Founding partner shortlist criteria (chase this month)

**Target:** 1–2 signed discovery partners in the next 30 days; pipeline of 4–6 conversations.

### Must-have (chase)

| Criterion | Why |
|-----------|-----|
| **Single operator** who will click the product weekly (chef-owner, exec chef R&D, or bar lead — not “IT will evaluate”) | Matches CEO job-to-be-won |
| Willing to do **30–45 min** setup + **weekly 15–30 min** debrief for 2–4 weeks | White-glove works only with a human owner |
| Has a **real program** to load (opening menu, seasonal rewrite, or bar book / well) | Empty pilots fail adoption |
| Comfortable with **web + phone browser** (no App Store requirement) | Honest SOW |
| Accepts **no POS / no EDI / no multi-unit connect** in writing | Prevents scope creep |

### Strong prefer

| Criterion | Why |
|-----------|-----|
| Independent / single venue or single bar program | Clean solo proof |
| Already frustrated by **scattered notes / lost recipes / PDF specs** | Develop + Archive story |
| Can give **honest fail** feedback (would not keep) | Better than polite ghosts |
| Local or same timezone for screenshare | Faster fixes |

### Deprioritize this month

| Profile | Why |
|---------|-----|
| Multi-unit buyer whose first ask is “connect all locations” | Phase 2 |
| Groups that require **teammate invite** or SSO before they’ll try | Hygiene, not solo proof |
| Pure consultants wanting client portals first | Secondary later |
| Anyone needing ERP / warehouse / automated POs | Explicit non-promise |

### Chase list fields (CRM / sheet)

`Name · Role (chef|bartender) · Venue · Track · Warmth · Next touch date · Blocker · Notes`

---

## 5. Comms — email drafts

### A — Chef-owner / culinary lead

**Subject:** Founding partner — your kitchen, one workspace (2–4 weeks)

Hi [Name],

We’re opening a short founding window for **solo chefs** on Iterum Culinary — recipes, costing, today’s shift tools, and a backup you control. Multi-site and full team rollout are later; this window is about **you** getting daily value without a second account.

Product: https://iterum-culinary-app.vercel.app/

If you’re game: reply with **two times** for a 30–45 minute screenshare and whether you’re launching a menu or cleaning up an existing book. No fee for founding partners; honest “would I keep this?” at the end.

[Your name]  
Iterum

### B — Bar lead / bartender

**Subject:** Founding partner — your bar program on phone + backup (2–4 weeks)

Hi [Name],

We’re looking for **one bartender or bar lead** to run Iterum as a founding partner: drink specs / well pars, Shift Bar tools for open/close, and an export so the program stays portable. We’re not selling multi-venue connect in this window — just **your** program working end-to-end.

Product: https://iterum-culinary-app.vercel.app/

Reply with **two times** for setup and whether you already have a written book or want to start from our bar pack. Founding terms: white-glove setup, weekly check-in, no POS/EDI promises.

[Your name]  
Iterum

---

## 6. RACI update — EXEC / LAUNCH under new directive

### Recommended gate remap (LAUNCH)

| Gate | Old meaning | New meaning (solo-first) | Owner | Blocks solo pilot? |
|------|-------------|--------------------------|-------|-------------------|
| **L0** | Code on main | Unchanged | Eng | Yes if broken |
| **L1** | Vercel pages live | Confirm **solo surfaces**: setup, stock, dish/menu **or** bar-ops, Shift, Archive | Eng | **Yes** |
| **L2** | Deploy Firebase | Still trust; **preferred** before paid SOW; discovery may proceed with CEO risk note | CTO | **Paid:** Yes · **Discovery:** CEO call |
| **L3** | Teammate 1–8 + two-workspace | **Reclassify → H1/H2 optional hygiene** | COO | **No** |
| **L4** | E3 A≠B | **Reclassify → H3 optional**; Phase 2 / trust roadmap | CTO + COO | **No** for solo |
| **L5** | Named pilot | **Solo** chef **or** bartender + written 2–4 wk terms (one-pager §1) | CEO + COO | **Yes** (GTM) |
| **L6** | 5-min demo | **Two tracks** recorded (chef + bartender) per §2 | COO | **Yes** (packaging) |

**New gate (optional label L3-solo):** COO human walkthrough of **solo** S1–S7 on prod (replaces teammate as the human GO).

### EXEC checklist — next-steps rewrite (recommended bullets)

Replace “COO: Teammate 1–8 + two-workspace (L3)” as a **now** blocker with:

- [ ] **COO:** Solo chef + bartender 5-min demos recorded on prod; apply pilot one-pager rewrite ([this pack](./COO_SOLO_CHEF_BARTENDER_PILOT_PACK.md)).  
- [ ] **COO:** Shortlist 2–4 founding partners (solo criteria); send emails.  
- [ ] **CEO/COO:** Sign first solo partner terms (L5).  
- [ ] **CTO:** Deploy Firebase green (L2) — hold **paid** SOWs; Eng keep solo smoke green.  
- [ ] **Eng:** Confirm L1 solo surfaces on prod; fix single-user onboarding dead ends only.  
- [ ] **(Hygiene)** Teammate 1–8 + A≠B — park; do not block L5/L6.

### RACI snapshot

| Role | Owns now | Done when |
|------|----------|-----------|
| **CEO** | Hold Phase 2 defer; approve SOW language; re-ratify ICP record vs 16 Sep directive | ICP decision record updated; partner approved |
| **COO** | Offer + demos + shortlist + solo GO (S/G criteria) | This pack executed; L5/L6 |
| **CTO** | Firebase deploy; single-user data path notes | L2 green + solo tech notes |
| **Eng** | Prod pages + onboarding dead ends; smoke | L1 + solo smoke |

### ICP note (for CEO)

[ICP_DECISION_RECORD.md](./ICP_DECISION_RECORD.md) still shows **multi-unit primary (2026-04-14)**. CEO directive **16 Sep 2026** supersedes that for **GTM sequencing**. COO recommends CEO **re-ratify** primary = single-user chef/bartender; multi-unit = Phase 2 — one signature pass so sales/copy and P1 epics stop fighting each other.

---

## COO this-week checklist

1. Apply §1 edits into `PILOT_ONE_PAGER.md` (or attach this pack until edited).  
2. Record Track A + Track B on prod; store links privately.  
3. Fill shortlist sheet (≥4 names); send §5 emails to top 2.  
4. Patch LAUNCH scoreboard language: L3/L4 → optional; add L3-solo.  
5. Ask CEO for ICP re-ratification + S9 risk call if Firebase still blocked.  
6. File one line in [PERSONA_HANDOFF_LOG.md](./briefings/PERSONA_HANDOFF_LOG.md) when first partner is named.

---

## Revision history

| Date | Change |
|------|--------|
| 2026-09-16 | COO pack: solo chef/bartender offer, demos, GO criteria, shortlist, emails, RACI remap per CEO directive. |
