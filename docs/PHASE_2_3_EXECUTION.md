# Phase 2 & 3 execution guide

**Purpose:** Operational checklist to **finish store-ready mobile (Phase 2)** and **first-wave go-to-market (Phase 3)**. Parent tracker: [CEO_TEAM_TASK_LIST_TO_MARKET.md](./CEO_TEAM_TASK_LIST_TO_MARKET.md).  
**Prerequisite:** [FUNCTIONAL_READINESS_GATE.md](./FUNCTIONAL_READINESS_GATE.md) — confirm core flows on production before treating store submission as the priority.  
**Last updated:** 2026-05-09

**Quick links**

| Resource | URL / path |
|----------|------------|
| Pilot web app (canonical) | `https://iterum-culinary-app.vercel.app/` ([HOW_WE_SHIP](./HOW_WE_SHIP.md)) |
| **Privacy policy** (stores + in-app) | `https://iterum-culinary-app.vercel.app/privacy.html` — source: [privacy.html](../public/privacy.html) |
| Android build / RC | [android/README.md](../android/README.md) |
| Brand + store copy bank | [MOBILE_APP_STORE_BRAND_PACKET.md](./MOBILE_APP_STORE_BRAND_PACKET.md) |
| Ship discipline | [HOW_WE_SHIP.md](./HOW_WE_SHIP.md) |
| Local + ICP gameplan | [COMPANY_LAUNCH_GAMEPLAN.md](./COMPANY_LAUNCH_GAMEPLAN.md) |

---

## Phase 2 — Phone app (store-ready)

Complete rows in [CEO_TEAM_TASK_LIST_TO_MARKET.md](./CEO_TEAM_TASK_LIST_TO_MARKET.md) Phase 2 as you check these off.

### P2.1 Engineering — Android release candidate

