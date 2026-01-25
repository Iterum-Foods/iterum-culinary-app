# 🚀 Inventory Generation from Recipes & Menus - Complete Guide

## ✅ **What's Been Added**

### **New Module: `inventory-generator.js`**

Automatically generates inventory items from:
- ✅ **Recipes** - All ingredients in recipes
- ✅ **Menus** - All ingredients in menu items (via their recipes)
- ✅ **Both** - Combined generation

### **Features:**
- ✅ Links to ingredient database via `ingredientId`
- ✅ Extracts unique ingredients (no duplicates)
- ✅ Unit conversion support
- ✅ Progress tracking
- ✅ Skips existing items (or overwrites if option selected)
- ✅ Tracks source (which recipes/menus used each ingredient)

---

## 🎯 **How It Works**

### **Architecture Flow:**

```
Recipes/Menus
    ↓
Extract Ingredients (with ingredientId)
    ↓
Look up in Ingredient Database
    ↓
Create Inventory Items
    ↓
Link via ingredientId
    ↓
Ready for Costing & Tracking
```

### **Data Linking:**

1. **Recipe** → Contains ingredients with `ingredientId`
2. **Ingredient Database** → Master list with pricing, units, etc.
3. **Inventory** → Links to ingredient via `ingredientId`
4. **Result**: Complete integration for costing and tracking

---

## 🚀 **How to Use**

### **Step 1: Open Inventory Page**

1. Go to **Inventory** page
2. Click **"🚀 Generate from Recipes/Menus"** button

### **Step 2: Select Options**

1. **From Recipes** - Check to generate from recipes
2. **From Menus** - Check to generate from menus
3. **Overwrite Existing** - Check to update existing items (optional)

### **Step 3: Generate**

1. Click **"Generate Inventory"**
2. Watch progress bar
3. See results summary
4. Click **"Close & Refresh"**

### **Step 4: Verify**

1. Check inventory table
2. See new items linked to ingredients
3. All items have `ingredientId` linking to database

---

## 📊 **What Gets Created**

### **For Each Unique Ingredient:**

```javascript
{
  id: "inv_usda_001_1234567890",
  ingredientId: "usda_001",           // Links to ingredient database
  ingredientName: "Chicken Breast",    // From ingredient database
  category: "Proteins",               // From ingredient database
  
  quantity: 0,                        // Default (you set stock later)
  unit: "lb",                         // From ingredient default_unit
  location: "Main Kitchen",           // Default location
  
  unitCost: 4.99,                     // From ingredient database
  vendor: "Default",                  // From ingredient if available
  
  notes: "Auto-generated from recipes: Sourdough Bread, Chicken Soup",
  tags: ["auto-generated", "from-recipes", "proteins"],
  sourceRecipes: ["Sourdough Bread", "Chicken Soup"], // Which recipes use it
  
  createdAt: "2025-01-XX...",
  updatedAt: "2025-01-XX..."
}
```

---

## 🔗 **Linking to Ingredient Database**

### **How Linking Works:**

1. **Recipe has ingredient**:
   ```javascript
   {
     ingredientId: "usda_001",
     name: "Chicken Breast",
     quantity: 500,
     unit: "g"
   }
   ```

2. **System looks up in ingredient database**:
   ```javascript
   {
     id: "usda_001",
     name: "Chicken Breast",
     default_unit: "lb",
     cost: 4.99,
     category: "Proteins"
   }
   ```

3. **Creates inventory item**:
   ```javascript
   {
     ingredientId: "usda_001",  // ← Links to database
     ingredientName: "Chicken Breast",
     unit: "lb",                // Uses ingredient default_unit
     unitCost: 4.99            // From ingredient database
   }
   ```

### **Benefits:**

- ✅ **Automatic pricing** from ingredient database
- ✅ **Correct units** from ingredient standard units
- ✅ **Category organization** from ingredient database
- ✅ **Vendor info** if available in ingredient
- ✅ **Complete integration** for costing

---

## 📋 **Use Cases**

### **Use Case 1: Generate from All Recipes**

**Scenario**: You have 50 recipes and want inventory for all ingredients

1. Click "Generate from Recipes/Menus"
2. Check "From Recipes"
3. Uncheck "From Menus"
4. Click "Generate"
5. **Result**: Inventory items for all unique ingredients in recipes

### **Use Case 2: Generate from Menu**

**Scenario**: You have a menu and want inventory for all menu ingredients

1. Click "Generate from Recipes/Menus"
2. Check "From Menus"
3. Uncheck "From Recipes"
4. Click "Generate"
5. **Result**: Inventory items for all ingredients in menu items (via recipes)

