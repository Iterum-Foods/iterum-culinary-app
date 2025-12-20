@echo off
REM ================================================
REM Firebase Deployment - Direct Node.js Only
REM Completely bypasses Firebase CLI wrapper
REM ================================================

echo.
echo ========================================
echo Firebase Deployment - Direct Node.js
echo ========================================
echo.

cd /d "%~dp0"

REM Direct Node.js paths
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
    echo Please install Firebase CLI:
    echo   npm install -g firebase-tools
    pause
    exit /b 1
)

echo Using Node.js: %NODE_EXE%
echo Using Firebase CLI: %FIREBASE_JS%
echo.

REM Skip project setting - go straight to deployment with explicit project
echo ========================================
echo Deploying to iterum-culinary-landing
echo Project: iterum-culinary-app2
echo ========================================
echo.

REM Deploy directly with project flag - bypasses all project setting
"%NODE_EXE%" "%FIREBASE_JS%" deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2 --non-interactive

if errorlevel 1 (
    echo.
    echo ========================================
    echo DEPLOYMENT FAILED - AUTHENTICATION REQUIRED
    echo ========================================
    echo.
    echo Your Firebase credentials have expired.
    echo.
    echo Please run authentication first:
    echo   1. Run: firebase-login-direct.bat
    echo   2. Sign in with your Google account
    echo   3. Then run this script again
    echo.
    echo Or authenticate now? (Y/N)
    set /p AUTH_NOW="> "
    if /i "%AUTH_NOW%"=="Y" (
        echo.
        echo Opening browser for authentication...
        "%NODE_EXE%" "%FIREBASE_JS%" login --reauth
        if errorlevel 1 (
            echo.
            echo Trying alternative authentication method...
            "%NODE_EXE%" "%FIREBASE_JS%" login --reauth --no-localhost
            if errorlevel 1 (
                echo.
                echo Authentication failed. Please run firebase-login-direct.bat manually.
                pause
                exit /b 1
            )
        )
        echo.
        echo Authentication successful! Retrying deployment...
        echo.
        "%NODE_EXE%" "%FIREBASE_JS%" deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2 --non-interactive
        if errorlevel 1 (
            echo.
            echo Deployment still failed. Check errors above.
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo Please authenticate first by running: firebase-login-direct.bat
        pause
        exit /b 1
    )
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
pause

