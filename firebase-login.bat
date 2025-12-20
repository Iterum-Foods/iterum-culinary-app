@echo off
REM ================================================
REM Firebase Login - Direct Node.js Call
REM Bypasses PowerShell completely
REM ================================================

echo.
echo ========================================
echo Firebase Login
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

echo Running Firebase login...
echo.
echo This will open your browser to authenticate.
echo.

"%NODE_EXE%" "%FIREBASE_JS%" login --reauth

if errorlevel 1 (
    echo.
    echo Login failed. Please try again.
) else (
    echo.
    echo Login successful!
)

echo.
pause

