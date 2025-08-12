@echo off
echo === Testing with package.json password ===

echo The package.json now has certificatePassword: "scenes"
echo Testing npm run dist (the original working command)...

npm run dist

pause