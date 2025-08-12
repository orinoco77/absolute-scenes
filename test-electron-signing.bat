@echo off
echo === Testing Electron-Builder Signing ===

if not exist "cert\windows-cert.p12" (
    echo Certificate not found!
    pause
    exit /b 1
)

echo Certificate file: cert\windows-cert.p12
dir cert\windows-cert.p12

echo.
echo Setting environment variables...
set CSC_LINK=cert\windows-cert.p12
set CSC_KEY_PASSWORD=scenes
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true

echo CSC_LINK=%CSC_LINK%
echo CSC_KEY_PASSWORD=%CSC_KEY_PASSWORD%

echo.
echo Testing electron-builder signing...
echo This will try to build and sign - if it fails, we'll see the exact error

npx electron-builder --win --publish never

echo.
echo === Test Complete ===
pause