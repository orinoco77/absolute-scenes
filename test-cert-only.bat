@echo off
echo === Quick Certificate Test ===

if not exist "cert\windows-cert.p12" (
    echo ❌ Certificate file not found
    echo Please copy your .p12 file to: cert\windows-cert.p12
    pause
    exit /b 1
)

echo ✅ Certificate file found:
dir cert\windows-cert.p12

echo.
echo Testing with Windows certutil...
echo.
echo Testing certificate info:
certutil -dump cert\windows-cert.p12

echo.
echo Now let's test signing directly with signtool...
echo (This is what electron-builder uses internally)

REM Try to find signtool
set SIGNTOOL=""
if exist "C:\Program Files (x86)\Windows Kits\10\bin\*\x64\signtool.exe" (
    for /f "delims=" %%i in ('dir "C:\Program Files (x86)\Windows Kits\10\bin\*\x64\signtool.exe" /s /b 2^>nul') do set SIGNTOOL=%%i
)

if "%SIGNTOOL%"=="" (
    echo ⚠️  signtool.exe not found - install Windows SDK to test locally
    echo But we can still test with electron-builder...
    goto :electron_test
)

echo Found signtool: %SIGNTOOL%
echo.
echo Testing signing with password "scenes"...
echo Creating a dummy file to test signing...
echo test > test.txt
"%SIGNTOOL%" sign /f cert\windows-cert.p12 /p scenes /fd SHA256 /t http://timestamp.digicert.com /v test.txt

:electron_test
echo.
echo === Testing with electron-builder ===
echo.
set CSC_LINK=cert\windows-cert.p12
set CSC_KEY_PASSWORD=scenes
echo CSC_LINK=%CSC_LINK%
echo CSC_KEY_PASSWORD=%CSC_KEY_PASSWORD%
echo.
echo Running: npm run build (quick test)
npm run build

echo.
echo === Test Complete ===
pause