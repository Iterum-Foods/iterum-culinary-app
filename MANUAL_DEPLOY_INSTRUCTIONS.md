# 🚀 Manual Deployment Instructions for Pitch Page

## ⚠️ **Current Issue**

There appears to be a Firebase CLI configuration conflict preventing automated deployment. Here are manual steps to deploy:

---

## **Option 1: Deploy via Firebase Console (Easiest)**

### **Step 1: Access Firebase Console**
1. Go to: https://console.firebase.google.com/u/0/project/iterum-culinary-app2/hosting/sites/iterum-culinary-landing
2. Sign in with your Google account

### **Step 2: Manual Upload (if needed)**
If the console allows file uploads:
1. Click "Upload files" or "Deploy"
2. Upload the `public` folder contents
3. Or use the Firebase CLI from the console

---

## **Option 2: Fix CLI and Deploy**

### **Step 1: Clear Firebase Cache**
```bash
# Clear npm cache
npm cache clean --force

# Remove Firebase CLI and reinstall
npm uninstall -g firebase-tools
npm install -g firebase-tools@latest
```

### **Step 2: Try Login Again**
```bash
firebase login --reauth
```

### **Step 3: Deploy**
```bash
firebase deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2
```

---

## **Option 3: Use Firebase CLI in CMD (not PowerShell)**

1. Open **Command Prompt** (not PowerShell)
2. Navigate to project:
   ```cmd
   cd "C:\Users\chefm\Iterum Innovation\iterum-culinary-app"
   ```
3. Login:
   ```cmd
   firebase login --reauth
   ```
4. Deploy:
   ```cmd
   firebase deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2
   ```

---

## **Option 4: Use GitHub Actions (Automated)**

If you have a GitHub repository, you can set up automated deployment:

1. Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install -g firebase-tools
      - run: firebase deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2 --token ${{ secrets.FIREBASE_TOKEN }}
```

2. Generate a CI token:
   ```bash
   firebase login:ci
   ```
3. Add token to GitHub Secrets as `FIREBASE_TOKEN`

---

## **What's Already Configured** ✅

- ✅ `firebase.json` - Routes configured for `/pitch` and `/pitch.html`
- ✅ `public/pitch.html` - Pitch page ready
- ✅ `.firebaserc` - Hosting targets configured
- ✅ All assets and dependencies ready

---

## **After Deployment**

Your pitch page will be available at:
- **Primary**: https://iterum-culinary-landing.web.app/pitch
- **Alternative**: https://iterum-culinary-landing.web.app/pitch.html

---

## **Quick Test**

Once deployed, verify:
1. ✅ Page loads correctly
2. ✅ All CSS/styles load
3. ✅ All images/icons load
4. ✅ Navigation works
5. ✅ Mobile responsive

---

**Recommendation**: Try **Option 3** (CMD instead of PowerShell) first, as PowerShell might be causing the configuration conflict.

