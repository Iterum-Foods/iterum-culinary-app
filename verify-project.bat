@echo off
REM ================================================
REM Verify Firebase Project - Direct Node.js
REM Bypasses PowerShell completely
REM ================================================

echo.
echo ========================================
echo Verify Firebase Project
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
    pause
    exit /b 1
)

echo Checking current Firebase project...
echo.

"%NODE_EXE%" "%FIREBASE_JS%" projects:list

echo.
echo.
echo Setting project to iterum-culinary-app2...
echo.

"%NODE_EXE%" "%FIREBASE_JS%" use iterum-culinary-app2

if errorlevel 1 (
    echo.
    echo ERROR: Failed to set project
    echo.
    echo You may need to login first. Run:
    echo   firebase-login.bat
    echo.
) else (
    echo.
    echo ✅ Project set successfully!
    echo.
    echo Verifying project...
    echo.
    "%NODE_EXE%" "%FIREBASE_JS%" projects:list
)

echo.
pause


