# Canonical CSS stack (Phase A)

**Last updated:** 12 May 2026  
**Related:** [UI_AND_WORKFLOW_ROADMAP.md](./UI_AND_WORKFLOW_ROADMAP.md) · [WEB_APP_DESIGN_CHANGE_WORKFLOW.md](./WEB_APP_DESIGN_CHANGE_WORKFLOW.md) (how to apply stack changes across every page)

## Golden-path pages (single stack)

These authenticated surfaces should load **`assets/css/iterum-canonical-app.css`** first (includes **taste-craft-revamp** tokens/UI from [TASTE_CRAFT_REVAMP_INTEGRATION.md](./TASTE_CRAFT_REVAMP_INTEGRATION.md)), then **only** page-specific CSS (e.g. `menu-builder-enhanced.css`, `recipe-developer-enhanced.css`).

| Page | Extra stylesheets (after canonical) |
|------|-------------------------------------|
| `dashboard.html` | Lite: `iterum-brand-kit` + `modal-high-contrast` + `header-universal` + `iterum-workflow-polish` (uses Tailwind **CDN** — do not add `tailwind-output` here). |
| `setup.html` | Tailwind CDN only (onboarding). |
| `signin.html` | Tailwind CDN + optional `iterum-workflow-polish` if linked. |
| `vendor-management.html` | (none required) |
| `ingredients.html` | `ui-polish.css` (legacy helpers) until merged. |
| `recipe-library.html` | `ui-polish.css` |
| `recipe-developer.html` | `page-ui-improvements.css`, `recipe-developer-enhanced.css`, `recipe-developer-contrast-fix.css` |
| `menu-builder.html` | `menu-builder-enhanced.css`, `menu-builder-pdf-upload.css` |
| `project-hub.html` | `unified-cards.css` + `page-layouts.css` already inside canonical — add page-only overrides inline or small `project-hub.css` if needed. |
| `mobile-compliance.html` | `mobile-shift-brand.css` (imports `taste-craft-revamp-tokens.css` for aligned Shift palette). |

## Legacy / experimental

| File | Use |
|------|-----|
| `iterum-experimental-theme.css` | Nordic + vintage + dark helpers — **not** default; opt-in only. |

## Token checklist (A4)

Defined in `iterum-brand-kit.css` (source of truth). Use these names in new UI:

| Token role | Typical variable |
|------------|-------------------|
| Page background | `--brand-bg-secondary` |
| Card / surface | `--brand-card-bg`, `--brand-bg-primary` |
| Border | `--brand-border-light` |
| Primary text | `--brand-text-primary` |
| Muted text | `--brand-text-muted` |
| Primary CTA / accent | `--brand-primary-accent` |
| Secondary accent | `--brand-secondary-accent` |
| Danger (sparingly) | Tailwind semantic or existing modal tokens |

## Inventory notes

- **Removed from golden path default:** `nordic-design-system.css`, `modern-nordic-vintage.css`, `dark-mode-enhancements.css` (moved to experimental bundle).
- **Duplicate `<link>` blocks** at bottom of `<head>` (e.g. second `iterum-brand-kit`) should be deleted when touching a file.
