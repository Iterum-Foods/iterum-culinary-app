@echo off
REM ================================================
REM Firebase Deployment - Direct Node.js Execution
REM Completely bypasses all wrappers and PowerShell
REM ================================================

echo.
echo ========================================
echo Firebase Deployment - Direct Method
echo ========================================
echo.

cd /d "%~dp0"

REM Use full paths - no PATH dependencies
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "FIREBASE_JS=C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js"

REM Verify files exist
if not exist "%NODE_EXE%" (
    echo ERROR: Node.js not found at: %NODE_EXE%
    echo.
    echo Please check Node.js installation.
    pause
    exit /b 1
)

if not exist "%FIREBASE_JS%" (
    echo ERROR: Firebase CLI JavaScript file not found!
    echo Expected: %FIREBASE_JS%
    echo.
    echo Please reinstall Firebase CLI:
    echo   npm install -g firebase-tools
    pause
    exit /b 1
)

echo Using Node.js: %NODE_EXE%
echo Using Firebase: %FIREBASE_JS%
echo.

REM Step 1: Clear any cached credentials
echo [1/4] Clearing cached credentials...
set "FIREBASE_CONFIG=%USERPROFILE%\.config\configstore\firebase-tools.json"
if exist "%FIREBASE_CONFIG%" (
    del /f /q "%FIREBASE_CONFIG%" 2>nul
    echo Old credentials cleared.
) else (
    echo No cached credentials found.
)
echo.

REM Step 2: Authenticate
echo [2/4] Authenticating with Firebase...
echo.
echo This will open your browser to sign in.
echo Please sign in with your Google account and authorize Firebase CLI.
echo.
pause

echo Opening browser...
"%NODE_EXE%" "%FIREBASE_JS%" login --reauth
if errorlevel 1 (
    echo.
    echo Authentication failed. Trying alternative method...
    "%NODE_EXE%" "%FIREBASE_JS%" login --reauth --no-localhost
    if errorlevel 1 (
        echo.
        echo ========================================
        echo AUTHENTICATION FAILED
        echo ========================================
        echo.
        echo Please try:
        echo   1. Open browser: https://console.firebase.google.com/
        echo   2. Sign in with your Google account
        echo   3. Verify access to project: iterum-culinary-app2
        echo   4. Run this script again
        echo.
        pause
        exit /b 1
    )
)

echo.
echo Authentication successful!
echo.

REM Step 3: Test connection
echo [3/4] Testing Firebase connection...
"%NODE_EXE%" "%FIREBASE_JS%" projects:list >nul 2>&1
if errorlevel 1 (
    echo WARNING: Could not list projects, but continuing...
) else (
    echo Connection test successful!
)
echo.

REM Step 4: Deploy
echo [4/4] Deploying to iterum-culinary-landing...
echo.
echo Project: iterum-culinary-app2
echo Site: iterum-culinary-landing
echo.
"%NODE_EXE%" "%FIREBASE_JS%" deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2 --non-interactive

if errorlevel 1 (
    echo.
    echo ========================================
    echo DEPLOYMENT FAILED
    echo ========================================
    echo.
    echo Check the error messages above.
    echo.
    echo Common issues:
    echo   - Authentication expired (run this script again)
    echo   - Project not found (check Firebase Console)
    echo   - Permissions issue (verify project access)
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

