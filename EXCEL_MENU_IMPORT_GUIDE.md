# 📊 Excel Menu Import Guide

## ✅ **Excel Import Now Supported!**

You can now easily upload your Excel menu files (.xlsx or .xls) directly to the Menu Builder. The system will automatically detect columns and import your dishes with prices, descriptions, dish builds, and recipes.

---

## 📋 **Supported Excel Column Formats**

The import system automatically recognizes these column names (case-insensitive):

### **Required Columns:**
- **Name/Item/Dish/Menu Item/Title** - The dish name
- **Price/Cost/$/Amount** - The price (can be formatted as $24.00 or 24.00)

### **Optional Columns:**
- **Category/Type/Section/Group** - Menu category (e.g., "Appetizers", "Main Courses")
- **Description/Desc/Details/Notes** - Dish description
- **Ingredients/Ingredient/Components** - List of ingredients
- **Recipe/Dish Build/Build** - Recipe or dish build information
- **Allergen/Allergy/Dietary** - Allergen information (comma-separated)

---

## 📝 **Excel File Format Examples**

### **Example 1: Simple Menu Format**

| Name | Price | Category | Description |
|------|-------|----------|-------------|
| Hamachi Crudo | $17 | Small Bites | Fresh hamachi with yuzu and microgreens |
| Wagyu Hot Dog | $20 | Entrées | Wagyu beef hot dog with special toppings |
| Shaved Fennel Caesar | $16 | Salads | Classic caesar with shaved fennel |

### **Example 2: Full Menu with Dish Builds**

| Name | Price | Category | Description | Ingredients | Dish Build | Allergens |
|------|-------|----------|-------------|-------------|------------|-----------|
| Hamachi Crudo | $17 | Small Bites | Fresh hamachi with yuzu | Hamachi, Yuzu, Microgreens | Slice hamachi, drizzle yuzu, garnish | Fish |
| Wagyu Hot Dog | $20 | Entrées | Premium wagyu hot dog | Wagyu hot dog, Bun, Toppings | Grill hot dog, toast bun, assemble | Gluten, Dairy |

### **Example 3: Menu with Recipe Details**

| Name | Price | Category | Description | Recipe |
|------|-------|----------|-------------|--------|
| Hamachi Crudo | $17 | Small Bites | Fresh hamachi | 1. Slice hamachi into thin pieces<br>2. Arrange on plate<br>3. Drizzle yuzu<br>4. Garnish with microgreens |
| Wagyu Hot Dog | $20 | Entrées | Premium wagyu hot dog | 1. Grill wagyu hot dog<br>2. Toast bun<br>3. Add toppings<br>4. Serve hot |

---

## 🚀 **How to Import Your Excel Menu**

### **Step 1: Prepare Your Excel File**
1. Open your Excel file
2. Make sure the first row contains column headers
3. Ensure at least one column has dish names
4. Save your file (as .xlsx or .xls)

### **Step 2: Import in Menu Builder**
1. Go to **Menu Builder** page
2. Click **"📁 Import Menu"** button
3. Select **"Import from File"**
4. Choose your Excel file (.xlsx or .xls)
5. Select **"Excel (.xlsx)"** or **"Excel (.xls)"** from format dropdown (or leave as "Auto-detect")
6. Check your import options:
   - ✅ **Auto-categorize items** - Automatically assign categories
   - ✅ **Extract prices** - Extract prices from cells
   - ✅ **Detect descriptions** - Detect descriptions from text
7. Click **"Import & Parse"**

### **Step 3: Review Imported Items**
1. Review the preview of imported dishes
2. Check that prices, descriptions, and categories are correct
3. For each dish, choose:
   - **Link to Existing Dish** - If the dish already exists in your database
   - **Create New Dish** - To create a new dish entry
4. Click **"Apply to Menu"** when ready

---

## 💡 **Tips for Best Results**

### **Column Naming:**
- Use clear, descriptive column names
- The system recognizes variations (e.g., "Name", "Item Name", "Dish Name" all work)
- Case doesn't matter (e.g., "PRICE" = "Price" = "price")

### **Price Formatting:**
- Prices can be formatted as: `$24.00`, `24.00`, `24`, or `$24`
- The system will extract the numeric value automatically

### **Categories:**
- If you don't have a Category column, the system will auto-categorize based on dish names
- Common categories: Appetizers, Salads, Entrées, Desserts, Beverages

### **Multiple Sheets:**
- Currently imports from the **first sheet** only
- If you have multiple menus, import them one at a time

### **Ingredients & Recipes:**
- Ingredients can be listed in a single column (comma-separated or line-separated)
- Recipe/Dish Build information can include step-by-step instructions
- These will be preserved and can be used when creating recipes

---

## 🔧 **Troubleshooting**

### **"Excel parser not loaded" Error:**
- Refresh the page and try again
- Make sure you're using a modern browser (Chrome, Firefox, Safari, Edge)

### **Prices Not Importing:**
- Check that your Price column is named correctly (Price, Cost, $, Amount)
- Ensure prices are numeric values (not text)
- Try enabling "Extract prices" option

### **Categories Not Detected:**
- Add a Category column to your Excel file
- Or enable "Auto-categorize items" option

### **Some Dishes Missing:**
- Check that dish names are in the first column (or Name column)
- Empty rows are automatically skipped
- Make sure dish names are at least 2 characters long

### **Special Characters Not Showing:**
- Excel files with special characters should work fine
- If issues occur, try saving as CSV and importing that instead

---

## 📊 **CSV Import (Alternative)**

If Excel import doesn't work, you can:
1. Save your Excel file as CSV (File → Save As → CSV)
2. Import the CSV file instead
3. CSV import supports the same column formats

---

## ✅ **What Gets Imported**

When you import an Excel menu, the system will:
- ✅ Import all dishes with names and prices
- ✅ Assign categories (from column or auto-detected)
- ✅ Preserve descriptions
- ✅ Save ingredients information
- ✅ Store dish build/recipe information
- ✅ Record allergen information
- ✅ Allow you to link dishes to existing recipes or create new ones

---

## 🎯 **Next Steps After Import**

After importing your menu:
1. **Review Dishes** - Check that all dishes imported correctly
2. **Link Recipes** - Connect each dish to its recipe (or create new recipes)
3. **Add Photos** - Upload photos for each dish
4. **Set Prep Info** - Add prep times, yields, and shelf life
5. **Create FOH Notes** - Generate server information sheets

---

## 📞 **Need Help?**

If you encounter issues:
1. Check the browser console (F12) for error messages
2. Try saving as CSV and importing that instead
3. Make sure your Excel file has headers in the first row
4. Verify that dish names are in a recognizable column

---

**Happy Menu Building! 🍽️**

