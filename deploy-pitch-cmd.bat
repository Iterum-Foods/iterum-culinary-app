@echo off
REM ================================================
REM Deploy Pitch Page - Pure CMD (No PowerShell)
REM ================================================

echo.
echo ========================================
echo Deploying Pitch Page to Firebase
echo ========================================
echo.

cd /d "%~dp0"

REM Check if Firebase CLI is available
where firebase >nul 2>&1
if errorlevel 1 (
    echo ERROR: Firebase CLI not found in PATH
    echo.
    echo Please install Firebase CLI:
    echo   npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

echo [1/3] Setting Firebase project...
firebase use iterum-culinary-app2
if errorlevel 1 (
    echo.
    echo WARNING: Project setting failed, continuing anyway...
    echo.
)

echo.
echo [2/3] Checking authentication...
firebase projects:list >nul 2>&1
if errorlevel 1 (
    echo.
    echo ========================================
    echo AUTHENTICATION REQUIRED
    echo ========================================
    echo.
    echo Your Firebase credentials have expired.
    echo This will open your browser to sign in.
    echo.
    pause
    echo.
    echo Opening browser for authentication...
    firebase login --reauth
    if errorlevel 1 (
        echo.
        echo ERROR: Authentication failed
        echo Please try again manually
        pause
        exit /b 1
    )
)

echo.
echo [3/3] Deploying to iterum-culinary-landing...
echo.
firebase deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2

if errorlevel 1 (
    echo.
    echo ========================================
    echo DEPLOYMENT FAILED
    echo ========================================
    echo.
    echo Please check the error messages above.
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
pause

