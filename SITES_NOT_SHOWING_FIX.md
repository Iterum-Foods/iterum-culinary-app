# 🔧 Fix: Sites Not Showing After Deployment

## **Problem**
GitHub Actions ran successfully, but sites still don't show up.

---

## **Most Common Cause: Sites Don't Exist**

The sites must exist in Firebase Console BEFORE deployment can work.

### **Check if Sites Exist:**
1. Go to: https://console.firebase.google.com/project/iterum-culinary-app2/hosting
2. Look for:
   - `iterum-culinary-landing`
   - `iterum-culinary-app2`

**If sites are missing**, you'll see "Get started" or "Add another site" button.

---

## **Solution: Create Sites in Firebase Console**

### **Step 1: Create Landing Site**
1. Go to: https://console.firebase.google.com/project/iterum-culinary-app2/hosting
2. Click **"Add another site"** or **"Get started"**
3. Enter site ID: **`iterum-culinary-landing`** (exactly as shown)
4. Click **"Continue"** or **"Create site"**
5. Wait for confirmation

### **Step 2: Create App Site**
1. Click **"Add another site"** again
2. Enter site ID: **`iterum-culinary-app2`** (exactly as shown)
3. Click **"Continue"** or **"Create site"**
4. Wait for confirmation

### **Step 3: Verify Sites Created**
You should now see both sites listed in Firebase Console.

---

## **After Creating Sites**

### **Option 1: Re-run GitHub Actions**
1. Go to: https://github.com/Iterum-Foods/iterum-culinary-app/actions
2. Click the latest workflow run
3. Click **"Re-run all jobs"**
4. Wait for deployment to complete

### **Option 2: Deploy Locally**
```cmd
deploy-both-sites.bat
```

**Note**: Requires authentication first:
```cmd
firebase-login-direct.bat
```

---

## **Check GitHub Actions Logs**

If deployment failed, check the logs:

1. Go to: https://github.com/Iterum-Foods/iterum-culinary-app/actions
2. Click the failed workflow run
3. Click the failed step (usually "Deploy to Firebase Landing Site" or "Deploy to Firebase App Site")
4. Scroll down to find the error message

### **Common Error Messages:**

**"Site 'iterum-culinary-landing' not found"**
- **Fix**: Create the site in Firebase Console (see above)

**"401, Request had invalid authentication credentials"**
- **Fix**: Update FIREBASE_TOKEN in GitHub Secrets

**"Permission denied"**
- **Fix**: Check Firebase project permissions

---

## **Verify Deployment Worked**

### **1. Check Firebase Console**
- Go to: https://console.firebase.google.com/project/iterum-culinary-app2/hosting
- Click on each site
- Check "Deployments" tab
- Should show recent successful deployment with file count

### **2. Test URLs**
- **Landing**: https://iterum-culinary-landing.web.app
- **App**: https://iterum-culinary-app2.web.app

**If you see:**
- ✅ Page loads = Deployment worked!
- ❌ 404 or "Site not found" = Site doesn't exist or deployment failed
- ❌ Blank page = Files deployed but routing issue

---

## **Troubleshooting Steps**

### **Step 1: Verify Sites Exist**
Run this script:
```cmd
troubleshoot-deployment.bat
```

Or check manually:
```cmd
firebase hosting:sites:list
```

### **Step 2: Check Configuration**
Verify:
- ✅ `.firebaserc` has correct project ID
- ✅ `firebase.json` uses correct targets
- ✅ GitHub workflow uses correct site names

### **Step 3: Check Deployment Logs**
- Check GitHub Actions for specific errors
- Check Firebase Console for deployment history

---

## **Quick Checklist**

- [ ] Sites exist in Firebase Console
- [ ] GitHub Actions workflow ran
- [ ] Deployment shows "Success" in GitHub Actions
- [ ] Deployment shows in Firebase Console
- [ ] URLs work in browser

---

## **If Still Not Working**

1. **Share the error message** from GitHub Actions logs
2. **Check Firebase Console** for deployment history
3. **Verify sites exist** in Firebase Console
4. **Test URLs** in browser (incognito mode to avoid cache)

---

**The most likely issue is that the sites don't exist in Firebase Console. Create them first, then re-run the deployment!**

