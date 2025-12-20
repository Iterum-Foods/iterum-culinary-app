# 📦 Archive Summary - Main Folder Cleanup

## ✅ **Archive Script Created**

**File**: `archive-main-folder.bat`

This script safely archives files from the main folder to `archive/root-files/`

---

## 📋 **What Will Be Archived**

### **1. Outdated Documentation (22 files)**
Setup/status documentation that's no longer needed:
- Setup completion docs (BYPASS_POWERSHELL, USE_CMD, etc.)
- Status files (FIREBASE_SETUP_STATUS, HOSTING_STATUS, etc.)
- Fix completion docs (FIX_INVALID_PROJECT_ID, etc.)
- Testing guides (TEST_LOCALLY, TEST_FIRESTORE_NOW, etc.)
- Outdated guides (QUICK_LOGIN_GUIDE, GET_STARTED, etc.)

### **2. Duplicate Data Files (4 files)**
Source files that have been loaded into the app:
- `89-charles-fall-menu.json`
- `89-charles-prep-specs.json`
- `89-charles-recipes.json`
- `Korean-Inspired Bulgogi-Spiced Flank Steak...pdf`

### **3. Old Profile Files (5 files)**
User profile backups in `profiles/` folder

### **4. Other Files**
- `equipment_database.csv` (if duplicate exists)
- Emoji-marked status files

**Total**: ~31 files

---

## ❌ **Files That Will Be KEPT**

### **Essential Documentation**
- `README.md`
- `README_START_HERE.md`
- `CONTRIBUTING.md`
- `LICENSE`
- `FIREBASE_FILES_VERIFICATION.md`
- `DEPLOY_NOW.md`
- `MASTER_UI_TEMPLATE.md`
- `STORAGE_SYSTEM_OVERVIEW.md`
- `ARCHITECTURE_INGREDIENTS_CENTRIC.md`

### **Active Configuration**
- `firebase.json`
- `firestore.rules`
- `storage.rules`
- All `.bat` scripts
- All config files (package.json, etc.)

### **Active Data**
- `data/` folder
- `public/` folder
- `node_modules/`

---

## 🚀 **How to Use**

1. **Review the plan**: Check `ARCHIVE_PLAN.md` for details
2. **Run the script**: Double-click `archive-main-folder.bat`
3. **Verify**: Check that essential files remain
4. **Test**: Ensure app still works

---

## ⚠️ **Safety Features**

- ✅ Uses `move` (not delete) - files can be restored
- ✅ Pauses before running - you can review
- ✅ Only archives specific files - safe and targeted
- ✅ Keeps all essential files explicitly

---

## 📁 **Archive Structure**

```
archive/root-files/
├── documentation/     (22 .md files)
├── data-files/        (4 JSON/PDF files)
└── profiles/          (5 profile JSON files)
```

---

**Ready to archive**: Run `archive-main-folder.bat` when ready!


