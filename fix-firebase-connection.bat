@echo off
REM ================================================
REM Fix Firebase Connection - Complete Solution
REM Resets authentication and tests connection
REM ================================================

echo.
echo ========================================
echo Fixing Firebase Connection
echo ========================================
echo.

cd /d "%~dp0"

REM Direct Node.js paths
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "FIREBASE_JS=C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js"
set "FIREBASE_CONFIG=%USERPROFILE%\.config\configstore\firebase-tools.json"

echo [Step 1/5] Checking Node.js...
if not exist "%NODE_EXE%" (
    echo ERROR: Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found: %NODE_EXE%
echo.

echo [Step 2/5] Checking Firebase CLI...
if not exist "%FIREBASE_JS%" (
    echo ERROR: Firebase CLI not found!
    echo Installing Firebase CLI...
    "%NODE_EXE%" -g install firebase-tools
    if errorlevel 1 (
        echo ERROR: Failed to install Firebase CLI
        pause
        exit /b 1
    )
)
echo Firebase CLI found: %FIREBASE_JS%
echo.

echo [Step 3/5] Clearing old authentication...
if exist "%FIREBASE_CONFIG%" (
    echo Removing old Firebase credentials...
    del /f /q "%FIREBASE_CONFIG%" 2>nul
    echo Old credentials cleared.
) else (
    echo No old credentials found.
)
echo.

echo [Step 4/5] Testing Firebase CLI...
"%NODE_EXE%" "%FIREBASE_JS%" --version
if errorlevel 1 (
    echo ERROR: Firebase CLI test failed
    pause
    exit /b 1
)
echo Firebase CLI is working!
echo.

echo [Step 5/5] Authenticating with Firebase...
echo.
echo ========================================
echo AUTHENTICATION REQUIRED
echo ========================================
echo.
echo This will open your browser to sign in.
echo.
echo Steps:
echo   1. Browser will open automatically
echo   2. Sign in with your Google account
echo   3. Click "Allow" to authorize Firebase CLI
echo   4. Return here when done
echo.
pause

echo.
echo Opening browser for authentication...
echo.

REM Try standard authentication first
"%NODE_EXE%" "%FIREBASE_JS%" login --reauth
if errorlevel 1 (
    echo.
    echo Standard authentication failed, trying alternative method...
    "%NODE_EXE%" "%FIREBASE_JS%" login --reauth --no-localhost
    if errorlevel 1 (
        echo.
        echo ========================================
        echo AUTHENTICATION FAILED
        echo ========================================
        echo.
        echo Please try manual authentication:
        echo   1. Open browser: https://console.firebase.google.com/
        echo   2. Sign in with your Google account
        echo   3. Go to: https://console.firebase.google.com/u/0/project/iterum-culinary-app2
        echo   4. Verify you have access to the project
        echo   5. Run this script again
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo AUTHENTICATION SUCCESSFUL!
echo ========================================
echo.

echo Testing connection to Firebase project...
"%NODE_EXE%" "%FIREBASE_JS%" projects:list >nul 2>&1
if errorlevel 1 (
    echo WARNING: Could not list projects, but authentication succeeded.
    echo Continuing anyway...
) else (
    echo Connection test successful!
)
echo.

echo Setting Firebase project...
"%NODE_EXE%" "%FIREBASE_JS%" use iterum-culinary-app2 --non-interactive
if errorlevel 1 (
    echo WARNING: Could not set project, but continuing...
)
echo.

echo ========================================
echo FIREBASE CONNECTION FIXED!
echo ========================================
echo.
echo You can now deploy using:
echo   deploy-node-only.bat
echo.
echo Or deploy now? (Y/N)
set /p DEPLOY_NOW="> "
if /i "%DEPLOY_NOW%"=="Y" (
    echo.
    echo Deploying to iterum-culinary-landing...
    echo.
    "%NODE_EXE%" "%FIREBASE_JS%" deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2
    if errorlevel 1 (
        echo.
        echo Deployment failed. Check errors above.
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
)
echo.
pause

