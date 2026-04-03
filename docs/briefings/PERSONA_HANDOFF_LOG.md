# Persona handoff log — landing + auth entry UX

**Purpose:** Single place for `@iterum-persona-ceo`, `@iterum-persona-cto`, `@iterum-persona-coo`, PM/UX agents to pick up context without re-reading chat history.  
**How to use in Cursor:** `@iterum-persona-cto` (or CEO/COO) plus `@docs/briefings/PERSONA_HANDOFF_LOG.md`.

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
