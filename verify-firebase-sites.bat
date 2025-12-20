@echo off
REM ================================================
REM Verify Firebase Sites and Configuration
REM Checks if sites exist and config matches
REM ================================================

echo.
echo ========================================
echo Verifying Firebase Configuration
echo ========================================
echo.

cd /d "%~dp0"

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "FIREBASE_JS=C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js"

echo [1/4] Checking Firebase project...
"%NODE_EXE%" "%FIREBASE_JS%" projects:list
if errorlevel 1 (
    echo.
    echo ERROR: Cannot list projects - authentication required
    echo Please run: firebase-login-direct.bat
    pause
    exit /b 1
)
echo.

echo [2/4] Checking current project...
"%NODE_EXE%" "%FIREBASE_JS%" use
echo.

echo [3/4] Checking hosting sites...
echo.
echo Expected sites:
echo   - iterum-culinary-landing
echo   - iterum-culinary-app2
echo.
echo Checking if sites exist in Firebase Console...
echo.
echo Please verify in Firebase Console:
echo   https://console.firebase.google.com/u/0/project/iterum-culinary-app2/hosting
echo.
echo Both sites should be listed there.
echo.
pause

echo.
echo [4/4] Checking configuration files...
echo.

echo firebase.json:
findstr /C:"iterum-culinary-landing" firebase.json >nul
if errorlevel 1 (
    echo   ERROR: iterum-culinary-landing not found in firebase.json
) else (
    echo   OK: iterum-culinary-landing found in firebase.json
)

findstr /C:"iterum-culinary-app2" firebase.json >nul
if errorlevel 1 (
    echo   ERROR: iterum-culinary-app2 not found in firebase.json
) else (
    echo   OK: iterum-culinary-app2 found in firebase.json
)

echo.
echo .firebaserc:
findstr /C:"iterum-culinary-app2" .firebaserc >nul
if errorlevel 1 (
    echo   ERROR: Project ID not found in .firebaserc
) else (
    echo   OK: Project ID found in .firebaserc
)

echo.
echo ========================================
echo Verification Complete
echo ========================================
echo.
echo Next steps:
echo   1. Verify sites exist in Firebase Console
echo   2. If sites don't exist, create them in Console
echo   3. Run: deploy-both-sites.bat
echo.
pause

