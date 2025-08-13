import jsPDF from 'jspdf';
import { getPdfFont } from './fontManager';

// Page size definitions in inches (width x height)
const PAGE_SIZES = {
  letter: { width: 8.5, height: 11, name: 'US Letter' },
  a4: { width: 8.27, height: 11.69, name: 'A4' },
  digest: { width: 5.5, height: 8.5, name: 'Digest' },
  trade: { width: 6, height: 9, name: 'Trade Paperback' },
  'mass-market': { width: 4.25, height: 6.87, name: 'Mass Market' },
  hardcover: { width: 6.14, height: 9.21, name: 'Hardcover' },
  'large-print': { width: 7, height: 10, name: 'Large Print' }
};

// Enhanced font mapping for PDF generation with custom font support
function mapFontForPDF(fontFamily) {
  return getPdfFont(fontFamily);
}

// Utility function to check if a file might be locked (browser environment)
function checkFileAccess(_filename) {
  // In browser environment, we can't directly check file locks
  // But we can warn users about common issues

  // Return a warning if the filename suggests it might conflict
  if (typeof window !== 'undefined' && window.localStorage) {
    const lastExportTime = localStorage.getItem('lastExportTime');
    const now = Date.now();

    // If last export was very recent (< 2 seconds), warn about potential file lock
    if (lastExportTime && now - parseInt(lastExportTime) < 2000) {
      console.warn('Recent export detected - file may still be locked');
      return {
        warning: true,
        message:
          'Previous export was very recent. If the export fails, please close any open PDF viewers and try again.'
      };
    }

    // Store current export time
    localStorage.setItem('lastExportTime', now.toString());
  }

  return { warning: false };
}

// Get page dimensions in inches and points
function getPageDimensions(pageSize) {
  const size = PAGE_SIZES[pageSize] || PAGE_SIZES['letter'];
  return {
    width: size.width * 72, // Convert to points
    height: size.height * 72, // Convert to points
    widthInches: size.width,
    heightInches: size.height,
    name: size.name
  };
}

// Create PDF with consistent format handling across platforms
function createPDFWithConsistentFormat(pageSize) {
  const standardFormats = ['letter', 'a4'];

  if (standardFormats.includes(pageSize)) {
    // Use built-in format for standard sizes with points
    return new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: pageSize
    });
  } else {
    // For custom formats, use points and convert dimensions
    const dimensions = getPageDimensions(pageSize);
    const widthPt = dimensions.widthInches * 72;
    const heightPt = dimensions.heightInches * 72;

    try {
      return new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [widthPt, heightPt]
      });
    } catch (error) {
      console.warn(
        `Failed to create custom format ${pageSize}, falling back to letter`,
        error
      );
      // Fallback to letter format if custom format fails
      return new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
      });
    }
  }
}

// Get margins for a specific page (odd/even) - returns values in points for compatibility
function getPageMargins(template, pageNumber) {
  const margins = template.pageMargins;

  // Ensure margins exist and have valid values
  if (!margins) {
    console.warn('No margins found in template, using defaults');
    return {
      top: 72, // 1 inch
      bottom: 72, // 1 inch
      left: 90, // 1.25 inches
      right: 72 // 1 inch
    };
  }

  // Convert inches to points (72 points per inch)
  const pointsPerInch = 72;
  const topMargin = (margins.top || 1) * pointsPerInch;
  const bottomMargin = (margins.bottom || 1) * pointsPerInch;

  if (template.mirrorMargins) {
    // Use inside/outside margins for book binding
    const insideMargin = (margins.inside || 1.25) * pointsPerInch;
    const outsideMargin = (margins.outside || 1) * pointsPerInch;

    if (pageNumber % 2 === 1) {
      // Odd page (right-hand): inside margin on left
      return {
        top: topMargin,
        bottom: bottomMargin,
        left: insideMargin,
        right: outsideMargin
      };
    } else {
      // Even page (left-hand): inside margin on right
      return {
        top: topMargin,
        bottom: bottomMargin,
        left: outsideMargin,
        right: insideMargin
      };
    }
  } else {
    // Use regular left/right margins or inside/outside as uniform margins
    const leftMargin = (margins.left || margins.inside || 1.25) * pointsPerInch;
    const rightMargin = (margins.right || margins.outside || 1) * pointsPerInch;

    return {
      top: topMargin,
      bottom: bottomMargin,
      left: leftMargin,
      right: rightMargin
    };
  }
}

