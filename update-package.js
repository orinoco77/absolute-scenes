const fs = require('fs'); 
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')); 
console.log('Current password:', packageJson.build.win.certificatePassword); 
packageJson.build.win.certificatePassword = 'scenes'; 
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 4)); 
console.log('Updated package.json with password: scenes'); 
