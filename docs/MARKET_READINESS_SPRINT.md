# Market readiness sprint — testing & UI

**Purpose:** Close the gap between **pilot-ready trust** (P0 done) and **first paying / structured pilot** with a repeatable test bar and a short UI polish queue.  
**Companion:** [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) · [PILOT_APP_COMPLETION_MASTER.md](./PILOT_APP_COMPLETION_MASTER.md) · [QA_FEATURE_TEST_WORKFLOW.md](./QA_FEATURE_TEST_WORKFLOW.md)  
**Last updated:** 17 July 2026

---

## Where we are (automated — green)

| Gate | Command | Prod (30 Jun 2026) |
|------|---------|-------------------|
| Page smoke | `npm run test:smoke:prod` | **46 passed**, 3 skipped (auth) |
| Full owner golden path | `OWNER_BOT_SIGNUP=true npm run owner-bot:onboarding` | **Pass** — sign-up → setup → restaurant → stock → dashboard |
| Feature matrix | `npm run owner-bot:features` | **41/41** paths (local) |
| Lint / format | `npm run lint` · `npm run format:check` | Run before each release |

**Golden path (owner):** Sign up → `setup.html` (restaurant + pilot features) → `stock-setup.html` (ingredients + counts) → dashboard (menu launch checklist) → Dish Creator → Menu Builder → Publish to Shift.

---

## What still blocks “market” (human + product)

| Gate | Owner | Status | Doc |
|------|-------|--------|-----|
| **M1 human GO** | CEO | **Closed 16 Jul 2026** | [M1_COO_PROD_VERIFICATION.md](./M1_COO_PROD_VERIFICATION.md) |
| Teammate flow (admin adds line user) | COO + Eng | Open (post-GO hygiene) | [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md) |
| Two-workspace demo on prod | COO | Open | M1 doc |
| E3 A≠B prices on prod | CTO + COO | **Blocked on Deploy Firebase** | [E3_PROD_VERIFY.md](./E3_PROD_VERIFY.md) |
| Pilot customer named | COO / Sales | Open | EXEC checklist P1 |
| Auth E2E in CI | Eng | Open | E5 in [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) |

**CEO call:** Demos and design partners can run on the golden path; **paid pilot contracts** should wait for COO teammate walkthrough + E3 prod Gate 1 after rules deploy.

---

## 2-week sprint — recommended order

### Week 1 — Prove the path (test)

| Day | Task | Pass criteria |
|-----|------|----------------|
| 1 | Run `npm run owner-bot:all` on **prod** after each deploy | Exit 0; review `scripts/owner-bot/output/*.html` |
| 1 | COO: M1 checklist steps 1–4 on prod | Signed notes in M1 doc |
| 2 | Human: fresh account through stock-setup (no bot) | Restaurant active, not Master; 2+ ingredients; inventory rows |
| 2 | Human: Dish Creator → Menu Builder → checklist 2+ steps green | Screenshot for sales deck |
| 3 | Line user: `employee_line` setup → mobile-compliance | Lands on shift app, not dashboard |
| 3 | Admin adds line UID on project hub Team tab | Line sees workspace (M1) |
| 4 | Two-workspace switch: menu draft follows project | COO demo script |
| 5 | `npm run test:smoke:prod` + Deploy Firebase green on `main` | Ship & verify block |

### Week 2 — Polish UI (pilot-visible only)

Priority = anything a **new owner** hits in the first session. Defer “More” menu and admin tools.

| P | UI item | File(s) | Status |
|---|---------|---------|--------|
| P0 | Inline restaurant on setup | `setup-page.js` | **Done** |
| P0 | Stock setup golden path | `stock-setup.html` | **Done** |
| P0 | Project hub: toast not `alert()` on create/activate | `project-hub.html` | **Done** |
| P0 | Quick-create restaurant uses modal not `prompt()` | `project-hub.html` | **Done** |
| P1 | Ingredient row: hint when vendor override exists | `ingredients.html` | **Done** (slice 2) |
| P1 | Menu costing “price sources” tooltip | `menu-builder` / costing | **Done** (slice 3) |
| P1 | Day-0 dashboard: pantry card + checklist order | `dashboard.html` | **Done** |
| P1 | Kitchen contrast (sidebar + dashboard) | revamp CSS + `dashboard.html` | **Done** (17 Jul 2026) |
| P2 | Replace remaining `alert()` on project hub (import/sample) | `project-hub.html` | Backlog (toasts preferred; alert only if toast missing) |
| P2 | `inventory_items` per-`projectId` scoping | `inventory-manager.js` | E2 — after pilot feedback |

---

## One command — pre-demo / pre-deploy

```powershell
# Terminal 1 (optional local)
npm run serve:test

# Full automated bar
$env:ITERUM_BASE_URL="https://iterum-culinary-app.vercel.app"
$env:OWNER_BOT_HEADLESS="true"
$env:OWNER_BOT_SIGNUP="true"
npm run test:smoke:prod
npm run owner-bot:onboarding    # golden path incl. stock
npm run owner-bot:features:pilot  # pilot modules only (~25 paths)
```

Optional full matrix: `npm run owner-bot:all` (onboarding + all 41 pages).

---

## Pilot demo script (5 minutes)

**Record once on prod** (Loom / phone). Checkboxes for the operator:

| # | Beat | Click path | Say |
|---|------|------------|-----|
| 1 | Sign up / sign in | `signin.html` → `setup.html` | “New kitchen in under a minute.” |
| 2 | Name the restaurant | setup: restaurant + chef role | “This becomes your workspace.” |
| 3 | Stock the kitchen | `stock-setup.html` — 3 ingredients + counts | “Costing needs real items first.” |
| 4 | Dashboard | `dashboard.html` — checklist + idea pad | “Shift board for today.” |
| 5 | Dish | Dish Creator — 2 ingredients | “Recipes stay portable.” |
| 6 | Menu | Menu Builder — add dish; show checklist progress | “Menu + cost in one place.” |
| 7 | Optional Shift | `mobile-compliance.html` | “Line tools on the phone.” |

**Pass:** One continuous take ≤5 min without Console or Firebase Console. File link in leadership chat; tick EXEC Week 1 demo row.

---

## Sign-off for “take to market”

| Role | Signs when |
|------|------------|
| **Eng** | Prod smoke + owner-bot onboarding green; no P0 UI regressions |
| **COO** | M1 human checklist + 5-min demo recorded once on prod |
| **CEO** | Pilot customer or design partner named; ICP offer scoped |

---

_Update “Last updated” and checkbox rows in EXEC_CHECKLIST when M1 closes._
