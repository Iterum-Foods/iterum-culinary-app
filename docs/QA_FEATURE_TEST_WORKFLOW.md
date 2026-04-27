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

### 5.2 Ingredients + specs (`/ingredients.html`)

- [ ] Add or edit ingredient with spec URL and notes
- [ ] Confirm spec is visible in ingredient list/card views

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

