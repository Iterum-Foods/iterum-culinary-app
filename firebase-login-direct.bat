@echo off
REM ================================================
REM Firebase Login - Direct Node.js
REM Bypasses PowerShell wrapper for authentication
REM ================================================

echo.
echo ========================================
echo Firebase Authentication
echo ========================================
echo.

cd /d "%~dp0"

REM Direct Node.js paths
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "FIREBASE_JS=C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js"

REM Check Node.js
if not exist "%NODE_EXE%" (
    echo ERROR: Node.js not found at: %NODE_EXE%
    pause
    exit /b 1
)

REM Check Firebase CLI
if not exist "%FIREBASE_JS%" (
    echo ERROR: Firebase CLI not found at: %FIREBASE_JS%
    pause
    exit /b 1
)

echo This will open your browser to authenticate with Firebase.
echo.
echo Steps:
echo   1. Browser will open automatically
echo   2. Sign in with your Google account
echo   3. Authorize Firebase CLI
echo   4. Return here when done
echo.
pause

echo.
echo Opening browser for authentication...
echo.

REM Use --no-localhost flag if localhost redirect doesn't work
"%NODE_EXE%" "%FIREBASE_JS%" login --reauth

if errorlevel 1 (
    echo.
    echo ========================================
    echo AUTHENTICATION FAILED
    echo ========================================
    echo.
    echo Trying alternative method...
    echo.
    "%NODE_EXE%" "%FIREBASE_JS%" login --reauth --no-localhost
    if errorlevel 1 (
        echo.
        echo Authentication failed. Please try manually:
        echo   1. Open browser: https://console.firebase.google.com/
        echo   2. Sign in with your Google account
        echo   3. Go to project settings
        echo   4. Generate a CI token if needed
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo AUTHENTICATION SUCCESSFUL!
echo ========================================
echo.
echo You can now deploy using:
echo   deploy-node-only.bat
echo.
pause

