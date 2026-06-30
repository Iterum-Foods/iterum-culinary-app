# Pilot script — override cost regression (slice 3)

**Purpose:** Confirm workspace vendor price overrides flow through to recipe and menu costing after slice 3.

**Time:** ~5 minutes · **Requires:** signed-in pilot account with an active workspace

---

## Steps

1. **Pick a test ingredient** used in at least one recipe (e.g. `Heavy cream`).
2. Open **Ingredient library** — note current cost badge (missing, library, or override).
3. Open **Vendor management → Workspace price overrides** and set a distinct unit cost for that ingredient (e.g. `$4.2500/lb`). Save.
4. Return to **Ingredient library** — row should show **Workspace override** hint with the new price.
5. Open **Recipe Developer** with that ingredient in the recipe:
   - **Live costing** sidebar should update batch / portion cost.
   - Expand **Price sources** — ingredient should list **Workspace override** (and “was $X” if a library price existed).
6. Open **Menu Builder** with a menu item linked to that recipe:
   - **Price sources** panel under Menu Overview should include at least one workspace override chip.
7. **Change the override** (e.g. bump to `$5.0000/lb`), save, reload Recipe Developer:
   - Portion cost and override line should reflect the new value without clearing local recipe data.

---

## Pass criteria

- Override appears in ingredient hints (slice 2).
- Recipe Developer live cost and price-source panel use the override.
- Menu Builder aggregated price sources mention overrides when menu items have linked recipes.
- Editing override updates displayed costs after refresh (no stale library-only math).

---

## Automation note

Prod smoke checks module load (`iterumRecipePriceSources` on menu-builder / recipe-developer). Full override round-trip remains a **manual pilot** check until Firestore test fixtures exist.