// Improved markdown parsing for PDF (returns array of text segments with formatting)
function parseMarkdownForPDF(text) {
  if (!text) return [{ type: 'normal', text: '' }];

  const segments = [];
  const _processedText = text;

  // First, handle headings (they should be on their own lines)
  const headingMatches = [];
  const headingRegex = /^(#{1,3})\s+(.*?)$/gm;
  let headingMatch;

  while ((headingMatch = headingRegex.exec(text)) !== null) {
    const level = headingMatch[1].length;
    headingMatches.push({
      type: level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3',
      start: headingMatch.index,
      end: headingMatch.index + headingMatch[0].length,
      text: headingMatch[2].trim(),
      fullMatch: headingMatch[0]
    });
  }

  // Then handle inline formatting (bold and italic)
  const inlineMatches = [];

  // Bold text (**text**)
  const boldRegex = /\*\*(.*?)\*\*/g;
  let boldMatch;
  while ((boldMatch = boldRegex.exec(text)) !== null) {
    inlineMatches.push({
      type: 'bold',
      start: boldMatch.index,
      end: boldMatch.index + boldMatch[0].length,
      text: boldMatch[1],
      fullMatch: boldMatch[0]
    });
  }

  // Italic text (*text*) - but not if it's part of bold
  const italicRegex = /(?<!\*)\*([^*\n]+?)\*(?!\*)/g;
  let italicMatch;
  while ((italicMatch = italicRegex.exec(text)) !== null) {
    // Check if this italic is inside a bold
    const isInsideBold = inlineMatches.some(
      // eslint-disable-next-line no-loop-func
      bold =>
        bold.type === 'bold' &&
        italicMatch.index >= bold.start &&
        italicMatch.index + italicMatch[0].length <= bold.end
    );

    if (!isInsideBold) {
      inlineMatches.push({
        type: 'italic',
        start: italicMatch.index,
        end: italicMatch.index + italicMatch[0].length,
        text: italicMatch[1],
        fullMatch: italicMatch[0]
      });
    }
  }

  // Combine all matches and sort by position
  const allMatches = [...headingMatches, ...inlineMatches].sort(
    (a, b) => a.start - b.start
  );

  // Remove overlapping matches (priority: headings > bold > italic)
  const filteredMatches = [];
  allMatches.forEach(match => {
    const isOverlapping = filteredMatches.some(existing => {
      return match.start < existing.end && match.end > existing.start;
    });

    if (!isOverlapping) {
      filteredMatches.push(match);
    }
  });

  // Build segments from the filtered matches
  let currentPos = 0;

  filteredMatches.forEach(match => {
    // Add normal text before this match
    if (currentPos < match.start) {
      const normalText = text.substring(currentPos, match.start);
      if (normalText.trim()) {
        segments.push({ type: 'normal', text: normalText });
      }
    }

    // Add the formatted text
    segments.push({ type: match.type, text: match.text });
    currentPos = match.end;
  });

  // Add remaining normal text
  if (currentPos < text.length) {
    const remainingText = text.substring(currentPos);
    if (remainingText.trim()) {
      segments.push({ type: 'normal', text: remainingText });
    }
  }

  // If no segments were created, return the whole text as normal
  if (segments.length === 0) {
    segments.push({ type: 'normal', text: text });
  }

  return segments;
}

// Improved rendering function for formatted text segments to PDF with proper paragraph styling
function renderFormattedTextToPDF(
  pdf,
  segments,
  x,
  y,
  maxWidth,
  fontSize,
  lineHeight,
  pageHeight,
  bottomMargin,
  topMargin,
  updateMarginsCallback,
  textAlign = 'justified',
  isFirstParagraph = false,
  paragraphStyle = 'indented',
  pdfFont = 'times'
) {
  let currentX = x;
  let currentY = y;
  let currentMaxWidth = maxWidth;
  let isFirstLineOfParagraph = true;

  // Apply first-line indent for indented style (except for first paragraph)
  const shouldIndentFirstLine =
    paragraphStyle === 'indented' && !isFirstParagraph;

  // Convert segments to a unified word list with formatting information
  const formattedWords = [];

  segments.forEach(segment => {
    // Handle headings that should start on new lines
    if (segment.type.startsWith('h')) {
      // If we're not at the start of a line, add a line break
      if (formattedWords.length > 0) {
        formattedWords.push({ text: '\n', type: 'linebreak' });
      }
    }

    // Handle line breaks in the text
    const lines = segment.text.split('\n');

    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        formattedWords.push({ text: '\n', type: 'linebreak' });
      }

      // Split line into words
      const words = line.split(' ').filter(word => word.length > 0);

      words.forEach((word, wordIndex) => {
        formattedWords.push({
          text: word,
          type: segment.type || 'normal',
          needsSpace:
            wordIndex > 0 ||
            (lineIndex === 0 &&
              formattedWords.length > 0 &&
              formattedWords[formattedWords.length - 1].type !== 'linebreak')
        });
      });
    });

    // For headings, add extra space after
    if (segment.type.startsWith('h')) {
      formattedWords.push({ text: '\n', type: 'linebreak' });
    }
  });

  // Process the unified word list
  let currentLineWords = [];
  let currentLineWidth = 0;

  const processLineBreak = () => {
    // Render current line if it has content
    if (currentLineWords.length > 0) {
      let lineStartX = currentX;
      let availableWidth = currentMaxWidth;

      // Apply indentation only to the first line of the paragraph
      if (isFirstLineOfParagraph && shouldIndentFirstLine) {
        const indentAmount = Math.max(24, Math.min(48, currentMaxWidth * 0.03));
        availableWidth -= indentAmount;
        lineStartX += indentAmount;
      }

      renderMixedFormattedLine(
        pdf,
        currentLineWords,
        lineStartX,
        currentY,
        availableWidth,
        textAlign,
        false,
        pdfFont,
        fontSize
      );

      currentLineWords = [];
      currentLineWidth = 0;
    }

    // Move to next line
    currentY += lineHeight;
    currentX = x;
    isFirstLineOfParagraph = false;

    // Check if we need a new page
    if (currentY + lineHeight > pageHeight - bottomMargin) {
      pdf.addPage();
      if (updateMarginsCallback) {
        const margins = updateMarginsCallback();
        if (margins) {
          x = margins.left;
          currentX = x;
          currentMaxWidth = margins.contentWidth;
        }
      }
      currentY = topMargin;
    }
  };

  for (let i = 0; i < formattedWords.length; i++) {
    const wordObj = formattedWords[i];

    if (wordObj.type === 'linebreak') {
      processLineBreak();
      continue;
    }

    // Set font for width calculation
    const fontStyle = getFontStyle(wordObj.type);
    const wordFontSize = getFontSize(wordObj.type, fontSize);
    pdf.setFont(pdfFont, fontStyle);
    pdf.setFontSize(wordFontSize);

    const word = wordObj.text;
    const wordWidth = pdf.getTextWidth(word);
    const spaceWidth = wordObj.needsSpace ? pdf.getTextWidth(' ') : 0;

    // Determine available width for this line
    let availableWidth = currentMaxWidth;
    if (isFirstLineOfParagraph && shouldIndentFirstLine) {
      const indentAmount = Math.max(24, Math.min(48, currentMaxWidth * 0.03));
      availableWidth -= indentAmount;
    }

    // Check if adding this word would exceed the available line width
    const totalWordWidth = spaceWidth + wordWidth;
    const wouldExceedWidth =
      currentLineWords.length > 0 &&
      currentLineWidth + totalWordWidth > availableWidth;

    if (wouldExceedWidth) {
      // Render current line and start a new one
      processLineBreak();
    }

    // Add word to current line
    currentLineWords.push(wordObj);
    currentLineWidth += totalWordWidth;
  }

  // Render any remaining words in the final line
  if (currentLineWords.length > 0) {
    let lineStartX = currentX;
    let availableWidth = currentMaxWidth;

    if (isFirstLineOfParagraph && shouldIndentFirstLine) {
      const indentAmount = Math.max(24, Math.min(48, availableWidth * 0.03));
      lineStartX += indentAmount;
      availableWidth -= indentAmount;
    }

    renderMixedFormattedLine(
      pdf,
      currentLineWords,
      lineStartX,
      currentY,
      availableWidth,
      textAlign === 'center' ? 'center' : 'left', // Preserve center alignment, but don't justify the last line
      true,
      pdfFont,
      fontSize
    );
  }

  return currentY;
}

