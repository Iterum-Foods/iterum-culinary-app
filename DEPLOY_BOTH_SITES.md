# 🚀 Deploy Both Firebase Sites

## ✅ **Two Hosting Sites**

Your Firebase project has **two separate hosting sites**:

### **1. Landing Site** (`iterum-culinary-landing`)
- **Purpose**: Marketing, investor pages, pitch deck
- **URL**: https://iterum-culinary-landing.web.app
- **Pages**:
  - Landing page (`/`)
  - Pitch page (`/pitch`)
  - Company page (`/company.html`)

### **2. Main App Site** (`iterum-culinary-app2`)
- **Purpose**: Main application with login
- **URL**: https://iterum-culinary-app2.web.app
- **Pages**:
  - Dashboard (`/dashboard.html`)
  - Sign-in (`/signin.html`)
  - Recipe tools, inventory, etc.

---

## 🚀 **Deploy Both Sites**

### **Option 1: Use Deployment Script** (Recommended)

I've created `deploy-both-sites.bat` that deploys both sites:

1. **Open Command Prompt** (not PowerShell):
   - Press `Win + R`
   - Type: `cmd`
   - Press Enter

2. **Navigate to project:**
   ```cmd
   cd "C:\Users\chefm\Iterum Innovation\iterum-culinary-app"
   ```

3. **Run deployment script:**
   ```cmd
   deploy-both-sites.bat
   ```

This will:
- ✅ Check authentication
- ✅ Deploy landing site first
- ✅ Deploy main app site second
- ✅ Show URLs for both sites

---

### **Option 2: Deploy Individually**

#### **Deploy Landing Site:**
```cmd
"C:\Program Files\nodejs\node.exe" "C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js" deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2
```

#### **Deploy Main App Site:**
```cmd
"C:\Program Files\nodejs\node.exe" "C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js" deploy --only hosting:iterum-culinary-app2 --project iterum-culinary-app2
```

---

### **Option 3: Deploy All at Once**

Deploy both sites in one command:
```cmd
"C:\Program Files\nodejs\node.exe" "C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js" deploy --only hosting --project iterum-culinary-app2
```

---

## 📋 **What Gets Deployed**

### **Landing Site** (`iterum-culinary-landing`)
- `landing.html` → `/`
- `pitch.html` → `/pitch`
- `company.html` → `/company.html`
- All assets (CSS, JS, images)

### **Main App Site** (`iterum-culinary-app2`)
- `index.html` → `/`
- `dashboard.html` → `/dashboard.html`
- `signin.html` → `/signin.html`
- All app pages (recipes, inventory, etc.)
- All assets (CSS, JS, images)

---

## ✅ **After Deployment**

### **Landing Site URLs:**
- https://iterum-culinary-landing.web.app
- https://iterum-culinary-landing.web.app/pitch
- https://iterum-culinary-landing.web.app/company.html

### **Main App URLs:**
- https://iterum-culinary-app2.web.app
- https://iterum-culinary-app2.web.app/dashboard.html
- https://iterum-culinary-app2.web.app/signin.html

---

## 🔍 **Verify Deployment**

1. **Check Firebase Console:**
   - Go to: https://console.firebase.google.com/u/0/project/iterum-culinary-app2/hosting
   - You should see both sites listed
   - Check "Deployments" tab for each site

2. **Test URLs:**
   - Visit both site URLs
   - Verify pages load correctly
   - Check all links work

---

## ⚠️ **Important Notes**

- **Two Separate Sites**: These are completely separate hosting sites
- **Same Project**: Both use project `iterum-culinary-app2`
- **Different URLs**: Each has its own `.web.app` domain
- **Propagation**: Deployments take 1-2 minutes to propagate

---

## 🎯 **Quick Summary**

1. ✅ Run: `deploy-both-sites.bat` in Command Prompt
2. ✅ Authenticate if needed
3. ✅ Wait for both deployments to complete
4. ✅ Verify both sites are live
5. ✅ Test all URLs

---

**This will deploy both your landing/marketing site AND your main application!**

