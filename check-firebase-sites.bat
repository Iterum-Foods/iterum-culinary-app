@echo off
REM ================================================
REM Check Firebase Hosting Sites Exist
REM ================================================

echo.
echo ========================================
echo Firebase Hosting Sites Check
echo ========================================
echo.

cd /d "%~dp0"

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "FIREBASE_JS=C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js"

echo [1/3] Checking Firebase Authentication...
echo.

"%NODE_EXE%" "%FIREBASE_JS%" projects:list >nul 2>&1
if errorlevel 1 (
    echo   ERROR: Not authenticated with Firebase
    echo   Please run: firebase-login-direct.bat
    pause
    exit /b 1
) else (
    echo   OK: Authenticated with Firebase
)

echo.
echo [2/3] Checking Current Project...
echo.

"%NODE_EXE%" "%FIREBASE_JS%" use
echo.

"%NODE_EXE%" "%FIREBASE_JS%" use | findstr /C:"iterum-culinary-app2" >nul
if errorlevel 1 (
    echo   WARNING: Not using iterum-culinary-app2
    echo   Switching to correct project...
    "%NODE_EXE%" "%FIREBASE_JS%" use iterum-culinary-app2
)

echo.
echo [3/3] Checking Hosting Sites...
echo.

echo Checking for iterum-culinary-landing...
"%NODE_EXE%" "%FIREBASE_JS%" hosting:sites:list 2>nul | findstr /C:"iterum-culinary-landing" >nul
if errorlevel 1 (
    echo   ERROR: Site 'iterum-culinary-landing' NOT FOUND
    echo.
    echo   Creating site...
    "%NODE_EXE%" "%FIREBASE_JS%" hosting:sites:create iterum-culinary-landing
    if errorlevel 1 (
        echo   ERROR: Failed to create site
        echo   You may need to create it manually in Firebase Console:
        echo   https://console.firebase.google.com/project/iterum-culinary-app2/hosting
    ) else (
        echo   OK: Site created successfully
    )
) else (
    echo   OK: Site 'iterum-culinary-landing' exists
)

echo.
echo Checking for iterum-culinary-app2...
"%NODE_EXE%" "%FIREBASE_JS%" hosting:sites:list 2>nul | findstr /C:"iterum-culinary-app2" >nul
if errorlevel 1 (
    echo   ERROR: Site 'iterum-culinary-app2' NOT FOUND
    echo.
    echo   Creating site...
    "%NODE_EXE%" "%FIREBASE_JS%" hosting:sites:create iterum-culinary-app2
    if errorlevel 1 (
        echo   ERROR: Failed to create site
        echo   You may need to create it manually in Firebase Console:
        echo   https://console.firebase.google.com/project/iterum-culinary-app2/hosting
    ) else (
        echo   OK: Site created successfully
    )
) else (
    echo   OK: Site 'iterum-culinary-app2' exists
)

echo.
echo ========================================
echo Listing All Hosting Sites
echo ========================================
echo.

"%NODE_EXE%" "%FIREBASE_JS%" hosting:sites:list

echo.
echo ========================================
echo Next Steps
echo ========================================
echo.
echo 1. If sites were created, try deploying again
echo 2. Check Firebase Console:
echo    https://console.firebase.google.com/project/iterum-culinary-app2/hosting
echo 3. Verify sites are listed
echo 4. Deploy using: deploy-both-sites.bat
echo.
pause

