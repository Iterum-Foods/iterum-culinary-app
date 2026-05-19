# taste-craft-revamp → iterum-culinary-app UI

**Design source:** [Iterum-Foods/taste-craft-revamp](https://github.com/Iterum-Foods/taste-craft-revamp) (Vite + React + shadcn; warm culinary tokens, Fraunces display type).

**Production app:** static HTML under `public/` — we **port tokens and CSS components**, not the React bundle.

---

## What landed in this repo

| File | Role |
|------|------|
| `public/assets/css/taste-craft-revamp-tokens.css` | HSL design tokens + `--brand-*` bridge from revamp `src/index.css` |
| `public/assets/css/taste-craft-revamp-ui.css` | Static `tc-*` components (page hero, cards, buttons, status pills, recipe-developer surfaces) |
| `public/assets/css/iterum-canonical-app.css` | Imports tokens + UI after `iterum-brand-kit.css` |

**Pages using revamp skin (`tc-revamp-body`):**

- `dashboard.html` — hero header + cards
- `recipe-developer.html` — canvas / sections / primary buttons (via canonical stack)
- `project-hub.html` — canonical stack
- `mobile-compliance.html` — Shift shell colors aligned via `mobile-shift-brand.css` import

---

## Syncing when revamp changes

1. Clone or pull `taste-craft-revamp` beside this repo.
2. Diff `src/index.css` `:root` and utilities → update `taste-craft-revamp-tokens.css`.
3. For new screens (e.g. `RecipeDeveloper.tsx` layout), translate structure to HTML classes in `taste-craft-revamp-ui.css` or page-specific CSS — do not embed React in `public/` without an explicit migration plan.

---

## Not ported (yet)

- Full **AppSidebar** React layout (unified nav remains `unified-nav-header.js`).
- **RecipeDeveloper.tsx** feature set (version tabs, type picker, inventory command palette) — UI chrome only on `recipe-developer.html`.
- **Recharts** dashboard charts from revamp `Index.tsx` — dashboard keeps Chart.js.
- **React Router** shell — each HTML page stays independent.

---

## Verification

- Open `dashboard.html` and `recipe-developer.html` locally or on Vercel after deploy.
- Confirm warm background, Fraunces headings, accent CTA gradient on “New experiment”.
- Mobile: `mobile-compliance.html` — green header should match warm accent, not legacy moss-only palette.

Related: [CSS_CANONICAL_STACK.md](./CSS_CANONICAL_STACK.md) · [UI_AND_WORKFLOW_ROADMAP.md](./UI_AND_WORKFLOW_ROADMAP.md)
