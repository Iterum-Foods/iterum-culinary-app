# Persona handoff log — landing + auth entry UX

**Purpose:** Single place for `@iterum-persona-ceo`, `@iterum-persona-cto`, `@iterum-persona-coo`, PM/UX agents to pick up context without re-reading chat history.  
**How to use in Cursor:** `@iterum-persona-cto` (or CEO/COO) plus `@docs/briefings/PERSONA_HANDOFF_LOG.md`.

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
