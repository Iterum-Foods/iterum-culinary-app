# 🧪 Test Deployment URLs - Debug Guide

## ✅ **Sites Exist & Deployments Show**

Since sites exist and deployments are showing, let's debug what's happening:

---

## 🔍 **Step 1: Test Each URL**

### **Landing Site URLs:**

1. **Root URL:**
   ```
   https://iterum-culinary-landing.web.app
   ```
   **Expected**: Should show landing page
   **If wrong**: Check routing rule for `/`

2. **Pitch Page:**
   ```
   https://iterum-culinary-landing.web.app/pitch
   ```
   **Expected**: Should show pitch.html
   **If wrong**: Check routing rule for `/pitch`

3. **Pitch Page (direct):**
   ```
   https://iterum-culinary-landing.web.app/pitch.html
   ```
   **Expected**: Should show pitch.html
   **If wrong**: File might not be deployed

---

### **Main App URLs:**

1. **Root URL:**
   ```
   https://iterum-culinary-app2.web.app
   ```
   **Expected**: Should show index.html
   **If wrong**: Check routing rule for `/`

2. **Dashboard:**
   ```
   https://iterum-culinary-app2.web.app/dashboard.html
   ```
   **Expected**: Should show dashboard.html
   **If wrong**: File might not be deployed

3. **Sign In:**
   ```
   https://iterum-culinary-app2.web.app/signin.html
   ```
   **Expected**: Should show signin.html

---

## 🔍 **Step 2: Check What You See**

For each URL, note:

1. **What do you see?**
   - [ ] 404 Error
   - [ ] Blank/white page
   - [ ] Wrong page (different than expected)
   - [ ] Loading forever
   - [ ] Error message
   - [ ] Correct page ✅

2. **Browser Console (F12):**
   - Open DevTools → Console tab
   - What errors do you see?
   - Copy any red error messages

3. **Network Tab:**
   - Open DevTools → Network tab
   - Refresh page
   - What files fail to load? (red entries)
   - Are CSS/JS files loading?

---

## 🔧 **Common Issues**

### **Issue: 404 Error**

**Possible Causes:**
- File not in deployment
- Routing rule wrong
- File path incorrect

**Fix:**
1. Check Firebase Console → Deployment → File list
2. Verify file exists (e.g., `pitch.html`)
3. Check `firebase.json` routing
4. Try direct file access: `/pitch.html`

---

### **Issue: Blank Page**

**Possible Causes:**
- JavaScript errors
- CSS not loading
- Assets missing

**Fix:**
1. Check browser console (F12)
2. Look for JavaScript errors
3. Check Network tab for failed requests
4. Verify assets folder is deployed

---

### **Issue: Wrong Page Shows**

**Possible Causes:**
- Routing rule issue
- Catch-all route catching everything
- Route order wrong

**Fix:**
1. Check `firebase.json` routing order
2. More specific routes should come first
3. Catch-all (`**`) should be last

---

### **Issue: Assets Not Loading**

**Symptom**: Page loads but no styling/images

**Fix:**
1. Check Network tab for failed asset requests
2. Verify `assets/` folder is in deployment
3. Check file paths in HTML (should be relative: `assets/css/...`)
4. Verify assets aren't in `ignore` list in firebase.json

---

## 🔍 **Step 3: Verify Files in Deployment**

In Firebase Console → Hosting → Site → Latest Deployment:

**Check file list includes:**
- ✅ `landing.html` (for landing site)
- ✅ `pitch.html` (for landing site)
- ✅ `index.html` (for app site)
- ✅ `dashboard.html` (for app site)
- ✅ `assets/` folder with subfolders
- ✅ CSS files in `assets/css/`
- ✅ JS files in `assets/js/`

**If files are missing:**
- Redeploy
- Check `firebase.json` `ignore` rules
- Verify files exist in `public` folder locally

---

## 🔧 **Quick Test: Direct File Access**

Try accessing files directly (bypassing routing):

**Landing Site:**
- https://iterum-culinary-landing.web.app/landing.html
- https://iterum-culinary-landing.web.app/pitch.html

**App Site:**
- https://iterum-culinary-app2.web.app/index.html
- https://iterum-culinary-app2.web.app/dashboard.html

**If direct access works:**
- ✅ Files are deployed
- ❌ Routing is the issue
- Fix: Check `firebase.json` routing rules

**If direct access fails:**
- ❌ Files not deployed
- Fix: Redeploy and verify files in deployment

---

## 📋 **Debugging Checklist**

- [ ] Tested root URLs for both sites
- [ ] Tested specific page URLs
- [ ] Checked what error/page shows
- [ ] Opened browser console (F12)
- [ ] Checked for JavaScript errors
- [ ] Checked Network tab for failed requests
- [ ] Verified files in Firebase Console deployment
- [ ] Tried direct file access (e.g., /pitch.html)
- [ ] Cleared browser cache
- [ ] Tried incognito window
- [ ] Waited 2-3 minutes after deployment

---

## 🎯 **What to Share**

To help debug, please share:

1. **Which URL are you testing?**
   - Landing site or App site?
   - Which specific page?

2. **What do you see?**
   - Error message?
   - Blank page?
   - Wrong page?
   - Screenshot if possible

3. **Browser console errors:**
   - Open F12 → Console tab
   - Copy any red error messages

4. **File list in deployment:**
   - Does it show the expected files?
   - Are assets folder included?

---

**Please test the URLs and let me know what you see!**

