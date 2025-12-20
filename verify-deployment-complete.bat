@echo off
REM ================================================
REM Complete Deployment Verification
REM Checks all aspects of deployment
REM ================================================

echo.
echo ========================================
echo Complete Deployment Verification
echo ========================================
echo.

cd /d "%~dp0"

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "FIREBASE_JS=C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js"

echo [1/6] Checking Local Files...
echo.

echo Landing Site Files:
if exist "public\landing.html" (echo   OK: landing.html) else (echo   ERROR: landing.html missing)
if exist "public\pitch.html" (echo   OK: pitch.html) else (echo   ERROR: pitch.html missing)
if exist "public\company.html" (echo   OK: company.html) else (echo   WARNING: company.html missing)

echo.
echo App Site Files:
if exist "public\index.html" (echo   OK: index.html) else (echo   ERROR: index.html missing)
if exist "public\dashboard.html" (echo   OK: dashboard.html) else (echo   ERROR: dashboard.html missing)
if exist "public\signin.html" (echo   OK: signin.html) else (echo   ERROR: signin.html missing)

echo.
echo Assets:
if exist "public\assets" (
    echo   OK: assets folder exists
    if exist "public\assets\css" (echo   OK: assets/css exists) else (echo   ERROR: assets/css missing)
    if exist "public\assets\js" (echo   OK: assets/js exists) else (echo   ERROR: assets/js missing)
) else (
    echo   ERROR: assets folder missing
)

echo.
echo [2/6] Checking Configuration...
echo.

if exist "firebase.json" (
    echo   OK: firebase.json exists
    findstr /C:"iterum-culinary-landing" firebase.json >nul
    if errorlevel 1 (echo   ERROR: Landing site not in firebase.json) else (echo   OK: Landing site configured)
    findstr /C:"iterum-culinary-app2" firebase.json >nul
    if errorlevel 1 (echo   ERROR: App site not in firebase.json) else (echo   OK: App site configured)
) else (
    echo   ERROR: firebase.json missing
)

if exist ".firebaserc" (
    echo   OK: .firebaserc exists
    findstr /C:"iterum-culinary-app2" .firebaserc >nul
    if errorlevel 1 (echo   ERROR: Project ID not in .firebaserc) else (echo   OK: Project ID configured)
) else (
    echo   ERROR: .firebaserc missing
)

echo.
echo [3/6] Checking GitHub Workflow...
echo.

if exist ".github\workflows\firebase-deploy.yml" (
    echo   OK: Workflow file exists
    findstr /C:"node-version: '20" .github\workflows\firebase-deploy.yml >nul
    if errorlevel 1 (
        echo   ERROR: Node.js version not set to 20.x
    ) else (
        echo   OK: Node.js version is 20.x
    )
    findstr /C:"iterum-culinary-landing" .github\workflows\firebase-deploy.yml >nul
    if errorlevel 1 (echo   ERROR: Landing site not in workflow) else (echo   OK: Landing site in workflow)
    findstr /C:"iterum-culinary-app2" .github\workflows\firebase-deploy.yml >nul
    if errorlevel 1 (echo   ERROR: App site not in workflow) else (echo   OK: App site in workflow)
) else (
    echo   ERROR: Workflow file missing
)

echo.
echo [4/6] Checking Firebase Connection...
echo.

"%NODE_EXE%" "%FIREBASE_JS%" projects:list >nul 2>&1
if errorlevel 1 (
    echo   ERROR: Cannot connect to Firebase
    echo   Please authenticate: firebase-login-direct.bat
) else (
    echo   OK: Firebase connection works
    echo.
    echo   Current project:
    "%NODE_EXE%" "%FIREBASE_JS%" use
)

echo.
echo [5/6] Checking Node.js Version...
echo.

"%NODE_EXE%" --version >nul 2>&1
if errorlevel 1 (
    echo   ERROR: Node.js not found
) else (
    for /f "tokens=*" %%i in ('"%NODE_EXE%" --version') do set NODE_VERSION=%%i
    echo   Node.js version: %NODE_VERSION%
    echo   Required: >=20.0.0
)

echo.
echo [6/6] Summary...
echo.

echo ========================================
echo Verification Complete
echo ========================================
echo.
echo Next steps:
echo   1. Check GitHub Actions for workflow status
echo   2. Check Firebase Console for deployments
echo   3. Test URLs in browser
echo   4. Check browser console for errors
echo.
echo URLs to test:
echo   Landing: https://iterum-culinary-landing.web.app
echo   App: https://iterum-culinary-app2.web.app
echo.
pause

