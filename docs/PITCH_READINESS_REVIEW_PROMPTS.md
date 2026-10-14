# Pitch-readiness review prompts (CTO + COO)

**Use before more pitch-deck or OpenArt work.**  
**Date:** 14 October 2026  
**How:** New Agent chat → first line `@iterum-persona-cto` or `@iterum-persona-coo` → paste the block below.

Known facts the agents should verify, not rediscover from scratch:

- GTM lock: solo chef or bartender, one workspace. Orgs = Phase 2. [CEO_DIRECTIVE_SINGLE_USER_LAUNCH.md](./CEO_DIRECTIVE_SINGLE_USER_LAUNCH.md)
- L1 prod pages HTTP 200 (6 Oct 2026). L2 Deploy Firebase green, run `37505466056` (6 Oct 2026).
- L3-solo walk, L5 named partner, and L6 recorded demos are still open.
- Landing / sign-in polish is on `main` (`33f950b`).
- Draft teaser only: [OPENART_INVESTOR_STORYBOARD.md](./OPENART_INVESTOR_STORYBOARD.md). No customers, revenue, or multi-site claims in that script.

---

## CTO prompt

```text
@iterum-persona-cto

You are reviewing Iterum Culinary before we continue an investor pitch deck and OpenArt teaser. I am the founder. Do not write pitch copy. Do not implement code unless you find a one-line factual error in a doc. Give an honest technical verdict.

Read first:
- docs/CEO_DIRECTIVE_SINGLE_USER_LAUNCH.md
- docs/CTO_SOLO_USER_TECH_BAR.md
- docs/LAUNCH_CHECKLIST_NOW.md
- EXEC_CHECKLIST_AND_NEXT_STEPS.md
- docs/HOW_WE_SHIP.md
- docs/SOURCE_OF_TRUTH.md
- docs/OPENART_INVESTOR_STORYBOARD.md (claims only — flag anything the product cannot demonstrate)

Verify, do not assume:
1. Latest Deploy Firebase run on main is still success (gh or Actions). Note the run id and date.
2. Prod URL https://iterum-culinary-app.vercel.app/ still serves landing, sign-in, dashboard, bar-ops, stock-setup, archive-hub.
3. Solo path risks that would embarrass a live demo: Master Project default, local-only recipes, export stubs, permission-denied after the rules deploy, setup still pushing “restaurant group.”

Answer in this shape:

Verdict: GO / CONDITIONAL / NO-GO to show the product in an investor teaser.
- GO = a founder can screen-share prod for one chef or bartender path without a known broken step.
- CONDITIONAL = safe only with a recorded path or a scripted click-list. Name the script.
- NO-GO = do not show the product until specific fixes land.

Then:
- What is actually live on prod vs only in the repo
- Top 5 demo-breakers, each with file path
- Claims in OPENART_INVESTOR_STORYBOARD.md that are fair, and claims that are not
- What the deck must not say (multi-site, teammates, POS, “cloud-saved everything,” revenue)
- The minimum eng work before a live demo, in order, with acceptance checks

Stop at the review. Do not expand into org features or a new roadmap.
```

---

## COO prompt

```text
@iterum-persona-coo

You are reviewing Iterum Culinary market readiness before we continue an investor pitch deck and OpenArt teaser. I am the founder. Do not write a new deck. Do not write code. Package a go / no-go for pitching.

Read first:
- docs/CEO_DIRECTIVE_SINGLE_USER_LAUNCH.md
- docs/ICP_DECISION_RECORD.md
- docs/COO_SOLO_CHEF_BARTENDER_PILOT_PACK.md
- docs/LAUNCH_CHECKLIST_NOW.md
- docs/PILOT_ONE_PAGER.md
- docs/MARKET_READINESS_SPRINT.md
- docs/OPENART_INVESTOR_STORYBOARD.md
- EXEC_CHECKLIST_AND_NEXT_STEPS.md

Context you must respect:
- We sell a solo chef or bartender on one workspace. Organizations and connecting venues are Phase 2.
- L1 and L2 are recorded GO (pages live, Firebase deploy green 6 Oct 2026).
- L3-solo (human walk), L5 (named partner), and L6 (two 5-minute demos) are still open.
- There is no signed pilot and no traction number you may invent.

Answer in this shape:

Verdict: GO / CONDITIONAL / NO-GO to continue the investor teaser.
- GO = the story matches what a stranger could see on prod this week.
- CONDITIONAL = story is fair only as a vision teaser, with an explicit “not yet in market” frame. List the sentences that must be said out loud.
- NO-GO = the current storyboard overclaims. List the cuts.

Then:
- Who the first check is written for (chef vs bartender vs investor), and whether that matches the ICP lock
- Gap between PILOT_ONE_PAGER.md and the OpenArt script
- What we can claim, what we must not claim, what is “coming after first partners”
- The smallest market proof still missing before a pitch meeting (partner name, recorded demo, or both)
- A 5-line founder script for the objection: “Is anyone using this?”

Stop at the review. Do not propose Semrush, ads, or multi-unit packaging.
```
