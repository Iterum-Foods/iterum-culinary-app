# Page change map (Iterum Culinary — `public/`)

Use this when updating **navigation**, **project/restaurant context**, **auth gating**, or **global scripts** so no shell is missed.

## Shell types (how layout works)

| Type | Behavior | Representative files |
|------|----------|------------------------|
| **A — Unified sidebar** | `unified-nav-header.js` injects `.unified-nav-sidebar` + wraps body in `.main-content-wrapper`. **Locations** dropdown loads via dynamic `restaurant-location-sidebar.js` from the header injector. | Most app tools (see table). |
| **B — Custom notebook shell** | `data-no-unified-nav="true"` **or** URL path contains `dashboard` → unified nav **skips** inject. Page ships its own `<aside>` + layout. **Must manually** add shared controls (e.g. `restaurant-location-sidebar.js` + markup). | `dashboard.html` |
| **C — App page, minimal / late PM** | Unified nav runs; `project-management-system.js` may be missing or loaded only at bottom of body. Project APIs may be undefined on first paint. | `equipment-management.html`, some hub pages |
| **D — Entry / marketing** | No unified nav; own IA. | `index.html`, `signin.html`, `landing.html`, `setup.html`, … |
| **E — Utility / test** | Not part of product shell. | `test*.html`, `simple-test.html` |

## When you change feature X, touch…

| Change | Primary touchpoints | Verify on |
|--------|---------------------|-----------|
| **Left nav links / labels** | `unified-nav-header.js` (`getSidebarHTML`), `dashboard.html` (desktop + mobile nav), optionally `notebook-sidebar-template.js` (template only — currently unused by HTML) | One Type **A** page + `dashboard.html` |
| **Restaurant group / location scope** | `project-management-system.js`, `restaurant-location-sidebar.js`, `unified-nav-header.js` (sidebar HTML + script inject) | Type **A** page + `dashboard.html` |
| **Project list / current project storage** | `project-management-system.js`, `unified-project-selector.js` | Any page with project chip + `project-hub.html` |
| **Global header / brand** | `header-universal.css`, `unified-nav-header.js`, per-page `header-user-display` if used | `dashboard.html` + one unified page |
| **Auth gate** | `page-protection.js`, `auth-manager.js`, Firebase scripts — each protected page in table | Sign-in flow + one protected page |
| **Recipe list project filter** | `recipe-library.html` (scope helpers), `project-management-system.js` (`getEffectiveProjectIds`, etc.) | `recipe-library.html` |
| **Firestore paths / user scope** | Feature-specific modules + `firestore.rules` | Pages that use the feature |

## Per-page inventory

Legend: **UN** = loads `unified-nav-header.js` (injection attempted), **SKIP** = unified nav skipped (`data-no-unified-nav` or dashboard path), **PM** = `project-management-system.js`, **UPS** = `unified-project-selector.js`, **RL** = `restaurant-location-sidebar.js` (explicit include or injected with UN).

| Page | UN | Shell | PM | UPS | RL | Notes |
|------|----|-------|----|-----|-----|-------|
| `audit-log.html` | ✓ | A | | ✓ | inject | |
| `bulk-ingredient-import.html` | ✓ | A | | ✓ | inject | |
| `bulk-recipe-import.html` | ✓ | A | | ✓ | inject | |
| `calendar.html` | ✓ | A | ✓ | ✓ | inject | |
| `dashboard.html` | ✓* | B | ✓ | ✓ | **explicit** | `data-no-unified-nav="true"` — no inject; custom sidebar + mobile drawer |
| `data-backup-center.html` | ✓ | A | | ✓ | inject | |
| `signin.html` | | D | | | | Entry |
| `data-management-dashboard.html` | ✓ | A | | ✓ | inject | PM not in head; add if page needs `projectManager` |
| `equipment-management.html` | ✓ | A | ✓ (late) | ✓ | inject | PM near end of file |
| `fallback.html` | | D | | | | |
| `ingredient-highlights.html` | ✓ | A | | ✓ | inject | |
| `ingredients.html` | ✓ | A | ✓ | ✓ | inject | |
| `inventory-variance.html` | ✓ | A | | ✓ | inject | |
| `inventory.html` | ✓ | A | | ✓ | inject | |
| `kitchen-management.html` | ✓ | A | ✓ | ✓ | inject | |
| `menu-builder.html` | ✓ | A | ✓ | ✓ | inject | |
| `production-planning.html` | ✓ | A | ✓ | ✓ | inject | |
| `project-hub.html` | ✓ | A | ✓ | ✓ | inject | |
| `recipe-canvas.html` | | D | | | | Standalone canvas |
| `recipe-developer.html` | ✓ | A | ✓ | ✓ | inject | |
| `recipe-library.html` | ✓ | A | ✓ | ✓ | inject | Scope filtering for multi-location |
| `recipe-photo-studio.html` | ✓ | A | | ✓ | inject | |
| `recipe-scaling-tool.html` | ✓ | A | | | inject | No UPS in current head |
| `restaurant-group-onboarding.html` | ✓ | A | ✓ | ✓ | inject | |
| `server-info-sheet.html` | ✓ | A | | ✓ | inject | |
| `user-profile.html` | ✓ | A | | ✓ | inject | |
| `vendor-management.html` | ✓ | A | ✓ (late) | ✓ | inject | PM in body |
| `vendor-price-comparison.html` | ✓ | A | | ✓ | inject | |
| `index.html` | | D | | | | Home / routing |
| `404.html` | | D | | | | |
| `landing.html` | | D | | | | |
| `company.html` | | D | | | | |
| `pitch.html` | | D | | | | |
| `setup.html` | | D | | | | |
| `contact_management.html` | | D | | | | Admin-style |
| `user_management.html` | | D | | | | |
| `simple-test.html` | | E | | | | |
| `test.html` | | E | | | | |
| `test-auth.html` | | E | | | | |
| `test-direct.html` | | E | | | | |
| `test-simple.html` | | E | | | | |
| `test-site.html` | | E | | | | |

\* `dashboard.html` includes `unified-nav-header js` but injection is **skipped**; script still loads for shared types/helpers if any.

## Shared modules (edit once, many consumers)

| File | Role |
|------|------|
| `public/assets/js/unified-nav-header.js` | Injects sidebar for Type **A**; loads `restaurant-location-sidebar.js` once |
| `public/assets/js/restaurant-location-sidebar.js` | `[data-restaurant-location-select]` + `projectManager` APIs |
| `public/assets/js/project-management-system.js` | Projects, groups, `getEffectiveProjectIds`, location scope |
| `public/assets/js/unified-project-selector.js` | Second project UI layer; keep storage keys aligned with PM |
| `public/assets/js/notebook-sidebar-template.js` | HTML helper for notebook nav (not wired to pages today) |

## Maintenance checklists

### New app tool page (inside authenticated product)

1. Add `unified-nav-header.js` + `header-universal.css` (match siblings).
2. If project-aware: add `project-management-system.js` (before first use) + `unified-project-selector.js` if others use it.
3. Body: leave room for inject (no duplicate fixed sidebars unless intentional).
4. If **not** using unified inject: set `data-no-unified-nav="true"` and copy **dashboard** pattern for nav + **RL** markup/script.

### Change sidebar footer (project chip, locations, user block)

1. Edit `unified-nav-header.js` → `getSidebarHTML()`.
2. Edit `dashboard.html` (desktop sidebar + `dash-mobile-drawer`).
3. Run smoke: one Type **A** page + `dashboard.html`.

---

**Regenerating this table:** from repo root, search `unified-nav-header.js` and `project-management-system.js` in `public/*.html` and reconcile with the list above.
