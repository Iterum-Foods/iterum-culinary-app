# Workflow: Sign-in page UI redesign

**Status:** **S4 implemented in repo** — next: **S5** (you review on Vercel) → **S6** (sign-off + smoke).  
**Canonical URL for smoke:** https://iterum-culinary-app.vercel.app/ (paths: `/signin.html` or as routed)  
**Source file:** [public/signin.html](../../public/signin.html)  
**Companion plans:** [TEAM_ACTION_PLAN.md](../../TEAM_ACTION_PLAN.md)  

---

## Goal

Improve **visual hierarchy, clarity, and polish** on the sign-in / sign-up experience without breaking **Firebase Auth** (email/password + Google), **error handling**, **redirects**, or **A1 smoke** expectations.

---

## Out of scope (unless explicitly added)

- Changing auth providers or backend  
- Moving auth to a SPA router (stay compatible with current static page unless CTO approves)  
- Removing analytics / legal requirements without CEO sign-off  

---

## Success criteria (acceptance)

| # | Criterion | How to verify |
|---|-----------|----------------|
| AC1 | **Mobile-first usable** — thumb reach, readable type, no horizontal scroll on narrow phones | Manual + optional responsive screenshot set |
| AC2 | **Brand cohesion** — aligns with `iterum-brand-kit` / design tokens (forest, clay, ink, gold); no “random” third palette | PM + UX review |
| AC3 | **Plain-language labels** where appropriate — operators understand Email / Password (or agreed terminology) | PM sign-off on copy |
| AC4 | **Accessibility baseline** — focus states visible, labels associated with inputs, sufficient contrast on primary CTA | UX or ENG checklist |
| AC5 | **No auth regression** — sign-in, sign-up, Google, errors, forgot-password link path, redirect to dashboard still work | A1-style smoke on **Vercel** |
| AC6 | **Performance** — no unnecessary blocking scripts added; LCP not worse vs baseline (spot check) | CTO judgment |

---

## Phases & delegation (Cursor + humans)

Use **`@iterum-persona-*`** rules and `@` this file. One thread per phase owner keeps context clean.

| Phase | ID | Owner (tag) | Deliverable | Done when |
|-------|-----|-------------|-------------|-----------|
| **1. Kickoff** | S1 | `@CEO` `@COO` | 3–5 lines: priority, target week, “must not break auth” | You paste kickoff note at bottom of this doc |
| **2. UX / content brief** | S2 | `@PM` or `@COO` (+ `@UX` if staffed) | Wireframe description **or** bullet layout + copy table (hero, headings, fields, CTA, errors) | Brief linked here or committed as `docs/signin-ui-brief.md` |
| **3. Technical constraints** | S3 | `@CTO` | Notes: keep `handleSignIn` / `handleSignUp` / Google flow; Tailwind CDN vs extracted CSS; Vercel + Firebase authorized domains | Comment block or S3 section filled below |
| **4. Implementation** | S4 | `@CTO` `@ENG` | PR-style change in `public/signin.html` (+ optional `public/assets/css/signin-*.css`) | AC1–AC5 pass on Vercel deploy |
| **5. Review** | S5 | `@CEO` or `@PM` | GO / changes requested | Listed under Sign-off |
| **6. Close** | S6 | `@COO` | Update `TEAM_ACTION_PLAN` / changelog; optional A1 re-run if auth UI touched materially | Checkbox |

---

## Copy-paste — kickoff (CEO thread)

```text
@iterum-persona-ceo @docs/workflows/WF_SIGNIN_UI_REDESIGN.md
You are advising the founder. Confirm scope: sign-in UI only on Vercel, auth unchanged. Output a 5-line kickoff (priority, week target, risks) I can paste into “Kickoff note” below.
```

## Copy-paste — PM / COO brief

```text
@iterum-persona-coo (or PM block from LEADERSHIP_ROLE_ASSIGNMENTS)
@public/signin.html @docs/workflows/WF_SIGNIN_UI_REDESIGN.md
Draft S2: improved layout and copy for Operator Login / tabs / fields / CTAs. Mobile-first. Do not change JS function names without flagging. Output markdown I can save as docs/signin-ui-brief.md.
```

