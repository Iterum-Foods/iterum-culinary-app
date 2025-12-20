@echo off
REM ================================================
REM Verify All App Files Are Present and Deployed
REM ================================================

echo.
echo ========================================
echo Complete File Deployment Verification
echo ========================================
echo.

cd /d "%~dp0"

set "ERRORS=0"
set "WARNINGS=0"

echo [1/5] Checking Critical HTML Files...
echo.

REM Landing Site Files
echo Landing Site Files:
if exist "public\landing.html" (echo   OK: landing.html) else (echo   ERROR: landing.html missing & set /a ERRORS+=1)
if exist "public\pitch.html" (echo   OK: pitch.html) else (echo   ERROR: pitch.html missing & set /a ERRORS+=1)
if exist "public\company.html" (echo   OK: company.html) else (echo   WARNING: company.html missing & set /a WARNINGS+=1)

echo.
echo App Site Files:
if exist "public\index.html" (echo   OK: index.html) else (echo   ERROR: index.html missing & set /a ERRORS+=1)
if exist "public\dashboard.html" (echo   OK: dashboard.html) else (echo   ERROR: dashboard.html missing & set /a ERRORS+=1)
if exist "public\signin.html" (echo   OK: signin.html) else (echo   ERROR: signin.html missing & set /a ERRORS+=1)
if exist "public\404.html" (echo   OK: 404.html) else (echo   WARNING: 404.html missing & set /a WARNINGS+=1)

echo.
echo Core App Pages:
if exist "public\recipe-developer.html" (echo   OK: recipe-developer.html) else (echo   ERROR: recipe-developer.html missing & set /a ERRORS+=1)
if exist "public\recipe-library.html" (echo   OK: recipe-library.html) else (echo   ERROR: recipe-library.html missing & set /a ERRORS+=1)
if exist "public\recipe-canvas.html" (echo   OK: recipe-canvas.html) else (echo   WARNING: recipe-canvas.html missing & set /a WARNINGS+=1)
if exist "public\ingredients.html" (echo   OK: ingredients.html) else (echo   ERROR: ingredients.html missing & set /a ERRORS+=1)
if exist "public\inventory.html" (echo   OK: inventory.html) else (echo   ERROR: inventory.html missing & set /a ERRORS+=1)
if exist "public\equipment-management.html" (echo   OK: equipment-management.html) else (echo   ERROR: equipment-management.html missing & set /a ERRORS+=1)
if exist "public\project-hub.html" (echo   OK: project-hub.html) else (echo   ERROR: project-hub.html missing & set /a ERRORS+=1)
if exist "public\menu-builder.html" (echo   OK: menu-builder.html) else (echo   ERROR: menu-builder.html missing & set /a ERRORS+=1)

echo.
echo [2/5] Checking Assets Directory...
echo.

if exist "public\assets" (
    echo   OK: assets folder exists
    if exist "public\assets\css" (
        echo   OK: assets/css exists
        dir /b "public\assets\css\*.css" | find /c /v "" >nul
        if errorlevel 1 (echo   WARNING: No CSS files found) else (echo   OK: CSS files present)
    ) else (
        echo   ERROR: assets/css missing & set /a ERRORS+=1
    )
    if exist "public\assets\js" (
        echo   OK: assets/js exists
        dir /b "public\assets\js\*.js" | find /c /v "" >nul
        if errorlevel 1 (echo   WARNING: No JS files found) else (echo   OK: JS files present)
    ) else (
        echo   ERROR: assets/js missing & set /a ERRORS+=1
    )
    if exist "public\assets\images" (echo   OK: assets/images exists) else (echo   WARNING: assets/images missing & set /a WARNINGS+=1)
) else (
    echo   ERROR: assets folder missing & set /a ERRORS+=1
)

echo.
echo [3/5] Checking Critical JavaScript Files...
echo.

if exist "public\assets\js\firebase-config.js" (echo   OK: firebase-config.js) else (echo   ERROR: firebase-config.js missing & set /a ERRORS+=1)
if exist "public\assets\js\firebase-auth.js" (echo   OK: firebase-auth.js) else (echo   ERROR: firebase-auth.js missing & set /a ERRORS+=1)
if exist "public\assets\js\auth-manager.js" (echo   OK: auth-manager.js) else (echo   ERROR: auth-manager.js missing & set /a ERRORS+=1)
if exist "public\assets\js\firebase-storage.js" (echo   OK: firebase-storage.js) else (echo   WARNING: firebase-storage.js missing & set /a WARNINGS+=1)
if exist "public\assets\js\recipe-manager.js" (echo   OK: recipe-manager.js) else (echo   WARNING: recipe-manager.js missing & set /a WARNINGS+=1)
if exist "public\assets\js\inventory-manager.js" (echo   OK: inventory-manager.js) else (echo   WARNING: inventory-manager.js missing & set /a WARNINGS+=1)

echo.
echo [4/5] Checking Configuration Files...
echo.

if exist "firebase.json" (
    echo   OK: firebase.json exists
    findstr /C:"iterum-culinary-landing" firebase.json >nul
    if errorlevel 1 (echo   ERROR: Landing site not in firebase.json & set /a ERRORS+=1) else (echo   OK: Landing site configured)
    findstr /C:"iterum-culinary-app2" firebase.json >nul
    if errorlevel 1 (echo   ERROR: App site not in firebase.json & set /a ERRORS+=1) else (echo   OK: App site configured)
) else (
    echo   ERROR: firebase.json missing & set /a ERRORS+=1
)

if exist ".firebaserc" (
    echo   OK: .firebaserc exists
    findstr /C:"iterum-culinary-app2" .firebaserc >nul
    if errorlevel 1 (echo   ERROR: Project ID not in .firebaserc & set /a ERRORS+=1) else (echo   OK: Project ID configured)
) else (
    echo   ERROR: .firebaserc missing & set /a ERRORS+=1
)

if exist ".github\workflows\firebase-deploy.yml" (
    echo   OK: GitHub workflow exists
) else (
    echo   WARNING: GitHub workflow missing & set /a WARNINGS+=1
)

echo.
echo [5/5] Checking Additional Important Files...
echo.

if exist "public\favicon.ico" (echo   OK: favicon.ico) else (echo   WARNING: favicon.ico missing & set /a WARNINGS+=1)
if exist "public\bulk-ingredient-import.html" (echo   OK: bulk-ingredient-import.html) else (echo   WARNING: bulk-ingredient-import.html missing & set /a WARNINGS+=1)
if exist "public\data-backup-center.html" (echo   OK: data-backup-center.html) else (echo   WARNING: data-backup-center.html missing & set /a WARNINGS+=1)
if exist "public\vendor-management.html" (echo   OK: vendor-management.html) else (echo   WARNING: vendor-management.html missing & set /a WARNINGS+=1)

echo.
echo ========================================
echo Verification Summary
echo ========================================
echo.

if %ERRORS% EQU 0 (
    echo   ✅ All critical files present!
) else (
    echo   ❌ Found %ERRORS% critical errors
)

if %WARNINGS% GTR 0 (
    echo   ⚠️  Found %WARNINGS% warnings (non-critical)
)

echo.
echo ========================================
echo Next Steps
echo ========================================
echo.
echo 1. If errors found, fix missing files
echo 2. Commit and push changes to GitHub
echo 3. Check GitHub Actions for deployment status
echo 4. Verify sites are live:
echo    - Landing: https://iterum-culinary-landing.web.app
echo    - App: https://iterum-culinary-app2.web.app
echo.
pause

