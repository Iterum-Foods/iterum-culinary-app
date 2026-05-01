# Menu Import Workflow

Step-by-step playbook for importing a menu (with pricing, categories, descriptions, allergens, and dish build notes) into Iterum with minimal cleanup.

---

## Goal

Get a full menu into the app quickly while preserving:

- Item names
- Prices
- Categories/sections
- Descriptions
- Ingredients/components
- Dish build or recipe notes
- Allergen/dietary flags

---

## Who This Is For

- New users setting up their first menu
- Managers onboarding a new location
- Culinary leads moving from spreadsheets to Iterum

---

## Before You Start

1. Sign in and select the correct project/workspace.
2. Confirm you can open `menu-builder.html`.
3. Prepare your source file in Excel (`.xlsx` preferred; `.xls` works).
4. Ensure the first row contains headers.

---

## Recommended Spreadsheet Format

Use these columns (case-insensitive):

- `Name` (or `Item`, `Dish`, `Menu Item`, `Title`) **required**
- `Price` (or `Cost`, `$`, `Amount`) **required**
- `Category` (or `Section`, `Type`, `Group`)
- `Description` (or `Notes`, `Details`)
- `Ingredients` (components list)
- `Dish Build` (or `Recipe`, `Build`)
- `Allergens` (comma-separated, e.g. `Fish, Dairy`)

Example row:

- Name: `Hamachi Crudo`
- Price: `$17`
- Category: `Small Plates`
- Description: `Yuzu, radish, microgreens`
- Ingredients: `Hamachi, yuzu, radish, microgreens`
- Dish Build: `Plate chilled fish, season, finish with garnish`
- Allergens: `Fish`

---

## Import Steps (Operator Workflow)

1. Open `menu-builder.html`.
2. Click `Import Menu`.
3. Choose `Import from File`.
4. Select your Excel file.
5. Keep format on `Auto-detect` (or choose `Excel (.xlsx)`).
6. Enable:
   - `Auto-categorize items` (if categories are incomplete)
   - `Extract prices`
   - `Detect descriptions`
7. Click `Import & Parse`.
8. Review preview carefully:
   - check price parsing
   - verify categories
   - confirm no missing rows
9. For each dish:
   - Link to existing dish/recipe, or
   - Create a new dish entry
10. Click `Apply to Menu`.

---

## New User Quality Check (5 minutes)

After import:

1. Spot-check 5 random items:
   - Name is correct
   - Price is correct
   - Category is correct
2. Confirm no blank/duplicate dish names.
3. Open 2 imported items and verify dish build/allergen content survived.
4. Save/publish the menu snapshot for team/mobile visibility.

---

## Common Errors and Fixes

- **Prices not detected**
  - Use numeric formats like `17`, `17.00`, `$17`.
  - Remove text like `Market Price` from numeric price cells.

- **Rows missing**
  - Remove blank lines between items.
  - Ensure item names are at least 2 characters.

- **Wrong categories**
  - Add an explicit `Category` column and re-import.

- **Special character issues**
  - Save as `.xlsx` and retry.
  - Fallback: export CSV and import CSV.

- **Import parser errors**
  - Refresh page, retry file.
  - Validate header row is first row.

---

## Team Rollout Sequence (Multi-Location)

1. Import menu in one “pilot” project.
2. Validate with chef lead and purchasing.
3. Standardize the spreadsheet template.
4. Reuse that template for each location.
5. Have managers perform the 5-minute quality check after each import.

---

## Fast Start Template (Copy This Header Row)

Use this exact header row in Excel:

`Name | Price | Category | Description | Ingredients | Dish Build | Allergens`

---

## Optional: Export as PDF

If you want this as a PDF for staff handouts:

1. Open this file in Cursor/VS Code preview.
2. Print to PDF (`Ctrl+P` -> `Save as PDF`).
3. Share in onboarding packets or SOP docs.

