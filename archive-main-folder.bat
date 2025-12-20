@echo off
echo ========================================
echo Archiving Main Folder Files
echo ========================================
echo.
echo This script will archive:
echo   - Outdated documentation files
echo   - Duplicate data files (89-charles JSON files)
echo   - Old PDF files
echo   - Old profiles
echo   - Setup/status documentation that's no longer needed
echo.
echo Files will be moved to: archive\root-files\
echo.
echo Starting archive process...
timeout /t 2 /nobreak >nul

cd /d "%~dp0"

REM Create archive directories
if not exist "archive\root-files" mkdir "archive\root-files"
if not exist "archive\root-files\documentation" mkdir "archive\root-files\documentation"
if not exist "archive\root-files\data-files" mkdir "archive\root-files\data-files"
if not exist "archive\root-files\profiles" mkdir "archive\root-files\profiles"

echo.
echo [1/4] Archiving outdated documentation files...
echo.

REM Archive setup/status documentation (outdated)
move /Y "BYPASS_POWERSHELL_COMPLETE.md" "archive\root-files\documentation\" 2>nul
move /Y "USE_CMD_NOT_POWERSHELL.md" "archive\root-files\documentation\" 2>nul
move /Y "FIX_INVALID_PROJECT_ID.md" "archive\root-files\documentation\" 2>nul
move /Y "SINGLE_PROJECT_ISOLATION_COMPLETE.md" "archive\root-files\documentation\" 2>nul
move /Y "PROJECT_ISOLATION_VERIFICATION.md" "archive\root-files\documentation\" 2>nul
move /Y "TWO_SITES_SETUP.md" "archive\root-files\documentation\" 2>nul
move /Y "USE_WORKING_PROJECT.md" "archive\root-files\documentation\" 2>nul
move /Y "TEST_FIRESTORE_NOW.md" "archive\root-files\documentation\" 2>nul
move /Y "TEST_LOCALLY.md" "archive\root-files\documentation\" 2>nul
move /Y "VERIFY_WAITLIST_BACKEND.md" "archive\root-files\documentation\" 2>nul
move /Y "FIREBASE_FILES_CLEANUP.md" "archive\root-files\documentation\" 2>nul
move /Y "FIREBASE_ERROR_TROUBLESHOOTING.md" "archive\root-files\documentation\" 2>nul
move /Y "FIREBASE_SETUP_CHECKLIST.md" "archive\root-files\documentation\" 2>nul
move /Y "FIREBASE_SETUP_STATUS.md" "archive\root-files\documentation\" 2>nul
move /Y "DEPLOY_IN_CMD.md" "archive\root-files\documentation\" 2>nul
move /Y "QUICK_LOGIN_GUIDE.md" "archive\root-files\documentation\" 2>nul
move /Y "GET_STARTED_INGREDIENTS_INVENTORY.md" "archive\root-files\documentation\" 2>nul
move /Y "INGREDIENT_DATABASE_EXPANSION.md" "archive\root-files\documentation\" 2>nul
move /Y "INGREDIENTS_INVENTORY_PATH.md" "archive\root-files\documentation\" 2>nul
move /Y "UI_IMPROVEMENT_AUDIT.md" "archive\root-files\documentation\" 2>nul
move /Y "SIGNIN_FIXES_SUMMARY.md" "archive\root-files\documentation\" 2>nul
move /Y "UI_UPDATE_STATUS.md" "archive\root-files\documentation\" 2>nul
move /Y "HOSTING_STATUS.md" "archive\root-files\documentation\" 2>nul

REM Keep these important docs:
REM - README.md (main readme)
REM - README_START_HERE.md (user guide)
REM - CONTRIBUTING.md (contributor guide)
REM - LICENSE (license file)
REM - FIREBASE_FILES_VERIFICATION.md (current status)
REM - DEPLOY_NOW.md (deployment guide)
REM - MASTER_UI_TEMPLATE.md (UI reference)
REM - STORAGE_SYSTEM_OVERVIEW.md (storage docs)
REM - ARCHITECTURE_INGREDIENTS_CENTRIC.md (architecture docs)

echo    Done! Archived outdated documentation.

echo.
echo [2/4] Archiving duplicate data files...
echo.

REM Archive 89-charles JSON files (these are loaded into the app, originals can be archived)
move /Y "89-charles-fall-menu.json" "archive\root-files\data-files\" 2>nul
move /Y "89-charles-prep-specs.json" "archive\root-files\data-files\" 2>nul
move /Y "89-charles-recipes.json" "archive\root-files\data-files\" 2>nul

REM Archive PDF file (recipe PDF, likely duplicate)
move /Y "Korean-Inspired Bulgogi-Spiced Flank Steak with Roasted Pepper & Onion Farro Salad.pdf" "archive\root-files\data-files\" 2>nul

REM Archive equipment CSV if it's a duplicate (check if one exists in data folder)
if exist "data\equipment_database.csv" (
    if exist "equipment_database.csv" (
        echo    Archiving root equipment_database.csv (duplicate of data\equipment_database.csv)
        move /Y "equipment_database.csv" "archive\root-files\data-files\" 2>nul
    )
)

echo    Done! Archived duplicate data files.

echo.
echo [3/4] Archiving old profile files...
echo.

REM Archive old profile JSON files (these are user data backups)
if exist "profiles" (
    echo    Moving profiles to archive...
    move /Y "profiles\*.json" "archive\root-files\profiles\" 2>nul
    echo    Done! Archived profile files.
) else (
    echo    No profiles folder found.
)

echo.
echo [4/4] Archiving old emoji-marked documentation...
echo.

REM Archive files with emoji prefixes (likely old status files)
move /Y "âœ… PROFESSIONAL-LANDING-REBRANDED.md" "archive\root-files\documentation\" 2>nul

echo    Done!

echo.
echo ========================================
echo Archive Operation Complete!
echo ========================================
echo.
echo Files archived to: archive\root-files\
echo   - documentation\ (%date% outdated docs)
echo   - data-files\ (duplicate 89-charles files, PDFs)
echo   - profiles\ (old user profile backups)
echo.
echo IMPORTANT: The following files were KEPT in root:
echo   - README.md (main documentation)
echo   - README_START_HERE.md (user guide)
echo   - CONTRIBUTING.md (contributor guide)
echo   - LICENSE (license)
echo   - FIREBASE_FILES_VERIFICATION.md (current status)
echo   - DEPLOY_NOW.md (deployment guide)
echo   - MASTER_UI_TEMPLATE.md (UI reference)
echo   - STORAGE_SYSTEM_OVERVIEW.md (storage docs)
echo   - ARCHITECTURE_INGREDIENTS_CENTRIC.md (architecture)
echo   - All .bat files (active scripts)
echo   - All config files (firebase.json, firestore.rules, etc.)
echo.
echo Archive complete!

