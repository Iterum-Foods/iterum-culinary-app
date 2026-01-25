# 🔑 Setup Shared USDA API Key - Quick Guide

## ✅ **Option B Implemented: Shared Key Only**

The app is now configured to use **one shared API key** for all users. No user setup required!

---

## 🚀 **Setup Steps (One Time)**

### **Step 1: Get Your Free API Key** (2 minutes)

1. Go to: **https://api.data.gov/signup/**
2. Fill out the form:
   - First Name
   - Last Name
   - Email
   - Organization (optional)
   - Description: "Iterum Culinary App - Ingredient Database"
3. Click "Sign Up"
4. Copy your API key

### **Step 2: Add Key to Code** (30 seconds)

1. Open file: `public/assets/js/usda-api-client.js`
2. Find line 12 (around there):
   ```javascript
   const SHARED_API_KEY = null; // ⬅️ PASTE YOUR API KEY HERE
   ```
3. Replace `null` with your API key:
   ```javascript
   const SHARED_API_KEY = 'your-actual-api-key-here'; // ⬅️ PASTE YOUR API KEY HERE
   ```
4. Save the file

### **Step 3: Test It** (30 seconds)

1. Open your app
2. Go to **Ingredients** page
3. Click **"Enhanced Import"** button
4. Try searching for "chicken"
5. Should work immediately! ✅

---

## 📝 **Example**

**Before:**
```javascript
const SHARED_API_KEY = null; // ⬅️ PASTE YOUR API KEY HERE
```

**After:**
```javascript
const SHARED_API_KEY = 'abc123xyz456def789ghi012jkl345mno678'; // ⬅️ PASTE YOUR API KEY HERE
```

---

## ✅ **What Changed**

### **✅ Updated Files:**

1. **`usda-api-client.js`**
   - Added `SHARED_API_KEY` constant
   - Uses shared key by default
   - Users can still override if needed (optional)

2. **`enhanced-ingredient-loader.js`**
   - API key setup hidden by default
   - Only shows if shared key not configured

3. **`ingredients.html`**
   - API key setup UI updated
   - Hidden by default
   - Shows only if configuration needed

---

## 🎯 **How It Works Now**

### **For All Users:**
- ✅ **No setup required** - works immediately
- ✅ **Automatic access** to USDA database
- ✅ **No API key prompts**
- ✅ **Seamless experience**

### **For Administrators:**
- ✅ **One key to manage**
- ✅ **Easy to update** (change in one file)
- ✅ **No user configuration needed**

---

## 🔧 **Advanced: User Override (Optional)**

If a user wants to use their own key (rare), they can:

1. Open browser console (F12)
2. Run:
   ```javascript
   window.usdaApiClient.setApiKey('their-api-key-here');
   ```
3. Their key will override the shared key for their browser only

---

## 📊 **Rate Limits**

- **1,000 requests/hour per IP address**
- Users on same network = shared limit
- Users on different networks = separate limits
- Caching reduces API calls significantly

**If you need higher limits:**
- Contact USDA: https://api.data.gov/contact/
- Request increased rate limit
- Usually approved for legitimate use cases

---

## 🐛 **Troubleshooting**

### **"API key not configured" error**

**Problem**: Shared key not set  
**Solution**: 
1. Open `usda-api-client.js`
2. Set `SHARED_API_KEY = 'your-key-here'`
3. Save and reload

### **"Invalid API key" error**

**Problem**: Key is wrong or expired  
**Solution**:
1. Verify key at: https://api.data.gov/
2. Get new key if needed
3. Update `SHARED_API_KEY`

### **Rate limit exceeded**

**Problem**: Too many requests  
**Solution**:
1. Wait 1 hour (limit resets)
2. Request higher limit from USDA
3. Improve caching (already implemented)

---

## ✅ **Summary**

**Status**: ✅ **Configured for Shared Key**

**What You Need to Do**:
1. ⚠️ Get API key (2 minutes)
2. ⚠️ Paste in `usda-api-client.js` (30 seconds)
3. ✅ Done!

**Result**:
- ✅ All users get instant access
- ✅ No setup required
- ✅ Works automatically

---

## 🎉 **You're All Set!**

Once you add your API key to the code, all users will have instant access to 300,000+ ingredients from USDA!

**Just paste your key in `usda-api-client.js` and you're done!** 🚀
