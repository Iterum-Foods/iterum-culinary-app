# QA Feature Test Workflow

Use this checklist to run a reliable release validation across mobile shift, operations, vendors, and checklist workflows.

## 0) Preflight

- [ ] Pull latest `main`
- [ ] Run `npm install`
- [ ] Ensure Firebase config points to the intended environment
- [ ] Confirm test user account(s) are available:
  - line role (`employee_line`)
  - manager/admin role (`location_manager` or `account_admin`)

## 1) Automated Validation (must run first)

Run in order:

1. `npm run lint`
2. `npm run format:check`
3. `npm run test:chromium`

Pass criteria:

- `test:chromium` must pass all tests.
- Lint/format should be tracked as quality debt if warnings remain, but no new critical failures should be introduced.

Latest run status at time of writing:

- `npm run test:chromium` -> PASS (`10 passed`)
- `npm run lint` -> PASS with existing warnings
- `npm run format:check` -> reports style issues in a subset of files

## 2) Mobile Shift App Workflow (`/mobile-compliance.html`)

### 2.0 Role routing (web)

- [ ] Complete `setup.html` as **Kitchen line / crew** (`employee_line`): submit should land on **`mobile-compliance.html`**, not the web dashboard.
- [ ] Sign in as lead/purchasing profile: destination remains **`dashboard.html`** (or `setup.html` if profile missing).

### 2.1 Auth and workspace

- [ ] Sign in as line user
- [ ] Confirm app panel loads and user chip renders
- [ ] Select workspace from `Where are you working today?`
- [ ] Reload page and confirm workspace persists

Expected:

- Status confirms workspace saved
- Shift sections are usable after workspace selection

### 2.2 Today panel (role-aware command center)

- [ ] Verify `Today at a glance` panel is visible
- [ ] Confirm role chip reflects current membership
- [ ] Confirm metrics render (opening checks, attention flags, temp logs, team posts)
- [ ] Tap each quick action button and confirm tab navigation

Expected:

- Panel updates after workspace change
- No blank/errored state once workspace is selected

### 2.3 Temps and sanitizer logging

- [ ] Add sanitizer station if needed
- [ ] Log sanitizer using `150`
- [ ] Log sanitizer using `150 ppm`
- [ ] Log invalid input (`abc`) and confirm user-facing validation message

Expected:

- Valid entries save successfully
- Invalid entry shows: numeric input guidance message

### 2.5 Bar drink drafts (admin quick-add → web "in progress")

Two surfaces: phone Bar tab (admin/manager only) for capture; dashboard "Bar drink drafts (in progress)" card for review and publish. Persistence under `projects/{pid}/snapshots/bar_drink_drafts` (drafts) and `projects/{pid}/snapshots/bar_line_pack` (published — what line staff see).

