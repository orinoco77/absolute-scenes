const rtfParse = require('rtf-parse');
const fs = require('fs');

// Copy the exact conversion function from electron.js
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
    if (text.includes('PalatinoLinotype') || text.includes('Cochin') || text.match(/^[A-Za-z-]+;$/)) {
      return;
    }

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
    console.log(`Processing ${node.constructor.name}: ${node.constructor.name === 'Command' ? node.name : 'text'}`);

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
        console.log('*** PARAGRAPH BREAK DETECTED ***');
        flushFormattedText();
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim());
          console.log(`Added paragraph ${paragraphs.length}: "${currentParagraph.trim().substring(0, 50)}..."`);
          currentParagraph = '';
        }
      }
    } else if (node.constructor.name === 'Text' && node.value) {
      // Handle text nodes
      if (node.value.trim()) {
        console.log(`Processing text: "${node.value.substring(0, 30)}..."`);
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
              if (currentParagraph.trim()) {
                paragraphs.push(currentParagraph.trim());
                currentParagraph = '';
              }
            }
          }
        } else {
          addText(node.value);
        }
      } else if (node.value.includes('\n')) {
        // Newline-only text nodes can indicate paragraph breaks
        console.log('Newline-only text node detected');
        flushFormattedText();
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = '';
        }
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
  if (currentParagraph.trim()) {
    paragraphs.push(currentParagraph.trim());
  }

  // Join paragraphs with double newlines
  let result = paragraphs.join('\n\n');

  console.log(`\nFinal result: ${paragraphs.length} paragraphs, ${result.length} total characters`);
  return result;
}

// Test with Scrivener file
const rtfContent = fs.readFileSync('rtftestcontent.rtf', 'utf8');

rtfParse.parseString(rtfContent).then(doc => {
  const result = convertRtfDocumentToMarkdown(doc);
  console.log('\n=== FINAL OUTPUT ===');
  console.log(result.substring(0, 500) + '...');
}).catch(err => {
  console.error('Error:', err);
});