# 🔧 How to Add USDA API Code to Your App

## ✅ **Good News: Scripts Are Already Added!**

The USDA API code has already been added to your app. Here's what's included:

---

## 📁 **Files Already Created**

All these files are in `public/assets/js/`:

1. ✅ `usda-api-client.js` - USDA API client
2. ✅ `usda-bulk-processor.js` - Bulk file processor  
3. ✅ `enhanced-ingredient-loader.js` - Unified loader

---

## 📄 **Pages Already Updated**

### ✅ **ingredients.html** - FULLY CONFIGURED

The scripts are already loaded in the `<head>` section:

```html
<!-- USDA API Client -->
<script src="assets/js/usda-api-client.js"></script>
<!-- USDA Bulk Processor -->
<script src="assets/js/usda-bulk-processor.js"></script>
<!-- Enhanced Ingredient Loader -->
<script src="assets/js/enhanced-ingredient-loader.js"></script>
```

**Location**: Lines 40-45 in `ingredients.html`

---

## 🔧 **If You Need to Add to Other Pages**

### **Option 1: Add to Recipe Developer** (Recommended)

If you want USDA search in the recipe developer, add these scripts to `recipe-developer.html`:

**Find this section** (around line 4100):
```html
<!-- Load Base Ingredients Loader -->
<script src="assets/js/base-ingredients-loader.js"></script>
```

**Add after it**:
```html
<!-- USDA API Integration -->
<script src="assets/js/usda-api-client.js"></script>
<script src="assets/js/usda-bulk-processor.js"></script>
<script src="assets/js/enhanced-ingredient-loader.js"></script>
```

### **Option 2: Add to Any Page That Uses Ingredients**

For any page that needs ingredient search (inventory, menu builder, etc.), add:

```html
<!-- USDA API Integration -->
<script src="assets/js/usda-api-client.js"></script>
<script src="assets/js/usda-bulk-processor.js"></script>
<script src="assets/js/enhanced-ingredient-loader.js"></script>
```

**Important**: Add these scripts **AFTER** `ingredients-manager-enhanced.js` and **BEFORE** the closing `</body>` tag.

---

## 🚀 **Quick Setup Steps**

### **Step 1: Verify Scripts Are Loaded**

1. Open `ingredients.html` in your browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. You should see:
   ```
   📦 USDA API Client loaded
   📦 USDA Bulk Processor loaded
   📦 Enhanced Ingredient Loader loaded
   ```

### **Step 2: Get Your API Key**

1. Go to: https://api.data.gov/signup/
2. Fill out the form (free, takes 2 minutes)
3. Copy your API key

### **Step 3: Enter API Key in App**

1. Go to **Ingredients** page
2. You'll see a yellow box asking for API key
3. Paste your API key
4. Click "Save API Key"
5. Done! ✅

---

## 📋 **Script Loading Order**

For best results, load scripts in this order:

```html
<!-- 1. Base ingredient manager -->
<script src="assets/js/ingredients-manager-enhanced.js"></script>

<!-- 2. USDA API (if using) -->
<script src="assets/js/usda-api-client.js"></script>
<script src="assets/js/usda-bulk-processor.js"></script>
<script src="assets/js/enhanced-ingredient-loader.js"></script>

<!-- 3. Ingredient selector (uses above) -->
<script src="assets/js/ingredient-selector-integrated.js"></script>
```

---

## 🧪 **Test It Works**

### **Test 1: Check Scripts Load**

Open browser console and type:
```javascript
window.usdaApiClient
// Should return: USDAApiClient { ... }

window.enhancedIngredientLoader
// Should return: EnhancedIngredientLoader { ... }
```

### **Test 2: Check API Key**

```javascript
window.usdaApiClient.hasApiKey()
// Should return: true (if key is set) or false
```

### **Test 3: Try a Search**

1. Go to Ingredients page
2. Click "Enhanced Import" button
3. Enter "chicken" in search box
4. Click "Search"
5. Should show results from USDA database

---

## 🔍 **Troubleshooting**

### **"Script not found" error**

**Problem**: Scripts not loading  
**Solution**: 
1. Check file paths are correct
2. Verify files exist in `public/assets/js/`
3. Check browser console for 404 errors

### **"USDA API Client not defined"**

**Problem**: Script not loaded  
**Solution**:
1. Make sure script tag is before it's used
2. Check script path is correct
3. Reload page

### **"API key not set"**

**Problem**: Need to enter API key  
**Solution**:
1. Get free key: https://api.data.gov/signup/
2. Enter in Ingredients page
3. Key saves automatically

---

## 📝 **Summary**

✅ **Scripts are already added to `ingredients.html`**  
✅ **Files are in the correct location**  
✅ **Just need to get API key and enter it**

**You're ready to go!** Just:
1. Get API key (2 minutes)
2. Enter it in the app
3. Start importing ingredients!

---

## 🎯 **Next Steps**

1. **Test the integration**:
   - Open Ingredients page
   - Click "Enhanced Import"
   - Try searching

2. **Import ingredients**:
   - Search for specific items
   - Or bulk import from USDA datasets

3. **Use in recipes**:
   - Select ingredients from database
   - Automatic costing
   - Link to inventory

---

**Everything is already set up! Just get your API key and start using it.** 🚀