// Helper function to get font style from segment type
function getFontStyle(type) {
  switch (type) {
    case 'bold':
    case 'h1':
    case 'h2':
    case 'h3':
      return 'bold';
    case 'italic':
      return 'italic';
    default:
      return 'normal';
  }
}

// Helper function to get font size from segment type
function getFontSize(type, baseFontSize) {
  switch (type) {
    case 'h1':
      return baseFontSize * 1.8;
    case 'h2':
      return baseFontSize * 1.5;
    case 'h3':
      return baseFontSize * 1.3;
    default:
      return baseFontSize;
  }
}

// Helper function to render a line with mixed formatting
function renderMixedFormattedLine(
  pdf,
  wordObjects,
  x,
  y,
  maxWidth,
  textAlign,
  isLastLine,
  pdfFont,
  baseFontSize
) {
  if (wordObjects.length === 0 || isNaN(x) || isNaN(y) || isNaN(maxWidth)) {
    console.error('Invalid mixed line parameters:', {
      words: wordObjects.length,
      x,
      y,
      maxWidth
    });
    return;
  }

  // Calculate total width and prepare for justification
  let totalWordWidth = 0;
  let totalSpaces = 0;

  // Set font for each word to measure width accurately
  wordObjects.forEach(wordObj => {
    const fontStyle = getFontStyle(wordObj.type);
    const wordFontSize = getFontSize(wordObj.type, baseFontSize);
    pdf.setFont(pdfFont, fontStyle);
    pdf.setFontSize(wordFontSize);

    totalWordWidth += pdf.getTextWidth(wordObj.text);
    if (wordObj.needsSpace) {
      totalSpaces++;
    }
  });

  // Calculate spacing
  let spaceWidth = pdf.getTextWidth(' '); // Default space width
  if (
    textAlign === 'justified' &&
    wordObjects.length > 1 &&
    !isLastLine &&
    totalSpaces > 0
  ) {
    const totalSpaceAvailable = maxWidth - totalWordWidth;
    spaceWidth = totalSpaceAvailable / totalSpaces;
  }

  // Calculate starting position based on text alignment
  let startX = x;
  if (textAlign === 'center') {
    const totalContentWidth = totalWordWidth + totalSpaces * spaceWidth;
    // Only center if content fits within the available width, otherwise left-align
    if (totalContentWidth <= maxWidth) {
      startX = x + (maxWidth - totalContentWidth) / 2;
    }
    // If content is too wide, keep startX = x (left-aligned)
  }

  // Render each word with proper formatting
  let currentX = startX;
  let lastFontStyle = null;
  let lastFontSize = null;

  wordObjects.forEach(wordObj => {
    const fontStyle = getFontStyle(wordObj.type);
    const wordFontSize = getFontSize(wordObj.type, baseFontSize);

    // Only change font if it's different from the last one (optimization)
    if (fontStyle !== lastFontStyle || wordFontSize !== lastFontSize) {
      pdf.setFont(pdfFont, fontStyle);
      pdf.setFontSize(wordFontSize);
      lastFontStyle = fontStyle;
      lastFontSize = wordFontSize;
    }

    // Add space before word if needed
    if (wordObj.needsSpace) {
      currentX += spaceWidth;
    }

    // Render the word
    if (safeText(pdf, wordObj.text, currentX, y)) {
      currentX += pdf.getTextWidth(wordObj.text);
    }
  });
}

// Helper function to safely render text and catch coordinate errors
function safeText(pdf, text, x, y) {
  // Validate coordinates
  if (isNaN(x) || isNaN(y) || x < 0 || y < 0 || !text) {
    console.error('Invalid text coordinates or text:', { text, x, y });
    return false;
  }

  try {
    pdf.text(text, x, y);
    return true;
  } catch (error) {
    console.error('PDF text error:', error, { text, x, y });
    return false;
  }
}

