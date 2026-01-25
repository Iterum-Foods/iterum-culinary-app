# 🔑 USDA API Key Strategy - Per User vs Shared

## 📊 **Current Implementation**

**How it works now:**
- API key is stored in `localStorage` (browser-specific storage)
- Each browser/device needs to enter the key once
- Key persists per browser, not per app user

---

## ❓ **Do You Need One Key Per User?**

### **Short Answer: No, you have options!**

---

## 🎯 **Option 1: Shared API Key** (Recommended for Most Cases)

### **✅ Best For:**
- Small to medium teams
- Single organization/kitchen
- Cost-effective setup
- Easier management

### **How It Works:**
- **One API key** for your entire app
- All users share the same key
- Key stored in app configuration
- Users don't need to enter anything

### **Rate Limits:**
- **1,000 requests/hour per IP address**
- If multiple users on same network → shared limit
- If users on different networks → separate limits

### **Implementation:**
You can hardcode or configure a shared key in your app:

```javascript
// Option A: Hardcode in usda-api-client.js
class USDAApiClient {
  constructor(apiKey = null) {
    // Use shared key as default
    this.apiKey = apiKey || 'YOUR_SHARED_API_KEY_HERE' || this.getStoredApiKey();
    // ...
  }
}

// Option B: Use environment variable or config
class USDAApiClient {
  constructor(apiKey = null) {
    // Check for shared key first
    this.apiKey = apiKey || 
                  window.APP_CONFIG?.USDA_API_KEY || 
                  this.getStoredApiKey();
    // ...
  }
}
```

### **Pros:**
- ✅ Simple setup
- ✅ Users don't need to get keys
- ✅ One key to manage
- ✅ Free (USDA keys are free)

### **Cons:**
- ⚠️ Shared rate limit (if on same network)
- ⚠️ Users can see the key (stored in localStorage)
- ⚠️ If key gets revoked, all users affected

---

## 🎯 **Option 2: Individual API Keys** (Current Setup)

### **✅ Best For:**
- Large organizations
- Users in different locations
- Want to avoid rate limit conflicts
- Better privacy/isolation

### **How It Works:**
- Each user gets their own free API key
- Key stored in their browser's localStorage
- No sharing of rate limits
- Complete user independence

### **Implementation:**
This is what's currently implemented - each user enters their own key.

### **Pros:**
- ✅ No shared rate limits
- ✅ Users have their own quotas
- ✅ Better isolation
- ✅ One user's key issues don't affect others

### **Cons:**
- ⚠️ Each user must get a key (2 minutes)
- ⚠️ More setup for users
- ⚠️ More keys to manage

---

## 🎯 **Option 3: Hybrid Approach** (Best of Both Worlds)

### **How It Works:**
- Default: Use shared key (auto-configured)
- Fallback: User can override with their own key
- Best for both convenience and flexibility

### **Implementation:**
```javascript
class USDAApiClient {
  constructor(apiKey = null) {
    // Priority: 1) Provided key, 2) User's saved key, 3) Shared default
    const sharedKey = 'YOUR_SHARED_API_KEY_HERE'; // Set your shared key
    const userKey = localStorage.getItem('usda_api_key');
    
    this.apiKey = apiKey || userKey || sharedKey;
    // ...
  }
  
  /**
   * Allow user to override shared key with their own
   */
  setUserApiKey(key) {
    localStorage.setItem('usda_api_key', key);
    this.apiKey = key;
  }
}
```

### **Pros:**
- ✅ Works out of the box (shared key)
- ✅ Users can use their own if they want
- ✅ Flexible
- ✅ Best user experience

### **Cons:**
- ⚠️ Need to set up shared key first
- ⚠️ Slightly more complex

---

## 📊 **Rate Limit Considerations**

### **USDA API Rate Limits:**
- **Default**: 1,000 requests/hour per IP address
- **Can request higher**: Contact USDA for increased limits
- **Caching**: Your app caches results (reduces API calls)

### **If Using Shared Key:**
- Users on same network = shared limit
- Users on different networks = separate limits
- Example: If 10 users on same WiFi, they share 1,000/hour

### **If Using Individual Keys:**
- Each user has their own 1,000/hour limit
- No sharing of quotas
- Better for high-traffic scenarios

---

## 🎯 **Recommendation**

### **For Your Use Case:**

**I recommend: Hybrid Approach**

1. **Set up one shared API key** (for convenience)
2. **Hardcode it** in the app (or use config)
3. **Allow users to override** with their own key if needed

### **Why This Is Best:**
- ✅ Users don't need to do anything (just works)
- ✅ Works for teams/organizations
- ✅ Power users can use their own key
- ✅ Flexible and scalable

---

## 🔧 **How to Implement Shared Key**

### **Step 1: Get Your API Key**
1. Go to: https://api.data.gov/signup/
2. Get your key
3. Copy it

### **Step 2: Add to Code**

Edit `public/assets/js/usda-api-client.js`:

```javascript
class USDAApiClient {
  constructor(apiKey = null) {
    // SHARED API KEY - Replace with your actual key
    const SHARED_API_KEY = 'YOUR_API_KEY_HERE';
    
    // Priority: provided > user's saved > shared default
    this.apiKey = apiKey || 
                  this.getStoredApiKey() || 
                  SHARED_API_KEY;
    
    this.baseUrl = 'https://api.nal.usda.gov/fdc/v1';
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000;
  }
  
  // ... rest of code
}
```

### **Step 3: Optional - Add User Override**

Keep the existing UI for users who want their own key, but make it optional.

---

## 📋 **Comparison Table**

| Feature | Shared Key | Individual Keys | Hybrid |
|---------|-----------|-----------------|--------|
| **User Setup** | None | Each user enters | Optional |
| **Rate Limits** | Shared (same network) | Individual | Depends |
| **Management** | One key | Many keys | One + optional |
| **Privacy** | Lower | Higher | Medium |
| **Convenience** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Scalability** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## ✅ **Final Recommendation**

**For Iterum Foods App: Use Hybrid Approach**

1. **Set one shared API key** in the code
2. **Hide the API key setup UI** (or make it "Advanced" option)
3. **Users get instant access** without setup
4. **Power users can override** if they want

This gives you:
- ✅ Best user experience
- ✅ Works immediately
- ✅ Flexible for power users
- ✅ No setup friction

---

## 🚀 **Quick Implementation**

Would you like me to:
1. **Update the code** to use a shared key with user override?
2. **Make API key setup optional** (advanced users only)?
3. **Add configuration** for easy key management?

**Let me know and I'll implement it!**

---

## 📝 **Summary**

**Answer**: No, you don't need one key per user. Options:

1. **Shared key** - One key for all (easiest)
2. **Individual keys** - Each user gets own (current setup)
3. **Hybrid** - Shared default, user can override (recommended)

**Recommendation**: Use shared key with optional user override for best experience!
