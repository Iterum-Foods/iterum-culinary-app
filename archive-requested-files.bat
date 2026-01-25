@echo off
echo ========================================
echo Archiving Requested Root-Level Files
echo ========================================
echo.

cd /d "%~dp0"

if not exist "archive\root-files" mkdir "archive\root-files"
if not exist "archive\root-files\html-duplicates" mkdir "archive\root-files\html-duplicates"
if not exist "archive\root-files\html-test" mkdir "archive\root-files\html-test"
if not exist "archive\root-files\documentation" mkdir "archive\root-files\documentation"
if not exist "archive\root-files\config-scripts" mkdir "archive\root-files\config-scripts"
if not exist "archive\root-files\databases" mkdir "archive\root-files\databases"

echo.
echo [1/5] Archiving duplicate HTML files...
move /Y "index.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "dashboard.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "recipe-developer.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "recipe-library.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "menu-builder.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "ingredients.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "inventory.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "production-planning.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "project-hub.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "recipe-photo-studio.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "recipe-scaling-tool.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "recipe-upload.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "user-profile.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "data-backup-center.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "data-management-dashboard.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "server-info-sheet.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "audit-log.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "ingredient-highlights.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "vendor-management.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "vendor-price-comparison.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "bulk-recipe-import.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "bulk-ingredient-import.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "contact_management.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "user_management.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "kitchen-management.html" "archive\root-files\html-duplicates\" 2>nul
move /Y "launch.html" "archive\root-files\html-duplicates\" 2>nul
echo    Done!

echo.
echo [2/5] Archiving test/development HTML files...
move /Y "test*.html" "archive\root-files\html-test\" 2>nul
move /Y "index_emergency*.html" "archive\root-files\html-test\" 2>nul
move /Y "index_minimal.html" "archive\root-files\html-test\" 2>nul
move /Y "index_simple.html" "archive\root-files\html-test\" 2>nul
move /Y "app_home.html" "archive\root-files\html-test\" 2>nul
move /Y "trial_dashboard.html" "archive\root-files\html-test\" 2>nul
move /Y "google-test.html" "archive\root-files\html-test\" 2>nul
move /Y "LOADING_SCREEN_DEMO.html" "archive\root-files\html-test\" 2>nul
move /Y "page-uniformity-checker.html" "archive\root-files\html-test\" 2>nul
move /Y "recipe-review*.html" "archive\root-files\html-test\" 2>nul
move /Y "recipe-verification-simple.html" "archive\root-files\html-test\" 2>nul
move /Y "menu-builder-improved.html" "archive\root-files\html-test\" 2>nul
move /Y "uniform-header-centered.html" "archive\root-files\html-test\" 2>nul
move /Y "lead-growth-roadmap.html" "archive\root-files\html-test\" 2>nul
move /Y "fix-vendors-display.html" "archive\root-files\html-test\" 2>nul
move /Y "SETUP_89_CHARLES.html" "archive\root-files\html-test\" 2>nul
move /Y "automated-workflow.html" "archive\root-files\html-test\" 2>nul
move /Y "price-list-upload.html" "archive\root-files\html-test\" 2>nul
move /Y "purchase-orders.html" "archive\root-files\html-test\" 2>nul
move /Y "waitlist_admin.html" "archive\root-files\html-test\" 2>nul
move /Y "recover-projects.html" "archive\root-files\html-test\" 2>nul
move /Y "PROJECT_UI_TEST.html" "archive\root-files\html-test\" 2>nul
move /Y "plant-sketches.html" "archive\root-files\html-test\" 2>nul
echo    Done!

echo.
echo [3/5] Processing database files...
echo    Checking database file dates...

