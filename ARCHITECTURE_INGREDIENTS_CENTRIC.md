# 🏗️ Architecture: Ingredients-Centric System

**The Ingredients List is the foundation - everything builds from it**

---

## 📊 System Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    INGREDIENTS LIST                          │
│              (Master Database - Foundation)                  │
│                                                               │
│  • Base ingredients (100+ professional items)                │
│  • Custom ingredients                                        │
│  • Standard units, categories, nutritional data              │
│  • Allergens, dietary info, substitutes                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ References
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      INVENTORY                               │
│         (Vendor Deliveries → Unit Conversion)               │
│                                                               │
│  • Links to Ingredients List (ingredientId)                  │
│  • Vendor units converted to ingredient standard units       │
│  • Quantity tracking, locations, par levels                  │
│  • Reorder points, cost tracking                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Cross-references
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      ORDERING                                │
│         (Cross-referenced with Inventory)                    │
│                                                               │
│  • Uses Ingredients List for item selection                  │
│  • Checks Inventory for current stock levels                │
│  • Generates orders based on par levels                      │
│  • Receives orders → Updates Inventory                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Built from
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              PREP RECIPES & PLATINGS                         │
│         (Built from Ingredients List)                        │
│                                                               │
│  • Recipe ingredients reference Ingredients List (ingredientId)│
│  • Unit conversion for recipe quantities                     │
│  • Cost calculation from ingredient prices                   │
│  • When made → Deducts from Inventory                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Built from
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        MENUS                                 │
│         (Built from Prep Recipes & Platings)                 │
│                                                               │
│  • Menu items link to recipes                                │
│  • Recipes use ingredients from Ingredients List             │
│  • Menu costs calculated from recipe costs                   │
│  • Recipe costs calculated from ingredient costs             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Principles

### **1. Ingredients List = Single Source of Truth**

- **All ingredients** must exist in the Ingredients List first
- **No orphaned ingredients** in inventory, recipes, or menus
- **Standard units** defined in Ingredients List
- **Ingredient IDs** used as foreign keys throughout system

### **2. Inventory = Vendor Deliveries with Unit Conversion**

- **Inventory items** link to Ingredients List via `ingredientId`
- **Vendor units** (e.g., "case", "box", "50 lb bag") converted to ingredient standard units
- **Unit Converter** handles: weight (g, kg, oz, lb), volume (ml, l, fl oz, cup), count (piece, each, bunch)
- **Inventory quantities** stored in ingredient's standard unit

### **3. Ordering = Cross-Reference System**

- **Order items** reference Ingredients List
- **Checks Inventory** for current stock levels
- **Compares** current stock to par levels
- **Generates orders** based on reorder points
- **Receives orders** → Updates Inventory (with unit conversion)

### **4. Recipes & Platings = Built from Ingredients**

- **Recipe ingredients** must reference Ingredients List (`ingredientId`)
- **Recipe quantities** use ingredient standard units (or convert)
- **Cost calculation** pulls from ingredient prices
- **When recipe made** → Deducts from Inventory (with unit conversion)

### **5. Menus = Built from Recipes**

- **Menu items** link to recipes
- **Recipes** link to ingredients
- **Menu costs** = Sum of recipe costs
- **Recipe costs** = Sum of ingredient costs

---

## 🔄 Data Flow Examples

### **Example 1: Adding Inventory from Vendor Delivery**

```
1. Vendor delivers: "50 lb bag of Flour"
2. System looks up "Flour" in Ingredients List
   - Finds: { id: "ing_042", name: "All-Purpose Flour", default_unit: "lb" }
3. Unit Converter converts: 50 lb → 50 lb (already standard unit)
4. Inventory Manager creates:
   {
     ingredientId: "ing_042",
     ingredientName: "All-Purpose Flour",
     quantity: 50,
     unit: "lb",
     vendorUnit: "bag",
     vendorQuantity: 1,
     location: "Dry Storage"
   }
5. Inventory updated, linked to Ingredients List
```

### **Example 2: Creating Recipe from Ingredients**

```
1. Chef creates recipe: "Sourdough Bread"
2. Adds ingredients from Ingredients List:
   - Flour: { ingredientId: "ing_042", quantity: 500, unit: "g" }
   - Water: { ingredientId: "ing_089", quantity: 350, unit: "ml" }
   - Salt: { ingredientId: "ing_015", quantity: 10, unit: "g" }
3. Recipe saved with ingredient references
4. Cost Calculator:
   - Looks up ingredient prices from Ingredients List
   - Calculates recipe cost
5. When recipe made:
   - Inventory Manager deducts:
     - Flour: 500g (converts from lb if needed)
     - Water: 350ml
     - Salt: 10g
```

