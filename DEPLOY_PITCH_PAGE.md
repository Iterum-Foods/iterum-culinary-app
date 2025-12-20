# 🚀 Deploy Pitch Page to Firebase Hosting

## ✅ **Configuration Complete**

I've already configured everything needed to deploy the pitch page:

### **1. Firebase Configuration** ✅
- **File**: `firebase.json`
- **Landing Site**: `iterum-culinary-landing`
- **Routes Added**:
  - `/pitch` → `/pitch.html`
  - `/pitch.html` → `/pitch.html`

### **2. Pitch Page** ✅
- **File**: `public/pitch.html`
- **Status**: Ready to deploy
- **Location**: Already in the `public` folder

### **3. Hosting Targets** ✅
- **File**: `.firebaserc`
- **Site**: `iterum-culinary-landing` is configured

---

## 🔐 **Step 1: Re-authenticate Firebase**

Your Firebase credentials have expired. You need to log in again:

```bash
firebase login --reauth
```

This will:
1. Open your browser
2. Ask you to sign in with your Google account
3. Grant permissions to Firebase CLI

---

## 🚀 **Step 2: Deploy the Pitch Page**

Once authenticated, deploy the landing site:

```bash
firebase deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2
```

Or use the deployment script:

```bash
.\deploy-node-direct.bat
```

---

## 📍 **After Deployment**

Your pitch page will be available at:

- **Primary URL**: `https://iterum-culinary-landing.web.app/pitch`
- **Alternative URL**: `https://iterum-culinary-landing.web.app/pitch.html`
- **Custom Domain**: (if configured)

You can also access it via the Firebase Console:
https://console.firebase.google.com/u/0/project/iterum-culinary-app2/hosting/sites/iterum-culinary-landing

---

## 🧪 **Verify Deployment**

After deployment, check:

1. ✅ Visit: `https://iterum-culinary-landing.web.app/pitch`
2. ✅ Check that the page loads correctly
3. ✅ Verify all assets (CSS, images) load
4. ✅ Test responsive design on mobile

---

## 📋 **What Gets Deployed**

The deployment will include:
- ✅ `pitch.html` - The pitch page
- ✅ `landing.html` - Landing page (homepage)
- ✅ All assets (CSS, JS, images, icons)
- ✅ All supporting files in the `public` folder

---

## ⚠️ **If Deployment Fails**

### **Authentication Issues**
```bash
firebase login --reauth
```

### **Project Not Found**
```bash
firebase use iterum-culinary-app2
```

### **Permission Denied**
- Check that you have the correct permissions in Firebase Console
- Verify you're using the correct Google account

---

## 🎯 **Quick Deploy Command**

Once authenticated, you can deploy just the landing site with:

```bash
firebase deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2
```

This will deploy only the `iterum-culinary-landing` site, which includes:
- Landing page (`/`)
- Pitch page (`/pitch` and `/pitch.html`)
- All associated assets

---

**Status**: ✅ **Configuration Ready - Awaiting Authentication & Deployment**

Next: Run `firebase login --reauth` then deploy!

