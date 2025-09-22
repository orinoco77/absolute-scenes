const fs = require('fs');
const path = require('path');

// Function to recursively search for RTF files containing "my" and "Beth"
function findMyBethContent(dir) {
  const results = [];

  function searchDirectory(currentDir) {
    try {
      const files = fs.readdirSync(currentDir);

      for (const file of files) {
        const fullPath = path.join(currentDir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          searchDirectory(fullPath);
        } else if (file.endsWith('.rtf') || file.endsWith('.txt')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');

            // Check if it contains both "my" and "Beth" (case insensitive)
            if (content.toLowerCase().includes('my') && content.toLowerCase().includes('beth')) {
              const myBethMatches = content.match(/my.{0,20}beth/gi) || [];

              if (myBethMatches.length > 0) {
                results.push({
                  file: fullPath,
                  matches: myBethMatches,
                  rawContent: content
                });
              }
            }
          } catch (error) {
            console.log(`Could not read file: ${fullPath} - ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log(`Could not read directory: ${currentDir} - ${error.message}`);
    }
  }

  searchDirectory(dir);
  return results;
}

// Analyze the character sequences found
function analyzeMatches(results) {
  console.log('=== ANALYSIS OF "my...Beth" CONTENT ===\n');

  results.forEach((result, index) => {
    console.log(`File ${index + 1}: ${result.file}`);
    console.log('Matches found:');

    result.matches.forEach((match, matchIndex) => {
      console.log(`  Match ${matchIndex + 1}: ${JSON.stringify(match)}`);

      // Analyze each character in the match
      console.log('  Character breakdown:');
      for (let i = 0; i < match.length; i++) {
        const char = match[i];
        const code = char.charCodeAt(0);
        console.log(`    [${i}] "${char}" (decimal: ${code}, hex: ${code.toString(16).toUpperCase()})`);
      }
      console.log();
    });

    // Look for RTF escape sequences around the matches
    result.matches.forEach((match, matchIndex) => {
      const matchIndex = result.rawContent.indexOf(match);
      if (matchIndex !== -1) {
        const before = result.rawContent.substring(Math.max(0, matchIndex - 20), matchIndex);
        const after = result.rawContent.substring(matchIndex + match.length, Math.min(result.rawContent.length, matchIndex + match.length + 20));

        console.log(`  Context for match ${matchIndex + 1}:`);
        console.log(`    Before: ${JSON.stringify(before)}`);
        console.log(`    Match:  ${JSON.stringify(match)}`);
        console.log(`    After:  ${JSON.stringify(after)}`);
        console.log();
      }
    });

    console.log('-'.repeat(80));
    console.log();
  });
}

// Usage
console.log('Searching for RTF files containing "my" and "Beth"...\n');

// You can specify the directory where your Scrivener project is located
// For now, let's search the current directory
const searchDir = process.argv[2] || '.';

console.log(`Searching in: ${path.resolve(searchDir)}\n`);

const results = findMyBethContent(searchDir);

if (results.length === 0) {
  console.log('❌ No files found containing both "my" and "Beth"');
  console.log('\nUsage: node find_my_beth_content.js [directory_path]');
  console.log('Example: node find_my_beth_content.js /path/to/your/scrivener/project');
} else {
  console.log(`✅ Found ${results.length} file(s) containing "my" and "Beth"\n`);
  analyzeMatches(results);
}