# Functional readiness gate (before store / Lane A)

**Purpose:** Ship only **Phase 2 (Play / App Store)** and heavy **Lane A GTM** after this gate is green. Product should be **reliably usable** for real pilots on web + mobile shell first.

**Last updated:** 2026-05-11

---

## When you are “ready for Lane A”

Lane A = store submission + broad listing/comms ([PHASE_2_3_EXECUTION.md](./PHASE_2_3_EXECUTION.md), [CEO_TEAM_TASK_LIST_TO_MARKET.md](./CEO_TEAM_TASK_LIST_TO_MARKET.md) Phase 2–3).

**Do not prioritize store review** until:

1. **Automated smoke is green** — `npm run test:chromium` (and full `npm test` if WebKit/mobile projects are installed in CI).
2. **Lint/format do not block your merge policy** — `npm run lint` (no errors); `npm run format:check` passes on touched paths (or team agrees to a formatting PR).
3. **Human QA pass** — [QA_FEATURE_TEST_WORKFLOW.md](./QA_FEATURE_TEST_WORKFLOW.md) on **production** URL ([HOW_WE_SHIP.md](./HOW_WE_SHIP.md)), not only localhost: auth, workspace switch, menu path, shift log, checklist, teammate add ([PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md)).
4. **Workspace trust** — No known **wrong-`projectId`** writes on high-traffic surfaces; track remaining work in [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) **E2** (audit note + fixes).
5. **Pilot bar** — [PILOT_ACCEPTANCE_CRITERIA_WEB.md](./PILOT_ACCEPTANCE_CRITERIA_WEB.md) explicitly reviewed; gaps are **documented**, not hidden.

---

## Suggested build order (functionality first)

| Order | Focus | Doc / command |
|-------|--------|----------------|
| 1 | **Stability & smoke** | `npm run test:chromium`, extend tests as you fix bugs |
| 2 | **E2 multi-workspace** | Audit writers → fix; update [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md) if patterns change |
| 3 | **E3 costing / vendors** (ICP) | Close remaining slices in [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) for *your* pilot promise |
| 4 | **E5 authenticated E2E** (optional but high) | One Playwright path with test credentials (secrets in CI) |
| 5 | **Lane A** | [PHASE_2_3_EXECUTION.md](./PHASE_2_3_EXECUTION.md) — AAB, TestFlight, listings |

---

## Relation to other docs

- **Company gameplan:** [COMPANY_LAUNCH_GAMEPLAN.md](./COMPANY_LAUNCH_GAMEPLAN.md) — treat this file as the **quality gate** before widening distribution.
- **Operator paths:** [USER_WORKFLOW_GUIDE.md](./USER_WORKFLOW_GUIDE.md).

---

## Revision history

| Date | Change |
|------|--------|
| 2026-05-11 | Initial gate doc — functionality before Lane A / store. |
