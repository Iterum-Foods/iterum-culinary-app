# 🔍 Troubleshoot: Sites Deployed But Not Showing

## ✅ **Sites Exist & Deployments Show**

If sites exist in Firebase Console and deployments are showing, but pages aren't loading, check these:

---

## 🔍 **Step 1: Verify Correct URLs**

### **Landing Site:**
- ✅ https://iterum-culinary-landing.web.app
- ✅ https://iterum-culinary-landing.web.app/pitch
- ✅ https://iterum-culinary-landing.web.app/pitch.html

### **Main App:**
- ✅ https://iterum-culinary-app2.web.app
- ✅ https://iterum-culinary-app2.web.app/dashboard.html
- ✅ https://iterum-culinary-app2.web.app/signin.html

**⚠️ Make sure you're using the correct URLs!**

---

## 🔍 **Step 2: Check Deployment Details**

In Firebase Console → Hosting → Each Site → Latest Deployment:

1. **Check File List:**
   - Does it show `landing.html`? (for landing site)
   - Does it show `pitch.html`? (for landing site)
   - Does it show `index.html`? (for app site)
   - Does it show `dashboard.html`? (for app site)

2. **Check File Count:**
   - Should show many files (not just 1-2)
   - Should include CSS, JS, images

3. **Check Status:**
   - Should be "Success" or "Active"
   - Not "Failed" or "Pending"

---

## 🔍 **Step 3: Test URLs Directly**

### **Test 1: Root URL**
Try the root URL first:
- Landing: https://iterum-culinary-landing.web.app
- App: https://iterum-culinary-app2.web.app

### **Test 2: Specific Pages**
- Landing Pitch: https://iterum-culinary-landing.web.app/pitch
- App Dashboard: https://iterum-culinary-app2.web.app/dashboard.html

### **Test 3: Check What Loads**
- Does it show a 404?
- Does it show a blank page?
- Does it show an error?
- Does it redirect somewhere?

---

## 🔧 **Common Issues & Fixes**

### **Issue 1: 404 Error**

**Symptom**: Page shows "404 Not Found"

**Possible Causes:**
- File not in deployment
- Wrong routing configuration
- File path incorrect

**Fix:**
1. Check Firebase Console → Deployment → File list
2. Verify file exists (e.g., `pitch.html`)
3. Check `firebase.json` routing rules
4. Redeploy if file missing

---

### **Issue 2: Blank Page**

**Symptom**: Page loads but shows blank/white screen

**Possible Causes:**
- JavaScript errors
- CSS not loading
- Assets missing

**Fix:**
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for failed requests
4. Verify assets are in deployment

---

### **Issue 3: Wrong Page Shows**

**Symptom**: Different page loads than expected

**Possible Causes:**
- Routing rule issue
- Default route catching everything

**Fix:**
1. Check `firebase.json` routing rules
2. Verify route order (more specific routes first)
3. Check if catch-all route (`**`) is interfering

---

### **Issue 4: Cache Issues**

**Symptom**: Old version shows or nothing loads

**Fix:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try incognito/private window
3. Hard refresh: Ctrl+F5
4. Try different browser
5. Wait 2-3 minutes (propagation delay)

---

## 🔍 **Step 4: Check Browser Console**

1. **Open DevTools** (F12)
2. **Check Console tab:**
   - Look for errors (red text)
   - Look for warnings (yellow text)
   - Note any failed requests

3. **Check Network tab:**
   - Look for failed requests (red)
   - Check if CSS/JS files load
   - Verify file paths are correct

---

## 🔍 **Step 5: Verify Files in Deployment**

In Firebase Console → Hosting → Site → Latest Deployment:

**For Landing Site, should see:**
- `landing.html`
- `pitch.html`
- `company.html` (if exists)
- `assets/` folder with CSS/JS

**For App Site, should see:**
- `index.html`
- `dashboard.html`
- `signin.html`
- `assets/` folder with CSS/JS

**If files are missing:**
- Redeploy
- Check `public` folder has files
- Verify `firebase.json` `ignore` rules aren't excluding files

---

## 🔧 **Quick Fixes**

### **Fix 1: Clear Cache & Retry**
1. Clear browser cache
2. Try incognito window
3. Wait 2-3 minutes
4. Try again

### **Fix 2: Check File List**
1. Go to Firebase Console
2. Check deployment file list
3. Verify expected files are there
4. Redeploy if missing

### **Fix 3: Test Direct File Access**
Try accessing files directly:
- https://iterum-culinary-landing.web.app/pitch.html
- https://iterum-culinary-app2.web.app/dashboard.html

If direct access works but routing doesn't, it's a routing issue.

---

## 📋 **Debugging Checklist**

- [ ] Using correct URLs (iterum-culinary-landing vs iterum-culinary-app2)
- [ ] Checked deployment file list in Console
- [ ] Verified files exist in deployment
- [ ] Cleared browser cache
- [ ] Tried incognito window
- [ ] Checked browser console for errors
- [ ] Waited 2-3 minutes after deployment
- [ ] Tried different browser
- [ ] Tested direct file access (e.g., /pitch.html)
- [ ] Checked routing rules in firebase.json

---

## 🎯 **Next Steps**

1. **Check what error you see** when visiting the URL
2. **Check browser console** for errors
3. **Verify file list** in Firebase Console deployment
4. **Test direct file access** (e.g., /pitch.html)
5. **Share what you see** - error message, blank page, wrong page, etc.

---

**What error or behavior do you see when you visit the URLs?**