### **Example 3: Ordering Based on Inventory**

```
1. System checks Inventory for low stock
2. Finds: Flour (ingredientId: "ing_042") below reorder point
3. Ordering System:
   - References Ingredients List for ingredient details
   - Checks Inventory for current quantity
   - Compares to par level
   - Generates order item:
     {
       ingredientId: "ing_042",
       ingredientName: "All-Purpose Flour",
       orderQuantity: 50,
       orderUnit: "lb",
       vendorUnit: "bag",
       vendorQuantity: 1
     }
4. Order placed with vendor
5. When received:
   - Unit Converter converts vendor unit to standard
   - Inventory updated
```

### **Example 4: Building Menu from Recipes**

```
1. Chef creates menu item: "Sourdough Bread Basket"
2. Links to recipe: "Sourdough Bread" (recipeId: "recipe_123")
3. Recipe references ingredients:
   - Flour (ingredientId: "ing_042")
   - Water (ingredientId: "ing_089")
   - Salt (ingredientId: "ing_015")
4. Menu cost calculation:
   - Recipe cost = Sum of ingredient costs
   - Menu item cost = Recipe cost
   - Menu price = Cost + Margin
```

---

## 📁 Data Structure

### **Ingredients List (Master)**

```javascript
{
  id: "ing_042",                    // Unique ID (used as foreign key)
  name: "All-Purpose Flour",        // Standard name
  category: "Grains & Pasta",
  default_unit: "lb",               // Standard unit
  common_units: ["lb", "oz", "g", "kg"],
  avg_price_per_lb: 0.50,          // Base pricing
  nutritional_info: { ... },
  allergens: ["gluten"],
  dietary: ["vegetarian", "vegan"],
  substitutes: ["Whole Wheat Flour", "Bread Flour"]
}
```

### **Inventory (Links to Ingredients)**

```javascript
{
  id: "inv_001",
  ingredientId: "ing_042",          // Foreign key to Ingredients List
  ingredientName: "All-Purpose Flour", // Denormalized for display
  quantity: 50,                     // In ingredient's standard unit
  unit: "lb",                        // Must match ingredient default_unit
  location: "Dry Storage",
  parLevel: 25,
  reorderPoint: 10,
  vendorId: "vendor_001",
  vendorName: "Sysco",
  vendorUnit: "bag",                // Original vendor unit
  vendorQuantity: 1,                // Original vendor quantity
  unitCost: 0.50,
  lastUpdated: "2025-01-15T10:00:00Z"
}
```

### **Ordering (Cross-references Inventory & Ingredients)**

```javascript
{
  id: "order_001",
  vendorId: "vendor_001",
  items: [
    {
      ingredientId: "ing_042",       // References Ingredients List
      ingredientName: "All-Purpose Flour",
      orderQuantity: 50,             // In standard unit
      orderUnit: "lb",
      vendorUnit: "bag",             // Vendor's unit
      vendorQuantity: 1,
      unitPrice: 25.00,              // Price per vendor unit
      lineTotal: 25.00
    }
  ],
  status: "pending",
  createdAt: "2025-01-15T10:00:00Z"
}
```

### **Recipes (Built from Ingredients)**

```javascript
{
  id: "recipe_123",
  title: "Sourdough Bread",
  ingredients: [
    {
      ingredientId: "ing_042",       // References Ingredients List
      name: "All-Purpose Flour",
      quantity: 500,
      unit: "g",                     // Can differ from ingredient default_unit
      notes: "High protein preferred"
    },
    {
      ingredientId: "ing_089",
      name: "Water",
      quantity: 350,
      unit: "ml"
    }
  ],
  instructions: [ ... ],
  cost: 2.50,                        // Calculated from ingredient prices
  servings: 1
}
```

### **Menus (Built from Recipes)**

```javascript
{
  id: "menu_001",
  name: "Breakfast Menu",
  items: [
    {
      id: "menu_item_001",
      name: "Sourdough Bread Basket",
      recipeId: "recipe_123",        // References Recipe
      price: 8.00,
      cost: 2.50,                    // From recipe cost
      foodCostPercent: 31.25
    }
  ]
}
```

---

## 🔧 Implementation Requirements

### **1. Ingredients List Must Be Loaded First**

