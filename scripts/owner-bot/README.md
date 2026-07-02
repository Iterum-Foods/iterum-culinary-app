# Owner Bot — Iterum Culinary

Mirrors the **Restaurant Business Planner** owner bot (`owner_bot_v2.js` on your machine) so you can run the same style of phased owner tests on **Iterum** and later connect both apps via a shared test plan.

## Quick start (recommended)

```powershell
cd "c:\Iterum Innovation\iterum-culinary-app"

# One-time: create local env file (gitignored)
npm run owner-bot:init
# Edit scripts/owner-bot/.env.owner-bot — set ITERUM_TEST_EMAIL and ITERUM_TEST_PASSWORD

# Terminal 1 — serve Iterum
npm run serve:test

# Terminal 2 — run bot (checks server, loads .env.owner-bot)
npm run owner-bot:run
```

Or without the wrapper: `npm run owner-bot` (still auto-loads `.env.owner-bot` if present).

## Provision a restaurant (workspace + recipes + menu)

Creates a **new workspace** (or reuses same name), seeds **recipes** and a **launch menu** from `iterum_test_plan.json` + `RBP_BUSINESS_PLAN_PATH`:

```powershell
npm run serve:test
npm run owner-bot:provision
```

Outputs: `scripts/owner-bot/output/provision_result.json`, screenshots on menu builder and recipe library.

| Env | Purpose |
|-----|---------|
| `OWNER_BOT_FORCE_NEW_PROJECT=true` | Always create a new workspace (don’t reuse by name) |
| `RBP_BUSINESS_PLAN_PATH` | Hot Chix / RBP menu + restaurant metadata |

Then verify: `npm run owner-bot:run`

Open when finished:

- `scripts/owner-bot/output/owner_bot_iterum_report.html`
- `scripts/owner-bot/output/owner_agent_narrative.md`

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `ITERUM_BASE_URL` | `http://localhost:8080` | Iterum app URL (prod: `https://iterum-culinary-app.vercel.app`) |
| `ITERUM_TEST_EMAIL` | — | Firebase test account |
| `ITERUM_TEST_PASSWORD` | — | Password for that account |
| `ITERUM_TEST_PLAN` | `scripts/owner-bot/iterum_test_plan.json` | Shared plan schema |
| `RBP_BUSINESS_PLAN_PATH` | — | Optional path to RBP `business_plan.json` |
| `OWNER_BOT_HEADLESS` | `false` | Set `true` for CI |
| `OWNER_BOT_OUTPUT` | `scripts/owner-bot/output` | Screenshots + reports |

**Never commit credentials.** Use env vars only.

## Phases (same idea as RBP bot)

1. **Landing & auth** — ICP sections, sign-in on index/signin  
2. **Structure** — sample nav links  
3. **Three pillars** — Develop (recipes, menu), Run the shift (dashboard, mobile line log), Archive hub, Team on project hub  
3b. **Owner AI agent** — realistic “day in the life” scenarios (Monday open → line log → menu work → Friday backup → team)  
4. **Test plan** — restaurant + menu from JSON (optionally merged from RBP)  
5. **HTML + JSON report** — includes **Owner narrative** section with first-person thoughts and UX scores  

### Owner agent (Phase 3b)

Simulates **Alex @ Hot Chix Boston** (or your `ownerAgent.persona` in `iterum_test_plan.json`):

| Mode | When |
|------|------|
| **LLM** | `OPENAI_API_KEY` set (optional `OWNER_BOT_AI=true`) |
| **Scripted persona** | Default — first-person thoughts + smart clicks without an API |

```powershell
$env:OPENAI_API_KEY = "sk-..."
$env:OWNER_BOT_AI = "true"
$env:ITERUM_TEST_EMAIL = "..."
$env:ITERUM_TEST_PASSWORD = "..."
npm run owner-bot
```

Extra env: `OWNER_BOT_AI_MODEL`, `OWNER_BOT_AI_MAX_STEPS`, `OWNER_BOT_AI_SCENARIOS`, `OWNER_BOT_SKIP_AGENT=true` to disable.

## Connecting the two apps (future)

