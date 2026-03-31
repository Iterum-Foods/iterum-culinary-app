# 🔧 Firebase Domain Activation Fix

## **Current Situation**

✅ **Files are deployed:** 224 files visible in Firebase Console  
✅ **Site exists:** `iterum-culinary-app2`  
✅ **Configuration correct:** `firebase.json` is valid  
❌ **URL returns 404:** `https://iterum-culinary-app2.web.app` → 404 Not Found

---

## **Most Likely Issue: Domain Not Fully Activated**

When files are visible in Firebase Console but the URL returns 404, the most common cause is that the `.web.app` domain is not fully activated.

---

## **Solution: Check Domain Activation in Firebase Console**

### **Step 1: Go to Firebase Console**

1. Go to: https://console.firebase.google.com/project/iterum-culinary-app2/hosting
2. Click on: `iterum-culinary-app2` site

### **Step 2: Check Domains Tab**

1. Click **"Domains"** tab (or "Custom domains" / "Default domains")
2. Look for: `iterum-culinary-app2.web.app`
3. Check status:
   - ✅ **Active** = Domain is working (but still 404? Check routing)
   - ❌ **Inactive** or **Pending** = Domain needs activation
   - ❌ **Not listed** = Domain needs to be added

### **Step 3: If Domain is Missing or Inactive**

If the domain is not listed or inactive:

1. **Click "Add domain"** or **"Add custom domain"**
2. **Enter:** `iterum-culinary-app2.web.app`
   - OR click **"Use default domain"** if available
3. **Wait for activation** (usually instant for `.web.app` domains)
4. **Verify status** shows "Active"

### **Step 4: If Domain is Active But Still 404**

If the domain shows "Active" but you still get 404:

1. **Check "Deployments" tab:**
   - Is the latest deployment **released to live channel**?
   - Status should be "Success" ✅
   - Should show 224 files

2. **Check "Versions" tab:**
   - Latest version should be **FINALIZED**
   - Should be **released to "live" channel**

3. **Check rewrite rules** (see below)

---

## **Alternative Solution: Check Release Status**

The files might be deployed but not released to the live channel:

### **In Firebase Console:**

1. Go to: Hosting → `iterum-culinary-app2` → **"Deployments"** tab
2. Find the latest deployment (should show 224 files)
3. Check:
   - **Status:** Should be "Success" ✅
   - **Released to:** Should be "live" channel
   - If it says "Preview" or nothing, it's not on live

4. If not released to live:
   - Click on the deployment
   - Click **"Release to live"** or **"Promote to live"** button
   - Wait for confirmation

---

## **Check Rewrite Rules**

The rewrite rules in `firebase.json` might be causing issues. Current config:

```json
{
  "rewrites": [
    {"source": "/", "destination": "/index.html"},
    {"source": "/dashboard.html", "destination": "/dashboard.html"},
    {"source": "/signin.html", "destination": "/signin.html"},
    {"source": "/app/**", "destination": "/index.html"},
    {"source": "**", "destination": "/index.html"}  ← Catch-all
  ]
}
```

The catch-all `"**"` should handle all routes, but let's verify it's working.

---

## **Manual Fix: Release to Live Channel**

If the deployment is not on the live channel, release it manually:

```bash
# Get the latest version ID
firebase hosting:channel:list --site iterum-culinary-app2

# Release to live (replace VERSION_ID with actual version)
firebase hosting:releases:create live --version VERSION_ID --site iterum-culinary-app2
```

Or in Firebase Console:
- Go to Deployments tab
- Click on latest deployment
- Click "Release to live" button

---

## **Quick Test: Try Preview URL**

Firebase should provide a preview URL. Check:

1. In Firebase Console → Hosting → `iterum-culinary-app2`
2. Look for **"Preview URL"** or **"Preview channel"**
3. Try that URL - does it work?
4. If preview works but live doesn't → domain activation issue
5. If preview doesn't work → routing/deployment issue

---

## **Next Steps**

1. **Check Firebase Console** for domain activation (see Step 1-3 above)
2. **Verify deployment is released to live** (see Step 4 above)
3. **If domain is inactive**, activate it
4. **If deployment is not on live**, release it to live channel
5. **Try the URL again** after activation/release

---

## **If Still Not Working**

If domain is active and deployment is on live channel but still 404:

1. **Check browser console** (F12):
   - Any errors?
   - What does Network tab show?

2. **Try different browsers** (Chrome, Firefox, Edge)

3. **Try incognito mode** (to avoid cache)

4. **Check if other files work:**
   - `https://iterum-culinary-app2.web.app/dashboard.html`
   - `https://iterum-culinary-app2.web.app/signin.html`

5. **Contact Firebase Support** with:
   - Site ID: `iterum-culinary-app2`
   - Project ID: `iterum-culinary-app2`
   - Issue: "Files visible in console (224 files) but URL returns 404"
   - Domain status from Console

---

**Last Updated:** 2026-01-10  
**Status:** Files deployed (224) but domain may need activation