### **Use Case 3: Generate from Both**

**Scenario**: Complete inventory setup

1. Click "Generate from Recipes/Menus"
2. Check both "From Recipes" and "From Menus"
3. Click "Generate"
4. **Result**: Comprehensive inventory from all sources

---

## ✅ **What's Linked**

### **Inventory → Ingredient Database:**

- ✅ `ingredientId` - Direct link
- ✅ `ingredientName` - From database
- ✅ `unit` - Uses ingredient `default_unit`
- ✅ `unitCost` - From ingredient pricing
- ✅ `category` - From ingredient category
- ✅ `vendor` - From ingredient supplier (if available)

### **Inventory → Recipes:**

- ✅ `sourceRecipes` - Which recipes use this ingredient
- ✅ `notes` - Lists source recipes
- ✅ `tags` - Includes "from-recipes" tag

### **Inventory → Menus:**

- ✅ `sourceMenus` - Which menus use this ingredient
- ✅ `sourceMenuItems` - Which menu items use it
- ✅ `notes` - Lists source menus
- ✅ `tags` - Includes "from-menus" tag

---

## 🎯 **Workflow Integration**

### **Complete Workflow:**

1. **Import Ingredients** → Build ingredient database (USDA + custom)
2. **Create Recipes** → Use ingredients from database
3. **Create Menus** → Link recipes to menu items
4. **Generate Inventory** → Auto-create inventory from recipes/menus
5. **Add Stock** → Set actual quantities
6. **Track Usage** → Recipes deduct from inventory
7. **Cost Recipes** → Uses ingredient prices from database
8. **Cost Menus** → Uses recipe costs (from ingredient costs)

---

## 🔧 **Technical Details**

### **Generation Process:**

1. **Load Recipes/Menus** → Get all recipes/menus for current project
2. **Extract Ingredients** → Get all ingredients with `ingredientId`
3. **Lookup in Database** → Find ingredient details
4. **Deduplicate** → One inventory item per unique ingredient
5. **Create Items** → Generate inventory items with links
6. **Save** → Store in inventory storage

### **Linking Validation:**

- ✅ Checks ingredient exists in database
- ✅ Uses ingredient default unit
- ✅ Pulls pricing from ingredient
- ✅ Links via `ingredientId` (foreign key)

---

## 📊 **Expected Results**

### **From 50 Recipes:**
- **Unique Ingredients**: ~100-200 (depends on variety)
- **Inventory Items Created**: ~100-200
- **Time**: 5-10 seconds

### **From 1 Menu (15 items):**
- **Unique Ingredients**: ~30-50
- **Inventory Items Created**: ~30-50
- **Time**: 2-5 seconds

### **From Both:**
- **Combined**: All unique ingredients
- **Deduplicated**: No duplicates
- **Time**: 10-15 seconds

---

## ✅ **Verification Checklist**

After generating, verify:

- [ ] Inventory items have `ingredientId` field
- [ ] `ingredientId` matches ingredient database
- [ ] Units match ingredient `default_unit`
- [ ] Pricing pulled from ingredient database
- [ ] Categories match ingredient categories
- [ ] Source recipes/menus listed in notes
- [ ] Items appear in inventory table
- [ ] Can select items in recipe developer
- [ ] Costing works with inventory items

---

## 🎉 **Benefits**

### **For You:**

- ✅ **Automatic Setup** - No manual entry needed
- ✅ **Complete Linking** - Everything connected
- ✅ **Accurate Pricing** - From ingredient database
- ✅ **Proper Units** - Uses ingredient standard units
- ✅ **Source Tracking** - Know which recipes/menus use each item

### **For Costing:**

- ✅ **Automatic Cost Calculation** - Uses ingredient prices
- ✅ **Unit Conversion** - Handles different units
- ✅ **Recipe Costing** - Accurate recipe costs
- ✅ **Menu Costing** - Accurate menu costs

### **For Inventory:**

- ✅ **Complete Coverage** - All ingredients tracked
- ✅ **Usage Tracking** - Know what's used in recipes
- ✅ **Reorder Planning** - Based on recipe usage
- ✅ **Waste Tracking** - Track actual vs. expected usage

---

## 🚀 **Next Steps**

1. **Generate Inventory** → Click button and generate
2. **Add Stock Quantities** → Set actual stock levels
3. **Set Par Levels** → Configure reorder points
4. **Link Vendors** → Add vendor information
5. **Start Tracking** → Use in recipes and menus

---

**🎊 You now have automatic inventory generation from recipes and menus, fully linked to your ingredient database!**
