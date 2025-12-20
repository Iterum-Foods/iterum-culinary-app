# 🔍 Deployment Error Checklist - Complete Guide

## ✅ **Pre-Deployment Checks**

### **1. GitHub Actions Workflow Errors**

#### **Node.js Version Error** ✅ FIXED
- **Error**: `Firebase CLI v15.1.0 is incompatible with Node.js v18.20.8`
- **Status**: ✅ Fixed (Node.js 20.x now)
- **Check**: Verify workflow uses Node.js 20.x

#### **Firebase Token Missing**
- **Error**: `FIREBASE_TOKEN secret is not set`
- **Check**: GitHub → Settings → Secrets → Actions → `FIREBASE_TOKEN` exists
- **Fix**: Add token if missing

#### **Firebase Token Invalid**
- **Error**: `Authentication Error: Your credentials are no longer valid`
- **Check**: Token might be expired
- **Fix**: Generate new token: `firebase login:ci`

---

### **2. Configuration Errors**

#### **Missing firebase.json**
- **Error**: `Error: firebase.json not found`
- **Check**: File exists in root directory
- **Fix**: Ensure `firebase.json` is committed

#### **Missing .firebaserc**
- **Error**: `Error: .firebaserc not found`
- **Check**: File exists in root directory
- **Fix**: Ensure `.firebaserc` is committed

#### **Wrong Project ID**
- **Error**: `Error: Invalid project id` or `Project not found`
- **Check**: `.firebaserc` has correct project: `iterum-culinary-app2`
- **Fix**: Verify project ID matches Firebase Console

#### **Site Names Don't Match**
- **Error**: `Site 'iterum-culinary-landing' not found`
- **Check**: Sites exist in Firebase Console
- **Fix**: Create sites in Firebase Console if missing

---

### **3. File Deployment Errors**

#### **Public Directory Missing**
- **Error**: `Error: public directory not found`
- **Check**: `public/` folder exists
- **Fix**: Ensure `public/` folder is in repository

#### **Files Not Deployed**
- **Error**: Files missing in deployment
- **Check**: Firebase Console → Deployment → File list
- **Fix**: Check `firebase.json` `ignore` rules

#### **Assets Not Deployed**
- **Error**: CSS/JS files return 404
- **Check**: `assets/` folder in deployment
- **Fix**: Verify `assets/` not in `ignore` list

---

## 🔍 **During Deployment - Check These**

### **GitHub Actions Workflow Steps**

1. **Checkout code** ✅
   - Should succeed
   - Error: Repository access issues

2. **Verify public directory** ✅
   - Should show: `✓ Public directory structure verified`
   - Error: `Error: public directory not found`

3. **Verify Firebase configuration** ✅
   - Should show: `✓ Firebase configuration files verified`
   - Error: Missing `firebase.json` or `.firebaserc`

4. **Check Firebase token** ✅
   - Should show: `✓ Firebase token is configured`
   - Error: `FIREBASE_TOKEN secret is not set`

5. **Setup Node.js** ✅
   - Should use Node.js 20.x
   - Error: Wrong Node.js version

6. **Install Firebase CLI** ✅
   - Should install successfully
   - Error: npm install fails

7. **Verify Firebase CLI** ✅
   - Should show version (e.g., `15.0.0`)
   - Error: `Firebase CLI is incompatible with Node.js`

8. **Deploy to Landing Site** ✅
   - Should show: `Deploy complete!`
   - Error: Authentication, permissions, or site not found

9. **Deploy to App Site** ✅
   - Should show: `Deploy complete!`
   - Error: Authentication, permissions, or site not found

---

## 🔍 **Post-Deployment Verification**

### **1. Check GitHub Actions Summary**

After workflow completes, check:

- ✅ **All steps green** = Success
- ❌ **Any step red** = Failed (check error message)
- ⚠️ **Yellow warnings** = Non-critical (may still work)

### **2. Check Firebase Console**

Go to: https://console.firebase.google.com/u/0/project/iterum-culinary-app2/hosting

**For each site:**

1. **Click site name**
2. **Check "Deployments" tab:**
   - ✅ Latest deployment shows "Success"
   - ✅ File count shown (should be many files)
   - ✅ Deployment timestamp is recent
   - ❌ "Failed" status = Check error message

