@echo off
REM ================================================
REM Verify Firebase Files Connect to Correct Project
REM ================================================

echo.
echo ========================================
echo Firebase Configuration Verification
echo ========================================
echo.

cd /d "%~dp0"

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "FIREBASE_JS=C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js"

set "ERRORS=0"
set "WARNINGS=0"

echo [1/5] Checking .firebaserc Configuration...
echo.

if exist ".firebaserc" (
    echo   OK: .firebaserc exists
    
    findstr /C:"iterum-culinary-app2" .firebaserc >nul
    if errorlevel 1 (
        echo   ERROR: Project ID not found in .firebaserc
        set /a ERRORS+=1
    ) else (
        echo   OK: Project ID configured: iterum-culinary-app2
    )
    
    findstr /C:"iterum-culinary-landing" .firebaserc >nul
    if errorlevel 1 (
        echo   ERROR: Landing site not in .firebaserc
        set /a ERRORS+=1
    ) else (
        echo   OK: Landing site configured: iterum-culinary-landing
    )
    
    findstr /C:"iterum-culinary-app2" .firebaserc | findstr /C:"hosting" >nul
    if errorlevel 1 (
        echo   WARNING: App site hosting target may not be configured
        set /a WARNINGS+=1
    ) else (
        echo   OK: App site configured: iterum-culinary-app2
    )
) else (
    echo   ERROR: .firebaserc missing
    set /a ERRORS+=1
)

echo.
echo [2/5] Checking firebase.json Configuration...
echo.

if exist "firebase.json" (
    echo   OK: firebase.json exists
    
    findstr /C:"iterum-culinary-landing" firebase.json >nul
    if errorlevel 1 (
        echo   ERROR: Landing site not in firebase.json
        set /a ERRORS+=1
    ) else (
        echo   OK: Landing site configured: iterum-culinary-landing
    )
    
    findstr /C:"iterum-culinary-app2" firebase.json >nul
    if errorlevel 1 (
        echo   ERROR: App site not in firebase.json
        set /a ERRORS+=1
    ) else (
        echo   OK: App site configured: iterum-culinary-app2
    )
    
    findstr /C:"\"public\"" firebase.json >nul
    if errorlevel 1 (
        echo   WARNING: Public directory may not be configured
        set /a WARNINGS+=1
    ) else (
        echo   OK: Public directory configured
    )
) else (
    echo   ERROR: firebase.json missing
    set /a ERRORS+=1
)

echo.
echo [3/5] Checking GitHub Actions Workflow...
echo.

if exist ".github\workflows\firebase-deploy.yml" (
    echo   OK: GitHub workflow exists
    
    findstr /C:"iterum-culinary-landing" .github\workflows\firebase-deploy.yml >nul
    if errorlevel 1 (
        echo   ERROR: Landing site not in workflow
        set /a ERRORS+=1
    ) else (
        echo   OK: Landing site in workflow: iterum-culinary-landing
    )
    
    findstr /C:"iterum-culinary-app2" .github\workflows\firebase-deploy.yml >nul
    if errorlevel 1 (
        echo   ERROR: App site not in workflow
        set /a ERRORS+=1
    ) else (
        echo   OK: App site in workflow: iterum-culinary-app2
    )
    
    findstr /C:"FIREBASE_TOKEN" .github\workflows\firebase-deploy.yml >nul
    if errorlevel 1 (
        echo   WARNING: FIREBASE_TOKEN not referenced in workflow
        set /a WARNINGS+=1
    ) else (
        echo   OK: FIREBASE_TOKEN configured in workflow
    )
) else (
    echo   ERROR: GitHub workflow missing
    set /a ERRORS+=1
)

echo.
echo [4/5] Checking Firebase Connection...
echo.

"%NODE_EXE%" "%FIREBASE_JS%" projects:list >nul 2>&1
if errorlevel 1 (
    echo   WARNING: Cannot connect to Firebase (not authenticated)
    echo   Run: firebase-login-direct.bat
    set /a WARNINGS+=1
) else (
    echo   OK: Connected to Firebase
    
    echo.
    echo   Current project:
    "%NODE_EXE%" "%FIREBASE_JS%" use
    
    echo.
    "%NODE_EXE%" "%FIREBASE_JS%" use | findstr /C:"iterum-culinary-app2" >nul
    if errorlevel 1 (
        echo   WARNING: Not using iterum-culinary-app2 project
        echo   Should switch to: firebase use iterum-culinary-app2
        set /a WARNINGS+=1
    ) else (
        echo   OK: Using correct project: iterum-culinary-app2
    )
    
    echo.
    echo   Checking hosting sites...
    "%NODE_EXE%" "%FIREBASE_JS%" hosting:sites:list 2>nul | findstr /C:"iterum-culinary-landing" >nul
    if errorlevel 1 (
        echo   ERROR: Site iterum-culinary-landing NOT FOUND in Firebase
        echo   Create it at: https://console.firebase.google.com/project/iterum-culinary-app2/hosting
        set /a ERRORS+=1
    ) else (
        echo   OK: Site iterum-culinary-landing exists in Firebase
    )
    
    "%NODE_EXE%" "%FIREBASE_JS%" hosting:sites:list 2>nul | findstr /C:"iterum-culinary-app2" >nul
    if errorlevel 1 (
        echo   ERROR: Site iterum-culinary-app2 NOT FOUND in Firebase
        echo   Create it at: https://console.firebase.google.com/project/iterum-culinary-app2/hosting
        set /a ERRORS+=1
    ) else (
        echo   OK: Site iterum-culinary-app2 exists in Firebase
    )
)

echo.
echo [5/5] Configuration Summary...
echo.

echo ========================================
echo Configuration Alignment Check
echo ========================================
echo.

echo Expected Configuration:
echo   Project ID: iterum-culinary-app2
echo   Landing Site: iterum-culinary-landing
echo   App Site: iterum-culinary-app2
echo.

echo Files Checked:
echo   .firebaserc: Project and hosting targets
echo   firebase.json: Hosting sites configuration
echo   .github/workflows/firebase-deploy.yml: Deployment workflow
echo.

if %ERRORS% EQU 0 (
    echo   ✅ All configurations match!
    echo.
    echo   All files are correctly configured to connect to:
    echo   - Project: iterum-culinary-app2
    echo   - Landing Site: iterum-culinary-landing
    echo   - App Site: iterum-culinary-app2
) else (
    echo   ❌ Found %ERRORS% configuration errors
    echo   Please fix the errors above before deploying.
)

if %WARNINGS% GTR 0 (
    echo   ⚠️  Found %WARNINGS% warnings (check above)
)

echo.
echo ========================================
echo Next Steps
echo ========================================
echo.

if %ERRORS% GTR 0 (
    echo 1. Fix configuration errors listed above
    echo 2. Re-run this verification script
    echo 3. Deploy after all checks pass
) else (
    echo 1. Configuration is correct!
    echo 2. Deploy using GitHub Actions or deploy-both-sites.bat
    echo 3. Test URLs:
    echo    - Landing: https://iterum-culinary-landing.web.app
    echo    - App: https://iterum-culinary-app2.web.app
)

echo.
pause

