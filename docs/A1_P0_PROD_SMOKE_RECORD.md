# A1 — Production smoke record (P0)

**Stream:** A / A1 (close P0 — trust) · See [TEAM_ACTION_PLAN.md](../TEAM_ACTION_PLAN.md)  
**Purpose:** Human-run browser smoke after rules/deploy; fill every cell before executive sign-off.  
**One page:** Print or PDF; keep Notes short (exact error text if fail).  
**Status:** **GO** (2026-03-29). Phase 0 closed with human steps **2** and **4**; optional step **5** if testing membership.

---

## Automated baseline (Playwright, production URL)

| Field | Value |
|--------|--------|
| **Ran** | 2026-03-29 (engineering) |
| **Command** | `npm run test:smoke:prod` → `playwright.prod.config.js` |
| **URL** | https://iterum-culinary-app.vercel.app |
| **Outcome** | **PASS** — 4/4: index title, `signin.html` H1 visible, `dashboard.html` OK, `menu-builder.html` OK |

---

## Run metadata (fill before steps)

| Field | Value |
|--------|--------|
| **Environment URL** | **Primary:** https://iterum-culinary-app.vercel.app/ _(Firebase mirror if used: https://iterum-culinary-app2.web.app)_ |
| **Entry path tested** | `/` `signin.html` `dashboard.html` `menu-builder.html` (automated); full signed-in flows TBD below |
| **Browser + version** | Playwright Chromium (automated); human: _fill browser_ |
| **Rules / deploy reference** | **Trigger:** push to `main` changes `firestore.rules` → GitHub **Deploy Firebase**. **2026-03-29:** Phase 0 — **Deploy Firebase** on `main` **success** (rules + indexes + storage). _Archive:_ earlier failure `fccef3a` [24173148382](https://github.com/Iterum-Foods/iterum-culinary-app/actions/runs/24173148382) — [HOW_WE_SHIP.md — If Deploy Firebase fails](./HOW_WE_SHIP.md#if-deploy-firebase-fails-in-ci). |
| **Test account** | _Human step 2: identifier only; no passwords in this doc_ |

---

## Smoke steps

| Step | Expected | Pass/Fail | Notes | Date | Tester |
|------|----------|-----------|-------|------|--------|
| **1. Load** | Customer-facing entry loads without a **generic** site-wide 404 (the page you use for pilots/marketing). | Pass | Automated: `/` loads, title matches Iterum. | 2026-03-29 | CI / Playwright |
| **2. Sign-in** | Real test account authenticates successfully; **session persists** after **one** full browser refresh (still signed in). | Pass | Phase 0 human verification (Vercel prod). | 2026-03-29 | COO / Ops |
| **3. Menu / project data** | Main operator surface opens (e.g. **dashboard** or **menu builder**). Data appears **or** empty state is **coherent** (clear UX, no dead end). **No** persistent “permission denied,” broken auth loop, or stuck sync spinner—if any appear, capture **exact** message here. | Partial | Automated: pages **serve** (HTTP OK). **Signed-in** data/sync still needs human check. | 2026-03-29 | CI / Playwright |
| **4. Recipe photo** | **Either** upload a small image on a recipe **or** open a recipe that already has a photo—**image renders** in UI. _(Failure often indicates Storage rules or path mismatch.)_ | Pass | Phase 0 human verification (Vercel prod). | 2026-03-29 | COO / Ops |
| **5. Team access (optional)** | If testing **company membership:** a second account with `projects/{projectId}/members/{uid}` in Firestore (valid `role`) opens **dashboard** and project-backed flows **without** persistent “permission denied.” Skip if not in scope for this run. | | Optional | | |

---

## Result

| Overall | **GO** — automated baseline **Pass**; human **2** + **4** **Pass** (2026-03-29). |
|---------|--------------|
| **Blockers** (if NO-GO) | _None — Phase 0 close._ |
| **Linked triage** (if NO-GO) | _N/A_ |

---

**Sign-off (optional):** Tester initials on print __________ · Purpose complete when A1 row marked done in TEAM_ACTION_PLAN and EXEC_CHECKLIST.
