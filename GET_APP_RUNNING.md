# 🚀 How to Get the App Up and Running

## **Quick Start Guide**

---

## **Option 1: Run Locally (Fastest Way)**

### **Step 1: Install Node.js**
- Download: https://nodejs.org/
- Install Node.js 20.x or higher
- Verify: `node --version` (should show 20.x or higher)

### **Step 2: Install Dependencies**
```cmd
npm install
```

### **Step 3: Start Local Server**
```cmd
npm start
```

This will:
- Start HTTP server on port 8080
- Open browser automatically
- Show the app at: http://localhost:8080

**That's it! The app should be running locally.**

---

## **Option 2: Deploy to Firebase Hosting (Production)**

### **Step 1: Install Firebase CLI**
```cmd
npm install -g firebase-tools
```

### **Step 2: Authenticate**
```cmd
firebase login
```

### **Step 3: Set Project**
```cmd
firebase use iterum-culinary-app2
```

### **Step 4: Deploy**
```cmd
firebase deploy --only hosting
```

**Or use the batch script:**
```cmd
deploy-both-sites.bat
```

---

## **Option 3: Use GitHub Actions (Automatic)**

### **Current Status:**
- ✅ Workflow configured
- ✅ Files ready
- ⚠️ Site may need to exist in Firebase Console

### **Steps:**

1. **Verify Site Exists:**
   - Go to: https://console.firebase.google.com/project/iterum-culinary-app2/hosting
   - Check if `iterum-culinary-app2` site exists
   - If not, create it

2. **Verify FIREBASE_TOKEN:**
   - Go to: https://github.com/Iterum-Foods/iterum-culinary-app/settings/secrets/actions
   - Check if `FIREBASE_TOKEN` exists
   - If not, generate one: `firebase login:ci`

3. **Trigger Deployment:**
   - Push any change to `main` branch
   - Or manually trigger: GitHub Actions → "Deploy to Firebase Hosting" → "Run workflow"

4. **Check Deployment:**
   - Go to: https://github.com/Iterum-Foods/iterum-culinary-app/actions
   - Check if deployment succeeded
   - Test: https://iterum-culinary-app2.web.app

---

## **Troubleshooting**

### **Local Server Issues:**

**Port 8080 already in use:**
```cmd
npm run dev
```
(Uses port 8080 with cache disabled)

**Files not loading:**
- Check `public/` folder exists
- Check browser console for errors (F12)

---

### **Deployment Issues:**

**"Site not found" Error:**
1. Go to Firebase Console
2. Create site: `iterum-culinary-app2`
3. Re-run deployment

**"401 Authentication" Error:**
1. Generate new token: `firebase login:ci`
2. Update GitHub Secret: `FIREBASE_TOKEN`

**Site deployed but not showing:**
1. Check Firebase Console → Hosting → Deployments
2. Verify files are in deployment
3. Check browser console for errors
4. Try incognito mode (clears cache)

---

## **What the App Includes**

- ✅ **Dashboard** - Main operations hub
- ✅ **Recipe Developer** - Create and manage recipes
- ✅ **Recipe Library** - Browse recipes
- ✅ **Ingredients** - Manage ingredients
- ✅ **Inventory** - Track inventory
- ✅ **Equipment** - Manage equipment
- ✅ **Projects** - Project management
- ✅ **Menu Builder** - Create menus
- ✅ **Sign In** - User authentication

---

## **Quick Commands**

### **Local Development:**
```cmd
npm start          # Start server (port 8080)
npm run dev        # Start with cache disabled
npm test           # Run tests
npm run lint       # Check code quality
```

### **Deployment:**
```cmd
firebase deploy --only hosting
```

### **Verification:**
```cmd
verify-all-files-deployed.bat    # Check all files present
verify-firebase-connection.bat   # Check Firebase config
```

---

## **Recommended: Start Locally First**

1. **Run locally** to verify everything works
2. **Test all features** 
3. **Then deploy** to Firebase

**Local is fastest for development and testing!**

---

**Choose Option 1 (Local) to get started immediately!**

