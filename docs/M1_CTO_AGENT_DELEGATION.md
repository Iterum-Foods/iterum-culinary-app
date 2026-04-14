# M1 — CTO / Eng agent delegation (E1 + E2a–b)

**Use when:** Starting a **CTO-shaped** Cursor Agent thread for **milestone M1** after [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md).  
**Persona baseline:** [LEADERSHIP_ROLE_ASSIGNMENTS.md](../LEADERSHIP_ROLE_ASSIGNMENTS.md#cto-agent) (`@iterum-persona-cto`).  
**Human verification:** [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md) on **Vercel prod** when E1a is ready.  
**Last updated:** 14 April 2026  

---

## Delegation prompt (copy everything below the line)

---

You are executing **Milestone M1** from [docs/P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md):

- **E1** — Team access & roles (Phase B): **E1a**, **E1b**, **E1c**  
- **E2** — Multi-workspace correctness: **E2a**, **E2b** only (**not** E2c in M1 unless quick win)

You act as **CTO + hands-on Eng**. **CEO/COO** own pilot comms; you own **rules, indexes, client paths, CI**, and **honest status** in [docs/M1_PROJECTID_AUDIT.md](./M1_PROJECTID_AUDIT.md).

### 1) E1a — Admin / teammate path (production-safe)

**Goal:** Owner / `account_admin` can add a member via [public/project-hub.html](../public/project-hub.html); line user sees workspace on [public/mobile-compliance.html](../public/mobile-compliance.html) per [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md).

**Do:**

1. Read `firestore.rules` — `projects/{id}/members/{memberId}`, `canAccessProjectDoc`, `account_admin`, `employee_line`. Confirm **memberId** aligns with Firebase Auth **uid** where rules expect it ([ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md)).  
2. Trace [public/assets/js/project-hub-team.js](../public/assets/js/project-hub-team.js) + `project-hub.html` → Firestore writes for `projects/{projectId}/members/{uid}`. Fix mismatches (field names, `authUid`, index errors).  
3. After any **rules** or **indexes** change: run **Ship & verify** in [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md); green **Deploy Firebase** on `main`.  
4. Document gaps for COO: exact steps if something still requires Console.

**Done when:** Human checklist steps **1–8** can pass on Vercel prod (or you file a **minimal** repro + fix PR).

### 2) E1b — `employee_line` (or agreed line role) rules

**Goal:** Line role can do **only** what policy allows; no accidental write to menus/recipes/vendor masters if policy is read-only.

**Do:**

1. Compare [firestore.rules](../firestore.rules) to [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md).  
2. Spot-check with **two** test accounts (admin vs line) on **menus**, **snapshots**, **checklists** paths.  
3. Update **ROLES_AND_PERMISSIONS** if behavior changes.

**Done when:** Documented matrix matches rules; no unexplained `permission-denied` on intended line paths.

### 3) E1c — Ops doc for “add teammate”

**Goal:** Single place for support / COO (UID path until email invite exists).

**Do:**

1. Keep [ADD_TEAMMATE_UID_PATH.md](./ADD_TEAMMATE_UID_PATH.md) accurate if project-hub DOM ids or flows change.  
2. It is already linked from [SUPPORT_PLAYBOOK_PILOT.md](./SUPPORT_PLAYBOOK_PILOT.md).

**Done when:** COO can follow without asking Eng for the click path; any drift fixed same sprint as UI change.

### 4) E2a — `projectId` source-of-truth audit

**Goal:** No silent wrong workspace on high-traffic surfaces.

**Do:**

1. Extend [docs/M1_PROJECTID_AUDIT.md](./M1_PROJECTID_AUDIT.md): for each listed module, mark **source** (`unified-project-selector`, `project-management-system`, `localStorage` key, etc.), **risk**, **fix** (PR link or “OK”).  
2. Prioritize: `menuManager.js`, `dashboard-core.js`, `firestore-sync.js`, `universal-recipe-manager.js`, `menu-recipe-integration.js`, mobile compliance **project picker**, any page that **writes** `projects/{projectId}/...`.  
3. Fix **P0** cross-workspace bugs you find (minimal diffs).

**Done when:** Audit table complete + P0s closed or ticketed with owner.

### 5) E2b — Switcher UX (obvious current workspace)

**Goal:** User always knows which workspace they are in; selection survives refresh.

**Do:**

1. Audit header / [unified-project-selector.js](../public/assets/js/unified-project-selector.js) + pages that **don’t** show current project.  
2. Add consistent **label** or **badge** (match existing design tokens in `public/assets/css/`).  
3. Confirm `localStorage` key alignment with [state-persistence-manager.js](../public/assets/js/state-persistence-manager.js) / `project-management-system.js` — one **primary** write path for “current project” if possible without big refactor.

**Done when:** COO can demo **two** workspaces in **5 minutes** on prod ([P1 epic E2b bar](./P1_EPIC_BREAKDOWN.md)).

### Operating rules

- **Minimal diffs**; match existing patterns; no E3 `vendor_catalog` in M1 unless trivially blocked.  
- **No secrets** in docs or commits.  
- End with a **5-line handoff**: what merged, what’s blocked, what COO should re-test, next PR focus.

### References

- [HOW_WE_SHIP.md](./HOW_WE_SHIP.md) · [DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md) · [project-data-access.js](../public/assets/js/project-data-access.js)  

---

## After M1

- **E2c** + **E3** — next milestone per [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) (catalog + costing).  
- **E5** — authenticated E2E can start **parallel** if another thread has capacity.
