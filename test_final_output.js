const rtfParse = require('rtf-parse');
const fs = require('fs');

// Copy the EXACT conversion function from electron.js with all recent fixes
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
      currentParagraph += `${beforeSpace}*${pendingItalicText.trim()}*${afterSpace}`;
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
      } else if (node.name === 'i0') {
        // Ending italic - flush the italic text
        if (pendingItalicText.trim()) {
          currentParagraph += `*${pendingItalicText.trim()}*`;
          pendingItalicText = '';
        }
        formatState.italic = false;
      } else if (node.name === 'b1' || node.name === 'b') {
        flushFormattedText();
        formatState.bold = true;
      } else if (node.name === 'b0') {
        if (pendingBoldText.trim()) {
          currentParagraph += `**${pendingBoldText.trim()}**`;
          pendingBoldText = '';
        }
        formatState.bold = false;
      } else if (node.name === 'par' || node.name === 'pard') {
        // Paragraph break - flush everything and start new paragraph
        flushFormattedText();
        const cleanParagraph = currentParagraph.trim().replace(/^[;*\\]+/, '').trim();
        if (cleanParagraph) {
          paragraphs.push(cleanParagraph);
          console.log(`Added paragraph ${paragraphs.length}: "${cleanParagraph.substring(0, 50)}..."`);
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
  console.log('First 300 chars with newlines visible:');
  console.log(JSON.stringify(result.substring(0, 300)));

  return result.trim();
}

// Test
const rtfContent = fs.readFileSync('rtftestcontent.rtf', 'utf8');
rtfParse.parseString(rtfContent).then(doc => {
  const result = convertRtfDocumentToMarkdown(doc);
  console.log('\n=== CHECKING FOR PARAGRAPH BREAKS ===');
  const paragraphCount = result.split('\n\n').length;
  console.log(`Result contains ${paragraphCount} paragraphs when split on \\n\\n`);
  console.log('Result includes double newlines:', result.includes('\n\n'));
}).catch(err => {
  console.error('Error:', err);
});