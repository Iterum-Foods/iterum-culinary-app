# 🔍 Debug: Site Not Working After Deployment

## ⚠️ **Deployment Finished But Site Doesn't Work**

Let's systematically debug this issue.

---

## 🔍 **Step 1: What Error Do You See?**

When you visit the URLs, what happens?

### **Test These URLs:**

**Landing Site:**
- https://iterum-culinary-landing.web.app
- https://iterum-culinary-landing.web.app/pitch
- https://iterum-culinary-landing.web.app/pitch.html

**Main App:**
- https://iterum-culinary-app2.web.app
- https://iterum-culinary-app2.web.app/dashboard.html

**What do you see?**
- [ ] 404 Error
- [ ] Blank/white page
- [x ] "Site not found" error
- [ ] Wrong page loads
- [ ] JavaScript errors
- [ ] Page loads but broken styling
- [ ] Something else?

---

## 🔍 **Step 2: Check Browser Console**

1. **Open the URL in browser**
2. **Press F12** to open DevTools
3. **Check Console tab:**
   - Any red errors?
   - Copy all error messages
   - Note what files are failing

4. **Check Network tab:**
   - Refresh page (F5)
   - Look for failed requests (red)
   - Check if CSS/JS files load
   - Note which files are 404

---

## 🔍 **Step 3: Verify Deployment in Firebase Console**

1. **Go to:** https://console.firebase.google.com/u/0/project/iterum-culinary-app2/hosting

2. **For each site:**
   - Click on site name
   - Click "Deployments" tab
   - Check latest deployment:
     - Status: Should be "Success" ✅
     - Files: Click to see file list
     - Verify key files exist:
       - `landing.html` (for landing site)
       - `pitch.html` (for landing site)
       - `index.html` (for app site)
       - `dashboard.html` (for app site)
       - `assets/` folder

---

## 🔍 **Step 4: Check GitHub Actions Logs**

1. **Go to GitHub repository**
2. **Click "Actions" tab**
3. **Click on latest workflow run**
4. **Check each step:**
   - ✅ All steps green?
   - ❌ Any red/failed steps?
   - Check error messages

5. **Look for:**
   - "Deploy to Firebase Landing Site" - Success?
   - "Deploy to Firebase App Site" - Success?
   - Any error messages?

---

## 🔧 **Common Issues & Fixes**

### **Issue 1: 404 Error**

**Symptom**: Page shows "404 Not Found"

**Possible Causes:**
- File not in deployment
- Wrong routing configuration
- Wrong URL

**Fix:**
1. Check Firebase Console → Deployment → File list
2. Verify file exists (e.g., `pitch.html`)
3. Try direct file access: `/pitch.html`
4. Check `firebase.json` routing rules

---

### **Issue 2: Blank Page**

**Symptom**: Page loads but shows blank/white screen

**Possible Causes:**
- JavaScript errors
- CSS not loading
- Assets missing

**Fix:**
1. Check browser console (F12) for errors
2. Check Network tab for failed requests
3. Verify `assets/` folder is in deployment
4. Check file paths in HTML (should be relative)

---

### **Issue 3: Wrong Page Shows**

**Symptom**: Different page loads than expected

**Possible Causes:**
- Routing rule issue
- Catch-all route catching everything

**Fix:**
1. Check `firebase.json` routing order
2. More specific routes should come first
3. Catch-all (`**`) should be last

---

### **Issue 4: Assets Not Loading**

**Symptom**: Page loads but no styling/images

**Possible Causes:**
- Assets folder not deployed
- Wrong file paths
- CORS issues

**Fix:**
1. Check Network tab for failed asset requests
2. Verify `assets/` folder in deployment
3. Check file paths in HTML (relative paths)
4. Verify assets aren't in `ignore` list

---

### **Issue 5: Site Not Found**

**Symptom**: "Site not found" or "This site can't be reached"

**Possible Causes:**
- Wrong URL
- Site doesn't exist
- DNS propagation delay

**Fix:**
1. Verify correct URLs:
   - Landing: `iterum-culinary-landing.web.app`
   - App: `iterum-culinary-app2.web.app`
2. Check Firebase Console - sites exist?
3. Wait 2-3 minutes for propagation

---

## 🎯 **Quick Diagnostic Steps**

1. **Test direct file access:**
   - https://iterum-culinary-landing.web.app/pitch.html
   - https://iterum-culinary-app2.web.app/dashboard.html
   - If this works → routing issue
   - If this fails → file not deployed

2. **Check browser console:**
   - F12 → Console tab
   - Look for errors
   - Copy error messages

3. **Check Firebase Console:**
   - Verify deployment succeeded
   - Check file list
   - Verify files exist

4. **Check GitHub Actions:**
   - Verify workflow succeeded
   - Check for error messages
   - Verify both sites deployed

---

## 📋 **Information Needed**

To help debug, please share:

1. **Which URL are you testing?**
   - Landing site or App site?
   - Which specific page?

2. **What do you see?**
   - Error message?
   - Blank page?
   - Screenshot if possible

3. **Browser console errors:**
   - F12 → Console tab
   - Copy any red error messages

4. **Firebase Console:**
   - Does deployment show "Success"?
   - Are files in the deployment?

5. **GitHub Actions:**
   - Did workflow succeed?
   - Any error messages?

---

**Please share what you see when you visit the URLs - that will help identify the exact issue!**

