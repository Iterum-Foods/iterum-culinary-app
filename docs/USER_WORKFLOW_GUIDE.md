# User and operator workflow guide

**Purpose:** One place to orient **new restaurants**, **new users at existing restaurants**, and **any role** around the right screens and deep docs.  
**Last updated:** 2026-05-09

**Store listings:** privacy policy for pilots and app stores: `https://iterum-culinary-app.vercel.app/privacy.html` ([public/privacy.html](../public/privacy.html)).

**Related:** [GOLDEN_PATH_AUDIT.md](./GOLDEN_PATH_AUDIT.md) (file map), [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md), [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md), [WEB_APP_DESIGN_CHANGE_WORKFLOW.md](./WEB_APP_DESIGN_CHANGE_WORKFLOW.md) (rolling UI changes across all web pages).

---

## How to use this document

| If you are… | Start with section… |
|-------------|---------------------|
| Opening a **new** account for a **new** venue or brand | [A — Greenfield](#a-greenfield-new-account-new-restaurant-or-group) |
| Restaurant already runs day-to-day; you are the **first** Iterum user | [B — First operator on Iterum](#b-first-operator-on-iterum-existing-restaurant-new-to-the-app) |
| You were **added** to a project (employee or new manager) | [C — Joining an existing workspace](#c-joining-an-existing-workspace-new-user-existing-restaurant) |
| You have a **specific job** (menu, vendors, shift, team) | [D — Workflows by task](#d-workflows-by-task) |
| You are validating a build | [QA_FEATURE_TEST_WORKFLOW.md](./QA_FEATURE_TEST_WORKFLOW.md) |
| You are rolling out **FOH + BOH** staff on phones and web | [RESTAURANT_FOH_BOH_READINESS.md](./RESTAURANT_FOH_BOH_READINESS.md) |

---

## A) Greenfield: new account + new restaurant (or group)

**Goal:** One owner or admin account, a **project** (workspace) that matches how you think about the kitchen, and enough structure to cost and serve.

1. **Account** — Sign up / sign in (`signin.html` or your deployed entry). Web and mobile use the same Firebase identity; pick one place to create the account, then sign in elsewhere with the same credentials.
2. **Workspace questionnaire** — `setup.html`: organization scope (single vs group), **role** (drives dashboard emphasis), optional **default project** and **seed job templates** for projects. Submit (or skip only if you understand you can return via **Account → Workspace setup**).
3. **Project** — If you did not create a named workspace during setup, open **`project-hub.html`**: add or rename projects so each cost center / venue you care about has a **project**. Select the active project in the **left sidebar** project control when you work.
4. **First ten minutes (costing path)** — From `setup.html` copy block (also reflected here):
   - **`dashboard.html`** — home for ops cards, opening checklist entry points, team prep visibility (when enabled).
   - **`vendor-management.html`** — vendors + **workspace price overrides** where you buy differently than list price.
   - **`ingredients.html`** — align ingredient names with how you purchase; add spec links when you have them.
   - **`recipe-library.html`** / **`recipe-developer.html`** — build or import recipes so menus have something to attach to.
5. **Menu** — Build in **`menu-builder.html`** or import from spreadsheet: [MENU_IMPORT_WORKFLOW.md](./MENU_IMPORT_WORKFLOW.md) and one-pager [MENU_IMPORT_STAFF_QUICK_CARD.md](./MENU_IMPORT_STAFF_QUICK_CARD.md).
6. **Team (when ready)** — [ADD_TEAMMATE_UID_PATH.md](./ADD_TEAMMATE_UID_PATH.md) and [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md). Managers can use **Project hub → Invite helper** to copy instructions for staff (including UID reply format).

**Multi-site / group:** `restaurant-group-onboarding.html` (also under **More tools** in the sidebar) plus separate **projects** per site if you need isolated menus or costing.

---

## B) First operator on Iterum: existing restaurant, new to the app

Same backbone as [A](#a-greenfield-new-account-new-restaurant-or-group), with these priorities:

1. **Pick one pilot project** — Name it like the real kitchen (not “test”) so imports and overrides stay sane.
2. **Data you already have** — Prefer **menu import** early if the spreadsheet is ready; otherwise stub a short menu and fix vendors/ingredients before you promise accurate plate cost.
3. **Single source of truth for prices** — Enter vendors and **price overrides** before you tune recipe costs; see GOLDEN_PATH vendor slice.
4. **Rollout order** — Owner/admin completes A1–A5, then adds line users (section C) once **project** and **role** assignments are correct.

---

## C) Joining an existing workspace: new user, existing restaurant

**Goal:** See the right **project** in the picker and avoid permission surprises.

1. **Account** — Create Firebase account / sign in (`signin.html`).
2. **Membership** — An **account_admin** or owner adds you in **`project-hub.html`** (UID path today): [ADD_TEAMMATE_UID_PATH.md](./ADD_TEAMMATE_UID_PATH.md). Staff sends **UID** from **`mobile-compliance.html`** (Copy my user ID) or profile where exposed.
3. **Refresh** — Reload app after admin saves membership.
4. **Select project** — Sidebar **project** control: choose the venue you work at.
5. **First screen by role (typical)**  
   - **Line / crew** — `mobile-compliance.html`: workspace (“Where are you working today?”), **Today** panel, temps/sanitizer, prep checklist, opening rhythm as configured.  
   - **Chef / lead / GM** — `dashboard.html` + `project-hub.html` + menu/recipe pages per your rollout.  
   - **Purchasing** — `vendor-management.html`, `ingredients.html`, **Spec library** (`spec-library.html` via **More tools**).

If a project does not appear, re-check UID paste and Firestore rules per the teammate checklist.

---

## D) Workflows by task

Use **Main** and **More tools** in the left sidebar; **Account** (footer) is profile, workspace setup, sign-out only.

| Task | Primary pages | Notes / deep doc |
|------|----------------|------------------|
| **New menu or major menu update** | `menu-builder.html` | [MENU_IMPORT_WORKFLOW.md](./MENU_IMPORT_WORKFLOW.md), staff [MENU_IMPORT_STAFF_QUICK_CARD.md](./MENU_IMPORT_STAFF_QUICK_CARD.md) |
| **New recipes / R&D** | `recipe-developer.html`, `recipe-library.html`, `recipe-canvas.html` | Publish or save so library and mobile snapshot flows can see them (see SOURCE_OF_TRUTH for snapshot paths). |
| **Plate cost / purchasing** | `vendor-management.html`, `ingredients.html`, `menu-builder.html` | Overrides: `vendor-price-overrides` pattern in [GOLDEN_PATH_AUDIT.md](./GOLDEN_PATH_AUDIT.md). |
| **Specs & product documentation** | `spec-library.html`, `ingredients.html`, vendor products | Spec URLs/notes on ingredients and vendor lines; library aggregates. |
| **Daily opening / compliance** | `dashboard.html` (opening checklist, ops exceptions) | Corrective actions from failed checks when configured. |
| **Line shift logging** | `mobile-compliance.html` | Temps, sanitizer, prep list checklist, Today panel; [QA_FEATURE_TEST_WORKFLOW.md](./QA_FEATURE_TEST_WORKFLOW.md) §2–3. |
| **Manager view of prep lists** | `dashboard.html` (team prep board) | Requires project + sync; see QA workflow. |
| **Add or change team access** | `project-hub.html` | [ADD_TEAMMATE_UID_PATH.md](./ADD_TEAMMATE_UID_PATH.md), invite helper on same page. |
| **Imports (bulk)** | **More tools → Import** | Bulk recipe / ingredient pages. |
| **Backups / exports** | **More tools →** `data-backup-center.html` | Before large experiments or group rollouts. |
| **New location in a group** | `restaurant-group-onboarding.html`, `project-hub.html` | New **project** per site when you need separation. |

---

## E) Pilot and release validation

For scripted **pass/fail** checks across web + mobile surfaces, use **[QA_FEATURE_TEST_WORKFLOW.md](./QA_FEATURE_TEST_WORKFLOW.md)** after code changes or before a pilot milestone.

---

## F) Terminology (operator-facing)

- **Project** — The workspace boundary in the app (menus, checklists, shared team data). ICP allows calling this “workspace” in copy; `projectId` is the technical id ([ICP_DECISION_RECORD.md](./ICP_DECISION_RECORD.md)).
- **Account** — Your login; can be a member of multiple projects.
- **More tools** — Secondary nav: imports, spec library, equipment, backups, admin shortcuts.

---

## Revision notes

When flows change (e.g., email invites, automated provisioning), update **this file** and the linked task-specific docs so onboarding stays single-source.
