#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read package.json for current info
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Get current date
const currentDate = new Date().toISOString().split('T')[0];

// Get git commit info
let latestCommit = '';
let totalCommits = '';
let versionHistory = '';
try {
  latestCommit = execSync('git log -1 --format="%h - %s (%cr)"', { encoding: 'utf8' }).trim();
  totalCommits = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
  
  // Get recent version tags with their commit messages
  const tagInfo = execSync('git for-each-ref --sort=-version:refname --format="%(refname:short)|%(objectname:short)|%(subject)" refs/tags', { encoding: 'utf8' }).trim();
  const tags = tagInfo.split('\n').slice(0, 5); // Get last 5 releases
  
  versionHistory = tags.map(tag => {
    const [version, hash, subject] = tag.split('|');
    return `- **${version}**: ${subject}`;
  }).join('\n');
  
} catch (error) {
  console.log('Git info not available');
}

// Get test count
let testCount = 'N/A';
let totalTests = 'N/A';
try {
  // Run tests and capture output
  const testOutput = execSync('npm test 2>&1', { encoding: 'utf8', timeout: 60000 });
  
  // Look for the test summary line: "Tests:       401 passed, 401 total"
  const testSummaryMatch = testOutput.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
  if (testSummaryMatch) {
    testCount = testSummaryMatch[1];
    totalTests = testSummaryMatch[2];
  } else {
    // Fallback: look for individual patterns
    const passMatch = testOutput.match(/(\d+)\s+passed/);
    const totalMatch = testOutput.match(/(\d+)\s+total/);
    if (passMatch && totalMatch) {
      testCount = passMatch[1];
      totalTests = totalMatch[1];
    }
  }
} catch (error) {
  // If tests fail completely, still try to extract total count
  try {
    const errorOutput = error.stdout || error.message || '';
    const totalMatch = errorOutput.match(/(\d+)\s+total/);
    if (totalMatch) {
      totalTests = totalMatch[1];
      testCount = '0'; // Assume 0 passed if there was an error
    }
  } catch (e) {
    console.log('Could not determine test status');
  }
}

// Function to update placeholders in existing README
function updateReadmePlaceholders(content) {
  return content
    .replace(/<!--VERSION-->.+?<!--\/VERSION-->/gs, `<!--VERSION-->${packageJson.version}<!--/VERSION-->`)
    .replace(/<!--DATE-->.+?<!--\/DATE-->/gs, `<!--DATE-->${currentDate}<!--/DATE-->`)
    .replace(/<!--COMMIT-->.+?<!--\/COMMIT-->/gs, `<!--COMMIT-->${latestCommit}<!--/COMMIT-->`)
    .replace(/<!--COMMITS-->.+?<!--\/COMMITS-->/gs, `<!--COMMITS-->${totalCommits}<!--/COMMITS-->`)
    .replace(/<!--TESTS-->.+?<!--\/TESTS-->/gs, `<!--TESTS-->${testCount}/${totalTests}<!--/TESTS-->`)
    .replace(/<!--VERSION_HISTORY-->[\s\S]*?<!--\/VERSION_HISTORY-->/gs, `<!--VERSION_HISTORY-->\n${versionHistory}\n<!--/VERSION_HISTORY-->`);
}

// Check if README exists and has placeholders
const readmePath = 'README.md';
if (fs.existsSync(readmePath)) {
  const existingReadme = fs.readFileSync(readmePath, 'utf8');
  
  // If the README has our placeholders, update them
  if (existingReadme.includes('<!--VERSION-->')) {
    const updatedReadme = updateReadmePlaceholders(existingReadme);
    fs.writeFileSync(readmePath, updatedReadme);
    console.log('README.md updated with current build info!');
  } else {
    console.log('README.md exists but has no placeholders. Use <!--VERSION-->...<!--/VERSION--> format to enable auto-updates.');
    console.log('Available placeholders:');
    console.log('- <!--VERSION-->...<!--/VERSION--> for version');
    console.log('- <!--DATE-->...<!--/DATE--> for last updated date');
    console.log('- <!--COMMIT-->...<!--/COMMIT--> for latest commit');
    console.log('- <!--COMMITS-->...<!--/COMMITS--> for total commits');
    console.log('- <!--TESTS-->...<!--/TESTS--> for test results');
    console.log('- <!--VERSION_HISTORY-->...<!--/VERSION_HISTORY--> for recent release history');
  }
} else {
  console.log('No README.md found. Please create one with placeholders for auto-updates.');
}

console.log(`Current build info:`);
console.log(`- Version: ${packageJson.version}`);
console.log(`- Tests: ${testCount}/${totalTests}`);
console.log(`- Last commit: ${latestCommit}`);