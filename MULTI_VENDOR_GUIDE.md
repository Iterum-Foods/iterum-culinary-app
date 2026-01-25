# 🏪 Multi-Vendor Pricing System - Complete Guide

## ✅ **What's Been Added**

### **New Module: `multi-vendor-manager.js`**

Complete system for managing multiple vendors with different pricing for each ingredient:

- ✅ **Add Multiple Vendors** - Each ingredient can have unlimited vendors
- ✅ **Different Pricing** - Each vendor can have different price and unit
- ✅ **Preferred Vendor** - Mark one vendor as preferred
- ✅ **Best Price Calculation** - Automatically finds lowest price (normalized to base unit)
- ✅ **Price Comparison** - Shows price range and potential savings
- ✅ **Unit Conversion** - Handles different units across vendors
- ✅ **SKU & Min Order** - Track vendor-specific details

---

## 🎯 **How It Works**

### **Data Structure:**

Each ingredient can have a `vendorPrices` array:

```javascript
{
  id: "ing_001",
  name: "Chicken Breast",
  default_unit: "lb",
  vendorPrices: [
    {
      vendor: "Chef's Warehouse",
      price: 4.99,
      unit: "lb",
      sku: "CW-CHK-001",
      minOrder: "10 cases",
      isPreferred: true,
      dateAdded: "2025-01-XX...",
      lastUpdated: "2025-01-XX..."
    },
    {
      vendor: "Sysco",
      price: 5.49,
      unit: "lb",
      sku: "SYS-CHK-001",
      minOrder: "5 cases",
      isPreferred: false,
      dateAdded: "2025-01-XX...",
      lastUpdated: "2025-01-XX..."
    },
    {
      vendor: "Local Farm",
      price: 45.00,
      unit: "case",
      sku: null,
      minOrder: "1 case",
      isPreferred: false,
      dateAdded: "2025-01-XX...",
      lastUpdated: "2025-01-XX..."
    }
  ],
  bestPrice: {
    vendor: "Chef's Warehouse",
    price: 4.99,
    unit: "lb",
    normalizedPrice: 4.99,
    baseUnit: "lb",
    isPreferred: true
  },
  priceComparison: {
    vendorCount: 3,
    priceRange: {
      min: 4.99,
      max: 5.49,
      difference: 0.50,
      percentSavings: "9.1"
    }
  }
}
```

---

## 🚀 **How to Use**

### **Step 1: Add Ingredient (or Edit Existing)**

1. Go to **Ingredients** page
2. Add new ingredient or edit existing
3. Fill in basic info (name, category, unit)

### **Step 2: Manage Vendors**

1. Click **"Manage Vendors"** button in the form
2. Modal opens showing:
   - Current vendors (if any)
   - Add new vendor form
   - Price comparison

### **Step 3: Add Vendor**

1. Fill in vendor form:
   - **Vendor Name** - e.g., "Chef's Warehouse"
   - **Price** - e.g., 4.99
   - **Unit** - e.g., "lb"
   - **SKU** (optional) - Vendor SKU
   - **Min Order** (optional) - Minimum order requirement
   - **Set as Preferred** - Check to mark as preferred
2. Click **"Add Vendor"**
3. Vendor appears in list

### **Step 4: Set Preferred Vendor**

1. Click **"Set Preferred"** on any vendor
2. That vendor becomes preferred (⭐)
3. System uses preferred vendor for costing (if set), otherwise uses best price

### **Step 5: Remove Vendor**

1. Click **"Remove"** on any vendor
2. Confirm removal
3. Vendor removed from list

---

## 💰 **Price Calculation**

### **Best Price Selection:**

1. **If Preferred Vendor Set:**
   - Uses preferred vendor price
   - Normalizes to ingredient base unit

2. **If No Preferred:**
   - Finds lowest price (normalized to base unit)
   - Uses that vendor

3. **Unit Normalization:**
   - All prices converted to ingredient `default_unit`
   - Example: "case" price converted to "lb" for comparison

### **Cost Calculator Integration:**

The cost calculator automatically uses:
- `ingredient.bestPrice` if available
- Falls back to `ingredient.cost` if no vendors

---

## 📊 **Price Comparison**

### **What's Shown:**

- **Vendor Count** - How many vendors configured
- **Price Range** - Min and max prices (normalized)
- **Potential Savings** - Difference between highest and lowest
- **Percent Savings** - Percentage difference

### **Example:**

```
3 vendors configured
Best Price: $4.99/lb (Chef's Warehouse)
Highest: $5.49/lb (Sysco)
Savings: $0.50/lb (9.1%)
```

---

## 🔗 **Integration with Other Systems**