- [ ] Sign in as an admin/manager (role with `dashboard_manager_notes: true`)
- [ ] Mobile app → **Bar** tab → confirm **Quick add a drink (admin)** `<details>` block is visible
- [ ] Sign in as a line employee (`employee_line`) → confirm Quick add block is **hidden**
- [ ] As admin: open Quick add → fill name + at least two build lines (`Lime juice — 0.75 oz`) → tap **Save as in progress** → status reads *Saved "<name>" as in progress.* and form clears
- [ ] Open web `/dashboard.html` → **Bar drink drafts (in progress)** card → confirm the new draft appears with build, glass/method/garnish/allergies summary
- [ ] Click **Import Wusong sample** → confirm 11 drafts appear (Vic's Mai Tai, Zombie, Enter the Dragon, Mango Sticky Rice Colada, Big Game Hunter, Last Flight to Paradise, Tiger Balm, Flight Risk, Temple Tantrum, Cosmo Cabana, Forbidden Peach) with `Wusong menu cheat sheet` source tag
- [ ] Click **Import Wusong sample** again → no duplicates: previous Wusong drafts are replaced (importer is idempotent against the `Wusong menu cheat sheet` source)
- [ ] Click **Publish** on one draft → status reads *Published "<name>" to the bar pack.*, draft disappears from the in-progress list
- [ ] Mobile app → **Bar** tab → confirm the published drink shows in **Drink builds & specs** with the full text spec (build, glass, method, garnish, allergies)
- [ ] Click **Delete** on a remaining draft → confirm prompt → draft disappears
- [ ] Reload dashboard → drafts persist (Firestore round-trip ok)

### 2.6 Bar checklists (opening / midday / closing / station stock)

Two surfaces: dashboard **Bar checklists** card (admin/manager) publishes; mobile **Bar** tab renders them for bartenders. Pack at `projects/{pid}/snapshots/bar_checklist_pack` with shape `{ opening: [], midday: [], closing: [], station_stock: [] }`. Per-user daily **Done** and **Need** flags stay on the phone under `iterum.bar_checklist_state.{pid}.{uid}.{YYYY-MM-DD}` as JSON `{ done: { opening: { "0": true }, ... }, need: { ... } }` (legacy `{ opening: { "0": true } }` is still read as all-Done flags).

- [ ] Sign in as an admin/manager → open `/dashboard.html` → **Bar checklists** card is visible (line role: hidden)
- [ ] Card shows four textareas (Opening, Midday stock / check, Closing, Station stock list); empty pack shows status "No items yet — try Import sample."
- [ ] Click **Import sample** → confirm prompt → status reads "Imported sample (N items) — published to the bar tab." and all four textareas populate
- [ ] Edit a line in **Opening** (add `Set up POS test transaction`) → click **Save & publish** → status reads "Saved N items — published to the bar tab."
- [ ] Click **Refresh** → edits round-trip from Firestore
- [ ] Open the mobile app → **Bar** tab → confirm a **Bar checklists** section appears below Liquors & bar stock, with four subsections (Opening, Midday stock / check, Closing, Station stock list)
- [ ] Every line in all four lists shows two controls: **Done** and **Need**; section headers show `X/Y done · Z need`
- [ ] Check **Done** on a few items → row text strikes through; header `done` count updates; reload Bar tab → Done persists for the day
- [ ] While signed in, check **Need** on an **Opening** item → status mentions Prep list; open **Lists** tab → Prep checklist includes a new line prefixed `(Bar · Opening)` with that item text; Bar tab still shows **Need** checked
- [ ] Check **Need** on the same opening item again (toggle off then on) → no duplicate prep line ("Already on your prep list.")
- [ ] Check **Need** on a **Station stock** line → new line appears on **Stock** textarea (Lists tab) with prefix `(Bar · need stock)`; status mentions Stock list
- [ ] Sign out (or use a session with no auth), check **Need** → must show sign-in message and **Need** must not stay checked
- [ ] Switch the device date forward by one day (or wait until tomorrow) → Done and Need flags reset
- [ ] Confirm an `employee_line` user sees the lists but never a publish UI on the dashboard
- [ ] With no project selected on mobile → section reads "Pick your location above for bar checklists."
- [ ] With an empty pack on mobile → section reads "No bar checklists yet. Ask a manager to publish them from the dashboard."

### 2.7 ID quick reference (21+ / 18+) on Hub + Bar tabs

A small calm card at the top of the mobile **Hub** and **Bar** tabs shows today's date plus the "born on or before" cutoffs for **21+** and **18+**, computed from the device's local clock. Pure client-side math; no Firestore involved. Renders on tab activation, on first load, and on project change.

- [ ] Open mobile app → **Hub** tab is selected → confirm an **ID quick reference** card sits above the tile grid with: today's date, a **21+** row (highlighted pill), an **18+** row, and a "Verify against a valid government-issued ID" footer
- [ ] Confirm the 21+ date equals today minus 21 years (Mon, May 11, 2026 → Sun, May 11, 2005); the 18+ date equals today minus 18 years (→ Fri, May 11, 2008)
- [ ] Tap **Bar station** tile → Bar tab shows the same ID card at the very top, above the "Published by your manager" hint
- [ ] Switch the device clock forward by 1 day, reopen the Hub tab → both cutoff dates advance by 1 day
- [ ] Edge case (real device — optional): set the clock to Feb 29 of a leap year → 21+ shows Feb 28 of (year − 21) when (year − 21) is not a leap year (avoids the off-by-one bug where someone born Mar 1 would be displayed as 21 a day early)
- [ ] No network: card still renders (computation is local-only)
- [ ] Card stays visible even when no project is selected (does not depend on team membership)

### 2.4 Crowd Manager (FP-250) daily checklist

Required for nightclub, dancehall, discotheque, or bar per 527 CMR 1.00 §20.1.5.6.4. The mobile app stores per-day entries at `iterum.checks.crowd_manager.{projectId}.{YYYY-MM-DD}` and (when signed in) writes to Firestore `projects/{projectId}/checklists/{entryId}` with `templateId: crowd_manager_fp250`.

- [ ] Open mobile app → **Checks** tab → expand **Crowd Manager (FP-250) — daily fire & building safety**
- [ ] Confirm the date field defaults to today
- [ ] Mark a mix of Yes/No on inspection items; fill dated inspection fields (extinguisher, sprinkler, fire alarm, exhaust, suppression)
- [ ] Enter responsible persons (exit announcement, occupant load), max capacity + certificate expiration
- [ ] Enter **Crowd manager name** and **Certificate #**
- [ ] Submit without signature → must be blocked ("Type your name to sign.")
- [ ] Submit with signature that does not match the crowd manager name → must be blocked
- [ ] Submit without the attestation checkbox → must be blocked
- [ ] Submit with matching signature + attestation → status shows **FP-250 signed and saved.** and the "FP-250 signed today" banner renders above the form with the signer, certificate, signed-at timestamp, and a "No items" or "N items marked No" summary
- [ ] Refresh the page and reopen Checks → static fields (cert #, capacity, last-inspection dates, responsible persons) prefill from `prefill` cache; signature + attestation are blank
- [ ] Open `/calendar.html` → select today → **Crowd Manager (FP-250)** section shows the same entry with manager name, signer, status (Yes/No counts), and signed-at timestamp
- [ ] Pick a date with no FP-250 entry → calendar section reads `No FP-250 checklist on this date`

## 3) Checklist + Corrective Action Workflow (`/dashboard.html`)

### 3.1 Opening checklist happy path

- [ ] Open Daily Opening Checklist
- [ ] Submit all pass/fail checks as `pass`
- [ ] Verify entry appears in recent history

Expected:

- Entry saves as completed
- No corrective action required

### 3.2 Failure path (critical)

- [ ] Submit checklist with at least one `fail`
- [ ] Leave Failure notes empty and attempt save
- [ ] Add Failure notes and save again

Expected:

- Save is blocked when fail exists without failure notes
- Save succeeds after failure notes are provided
- Entry marked as attention/requires corrective action

### 3.3 Corrective action persistence

- [ ] Confirm corrective action object is created (local + Firestore when connected)
- [ ] Verify checklist entry references corrective action id

Expected:

- Corrective action saved under project scope and linked to source checklist entry

## 4) Ops Exceptions Workflow (`/dashboard.html`)

- [ ] Trigger or seed each exception type:
  - missing spec
  - stale price
  - failed opening check
- [ ] Verify each appears with severity
- [ ] Click action links

Expected deep links:

- Missing spec -> `spec-library.html#missing-specs`
- Stale price -> `ingredients.html#stale-pricing`
- Failed opening -> `dashboard.html#checklist-opening`

## 5) Vendor + Spec Workflow

### 5.1 Vendor management (`/vendor-management.html`)

- [ ] Open vendor page and verify workspace price overrides section
- [ ] Add/update/remove a sample override
- [ ] **UI (T1):** sidebar context bar shows breadcrumb `Purchasing › Vendor management`
- [ ] **UI (T1):** hero is calm/light (no dark navy/purple gradient); H1 reads as a normal page heading, not a marketing banner
- [ ] **UI (T1):** primary actions in hero, quick cards, stat cards, and bulk-actions are emoji-free in production chrome
- [ ] **UI (T1):** workflow banner above the onboarding rail links to `ingredients.html` and the link works

### 5.2 Ingredients + specs (`/ingredients.html`)

- [ ] Add or edit ingredient with spec URL and notes
- [ ] Confirm spec is visible in ingredient list/card views
- [ ] **UI (T1):** sidebar context bar shows breadcrumb `Purchasing › Ingredient library`
- [ ] **UI (T1):** the three quick-action buttons no longer use multicolor gradients or emoji; the cross-link banner to vendor price overrides still works

### 5.3 Spec Library (`/spec-library.html`)

- [ ] Confirm spec appears in the consolidated index
- [ ] Validate search/filter behavior

## 6) Smoke Deep-Link Check

- [ ] Open `dashboard.html#checklist-opening`

Expected:

- Opening checklist modal opens immediately.

## 7) Release Sign-off Summary (fill each run)

- Date:
- Environment:
- Tester(s):
- Automated results:
  - lint:
  - format check:
  - chromium smoke:
- Manual failures found:
- Blockers:
- Ship decision: GO / NO-GO

