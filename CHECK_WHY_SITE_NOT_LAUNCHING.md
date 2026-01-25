# 🔍 Check Why Site Isn't Launching

## **What I Just Changed**

1. **Simplified firebase.json**: Changed from `target` to `site` (direct approach)
2. **Simplified deployment**: Using `firebase deploy --only hosting` (uses site from firebase.json)
3. **Better logging**: Added more detailed output to see what's happening

---

## **Step 1: Check GitHub Actions Logs**

The deployment should have triggered. Check:

1. **Go to**: https://github.com/Iterum-Foods/iterum-culinary-app/actions
2. **Click** the latest workflow run
3. **Click** on "Deploy to Firebase App Site" step
4. **Scroll down** and look for:

### **What to Look For:**

**✅ Success indicators:**
- "✅ App site deployed successfully"
- "Deployed successfully"
- File count (should show many files)
- "Site URL: https://iterum-culinary-app2.web.app"

**❌ Error indicators:**
- "❌ Deployment to app site failed"
- "Site not found"
- "Permission denied"
- "401" or "403" errors

---

## **Step 2: Check Firebase Console**

1. **Go to**: https://console.firebase.google.com/project/iterum-culinary-app2/hosting
2. **Click** on `iterum-culinary-app2` site
3. **Check "Deployments" tab:**
   - Is there a recent deployment?
   - What's the status? (Success/Failed)
   - What's the file count?
   - When was it deployed?

4. **Click on the latest deployment:**
   - Are files listed?
   - Is `index.html` there?
   - Is `assets/` folder there?

---

## **Step 3: Test the URL**

Go to: **https://iterum-culinary-app2.web.app**

**What do you see?**
- ✅ Page loads = Deployment worked!
- ❌ 404 Not Found = Site doesn't exist or deployment failed
- ❌ Blank page = Files deployed but routing issue
- ❌ Error message = Check browser console (F12)

---

## **Common Issues & Fixes**

### **Issue 1: "Site not found" Error**
**Fix**: Site must exist in Firebase Console
- Go to Firebase Console → Hosting
- Create site: `iterum-culinary-app2`

### **Issue 2: Deployment Succeeds But Site Blank**
**Possible causes:**
- Files not in deployment
- Routing issue
- Check Firebase Console → Deployments → File list

### **Issue 3: 401/403 Errors**
**Fix**: FIREBASE_TOKEN is invalid
- Generate new token: `firebase login:ci`
- Update GitHub Secret: FIREBASE_TOKEN

### **Issue 4: Files Not Deployed**
**Check:**
- Are files in `public/` folder?
- Are files committed to Git?
- Check GitHub Actions "Verify public directory" step

---

## **Quick Diagnostic**

**Share this information:**

1. **GitHub Actions status**: ✅ Success or ❌ Failed?
2. **Error message** (if any) from the deployment step
3. **Firebase Console**: Does deployment show as "Success"?
4. **URL test**: What do you see at https://iterum-culinary-app2.web.app?

---

## **Next Steps**

1. **Check GitHub Actions logs** (most important)
2. **Share the error message** if deployment failed
3. **Check Firebase Console** for deployment status
4. **Test the URL** and report what you see

**The GitHub Actions logs will tell us exactly what's wrong!**