### **Recipe Costing:**

- ✅ Uses best/preferred vendor price
- ✅ Automatically converts units
- ✅ Accurate recipe costs

### **Menu Costing:**

- ✅ Recipe costs use best vendor prices
- ✅ Menu costs calculated from recipe costs
- ✅ Complete cost tracking

### **Inventory:**

- ✅ Can link inventory to specific vendor
- ✅ Track which vendor supplied each item
- ✅ Vendor-specific pricing in inventory

### **Ordering:**

- ✅ Compare vendors before ordering
- ✅ See best prices
- ✅ Track vendor requirements (min order, lead time)

---

## 🎯 **Use Cases**

### **Use Case 1: Compare Prices**

**Scenario**: You want to find the best price for chicken breast

1. Add ingredient "Chicken Breast"
2. Add vendor "Chef's Warehouse" - $4.99/lb
3. Add vendor "Sysco" - $5.49/lb
4. Add vendor "Local Farm" - $45/case (12 lb)
5. System shows:
   - Best: Chef's Warehouse - $4.99/lb
   - Local Farm: $3.75/lb (normalized from case)
   - **Best overall: Local Farm!**

### **Use Case 2: Preferred Vendor**

**Scenario**: You prefer Chef's Warehouse even if not cheapest

1. Add multiple vendors
2. Set Chef's Warehouse as preferred
3. System uses Chef's Warehouse for costing
4. Still shows price comparison

### **Use Case 3: Different Units**

**Scenario**: One vendor sells by case, another by lb

1. Add vendor "Sysco" - $45/case (12 lb)
2. Add vendor "Local" - $4.50/lb
3. System normalizes both to lb:
   - Sysco: $3.75/lb (normalized)
   - Local: $4.50/lb
4. Best price: Sysco

---

## 🔧 **Technical Details**

### **Vendor Price Format:**

```javascript
{
  vendor: "Vendor Name",
  price: 4.99,              // Price
  unit: "lb",                // Unit for this price
  sku: "VENDOR-SKU-001",     // Optional: Vendor SKU
  minOrder: "10 cases",      // Optional: Minimum order
  leadTime: "2-3 days",      // Optional: Lead time
  notes: "Special pricing",  // Optional: Notes
  isPreferred: false,        // Preferred vendor flag
  dateAdded: "2025-01-XX...",
  lastUpdated: "2025-01-XX..."
}
```

### **Best Price Calculation:**

1. Get all vendor prices
2. Normalize all to ingredient `default_unit`
3. If preferred vendor exists, use it
4. Otherwise, find lowest normalized price
5. Store in `ingredient.bestPrice`

### **Unit Conversion:**

- Uses `unitConverter.convertPrice()` for normalization
- Handles: lb, oz, kg, g, case, each, gal, qt, l, ml
- Falls back to direct price if conversion fails

---

## ✅ **Verification Checklist**

After adding vendors, verify:

- [ ] Vendors appear in "Manage Vendors" modal
- [ ] Best price calculated correctly
- [ ] Price comparison shows range
- [ ] Preferred vendor marked with ⭐
- [ ] Cost calculator uses best price
- [ ] Recipe costs use vendor prices
- [ ] Menu costs calculated correctly
- [ ] Units converted properly

---

## 🎉 **Benefits**

### **For You:**

- ✅ **Compare Prices** - See all vendor prices at once
- ✅ **Find Best Deals** - System finds lowest price automatically
- ✅ **Track Vendors** - Keep all vendor info in one place
- ✅ **Flexible Pricing** - Different units, different vendors
- ✅ **Preferred Vendors** - Use preferred even if not cheapest

### **For Costing:**

- ✅ **Accurate Costs** - Uses best/preferred vendor price
- ✅ **Automatic Updates** - Best price recalculated when vendors change
- ✅ **Unit Handling** - Converts different units automatically
- ✅ **Recipe Costs** - Accurate recipe costing
- ✅ **Menu Costs** - Accurate menu costing

### **For Ordering:**

- ✅ **Price Comparison** - See all options before ordering
- ✅ **Vendor Details** - SKU, min order, lead time
- ✅ **Best Price** - Know which vendor to use
- ✅ **Savings Tracking** - See potential savings

---

## 🚀 **Next Steps**

1. **Add Vendors** - Start adding vendors to your ingredients
2. **Set Preferred** - Mark your preferred vendors
3. **Compare Prices** - Use price comparison to find best deals
4. **Update Regularly** - Keep vendor prices up to date
5. **Use in Costing** - Let system use best prices automatically

---

**🎊 You now have a complete multi-vendor pricing system with automatic best price calculation and price comparison!**