3. **Click on deployment:**
   - ✅ File list shows all files
   - ✅ `landing.html` / `index.html` present
   - ✅ `pitch.html` / `dashboard.html` present
   - ✅ `assets/` folder present
   - ✅ CSS files in `assets/css/`
   - ✅ JS files in `assets/js/`

---

### **3. Test URLs in Browser**

#### **Landing Site:**
- https://iterum-culinary-landing.web.app
- https://iterum-culinary-landing.web.app/pitch

#### **App Site:**
- https://iterum-culinary-app2.web.app
- https://iterum-culinary-app2.web.app/dashboard.html

**What to check:**
- ✅ Page loads (not 404)
- ✅ Styling works (not blank)
- ✅ JavaScript works (no console errors)
- ✅ Images load
- ✅ Navigation works

---

### **4. Browser Console Errors**

**Open DevTools (F12) → Console tab:**

#### **Common Errors:**

**404 Errors:**
- `Failed to load resource: 404`
- **Meaning**: File not found
- **Fix**: Check if file is in deployment

**CORS Errors:**
- `Access to fetch blocked by CORS policy`
- **Meaning**: Cross-origin request blocked
- **Fix**: Check Firebase Storage/API configuration

**JavaScript Errors:**
- `Uncaught TypeError: ... is not a function`
- **Meaning**: JS file error or missing dependency
- **Fix**: Check JS files load, check dependencies

**CSS Not Loading:**
- `Failed to load resource: assets/css/... 404`
- **Meaning**: CSS file not deployed
- **Fix**: Check `assets/` folder in deployment

---

### **5. Network Tab Errors**

**Open DevTools (F12) → Network tab:**

**Refresh page and check:**

- ✅ **Green (200)**: File loaded successfully
- ❌ **Red (404)**: File not found
- ❌ **Red (403)**: Permission denied
- ❌ **Red (500)**: Server error
- ⚠️ **Yellow (Cached)**: Using cached version (may be old)

**Check these files load:**
- HTML files (200)
- CSS files (200)
- JS files (200)
- Images (200)
- Fonts (200)

---

## 📋 **Complete Error Checklist**

### **GitHub Actions:**
- [ ] Node.js version correct (20.x)
- [ ] Firebase CLI installs successfully
- [ ] Firebase token is set
- [ ] All workflow steps succeed
- [ ] No error messages in logs

### **Firebase Console:**
- [ ] Sites exist (`iterum-culinary-landing`, `iterum-culinary-app2`)
- [ ] Latest deployment shows "Success"
- [ ] Files are in deployment
- [ ] File count is reasonable (not just 1-2 files)
- [ ] Assets folder is included

### **Browser Testing:**
- [ ] URLs load (not 404)
- [ ] Pages display correctly
- [ ] Styling works
- [ ] JavaScript works
- [ ] No console errors
- [ ] No network errors (404s)
- [ ] Images load
- [ ] Navigation works

---

## 🔧 **Common Error Messages & Fixes**

### **"Site not found"**
- **Fix**: Create site in Firebase Console

### **"Permission denied"**
- **Fix**: Check Firebase token permissions

### **"Files not found" (404)**
- **Fix**: Check files are in deployment, check routing

### **"Authentication failed"**
- **Fix**: Generate new Firebase token

### **"Node.js incompatible"**
- **Fix**: Use Node.js 20.x (already fixed)

### **"Deployment failed"**
- **Fix**: Check error message, verify configuration

---

## 🎯 **Quick Verification Script**

Run this locally to check everything:
```cmd
check-deployment-status.bat
```

This verifies:
- ✅ Files exist locally
- ✅ Configuration files exist
- ✅ Firebase connection works

---

## 📊 **Deployment Success Indicators**

**You'll know deployment worked when:**

1. ✅ **GitHub Actions**: All steps green
2. ✅ **Firebase Console**: Deployment shows "Success"
3. ✅ **File List**: All expected files present
4. ✅ **URLs Work**: Pages load correctly
5. ✅ **No Errors**: Browser console clean
6. ✅ **Assets Load**: CSS/JS/images work

---

**Use this checklist to systematically verify your deployment!**

