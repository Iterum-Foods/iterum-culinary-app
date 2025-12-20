@echo off
REM ================================================
REM Generate Firebase CI Token for GitHub Actions
REM ================================================

echo.
echo ========================================
echo Generate Firebase CI Token
echo ========================================
echo.
echo This will generate a token for GitHub Actions.
echo.
echo IMPORTANT:
echo   - Keep this token SECRET
echo   - Add it to GitHub Secrets (Settings > Secrets > Actions)
echo   - Name it: FIREBASE_TOKEN
echo.
pause

cd /d "%~dp0"

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
set "FIREBASE_JS=C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js"

echo.
echo Opening browser to authenticate...
echo.
echo Steps:
echo   1. Sign in with your Google account
echo   2. Authorize Firebase CLI
echo   3. Copy the token that appears
echo   4. Add it to GitHub Secrets
echo.
pause

"%NODE_EXE%" "%FIREBASE_JS%" login:ci

if errorlevel 1 (
    echo.
    echo ERROR: Failed to generate token
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Token Generated!
echo ========================================
echo.
echo Next steps:
echo   1. Copy the token above (starts with 1//)
echo   2. Go to GitHub repository
echo   3. Settings > Secrets and variables > Actions
echo   4. New repository secret
echo   5. Name: FIREBASE_TOKEN
echo   6. Value: (paste token)
echo   7. Add secret
echo.
echo IMPORTANT: Keep this token secret!
echo.
pause

