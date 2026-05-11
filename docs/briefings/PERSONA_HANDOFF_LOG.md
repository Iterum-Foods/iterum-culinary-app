# Persona handoff log — landing + auth entry UX

**Purpose:** Single place for `@iterum-persona-ceo`, `@iterum-persona-cto`, `@iterum-persona-coo`, PM/UX agents to pick up context without re-reading chat history.  
**How to use in Cursor:** `@iterum-persona-cto` (or CEO/COO) plus `@docs/briefings/PERSONA_HANDOFF_LOG.md`.

---

## 2026-05-10 — Crowd Manager (FP-250) daily checklist on phone + calendar (shipped)

**Reference:** Massachusetts Department of Fire Services form **FP-250** "Crowd Manager Fire and Building Safety Checklist" (Rev. 12/24); required per **527 CMR 1.00 §20.1.5.6.4** for nightclub, dancehall, discotheque, or bar.

### Summary

- Added a full digital FP-250 form to the mobile app's **Checks** tab (`mobile-compliance.html` / `mobile-line-employee.js`), kept inside a `<details>` block so it doesn't crowd the station-check form.
- All 13 yes/no inspection items + dated inspection fields (extinguisher, sprinkler, fire alarm, exhaust, suppression).
- Two named-responsibility fields (exit announcement; occupant-load limit), max capacity + certificate expiration, crowd manager name + DFS certificate number.
- **E-signature** = typed full name (must match crowd manager name) + attestation checkbox + automatic submission timestamp recorded in the saved entry.
- Per-day persistence: `localStorage` key `iterum.checks.crowd_manager.{projectId}.{YYYY-MM-DD}` + (when signed in) Firestore `projects/{projectId}/checklists/{entryId}` with `templateId: crowd_manager_fp250`.
- A "FP-250 signed today" banner renders above the form once submitted, with signer, certificate #, signed-at, and a Yes/No status summary.
- **Calendar (`calendar.html`)** day-details now includes a **Crowd Manager (FP-250)** section showing the same entry per day with signer + timestamp + Yes/No counts.
- "Static" answers (cert #, capacity, last-inspection dates, responsible persons) prefill the next day's form from a `prefill` cache so daily completion is fast.

### For CTO / engineering

- Touch points:
  - `public/mobile-compliance.html` — form HTML inside `panel-section-checks`.
  - `public/assets/js/mobile-line-employee.js` — `FP250_ITEM_KEYS`, `renderFp250Radios`, `readFp250Form`, `writeFp250Form`, `renderFp250Banner`, `loadFp250Today`, `submitCrowdManager`; tab handlers (`hub-tab` click + project-picker change) now also fire `loadFp250Today()` when entering Checks.
  - `public/calendar.html` — new `loadCrowdManagerEntries()` (localStorage scan), `updateCrowdManager(date)` renderer, `escapeText()` helper; new day-details section.
- Reused the existing `projects/{pid}/checklists/{entryId}` Firestore path — **no rules change required**. Failures during Firestore write fall back to localStorage-only with a console warning.
- No new global stylesheets (Phase A guard). All UI uses existing `.mc-*` classes from `mobile-shift-brand.css`.
- `npm run format:check` clean; no lint regressions (ReadLints clean on touched files).
- Synced to Android (`android/app/src/main/assets/public/...`) and iOS (`ios/App/App/public/...`) web bundles.

### For COO / QA

- New section **§2.4 Crowd Manager (FP-250) daily checklist** in [`docs/QA_FEATURE_TEST_WORKFLOW.md`](../QA_FEATURE_TEST_WORKFLOW.md) covers happy path, validation guardrails (signature mismatch / missing attestation / missing signature), prefill behavior, and the calendar surfacing.
- No DB rules / auth changes — pilot venues using their existing Iterum Firestore project will see the feature on next sync.
- For MA pilots specifically: print FP-250 export is out of scope for v1; surface this in the pilot kickoff if a venue demands a paper artifact pre-shift.

### For CEO / product

- This is the first **regulator-named compliance artifact** Iterum captures end-to-end on a phone — strong wedge for MA nightclubs/bars, and clean evidence for sales conversations with multi-unit groups whose insurers ask for nightly attestations.
- Demo flow: phone → Checks → expand FP-250 → fill → sign → web `calendar.html` → today → entry visible with timestamp + signer.
- Follow-up tickets to consider: (1) signed PDF export of a day's FP-250, (2) manager-side "assign tomorrow's crowd manager" on dashboard, (3) DFS-form-specific signed-name canvas if a pilot insurer requires drawn signatures.

---

## 2026-05-09 — T1: Vendor + ingredients Phase D polish (shipped)

**Roadmap ref:** [`docs/UI_AND_WORKFLOW_ROADMAP.md`](../UI_AND_WORKFLOW_ROADMAP.md) Phase D items D1, D2, D5, plus C3 cross-link reinforcement.

### Summary

- **`vendor-management.html`** — Replaced the dark navy/purple `vendor-hero` (and its heavy shadow) with a calm light hero aligned to the Iterum green/cream palette; H1 dropped from `2.4rem` to canonical `1.65rem`. Quick cards, stat cards, and bulk-action buttons stripped of emoji and re-toned to match brand. Hero buttons converted to text-only labels.
- **Cross-link** — Added an `iterum-workflow-banner` above the onboarding rail linking to `ingredients.html` (mirrors the existing C3 link from ingredients to vendor overrides).
- **`ingredients.html`** — Removed multicolor inline gradients and emoji from the three primary quick-action buttons; tightened heading copy ("Master ingredient library").
- **Both pages** — Added `data-iterum-breadcrumb` so the unified-nav context bar reads `Purchasing › Vendor management` and `Purchasing › Ingredient library`.
- **No new global CSS files; no behavior changes; no new scripts loaded.**

### For CTO / engineering

- Touch points: `public/vendor-management.html`, `public/ingredients.html` only.
- All inline styling kept inline — no migration to a new stylesheet (Phase A anti-pattern guard).
- Lint: no change to JS, lint untouched. Format: `npm run format:check` clean.
- `unified-nav-header.js` already auto-wraps content in `.main-content-wrapper`, so [`iterum-workflow-polish.css`](../../public/assets/css/iterum-workflow-polish.css) typography rules apply on both pages without further wrapping.
- Risk if reverting: the dark hero block was the loudest brand mismatch on a buyer-facing screen — keep the calm version.

### For COO / QA

- New checklist rows added to [`docs/QA_FEATURE_TEST_WORKFLOW.md`](../QA_FEATURE_TEST_WORKFLOW.md) §5.1 and §5.2 marked **UI (T1)**.
- Pilot/demo: vendors + ingredients now visually match the dashboard and mobile shift surfaces — safe to demo to purchasing leads without commentary.
- No database, rules, or auth changes — no Console steps required.

### For CEO / product

- Demo gate met for T1: a non-technical purchaser opening either page sees clear page intent, calm typography, scannable rows, and an obvious next step. No remaining "internal tool" feel on these two surfaces.
- "Workspace" → "project" copy aligned in customer-facing strings on these pages, consistent with Phase B3.
- Next in sequence per [`docs/UI_AND_WORKFLOW_ROADMAP.md`](../UI_AND_WORKFLOW_ROADMAP.md): **T2 — project-hub.html Phase D**.

---

## 2026-03-27 — Google OAuth redirect → dashboard (shipped)

**Commits:** `2e6e2d2` (AuthManager sync + post-OAuth redirect); hosting deploy to **`iterum-culinary-app2`**.

### Summary

- **Bug:** After **Google** sign-in (`signInWithRedirect`), users returned to **`/`** or **`signin.html`** and never reached **`dashboard.html`** — Firebase session existed but **`unifiedAuthSystem` is not loaded** on those pages, so **`authManager` local session was never written**.
- **Fix:** `firebase-auth.js` calls **`authManager.applyFirebaseUserSession()`** on sign-in; **`sessionStorage`** flags (`iterum_oauth_started` / `iterum_oauth_just_completed`) gate **`location.replace('dashboard.html')`** from entry pages only; **`getRedirectResult`** is **awaited** before **`onAuthStateChanged`**; **`signInWithGoogle`** no longer assumes a `UserCredential` on the same navigation.

### For CTO / engineering

- Touch points: `public/assets/js/firebase-auth.js`, `public/assets/js/auth-manager.js`, `auth-ui.js`, `index.html`, `signin.html`.
- Keep **`unifiedAuthSystem` vs `authManager`** straight on pages that load one but not the other.

### For COO / QA

- Prod smoke: **Google** from **`/`** and **`signin.html`** → **dashboard** + header user; email/password unchanged path.

---

## 2026-04-01 — Firebase auth console on first load (committed)

**Canonical file:** `public/assets/js/firebase-auth.js` (commit `4e9c2ec`).

### Summary

- Initial `onAuthStateChanged(null)` on `/`, `signin.html`, or any entry page **before** sign-in is **expected**; the previous console message read like a hard “signed out” event and confused support and debugging.
- **Change:** log copy explains that no session on first load is normal, not an error.

### For CTO / engineering

- No auth behavior change—**observability only**. When triaging login issues, success still shows **“Firebase user signed in”** after valid credentials.
- Same bundle is used for embedded auth on **`/`** (`index.html`) and **`signin.html`**; keep messaging aligned if auth init moves.

### For CEO / product

- Demos and UAT are less noisy in DevTools—fewer false “something broke” moments.

### For COO / QA

- Smoke: open DevTools on production **`/`** and **`/signin.html`** before sign-in—expect one **informational** line, not an alarming sign-out.

---

## 2026-03-29 — Root landing (`/`) UX redesign (committed)

**Canonical file:** `public/index.html` (Vercel root — **not** `signin.html`).

### Summary

- Replaced full-bleed navy hero + separate white form with **one unified card** (`hero-shell`): light page background, readable left column (dark text on soft gray), auth panel separated by a border.
- Removed competing primary CTAs: dropped duplicate **“Start Free Trial”** on the left and the large **“14-Day Trial”** button; **Sign In / Sign Up + Google** remain primary; **14-day trial** is a **text link** (same `handleTrialAccess()` modal).
- Fixed **contrast / cascade** issues: global `p` / `iterum-brand-kit` / `launch-nordic-vintage.css` were fighting hero styles — scoped overrides under **`.landing-auth-hero`** with explicit colors and `!important` where needed.
- **Mobile:** auth column first (`order`), then value prop.
- **Forms:** `autocomplete` on email/password/name for sign-in and sign-up.
- **CSS:** Added `:root` **`--gray-50`…`--gray-900`** and **`--accent`** so auth labels and legacy `var(--gray-*)` resolve.

### For CTO / engineering

- Follow-up if any style still bleeds: consider scoping **`launch-nordic-vintage.css`** hero rules to exclude `.landing-auth-hero` (optional cleanup).
- Entry points: **`/` → `index.html`** (embedded auth); dedicated **`/signin.html`** remains for direct auth links — keep behavior aligned when changing copy or flows.
- Related prior review (session vs Firebase, dashboard nav, H&S Firestore scope): still tracked in leadership/checklist docs; not all items are fixed in this commit.

### For CEO / product

- One clear story: **sign in or sign up**; trial is secondary; “How Iterum works” scrolls to `#capabilities`.
- Brand is calmer and more “operator credible” than the previous split-screen promo.

### For COO / QA

- After deploy: smoke **sign-in, sign-up, Google, trial link → modal** on **production URL** root.
- Cross-reference: `docs/workflows/WF_SIGNIN_UI_REDESIGN.md` (focuses on **`signin.html`**); this log covers **`index.html`** root experience.

---

## Earlier briefing — sign-in + dashboard (reference only)

A separate **CTO/CEO** review covered `public/signin.html` vs `public/dashboard.html` (session via `localStorage`, unified nav injection, placeholder metrics, Firestore scoping for temp/sanitizer logs). That content was not duplicated as a second doc; **next step** if needed: add `docs/briefings/SIGNIN_DASHBOARD_REVIEW.md` from that memo.

---

*Append new dated sections below as personas ship follow-up work.*
