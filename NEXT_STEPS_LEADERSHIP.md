# Leadership next steps & meeting agenda

**Purpose:** One page for CEO + CTO (and ops sponsor) to run a short sync and lock the sequence for the next month.  
**Companions:** [CEO_BRIEF_CURRENT_STATE_AND_PRIORITIES.md](./CEO_BRIEF_CURRENT_STATE_AND_PRIORITIES.md) · [EXEC_CHECKLIST_AND_NEXT_STEPS.md](./EXEC_CHECKLIST_AND_NEXT_STEPS.md) · [LEADERSHIP_ROLE_ASSIGNMENTS.md](./LEADERSHIP_ROLE_ASSIGNMENTS.md) · [TEAM_ACTION_PLAN.md](./TEAM_ACTION_PLAN.md) (team tasks & `@` tags)  
**Suggested cadence:** 30 minutes weekly until P0 sign-off; then biweekly through P1 framing.

---

## Meeting goals (use as agenda)

1. **Close P0 deploy:** Firestore + Storage rules live in production; smoke tests pass; exec sign-off recorded (see checklist P0 table).  
2. **Unblock data contract:** Confirm no reliance on unsafe patterns (e.g. listing all projects); extend `project-data-access` pattern or document exceptions.  
3. **Lock commercial focus:** ICP for the next 90 days (multi-unit vs single venue vs consultant) so “restaurant vs project” and onboarding match reality.  
4. **Queue P1 without scope creep:** Acceptance criteria for “one manager, multiple restaurants, shared vendors, comparable pricing” before engineering estimates.

---

## Decisions to record (fill in)

| Decision | Owner | Target date | Outcome (one line) |
|----------|-------|-------------|-------------------|
| P0: Rules deployed + spot-check OK | COO (process) · CEO (approval) — see role doc | | |
| ICP for next 90 days | COO (facilitate) · CEO (decide) | | |
| Source of truth per entity (local vs cloud emphasis) | CTO + PM (or COO if interim PM) | | |

---

## 30-day sequence (from engineering checklist)

| When | Focus | Done means |
|------|--------|------------|
| **Week 1** | Deploy rules; prod smoke (sign-in, menu sync, photos); exec sign-off on P0 | Checklist P0 security rows closed |
| **Week 2–3** | Data-access pattern to checklists *or* recipe snapshots; one-pager on source of truth | Fewer forked sync paths; documented contract |
| **Week 4** | Lock ICP + acceptance criteria; P1 epic queued | Product can brief eng with testable criteria |

---

## Quarter success (from CEO brief)

- Storage/Firestore **documented**; rules **verified** on production paths.  
- **One** canonical save pattern for core entities (migration can be incremental).  
- Criteria met for **one manager, multiple restaurants, shared vendors, price comparison** (definition owned by Product).  
- **Basic automated tests** on the main dev workflow (lint + smoke E2E baseline; expand auth path when ready).

---

## Prep (5 minutes before the meeting)

- Open [EXEC_CHECKLIST_AND_NEXT_STEPS.md](./EXEC_CHECKLIST_AND_NEXT_STEPS.md) and scan `[~]` / `[ ]` rows.  
- If deploy is pending: confirm who runs `firebase deploy` and who runs the smoke script or manual checklist.  
- Note any customer pilot dates that would force Week 1 completion.

---

## One-line executive priority

**Ship and verify security rules first; keep the data-access foundation unblocked—multi-site and purchasing features land faster on a hardened base.**

---

*Update the decision table and re-use this doc as the standing agenda until P1 epic is approved.*
