@echo off
echo ========================================
echo Archiving Root-Level Files
echo ========================================
echo.

cd /d "%~dp0"

if not exist "archive\root-files" mkdir "archive\root-files"

echo Moving duplicate HTML files from root...
move /Y "index.html" "archive\root-files\" 2>nul
move /Y "dashboard.html" "archive\root-files\" 2>nul
move /Y "recipe-developer.html" "archive\root-files\" 2>nul
move /Y "recipe-library.html" "archive\root-files\" 2>nul
move /Y "menu-builder.html" "archive\root-files\" 2>nul
move /Y "ingredients.html" "archive\root-files\" 2>nul
move /Y "inventory.html" "archive\root-files\" 2>nul
move /Y "production-planning.html" "archive\root-files\" 2>nul
move /Y "project-hub.html" "archive\root-files\" 2>nul
move /Y "recipe-photo-studio.html" "archive\root-files\" 2>nul
move /Y "recipe-scaling-tool.html" "archive\root-files\" 2>nul
move /Y "recipe-upload.html" "archive\root-files\" 2>nul
move /Y "user-profile.html" "archive\root-files\" 2>nul
move /Y "data-backup-center.html" "archive\root-files\" 2>nul
move /Y "data-management-dashboard.html" "archive\root-files\" 2>nul
move /Y "server-info-sheet.html" "archive\root-files\" 2>nul
move /Y "audit-log.html" "archive\root-files\" 2>nul
move /Y "ingredient-highlights.html" "archive\root-files\" 2>nul
move /Y "vendor-management.html" "archive\root-files\" 2>nul
move /Y "vendor-price-comparison.html" "archive\root-files\" 2>nul
move /Y "bulk-recipe-import.html" "archive\root-files\" 2>nul
move /Y "bulk-ingredient-import.html" "archive\root-files\" 2>nul
move /Y "contact_management.html" "archive\root-files\" 2>nul
move /Y "user_management.html" "archive\root-files\" 2>nul
move /Y "kitchen-management.html" "archive\root-files\" 2>nul
move /Y "launch.html" "archive\root-files\" 2>nul

echo Moving test/development HTML files...
move /Y "test*.html" "archive\root-files\" 2>nul
move /Y "index_emergency*.html" "archive\root-files\" 2>nul
move /Y "index_minimal.html" "archive\root-files\" 2>nul
move /Y "index_simple.html" "archive\root-files\" 2>nul
move /Y "app_home.html" "archive\root-files\" 2>nul
move /Y "trial_dashboard.html" "archive\root-files\" 2>nul
move /Y "google-test.html" "archive\root-files\" 2>nul
move /Y "LOADING_SCREEN_DEMO.html" "archive\root-files\" 2>nul
move /Y "page-uniformity-checker.html" "archive\root-files\" 2>nul
move /Y "recipe-review*.html" "archive\root-files\" 2>nul
move /Y "recipe-verification-simple.html" "archive\root-files\" 2>nul
move /Y "menu-builder-improved.html" "archive\root-files\" 2>nul
move /Y "uniform-header-centered.html" "archive\root-files\" 2>nul
move /Y "lead-growth-roadmap.html" "archive\root-files\" 2>nul
move /Y "fix-vendors-display.html" "archive\root-files\" 2>nul
move /Y "SETUP_89_CHARLES.html" "archive\root-files\" 2>nul
move /Y "automated-workflow.html" "archive\root-files\" 2>nul
move /Y "price-list-upload.html" "archive\root-files\" 2>nul
move /Y "purchase-orders.html" "archive\root-files\" 2>nul
move /Y "waitlist_admin.html" "archive\root-files\" 2>nul
move /Y "recover-projects.html" "archive\root-files\" 2>nul
move /Y "PROJECT_UI_TEST.html" "archive\root-files\" 2>nul
move /Y "plant-sketches.html" "archive\root-files\" 2>nul

echo Moving old database files...
move /Y "*.db" "archive\root-files\" 2>nul

echo Moving old recipe/ingredient source files...
move /Y "89-charles*.json" "archive\root-files\" 2>nul
move /Y "89-charles*.txt" "archive\root-files\" 2>nul
move /Y "*.pdf" "archive\root-files\" 2>nul
move /Y "equipment_database.csv" "archive\root-files\" 2>nul
move /Y "Ingredient Database-Sheet1.csv.txt" "archive\root-files\" 2>nul

echo Moving old configuration/script files...
move /Y "apply-premium-ui.js" "archive\root-files\" 2>nul
move /Y "check_waitlist.py" "archive\root-files\" 2>nul
move /Y "verify-firebase-setup.js" "archive\root-files\" 2>nul
move /Y "organize_files.ps1" "archive\root-files\" 2>nul
move /Y "firebase-backup.json" "archive\root-files\" 2>nul
move /Y "firebase-minimal.json" "archive\root-files\" 2>nul
move /Y "firestore-enhanced.rules" "archive\root-files\" 2>nul

echo Creating documentation archive folder...
if not exist "archive\root-files\documentation" mkdir "archive\root-files\documentation"

echo Moving outdated documentation files...
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

echo.
echo ========================================
echo Root Files Archiving Complete!
echo Files moved to: archive\root-files\
echo ========================================
echo.
pause

