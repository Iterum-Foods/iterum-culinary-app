# 🔍 How to Check GitHub Actions Deployment Errors

## **Step-by-Step Guide**

### **1. Navigate to GitHub Actions**

1. Go to your repository: https://github.com/Iterum-Foods/iterum-culinary-app
2. Click the **"Actions"** tab at the top
3. You'll see a list of workflow runs

### **2. Find the Failed Run**

- Look for a run with a ❌ red X or ⚠️ yellow warning
- Click on the failed run to open it

### **3. Check the Workflow Steps**

You'll see a list of steps. Look for:
- ✅ Green checkmark = Step succeeded
- ❌ Red X = Step failed
- ⚠️ Yellow warning = Step had warnings

### **4. Click on the Failed Step**

Click on the step that failed (usually one of these):
- "Deploy to Firebase Landing Site"
- "Deploy to Firebase App Site"
- "Install Firebase CLI"
- "Verify Firebase CLI"

### **5. Read the Error Message**

Scroll down in the log output to find the actual error. Look for:

#### **Common Error Messages:**

**"Authentication Error" or "Your credentials are no longer valid"**
- **Problem**: FIREBASE_TOKEN is expired or invalid
- **Fix**: Generate new token: `firebase login:ci`
- **Then**: Update GitHub Secret: Settings → Secrets → Actions → FIREBASE_TOKEN

**"Site 'iterum-culinary-landing' not found"**
- **Problem**: Site doesn't exist in Firebase Console
- **Fix**: Create site in Firebase Console
- **Link**: https://console.firebase.google.com/project/iterum-culinary-app2/hosting

**"Permission denied"**
- **Problem**: Token doesn't have hosting permissions
- **Fix**: Regenerate token with proper permissions

**"Invalid project id"**
- **Problem**: Project ID in `.firebaserc` doesn't match Firebase
- **Fix**: Check `.firebaserc` file has correct project ID

**"Firebase CLI v15.1.0 is incompatible with Node.js v18.20.8"**
- **Problem**: Wrong Node.js version
- **Status**: ✅ Already fixed (using Node.js 20.x)

**"Error: public directory not found"**
- **Problem**: `public/` folder missing
- **Fix**: Ensure `public/` folder is in repository

**"Error: firebase.json not found"**
- **Problem**: Configuration file missing
- **Fix**: Ensure `firebase.json` is committed

### **6. Copy the Full Error Message**

Copy the entire error message (from the log) and share it for troubleshooting.

---

## **Quick Checklist**

Before checking logs, verify:

- [ ] FIREBASE_TOKEN secret exists in GitHub (Settings → Secrets → Actions)
- [ ] Sites exist in Firebase Console (`iterum-culinary-landing`, `iterum-culinary-app2`)
- [ ] `.firebaserc` has correct project ID: `iterum-culinary-app2`
- [ ] `firebase.json` exists and is committed
- [ ] `public/` folder exists and is committed

---

## **Screenshot Locations**

**GitHub Actions:**
```
Repository → Actions Tab → Failed Run → Failed Step → Log Output
```

**Firebase Console:**
```
https://console.firebase.google.com/project/iterum-culinary-app2/hosting
```

---

## **Next Steps After Finding Error**

1. **Note the exact error message**
2. **Check which step failed**
3. **Look up the error in DEPLOYMENT_ERROR_CHECKLIST.md**
4. **Apply the fix**
5. **Re-run the workflow** (or push a new commit)

---

**The improved workflow now provides better error messages to help diagnose issues faster!**

