const fs = require('fs');

// Debug function to analyze RTF content and find unknown escape sequences
function analyzeRtfContent(rtfContent) {
  console.log('=== RTF CONTENT ANALYSIS ===');
  console.log('Content length:', rtfContent.length);
  console.log('First 200 characters:', rtfContent.substring(0, 200));
  console.log();

  // Find all RTF escape sequences
  const escapeSequences = rtfContent.match(/\\'[0-9a-f]{2}/gi) || [];
  const uniqueEscapes = [...new Set(escapeSequences)];

  console.log('=== RTF ESCAPE SEQUENCES FOUND ===');
  uniqueEscapes.forEach(seq => {
    const hex = seq.substring(2);
    const decimal = parseInt(hex, 16);
    const count = (rtfContent.match(new RegExp(seq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    console.log(`${seq} (hex: ${hex}, decimal: ${decimal}) - appears ${count} times`);

    // Show what Windows-1252 character this would be
    if (decimal >= 128 && decimal <= 255) {
      try {
        // Windows-1252 character mapping
        const win1252Map = {
          128: '€', 129: '?', 130: '‚', 131: 'ƒ', 132: '„', 133: '…', 134: '†', 135: '‡',
          136: 'ˆ', 137: '‰', 138: 'Š', 139: '‹', 140: 'Œ', 141: '?', 142: 'Ž', 143: '?',
          144: '?', 145: "'", 146: "'", 147: '"', 148: '"', 149: '•', 150: '–', 151: '—',
          152: '˜', 153: '™', 154: 'š', 155: '›', 156: 'œ', 157: '?', 158: 'ž', 159: 'Ÿ'
        };
        const char = win1252Map[decimal] || String.fromCharCode(decimal);
        console.log(`  → Windows-1252 character: "${char}"`);
      } catch (e) {
        console.log(`  → Could not convert to character`);
      }
    }
  });

  console.log();

  // Find all Unicode escape sequences
  const unicodeEscapes = rtfContent.match(/\\\\u\\d+/g) || [];
  const uniqueUnicode = [...new Set(unicodeEscapes)];

  if (uniqueUnicode.length > 0) {
    console.log('=== UNICODE ESCAPE SEQUENCES FOUND ===');
    uniqueUnicode.forEach(seq => {
      const num = seq.match(/\\d+/)[0];
      const decimal = parseInt(num, 10);
      const count = (rtfContent.match(new RegExp(seq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      console.log(`${seq} (decimal: ${decimal}) - appears ${count} times`);
      try {
        const char = String.fromCharCode(decimal);
        console.log(`  → Unicode character: "${char}"`);
      } catch (e) {
        console.log(`  → Could not convert to character`);
      }
    });
    console.log();
  }

  // Look for text around "my" and "Beth"
  const myBethMatches = rtfContent.match(/my.{0,10}Beth/gi) || [];
  if (myBethMatches.length > 0) {
    console.log('=== FOUND "my...Beth" PATTERNS ===');
    myBethMatches.forEach((match, i) => {
      console.log(`Match ${i + 1}: "${match}"`);
      // Show the raw bytes
      for (let j = 0; j < match.length; j++) {
        const char = match[j];
        const code = char.charCodeAt(0);
        console.log(`  [${j}] "${char}" (code: ${code}, hex: ${code.toString(16)})`);
      }
    });
  }

  return {
    escapeSequences: uniqueEscapes,
    unicodeEscapes: uniqueUnicode,
    myBethMatches
  };
}

// Example usage - you can replace this with your actual RTF content
const exampleRtf = `\'93We can\'92t get to Lantis, my\'97Beth,\'94 said Garret, \'93It\'92s been lost for hundreds, thousands of years. That\'92s if it ever existed at all!\'94\
\'93I know a few people who might just be able to manage it, and with Tyr here, we should have a better than even chance.\'94`;

console.log('Testing with example RTF:');
analyzeRtfContent(exampleRtf);

console.log('\\n\\n=== TO USE WITH YOUR RTF FILE ===');
console.log('1. Copy the raw RTF content from your Scrivener project');
console.log('2. Replace the exampleRtf variable above with your content');
console.log('3. Run: node debug_rtf_characters.js');

module.exports = { analyzeRtfContent };
