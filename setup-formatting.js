#!/usr/bin/env node

/**
 * Setup script for ESLint + Prettier integration
 * This script helps verify that everything is configured correctly
 */

console.log('🔧 ESLint + Prettier Setup Verification\n');

// Check if required packages are installed
const fs = require('fs');
const path = require('path');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDevDeps = [
    'eslint',
    'eslint-config-prettier', 
    'eslint-plugin-prettier',
    'prettier'
  ];
  
  console.log('📦 Checking dependencies...');
  
  const missing = requiredDevDeps.filter(dep => 
    !packageJson.devDependencies || !packageJson.devDependencies[dep]
  );
  
  if (missing.length > 0) {
    console.log('❌ Missing dependencies:');
    missing.forEach(dep => console.log(`   - ${dep}`));
    console.log('\n📥 Run: npm install');
  } else {
    console.log('✅ All required dependencies installed');
  }
  
  // Check if config files exist
  console.log('\n📄 Checking configuration files...');
  
  const configFiles = [
    { file: '.eslintrc.js', name: 'ESLint config' },
    { file: '.prettierrc', name: 'Prettier config' },
    { file: '.prettierignore', name: 'Prettier ignore' }
  ];
  
  configFiles.forEach(({ file, name }) => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${name} exists`);
    } else {
      console.log(`❌ ${name} missing`);
    }
  });
  
  // Check if scripts are available
  console.log('\n🏃 Checking npm scripts...');
  
  const requiredScripts = ['lint', 'lint:fix', 'format', 'format:check'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ npm run ${script}`);
    } else {
      console.log(`❌ npm run ${script} missing`);
    }
  });
  
  console.log('\n🚀 Next steps:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Test linting: npm run lint');
  console.log('3. Test formatting: npm run format');
  console.log('4. Set up your IDE (see ESLINT.md)');
  
  console.log('\n💡 IDE Setup:');
  console.log('VS Code: Install ESLint + Prettier extensions');
  console.log('WebStorm: Enable ESLint + Prettier in settings');
  console.log('Other: See ESLINT.md for detailed setup');
  
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
}
