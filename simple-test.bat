@echo off
echo === Simple Manual Test ===

if not exist "cert\windows-cert.p12" (
    echo First, copy your certificate:
    echo copy "path\to\your\certificate.p12" "cert\windows-cert.p12"
    pause
    exit /b 1
)

echo Certificate file exists: cert\windows-cert.p12
dir cert\windows-cert.p12

echo.
echo Testing certificate with certutil (this will ask for password):
certutil -dump cert\windows-cert.p12

echo.
echo Now testing environment variables and build...
set CSC_LINK=cert\windows-cert.p12
set CSC_KEY_PASSWORD=scenes
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true

echo Environment set. Running build...
echo If this works, the GitHub Actions should work too.
npm run build

pause