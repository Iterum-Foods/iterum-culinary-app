# 📋 Complete File Deployment Checklist

## **Critical Files (Must Be Deployed)**

### **Landing Site Files** (`iterum-culinary-landing`)
- ✅ `landing.html` - Main landing page
- ✅ `pitch.html` - Investor pitch page
- ✅ `company.html` - Company information page
- ✅ `404.html` - Error page

### **App Site Files** (`iterum-culinary-app2`)
- ✅ `index.html` - App entry point
- ✅ `dashboard.html` - Main dashboard
- ✅ `signin.html` - Authentication page
- ✅ `404.html` - Error page

### **Core Application Pages**
- ✅ `recipe-developer.html` - Recipe development tool
- ✅ `recipe-library.html` - Recipe library
- ✅ `recipe-canvas.html` - Canvas-style recipe builder
- ✅ `ingredients.html` - Ingredients management
- ✅ `inventory.html` - Inventory management
- ✅ `equipment-management.html` - Equipment tracking
- ✅ `project-hub.html` - Project management
- ✅ `menu-builder.html` - Menu builder

### **Supporting Pages**
- ✅ `bulk-ingredient-import.html` - Bulk import tool
- ✅ `data-backup-center.html` - Data backup
- ✅ `vendor-management.html` - Vendor management
- ✅ `vendor-price-comparison.html` - Price comparison
- ✅ `recipe-scaling-tool.html` - Recipe scaling
- ✅ `inventory-variance.html` - Inventory variance
- ✅ `production-planning.html` - Production planning
- ✅ `calendar.html` - Calendar view
- ✅ `ingredient-highlights.html` - Ingredient highlights
- ✅ `kitchen-management.html` - Kitchen management
- ✅ `recipe-photo-studio.html` - Photo studio
- ✅ `user_management.html` - User management
- ✅ `user-profile.html` - User profile
- ✅ `contact_management.html` - Contact management
- ✅ `data-management-dashboard.html` - Data dashboard
- ✅ `audit-log.html` - Audit log
- ✅ `server-info-sheet.html` - Server info

---

## **Assets Directory Structure**

### **CSS Files** (`public/assets/css/`)
- ✅ `iterum-brand-kit.css` - Brand kit
- ✅ `iterum-design-system.css` - Design system
- ✅ `unified-header.css` - Universal header
- ✅ `recipe-canvas-builder.css` - Canvas builder styles
- ✅ All other CSS files (30+ files)

### **JavaScript Files** (`public/assets/js/`)
- ✅ `firebase-config.js` - Firebase configuration
- ✅ `firebase-auth.js` - Firebase authentication
- ✅ `firebase-storage.js` - Firebase storage
- ✅ `auth-manager.js` - Authentication manager
- ✅ `recipe-manager.js` - Recipe management
- ✅ `inventory-manager.js` - Inventory management
- ✅ All other JS files (130+ files)

### **Images** (`public/assets/images/`)
- ✅ `botanical-logo.svg` - Logo
- ✅ Other image assets

### **Icons** (`public/assets/icons/`)
- ✅ `iterum.ico` - Favicon

---

## **Configuration Files**

### **Firebase Configuration**
- ✅ `firebase.json` - Firebase hosting config
  - ✅ Landing site: `iterum-culinary-landing`
  - ✅ App site: `iterum-culinary-app2`
- ✅ `.firebaserc` - Firebase project config
  - ✅ Project ID: `iterum-culinary-app2`

### **GitHub Actions**
- ✅ `.github/workflows/firebase-deploy.yml` - Deployment workflow

---

## **Verification Commands**

### **Check Files Locally:**
```cmd
verify-all-files-deployed.bat
```

### **Check Deployment Status:**
1. **GitHub Actions:**
   - https://github.com/Iterum-Foods/iterum-culinary-app/actions
   - Look for latest deployment run
   - Should show ✅ green checkmarks

2. **Firebase Console:**
   - https://console.firebase.google.com/project/iterum-culinary-app2/hosting
   - Check both sites:
     - `iterum-culinary-landing`
     - `iterum-culinary-app2`
   - Verify latest deployment shows "Success"
   - Check file count (should be 100+ files)

3. **Test URLs:**
   - Landing: https://iterum-culinary-landing.web.app
   - Landing Pitch: https://iterum-culinary-landing.web.app/pitch
   - App: https://iterum-culinary-app2.web.app
   - App Dashboard: https://iterum-culinary-app2.web.app/dashboard.html
   - App Sign-in: https://iterum-culinary-app2.web.app/signin.html

---

## **Common Issues**

### **Files Not Deployed**
- **Check**: `firebase.json` ignore rules
- **Fix**: Ensure files aren't in ignore list

### **404 Errors**
- **Check**: File exists in `public/` folder
- **Check**: File is committed to Git
- **Check**: Deployment succeeded in GitHub Actions

### **CSS/JS Not Loading**
- **Check**: `assets/` folder is in deployment
- **Check**: File paths are correct in HTML
- **Check**: No CORS errors in browser console

---

## **Quick Verification Script**

Run this to check everything:
```cmd
verify-all-files-deployed.bat
```

This will:
- ✅ Check all critical HTML files
- ✅ Verify assets directory structure
- ✅ Check critical JavaScript files
- ✅ Verify configuration files
- ✅ Report any errors or warnings

---

**All files should be present and deployed for the app to work correctly!**

