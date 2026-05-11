# Persona handoff log — landing + auth entry UX

**Purpose:** Single place for `@iterum-persona-ceo`, `@iterum-persona-cto`, `@iterum-persona-coo`, PM/UX agents to pick up context without re-reading chat history.  
**How to use in Cursor:** `@iterum-persona-cto` (or CEO/COO) plus `@docs/briefings/PERSONA_HANDOFF_LOG.md`.

---

## 2026-05-11 — ID quick reference (21+ / 18+) at top of Hub + Bar tabs (shipped)

### Summary

- Phone app: small calm **ID quick reference** card at the top of the **Hub** and **Bar** tabs shows today's date and the "born on or before" cutoffs for **21+** and **18+**. Recomputed on every tab activation, on first load, and on project change — so it stays accurate after midnight.
- Pure client-side: no Firestore, no auth, no network. Works offline. Card is universally visible (servers, bartenders, hosts, FOH all see it without extra setup).

### For CTO / engineering

- New file: `public/assets/js/id-quick-reference.js` — `window.iterumIdQuickReference` with `computeDates(refDate?)`, `formatDate(d, opts?)`, `render(targetEl)`. `subtractYears` clamps Feb 29 to Feb 28 of the destination year so the displayed 21+ cutoff is never a day too early on leap days.
- Touch points: `public/mobile-compliance.html` (two `data-id-quickref` containers + script tag), `public/assets/js/mobile-line-employee.js` (`refreshIdQuickReference()` wired into tab-click and project-change handlers, plus a first-render on init), `public/assets/css/mobile-shift-brand.css` (`.mc-id-card`, `.mc-id-card-tag`, `.mc-id-card-tag-21`, etc.).
- `npm run format:check` clean; `ReadLints` clean. `npx cap sync android` + iOS manual copy synced.

### For COO / QA

- New section **§2.7 ID quick reference** in [`docs/QA_FEATURE_TEST_WORKFLOW.md`](../QA_FEATURE_TEST_WORKFLOW.md): cutoff math, refresh on day rollover, Feb 29 edge case, offline behavior, visibility independent of project selection.
- No PII captured, no calls home — strictly a derived display.

### For CEO / product

- Closes a workflow gap for any bar program: bartenders and servers can glance at the top of their tab and know the day's cutoff date instead of doing the math each time. Pairs with FP-250 (compliance) and bar drink drafts (cocktail program) as a third small "shift hygiene" tile in the bar/FOH track.
- Worth considering next: per-state legal-age overrides (some states are 19+/20+ for tobacco); printable "today's ID date" sticker for the bar rail; in-card calculator that takes a typed DOB and answers "21+? Y/N".

---

## 2026-05-10 — Bar checklists: opening / midday / closing / station stock (shipped)

### Summary

- Bartenders get four lists on the phone **Bar** tab: **Opening**, **Midday stock / check**, **Closing**, and **Station stock list**. Each line has **Done** (local, per day) and **Need** (also local; when checked while signed in, appends a follow-up line to **Prep** for opening/midday/closing or **Stock** for station stock, then auto-saves those lists to the user’s Firestore notes — same paths the **Lists** tab uses).
- Managers edit and publish from **Bar checklists** on `/dashboard.html` (admin/manager only). **Save & publish**; **Import sample** replaces the pack with the generic starter.
- Daily bar checklist UI state is `{ done: {…}, need: {…} }` in `iterum.bar_checklist_state.{pid}.{uid}.{YYYY-MM-DD}` (legacy flat `{ opening: { "0": true } }` still migrates as Done-only). Unchecking **Need** does not remove lines from Prep/Stock (avoid accidental data loss).

### For CTO / engineering

- New files:
  - `public/assets/js/bar-checklists-seed.js` — `window.ITERUM_BAR_CHECKLISTS_SAMPLE` + `window.iterumBarChecklistNormalize(raw)` (trims, dedupes, and accepts string or array input from textareas).
  - `public/assets/js/bar-checklist-store.js` — `window.iterumBarChecklists` with `loadPack`, `savePack`, `importSample`. Stored at `projects/{pid}/snapshots/bar_checklist_pack` — same rules surface as bar drinks; **no new Firestore rules**.
- Touch points: `public/mobile-compliance.html` (Bar checklists hint copy + script tags), `public/assets/js/mobile-line-employee.js` (`migrateBarChecklistState`, `appendBarNeedFollowUp` → `loadPrepStock` + `savePrepStock`, bar row UI), `public/dashboard.html` (admin card + inline JS module), `public/assets/css/mobile-shift-brand.css` (`.mc-bar-check-*` row layout).
- Renderer is defensive: shows distinct empty states for "pick your location" vs "no published lists yet", and degrades gracefully if `iterumBarChecklists` isn't loaded.
- `npm run format:check` clean; `ReadLints` clean. `npx cap sync android` succeeded; iOS bundle synced manually.

