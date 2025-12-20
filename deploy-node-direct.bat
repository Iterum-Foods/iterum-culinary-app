@echo off
REM ================================================
REM Firebase Deployment - Direct Node.js Call
REM Bypasses all PowerShell and .cmd wrappers
REM ================================================

echo.
echo ========================================
echo Firebase Deployment (Direct Node.js)
echo ========================================
echo.

cd /d "%~dp0"

REM Direct paths
set NODE_EXE=C:\Program Files\nodejs\node.exe
set FIREBASE_JS=C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js

if not exist "%NODE_EXE%" (
    echo ERROR: Node.js not found at: %NODE_EXE%
    pause
    exit /b 1
)

if not exist "%FIREBASE_JS%" (
    echo ERROR: Firebase CLI not found at: %FIREBASE_JS%
    echo.
    echo Please ensure Firebase CLI is installed:
    echo   npm install -g firebase-tools
    pause
    exit /b 1
)

echo Using Node.js: %NODE_EXE%
echo Using Firebase CLI: %FIREBASE_JS%
echo.

echo [1/5] Setting Firebase project...
"%NODE_EXE%" "%FIREBASE_JS%" use iterum-culinary-app2
if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Failed to set project
    echo ========================================
    echo.
    echo You may need to login first. Run:
    echo   "%NODE_EXE%" "%FIREBASE_JS%" login --reauth
    echo.
    pause
    exit /b 1
)

echo.
echo [2/5] Deploying Firestore rules...
"%NODE_EXE%" "%FIREBASE_JS%" deploy --only firestore:rules
if errorlevel 1 (
    echo WARNING: Firestore rules deployment failed
)

echo.
echo [3/5] Deploying Storage rules...
"%NODE_EXE%" "%FIREBASE_JS%" deploy --only storage
if errorlevel 1 (
    echo WARNING: Storage rules deployment failed
)

echo.
echo [4/5] Deploying Landing Site...
"%NODE_EXE%" "%FIREBASE_JS%" deploy --only hosting:iterum-culinary-landing
if errorlevel 1 (
    echo WARNING: Landing site deployment failed
)

echo.
echo [5/5] Deploying Main App Site...
"%NODE_EXE%" "%FIREBASE_JS%" deploy --only hosting:iterum-culinary-app2
if errorlevel 1 (
    echo WARNING: Main app deployment failed
)

echo.
echo ========================================
echo Deployment Process Complete!
echo ========================================
echo.
echo Check the output above for any errors.
echo.
pause

