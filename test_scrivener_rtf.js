const rtfParse = require('rtf-parse');
const fs = require('fs');

// Test with an actual Scrivener file - just grab the first one we can find
const rtfContent = fs.readFileSync('rtftestcontent.rtf', 'utf8');

console.log('=== SCRIVENER RTF TEST ===');
console.log('RTF content length:', rtfContent.length);
console.log('First 200 chars:', rtfContent.substring(0, 200));

rtfParse.parseString(rtfContent).then(doc => {
  console.log('\n=== DOCUMENT STRUCTURE ===');
  console.log('Document constructor:', doc.constructor.name);
  console.log('Document keys:', Object.keys(doc));
  if (doc.children) {
    console.log('Top-level children count:', doc.children.length);
  }

  console.log('\n=== LOOKING FOR PARAGRAPH COMMANDS ===');
  let parCount = 0;
  let pardCount = 0;
  let textNodeCount = 0;
  let totalTextLength = 0;

  function analyzeTree(node, depth = 0) {
    if (node.constructor.name === 'Command') {
      if (node.name === 'par') {
        parCount++;
        if (parCount <= 5) console.log(`Found \\par command at depth ${depth}`);
      } else if (node.name === 'pard') {
        pardCount++;
        if (pardCount <= 5) console.log(`Found \\pard command at depth ${depth}`);
      }
    } else if (node.constructor.name === 'Text') {
      textNodeCount++;
      totalTextLength += node.value.length;
      // Show first few text nodes
      if (textNodeCount <= 3) {
        console.log(`Text node ${textNodeCount}: "${node.value.substring(0, 50)}..."`);
      }
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => analyzeTree(child, depth + 1));
    }
  }

  analyzeTree(doc);

  console.log('\n=== SUMMARY ===');
  console.log(`Total \\par commands: ${parCount}`);
  console.log(`Total \\pard commands: ${pardCount}`);
  console.log(`Total text nodes: ${textNodeCount}`);
  console.log(`Total text length: ${totalTextLength}`);

}).catch(err => {
  console.error('Error:', err);
});