## Copy-paste — CTO / implementation

```text
@iterum-persona-cto @public/signin.html @docs/workflows/WF_SIGNIN_UI_REDESIGN.md
Implement S4 from the brief (attach @docs/signin-ui-brief.md when it exists). Preserve Firebase behaviors and IDs used by JS. Minimal diff outside sign-in page unless extraction to CSS is clearly safe.
```

## Copy-paste — S5 review (after Vercel deploy)

```text
@iterum-persona-ceo @docs/workflows/WF_SIGNIN_UI_REDESIGN.md @docs/signin-ui-brief.md
You’re advising the founder. Compare deployed sign-in on https://iterum-culinary-app.vercel.app/signin.html to AC1–AC4 in the workflow. Output: GO / revise with bullet list. No code unless I ask.
```

## Copy-paste — S6 close (COO)

```text
@iterum-persona-coo @docs/workflows/WF_SIGNIN_UI_REDESIGN.md @docs/A1_P0_PROD_SMOKE_RECORD.md
If S5 is GO: update Sign-off table + changelog; remind human to re-run A1 auth steps on Vercel and commit TEAM_ACTION_PLAN note if useful.
```

---

## Current implementation snapshot (for briefs)

- **Stack:** Tailwind CDN, Inter, Font Awesome, inline `<style>` + brand gradients on left panel on `lg+`.
- **Forms:** `#signin-form`, `#signup-form`, tabs `switchTab`, `handleSignIn`, `handleSignUp`, Google handler ~L500+.
- **Tone today:** “Operator Login”, “Internal ID / Email”, “Security Key”, “Initialize Session” — candidates for human-centered copy in S2.

---

## Kickoff note (paste after S1)

1. **Priority:** P1 product work—sign-in is the front door on **[iterum-culinary-app.vercel.app](https://iterum-culinary-app.vercel.app/)**; ship a clearer, more credible UI **after** foundation items (A1/A3, Stream B) stay on track—target **this sprint for S2 brief, next sprint for S4** unless you explicitly pull it forward.  
2. **Scope lock:** **Visual structure, copy, and responsive polish for `public/signin.html` only**—Firebase Auth (email/password, Google), handlers, redirects, and error paths **must remain behavior-identical** unless CTO documents a tiny safe refactor.  
3. **Week target:** **S1–S2 done in ~5 working days; S4 landing on Vercel ~5–10 days after brief GO**—adjust with CTO if bundler/CSS extraction adds days.  
4. **Risks:** Auth regression (highest—mitigate with post-merge A1 auth steps); **authorized domains** on Vercel already OK or fix before ship; scope creep into “rewrite auth” (kill that in S1).  
5. **Your decision:** You’re **GO** on this workflow as written; next action is **S2** in a COO/PM Agent using the brief prompt in this doc—then CTO **S3** before anyone edits markup heavily.

---

## S3 — Technical notes (CTO)

- **auth-ui.js** is source of truth for `switchTab`, `handleSignIn`, `handleSignUp`, `handleGoogleSignIn` after init; page must expose **`data-tab`**, **`signin-spinner` / `signup-spinner`**, **`signup-confirm-password`**, **`signup-confirm-error`**, **`success-message`**.
- Tailwind CDN retained on `signin.html`; optional future extract to `public/assets/css/signin-page.css`.
- **S4 (2026-03-29):** Implemented per [docs/signin-ui-brief.md](../signin-ui-brief.md).

---

## Sign-off

| Role | Name | Date | GO / revise |
|------|------|------|-------------|
| PM / COO (copy & UX intent) | | | |
| CTO (tech + security) | | | |
| CEO (ship) | | | |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-29 | Workflow created; delegation + Cursor prompts; targets `public/signin.html`. |
| 2026-03-29 | S1 kickoff note filled (CEO advisor → founder). |
| 2026-03-29 | S2 brief added as `docs/signin-ui-brief.md`; S4 implementation in `public/signin.html` + `auth-ui.js` spinner/tab fixes. |
