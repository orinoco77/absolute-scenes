// Test the exact cleanup that's happening
const testText = `*You might as well. I promise you, there is nothing inside that will harm you.* The voice of the crown said.

*Why won't it open?* he asked.`;

console.log('ORIGINAL TEXT:');
console.log(JSON.stringify(testText));

// Apply the exact cleanup steps from electron.js
let result = testText;

console.log('\n=== STEP 1: Remove empty italic spans ===');
result = result.replace(/\*[ \t]+\*/g, ''); // Remove empty italic spans (spaces/tabs only, not newlines)
console.log('After step 1:', JSON.stringify(result));

console.log('\n=== STEP 2: Remove empty bold spans ===');
result = result.replace(/\*\*[ \t]+\*\*/g, ''); // Remove empty bold spans (spaces/tabs only, not newlines)
console.log('After step 2:', JSON.stringify(result));

console.log('\n=== STEP 3: Collapse spaces ===');
result = result.replace(/[^\S\n]+/g, ' '); // Multiple spaces to single space, but preserve newlines
console.log('After step 3:', JSON.stringify(result));

console.log('\n=== STEP 4: Trim ===');
result = result.trim();
console.log('Final result:', JSON.stringify(result));

console.log('\n=== VISUAL CHECK ===');
console.log(result);