### For COO / QA

- Section **§2.6 Bar checklists** in [`docs/QA_FEATURE_TEST_WORKFLOW.md`](../QA_FEATURE_TEST_WORKFLOW.md) covers: Done/Need on all four lists, Prep vs Stock routing, dedupe, signed-out rollback of Need, header `X/Y done · Z need`, day rollover, empty-state copy.
- Sample copy is intentionally **generic-bar** (citrus juices, syrups, soda guns, glassware pars) — not a Wusong drop-in. Managers will customize per location. If we want a Wusong-specific seed later, follow the same pattern as `wusong-drink-seed.js`.

### For CEO / product

- Closes the obvious gap from yesterday: drinks shipped, but bartenders had no shift rituals. Now they do, with the same one-click "Import sample" affordance that already won over kitchen workflows.
- Demo flow: admin opens dashboard → **Bar checklists** → **Import sample** → tweak one item → **Save & publish** → bartender opens phone Bar tab → checks **Done** on a line and **Need** on another → Lists tab shows the `(Bar · …)` follow-up on Prep or Stock.
- Follow-up tickets worth considering: (1) per-bartender sign-off on opening/closing (mirror the FP-250 e-signature pattern), (2) midday photo upload of the well, (3) station stock list ↔ purchasing tie-in so "below par" rows generate a buy list automatically.

---

## 2026-05-10 — Bar drink drafts (admin phone capture → web "in progress" review) (shipped)

### Summary

- New flow: admin/manager taps **Quick add a drink** on the phone Bar tab → draft saves to `projects/{pid}/snapshots/bar_drink_drafts` with `status: 'in_progress'` → web dashboard surfaces it in a new **Bar drink drafts (in progress)** card → manager clicks **Publish** to push the drink into the bar pack snapshot (`bar_line_pack.drinks[]`) the line app already reads.
- Quick-add form gated by `iterumCanViewManagerNotes()` (same UI-level role gate as nightly manager handoff notes).
- Dashboard card has **Publish**, **Delete**, **Refresh**, and **Import Wusong sample** (one-click seed of 11 Wusong cocktails as drafts; idempotent against re-import).
- The 11 Wusong drinks are bundled as structured seed data (`public/assets/js/wusong-drink-seed.js`): title, build (ingredient/amount/unit), glass, method, garnish, allergies — transcribed from `C:\Users\chefm\Downloads\Wusong Cheat Sheet - Menu Cocktails.pdf`.

### For CTO / engineering

- New files:
  - `public/assets/js/wusong-drink-seed.js` — `window.ITERUM_WUSONG_DRINKS` + `window.iterumDrinkSpecToText(drink)` (renders structured build to the plain-text `spec` field the line app's `loadBarPack()` already understands).
  - `public/assets/js/bar-drink-drafts.js` — `window.iterumBarDrafts` with `loadDrafts`, `upsertDraft`, `deleteDraft`, `publishDraft`, `importSampleDrafts`. Single-doc snapshot pattern (no new rules).
- Touch points: `public/mobile-compliance.html` (Bar tab form + script tags), `public/assets/js/mobile-line-employee.js` (`canEditBarDrafts`, `syncBarQuickAddVisibility`, `parseBuildLines`, `saveBarDraftFromForm`, listener wiring on tab + project change), `public/dashboard.html` (new admin card + inline JS module).
- **No new Firestore rules.** Both reads/writes hit `projects/{pid}/snapshots/{docId}` which is already governed by existing project membership rules.
- Publish path appends/replaces by title in `bar_line_pack.drinks[]`, then removes from `bar_drink_drafts.drinks[]`. Two sequential writes, retry-safe (failure leaves draft in place).
- `npm run format:check` clean; `ReadLints` clean on touched files. `npx cap sync android` succeeded; iOS bundle synced manually.

### For COO / QA

- New section **§2.5 Bar drink drafts** in [`docs/QA_FEATURE_TEST_WORKFLOW.md`](../QA_FEATURE_TEST_WORKFLOW.md) covers: role-gated Quick add visibility, Save flow, dashboard card, Wusong import (idempotent), Publish round-trip, Delete, persistence.
- No new permissions surfaced to line staff — they only see drinks **after** the admin publishes.

### For CEO / product

- Phone-first cocktail capture is the right wedge for cocktail-driven bars (Wusong-class). Demo flow: admin opens phone → adds *House Negroni* draft in 20 seconds → walks to office → opens dashboard → publishes → line phone shows it on the Bar tab.
- "Import Wusong sample" is also a clean way to demo the bar workflow on a fresh account without typing.
- Follow-up tickets worth considering: (1) draft edit-in-place on dashboard, (2) cost/ABV/photo fields, (3) printable bar menu, (4) version history (so a manager can roll back a bad publish).

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
