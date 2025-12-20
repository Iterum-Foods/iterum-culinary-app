@echo off
REM ================================================
REM Cleanup Old Firebase Files
REM Removes redundant/old Firebase-related files
REM ================================================

echo.
echo ========================================
echo Cleanup Old Firebase Files
echo ========================================
echo.
echo This will remove old/redundant Firebase files.
echo.
echo Files to be removed:
echo   - Old deployment scripts (4 files)
echo   - PowerShell script (1 file)
echo   - Redundant documentation (15 files)
echo   - Old verification scripts (3 files)
echo.
echo Total: ~23 files
echo.
pause

cd /d "%~dp0"

echo.
echo Removing old deployment scripts...
if exist deploy-firebase.bat del deploy-firebase.bat
if exist deploy-direct.bat del deploy-direct.bat
if exist deploy-step-by-step.bat del deploy-step-by-step.bat
if exist test-firebase.bat del test-firebase.bat

echo.
echo Removing PowerShell script...
if exist BYPASS_POWERSHELL_FIREBASE.ps1 del BYPASS_POWERSHELL_FIREBASE.ps1

echo.
echo Removing redundant documentation...
if exist FIREBASE_CONFIG_VERIFICATION.md del FIREBASE_CONFIG_VERIFICATION.md
if exist FIREBASE_HOSTING_SITES_STATUS.md del FIREBASE_HOSTING_SITES_STATUS.md
if exist FIREBASE_PROJECT_CONFIRMED.md del FIREBASE_PROJECT_CONFIRMED.md
if exist FIX_FIREBASE_CLI_ISSUES.md del FIX_FIREBASE_CLI_ISSUES.md
if exist FIREBASE_SETUP_STEPS.md del FIREBASE_SETUP_STEPS.md
if exist COMPLETE_FIREBASE_DEPLOYMENT_CHECKLIST.md del COMPLETE_FIREBASE_DEPLOYMENT_CHECKLIST.md
if exist FIX_POWERSHELL_FIREBASE_ISSUE.md del FIX_POWERSHELL_FIREBASE_ISSUE.md
if exist FIREBASE_TWO_SITES_SETUP.md del FIREBASE_TWO_SITES_SETUP.md
if exist FIREBASE_DEPLOYMENT_GUIDE.md del FIREBASE_DEPLOYMENT_GUIDE.md
if exist FIREBASE_DISCONNECTION_COMPLETE.md del FIREBASE_DISCONNECTION_COMPLETE.md
if exist FIREBASE_DISCONNECTION_CHECKLIST.md del FIREBASE_DISCONNECTION_CHECKLIST.md
if exist firebase-setup-complete-guide.md del firebase-setup-complete-guide.md
if exist FIREBASE_SETUP_CHECKLIST.md del FIREBASE_SETUP_CHECKLIST.md
if exist DEPLOYMENT_STATUS.md del DEPLOYMENT_STATUS.md
if exist DEPLOY_LANDING_TO_APP2.md del DEPLOY_LANDING_TO_APP2.md

echo.
echo Removing old verification scripts...
if exist verify-firebase-disconnection.js del verify-firebase-disconnection.js
if exist verify-firebase-setup.js del verify-firebase-setup.js
if exist verify-single-project-isolation.js del verify-single-project-isolation.js

echo.
echo ========================================
echo Cleanup Complete!
echo ========================================
echo.
echo Remaining Firebase files:
echo   - firebase.json (config)
echo   - .firebaserc (project)
echo   - firestore.rules (security)
echo   - storage.rules (security)
echo   - deploy-node-direct.bat (current deployment)
echo   - firebase-login.bat (current login)
echo   - DEPLOY_NOW.md (quick guide)
echo   - DEPLOY_IN_CMD.md (CMD guide)
echo   - QUICK_LOGIN_GUIDE.md (login guide)
echo.
pause

