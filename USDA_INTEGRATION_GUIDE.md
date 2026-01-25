# 🚀 USDA Integration Guide - Quick Start

## ✅ **What's Been Added**

### **New Modules Created:**

1. **`usda-api-client.js`** - USDA FoodData Central API client
   - Search 300,000+ ingredients
   - Get detailed food information
   - Free API access

2. **`usda-bulk-processor.js`** - Bulk download processor
   - Process USDA JSON/CSV files
   - Import thousands of ingredients at once
   - Progress tracking

3. **`enhanced-ingredient-loader.js`** - Unified ingredient loader
   - Combines base database + USDA API + bulk imports
   - Enhanced import modal
   - Database statistics

### **Updated Files:**

1. **`ingredients.html`** - Added new import buttons and API key setup
2. **`ingredient-selector-integrated.js`** - Added USDA search capability

---

## 🎯 **Quick Start**

### **Step 1: Get USDA API Key (Free, 2 minutes)**

1. Go to: https://api.data.gov/signup/
2. Fill out the form (free, no credit card)
3. Get your API key
4. Enter it in the ingredients page when prompted

### **Step 2: Use Enhanced Import**

1. Go to **Ingredients** page
2. Click **"Enhanced Import (USDA + Base Database)"** button
3. Choose import method:
   - **Search USDA**: Search 300,000+ ingredients
   - **Upload Bulk File**: Upload USDA JSON/CSV files
   - **Base Database**: Import 145 base ingredients

### **Step 3: Search and Import**

1. Enter search query (e.g., "chicken", "olive oil")
2. Click **Search**
3. Review results
4. Ingredients are automatically imported

---

## 📥 **Bulk Download Option**

### **Download USDA Datasets:**

1. Go to: https://fdc.nal.usda.gov/download-datasets.html
2. Download:
   - **Foundation Foods** (~1,000 basic ingredients)
   - **Branded Foods** (~300,000 products) - Optional, large file

### **Upload to App:**

1. Go to **Ingredients** page
2. Click **"Enhanced Import"**
3. Click **"Upload USDA Bulk File"**
4. Select downloaded JSON file
5. Wait for processing
6. Done!

---

## 🔍 **How It Works**

### **1. USDA API Search**

```javascript
// Search for ingredients
const result = await window.usdaApiClient.searchFoods("chicken");
// Returns up to 50 results by default

// Get specific food details
const food = await window.usdaApiClient.getFoodDetails(173944);
```

### **2. Bulk Import**

```javascript
// Process USDA bulk file
const result = await window.usdaBulkProcessor.processFile(file, {
  importLimit: 1000,
  overwriteExisting: false,
  progressCallback: (progress) => {
    console.log(`Processing: ${progress.percent}%`);
  }
});
```

### **3. Enhanced Loader**

```javascript
// Search and import in one step
const result = await window.enhancedIngredientLoader.searchAndImport("olive oil", {
  maxResults: 50,
  overwriteExisting: false
});
```

---

## 📊 **Expected Results**

### **Base Database Import:**
- ✅ 145 professional ingredients

### **USDA API Search:**
- ✅ 300,000+ searchable ingredients
- ✅ Real-time search results
- ✅ Detailed nutrition data

### **USDA Bulk Import:**
- ✅ Foundation Foods: ~1,000 ingredients
- ✅ Branded Foods: ~300,000 products (optional)

### **Combined:**
- ✅ **100,000+ ingredients** available (with bulk import)
- ✅ **300,000+ searchable** via API

---

## ⚙️ **Configuration**

### **API Key Storage:**
- Stored in `localStorage` as `usda_api_key`
- Persists across sessions
- Can be changed anytime

### **Rate Limits:**
- **1,000 requests/hour** per IP (default)
- Can request higher limits from USDA
- Caching reduces API calls

### **Data Storage:**
- Ingredients stored in `localStorage`
- Key: `ingredients_database`
- USDA ingredients prefixed with `usda_` in ID

---

## 🐛 **Troubleshooting**

### **"API key not set" error:**
- Get free key: https://api.data.gov/signup/
- Enter in ingredients page
- Key is saved automatically

### **"No results found":**
- Try different search terms
- Check spelling
- Search is case-insensitive

### **"Import failed":**
- Check file format (JSON or CSV)
- Verify file is from USDA
- Check browser console for errors

### **Slow import:**
- Large files take time to process
- Progress indicator shows status
- Be patient with bulk imports

---

## 📚 **Resources**

- **USDA API Documentation**: https://fdc.nal.usda.gov/api-guide.html
- **Get API Key**: https://api.data.gov/signup/
- **Download Datasets**: https://fdc.nal.usda.gov/download-datasets.html
- **API Status**: Check data.gov for API status

---

## ✅ **Next Steps**

1. **Get API key** and test search
2. **Download Foundation Foods** dataset
3. **Bulk import** 1,000+ ingredients
4. **Search** for specific ingredients as needed
5. **Enjoy** comprehensive ingredient database!

---

**🎉 You now have access to 300,000+ ingredients!**
