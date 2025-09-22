// Test RTF parser with detailed formatting extraction
const fs = require('fs');
const rtfParser = require('rtf-parser');

const rtfContent = fs.readFileSync('rtftestcontent.rtf', 'utf8');

rtfParser.string(rtfContent, (err, doc) => {
  if (err) {
    console.error('Error:', err);
    return;
  }

  console.log('=== CONVERTING RTF TO MARKDOWN ===\n');

  function convertToMarkdown(doc) {
    let result = '';

    doc.content.forEach((paragraph, i) => {
      console.log(`\n--- Paragraph ${i + 1} ---`);
      console.log('Paragraph style:', {
        italic: paragraph.style.italic,
        bold: paragraph.style.bold,
        font: paragraph.style.font?.name
      });

      let paragraphText = '';

      paragraph.content.forEach((span, j) => {
        console.log(`  Span ${j + 1}:`, {
          text: span.value.substring(0, 50) + (span.value.length > 50 ? '...' : ''),
          italic: span.style.italic,
          bold: span.style.bold
        });

        let text = span.value;

        // Apply formatting based on style
        if (span.style.italic) {
          text = `*${text}*`;
        }
        if (span.style.bold) {
          text = `**${text}**`;
        }

        paragraphText += text;
      });

      // Check if the entire paragraph is italic (for dialogue)
      if (paragraph.style.italic) {
        paragraphText = `*${paragraphText}*`;
      }

      result += paragraphText + '\n\n';
    });

    return result.trim();
  }

  const markdownText = convertToMarkdown(doc);

  console.log('\n=== FINAL MARKDOWN OUTPUT ===');
  console.log(markdownText.substring(0, 1000));

  console.log('\n=== ITALIC DETECTION ===');
  const italicMatches = markdownText.match(/\*[^*]+\*/g);
  if (italicMatches) {
    console.log(`Found ${italicMatches.length} italic sections:`);
    italicMatches.slice(0, 5).forEach((match, i) => {
      console.log(`${i + 1}. ${match}`);
    });
  } else {
    console.log('No italic sections found');
  }
});