- ✅ Base ingredients database loads on app start
- ✅ Custom ingredients added to same list
- ✅ All ingredients have unique IDs
- ✅ Standard units defined for each ingredient

### **2. Inventory Must Link to Ingredients**

- ✅ Inventory items require `ingredientId`
- ✅ Unit conversion when vendor unit differs
- ✅ Inventory quantities in ingredient standard units
- ✅ Validation: ingredient must exist in Ingredients List

### **3. Ordering Must Cross-Reference**

- ✅ Order items reference Ingredients List
- ✅ Checks Inventory for current stock
- ✅ Compares to par levels
- ✅ Unit conversion for vendor units

### **4. Recipes Must Use Ingredients**

- ✅ Recipe ingredients require `ingredientId`
- ✅ Unit conversion for recipe quantities
- ✅ Cost calculation from ingredient prices
- ✅ Inventory deduction when recipe made

### **5. Menus Must Use Recipes**

- ✅ Menu items link to recipes
- ✅ Menu costs calculated from recipe costs
- ✅ Recipe costs calculated from ingredient costs

---

## ✅ Verification Checklist

### **Ingredients List (Foundation)**
- [ ] Base ingredients database loads (100+ items)
- [ ] Custom ingredients can be added
- [ ] All ingredients have unique IDs
- [ ] Standard units defined for each
- [ ] Ingredients persist across sessions

### **Inventory (Vendor → Ingredients)**
- [ ] Inventory items link to Ingredients List (`ingredientId`)
- [ ] Unit conversion works (vendor unit → standard unit)
- [ ] Inventory quantities in standard units
- [ ] Validation: ingredient must exist before adding inventory
- [ ] Inventory persists across sessions

### **Ordering (Cross-Reference)**
- [ ] Order items reference Ingredients List
- [ ] Checks Inventory for current stock
- [ ] Compares to par levels
- [ ] Unit conversion for vendor deliveries
- [ ] Receiving orders updates Inventory

### **Recipes (Built from Ingredients)**
- [ ] Recipe ingredients reference Ingredients List
- [ ] Unit conversion for recipe quantities
- [ ] Cost calculation from ingredient prices
- [ ] Making recipe deducts from Inventory
- [ ] Recipes persist across sessions

### **Menus (Built from Recipes)**
- [ ] Menu items link to recipes
- [ ] Menu costs calculated from recipe costs
- [ ] Recipe costs calculated from ingredient costs
- [ ] Menus persist across sessions

---

## 🚨 Common Issues & Solutions

### **Issue: Inventory item has no matching ingredient**

**Problem:** Inventory item references `ingredientId` that doesn't exist in Ingredients List

**Solution:**
1. Add ingredient to Ingredients List first
2. Then add inventory item
3. Validation: Check ingredient exists before saving inventory

### **Issue: Unit mismatch between inventory and ingredient**

**Problem:** Inventory unit doesn't match ingredient standard unit

**Solution:**
1. Use Unit Converter to convert vendor unit to standard unit
2. Store inventory quantity in standard unit
3. Display can show both: "50 lb (1 bag)"

### **Issue: Recipe ingredient not found in Inventory**

**Problem:** Recipe uses ingredient that has no inventory

**Solution:**
1. This is OK - recipe can use ingredient even if not in stock
2. When making recipe, check if inventory exists
3. If no inventory, warn user but allow recipe creation
4. Inventory deduction only happens if inventory exists

### **Issue: Menu cost calculation incorrect**

**Problem:** Menu cost doesn't match sum of recipe costs

**Solution:**
1. Verify recipe costs are calculated from ingredient prices
2. Verify menu cost = sum of linked recipe costs
3. Check unit conversions are correct
4. Verify ingredient prices are up to date

---

## 📚 Related Documentation

- `GET_STARTED_INGREDIENTS_INVENTORY.md` - Setup guide
- `INGREDIENTS_INVENTORY_PATH.md` - Implementation path
- `INGREDIENT_DATABASE_EXPANSION.md` - Ingredients database details

---

## 🎯 Summary

**The Ingredients List is the foundation. Everything else builds from it:**

1. **Ingredients List** → Master database with standard units
2. **Inventory** → Vendor deliveries converted to standard units, linked via `ingredientId`
3. **Ordering** → Cross-references Inventory and Ingredients List
4. **Recipes** → Built from Ingredients List, deducts from Inventory
5. **Menus** → Built from Recipes, costs calculated from ingredient prices

**All systems must reference the Ingredients List via `ingredientId` to maintain data integrity and enable unit conversion.**