`iterum_test_plan.json` uses `schemaVersion: "1.0"` and `linkedApps` for:

- **Restaurant Business Planner** — port 3000, `business_plan.json` (financials, startup costs, menu)  
- **Iterum Culinary** — port 8080 (recipes, compliance, archive, workspaces)

Suggested integration path:

1. Same **restaurant id** / brand name in both JSON exports  
2. RBP **menu + COGS** → Iterum menu builder / recipe import (API or shared file)  
3. Iterum **compliance logs + archive export** → RBP compliance section for owner reports  
4. Run **both bots** in CI with the same `RBP_BUSINESS_PLAN_PATH` and compare `owner_bot_*_results.json`

## Onboarding audit (sign-up → setup → new project)

Walks the **greenfield owner path** and writes issues + UX notes:

```powershell
npm run serve:test
npm run owner-bot:onboarding
```

Chains **sign-up → setup → restaurant → stock setup → dashboard** by default.

| Env | Purpose |
|-----|---------|
| `OWNER_BOT_SIGNUP=true` | Create a new Firebase account (`+timestamp` email alias) instead of clearing profile |
| `OWNER_BOT_SKIP_STOCK=true` | Skip stock-setup phase (ingredients + inventory) |
| `OWNER_BOT_PROJECT_NAME` | Restaurant name for the create-project step |
| `ITERUM_BASE_URL` | Prod: `https://iterum-culinary-app.vercel.app` |

Outputs: `output/onboarding_audit.html`, `onboarding_audit.md`, `onboarding_*.png`

## Entry funnel UI audit (landing → sign-in → dashboard)

Automated **UI polish** pass: layout overflow, broken assets, console errors, auth routing, dashboard widgets, mobile nav.

```powershell
npm run owner-bot:entry
# Prod:
$env:ITERUM_BASE_URL="https://iterum-culinary-app.vercel.app"
npm run owner-bot:entry
```

| Env | Purpose |
|-----|---------|
| `OWNER_BOT_ENTRY_FRESH=true` | Clear operator profile before sign-in (first-run routing) |
| `OWNER_BOT_ENTRY_MOBILE=false` | Skip mobile viewport checks |

Outputs: `output/entry_funnel_audit.html`, `entry_funnel_audit.md`, `entry_*.png`

## Feature matrix (all modules & pages)

Full map: [`iterum_feature_map.json`](iterum_feature_map.json) — every toggleable module, pillar, pilot default, and page path.

```powershell
npm run serve:test
npm run owner-bot:features          # all modules — enables every feature flag first
npm run owner-bot:features:pilot    # pilot-default modules only (~9 modules)
npm run owner-bot:all               # onboarding (incl. stock) + full feature matrix
```

Outputs: `output/feature_matrix_report.html`, `feature_matrix_report.md`, `feature_*.png`

| Env | Purpose |
|-----|---------|
| `ITERUM_FEATURE_MAP` | Custom JSON path |
| `OWNER_BOT_ALL_FEATURES=false` | Do not force all modules on in operator profile |
| `OWNER_BOT_FEATURES_ONLY=pilot` | Only `pilotDefault: true` modules |

## Stock flow (ingredients + inventory)

```powershell
npm run owner-bot:stock
```

Walks `stock-setup.html` — add ingredients, opening counts, verify on `inventory.html`.

Outputs: `output/stock_flow_report.html`, `stock_*.png`

## vs Playwright smoke

| Tool | Role |
|------|------|
| `npm run test:chromium` | Fast CI smoke — pages load |
| `npm run owner-bot` | Owner journey — auth, pillars, screenshots, HTML report |

Human [Phase 1 teammate flow](../../docs/PHASE_1_TEAMMATE_FLOW_CHECKLIST.md) is still required for UID → team add on prod.

## Docs

- [THREE_PILLARS_PRODUCT_MODEL.md](../../docs/THREE_PILLARS_PRODUCT_MODEL.md)  
- [ICP_AUDIENCE_PERSONAS.md](../../docs/ICP_AUDIENCE_PERSONAS.md)  
- [COMPANY_LAUNCH_GAMEPLAN.md](../../docs/COMPANY_LAUNCH_GAMEPLAN.md)
