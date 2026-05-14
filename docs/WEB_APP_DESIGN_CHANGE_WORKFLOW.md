# Web app design change workflow

**Purpose:** When you change **tokens, layout, navigation, or global polish**, use this runbook so **every surface** stays coherent — not just the page you edited first.

**Audience:** Design, PM, and engineering (including agents).  
**Use with:** [CSS_CANONICAL_STACK.md](./CSS_CANONICAL_STACK.md), [UI_AND_WORKFLOW_ROADMAP.md](./UI_AND_WORKFLOW_ROADMAP.md), [QA_FEATURE_TEST_WORKFLOW.md](./QA_FEATURE_TEST_WORKFLOW.md), [HOW_WE_SHIP.md](./HOW_WE_SHIP.md).

**Last updated:** 12 May 2026

---

## 1. Page inventory (how to find “all pages”)

Static HTML lives under **`public/*.html`**. Refresh counts anytime:

```bash
# All top-level app/marketing pages
ls public/*.html

# Manager shell: anything that loads the unified sidebar + header
rg -l "unified-nav-header\\.js" public/*.html

# Golden-path canonical stack (shared tokens + layout contract)
rg -l "iterum-canonical-app\\.css" public/*.html

# Phone shift app (separate visual system — do not merge blindly)
rg -l "mobile-shift-brand\\.css" public/mobile-compliance.html
```

**Rough baseline (12 May 2026):** ~**46** top-level HTML files; **29** load `unified-nav-header.js` (authenticated “office” shell); **10** load `iterum-canonical-app.css` (canonical golden-path subset). Numbers drift as pages are added — always re-run the commands above before a large rollout.

---

## 2. Three tiers (where a design change lands)

| Tier | Surfaces | What to change first |
|------|----------|----------------------|
| **A — Global manager chrome** | Every page with `unified-nav-header.js` (**29** HTML files as of this writing) | `public/assets/js/unified-nav-header.js` (injected HTML for header/sidebar), `public/assets/css/header-universal.css`, and **phone strip:** `public/assets/js/iterum-mobile-quicknav.js` (loaded automatically at end of `unified-nav-header.js`). One PR here updates **all** manager shell pages at once for nav + mobile top bar. |
| **B — Main content polish** | `.main-content-wrapper` on manager pages that link `iterum-workflow-polish.css` | `public/assets/css/iterum-workflow-polish.css` — typography, banners, **phone-width** rules (`@media (max-width: 720px)`), table rhythm. |
| **C — Canonical golden-path pages** | Pages that link `iterum-canonical-app.css` | `public/assets/css/iterum-canonical-app.css` + token source in `iterum-brand-kit.css`. See [CSS_CANONICAL_STACK.md](./CSS_CANONICAL_STACK.md) for per-page **extra** sheets only after canonical. |
| **D — Standalone / marketing / tests** | `index.html`, `landing.html`, `signin.html`, `setup.html`, `privacy.html`, `404.html`, `pitch.html`, `test*.html`, `demo-*.html`, etc. | Each has its own `<link>` stack — **touch in a second pass** or explicitly exclude from “full app” scope. |
| **E — Mobile shift PWA** | `mobile-compliance.html` | `public/assets/css/mobile-shift-brand.css` + `public/assets/js/mobile-line-employee.js`. **Shared language** (copy, success states, project context) with web — see roadmap §“Mobile vs web”. |

**Rule of thumb:** Prefer **one shared file** (Tier A/B/C) over editing 30 HTML files. Add a page-specific override only when the layout truly differs.

---

## 3. Standard workflow (every meaningful design change)

### Step 0 — Define scope

- [ ] **Which tier?** (A global nav, B content polish, C tokens, D marketing, E mobile.)
- [ ] **Out of scope** listed (e.g. “test HTML only”, “pitch deck this sprint”).
- [ ] **Success criteria** tied to a task (e.g. “manager on phone can reach Menu builder in 2 taps from any office page”).

### Step 1 — Design contract

- [ ] Tokens / type scale / spacing reference: [CSS_CANONICAL_STACK.md](./CSS_CANONICAL_STACK.md) §Token checklist and **Phase A** of [UI_AND_WORKFLOW_ROADMAP.md](./UI_AND_WORKFLOW_ROADMAP.md).
- [ ] No new full alternate theme on golden path without quarantine (roadmap §A3).

