# 📦 Archive Plan for Main Folder

## ✅ **Files Safe to Archive**

### **1. Outdated Documentation (22 files)**
These are setup/status docs that are no longer needed:

- ✅ `BYPASS_POWERSHELL_COMPLETE.md` - Setup complete, no longer needed
- ✅ `USE_CMD_NOT_POWERSHELL.md` - Setup complete
- ✅ `FIX_INVALID_PROJECT_ID.md` - Issue resolved
- ✅ `SINGLE_PROJECT_ISOLATION_COMPLETE.md` - Task complete
- ✅ `PROJECT_ISOLATION_VERIFICATION.md` - Verification done
- ✅ `TWO_SITES_SETUP.md` - Setup complete
- ✅ `USE_WORKING_PROJECT.md` - Setup complete
- ✅ `TEST_FIRESTORE_NOW.md` - Testing complete
- ✅ `TEST_LOCALLY.md` - Testing guide (outdated)
- ✅ `VERIFY_WAITLIST_BACKEND.md` - Verification done
- ✅ `FIREBASE_FILES_CLEANUP.md` - Cleanup complete
- ✅ `FIREBASE_ERROR_TROUBLESHOOTING.md` - Issues resolved
- ✅ `FIREBASE_SETUP_CHECKLIST.md` - Setup complete
- ✅ `FIREBASE_SETUP_STATUS.md` - Status outdated
- ✅ `DEPLOY_IN_CMD.md` - Superseded by DEPLOY_NOW.md
- ✅ `QUICK_LOGIN_GUIDE.md` - Superseded by current docs
- ✅ `GET_STARTED_INGREDIENTS_INVENTORY.md` - Outdated guide
- ✅ `INGREDIENT_DATABASE_EXPANSION.md` - Task complete
- ✅ `INGREDIENTS_INVENTORY_PATH.md` - Outdated
- ✅ `UI_IMPROVEMENT_AUDIT.md` - Audit complete
- ✅ `SIGNIN_FIXES_SUMMARY.md` - Fixes complete
- ✅ `UI_UPDATE_STATUS.md` - Status outdated
- ✅ `HOSTING_STATUS.md` - Status outdated

### **2. Duplicate Data Files (4 files)**
These are source files that have been loaded into the app:

- ✅ `89-charles-fall-menu.json` - Loaded into app, original can be archived
- ✅ `89-charles-prep-specs.json` - Loaded into app
- ✅ `89-charles-recipes.json` - Loaded into app
- ✅ `Korean-Inspired Bulgogi-Spiced Flank Steak with Roasted Pepper & Onion Farro Salad.pdf` - Recipe PDF (duplicate)

### **3. Old Profile Files (5 files)**
User profile backups that are likely outdated:

- ✅ `profiles/20364160.json`
- ✅ `profiles/28284971.json`
- ✅ `profiles/72236103.json`
- ✅ `profiles/87756715.json`
- ✅ `profiles/98670157.json`

### **4. Other Files**
- ✅ `equipment_database.csv` - If duplicate exists in `data/` folder
- ✅ `âœ… PROFESSIONAL-LANDING-REBRANDED.md` - Old status file with emoji

---

## ❌ **Files to KEEP in Root**

### **Essential Documentation**
- ❌ `README.md` - Main project documentation
- ❌ `README_START_HERE.md` - User getting started guide
- ❌ `CONTRIBUTING.md` - Contributor guidelines
- ❌ `LICENSE` - License file
- ❌ `FIREBASE_FILES_VERIFICATION.md` - Current Firebase status
- ❌ `DEPLOY_NOW.md` - Active deployment guide
- ❌ `MASTER_UI_TEMPLATE.md` - UI reference (just created)
- ❌ `STORAGE_SYSTEM_OVERVIEW.md` - Storage docs (just created)
- ❌ `ARCHITECTURE_INGREDIENTS_CENTRIC.md` - Architecture reference

### **Active Configuration Files**
- ❌ `firebase.json` - Active Firebase config
- ❌ `firestore.rules` - Active Firestore rules
- ❌ `storage.rules` - Active Storage rules
- ❌ `.firebaserc` - Firebase project config (if exists)

### **Active Scripts**
- ❌ `deploy-node-direct.bat` - Active deployment script
- ❌ `firebase-login.bat` - Active login script
- ❌ `start-local-server.bat` - Active local server script
- ❌ `verify-project.bat` - Active verification script
- ❌ `cleanup-old-firebase-files.bat` - Utility script
- ❌ `archive-requested-files.bat` - Archive utility
- ❌ `archive-root-files.bat` - Archive utility

### **Package Files**
- ❌ `package.json` - NPM package config
- ❌ `package-lock.json` - NPM lock file
- ❌ `jest.config.js` - Test config
- ❌ `playwright.config.js` - Test config
- ❌ `postcss.config.js` - PostCSS config
- ❌ `tailwind.config.js` - Tailwind config
- ❌ `pytest.ini` - Python test config

### **Environment Templates**
- ❌ `env.template` - Environment template
- ❌ `env.https.example` - HTTPS example

### **Active Data Files**
- ❌ `data/` folder - Active data directory
- ❌ `public/` folder - Active public directory
- ❌ `node_modules/` - NPM dependencies

---

## 📊 **Archive Summary**

**Total files to archive**: ~31 files
- 22 documentation files
- 4 data files (JSON + PDF)
- 5 profile files

**Archive location**: `archive/root-files/`
- `documentation/` - All .md files
- `data-files/` - JSON, PDF, CSV files
- `profiles/` - Profile JSON files

---

## 🚀 **How to Run**

1. **Review the plan** - Check that files listed are safe to archive
2. **Run the script**:
   ```cmd
   archive-main-folder.bat
   ```
3. **Verify** - Check that essential files remain in root
4. **Test** - Ensure app still works after archiving

---

## ⚠️ **Safety Notes**

- ✅ Script uses `move` (not `delete`) - files are moved, not deleted
- ✅ All files go to `archive/root-files/` - easy to restore if needed
- ✅ Essential files are explicitly kept
- ✅ Script pauses before running - you can review first

---

**Created**: 2025-01-XX
**Status**: Ready to run


