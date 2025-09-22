// New RTF converter using rtf-parser library
const rtfParser = require('rtf-parser');

function convertRtfToPlainTextWithParser(rtfContent) {
  return new Promise((resolve, reject) => {
    if (!rtfContent || rtfContent.trim() === '') {
      resolve('');
      return;
    }

    // If it's not RTF content, return as-is
    if (!rtfContent.includes('{\\rtf')) {
      resolve(rtfContent.trim());
      return;
    }

    rtfParser.string(rtfContent, (err, doc) => {
      if (err) {
        console.error('RTF parsing error:', err);
        reject(err);
        return;
      }

      try {
        let result = '';

        doc.content.forEach((paragraph) => {
          if (!paragraph.content) {
            return; // Skip paragraphs without content
          }

          // First, collect all spans and merge adjacent ones with same formatting
          let mergedSpans = [];
          let currentSpan = null;

          paragraph.content.forEach((span) => {
            // Normalize undefined to false for comparison
            const isItalic = span.style.italic === true;
            const isBold = span.style.bold === true;

            if (currentSpan &&
                currentSpan.italic === isItalic &&
                currentSpan.bold === isBold) {
              // Merge with previous span
              currentSpan.text += span.value;
            } else {
              // Start new span
              if (currentSpan) {
                mergedSpans.push(currentSpan);
              }
              currentSpan = {
                text: span.value,
                italic: isItalic,
                bold: isBold
              };
            }
          });

          if (currentSpan) {
            mergedSpans.push(currentSpan);
          }

          // Now build the paragraph text with proper formatting
          let paragraphText = '';
          mergedSpans.forEach((span) => {
            let text = span.text;

            // Convert smart quotes to regular quotes - comprehensive conversion
            text = text.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036\u2034]/g, '"'); // All smart double quotes
            text = text.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'"); // All smart single quotes and apostrophes

            // Apply formatting based on style
            if (span.bold) {
              text = `**${text}**`;
            }
            if (span.italic) {
              text = `*${text}*`;
            }

            paragraphText += text;
          });

          // Check if the entire paragraph is italic (for dialogue/thoughts)
          if (paragraph.style && paragraph.style.italic && !paragraphText.includes('*')) {
            paragraphText = `*${paragraphText}*`;
          }

          if (paragraphText.trim()) {
            result += paragraphText + '\n\n';
          }
        });

        resolve(result.trim());
      } catch (error) {
        console.error('Error processing RTF document:', error);
        reject(error);
      }
    });
  });
}

// Synchronous wrapper for compatibility with existing code
function convertRtfToPlainText(rtfContent) {
  // For now, we'll use a synchronous approach by running the async version
  // This is not ideal but maintains compatibility with existing code

  let result = '';
  let error = null;
  let finished = false;

  convertRtfToPlainTextWithParser(rtfContent)
    .then(text => {
      result = text;
      finished = true;
    })
    .catch(err => {
      error = err;
      finished = true;
    });

  // Wait for completion (busy wait - not ideal but necessary for sync compatibility)
  const start = Date.now();
  while (!finished && Date.now() - start < 5000) {
    // Wait up to 5 seconds
    require('child_process').spawnSync('sleep', ['0.001'], { stdio: 'ignore' });
  }

  if (error) {
    console.error('RTF conversion failed, falling back to original text:', error.message);
    return rtfContent;
  }

  if (!finished) {
    console.error('RTF conversion timeout, falling back to original text');
    return rtfContent;
  }

  return result;
}

module.exports = {
  convertRtfToPlainText,
  convertRtfToPlainTextWithParser
};

// Test the function if run directly
if (require.main === module) {
  const fs = require('fs');

  console.log('=== TESTING NEW RTF CONVERTER ===\n');

  const rtfContent = fs.readFileSync('rtftestcontent.rtf', 'utf8');

  convertRtfToPlainTextWithParser(rtfContent)
    .then(result => {
      console.log('Conversion successful!');
      console.log('Length:', result.length);
      console.log('First 500 chars:');
      console.log(result.substring(0, 500));

      console.log('\n=== ITALIC SECTIONS FOUND ===');
      const italicMatches = result.match(/\*[^*]+\*/g);
      if (italicMatches) {
        console.log(`Found ${italicMatches.length} italic sections:`);
        italicMatches.slice(0, 10).forEach((match, i) => {
          console.log(`${i + 1}. ${match}`);
        });
      } else {
        console.log('No italic sections found');
      }
    })
    .catch(err => {
      console.error('Test failed:', err);
    });
}