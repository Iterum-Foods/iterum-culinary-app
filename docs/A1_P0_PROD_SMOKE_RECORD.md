# A1 — Production smoke record (P0)

**Stream:** A / A1 (close P0 — trust) · See [TEAM_ACTION_PLAN.md](../TEAM_ACTION_PLAN.md)  
**Purpose:** Human-run browser smoke after rules/deploy; fill every cell before executive sign-off.  
**One page:** Print or PDF; keep Notes short (exact error text if fail).  
**Status:** If smoke tables below are still empty, **run the test** and complete **Result → GO/NO-GO** before A3 in `EXEC_CHECKLIST_AND_NEXT_STEPS.md`.

---

## Run metadata (fill before steps)

| Field | Value |
|--------|--------|
| **Environment URL** | **Primary:** https://iterum-culinary-app.vercel.app/ _(Firebase mirror if used: https://iterum-culinary-app2.web.app)_ |
| **Entry path tested** | _e.g. `/` `/signin.html` `/dashboard.html`_ |
| **Browser + version** | |
| **Rules / deploy reference** | _e.g. commit SHA, deploy ticket #, date/time of `firebase deploy`_ |
| **Test account** | _identifier only; no passwords in this doc_ |

---

## Smoke steps

| Step | Expected | Pass/Fail | Notes | Date | Tester |
|------|----------|-----------|-------|------|--------|
| **1. Load** | Customer-facing entry loads without a **generic** site-wide 404 (the page you use for pilots/marketing). | | | | |
| **2. Sign-in** | Real test account authenticates successfully; **session persists** after **one** full browser refresh (still signed in). | | | | |
| **3. Menu / project data** | Main operator surface opens (e.g. **dashboard** or **menu builder**). Data appears **or** empty state is **coherent** (clear UX, no dead end). **No** persistent “permission denied,” broken auth loop, or stuck sync spinner—if any appear, capture **exact** message here. | | | | |
| **4. Recipe photo** | **Either** upload a small image on a recipe **or** open a recipe that already has a photo—**image renders** in UI. _(Failure often indicates Storage rules or path mismatch.)_ | | | | |
| **5. Team access (optional)** | If testing **company membership:** a second account with `projects/{projectId}/members/{uid}` in Firestore (valid `role`) opens **dashboard** and project-backed flows **without** persistent “permission denied.” Skip if not in scope for this run. | | | | |

---

## Result

| Overall | _GO / NO-GO_ |
|---------|--------------|
| **Blockers** (if NO-GO) | |
| **Linked triage** (if NO-GO) | _e.g. CTO thread, ticket # — paste steps + screenshot path_ |

---

**Sign-off (optional):** Tester initials on print __________ · Purpose complete when A1 row marked done in TEAM_ACTION_PLAN and EXEC_CHECKLIST.
