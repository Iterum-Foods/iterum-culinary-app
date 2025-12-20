@echo off
REM ================================================
REM Generate Firebase CI Token for GitHub Actions
REM ================================================

echo.
echo ========================================
echo Generate Firebase CI Token
echo ========================================
echo.
echo This will generate a new Firebase CI token for GitHub Actions.
echo.
echo IMPORTANT: This token will be displayed in the terminal.
echo Copy it and add it to GitHub Secrets as FIREBASE_TOKEN.
echo.
pause

cd /d "%~dp0"

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

echo.
echo ========================================
echo Verify Firebase Project
echo ========================================
echo.

"%NODE_EXE%" "%FIREBASE_JS%" use >nul 2>&1
if errorlevel 1 (
    echo   WARNING: Cannot verify current project
    echo   Make sure you're authenticated first
) else (
    echo   Current Firebase project:
    "%NODE_EXE%" "%FIREBASE_JS%" use
    echo.
    "%NODE_EXE%" "%FIREBASE_JS%" use | findstr /C:"iterum-culinary-app2" >nul
    if errorlevel 1 (
        echo   WARNING: Project is not iterum-culinary-app2
        echo   Expected: iterum-culinary-app2
        echo.
        echo   Switch to correct project? (Y/N)
        set /p SWITCH_PROJECT=
        if /i "%SWITCH_PROJECT%"=="Y" (
            "%NODE_EXE%" "%FIREBASE_JS%" use iterum-culinary-app2
            echo   Switched to iterum-culinary-app2
        )
    ) else (
        echo   OK: Using correct project (iterum-culinary-app2)
    )
)

echo.
echo ========================================
echo Generating CI Token...
echo ========================================
echo.
echo This will open your browser for authentication.
echo After signing in, the token will be displayed.
echo.
echo IMPORTANT: Make sure you sign in with the Google account
echo that has access to the iterum-culinary-app2 project.
echo.
pause

echo.
echo Generating token...
echo.

"%NODE_EXE%" "%FIREBASE_JS%" login:ci --no-localhost

if errorlevel 1 (
    echo.
    echo ERROR: Token generation failed.
    echo.
    echo Try running: firebase login --reauth
    echo Then run this script again.
    pause
    exit /b 1
) else (
    echo.
    echo ========================================
    echo Token Generated Successfully!
    echo ========================================
    echo.
    echo NEXT STEPS:
    echo.
    echo 1. Copy the token shown above (it starts with a long string)
    echo.
    echo 2. Go to GitHub:
    echo    https://github.com/Iterum-Foods/iterum-culinary-app/settings/secrets/actions
    echo.
    echo 3. Click "New repository secret"
    echo.
    echo 4. Name: FIREBASE_TOKEN
    echo    Value: [paste the token here]
    echo.
    echo 5. Click "Add secret"
    echo.
    echo 6. The next GitHub Actions run will use this new token.
    echo.
    pause
)
