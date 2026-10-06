# CTO — solo-user tech bar (16 Sep 2026)

**Authority:** [CEO_DIRECTIVE_SINGLE_USER_LAUNCH.md](./CEO_DIRECTIVE_SINGLE_USER_LAUNCH.md)  
**Audience:** Eng agent + founder  
**Status:** Execution bar for next **2 weeks** — single Firebase uid, one workspace. Orgs / connecting = Phase 2.

Full memo lives in the CTO persona thread; this file is the durable punch list + gate notes.

---

## Hard blocker — Deploy Firebase

| Fact | Detail |
|------|--------|
| **Last green Deploy Firebase** | **2026-10-06** — [run 37505466056](https://github.com/Iterum-Foods/iterum-culinary-app/actions/runs/37505466056) (**success**) |
| **Prior fail** | **2026-09-02** `workflow_dispatch` — **failure** (invalid `FIREBASE_TOKEN` / HTTP 401) |
| **Repo vs prod** | E3 `vendor_prices` + maintainer rules redeployed with the 6 Oct green run — treat as **live** unless a later smoke shows otherwise |

### Exact steps (do today)

From [E3_PROD_VERIFY.md](./E3_PROD_VERIFY.md) Gate 0 + [HOW_WE_SHIP.md](./HOW_WE_SHIP.md):

1. Locally: `npx firebase-tools@15.12.0 login:ci` (if invalid: `login --reauth` first).
2. Paste token → GitHub **Settings → Secrets → Actions → `FIREBASE_TOKEN`**.
3. **Actions → Deploy Firebase → Run workflow** (no commit needed if only secret changed).
4. **Pass:** latest run on `main` = **success** for project `iterum-culinary-app2`.
5. Then: `$env:ITERUM_BASE_URL="https://iterum-culinary-app.vercel.app"; npm run test:smoke:prod`

**Note:** CLI warns `FIREBASE_TOKEN` is deprecated — migrate to service-account / `GOOGLE_APPLICATION_CREDENTIALS` when green again; **do not block** solo launch on that migration.

**Solo launch:** Gate 0 green is **required**. Gate 1 A≠B is **not** a solo launch gate (still do for trust when convenient).

---

## Solo golden path (file map)

| Step | Primary surfaces |
|------|------------------|
| Setup / one workspace | `public/setup.html`, `public/assets/js/user-role-setup.js`, `public/assets/js/project-management-system.js`, `public/assets/js/firestore-sync.js`, `public/project-hub.html` |
| Stock / ingredients | `public/stock-setup.html`, `public/assets/js/stock-setup-page.js`, `public/ingredients.html` |
| Bar well | `public/bar-ops.html`, `public/assets/js/bar-inventory-store.js` (`projects/{pid}/snapshots/bar_inventory`) |
| Recipe / cocktail | `public/recipe-developer.html`, `public/recipe-library.html`, `public/recipe-canvas.html`, `public/assets/js/wusong-drink-seed.js` |
| Menu / bar program | `public/menu-builder.html`, `public/assets/js/menuManager.js`, `public/bar-ops.html`, dashboard Bar card |
| Dashboard / shift | `public/dashboard.html`, `public/mobile-compliance.html`, `public/assets/js/workspace-save-indicator.js` |
| Export / archive | `public/archive-hub.html`, `public/data-backup-center.html`, `public/assets/js/backup-manager.js`, `public/assets/js/data_export_import.js` |
| Shared access | `public/assets/js/project-data-access.js`, `docs/DATA_ACCESS_INVENTORY.md`, `docs/SOURCE_OF_TRUTH.md` |

---

## Top 5 friction bugs (solo)

1. **Master Project default** — chip / selector falls back to “Master Project” even when restaurant workspaces exist (`dashboard-core.js`, `unified-project-selector.js`, owner-bot MAJOR).
2. **Recipe library Export is a stub** — `exportRecipes()` in `recipe-library.html` logs only; real path is Archive / backup center.
3. **Local-first recipes/menus** — cloud is backup where wired (`SOURCE_OF_TRUTH.md`); new device / clear storage feels like “missing cloud save.”
4. **Setup still offers restaurant group** — org-shaped UX during single-user GTM (`setup.html` scope radios).
5. **Prod rules lag** — E3 / later membership rules in git since Apr 7 may not be on prod → surprise `permission-denied` on price overrides / teammate paths.

---

## STOP this sprint

- Org / multi-unit UI polish, restaurant-group onboarding as primary path  
- Teammate invite / RBAC as launch gate  
- E3 A≠B as **launch** gate (still deploy rules)  
- Store apps, POS/EDI, SSO  

---

## Eng tickets (2 weeks) — see CTO memo for acceptance criteria

| ID | Pri | Title |
|----|-----|-------|
| S0 | P0 | Unblock Deploy Firebase (`FIREBASE_TOKEN`) |
| S1 | P0 | L1 prod page confirm (bar-ops, stock, order-guides, price-list) |
| S2 | P0 | Kill Master Project as solo default |
| S3 | P0 | Solo smoke: setup → stock/bar → recipe → menu → shift → archive |
| S4 | P1 | Honest save / sync UX on golden-path pages |
| S5 | P1 | Wire or redirect recipe Export; Archive one-click |
| S6 | P1 | Soften setup: default single, de-emphasize group |
| S7 | P2 | Optional: no-project → project-hub redirect |
| S8 | P2 | Document SA migration for Firebase CI (non-blocking) |

---

## Risks if ship solo without teammate / E3 A≠B

| Risk | Severity for solo |
|------|-------------------|
| Stale rules → owner writes fail | High if Gate 0 still red |
| Device loss / local-first | High for career-cook story |
| Silent wrong workspace (Master) | High UX / data confusion |
| A≠B unverified | Low for one workspace; medium for trust narrative |
| Teammate untested | Low for solo GTM; debt for Phase 2 |

---

## Revision

| Date | Change |
|------|--------|
| 2026-09-16 | Initial CTO solo tech bar after CEO single-user lock. |
