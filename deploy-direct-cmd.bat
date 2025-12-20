@echo off
REM ================================================
REM Direct Firebase Deployment - Pure CMD
REM Bypasses all PowerShell interference
REM ================================================

echo.
echo ========================================
echo Firebase Deployment - Direct CMD
echo ========================================
echo.

cd /d "%~dp0"

REM Use direct Node.js path to avoid PowerShell
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "FIREBASE_JS=C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js"

REM Check Node.js
if not exist "%NODE_EXE%" (
    echo ERROR: Node.js not found at: %NODE_EXE%
    echo.
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Firebase CLI
if not exist "%FIREBASE_JS%" (
    echo ERROR: Firebase CLI not found at: %FIREBASE_JS%
    echo.
    echo Installing Firebase CLI...
    "%NODE_EXE%" -g install firebase-tools
    if errorlevel 1 (
        echo ERROR: Failed to install Firebase CLI
        pause
        exit /b 1
    )
)

echo Using Node.js: %NODE_EXE%
echo Using Firebase CLI: %FIREBASE_JS%
echo.

REM Step 1: Try to list projects (tests authentication)
echo [1/4] Testing authentication...
"%NODE_EXE%" "%FIREBASE_JS%" projects:list >nul 2>&1
if errorlevel 1 (
    echo.
    echo ========================================
    echo AUTHENTICATION REQUIRED
    echo ========================================
    echo.
    echo Your Firebase credentials have expired.
    echo This will open your browser to sign in.
    echo.
    echo Press any key to continue with authentication...
    pause >nul
    echo.
    echo Opening browser for authentication...
    "%NODE_EXE%" "%FIREBASE_JS%" login --reauth
    if errorlevel 1 (
        echo.
        echo ERROR: Authentication failed
        echo Please try again manually
        pause
        exit /b 1
    )
    echo.
    echo Authentication successful!
    echo.
) else (
    echo Authentication OK
    echo.
)

REM Step 2: Set project
echo [2/4] Setting Firebase project...
"%NODE_EXE%" "%FIREBASE_JS%" use iterum-culinary-app2 --non-interactive
if errorlevel 1 (
    echo WARNING: Project setting failed, continuing anyway...
    echo.
)

REM Step 3: Deploy Storage rules
echo [3/4] Deploying Storage rules...
"%NODE_EXE%" "%FIREBASE_JS%" deploy --only storage --non-interactive
if errorlevel 1 (
    echo WARNING: Storage rules deployment failed (may not be enabled)
)

REM Step 4: Deploy Landing Site (with pitch page)
echo.
echo [4/4] Deploying Landing Site (iterum-culinary-landing)...
echo This includes the pitch page at /pitch
echo.
"%NODE_EXE%" "%FIREBASE_JS%" deploy --only hosting:iterum-culinary-landing --non-interactive --project iterum-culinary-app2

if errorlevel 1 (
    echo.
    echo ========================================
    echo DEPLOYMENT FAILED
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo.
    echo Common issues:
    echo   1. Authentication expired - run: firebase login --reauth
    echo   2. Project not found - verify project ID in Firebase Console
    echo   3. Permissions - check you have access to the project
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo DEPLOYMENT SUCCESSFUL!
echo ========================================
echo.
echo Your pitch page is now live at:
echo   https://iterum-culinary-landing.web.app/pitch
echo   https://iterum-culinary-landing.web.app/pitch.html
echo.
echo Landing page:
echo   https://iterum-culinary-landing.web.app/
echo.
pause

