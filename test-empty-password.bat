@echo off
echo === Testing Empty Password ===

echo Testing without CSC_KEY_PASSWORD set at all...
set CSC_LINK=cert\windows-cert.p12
set CSC_KEY_PASSWORD=

echo Environment:
echo CSC_LINK=%CSC_LINK%
echo CSC_KEY_PASSWORD="%CSC_KEY_PASSWORD%"

echo.
echo Running electron-builder with empty password...
npx electron-builder --win --publish never

pause