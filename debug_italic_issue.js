const rtfParse = require('rtf-parse');
const fs = require('fs');

// Copy the exact conversion function from electron.js with debug logs
function convertRtfDocumentToMarkdown(doc) {
  console.log('Converting RTF document to markdown...');

  let paragraphs = [];
  let currentParagraph = '';
  let formatState = { italic: false, bold: false };
  let pendingItalicText = '';
  let pendingBoldText = '';

  function flushFormattedText() {
    if (pendingItalicText.trim()) {
      // Preserve spacing around italic text
      const beforeSpace = pendingItalicText.match(/^\s+/) ? ' ' : '';
      const afterSpace = pendingItalicText.match(/\s+$/) ? ' ' : '';
      const result = `${beforeSpace}*${pendingItalicText.trim()}*${afterSpace}`;
      console.log(`FLUSHING ITALIC: "${pendingItalicText}" -> "${result}"`);
      currentParagraph += result;
      pendingItalicText = '';
    }
    if (pendingBoldText.trim()) {
      const beforeSpace = pendingBoldText.match(/^\s+/) ? ' ' : '';
      const afterSpace = pendingBoldText.match(/\s+$/) ? ' ' : '';
      currentParagraph += `${beforeSpace}**${pendingBoldText.trim()}**${afterSpace}`;
      pendingBoldText = '';
    }
  }

  function addText(text) {
    // Convert smart quotes and special characters first
    text = text.replace(/\\'92/g, "'"); // Right single quote/apostrophe
    text = text.replace(/\\'93/g, '"'); // Left double quote
    text = text.replace(/\\'94/g, '"'); // Right double quote
    text = text.replace(/\\'85/g, '...'); // Ellipsis
    text = text.replace(/\\'a0/g, ' '); // Non-breaking space

    // Skip font names and RTF junk
    if (text.includes('PalatinoLinotype') || text.includes('Cochin') || text.match(/^[A-Za-z-]+;$/) ||
        text.match(/^[;*\\]+$/) || text.trim() === '') {
      return;
    }

    // Remove trailing backslashes
    text = text.replace(/\\+$/, '');

    if (formatState.italic) {
      console.log(`ADDING TO ITALIC: "${text}"`);
      pendingItalicText += text;
    } else if (formatState.bold) {
      pendingBoldText += text;
    } else {
      // Regular text - flush any pending formatted text first
      flushFormattedText();
      currentParagraph += text;
    }
  }

  function walkTree(node) {
    if (node.constructor.name === 'Command') {
      // Handle formatting commands
      if (node.name === 'i1' || node.name === 'i') {
        // Starting italic - flush any pending text first
        flushFormattedText();
        formatState.italic = true;
        console.log('*** STARTING ITALIC FORMATTING ***');
      } else if (node.name === 'i0') {
        // Ending italic - flush the italic text
        console.log('*** ENDING ITALIC FORMATTING, pending text:', JSON.stringify(pendingItalicText));
        flushFormattedText();
        formatState.italic = false;
      } else if (node.name === 'b1' || node.name === 'b') {
        flushFormattedText();
        formatState.bold = true;
      } else if (node.name === 'b0') {
        flushFormattedText();
        formatState.bold = false;
      } else if (node.name === 'par' || node.name === 'pard') {
        // Paragraph break - flush everything and start new paragraph
        flushFormattedText();
        const cleanParagraph = currentParagraph.trim().replace(/^[;*\\]+/, '').trim();
        if (cleanParagraph) {
          paragraphs.push(cleanParagraph);
          currentParagraph = '';
        } else {
          currentParagraph = '';
        }
      }
    } else if (node.constructor.name === 'Text' && node.value) {
      // Handle text nodes
      if (node.value.trim()) {
        // Check if text contains paragraph breaks (double newlines)
        if (node.value.includes('\n\n')) {
          const parts = node.value.split('\n\n');
          for (let i = 0; i < parts.length; i++) {
            if (parts[i].trim()) {
              addText(parts[i]);
            }
            // Add paragraph break after each part except the last
            if (i < parts.length - 1) {
              flushFormattedText();
              const cleanParagraph = currentParagraph.trim().replace(/^[;*\\]+/, '').trim();
              if (cleanParagraph) {
                paragraphs.push(cleanParagraph);
              }
              currentParagraph = '';
            }
          }
        } else {
          addText(node.value);
        }
      } else if (node.value.includes('\n')) {
        // Newline-only text nodes can indicate paragraph breaks
        flushFormattedText();
        const cleanParagraph = currentParagraph.trim().replace(/^[;*\\]+/, '').trim();
        if (cleanParagraph) {
          paragraphs.push(cleanParagraph);
        }
        currentParagraph = '';
      }
    } else if (node.children) {
      // Recursively walk child nodes
      for (const child of node.children) {
        walkTree(child);
      }
    }
  }

  // Walk the entire document tree
  walkTree(doc);

  // Flush any remaining text and add final paragraph
  flushFormattedText();
  const finalParagraph = currentParagraph.trim().replace(/^[;*\\]+/, '').trim();
  if (finalParagraph) {
    paragraphs.push(finalParagraph);
  }

  // Join paragraphs with double newlines
  let result = paragraphs.join('\n\n');

  // Clean up spacing but preserve paragraph breaks
  result = result.replace(/\*\s+\*/g, ''); // Remove empty italic spans
  result = result.replace(/\*\*\s+\*\*/g, ''); // Remove empty bold spans
  result = result.replace(/[^\S\n]+/g, ' '); // Multiple spaces to single space, but preserve newlines

  console.log(`Converted to ${paragraphs.length} paragraphs, ${result.length} characters`);
  return result.trim();
}

// Test with the problematic scene
const rtfContent = fs.readFileSync('/home/ajs/absolute-scenes/rtftestcontent.rtf', 'utf8');
console.log('RTF content includes target text:', rtfContent.includes('You might as well'));

rtfParse.parseString(rtfContent).then(doc => {
  const result = convertRtfDocumentToMarkdown(doc);

  console.log('\n=== FINAL RESULT ===');
  console.log('Result length:', result.length);
  console.log('Looking for problematic text...');

  // Check raw result
  console.log('\n=== RAW RESULT (first 500 chars) ===');
  console.log(JSON.stringify(result.substring(0, 500)));

  const lines = result.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('You might as well')) {
      console.log(`\nFound problematic line ${i + 1}:`);
      console.log(`Raw line: ${JSON.stringify(lines[i])}`);
      console.log(`Starts with *: ${lines[i].startsWith('*')}`);
      console.log(`Ends with *: ${lines[i].includes('*')}`);

      // Check character by character
      console.log('First 5 characters:');
      for (let j = 0; j < Math.min(5, lines[i].length); j++) {
        console.log(`  ${j}: "${lines[i][j]}" (code: ${lines[i].charCodeAt(j)})`);
      }
      break;
    }
  }
}).catch(err => {
  console.error('Error:', err);
});