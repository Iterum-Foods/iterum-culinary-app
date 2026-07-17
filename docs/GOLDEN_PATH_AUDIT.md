# Golden path audit — Setup · Vendors · Ingredients · Recipes

**Purpose:** Map the **exact files** behind the core customer journey and a **phased task list**.  
For **design or token changes that must hit every web page**, use [WEB_APP_DESIGN_CHANGE_WORKFLOW.md](./WEB_APP_DESIGN_CHANGE_WORKFLOW.md) after this map.  
**Slice 3 shipped:** recipe + menu **Price sources** panel (`recipe-price-sources.js`); live costing wired in Recipe Developer; override regression script for pilots.  
**Last updated:** 19 May 2026

---

## File map (by area)

### Setup / workspace / roles

| Surface                                       | Files                                                                                                                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace questionnaire                       | `public/setup.html`                                                                                                                                             |
| Operator profile (scope, role, feature flags) | `public/assets/js/user-role-setup.js`                                                                                                                           |
| Project / workspace selection                 | `public/assets/js/unified-project-selector.js`, `public/assets/js/project-management-system.js`, `public/project-hub.html`                                      |
| Firestore project + membership bootstrap      | `public/assets/js/firestore-sync.js` (`ensureProjectDoc`, `resolveProjectId`), `public/assets/js/project-membership.js`, `public/assets/js/project-hub-team.js` |

### Vendors

| Surface                                           | Files                                                                                                                                    |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Vendor hub UI                                     | `public/vendor-management.html`                                                                                                          |
| Vendor CRUD, merge, Firestore push                | `public/assets/js/vendorManager.js`                                                                                                      |
| Firestore `users/{uid}/vendors/*`                 | `public/assets/js/firestore-sync.js` (`syncVendorsToFirestore`, `fetchVendorsFromFirestore`, `vendorFirestoreDocId`)                     |
| **Price overrides** `users/{uid}/vendor_prices/*` | `public/assets/js/firestore-sync.js` (`syncVendorPriceRowToFirestore`, `getVendorPriceOverridesMap`, `refreshVendorPricesFromFirestore`) |
| Price override **panel (slice 1)**                | `public/assets/js/vendor-price-overrides-panel.js`                                                                                       |
| Price list upload (separate flow)                 | `public/price-list-upload.html` (if present)                                                                                             |

### Ingredients

| Surface                                  | Files                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Ingredient library page                  | `public/ingredients.html`                                                                                                            |
| Ingredient data / local + cloud patterns | `public/assets/js/*` (search `ingredients_database`, `custom_ingredients` in [DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md)) |
| Costing consumption of vendor prices     | `public/assets/js/cost-calculator.js` (`applyFirestoreVendorPriceOverrides`)                                                         |
| **Cost hints + override badges (slice 2)** | `public/assets/js/ingredient-cost-hints.js`, `public/assets/css/ingredient-cost-hints.css`                                          |

### Recipes

| Surface                   | Files                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Recipe library            | `public/recipe-library.html`                                                                                 |
| Recipe developer / editor | `public/recipe-developer.html`, `public/recipe-canvas.html`                                                  |
| Menu + costing            | `public/menu-builder.html`, `public/assets/js/menuManager.js`, `public/assets/js/menu-recipe-integration.js` |
| Shared costing            | `public/assets/js/cost-calculator.js`                                                                        |
| **Price sources UI (slice 3)** | `public/assets/js/recipe-price-sources.js`, `public/assets/css/recipe-price-sources.css`              |

---

## Phased task list

### Done — Slice 1

- [x] Audit doc (this file).
- [x] Setup: “First 10 minutes” golden path + links to vendors → ingredients → recipes.
- [x] Vendors: **Workspace price overrides** panel (add / list / delete; workspace vs account default).

### Done — Slice 2 (ingredients)

- [x] Ingredient page: surface **missing cost** / **override hint** when a `vendor_prices` row exists for the active workspace.
- [x] Quick link from ingredient row → vendor hub with ingredient name pre-filled in override form (`?ingredient=` query param).

### Done — Slice 3 (recipes)

- [x] Recipe / menu costing UI: short “**Price sources**” tooltip (local vs Firestore override).
- [x] Regression test: change override → reopen recipe cost reflects change ([PILOT_OVERRIDE_COST_REGRESSION.md](./PILOT_OVERRIDE_COST_REGRESSION.md)).

### Next — Slice 4 (setup hardening)

- [ ] Optional: redirect new users without `iterum_current_project` to `project-hub.html` once before deep links.
- [x] Align copy: “Workspace” = Firestore `projectId` in teammate checklist + vendor override panel (A≠B instructions).

---

## Related docs

- [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) — E3 vendor / price model
- [E3_PROD_VERIFY.md](./E3_PROD_VERIFY.md) — prod A≠B + Deploy Firebase gate
- [HOW_WE_SHIP.md](./HOW_WE_SHIP.md) — E3 prep questions
- [DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md) — paths and keys