export async function exportToPDF(book, options = {}) {
  const { template } = options;

  try {
    // Create PDF with consistent format handling
    const pdf = createPDFWithConsistentFormat(template.pageSize || 'letter');

    // Get the actual page dimensions in points
    const actualPageSize = pdf.internal.pageSize;
    const pageWidth = actualPageSize.width;
    const pageHeight = actualPageSize.height;

    // Verify page size matches expectation
    const expectedDimensions = getPageDimensions(template.pageSize || 'letter');
    const expectedWidth = expectedDimensions.width;
    const expectedHeight = expectedDimensions.height;

    if (expectedWidth && expectedHeight) {
      const widthDiff = Math.abs(pageWidth - expectedWidth);
      const heightDiff = Math.abs(pageHeight - expectedHeight);

      if (widthDiff > 5 || heightDiff > 5) {
        // Allow 5pt tolerance
        console.error(`Significant page size discrepancy detected:`, {
          pageSize: template.pageSize,
          expected: { width: expectedWidth, height: expectedHeight },
          actual: { width: pageWidth, height: pageHeight },
          difference: { width: widthDiff, height: heightDiff }
        });
      } else {
      }
    }

    // Get initial margins for page 1 (now returns values in points directly)
    let currentPageMargins = getPageMargins(template, 1);
    let leftMargin = currentPageMargins.left;
    let rightMargin = currentPageMargins.right;
    let topMargin = currentPageMargins.top;
    let bottomMargin = currentPageMargins.bottom;
    let contentWidth = pageWidth - leftMargin - rightMargin;

    // Validate margins
    if (
      isNaN(leftMargin) ||
      isNaN(rightMargin) ||
      isNaN(topMargin) ||
      isNaN(bottomMargin)
    ) {
      console.error('Invalid margin calculations:', currentPageMargins);
      throw new Error('Invalid margin values calculated');
    }

    // Set font using enhanced font mapping
    const pdfFont = mapFontForPDF(template.fontFamily);
    pdf.setFont(pdfFont, 'normal');
    const fontSize = template.fontSize;
    const lineHeight = fontSize * template.lineHeight;

    let currentY = topMargin;

    // Track chapter opening pages and blank pages during generation
    const chapterOpeningPages = new Set();
    const blankPages = new Set();

    // Function to mark a page as a chapter opening
    const markChapterPage = () => {
      const currentPageNumber = pdf.internal.getNumberOfPages();
      chapterOpeningPages.add(currentPageNumber);
    };

    // Function to mark a page as blank
    const markBlankPage = () => {
      const currentPageNumber = pdf.internal.getNumberOfPages();
      blankPages.add(currentPageNumber);
    };

    // Function to update margins when page changes
    const updateMarginsForPage = () => {
      const pageNumber = pdf.internal.getNumberOfPages();
      currentPageMargins = getPageMargins(template, pageNumber);
      leftMargin = currentPageMargins.left;
      rightMargin = currentPageMargins.right;
      topMargin = currentPageMargins.top;
      bottomMargin = currentPageMargins.bottom;
      contentWidth = pageWidth - leftMargin - rightMargin;

      // Validate margins
      if (
        isNaN(leftMargin) ||
        isNaN(rightMargin) ||
        isNaN(topMargin) ||
        isNaN(bottomMargin)
      ) {
        console.error(
          'Invalid margin calculations on page',
          pageNumber,
          ':',
          currentPageMargins
        );
        return null;
      }

      // Return updated margin info for text rendering
      return {
        left: leftMargin,
        right: rightMargin,
        top: topMargin,
        bottom: bottomMargin,
        contentWidth: contentWidth
      };
    };

    // Title Page
    const hasTitlePage =
      (book.title && book.title.trim()) || (book.author && book.author.trim());
    if (hasTitlePage) {
      currentY = pageHeight / 2 - 100; // Center vertically

      if (book.title) {
        pdf.setFontSize(24);
        pdf.setFont(pdfFont, 'bold');

        // Handle long titles by wrapping them across multiple lines
        const titleMargin = 72; // 1 inch margin on each side for title
        const titleMaxWidth = pageWidth - titleMargin * 2;
        const titleLines = pdf.splitTextToSize(book.title, titleMaxWidth);

        // Center each line of the title
        titleLines.forEach((line, index) => {
          const lineWidth = pdf.getTextWidth(line);
          const lineX = (pageWidth - lineWidth) / 2;
          safeText(pdf, line, lineX, currentY + index * 36); // 1.5 line spacing for title
        });

        currentY += titleLines.length * 36 + 24; // Move past title lines plus extra space
      }

      if (book.author) {
        pdf.setFontSize(18);
        pdf.setFont(pdfFont, 'normal');

        const authorText = `by ${book.author}`;
        const authorWidth = pdf.getTextWidth(authorText);
        const authorX = (pageWidth - authorWidth) / 2;
        safeText(pdf, authorText, authorX, currentY);
      }

      // Start new page for content
      pdf.addPage();
      updateMarginsForPage();
      currentY = topMargin;

      // If chapters start on new pages, this page will become blank, so mark it
      if (template.chapterHeader.pageBreak) {
        markBlankPage();
      }
    }

    // Set content font
    pdf.setFontSize(fontSize);
    pdf.setFont(pdfFont, 'normal');

    // Front Matter Processing
    if (book.frontMatter && book.frontMatter.length > 0) {
      book.frontMatter.forEach(frontMatterItem => {
        if (!frontMatterItem.content || !frontMatterItem.content.trim()) {
          return; // Skip empty front matter items
        }

        // Start new page for each front matter item
        pdf.addPage();
        updateMarginsForPage();
        currentY = topMargin;

        // Force front matter to start on right-hand (odd) page
        const currentPageNumber = pdf.internal.getNumberOfPages();
        if (currentPageNumber % 2 === 0) {
          markBlankPage(); // Mark current page as blank
          pdf.addPage(); // Add the actual front matter page
          updateMarginsForPage();
          currentY = topMargin;
        }

        // Mark this as front matter page
        const markFrontMatterPage = () => {
          const pageNumber = pdf.internal.getNumberOfPages();
          blankPages.delete(pageNumber); // Remove from blank pages if it was marked as such
        };
        markFrontMatterPage();

        if (frontMatterItem.type === 'copyright') {
          // Add line breaks before copyright page content (same as chapter headers)
          const lineBreaksBefore = template.chapterHeader.lineBreaksBefore || 0;
          for (let i = 0; i < lineBreaksBefore; i++) {
            currentY += lineHeight;
            // Check if we need a new page
            if (currentY + lineHeight > pageHeight - bottomMargin) {
              pdf.addPage();
              updateMarginsForPage();
              currentY = topMargin;
              markFrontMatterPage();
              break; // Stop adding line breaks if we hit a new page
            }
          }

          // For copyright pages, preserve exact line breaks including blank lines and use center alignment
          const lines = frontMatterItem.content.split('\n');

          lines.forEach((line, _lineIndex) => {
            if (line.trim()) {
              // For copyright, use PDF's built-in text splitting and center each resulting line
              pdf.setFont(pdfFont, 'normal');
              pdf.setFontSize(fontSize);

              const wrappedLines = pdf.splitTextToSize(
                line.trim(),
                contentWidth
              );

              wrappedLines.forEach(wrappedLine => {
                // Check if we need a new page
                if (currentY + lineHeight > pageHeight - bottomMargin) {
                  pdf.addPage();
                  updateMarginsForPage();
                  currentY = topMargin;
                  markFrontMatterPage(); // Mark continuation pages as front matter too
                }

                // Center each wrapped line
                const lineWidth = pdf.getTextWidth(wrappedLine);
                const centerX = leftMargin + (contentWidth - lineWidth) / 2;

                safeText(pdf, wrappedLine, centerX, currentY);
                currentY += lineHeight;
              });
            } else {
              // Handle blank lines - advance to next line
              if (currentY + lineHeight > pageHeight - bottomMargin) {
                pdf.addPage();
                updateMarginsForPage();
                currentY = topMargin;
                markFrontMatterPage(); // Mark continuation pages as front matter too
              }
              currentY += lineHeight;
            }
          });
        } else {
          // Handle other front matter types (e.g., prologue) with heading support

          // Add heading for non-copyright front matter items (like prologue)
          if (frontMatterItem.title && frontMatterItem.type !== 'copyright') {
            // Add line breaks before front matter header (similar to chapter headers)
            const lineBreaksBefore =
              template.chapterHeader.lineBreaksBefore || 0;
            for (let i = 0; i < lineBreaksBefore; i++) {
              currentY += lineHeight;
              // Check if we need a new page
              if (
                currentY + template.chapterHeader.fontSize * 2 >
                pageHeight - bottomMargin
              ) {
                pdf.addPage();
                updateMarginsForPage();
                currentY = topMargin;
                markFrontMatterPage();
                break; // Stop adding line breaks if we hit a new page
              }
            }

            // Check if we need a new page for the front matter header
            if (
              currentY + template.chapterHeader.fontSize * 2 >
              pageHeight - bottomMargin
            ) {
              pdf.addPage();
              updateMarginsForPage();
              currentY = topMargin;
              markFrontMatterPage();
            }

            // Render front matter header (e.g., "Prologue")
            pdf.setFont(pdfFont, template.chapterHeader.fontWeight);
            pdf.setFontSize(template.chapterHeader.fontSize);

            const frontMatterHeaderLines = pdf.splitTextToSize(
              frontMatterItem.title,
              contentWidth
            );

            frontMatterHeaderLines.forEach((line, _lineIndex) => {
              let headerX = leftMargin;
              if (template.chapterHeader.alignment === 'center') {
                const lineWidth = pdf.getTextWidth(line);
                headerX = leftMargin + (contentWidth - lineWidth) / 2;
              } else if (template.chapterHeader.alignment === 'right') {
                const lineWidth = pdf.getTextWidth(line);
                headerX = leftMargin + contentWidth - lineWidth;
              }

              safeText(pdf, line, headerX, currentY);
              currentY += template.chapterHeader.fontSize * 1.2; // Line spacing for headers
            });

            // Add spacing after front matter header
            currentY +=
              template.chapterHeader.fontSize *
              (template.chapterHeader.spacing - 1.2);

            // Reset to content font
            pdf.setFont(pdfFont, 'normal');
            pdf.setFontSize(fontSize);
          }

          // Use chapter-style formatting for prologue, original formatting for other front matter
          if (frontMatterItem.type === 'prologue') {
            // Use the same paragraph processing as chapters for prologue
            // First handle forced line breaks (preserve them as blank paragraphs)
            const contentWithForcedBreaks = frontMatterItem.content.replace(
              /\n<!--FORCED_BREAK-->\n/g,
              '\n__FORCED_BREAK_PLACEHOLDER__\n'
            );
            const paragraphs = contentWithForcedBreaks
              .split('\n')
              .filter(p => p.trim());

            paragraphs.forEach((paragraph, paragraphIndex) => {
              const trimmedParagraph = paragraph.trim();

              // Handle forced line breaks as blank lines
              if (trimmedParagraph === '__FORCED_BREAK_PLACEHOLDER__') {
                // Add a blank line for forced breaks
                currentY += lineHeight;
                return;
              }

              if (trimmedParagraph) {
                // Check if we need a new page
                if (currentY + lineHeight > pageHeight - bottomMargin) {
                  pdf.addPage();
                  updateMarginsForPage();
                  currentY = topMargin;
                  markFrontMatterPage();
                }

                // Parse markdown BEFORE any text processing
                const segments = parseMarkdownForPDF(trimmedParagraph);

                // Render the formatted text with proper paragraph styling (same as chapters)
                const newY = renderFormattedTextToPDF(
                  pdf,
                  segments,
                  leftMargin,
                  currentY,
                  contentWidth,
                  fontSize,
                  lineHeight,
                  pageHeight,
                  bottomMargin,
                  topMargin,
                  () => {
                    updateMarginsForPage();
                    markFrontMatterPage(); // Mark continuation pages as front matter too
                    return {
                      left: leftMargin,
                      right: rightMargin,
                      top: topMargin,
                      bottom: bottomMargin,
                      contentWidth: contentWidth
                    };
                  },
                  template.textAlign || 'justified',
                  paragraphIndex === 0, // isFirstParagraph
                  template.paragraphStyle || 'indented', // paragraphStyle
                  pdfFont
                );

                currentY = newY + lineHeight; // Move to next line

                // Add paragraph spacing for separated style
                if (template.paragraphStyle === 'separated') {
                  currentY += lineHeight; // Add extra line spacing between paragraphs
                }
              }
            });
          } else {
            // Keep original formatting for other front matter types
            const paragraphs = frontMatterItem.content
              .split('\n')
              .filter(p => p.trim());

            paragraphs.forEach((paragraph, paragraphIndex) => {
              if (paragraph.trim()) {
                const words = paragraph.trim().split(/\s+/);
                let currentLineWords = [];
                const _isFirstParagraph = paragraphIndex === 0;

                words.forEach((word, wordIndex) => {
                  const wordObj = {
                    text: word,
                    type: 'normal',
                    needsSpace: wordIndex > 0
                  };

                  const testLine = [...currentLineWords, wordObj]
                    .map(w => w.text)
                    .join(' ');
                  const testWidth = pdf.getTextWidth(testLine);

                  if (testWidth <= contentWidth) {
                    currentLineWords.push(wordObj);
                  } else {
                    // Render current line
                    if (currentLineWords.length > 0) {
                      if (currentY + lineHeight > pageHeight - bottomMargin) {
                        pdf.addPage();
                        updateMarginsForPage();
                        currentY = topMargin;
                        markFrontMatterPage();
                      }

                      const lineStartX = leftMargin;
                      renderMixedFormattedLine(
                        pdf,
                        currentLineWords,
                        lineStartX,
                        currentY,
                        contentWidth,
                        'left',
                        false,
                        pdfFont,
                        fontSize
                      );
                      currentY += lineHeight;
                    }
                    currentLineWords = [wordObj];
                  }
                });

                // Render remaining words in the last line of paragraph
                if (currentLineWords.length > 0) {
                  if (currentY + lineHeight > pageHeight - bottomMargin) {
                    pdf.addPage();
                    updateMarginsForPage();
                    currentY = topMargin;
                    markFrontMatterPage();
                  }

                  const lineStartX = leftMargin;
                  renderMixedFormattedLine(
                    pdf,
                    currentLineWords,
                    lineStartX,
                    currentY,
                    contentWidth,
                    'left',
                    true,
                    pdfFont,
                    fontSize
                  );
                  currentY += lineHeight;
                }

                // Add paragraph spacing
                currentY += lineHeight * 0.5;
              }
            });
          }
        }
      });
    }

    // Helper function to generate chapter header text
    const generateChapterHeader = (chapter, chapterNumber) => {
      const { style, format } = template.chapterHeader;

      switch (style) {
        case 'numbered':
          return `Chapter ${chapterNumber}`;
        case 'titled':
          return chapter.title;
        case 'both':
          return `Chapter ${chapterNumber}: ${chapter.title}`;
        case 'custom':
          return format
            .replace('{number}', chapterNumber.toString())
            .replace('{title}', chapter.title);
        default:
          return `Chapter ${chapterNumber}`;
      }
    };

    // Process chapters - with parts support if book has parts
    if (book.parts && book.parts.length > 0) {
      // Process chapters organized by parts
      let globalChapterIndex = 0;

      book.parts.forEach((part, _partIndex) => {
        // Get chapters for this part
        const partChapters = part.chapterIds
          .map(chapterId => book.chapters.find(ch => ch.id === chapterId))
          .filter(Boolean);

        if (partChapters.length > 0) {
          // Add part page (always on odd page, followed by blank page)
          pdf.addPage();
          updateMarginsForPage();
          currentY = topMargin;

          // Force part to start on right-hand (odd) page
          const currentPageNumber = pdf.internal.getNumberOfPages();
          if (currentPageNumber % 2 === 0) {
            markBlankPage(); // Mark current page as blank
            pdf.addPage(); // Add the actual part page
            updateMarginsForPage();
            currentY = topMargin;
          }

          // Position part title 1/3 to 1/2 way down the page (approximately 40%)
          currentY = topMargin + (pageHeight - topMargin - bottomMargin) * 0.4;

          // Render part title with larger font size
          pdf.setFont(pdfFont, 'bold');
          const partFontSize = template.chapterHeader.fontSize * 1.8; // Significantly larger than chapter headers
          pdf.setFontSize(partFontSize);

          const partLines = pdf.splitTextToSize(part.title, contentWidth);
          const partLineHeight = partFontSize * 1.3; // Generous line spacing for part titles

          partLines.forEach((line, _lineIndex) => {
            const lineWidth = pdf.getTextWidth(line);
            const centerX = leftMargin + (contentWidth - lineWidth) / 2;
            safeText(pdf, line, centerX, currentY);
            currentY += partLineHeight;
          });

          // Add blank page after part page so first chapter starts on odd page
          pdf.addPage();
          updateMarginsForPage();
          markBlankPage();

          // Process chapters in this part
          partChapters.forEach((chapter, localChapterIndex) => {
            const chapterNumber = globalChapterIndex + localChapterIndex + 1;
            processChapter(
              chapter,
              chapterNumber,
              globalChapterIndex + localChapterIndex === 0
            );
          });

          globalChapterIndex += partChapters.length;
        }
      });

      // Process any unassigned chapters (chapters not in any part)
      const assignedChapterIds = new Set();
      book.parts.forEach(part => {
        part.chapterIds.forEach(chapterId => {
          assignedChapterIds.add(chapterId);
        });
      });

      const unassignedChapters = book.chapters.filter(
        ch => !assignedChapterIds.has(ch.id)
      );
      unassignedChapters.forEach((chapter, localChapterIndex) => {
        const chapterNumber = globalChapterIndex + localChapterIndex + 1;
        processChapter(
          chapter,
          chapterNumber,
          globalChapterIndex + localChapterIndex === 0
        );
      });
    } else {
      // Process chapters directly (no parts)
      book.chapters.forEach((chapter, chapterIndex) => {
        const chapterNumber = chapterIndex + 1;
        processChapter(chapter, chapterNumber, chapterIndex === 0);
      });
    }

    // Helper function to process a single chapter
    function processChapter(chapter, chapterNumber, isFirstChapterOverall) {
      // Add chapter header
      if (chapter.title || template.chapterHeader.style !== 'none') {
        // Determine if we need a page break for this chapter
        let shouldAddPageBreak = false;

        if (template.chapterHeader.pageBreak) {
          if (isFirstChapterOverall) {
            // First chapter: only add page break if no title page, OR if we need right-hand start
            shouldAddPageBreak =
              !hasTitlePage || template.chapterHeader.startOnRightPage;
          } else {
            // Subsequent chapters: always add page break when page breaks are enabled
            shouldAddPageBreak = true;
          }
        }

        if (shouldAddPageBreak) {
          pdf.addPage();
          updateMarginsForPage();
          currentY = topMargin;

          // Force chapter to start on right-hand (odd) page if requested
          if (template.chapterHeader.startOnRightPage) {
            const currentPageNumber = pdf.internal.getNumberOfPages();

            // If current page is even (left-hand), mark it as blank and add a page for the chapter
            if (currentPageNumber % 2 === 0) {
              markBlankPage(); // Mark current page as blank
              pdf.addPage(); // Add the actual chapter page
              updateMarginsForPage();
              currentY = topMargin;
            }
          }

          // Now mark the current page as a chapter opening (after all the page logic)
          markChapterPage();
        } else {
          // If chapter starts on the same page, still mark it as a chapter page
          markChapterPage();
        }

        // Add line breaks before chapter header (only if page breaks are enabled)
        if (template.chapterHeader.pageBreak) {
          const lineBreaksBefore = template.chapterHeader.lineBreaksBefore || 0;
          for (let i = 0; i < lineBreaksBefore; i++) {
            currentY += lineHeight;
            // Check if we need a new page
            if (
              currentY + template.chapterHeader.fontSize * 2 >
              pageHeight - bottomMargin
            ) {
              pdf.addPage();
              updateMarginsForPage();
              currentY = topMargin;
              break; // Stop adding line breaks if we hit a new page
            }
          }
        }

        // Check if we need a new page for the chapter header
        if (
          currentY + template.chapterHeader.fontSize * 2 >
          pageHeight - bottomMargin
        ) {
          pdf.addPage();
          updateMarginsForPage();
          currentY = topMargin;
        }

        const chapterHeaderText = generateChapterHeader(chapter, chapterNumber);

        pdf.setFont(pdfFont, template.chapterHeader.fontWeight);
        pdf.setFontSize(template.chapterHeader.fontSize);

        // Split chapter header text to handle long titles
        const chapterHeaderLines = pdf.splitTextToSize(
          chapterHeaderText,
          contentWidth
        );

        chapterHeaderLines.forEach((line, _lineIndex) => {
          let headerX = leftMargin;
          if (template.chapterHeader.alignment === 'center') {
            const lineWidth = pdf.getTextWidth(line);
            headerX = leftMargin + (contentWidth - lineWidth) / 2;
          } else if (template.chapterHeader.alignment === 'right') {
            const lineWidth = pdf.getTextWidth(line);
            headerX = leftMargin + contentWidth - lineWidth;
          }

          safeText(pdf, line, headerX, currentY);
          currentY += template.chapterHeader.fontSize * 1.2; // Line spacing for chapter headers
        });

        // Add spacing after chapter header
        currentY +=
          template.chapterHeader.fontSize *
          (template.chapterHeader.spacing - 1.2);

        // Reset to content font
        pdf.setFont(pdfFont, 'normal');
        pdf.setFontSize(fontSize);
      }

      // Process scenes in this chapter
      chapter.scenes.forEach((scene, sceneIndex) => {
        // Add scene title if requested
        if (options.includeSceneTitles && scene.title) {
          // Check if we need a new page for the scene title
          if (currentY + lineHeight * 2 > pageHeight - bottomMargin) {
            pdf.addPage();
            updateMarginsForPage();
            currentY = topMargin;
          }

          pdf.setFont(pdfFont, 'bold');
          pdf.setFontSize(fontSize + 2);

          const sceneTitleLines = pdf.splitTextToSize(
            scene.title,
            contentWidth
          );
          sceneTitleLines.forEach(line => {
            safeText(pdf, line, leftMargin, currentY);
            currentY += lineHeight * 1.2;
          });

          currentY += lineHeight * 0.5; // Extra space after title
          pdf.setFont(pdfFont, 'normal');
          pdf.setFontSize(fontSize);
        }

        // Process scene content with markdown support
        if (scene.content && scene.content.trim()) {
          if (template.writingType === 'verse') {
            // For verse, preserve original formatting
            // Handle forced line breaks (preserve them as actual line breaks)
            const contentWithForcedBreaks = scene.content.replace(
              /\n<!--FORCED_BREAK-->\n/g,
              '\n\n'
            );
            const trimmedContent = contentWithForcedBreaks.trim();
            if (trimmedContent) {
              if (template.verseKeepTogether) {
                // Split content into verse blocks (separated by blank lines)
                const verseBlocks = trimmedContent
                  .split(/\n\s*\n/)
                  .filter(block => block.trim());

                verseBlocks.forEach((verseBlock, blockIndex) => {
                  const blockContent = verseBlock.trim();
                  if (blockContent) {
                    // Parse markdown for this block
                    const segments = parseMarkdownForPDF(blockContent);

                    // Estimate block height by counting lines
                    const blockLines = blockContent.split('\n');
                    const estimatedHeight =
                      blockLines.length * lineHeight + lineHeight; // Extra line for spacing

                    // Check if block fits on current page, if not move to next page
                    if (
                      currentY + estimatedHeight >
                      pageHeight - bottomMargin
                    ) {
                      pdf.addPage();
                      updateMarginsForPage();
                      currentY = topMargin;
                    }

                    // Render the verse block
                    const newY = renderFormattedTextToPDF(
                      pdf,
                      segments,
                      leftMargin,
                      currentY,
                      contentWidth,
                      fontSize,
                      lineHeight,
                      pageHeight,
                      bottomMargin,
                      topMargin,
                      updateMarginsForPage,
                      'left', // Always left-align verse
                      false, // Never apply first paragraph rules
                      'separated', // No indentation for verse
                      pdfFont
                    );

                    // Add blank line spacing between verse blocks (except for the last block)
                    if (blockIndex < verseBlocks.length - 1) {
                      currentY = newY + lineHeight * 2; // Double line height for blank line separation
                    } else {
                      currentY = newY + lineHeight * 0.5; // Regular spacing after last block
                    }
                  }
                });
              } else {
                // Original verse rendering without block grouping
                // Check if we need a new page
                if (currentY + lineHeight > pageHeight - bottomMargin) {
                  pdf.addPage();
                  updateMarginsForPage();
                  currentY = topMargin;
                }

                // Parse markdown BEFORE any text processing
                const segments = parseMarkdownForPDF(trimmedContent);

                // Render verse content with preserved formatting (always left-aligned)
                const newY = renderFormattedTextToPDF(
                  pdf,
                  segments,
                  leftMargin,
                  currentY,
                  contentWidth,
                  fontSize,
                  lineHeight,
                  pageHeight,
                  bottomMargin,
                  topMargin,
                  updateMarginsForPage,
                  'left', // Always left-align verse
                  false, // Never apply first paragraph rules
                  'separated', // No indentation for verse
                  pdfFont
                );

                currentY = newY + lineHeight * 0.5; // Add some spacing after verse
              }
            }
          } else {
            // For prose, split on single newlines to create paragraphs (more intuitive for users)
            // First handle forced line breaks (preserve them as blank paragraphs)
            const contentWithForcedBreaks = scene.content.replace(
              /\n<!--FORCED_BREAK-->\n/g,
              '\n__FORCED_BREAK_PLACEHOLDER__\n'
            );
            const paragraphs = contentWithForcedBreaks
              .split('\n')
              .filter(p => p.trim());

            paragraphs.forEach((paragraph, paragraphIndex) => {
              const trimmedParagraph = paragraph.trim();

              // Handle forced line breaks as blank lines
              if (trimmedParagraph === '__FORCED_BREAK_PLACEHOLDER__') {
                // Add a blank line for forced breaks
                currentY += lineHeight;
                return;
              }

              if (trimmedParagraph) {
                // Check if we need a new page
                if (currentY + lineHeight > pageHeight - bottomMargin) {
                  pdf.addPage();
                  updateMarginsForPage();
                  currentY = topMargin;
                }

                // Parse markdown BEFORE any text processing
                const segments = parseMarkdownForPDF(trimmedParagraph);

                // Render the formatted text with proper paragraph styling
                const newY = renderFormattedTextToPDF(
                  pdf,
                  segments,
                  leftMargin,
                  currentY,
                  contentWidth,
                  fontSize,
                  lineHeight,
                  pageHeight,
                  bottomMargin,
                  topMargin,
                  updateMarginsForPage,
                  template.textAlign || 'justified',
                  paragraphIndex === 0, // isFirstParagraph
                  template.paragraphStyle || 'indented', // paragraphStyle
                  pdfFont
                );

                currentY = newY + lineHeight; // Move to next line

                // Add paragraph spacing for separated style
                if (template.paragraphStyle === 'separated') {
                  currentY += lineHeight; // Add extra line spacing between paragraphs
                }
              }
            });
          }
        }

        // Add scene break if requested and not the last scene in this chapter
        if (
          options.includeSceneBreaks &&
          sceneIndex < chapter.scenes.length - 1
        ) {
          currentY += lineHeight;

          // Check if we need a new page for scene break
          if (currentY + lineHeight > pageHeight - bottomMargin) {
            pdf.addPage();
            updateMarginsForPage();
            currentY = topMargin;
          }

          const sceneBreak = '* * *';
          const breakWidth = pdf.getTextWidth(sceneBreak);
          const breakX = (pageWidth - breakWidth) / 2;
          safeText(pdf, sceneBreak, breakX, currentY);
          currentY += lineHeight * 1.5;
        }
      });
    }

    // Add page numbers and running headers
    const pageCount = pdf.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);

      // Skip running headers on title page
      const isFirstPage = i === 1 && hasTitlePage;

      // Skip running headers on chapter pages if requested
      const isChapterPage =
        template.runningHeaders?.skipChapterPages && chapterOpeningPages.has(i);

      // Skip running headers on blank pages
      const isBlankPage = blankPages.has(i);

      // Add running headers
      if (
        template.runningHeaders?.enabled &&
        !isFirstPage &&
        !isChapterPage &&
        !isBlankPage
      ) {
        const pageMargins = getPageMargins(template, i);
        const pageContentWidth =
          pageWidth - pageMargins.left - pageMargins.right;
        const isLeftPage = i % 2 === 0;

        // Determine header text
        const headerText = isLeftPage ? book.author : book.title;

        if (headerText) {
          // Make running header font size proportional to body text (75% of body text, min 8pt, max 12pt)
          const runningHeaderSize = Math.max(8, Math.min(12, fontSize * 0.75));
          pdf.setFontSize(runningHeaderSize);
          pdf.setFont(pdfFont, 'normal');

          const headerWidth = pdf.getTextWidth(headerText);
          let headerX;

          if (template.runningHeaders?.alignment === 'center') {
            // Centered
            headerX = pageMargins.left + (pageContentWidth - headerWidth) / 2;
          } else {
            // Outside edge (default)
            if (isLeftPage) {
              // Left page: align to left (outside edge)
              headerX = pageMargins.left;
            } else {
              // Right page: align to right (outside edge)
              headerX = pageMargins.left + pageContentWidth - headerWidth;
            }
          }

          // Position in top margin area
          const headerY = pageMargins.top / 2;
          safeText(pdf, headerText, headerX, headerY);
        }
      }

      // Add page numbers (skip on title page)
      if (!(i === 1 && hasTitlePage)) {
        // Make page number font size proportional to body text (70% of body text, min 8pt, max 11pt)
        const pageNumberSize = Math.max(8, Math.min(11, fontSize * 0.7));
        pdf.setFontSize(pageNumberSize);
        pdf.setFont(pdfFont, 'normal');
        const pageNumberText = i.toString();
        const pageNumberWidth = pdf.getTextWidth(pageNumberText);

        // Get margins for this specific page
        const pageMargins = getPageMargins(template, i);
        const pageContentWidth =
          pageWidth - pageMargins.left - pageMargins.right;

        // Center page number within content area and respect bottom margin
        const pageNumberX =
          pageMargins.left + (pageContentWidth - pageNumberWidth) / 2;
        const pageNumberY = pageHeight - pageMargins.bottom + 18; // Position within bottom margin area

        safeText(pdf, pageNumberText, pageNumberX, pageNumberY);
      }
    }

    // Save the PDF with proper error handling
    const filename = `${book.title || 'Book'}.pdf`;

    // Check for potential file access issues
    const accessCheck = checkFileAccess(filename);
    if (accessCheck.warning) {
      console.warn(accessCheck.message);
      // Could show a warning dialog here if desired
    }

    pdf.save(filename);

    // Optional: Show user notification of success
    if (typeof window !== 'undefined' && window.electron) {
      // In Electron, we could show a native notification
      try {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('show-notification', {
          title: 'Export Complete',
          body: `PDF saved as ${filename}`
        });
      } catch (e) {
        // Fallback silently if electron APIs not available
      }
    }
  } catch (error) {
    console.error('PDF export failed:', error);

    // Determine the likely cause and show user-friendly message
    let userMessage = 'Failed to export PDF.';

    if (
      error.message &&
      (error.message.includes('permission') || error.message.includes('save'))
    ) {
      userMessage = `Cannot save PDF - the file may be open in another application.\n\nPlease close any PDF viewers showing "${book.title || 'Book'}.pdf" and try again.`;
    } else if (error.message && error.message.includes('access')) {
      userMessage = `Cannot save PDF - file access denied.\n\nThe file "${book.title || 'Book'}.pdf" may be open in another application or you may not have write permission to the Downloads folder.`;
    } else if (error.name === 'NotAllowedError') {
      userMessage =
        'Cannot save PDF - file access was denied by the browser or system.';
    } else if (error.message.includes('Invalid')) {
      userMessage =
        'PDF generation failed due to invalid content or settings. Please check your book content and template settings.';
    } else {
      userMessage = `PDF export failed: ${error.message || 'Unknown error'}`;
    }

    // Show error to user
    alert(
      `Export Failed\n\n${userMessage}\n\n💡 Tip: Close any PDF viewers and try again.`
    );

    // Re-throw the error so the calling code knows the export failed
    throw new Error(userMessage);
  }
}
