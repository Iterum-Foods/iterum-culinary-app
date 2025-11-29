@echo off
echo ========================================
echo Starting Local Development Server
echo ========================================
echo.

cd /d "%~dp0"

echo Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Installing dependencies (if needed)...
call npm install

echo.
echo Starting local server...
echo.
echo Your app will open at: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

call npm start

