@echo off
echo === Finding the Correct Certificate Password ===

if not exist "cert\windows-cert.p12" (
    echo Certificate not found!
    pause
    exit /b 1
)

echo Testing different password combinations...
echo.

echo 1. Testing EMPTY password...
set CSC_KEY_PASSWORD=
npx electron-builder --win --publish never 2>error.log
if %errorlevel%==0 (
    echo ✅ SUCCESS! Empty password works!
    goto :success
) else (
    findstr /i "password" error.log
    echo.
)

echo 2. Testing password: ""
set CSC_KEY_PASSWORD=""
npx electron-builder --win --publish never 2>error.log
if %errorlevel%==0 (
    echo ✅ SUCCESS! Empty quotes password works!
    goto :success
) else (
    findstr /i "password" error.log
    echo.
)

echo 3. Re-testing password: scenes
set CSC_KEY_PASSWORD=scenes
npx electron-builder --win --publish never 2>error.log
if %errorlevel%==0 (
    echo ✅ SUCCESS! "scenes" password works!
    goto :success
) else (
    findstr /i "password" error.log
    echo.
)

echo 4. Testing common passwords...
for %%p in ("" "password" "123456" "admin" "test") do (
    echo Testing: %%p
    set CSC_KEY_PASSWORD=%%p
    npx electron-builder --win --publish never 2>error.log
    if !errorlevel!==0 (
        echo ✅ SUCCESS! Password %%p works!
        goto :success
    )
)

echo.
echo ❌ None of the common passwords worked.
echo.
echo The certificate might be corrupted or was created with a different password.
echo Try recreating the certificate with a known password.
goto :end

:success
echo.
echo 🎉 Found the working password! Update your GitHub secret with this value.

:end
echo.
pause