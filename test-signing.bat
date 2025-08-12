@echo off
echo === Testing Certificate Signing Locally ===
echo.

REM Check if certificate exists
if not exist "cert\windows-cert.p12" (
    echo ❌ Certificate file not found: cert\windows-cert.p12
    echo Please run: copy "path\to\your\exported\certificate.p12" "cert\windows-cert.p12"
    pause
    exit /b 1
)

echo ✅ Certificate file found
dir cert\windows-cert.p12

echo.
echo Testing certificate with PowerShell...
powershell -Command "try { $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2; $cert.Import('cert\windows-cert.p12', 'scenes', 'DefaultKeySet'); Write-Host '✅ Certificate imports successfully with password: scenes'; Write-Host 'Certificate Subject:' $cert.Subject; $cert.Dispose() } catch { Write-Host '❌ Certificate import failed:' $_.Exception.Message }"

echo.
echo Testing electron-builder signing...
set CSC_LINK=cert\windows-cert.p12
set CSC_KEY_PASSWORD=scenes
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true

echo Environment variables set:
echo CSC_LINK=%CSC_LINK%
echo CSC_KEY_PASSWORD=%CSC_KEY_PASSWORD%

echo.
echo Running electron-builder (this will take a few minutes)...
echo Press Ctrl+C to cancel if you see errors early on

npx electron-builder --win --publish never

echo.
echo === Test Complete ===
pause