const fs = require('fs');
const path = require('path');

// Import the RTF conversion functions directly
const rtfParse = require('rtf-parse');

// Copy the utility functions from electron.js
function convertRtfCharacterEscapes(text) {
  // Convert Windows-1252 RTF escape sequences
  text = text.replace(/\\'91/g, "'"); // Left single quote
  text = text.replace(/\\'92/g, "'"); // Right single quote/apostrophe
  text = text.replace(/\\'93/g, '"'); // Left double quote
  text = text.replace(/\\'94/g, '"'); // Right double quote
  text = text.replace(/\\'96/g, '–'); // En-dash
  text = text.replace(/\\'97/g, '—'); // Em-dash
  text = text.replace(/\\'85/g, '...'); // Ellipsis
  text = text.replace(/\\'a0/g, ' '); // Non-breaking space
  return text;
}

function convertRtfUnicodeEscapes(text) {
  // Clean up Unicode escapes combined with RTF escapes
  text = text.replace(/\\u8220\\'93/g, '"'); // Left double quote
  text = text.replace(/\\u8221\\'94/g, '"'); // Right double quote
  text = text.replace(/\\u8216\\'91/g, "'"); // Left single quote
  text = text.replace(/\\u8217\\'92/g, "'"); // Right single quote/apostrophe
  text = text.replace(/\\u8211\\'96/g, '–'); // En-dash
  text = text.replace(/\\u8212\\'97/g, '—'); // Em-dash
  text = text.replace(/\\u8230\\'85/g, '...'); // Ellipsis
  return text;
}

// Simplified version of the regex converter to test step by step
function testRegexConverter(rtfContent) {
  console.log('=== TESTING REGEX CONVERTER STEP BY STEP ===');

  let text = rtfContent;
  console.log('1. ORIGINAL:', JSON.stringify(text.substring(0, 100)));

  // Check for our target pattern
  const myBethMatch = text.match(/my.{0,15}Beth/i);
  if (myBethMatch) {
    console.log('   Contains my...Beth:', JSON.stringify(myBethMatch[0]));
  }

  // Step 1: Remove RTF headers
  text = text.replace(/\{\\rtf[^{]*?\{\\fonttbl[^}]*\}[^{]*?\{\\colortbl[^}]*\}[^{]*?/g, '');
  console.log('2. After header removal:', JSON.stringify(text.substring(0, 100)));

  const step2Match = text.match(/my.{0,15}Beth/i);
  if (step2Match) {
    console.log('   my...Beth after step 2:', JSON.stringify(step2Match[0]));
  }

  // Step 2: Remove additional RTF control blocks
  text = text.replace(/\{\\\*\\expandedcolortbl[^}]*\}/g, '');
  text = text.replace(/\\paperw[^\\]*?\\f\d+\\fs\d+\\cf\d+/g, '');
  text = text.replace(/\\deftab\d+/g, '');
  console.log('3. After control block removal:', JSON.stringify(text.substring(0, 100)));

  const step3Match = text.match(/my.{0,15}Beth/i);
  if (step3Match) {
    console.log('   my...Beth after step 3:', JSON.stringify(step3Match[0]));
  }

  // Step 3: Convert paragraph breaks
  text = text.replace(/\\par\\plain\s*/g, '\n\n');
  console.log('4. After paragraph conversion:', JSON.stringify(text.substring(0, 100)));

  // Step 4: Remove line break artifacts
  text = text.replace(/\\\s*\n/g, '\n');
  text = text.replace(/\\$/gm, '');

  // Step 5: Handle formatting (simplified)
  text = text.replace(/\{[^{}]*?\\i1\s+([^{}]*?)\}/g, '*$1*');
  text = text.replace(/\{[^{}]*?\\b1\s+([^{}]*?)\}/g, '**$1**');
  text = text.replace(/\{[^{}]*?\\[bi]0[^{}]*?\s*([^{}]*?)\}/g, '$1');

  // Step 6: Character conversion (THIS IS THE KEY STEP)
  console.log('5. BEFORE character conversion:', JSON.stringify(text.substring(0, 100)));
  const beforeCharMatch = text.match(/my.{0,15}Beth/i);
  if (beforeCharMatch) {
    console.log('   my...Beth BEFORE character conversion:', JSON.stringify(beforeCharMatch[0]));
  }

  text = convertRtfUnicodeEscapes(text);
  text = convertRtfCharacterEscapes(text);

  console.log('6. AFTER character conversion:', JSON.stringify(text.substring(0, 100)));
  const afterCharMatch = text.match(/my.{0,15}Beth/i);
  if (afterCharMatch) {
    console.log('   my...Beth AFTER character conversion:', JSON.stringify(afterCharMatch[0]));
  }

  // Step 7: Remove remaining RTF control sequences
  text = text.replace(/\\pard\\plain[^\\]*?\\ltrch\\loch\s*/g, '');
  text = text.replace(/\\loch\\af\d+\\hich\\af\d+\\dbch\\af\d+\\uc\d+/g, '');
  text = text.replace(/\\f\d+\\fs\d+\\b\d+\\i\d+/g, '');
  text = text.replace(/\\[a-z]+\d*/g, '');
  text = text.replace(/\\'[0-9a-f]{2}/g, ''); // This line removes escape sequences!
  text = text.replace(/\{|\}/g, '');

  console.log('7. AFTER removing escape sequences:', JSON.stringify(text.substring(0, 100)));
  const finalMatch = text.match(/my.{0,15}Beth/i);
  if (finalMatch) {
    console.log('   my...Beth FINAL:', JSON.stringify(finalMatch[0]));
  }

  // Final cleanup
  text = text.replace(/\\$/gm, '');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n[ \t]+/g, '\n');
  text = text.replace(/[ \t]+\n/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/\\+$/gm, '');

  return text.trim();
}

// Test with known RTF content
console.log('Testing with our known example...\n');

const testRtf = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
{\\f0\\fs24 We can\\'92t get to Lantis, my\\'97Beth said.}}`;

const result = testRegexConverter(testRtf);
console.log('\n=== FINAL RESULT ===');
console.log('Result:', JSON.stringify(result));
console.log('Readable:', result);

// Check if the em-dash is there
if (result.includes('my—Beth')) {
  console.log('✅ SUCCESS: Em-dash conversion worked!');
} else if (result.includes('myBeth')) {
  console.log('❌ FAILURE: Em-dash was completely lost');
} else {
  console.log('❌ FAILURE: Pattern changed unexpectedly');
}