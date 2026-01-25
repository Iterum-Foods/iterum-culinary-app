# 🔧 Fix "Site Not Found" Error

## **The Problem**
The error "site not found" means the Firebase Hosting sites don't exist yet in your Firebase project.

---

## **Quick Fix: Create Sites in Firebase Console**

### **Step 1: Go to Firebase Hosting**
1. Open: https://console.firebase.google.com/project/iterum-culinary-app2/hosting
2. Sign in with your Google account

### **Step 2: Create First Site (Landing)**
1. If you see "Get started" or "Add another site", click it
2. Enter site ID: **`iterum-culinary-landing`** (exactly as shown)
3. Click **"Continue"** or **"Create site"**
4. Wait for confirmation

### **Step 3: Create Second Site (App)**
1. Click **"Add another site"** (or "Add site" if it's your first)
2. Enter site ID: **`iterum-culinary-app2`** (exactly as shown)
3. Click **"Continue"** or **"Create site"**
4. Wait for confirmation

### **Step 4: Verify Sites Created**
You should now see both sites listed:
- ✅ `iterum-culinary-landing`
- ✅ `iterum-culinary-app2`

---

## **Alternative: Use Firebase CLI**

### **Step 1: Authenticate**
```cmd
firebase-login-direct.bat
```

### **Step 2: Verify Project**
```cmd
firebase use
```
Should show: `Now using project iterum-culinary-app2`

If not:
```cmd
firebase use iterum-culinary-app2
```

### **Step 3: Create Sites**
```cmd
firebase hosting:sites:create iterum-culinary-landing
firebase hosting:sites:create iterum-culinary-app2
```

### **Step 4: Verify Sites**
```cmd
firebase hosting:sites:list
```

Should show both sites.

---

## **After Creating Sites**

### **Option 1: Deploy via GitHub Actions**
1. Push any change to trigger deployment
2. Or manually trigger workflow in GitHub Actions
3. Deployment should now succeed

### **Option 2: Deploy Locally**
```cmd
deploy-both-sites.bat
```

---

## **Verify Sites Are Working**

After deployment, test:
- **Landing**: https://iterum-culinary-landing.web.app
- **App**: https://iterum-culinary-app2.web.app

---

## **Common Issues**

### **"Permission denied"**
- Make sure you're logged in with the correct Google account
- Account must have Owner/Editor permissions on the project

### **"Site ID already exists"**
- Site might exist but not be visible
- Check Firebase Console to see all sites
- Try listing: `firebase hosting:sites:list`

### **"Project not found"**
- Verify project ID: `firebase use`
- Should show: `iterum-culinary-app2`

---

## **Quick Checklist**

- [ ] Go to Firebase Console Hosting
- [ ] Create site: `iterum-culinary-landing`
- [ ] Create site: `iterum-culinary-app2`
- [ ] Verify both sites are listed
- [ ] Deploy again (GitHub Actions or local)
- [ ] Test URLs in browser

---

**Once sites are created, the deployment will work!**

