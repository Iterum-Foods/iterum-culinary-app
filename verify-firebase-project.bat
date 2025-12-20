@echo off
REM ================================================
REM Verify Firebase Project Configuration
REM ================================================

echo.
echo ========================================
echo Firebase Project Verification
echo ========================================
echo.

cd /d "%~dp0"

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "FIREBASE_JS=C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js"

echo [1/3] Checking Configuration Files...
echo.

if exist ".firebaserc" (
    echo   OK: .firebaserc exists
    findstr /C:"iterum-culinary-app2" .firebaserc >nul
    if errorlevel 1 (
        echo   ERROR: Project ID not found in .firebaserc
    ) else (
        echo   OK: Project ID configured: iterum-culinary-app2
    )
) else (
    echo   ERROR: .firebaserc missing
)

if exist "firebase.json" (
    echo   OK: firebase.json exists
    findstr /C:"iterum-culinary-landing" firebase.json >nul
    if errorlevel 1 (echo   ERROR: Landing site not configured) else (echo   OK: Landing site configured)
    findstr /C:"iterum-culinary-app2" firebase.json >nul
    if errorlevel 1 (echo   ERROR: App site not configured) else (echo   OK: App site configured)
) else (
    echo   ERROR: firebase.json missing
)

echo.
echo [2/3] Checking Current Firebase Project...
echo.

"%NODE_EXE%" "%FIREBASE_JS%" use >nul 2>&1
if errorlevel 1 (
    echo   ERROR: Cannot connect to Firebase
    echo   Please authenticate first: firebase-login-direct.bat
) else (
    echo   Current project:
    "%NODE_EXE%" "%FIREBASE_JS%" use
    echo.
    echo   Checking if this matches configuration...
    "%NODE_EXE%" "%FIREBASE_JS%" use | findstr /C:"iterum-culinary-app2" >nul
    if errorlevel 1 (
        echo   WARNING: Current project does not match iterum-culinary-app2
        echo   Run: firebase use iterum-culinary-app2
    ) else (
        echo   OK: Using correct project (iterum-culinary-app2)
    )
)

echo.
echo [3/3] Summary...
echo.

echo ========================================
echo Project Configuration
echo ========================================
echo.
echo Expected Project ID: iterum-culinary-app2
echo.
echo Hosting Sites:
echo   - iterum-culinary-landing
echo   - iterum-culinary-app2
echo.
echo When generating the CI token, make sure:
echo   1. You're logged into the correct Google account
echo   2. That account has access to iterum-culinary-app2 project
echo   3. The token will have permissions for both hosting sites
echo.
pause

