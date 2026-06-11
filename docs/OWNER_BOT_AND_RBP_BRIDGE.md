# Owner Bot + Restaurant Business Planner bridge

**Purpose:** Document how the **Owner Bot** pattern spans Iterum Culinary and **Restaurant Business Planner (RBP)** so you can connect both products over time.

**Last updated:** May 2026

---

## Two apps, one owner story

| App | Default URL | Owner focus |
|-----|-------------|-------------|
| **Restaurant Business Planner** | `http://localhost:3000` | Launch plan, financials, equipment, compliance permits |
| **Iterum Culinary** | `http://localhost:8080` | Recipes, menus, shift compliance, archive / exports |

Same operator (e.g. Hot Chix Boston): plan the business in RBP, **run the kitchen** in Iterum.

---

## Bots

| Script | Location |
|--------|----------|
| RBP Owner Bot V2 | `C:\Users\chefm\owner_bot_v2.js` (foundational) |
| Iterum Owner Bot | [`scripts/owner-bot/owner-bot-iterum.js`](../scripts/owner-bot/owner-bot-iterum.js) |

Both produce: phased console log, step screenshots, HTML report, JSON results.

**Iterum only — Owner AI agent (Phase 3b):** [`owner-agent.js`](../scripts/owner-bot/owner-agent.js) runs five “day in the life” scenarios (Monday open, line log, menu work, Friday backup, team). Uses `OPENAI_API_KEY` when set; otherwise a scripted Hot Chix owner persona. Output: `owner_agent_narrative.md` + narrative section in the HTML report.

---

## Shared test plan

[`scripts/owner-bot/iterum_test_plan.json`](../scripts/owner-bot/iterum_test_plan.json):

- `restaurant` + `menu` — can be copied from RBP `business_plan.json`
- `linkedApps` — documents ports and env var names for each app
- `iterumExpectations` — pillar URLs and DOM checks for Iterum

Set `RBP_BUSINESS_PLAN_PATH` when running the Iterum bot to merge RBP menu/restaurant into the plan automatically.

---

## Suggested data bridge (product roadmap)

| RBP data | Iterum destination | Notes |
|----------|-------------------|--------|
| `menu[]` (name, price, cogs) | Menu builder / recipes | Import script or API — not shipped yet |
| `restaurant` profile | Project hub workspace name | Manual or sync job |
| `financial_projections` | Reports (future) | Stay in RBP until Iterum reporting exists |
| Iterum HACCP / checklists | RBP compliance section | Export JSON from Archive hub |
| Iterum full backup | RBP attachments / owner packet | Weekly owner habit |

**Engineering rule:** one canonical **restaurant / workspace id** in both systems before automating sync.

---

## Run both before a pilot

```powershell
# RBP (port 3000 must be running)
node C:\Users\chefm\owner_bot_v2.js

# Iterum
cd "c:\Iterum Innovation\iterum-culinary-app"
npm run serve:test
$env:RBP_BUSINESS_PLAN_PATH = "C:\Users\chefm\business_plan.json"
$env:ITERUM_TEST_EMAIL = "..."
$env:ITERUM_TEST_PASSWORD = "..."
npm run owner-bot
```

Compare reports: RBP `test_report_v2.html` vs Iterum `scripts/owner-bot/output/owner_bot_iterum_report.html`.

---

## Revision history

| Date | Change |
|------|--------|
| May 2026 | Initial bridge doc; Iterum owner bot added to repo. |
