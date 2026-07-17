# Phase 1 — Teammate flow verification (COO + Eng)

**Purpose:** Prove **end-to-end** team access on **production (Vercel)** without Firebase Console for the happy path (admin already has owner/`account_admin`).  
**Prod base URL:** `https://iterum-culinary-app.vercel.app` (adjust if your primary URL differs).  
**Related:** [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md) · [SPRINT_PLAN_FOH_BOH_S1_S3.md](./SPRINT_PLAN_FOH_BOH_S1_S3.md) (3-sprint checklist; run `npm run verify:sprints`) · [RESTAURANT_FOH_BOH_READINESS.md](./RESTAURANT_FOH_BOH_READINESS.md) · [project-hub team panel](../public/project-hub.html) · [mobile-compliance.html](../public/mobile-compliance.html) · **M1 COO bundle:** [M1_COO_PROD_VERIFICATION.md](./M1_COO_PROD_VERIFICATION.md) · [WEB_APP_DESIGN_CHANGE_WORKFLOW.md](./WEB_APP_DESIGN_CHANGE_WORKFLOW.md) (if UI chrome changed during the flow)

---

## Automated baseline (COO agent — production)

| Field | Value |
|--------|--------|
| **Command** | `npm run test:smoke:prod` |
| **Last run** | 27 March 2026 — **6/6** passed (index, sign-in, dashboard, menu-builder, mobile-compliance, **project-hub**) |
| **Scope** | Confirms Vercel serves critical paths; **does not** replace human steps below for UID → member → workspace. |

---

## Preconditions

| # | Check |
|---|--------|
| 1 | **Deploy Firebase** CI has succeeded on `main` after latest rules/indexes ([Actions](https://github.com/Iterum-Foods/iterum-culinary-app/actions/workflows/firebase-deploy.yml)). |
| 2 | Admin tester: account that can open **Project hub** and see **Add teammate to a project** after sign-in. |
| 3 | Line tester: **second** Firebase account (new email) for “crew” — no UID shared in this doc. |

---

## Steps (run in order)

| Step | Who | Action | Pass criteria |
|------|-----|--------|----------------|
| 1 | Line tester | Open `{base}/signin.html` → **create account** (or sign in if already exists). | Auth succeeds. |
| 2 | Line tester | Open `{base}/mobile-compliance.html` → sign in → find **Workspace (team project)** dropdown (`#project-picker`) and **Copy my user ID** (`#my-firebase-uid`). | UID visible; copy works. |
| 3 | Line tester | Send **UID only** to admin (secure channel — not in ticket body if policy forbids). | Admin receives UID. |
| 4 | Admin | Open `{base}/project-hub.html#team` → sign in → **Team management** tab. | Team panel visible (`#team-access-panel`, member table). |
| 5 | Admin | Select **Project** (`#team-project-select`) = target workspace. Paste **Firebase User UID** (`#team-target-uid`). Choose **Role** (`#team-member-role`) e.g. Line / crew. Click **Add to project** (`#team-add-member-btn`). | `#team-access-msg` shows success (e.g. saved / they should sign in…). |
| 6 | Line tester | Refresh `mobile-compliance.html` (or sign out/in). Open **Workspace** dropdown. | Expected project **name** or **id** appears (not only “No shared projects yet”). |
| 7 | Line tester | Select that workspace; complete one harmless action (e.g. open a tab, or add a test fridge if policy allows). | No persistent **permission denied**; status line not stuck on Firestore index error. |
| 8 | Admin (optional) | Open `{base}/dashboard.html` → confirm **Workspace** banner / sidebar selector matches the same project (`#workspace-save-indicator-root`). | Same logical `projectId` as chosen in hub. |

---

## If something fails

| Symptom | First check | Escalate to |
|---------|-------------|-------------|
| “No shared projects yet” after save | Admin used wrong UID or wrong project; line user refreshed before Firestore write propagated (wait, retry). | Eng if reproducible after 2 min. |
| “Could not load team projects… indexes” | [Firestore indexes](https://console.firebase.google.com) — collection group **members** / **authUid** per `firestore.indexes.json`. | CTO + Eng ([HOW_WE_SHIP](./HOW_WE_SHIP.md)). |
| “Could not save… owner or account_admin” | Admin role on project; rules deploy. | CTO. |
| Console errors on `project-hub` | Browser devtools → Network/Firestore; capture **non-secret** repro. | Eng. |

---

## Done when

COO + Eng tick **Teammate flow** on [CEO_TEAM_TASK_LIST_TO_MARKET.md](./CEO_TEAM_TASK_LIST_TO_MARKET.md) Phase 1 after **all pass criteria** on **Vercel prod**.