- [ ] From repo root: `npm install` → `npm run cap:sync`.
- [ ] Open `android/` in Android Studio; Gradle sync succeeds ([android/README.md](../android/README.md)).
- [ ] **Release signing:** `android/app/keystore.properties` + keystore file present locally (never commit secrets; see [.gitignore](../.gitignore)).
- [ ] Build **signed AAB**: **Build → Generate Signed App Bundle** (or `bundleRelease` with signing configured).
- [ ] Install release build on a physical device; confirm loads production `server.url` from [capacitor.config.json](../capacitor.config.json) (`mobile-compliance.html`).
- [ ] Smoke: sign-in, project picker, one checklist or temp log path, sign-out.
- [ ] **Versioning:** Before **each** Play upload, bump `versionCode` + `versionName` in `android/app/build.gradle` and note in commit message ([HOW_WE_SHIP](./HOW_WE_SHIP.md#mobile-store-versioning)).

**Owner:** Eng + CTO sign-off on binary.

### P2.2 Engineering — iOS release candidate

- [ ] Mac: `npm run cap:sync` → `cd ios/App && pod install` (if Pod workflow applies).
- [ ] Xcode: open workspace, select **Any iOS Device**, **Archive**.
- [ ] Upload to **TestFlight** (internal testing first).
- [ ] Same smoke as Android on device.
- [ ] Bump `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` in `ios/App/App.xcodeproj/project.pbxproj` before each App Store upload.

**Owner:** Eng (Mac).

### P2.3 Store assets (Marketing + Eng)

- [ ] **Icons:** Already in `android/.../mipmap-*` and iOS `AppIcon.appiconset` after last brand pass; re-export if store requires specific safe zone.
- [ ] **Screenshots:** Phone (required sizes per Play / App Store Connect). Capture against **production** URL where possible.
- [ ] **Short description + full description:** Use [MOBILE_APP_STORE_BRAND_PACKET.md](./MOBILE_APP_STORE_BRAND_PACKET.md); align with actual shell (Capacitor loads shift web UI).
- [ ] **Privacy policy URL:** `https://iterum-culinary-app.vercel.app/privacy.html` — update [public/privacy.html](../public/privacy.html) **support contact** before external marketing.
- [ ] **Support URL or email:** Same page + Play/App Store “Contact” fields; must match [SUPPORT_PLAYBOOK_PILOT.md](./SUPPORT_PLAYBOOK_PILOT.md) reality.

### P2.4 Listings + data safety (Ops / COO + Eng)

**Google Play — Data safety**

Declare categories that match the app (adjust after legal review):

| Data type | Typical handling for this codebase |
|-----------|--------------------------------------|
| Email, name (account) | Collected (Firebase Auth); used for account; stored in Firebase |
| Operational data (checklists, temps, prep lists, etc.) | Collected if user submits; stored in Firestore per project rules |
| Device / diagnostics | Minimal; Play may ask about crash data if you add a crash SDK later |

- [ ] Complete Play **Data safety** questionnaire honestly.
- [ ] **Privacy policy** link: `…/privacy.html`.

**Apple — App Privacy**

- [ ] In App Store Connect, **App Privacy** labels aligned with Firebase (account info, user content, etc.).
- [ ] Privacy policy URL same as above.

**Owner:** COO or Ops with Eng for technical accuracy.

### P2.5 Version discipline

| Platform | Where to bump |
|----------|----------------|
| Android | `android/app/build.gradle` — `versionCode`, `versionName` |
| iOS | `ios/App/App.xcodeproj/project.pbxproj` — `CURRENT_PROJECT_VERSION`, `MARKETING_VERSION` |

---

## Phase 3 — Go-to-market (first wave)

### P3.1 Pilot shortlist (3–10 targets)

- [ ] Use [ICP_DECISION_RECORD.md](./ICP_DECISION_RECORD.md) for **formal** ICP; use [COMPANY_LAUNCH_GAMEPLAN.md](./COMPANY_LAUNCH_GAMEPLAN.md) §2 for **local chef** cohort.
- [ ] Table (copy to Notion/Sheet):

| Name / venue | Contact | ICP fit (Y/N) | Design-partner OK | Target start week |
|----------------|---------|---------------|---------------------|-------------------|
| | | | | |

### P3.2 Offer (CEO + Marketing)

- [ ] One paragraph **offer**: e.g. founding partner window, free line log + full web path, what you will set up personally.
- [ ] **Landing truth check:** [public/index.html](../public/index.html) and mobile entry do **not** promise POS, SSO, or email invites unless shipped ([ICP non-goals](./ICP_DECISION_RECORD.md)).

### P3.3 Launch comms (Marketing)

- [ ] Dated post / email / social when **web** is ready; add **store links** only after Phase 2 submit + approval (or “Join TestFlight” link if using TF-only beta).

### P3.4 Pilot feedback loop (COO)

- [ ] Weekly 15–30 min with each active pilot; log **top 3 papercuts** and **keep score** (see [COMPANY_LAUNCH_GAMEPLAN](./COMPANY_LAUNCH_GAMEPLAN.md) §2.4–2.5).
- [ ] Single backlog column or doc for “Pilot asks” → triage with CTO/Eng.

**Weekly check-in prompts (copy/paste)**

1. What felt slower than your old way (paper, text, other app)?
2. What did staff skip or avoid?
3. What would make Iterum indispensable next week?
4. If we removed one feature, what must never be removed?

### P3.5 Stretch — email invite (CTO + Eng)

- [ ] Defer until Phase 2 stable and pilots are not blocked on UID path ([ADD_TEAMMATE_UID_PATH.md](./ADD_TEAMMATE_UID_PATH.md)).
- [ ] When built: Cloud Function + Firebase Admin SDK; update [USER_WORKFLOW_GUIDE.md](./USER_WORKFLOW_GUIDE.md) and support playbook.

---

## Definition of done (summary)

| Phase | Done when |
|-------|-----------|
| **2** | Signed **AAB** + **TestFlight** (or internal) smoke OK; listings **submitted** with accurate data safety + **privacy.html** live; versions bumped. |
| **3** | Named shortlist + live offer + comms plan + weekly feedback loop running; optional stretch scoped. |

---

## Revision history

| Date | Change |
|------|--------|
| 2026-05-09 | Initial Phase 2–3 execution guide, privacy URL, versioning table. |