REM Backup public/data databases first (they're older)
if exist "public\data\culinary_data.db" (
    echo    Backing up older public\data\culinary_data.db...
    copy /Y "public\data\culinary_data.db" "archive\root-files\databases\culinary_data_public_old.db" >nul 2>&1
)

if exist "public\data\iterum_rnd.db" (
    echo    Backing up older public\data\iterum_rnd.db...
    copy /Y "public\data\iterum_rnd.db" "archive\root-files\databases\iterum_rnd_public_old.db" >nul 2>&1
)

if exist "public\data\waitlist.db" (
    echo    Backing up older public\data\waitlist.db...
    copy /Y "public\data\waitlist.db" "archive\root-files\databases\waitlist_public_old.db" >nul 2>&1
)

REM Root database files are newer - keep them in public/data
if exist "culinary_data.db" (
    echo    Moving newer root culinary_data.db to public\data\...
    move /Y "culinary_data.db" "public\data\culinary_data.db" 2>nul
)

if exist "iterum_rnd.db" (
    echo    Moving newer root iterum_rnd.db to public\data\...
    move /Y "iterum_rnd.db" "public\data\iterum_rnd.db" 2>nul
)

if exist "waitlist.db" (
    echo    Moving newer root waitlist.db to public\data\...
    move /Y "waitlist.db" "public\data\waitlist.db" 2>nul
)

if exist "ingredients.db" (
    echo    Archiving root ingredients.db...
    move /Y "ingredients.db" "archive\root-files\databases\" 2>nul
)

echo    Database files processed!

echo.
echo [4/5] Archiving outdated documentation files...
move /Y "*DEPLOYMENT*.md" "archive\root-files\documentation\" 2>nul
move /Y "*FIREBASE*.md" "archive\root-files\documentation\" 2>nul
move /Y "*FIX*.md" "archive\root-files\documentation\" 2>nul
move /Y "*SETUP*.md" "archive\root-files\documentation\" 2>nul
move /Y "*QUICK*.md" "archive\root-files\documentation\" 2>nul
move /Y "*URGENT*.md" "archive\root-files\documentation\" 2>nul
move /Y "*GITHUB*.md" "archive\root-files\documentation\" 2>nul
move /Y "*AUTH*.md" "archive\root-files\documentation\" 2>nul
move /Y "*WORKFLOW*.md" "archive\root-files\documentation\" 2>nul
move /Y "*MENU*.md" "archive\root-files\documentation\" 2>nul
move /Y "*RECIPE*.md" "archive\root-files\documentation\" 2>nul
move /Y "*WEEK*.md" "archive\root-files\documentation\" 2>nul
move /Y "CLEANUP*.md" "archive\root-files\documentation\" 2>nul
move /Y "CURRENT*.md" "archive\root-files\documentation\" 2>nul
move /Y "DATA*.md" "archive\root-files\documentation\" 2>nul
move /Y "FINAL*.md" "archive\root-files\documentation\" 2>nul
move /Y "SYSTEM*.md" "archive\root-files\documentation\" 2>nul
move /Y "*SUMMARY.md" "archive\root-files\documentation\" 2>nul
move /Y "*GUIDE.md" "archive\root-files\documentation\" 2>nul
move /Y "*PLAN.md" "archive\root-files\documentation\" 2>nul
move /Y "*REPORT.md" "archive\root-files\documentation\" 2>nul
move /Y "*STATUS.md" "archive\root-files\documentation\" 2>nul
move /Y "*COMPLETE.md" "archive\root-files\documentation\" 2>nul
move /Y "*SUCCESS.md" "archive\root-files\documentation\" 2>nul
move /Y "WHY*.md" "archive\root-files\documentation\" 2>nul
move /Y "TROUBLESHOOT*.md" "archive\root-files\documentation\" 2>nul
move /Y "DELETE*.md" "archive\root-files\documentation\" 2>nul
move /Y "DISABLE*.md" "archive\root-files\documentation\" 2>nul
move /Y "UPDATE*.md" "archive\root-files\documentation\" 2>nul
move /Y "RESET*.md" "archive\root-files\documentation\" 2>nul
move /Y "RENAME*.md" "archive\root-files\documentation\" 2>nul
move /Y "REPOSITORY*.md" "archive\root-files\documentation\" 2>nul
move /Y "*TESTING*.md" "archive\root-files\documentation\" 2>nul
move /Y "*CHECKLIST*.md" "archive\root-files\documentation\" 2>nul
move /Y "*IMPLEMENTATION*.md" "archive\root-files\documentation\" 2>nul
move /Y "COLOR*.md" "archive\root-files\documentation\" 2>nul
move /Y "UNIFY*.md" "archive\root-files\documentation\" 2>nul
move /Y "STRUCTURE*.md" "archive\root-files\documentation\" 2>nul
move /Y "REFINEMENT*.md" "archive\root-files\documentation\" 2>nul
move /Y "FEATURE*.md" "archive\root-files\documentation\" 2>nul
move /Y "LONG_TERM*.md" "archive\root-files\documentation\" 2>nul
move /Y "MAIN_INFO*.md" "archive\root-files\documentation\" 2>nul
move /Y "SOFTER*.md" "archive\root-files\documentation\" 2>nul
move /Y "SMART*.md" "archive\root-files\documentation\" 2>nul
move /Y "PREMIUM*.md" "archive\root-files\documentation\" 2>nul
move /Y "PREP*.md" "archive\root-files\documentation\" 2>nul
move /Y "PRICE*.md" "archive\root-files\documentation\" 2>nul
move /Y "HEADER*.md" "archive\root-files\documentation\" 2>nul
move /Y "HOSTING*.md" "archive\root-files\documentation\" 2>nul
move /Y "FRESH*.md" "archive\root-files\documentation\" 2>nul
move /Y "FORCE*.md" "archive\root-files\documentation\" 2>nul
move /Y "FIND*.md" "archive\root-files\documentation\" 2>nul
move /Y "DIAGNOSE*.md" "archive\root-files\documentation\" 2>nul
move /Y "DEBUG*.md" "archive\root-files\documentation\" 2>nul
move /Y "COOP*.md" "archive\root-files\documentation\" 2>nul
move /Y "CORRECT*.md" "archive\root-files\documentation\" 2>nul
move /Y "CREATE*.md" "archive\root-files\documentation\" 2>nul
move /Y "CLEAR*.md" "archive\root-files\documentation\" 2>nul
move /Y "CHECK*.md" "archive\root-files\documentation\" 2>nul
move /Y "BRAND*.md" "archive\root-files\documentation\" 2>nul
move /Y "AI_SETUP*.md" "archive\root-files\documentation\" 2>nul
move /Y "LANDING*.md" "archive\root-files\documentation\" 2>nul
move /Y "INGREDIENTS*.md" "archive\root-files\documentation\" 2>nul
move /Y "WAITLIST*.md" "archive\root-files\documentation\" 2>nul
move /Y "USER*.md" "archive\root-files\documentation\" 2>nul
move /Y "TRIAL*.md" "archive\root-files\documentation\" 2>nul
move /Y "THOROUGH*.md" "archive\root-files\documentation\" 2>nul
move /Y "STORAGE*.md" "archive\root-files\documentation\" 2>nul
move /Y "STATE*.md" "archive\root-files\documentation\" 2>nul
move /Y "SITE*.md" "archive\root-files\documentation\" 2>nul
move /Y "SIGNIN*.md" "archive\root-files\documentation\" 2>nul
move /Y "SIMPLIFIED*.md" "archive\root-files\documentation\" 2>nul
move /Y "SEPARATE*.md" "archive\root-files\documentation\" 2>nul
move /Y "SECURITY*.md" "archive\root-files\documentation\" 2>nul
move /Y "RUN*.md" "archive\root-files\documentation\" 2>nul
move /Y "PROJECT*.md" "archive\root-files\documentation\" 2>nul
move /Y "PROFESSIONAL*.md" "archive\root-files\documentation\" 2>nul
move /Y "LOCAL*.md" "archive\root-files\documentation\" 2>nul
move /Y "LOADING*.md" "archive\root-files\documentation\" 2>nul
move /Y "GETTING*.md" "archive\root-files\documentation\" 2>nul
move /Y "EMAIL*.md" "archive\root-files\documentation\" 2>nul
move /Y "CRM*.md" "archive\root-files\documentation\" 2>nul
move /Y "*.txt" "archive\root-files\documentation\" 2>nul
move /Y "ARCHIVE*.md" "archive\root-files\documentation\" 2>nul
echo    Done!

echo.
echo [5/5] Archiving old config/script files...
move /Y "apply-premium-ui.js" "archive\root-files\config-scripts\" 2>nul
move /Y "check_waitlist.py" "archive\root-files\config-scripts\" 2>nul
move /Y "verify-firebase-setup.js" "archive\root-files\config-scripts\" 2>nul
move /Y "organize_files.ps1" "archive\root-files\config-scripts\" 2>nul
move /Y "firebase-backup.json" "archive\root-files\config-scripts\" 2>nul
move /Y "firebase-minimal.json" "archive\root-files\config-scripts\" 2>nul
move /Y "firestore-enhanced.rules" "archive\root-files\config-scripts\" 2>nul
move /Y "CLEANUP_PROJECT_FILES.ps1" "archive\root-files\config-scripts\" 2>nul
echo    Done!

echo.
echo ========================================
echo Archive Operation Complete!
echo ========================================
echo.
echo Files archived to: archive\root-files\
echo   - html-duplicates\ (duplicate HTML files)
echo   - html-test\ (test/development HTML files)
echo   - documentation\ (outdated .md files)
echo   - config-scripts\ (old config/script files)
echo   - databases\ (backed up old database files)
echo.
echo Database files consolidated in: public\data\
echo.
pause

