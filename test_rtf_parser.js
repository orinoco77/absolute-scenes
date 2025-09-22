const rtfParse = require('rtf-parse');

// Simple test RTF with known structure
const simpleRtf = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24 This is paragraph one.
\\par
This is paragraph two.
\\par
This is paragraph three.}`;

console.log('=== SIMPLE RTF TEST ===');
console.log('Input RTF:', simpleRtf);

rtfParse.parseString(simpleRtf).then(doc => {
  console.log('\n=== DOCUMENT STRUCTURE ===');
  console.log('Document constructor:', doc.constructor.name);
  console.log('Document keys:', Object.keys(doc));
  if (doc.children) {
    console.log('Top-level children count:', doc.children.length);
  }

  console.log('\n=== WALKING THE TREE ===');
  function walkAndLog(node, depth = 0) {
    const indent = '  '.repeat(depth);
    console.log(`${indent}${node.constructor.name}:`);

    if (node.constructor.name === 'Command') {
      console.log(`${indent}  name: "${node.name}"`);
      if (node.value !== undefined) {
        console.log(`${indent}  value: "${node.value}"`);
      }
    } else if (node.constructor.name === 'Text') {
      console.log(`${indent}  value: "${node.value}"`);
    }

    if (node.children && node.children.length > 0) {
      console.log(`${indent}  children: ${node.children.length}`);
      node.children.forEach(child => walkAndLog(child, depth + 1));
    }
  }

  walkAndLog(doc);

}).catch(err => {
  console.error('Error:', err);
});