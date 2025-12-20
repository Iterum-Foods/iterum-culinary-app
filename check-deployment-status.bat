@echo off
REM ================================================
REM Check Deployment Status
REM ================================================

echo.
echo ========================================
echo Deployment Status Check
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Recent Commits...
echo.

git log --oneline -5

echo.
echo [2/3] Checking if GitHub Actions Triggered...
echo.

echo To check GitHub Actions status:
echo   1. Go to: https://github.com/Iterum-Foods/iterum-culinary-app/actions
echo   2. Look for the latest workflow run
echo   3. Check if it shows green checkmarks (success) or red X (failed)
echo.

echo [3/3] Checking Firebase Deployment...
echo.

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "FIREBASE_JS=C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js"

"%NODE_EXE%" "%FIREBASE_JS%" projects:list >nul 2>&1
if errorlevel 1 (
    echo   WARNING: Not authenticated with Firebase
    echo   Cannot check deployment status locally
    echo   Please check GitHub Actions or Firebase Console
) else (
    echo   OK: Connected to Firebase
    echo.
    echo   Checking hosting deployments...
    echo   (This may take a moment)
    echo.
    "%NODE_EXE%" "%FIREBASE_JS%" hosting:channel:list 2>nul
    if errorlevel 1 (
        echo   Could not list deployments
        echo   Check Firebase Console instead:
        echo   https://console.firebase.google.com/project/iterum-culinary-app2/hosting
    )
)

echo.
echo ========================================
echo Deployment Status Summary
echo ========================================
echo.
echo To verify deployment:
echo.
echo 1. GitHub Actions:
echo    https://github.com/Iterum-Foods/iterum-culinary-app/actions
echo.
echo 2. Firebase Console:
echo    https://console.firebase.google.com/project/iterum-culinary-app2/hosting
echo.
echo 3. Test URLs:
echo    Landing: https://iterum-culinary-landing.web.app
echo    App: https://iterum-culinary-app2.web.app
echo.
echo 4. If deployment didn't run:
echo    - Push triggered automatically on commit
echo    - Or manually trigger in GitHub Actions
echo    - Or run: deploy-both-sites.bat
echo.
pause