### Step 2 — Implement (order matters)

1. **Tokens / global variables** → `iterum-brand-kit.css` or variables consumed by `iterum-canonical-app.css` (if the change is product-wide).
2. **Canonical layout** → `iterum-canonical-app.css` for pages on that stack.
3. **Manager chrome** → `unified-nav-header.js` + `header-universal.css`; mobile pills → `iterum-mobile-quicknav.js`.
4. **Content band** → `iterum-workflow-polish.css`.
5. **Page-only** → smallest possible delta in that page’s extra CSS or scoped classes.

### Step 3 — Coverage audit (before merge)

- [ ] Re-run **§1** `rg` commands; note any manager page **missing** `unified-nav-header.js` — either add it or document as intentional standalone.
- [ ] Spot-check **at least one page per workflow bucket** from the roadmap (Daily ops, Menu & recipes, Purchasing, Admin): e.g. `dashboard.html`, `menu-builder.html`, `vendor-management.html`, `user_management.html`.
- [ ] **Phone:** resize browser to ≤720px (or real device) on dashboard + one deep tool — confirm sticky quicknav + no horizontal body scroll.
- [ ] **Mobile app:** if copy or IA changed, sync `public/` → Capacitor (`npx cap sync android` / iOS) per [HOW_WE_SHIP.md](./HOW_WE_SHIP.md).

### Step 4 — Automated checks (must pass on `main`)

```bash
npm run format:check
npm run lint          # 0 errors required for CI policy
npm run test:chromium
```

Add or extend **`tests/e2e/smoke.spec.js`** when a golden-path URL or critical selector changes.

### Step 5 — Docs and comms

- [ ] Update [CSS_CANONICAL_STACK.md](./CSS_CANONICAL_STACK.md) if the default stack or golden-path table changes.
- [ ] Add a line to **§6 Revision log** in [UI_AND_WORKFLOW_ROADMAP.md](./UI_AND_WORKFLOW_ROADMAP.md) for visible UX ships.
- [ ] Extend [QA_FEATURE_TEST_WORKFLOW.md](./QA_FEATURE_TEST_WORKFLOW.md) if a new default path or role gate ships.

---

## 4. Anti-patterns (avoid)

| Anti-pattern | Why it hurts | Instead |
|--------------|--------------|---------|
| Duplicating the same `<link>` block across many HTML files for a global color change | Drift on the next edit | Tier A/B/C shared CSS or one injected bundle |
| Styling only `dashboard.html` and assuming the rest matches | Managers live in menu/recipe/vendor tools | Use §3 Step 3 bucket spot-checks |
| Loading experimental / nordic / dark theme on pilot default | Breaks token contract | Roadmap §A3 — opt-in only |
| Forgetting `mobile-compliance.html` when changing “office” copy | Two products feel unrelated | Align labels in both tiers or document intentional difference |

---

## 5. Quick reference — shared files

| File | Role |
|------|------|
| `public/assets/css/iterum-brand-kit.css` | Brand tokens and base theme |
| `public/assets/css/iterum-canonical-app.css` | Canonical app bundle (golden-path pages) |
| `public/assets/css/iterum-workflow-polish.css` | `.main-content-wrapper` polish + phone-width rules |
| `public/assets/css/header-universal.css` | Unified header chrome |
| `public/assets/js/unified-nav-header.js` | Sidebar + nav; auto-loads mobile quicknav |
| `public/assets/js/iterum-mobile-quicknav.js` | Fixed top pill bar on narrow viewports for manager pages |
| `public/assets/css/mobile-shift-brand.css` | Shift / line mobile shell |

---

## 6. Definition of done (design rollout)

- [ ] Scope tiers (§2) explicitly covered or deferred with reason.
- [ ] Shared files updated before one-off HTML hacks.
- [ ] Inventory `rg` run; spot-check list completed.
- [ ] `format:check`, `lint` (0 errors), `test:chromium` green.
- [ ] Roadmap and/or CSS stack doc revision log updated when users see the change.

When **information architecture** (nav labels, buckets, breadcrumbs) changes, also update **§3 Phase B** in [UI_AND_WORKFLOW_ROADMAP.md](./UI_AND_WORKFLOW_ROADMAP.md) and [USER_WORKFLOW_GUIDE.md](./USER_WORKFLOW_GUIDE.md) together (roadmap already calls this out).
