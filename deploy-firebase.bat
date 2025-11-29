@echo off
echo ========================================
echo Firebase Deployment Script
echo ========================================
echo.

cd /d "%~dp0"

echo Setting Firebase project to app2...
call firebase.cmd use app2
if errorlevel 1 (
    echo ERROR: Failed to set project
    echo Please run: firebase login --reauth
    pause
    exit /b 1
)

echo.
echo Deploying Firestore rules...
call firebase.cmd deploy --only firestore:rules
if errorlevel 1 (
    echo WARNING: Firestore rules deployment failed
    echo You can deploy manually via Firebase Console
)

echo.
echo Deploying Storage rules...
call firebase.cmd deploy --only storage
if errorlevel 1 (
    echo WARNING: Storage rules deployment failed
    echo You can deploy manually via Firebase Console
)

echo.
echo Deploying Hosting...
call firebase.cmd deploy --only hosting:iterum-culinary-app2
if errorlevel 1 (
    echo WARNING: Hosting deployment failed
    echo Check Firebase Console for details
)

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
pause

