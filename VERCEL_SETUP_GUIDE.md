# 🚀 Vercel Setup Guide - Step by Step

## **Quick Setup (5 Minutes)**

### **Step 1: Sign Up / Sign In**
1. Go to: https://vercel.com
2. Click **"Start Deploying"** or **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

---

### **Step 2: Import Repository**
1. Click **"Add New..."** → **"Project"**
2. Find repository: **`Iterum-Foods/iterum-culinary-app`**
3. Click **"Import"**

---

### **Step 3: Configure Project Settings**

**Important Settings:**

#### **Framework Preset:**
- Select: **"Other"** or **"Static Site"**

#### **Root Directory:**
- **IMPORTANT:** Click **"Edit"** next to Root Directory
- Change from: `./` 
- To: `public`
- This tells Vercel to deploy from the `public` folder

#### **Build Command:**
- **Leave EMPTY** (no build needed for static site)

#### **Output Directory:**
- **Leave EMPTY** (already in `public` folder)

#### **Install Command:**
- **Leave EMPTY** (no dependencies needed for deployment)

---

### **Step 4: Environment Variables (Optional)**

**If you need Firebase config:**
- Go to **"Environment Variables"** section
- Add any Firebase config vars if needed
- (Usually not needed - Firebase config is in `firebase-config.js`)

---

### **Step 5: Deploy!**
1. Click **"Deploy"**
2. Wait 1-2 minutes
3. ✅ **Done!**

---

## **What Happens Next**

### **Automatic:**
- ✅ Vercel creates a deployment
- ✅ Assigns a URL: `iterum-culinary-app-xxxxx.vercel.app`
- ✅ Sets up HTTPS automatically
- ✅ Creates a CDN distribution

### **Future Deployments:**
- ✅ **Every push to `main`** → Auto-deploys
- ✅ **Every PR** → Creates preview URL
- ✅ **Instant deployments** → Usually < 1 minute

---

## **Custom Domain (Optional)**

### **Add Your Own Domain:**
1. Go to **Project Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `app.iterum.app`)
4. Follow DNS instructions
5. Wait for DNS propagation (5-60 minutes)

---

## **Settings Summary**

```
Framework Preset: Other / Static Site
Root Directory: public
Build Command: (empty)
Output Directory: (empty)
Install Command: (empty)
```

---

## **Troubleshooting**

### **"Build Failed" Error:**
- ✅ Check Root Directory is set to `public`
- ✅ Verify `public/index.html` exists
- ✅ Check build logs in Vercel dashboard

### **"404 Not Found" Error:**
- ✅ Check `vercel.json` rewrites are correct
- ✅ Verify routes are configured properly

### **"Files Not Found" Error:**
- ✅ Ensure Root Directory is `public` (not `./`)
- ✅ Check `public/assets/` folder exists

---

## **Verify Deployment**

### **Check These:**
1. ✅ Site loads: `https://your-project.vercel.app`
2. ✅ Dashboard works: `https://your-project.vercel.app/dashboard.html`
3. ✅ Sign-in works: `https://your-project.vercel.app/signin.html`
4. ✅ Assets load: Check browser console (F12)

---

## **Keep Firebase For:**
- ✅ **Firestore Database** - Still works!
- ✅ **Firebase Storage** - Still works!
- ✅ **Firebase Auth** - Still works!
- ✅ **Only hosting moved to Vercel**

---

## **Update Documentation**

After deployment, update:
- `README.md` - Update live URL
- `README_START_HERE.md` - Update URLs
- Any other docs with Firebase hosting URLs

---

## **Need Help?**

**Vercel Dashboard:**
- View deployments: https://vercel.com/dashboard
- Check logs: Project → Deployments → Click deployment → Logs
- Settings: Project → Settings

**Common Issues:**
- Root Directory must be `public`
- No build command needed
- Rewrites handled by `vercel.json`

---

**You're all set! Let me know if you need help during setup.** 🚀

