@echo off
REM ================================================
REM Troubleshoot Deployment Issues
REM ================================================

echo.
echo ========================================
echo Deployment Troubleshooting
echo ========================================
echo.

cd /d "%~dp0"

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "FIREBASE_JS=C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js"

echo [1/5] Checking Configuration Files...
echo.

if exist "firebase.json" (
    echo   OK: firebase.json exists
    findstr /C:"target" firebase.json >nul
    if errorlevel 1 (
        echo   ERROR: firebase.json does not use targets
    ) else (
        echo   OK: firebase.json uses targets
    )
) else (
    echo   ERROR: firebase.json missing
)

if exist ".firebaserc" (
    echo   OK: .firebaserc exists
) else (
    echo   ERROR: .firebaserc missing
)

echo.
echo [2/5] Checking Firebase Authentication...
echo.

"%NODE_EXE%" "%FIREBASE_JS%" projects:list >nul 2>&1
if errorlevel 1 (
    echo   ERROR: Not authenticated
    echo   Run: firebase-login-direct.bat
    pause
    exit /b 1
) else (
    echo   OK: Authenticated with Firebase
)

echo.
echo [3/5] Checking Firebase Project...
echo.

"%NODE_EXE%" "%FIREBASE_JS%" use
echo.

"%NODE_EXE%" "%FIREBASE_JS%" use | findstr /C:"iterum-culinary-app2" >nul
if errorlevel 1 (
    echo   ERROR: Not using correct project
    echo   Switching to iterum-culinary-app2...
    "%NODE_EXE%" "%FIREBASE_JS%" use iterum-culinary-app2
) else (
    echo   OK: Using correct project: iterum-culinary-app2
)

echo.
echo [4/5] Checking Hosting Sites...
echo.

echo Checking if sites exist in Firebase...
echo.

"%NODE_EXE%" "%FIREBASE_JS%" hosting:sites:list 2>nul
if errorlevel 1 (
    echo   ERROR: Cannot list sites
    echo   Sites may not exist
) else (
    echo.
    echo   Checking for iterum-culinary-landing...
    "%NODE_EXE%" "%FIREBASE_JS%" hosting:sites:list 2>nul | findstr /C:"iterum-culinary-landing" >nul
    if errorlevel 1 (
        echo   ERROR: Site iterum-culinary-landing NOT FOUND
        echo   You need to create it in Firebase Console:
        echo   https://console.firebase.google.com/project/iterum-culinary-app2/hosting
        echo.
        echo   Or create it now? (Y/N)
        set /p CREATE_SITE=
        if /i "%CREATE_SITE%"=="Y" (
            echo   Creating site...
            "%NODE_EXE%" "%FIREBASE_JS%" hosting:sites:create iterum-culinary-landing
        )
    ) else (
        echo   OK: Site iterum-culinary-landing exists
    )
    
    echo.
    echo   Checking for iterum-culinary-app2...
    "%NODE_EXE%" "%FIREBASE_JS%" hosting:sites:list 2>nul | findstr /C:"iterum-culinary-app2" >nul
    if errorlevel 1 (
        echo   ERROR: Site iterum-culinary-app2 NOT FOUND
        echo   You need to create it in Firebase Console:
        echo   https://console.firebase.google.com/project/iterum-culinary-app2/hosting
        echo.
        echo   Or create it now? (Y/N)
        set /p CREATE_SITE=
        if /i "%CREATE_SITE%"=="Y" (
            echo   Creating site...
            "%NODE_EXE%" "%FIREBASE_JS%" hosting:sites:create iterum-culinary-app2
        )
    ) else (
        echo   OK: Site iterum-culinary-app2 exists
    )
)

echo.
echo [5/5] Testing Deployment...
echo.

echo Testing deployment to iterum-culinary-landing...
echo (This will show if deployment would work)
echo.

"%NODE_EXE%" "%FIREBASE_JS%" deploy --only hosting:iterum-culinary-landing --dry-run 2>&1 | findstr /C:"Error" /C:"error" /C:"site" /C:"target"
if errorlevel 1 (
    echo   No obvious errors found in dry-run
) else (
    echo   WARNING: Errors found in dry-run
)

echo.
echo ========================================
echo Troubleshooting Summary
echo ========================================
echo.

echo Common Issues:
echo   1. Sites don't exist in Firebase Console
echo   2. Wrong project selected
echo   3. Authentication expired
echo   4. Configuration mismatch
echo.

echo Next Steps:
echo   1. Check GitHub Actions logs for specific errors
echo   2. Verify sites exist in Firebase Console
echo   3. Check Firebase Console for deployment history
echo   4. Test URLs in browser
echo.
pause

