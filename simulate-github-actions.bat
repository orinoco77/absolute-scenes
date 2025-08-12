@echo off
echo === Simulating GitHub Actions Workflow ===

echo Step 1: Verify certificate exists
if not exist "cert\windows-cert.p12" (
    echo ❌ Certificate not found! Please copy your certificate to cert\windows-cert.p12
    pause
    exit /b 1
)
echo ✅ Certificate found

echo.
echo Step 2: Creating Node.js script to update package.json...
echo const fs = require('fs'); > update-package.js
echo const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')); >> update-package.js
echo console.log('Current password:', packageJson.build.win.certificatePassword); >> update-package.js
echo packageJson.build.win.certificatePassword = 'scenes'; >> update-package.js
echo fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 4)); >> update-package.js
echo console.log('Updated package.json with password: scenes'); >> update-package.js

echo.
echo Step 3: Running the update script...
node update-package.js

echo.
echo Step 4: Verify package.json was updated...
findstr /C:"certificatePassword" package.json

echo.
echo Step 5: Running npm run dist (same as GitHub Actions)...
npm run dist

echo.
echo Step 6: Clean up - reset package.json to empty password...
echo const fs = require('fs'); > reset-package.js
echo const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')); >> reset-package.js
echo packageJson.build.win.certificatePassword = ''; >> reset-package.js
echo fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 4)); >> reset-package.js
echo console.log('Reset package.json password to empty'); >> reset-package.js

node reset-package.js

echo.
echo Step 7: Cleanup temporary files...
del update-package.js
del reset-package.js

echo.
echo === Test Complete ===
echo If this worked, then GitHub Actions should work too!
pause