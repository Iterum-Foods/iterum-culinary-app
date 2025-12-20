# 🔧 Fix: Firebase Sites Not Showing

## ⚠️ **Problem**

Sites deployed but not showing. This usually means:
1. Sites don't exist in Firebase Console
2. Site names don't match exactly
3. Deployment didn't actually succeed
4. Need to wait for propagation

---

## ✅ **Solution: Verify and Fix**

### **Step 1: Check if Sites Exist in Firebase Console**

1. **Go to Firebase Console:**
   https://console.firebase.google.com/u/0/project/iterum-culinary-app2/hosting

2. **Check if both sites are listed:**
   - `iterum-culinary-landing`
   - `iterum-culinary-app2`

3. **If sites are NOT listed:**
   - Click "Add another site" or "Get started"
   - Create site: `iterum-culinary-landing`
   - Create site: `iterum-culinary-app2`
   - **Site names must match EXACTLY** (case-sensitive, hyphens)

---

### **Step 2: Verify Configuration Matches**

Run verification script:
```cmd
verify-firebase-sites.bat
```

This will check:
- ✅ Project configuration
- ✅ Site names in firebase.json
- ✅ Project ID in .firebaserc

---

### **Step 3: Check Deployment Status**

In Firebase Console → Hosting → Each Site:

1. **Click on the site name**
2. **Check "Deployments" tab:**
   - Should show recent deployment
   - Status should be "Success"
   - Should show file count
   - Should show deployment time

3. **If no deployments:**
   - Deployment didn't actually succeed
   - Check error messages
   - Redeploy

---

### **Step 4: Verify Site Names Match Exactly**

**Critical**: Site names are case-sensitive and must match exactly!

**Correct:**
- ✅ `iterum-culinary-landing` (all lowercase, hyphen)
- ✅ `iterum-culinary-app2` (all lowercase, hyphen, number)

**Wrong:**
- ❌ `iterum-culinary-Landing` (capital L)
- ❌ `iterum-culinary_landing` (underscore)
- ❌ `Iterum-Culinary-Landing` (capitals)
- ❌ `iterum-culinary-landing ` (trailing space)

---

## 🔧 **Fix: Create Sites if Missing**

### **If Sites Don't Exist:**

1. **Go to Firebase Console:**
   https://console.firebase.google.com/u/0/project/iterum-culinary-app2/hosting

2. **Click "Add another site"** (or "Get started" if first time)

3. **Create Site 1:**
   - Site ID: `iterum-culinary-landing`
   - Click "Continue"
   - Click "Continue" again

4. **Create Site 2:**
   - Click "Add another site"
   - Site ID: `iterum-culinary-app2`
   - Click "Continue"
   - Click "Continue" again

5. **Verify both sites are listed**

6. **Redeploy:**
   ```cmd
   deploy-both-sites.bat
   ```

---

## 🚀 **Redeploy After Creating Sites**

Once sites exist in Firebase Console:

1. **Run deployment:**
   ```cmd
   deploy-both-sites.bat
   ```

2. **Watch for success messages:**
   - "Deploy complete!"
   - File counts shown
   - URLs displayed

3. **Verify in Console:**
   - Check deployments appear
   - Status shows "Success"
   - Files are listed

---

## 🌐 **Test URLs After Deployment**

### **Landing Site:**
- https://iterum-culinary-landing.web.app
- https://iterum-culinary-landing.web.app/pitch

### **Main App:**
- https://iterum-culinary-app2.web.app
- https://iterum-culinary-app2.web.app/dashboard.html

**Wait 1-2 minutes** after deployment for propagation.

---

## ⚠️ **Common Issues**

### **Issue 1: Sites Don't Exist**
- **Fix**: Create sites in Firebase Console (see Step 4 above)

### **Issue 2: Site Names Don't Match**
- **Fix**: Verify names match exactly (case-sensitive)
- **Check**: firebase.json site names
- **Check**: Firebase Console site names

### **Issue 3: Deployment Failed**
- **Fix**: Check error messages
- **Fix**: Authenticate if needed
- **Fix**: Redeploy

### **Issue 4: Cache**
- **Fix**: Clear browser cache
- **Fix**: Try incognito window
- **Fix**: Wait 2-3 minutes

---

## 📋 **Complete Checklist**

- [ ] Sites exist in Firebase Console
- [ ] Site names match exactly (case-sensitive)
- [ ] firebase.json has correct site names
- [ ] .firebaserc has correct project ID
- [ ] Latest deployment shows "Success"
- [ ] Files are in deployment
- [ ] Waited 2-3 minutes after deployment
- [ ] Cleared browser cache
- [ ] Tried incognito window
- [ ] URLs are correct

---

## 🎯 **Quick Fix Steps**

1. ✅ **Check Firebase Console** - Verify sites exist
2. ✅ **Create sites if missing** - Use exact names
3. ✅ **Run verification**: `verify-firebase-sites.bat`
4. ✅ **Redeploy**: `deploy-both-sites.bat`
5. ✅ **Wait 2-3 minutes** for propagation
6. ✅ **Test URLs** in browser

---

**Most likely issue: Sites don't exist in Firebase Console. Create them first, then redeploy!**

