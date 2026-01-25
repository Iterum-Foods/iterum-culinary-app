@echo off
REM ================================================
REM Deploy Both Firebase Hosting Sites
REM 1. Landing Site (iterum-culinary-landing)
REM 2. Main App Site (iterum-culinary-app2)
REM ================================================

echo.
echo ========================================
echo Deploying Both Firebase Sites
echo ========================================
echo.

cd /d "%~dp0"

REM Direct Node.js paths
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "FIREBASE_JS=C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js"

REM Verify files exist
if not exist "%NODE_EXE%" (
    echo ERROR: Node.js not found at: %NODE_EXE%
    pause
    exit /b 1
)

if not exist "%FIREBASE_JS%" (
    echo ERROR: Firebase CLI not found!
    pause
    exit /b 1
)

echo Using Node.js: %NODE_EXE%
echo Using Firebase: %FIREBASE_JS%
echo.

REM Test authentication
echo [Checking authentication...]
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
    pause
    echo.
    echo Opening browser for authentication...
    "%NODE_EXE%" "%FIREBASE_JS%" login --reauth
    if errorlevel 1 (
        echo.
        echo Authentication failed. Please run: firebase-login-direct.bat
        pause
        exit /b 1
    )
    echo.
    echo Authentication successful!
    echo.
)

echo.
echo ========================================
echo [1/2] Deploying Landing Site
echo ========================================
echo.
echo Site: iterum-culinary-landing
echo Includes: Landing page, Pitch page, Company page
echo.
echo URLs after deployment:
echo   https://iterum-culinary-landing.web.app
echo   https://iterum-culinary-landing.web.app/pitch
echo.
pause

"%NODE_EXE%" "%FIREBASE_JS%" deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2 --non-interactive

if errorlevel 1 (
    echo.
    echo ========================================
    echo LANDING SITE DEPLOYMENT FAILED
    echo ========================================
    echo.
    echo Check errors above. Continuing with app site...
    echo.
    pause
) else (
    echo.
    echo ========================================
    echo LANDING SITE DEPLOYED SUCCESSFULLY!
    echo ========================================
    echo.
)

echo.
echo ========================================
echo [2/2] Deploying Main App Site
echo ========================================
echo.
echo Site: iterum-culinary-app2
echo Includes: Dashboard, Sign-in, Recipe tools, etc.
echo.
echo URLs after deployment:
echo   https://iterum-culinary-app2.web.app
echo   https://iterum-culinary-app2.web.app/dashboard.html
echo   https://iterum-culinary-app2.web.app/signin.html
echo.
pause

"%NODE_EXE%" "%FIREBASE_JS%" deploy --only hosting:iterum-culinary-app2 --project iterum-culinary-app2 --non-interactive

if errorlevel 1 (
    echo.
    echo ========================================
    echo APP SITE DEPLOYMENT FAILED
    echo ========================================
    echo.
    echo Check errors above.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Both sites have been deployed successfully!
echo.
echo ========================================
echo Landing Site (Marketing/Investor Pages)
echo ========================================
echo   Main: https://iterum-culinary-landing.web.app
echo   Pitch: https://iterum-culinary-landing.web.app/pitch
echo   Company: https://iterum-culinary-landing.web.app/company.html
echo.
echo ========================================
echo Main App Site (Application)
echo ========================================
echo   Main: https://iterum-culinary-app2.web.app
echo   Dashboard: https://iterum-culinary-app2.web.app/dashboard.html
echo   Sign In: https://iterum-culinary-app2.web.app/signin.html
echo.
echo Note: Deployments may take 1-2 minutes to propagate.
echo.
pause

