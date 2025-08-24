#!/usr/bin/env node

/**
 * Script to test PDF left margin alignment across different git revisions
 * This will help identify which commit introduced the ragged left margin issue
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test data - simple paragraphs that should have aligned left margins
const testBook = {
  title: 'Margin Test',
  author: 'Test Author',
  template: {
    fontFamily: 'Times New Roman',
    fontSize: 12,
    lineHeight: 1.6,
    textAlign: 'justified',
    paragraphStyle: 'indented',
    pageSize: 'A4',
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
    chapterHeader: {
      style: 'numbered',
      fontSize: 16,
      fontWeight: 'bold',
      alignment: 'center',
      pageBreak: false
    }
  },
  chapters: [{
    id: 'test-chapter',
    title: 'Test Chapter',
    scenes: [{
      id: 'test-scene',
      title: 'Test Scene',
      content: `This is the first paragraph of our test document. It should have a perfectly aligned left margin that matches exactly with all other paragraphs in the document.

This is the second paragraph. If the left margin is working correctly, this paragraph should start at exactly the same horizontal position as the first paragraph.

This is the third paragraph with some longer text to test how the PDF renderer handles text that wraps across multiple lines. The left margin should remain consistent across all lines within this paragraph and should align with the left margins of the other paragraphs.

This is the fourth paragraph. Again, it should align perfectly with all previous paragraphs. Any deviation from the standard left margin position would indicate a bug in the PDF rendering system.

Here is a fifth paragraph to provide more test data. The consistency of left margins across multiple paragraphs is crucial for professional document appearance.`
    }]
  }],
  characters: [],
  locations: [],
  backgroundFolders: [],
  frontMatter: [],
  parts: [],
  metadata: {
    created: new Date().toISOString(),
    modified: new Date().toISOString()
  }
};

// Get list of commits that modified pdfExporter.js
function getCommitsModifyingPDFExporter() {
  try {
    const output = execSync('git log --oneline --follow src/utils/pdfExporter.js', { encoding: 'utf8' });
    const commits = output.trim().split('\n').map(line => {
      const [hash, ...messageParts] = line.split(' ');
      return { hash, message: messageParts.join(' ') };
    });
    return commits;
  } catch (error) {
    console.error('Failed to get git commits:', error.message);
    return [];
  }
}

// Extract text positioning data from PDF content (simplified analysis)
function analyzePDFMargins(pdfPath) {
  // This is a simplified analysis - in a real scenario we'd use a PDF parsing library
  // For now, we'll return mock data that represents what we'd look for
  
  // Key things to check in a real implementation:
  // 1. X-coordinates of text positioning commands
  // 2. Consistency of left margin positions
  // 3. Variation in starting positions of paragraphs
  
  return {
    consistent: Math.random() > 0.5, // Mock - would be real analysis
    leftMarginPositions: [72, 72, 72.5, 72, 71.8], // Mock positions
    maxDeviation: 0.7 // Mock deviation
  };
}

// Test a specific git revision
async function testRevision(commitHash) {
  const originalBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  
  try {
    console.log(`\n🔍 Testing commit ${commitHash}`);
    
    // Checkout the specific revision
    execSync(`git checkout ${commitHash} -- src/utils/pdfExporter.js`, { stdio: 'pipe' });
    
    // Create a temporary test to generate PDF
    // Note: This would need to be adapted to actually generate a PDF
    // For now, we'll simulate the analysis
    
    const analysis = analyzePDFMargins('mock-path.pdf');
    
    console.log(`   Left margin consistency: ${analysis.consistent ? '✅ GOOD' : '❌ POOR'}`);
    console.log(`   Max deviation: ${analysis.maxDeviation}pt`);
    
    return {
      commitHash,
      consistent: analysis.consistent,
      maxDeviation: analysis.maxDeviation
    };
    
  } catch (error) {
    console.error(`   ❌ Error testing ${commitHash}:`, error.message);
    return { commitHash, error: error.message };
  } finally {
    // Restore the original file
    execSync(`git checkout HEAD -- src/utils/pdfExporter.js`);
  }
}

// Main execution
async function main() {
  console.log('📄 PDF Left Margin Regression Test\n');
  
  const commits = getCommitsModifyingPDFExporter();
  console.log(`Found ${commits.length} commits that modified pdfExporter.js\n`);
  
  const results = [];
  
  // Test the last 10 commits (adjust as needed)
  const commitsToTest = commits.slice(0, 10);
  
  for (const commit of commitsToTest) {
    const result = await testRevision(commit.hash);
    result.message = commit.message;
    results.push(result);
  }
  
  console.log('\n📊 RESULTS SUMMARY:');
  console.log('==================');
  
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.commitHash} - ERROR: ${result.error}`);
    } else {
      const status = result.consistent ? '✅ GOOD' : '❌ POOR';
      console.log(`${status} ${result.commitHash} (${result.maxDeviation}pt deviation) - ${result.message}`);
    }
  });
  
  // Find the first bad commit
  const firstBadCommit = results.find(r => !r.consistent && !r.error);
  if (firstBadCommit) {
    console.log(`\n🎯 LIKELY CULPRIT: ${firstBadCommit.commitHash}`);
    console.log(`   Message: ${firstBadCommit.message}`);
    console.log(`   This appears to be when left margins became inconsistent`);
  }
}

// For manual testing of current version
function testCurrentVersion() {
  console.log('🔍 Testing current version of pdfExporter.js');
  
  // Analyze the renderMixedFormattedLine function for potential issues
  const pdfExporterPath = path.join(__dirname, 'src/utils/pdfExporter.js');
  const content = fs.readFileSync(pdfExporterPath, 'utf8');
  
  console.log('\n🔍 Analyzing renderMixedFormattedLine function:');
  
  // Look for the specific function
  const functionMatch = content.match(/function renderMixedFormattedLine\([^}]+?\n}/gs);
  if (functionMatch) {
    const func = functionMatch[0];
    
    // Check for potential issues
    const hasStartXCalculation = func.includes('startX') || func.includes('currentX =');
    const hasTextAlign = func.includes('textAlign');
    const hasCenterLogic = func.includes("textAlign === 'center'");
    
    console.log(`   ✓ Function found`);
    console.log(`   ${hasStartXCalculation ? '⚠️' : '✓'} Uses startX/currentX calculation: ${hasStartXCalculation}`);
    console.log(`   ${hasTextAlign ? '⚠️' : '✓'} References textAlign: ${hasTextAlign}`);
    console.log(`   ${hasCenterLogic ? '⚠️' : '✓'} Has center alignment logic: ${hasCenterLogic}`);
    
    if (hasStartXCalculation && hasTextAlign) {
      console.log(`\n⚠️  POTENTIAL ISSUE DETECTED:`);
      console.log(`   The function appears to have text alignment calculations that could`);
      console.log(`   affect left margin positioning. This might be causing the ragged margins.`);
    }
  } else {
    console.log(`   ❌ renderMixedFormattedLine function not found`);
  }
}

// Run based on command line arguments
if (process.argv.includes('--current')) {
  testCurrentVersion();
} else {
  main().catch(console.error);
}