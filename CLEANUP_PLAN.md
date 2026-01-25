# 🧹 GitHub Cleanup Plan

## **What to Keep**

### **Workflows (Keep These):**
- ✅ `test.yml` - Testing
- ✅ `lint.yml` - Code quality
- ✅ `security-scan.yml` - Security scanning
- ✅ `dependency-update.yml` - Dependency management

### **Documentation (Keep These):**
- ✅ `README.md` - Main documentation
- ✅ `README_START_HERE.md` - Quick start guide
- ✅ `GET_APP_RUNNING.md` - How to run the app
- ✅ `DEPLOYMENT_STATUS.md` - Current deployment status
- ✅ `VERCEL_SETUP_GUIDE.md` - Vercel setup guide
- ✅ `DEPLOYMENT_OPTIONS.md` - Deployment options (reference)

### **Batch Scripts (Keep These):**
- ✅ `deploy-both-sites.bat` - Manual Firebase deployment (backup)
- ✅ `verify-firebase-project.bat` - Firebase verification

---

## **What to Archive/Remove**

### **Old Deployment Documentation (23 files):**
- Remove all `*deploy*.md` files except `DEPLOYMENT_STATUS.md` and `DEPLOYMENT_OPTIONS.md`
- Remove all `*firebase*.md` files related to hosting/deployment
- Keep only essential Firebase docs (like `FIREBASE_STORAGE_STATUS.md` if needed)

### **Old Deployment Scripts (10 files):**
- Keep only `deploy-both-sites.bat` and `verify-firebase-project.bat`
- Remove all other `*deploy*.bat` files

### **Outdated Workflow Docs:**
- Update `GITHUB_WORKFLOWS_SUMMARY.md` to reflect current state

---

## **Cleanup Actions**

1. ✅ Create `archive/` folder for old files
2. ✅ Move outdated docs to archive
3. ✅ Remove duplicate/unused batch scripts
4. ✅ Update workflow summary
5. ✅ Create clean README for archive
