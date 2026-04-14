# App completion plan (pilot → sustainable launch)

**Purpose:** Single phased roadmap to **finish** the Iterum Culinary web app for operator pilots and a defensible production posture—not a feature wishlist.  
**Living trackers:** [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) · [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) (post–ICP engineering) · [CEO_TEAM_TASK_LIST_TO_MARKET.md](./CEO_TEAM_TASK_LIST_TO_MARKET.md) · [CEO_BRIEF_CURRENT_STATE_AND_PRIORITIES.md](../CEO_BRIEF_CURRENT_STATE_AND_PRIORITIES.md) · [NEXT_STEPS_LEADERSHIP.md](../NEXT_STEPS_LEADERSHIP.md)  
**Roles & data:** [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md) · [DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md) · [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md) · [HOW_WE_SHIP.md](./HOW_WE_SHIP.md)  
**Last updated:** 14 April 2026  

---

## What “complete” means (for this plan)

| Tier | Definition |
|------|-------------|
| **Pilot-ready** | Trusted auth, Vercel prod URL, Firestore/Storage rules deployed, **A1 smoke GO**, exec P0 sign-off, one clear **source-of-truth** doc for core entities, **team access** without Console-only hacks. |
| **Scale-ready** | Authenticated E2E on a critical path, stricter **role-based** rules (e.g. line staff vs admin), invite/onboarding documented, single **how we ship** runbook. |

“Complete” does **not** mean every module is rewritten; it means **trust, tenancy, and ship discipline** are in place.

---

## Phase A — Close P0 (closed 2026-03-29)

**Goal:** Evidence that production is safe to put operators on. **Status:** Criteria met — see [EXEC_CHECKLIST](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) Leadership log and **Ship & verify** block.

| # | Task | Done when | Owner |
|---|------|-----------|--------|
| A1 | **Deploy Firebase** CI green after each `firestore.rules` / `storage.rules` change | Latest run success on `main` | Eng |
| A2 | **Vercel smoke** | [A1 smoke record](./A1_P0_PROD_SMOKE_RECORD.md) → **GO** on `https://iterum-culinary-app.vercel.app/` | Ops / COO |
| A3 | **Executive sign-off** | Checklist row closed in [EXEC_CHECKLIST](../EXEC_CHECKLIST_AND_NEXT_STEPS.md) | COO → CEO |
| A4 | **Optional:** verify `projects/{id}/members/{uid}` after owner sync | Console or client confirms `account_admin` bootstrap | Eng |

*Blockers:* missing `FIREBASE_TOKEN`, broken CI, or auth regressions → fix before Phase B.

---

## Phase B — Team access without Console (next)

**ICP:** Locked **2026-04-14** — [ICP_DECISION_RECORD.md](./ICP_DECISION_RECORD.md) (multi-unit 2–8 primary; consultant secondary). P1 build priorities follow that segment.

**Goal:** Same restaurant (`projectId`), same login story; admins can add people without Firebase Console.

| # | Task | Done when | Owner |
|---|------|-----------|--------|
| B1 | **Invite or admin UI** | Owner / `account_admin` can assign `role` to another user (by UID initially; email invite = stretch) | Eng + Product sketch |
| B2 | **Rules: `employee_line`** | Writes limited to compliance/checklist paths; menus/recipes/vendor data read or no-write per decision | Eng |
| B3 | **Docs** | One short “how to add a teammate” in [FIREBASE_SETUP_VERIFICATION.md](../FIREBASE_SETUP_VERIFICATION.md) or ops note | Eng |

*Depends on:* Phase A rules live in prod.

---

## Phase C — Data contract (unblocks “complete product” narrative)

**Goal:** One agreed story for **local vs cloud** so features stop forking.

| # | Task | Done when | Owner |
|---|------|-----------|--------|
| C1 | **Source-of-truth one-pager** | Recipes, menus, vendors, checklists: which is canonical on device vs server; linked from exec checklist | CTO + PM/COO |
| C2 | **Route one more entity** through shared pattern | e.g. checklists **or** recipe snapshot via `project-data-access` (checklist row in EXEC_CHECKLIST) | Eng |
| C3 | **P1 framing** | ICP + acceptance criteria for multi-restaurant / shared vendors (checklist P1 rows) | COO / CEO — **done**; epics in [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) |

---

## Phase D — Quality & operations (parallel where possible)

**Goal:** Regressions caught in CI; anyone can ship.

| # | Task | Done when | Owner |
|---|------|-----------|--------|
| D1 | **Authenticated E2E** | One path (e.g. sign-in → dashboard or menu) in Playwright with secrets/env documented | Eng |
| D2 | **Single ship runbook** | Vercel = app; Firebase = rules + backend; link PR → deploy → smoke | Eng / Ops |
| D3 | **Dependency / lint CI** | `main` stays green; re-run policy documented | Eng |

---

## Mobile acquisition — line log (MVP)

**Web:** `/mobile-compliance.html` (installable via `manifest-compliance.json`).  
**Store apps (native shell):** **Capacitor** — `android/` and `ios/` at repo root.

| Task | Where |
|------|--------|
| Config | Root `capacitor.config.json` — **`server.url`** points the WebView at production `…/mobile-compliance.html` so most web fixes ship without a store resubmit. To bundle offline assets instead, remove `server` and set the WebView entry (see Capacitor docs). |
| Sync after changing `public/` or config | `npm run cap:sync` |
| Android | Open the **`android/`** folder in Android Studio (see `android/README.md`). `npm run cap:sync` from repo root after web changes. Gradle uses **JDK 21** via `android/gradle.properties` (`org.gradle.java.home` → Android Studio **jbr**). |
| iOS (requires Mac) | `cd ios/App && pod install` then `npm run cap:open:ios` → Xcode → **Archive** for App Store Connect. |

**Purpose:** Free **fridge temperature** + **sanitizer (ppm)** logging; same Firestore paths as the dashboard so **Dashboard** / **Calendar** stay in sync.  
**Next:** Store listings (screenshots, privacy policy URL), optional sanitizer bands per chemistry, ATS / Play data-safety disclosures.

---

## Suggested sequencing (8-week view)

| Weeks | Focus |
|-------|--------|
| **1–2** | Phase A complete; start B1 scaffolding |
| **3–4** | B2 rules + B1 usable path; C1 draft |
| **5–6** | C2 + D1 spike; C3 workshop |
| **7–8** | D2 runbook; pilot customer prep per CEO brief |

Adjust dates on the **exec checklist** “Next 30 days” section when leadership locks cadence.

---

## Review rhythm

- **Weekly:** Leadership sync ([NEXT_STEPS_LEADERSHIP](../NEXT_STEPS_LEADERSHIP.md)) — pull Phase A–D status from this doc and EXEC_CHECKLIST.  
- **Per deploy:** **Ship & verify** block in EXEC_CHECKLIST.  
- **Monthly:** Re-read Phase definitions; move tasks only when “Done when” is met.

---

## Change log

| Date | Change |
|------|--------|
| 2026-03-29 | Initial plan: Phases A–D, pilot vs scale-ready definitions, links to existing trackers. |
| 2026-03-29 | Mobile line log page + PWA manifest; same Firestore paths as dashboard compliance cards. |
| 2026-03-29 | Capacitor `android/` + `ios/` for Play Store / App Store (WebView → production line log URL). |
| 2026-04-14 | [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md): E1–E5 sized; `vendor_catalog` sketch; **M1** = E1 + E2a–b. |
