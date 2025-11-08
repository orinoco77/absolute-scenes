import jsPDF from 'jspdf';
import { getPdfFont } from './fontManager';
import { processTextForExport } from './textProcessing';

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

  // First convert double dashes to em-dashes
  const processedText = processTextForExport(text);

  const segments = [];

  // First, handle headings (they should be on their own lines)
  const headingMatches = [];
  const headingRegex = /^(#{1,3})\s+(.*?)$/gm;
  let headingMatch;

  while ((headingMatch = headingRegex.exec(processedText)) !== null) {
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
  while ((boldMatch = boldRegex.exec(processedText)) !== null) {
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
  while ((italicMatch = italicRegex.exec(processedText)) !== null) {
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
      const normalText = processedText.substring(currentPos, match.start);
      if (normalText.trim()) {
        segments.push({ type: 'normal', text: normalText });
      }
    }

    // Add the formatted text
    segments.push({ type: match.type, text: match.text });
    currentPos = match.end;
  });

  // Add remaining normal text
  if (currentPos < processedText.length) {
    const remainingText = processedText.substring(currentPos);
    if (remainingText.trim()) {
      segments.push({ type: 'normal', text: remainingText });
    }
  }

  // If no segments were created, return the whole text as normal
  if (segments.length === 0) {
    segments.push({ type: 'normal', text: processedText });
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
  // Position tracking no longer needed - each line starts fresh at x
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
        // Determine if this word needs a space before it
        let needsSpace = false;

        if (wordIndex > 0) {
          // Not the first word in this segment - always needs space
          needsSpace = true;
        } else if (lineIndex === 0 && formattedWords.length > 0) {
          // First word of segment, but not first word overall
          const lastWord = formattedWords[formattedWords.length - 1];
          // Need space if previous word was not a line break
          needsSpace = lastWord.type !== 'linebreak';
        }

        formattedWords.push({
          text: word,
          type: segment.type || 'normal',
          needsSpace: needsSpace
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
      // Calculate indentation for this line
      const indentation = calculateParagraphIndentation(
        isFirstLineOfParagraph,
        shouldIndentFirstLine,
        fontSize,
        currentMaxWidth,
        x,
        pdf
      );
      const { availableWidth, lineStartX } = indentation;

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
    isFirstLineOfParagraph = false;

    // Check if we need a new page
    if (currentY + lineHeight > pageHeight - bottomMargin) {
      if (updateMarginsCallback) {
        const margins = updateMarginsCallback();
        if (margins) {
          x = margins.left;
          currentMaxWidth = margins.contentWidth;
        }
      } else {
        // Fallback to simple page addition if no callback provided
        pdf.addPage();
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
    const indentation = calculateParagraphIndentation(
      isFirstLineOfParagraph,
      shouldIndentFirstLine,
      fontSize,
      currentMaxWidth,
      x,
      pdf
    );
    const availableWidth = indentation.availableWidth;

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
    // Calculate indentation for the final line
    const indentation = calculateParagraphIndentation(
      isFirstLineOfParagraph,
      shouldIndentFirstLine,
      fontSize,
      currentMaxWidth,
      x,
      pdf
    );
    const { availableWidth, lineStartX } = indentation;

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

// Helper function to calculate paragraph indentation settings
function calculateParagraphIndentation(
  isFirstLineOfParagraph,
  shouldIndentFirstLine,
  fontSize,
  maxWidth,
  startX,
  pdf
) {
  if (isFirstLineOfParagraph && shouldIndentFirstLine) {
    // Measure actual width of 2 em-dashes using the PDF's text measurement
    const emDashString = '——'; // 2 em-dashes
    const indentAmount = pdf.getTextWidth(emDashString);
    return {
      indentAmount,
      availableWidth: maxWidth - indentAmount,
      lineStartX: startX + indentAmount
    };
  }

  return {
    indentAmount: 0,
    availableWidth: maxWidth,
    lineStartX: startX
  };
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
  wordObjects.forEach((wordObj, wordIndex) => {
    const fontStyle = getFontStyle(wordObj.type);
    const wordFontSize = getFontSize(wordObj.type, baseFontSize);
    pdf.setFont(pdfFont, fontStyle);
    pdf.setFontSize(wordFontSize);

    totalWordWidth += pdf.getTextWidth(wordObj.text);
    // Count spaces that will actually be rendered (not before first word)
    if (wordObj.needsSpace && wordIndex > 0) {
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

  // Render each word with proper formatting
  let currentX;
  if (textAlign === 'center') {
    // Calculate starting position for center alignment only
    const totalContentWidth = totalWordWidth + totalSpaces * spaceWidth;
    // Only center if content fits within the available width, otherwise left-align
    if (totalContentWidth <= maxWidth) {
      currentX = x + (maxWidth - totalContentWidth) / 2;
    } else {
      currentX = x; // If content is too wide, fall back to left-align
    }
  } else {
    // For all other alignments (left, justified), use original position directly
    currentX = x;
  }
  let lastFontStyle = null;
  let lastFontSize = null;

  wordObjects.forEach((wordObj, wordIndex) => {
    // Fix: First word of any line should never have space added before it
    if (wordIndex === 0) {
      wordObj.needsSpace = false;
    }
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

// Create manuscript-style title page
function createManuscriptTitlePage(pdf, book, pageWidth, pageHeight, pdfFont) {
  const margins = {
    top: 72, // 1 inch
    bottom: 72, // 1 inch
    left: 72, // 1 inch
    right: 72 // 1 inch
  };

  const contentWidth = pageWidth - margins.left - margins.right;
  let currentY = margins.top;

  // Contact information in top left corner
  pdf.setFont(pdfFont, 'normal');
  pdf.setFontSize(12);

  const contactInfo = [
    book.author || '[Author Name]',
    '[Address]',
    '[City, State ZIP]',
    '[Phone Number]',
    '[Email Address]'
  ];

  contactInfo.forEach(line => {
    safeText(pdf, line, margins.left, currentY);
    currentY += 18; // 1.5 line spacing
  });

  // Word count in top right corner
  const wordCount = book.chapters.reduce(
    (total, chapter) =>
      total +
      chapter.scenes.reduce(
        (chapterTotal, scene) =>
          chapterTotal +
          (scene.content || '').split(/\s+/).filter(word => word.length > 0)
            .length,
        0
      ),
    0
  );

  const wordCountText = `Approximately ${Math.round(wordCount / 250) * 250} words`;
  const wordCountWidth = pdf.getTextWidth(wordCountText);
  safeText(
    pdf,
    wordCountText,
    pageWidth - margins.right - wordCountWidth,
    margins.top
  );

  // Title centered on page (about 1/3 down)
  currentY = margins.top + (pageHeight - margins.top - margins.bottom) * 0.33;

  pdf.setFont(pdfFont, 'normal');
  pdf.setFontSize(14);

  if (book.title) {
    const titleLines = pdf.splitTextToSize(
      book.title.toUpperCase(),
      contentWidth
    );
    titleLines.forEach(line => {
      const lineWidth = pdf.getTextWidth(line);
      const centerX = margins.left + (contentWidth - lineWidth) / 2;
      safeText(pdf, line, centerX, currentY);
      currentY += 21; // 1.5 line spacing
    });
  }

  // "by" and author name
  currentY += 36; // Extra space before author
  if (book.author) {
    const byAuthorText = `by\n\n${book.author.toUpperCase()}`;
    const byAuthorLines = byAuthorText.split('\n');

    byAuthorLines.forEach(line => {
      if (line.trim()) {
        const lineWidth = pdf.getTextWidth(line);
        const centerX = margins.left + (contentWidth - lineWidth) / 2;
        safeText(pdf, line, centerX, currentY);
      }
      currentY += 21;
    });
  }

  // Note: Manuscript title page is auto-generated with standard placeholders
  // Users can manually edit contact information in the exported PDF if needed
}

export async function exportToManuscriptPDF(book, options = {}) {
  try {
    // Get selected manuscript page size (default to A4)
    const pageSize = options.manuscriptPageSize || 'a4';

    // Set margins based on page size
    const margins =
      pageSize === 'a4'
        ? {
            top: 0.98, // 25mm
            bottom: 0.98, // 25mm
            left: 1.18, // 30mm (slightly larger for binding)
            right: 0.98 // 25mm
          }
        : {
            top: 1,
            bottom: 1,
            left: 1.25, // Larger left margin for binding
            right: 1
          };

    // Rigid manuscript-specific settings (ignore all template preferences)
    const manuscriptTemplate = {
      pageSize: pageSize, // Use selected page size
      fontFamily: 'Times New Roman', // Standard manuscript font
      fontSize: 12, // Standard manuscript font size
      lineHeight: 2.0, // Double-spaced
      textAlign: 'left', // Left-aligned, not justified
      paragraphStyle: 'indented', // First-line indent
      pageMargins: margins,
      mirrorMargins: false, // No mirror margins for manuscripts
      chapterHeader: {
        style: 'both', // Chapter number and title
        pageBreak: true, // Chapters start on new pages (manuscript standard)
        startOnRightPage: false, // No concept of left/right in manuscripts
        alignment: 'center', // Centered for manuscripts
        fontSize: 12, // Same as body text
        fontWeight: 'normal', // Not bold
        spacing: 3, // Triple-spaced after header for better readability
        lineBreaksBefore: 0 // Chapter title starts at top of page, not 1/3 down
      },
      runningHeaders: {
        enabled: true,
        alignment: 'outside',
        skipChapterPages: false // Include on all pages for manuscripts
      },
      writingType: 'prose' // Force prose formatting
    };

    const manuscriptOptions = {
      ...options,
      template: manuscriptTemplate,
      isManuscript: true
    };

    // Create PDF with manuscript formatting
    const pdf = createPDFWithConsistentFormat(pageSize);
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    // Set manuscript font
    const pdfFont = 'times'; // Times New Roman equivalent
    pdf.setFont(pdfFont, 'normal');

    // Create manuscript title page
    createManuscriptTitlePage(pdf, book, pageWidth, pageHeight, pdfFont);

    // No blank page - manuscripts don't have blank pages
    // Content starts immediately on page 2

    // Continue with regular content export using manuscript template
    return await exportToPDFInternal(book, manuscriptOptions, pdf);
  } catch (error) {
    console.error('Manuscript PDF export failed:', error);
    throw error;
  }
}

export async function exportToPDF(book, options = {}) {
  return await exportToPDFInternal(book, options);
}

async function exportToPDFInternal(book, options = {}, existingPdf = null) {
  const { template } = options;

  try {
    // Use existing PDF if provided (for manuscript format), otherwise create new
    const pdf =
      existingPdf ||
      createPDFWithConsistentFormat(template.pageSize || 'letter');

    // Get the actual page dimensions in points
    const actualPageSize = pdf.internal.pageSize;
    const pageWidth = actualPageSize.width;
    const pageHeight = actualPageSize.height;

    // PROACTIVE ILLUSTRATION SYSTEM - Reserve illustration pages before any content processing
    const illustrationPages = new Set();
    const sortedIllustrations = (book.illustrations || [])
      .filter(ill => ill.pageNumber !== null && ill.imageData)
      .sort((a, b) => a.pageNumber - b.pageNumber);

    // Reserve all illustration page numbers
    sortedIllustrations.forEach(illustration => {
      illustrationPages.add(illustration.pageNumber);
    });

    // Debug logging for illustration page reservation
    if (sortedIllustrations.length > 0) {
      console.log(
        'Reserved illustration pages:',
        Array.from(illustrationPages).sort((a, b) => a - b)
      );
    }

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
        // Page size matches expected dimensions - no action needed
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

    // Track logical page numbers vs physical PDF pages for illustration system
    let logicalPageNumber = 1; // The page number content "thinks" it's on
    const logicalToPhysicalPageMap = new Map(); // Maps logical page -> physical PDF page
    const physicalToLogicalPageMap = new Map(); // Maps physical PDF page -> logical page

    // Track chapter opening pages and blank pages during generation
    const chapterOpeningPages = new Set(); // Uses physical page numbers
    const blankPages = new Set(); // Uses physical page numbers

    // Function to advance to next logical page, handling illustration page insertions
    const advanceToNextLogicalPage = () => {
      logicalPageNumber++;

      // Check if this logical page is reserved for an illustration
      while (illustrationPages.has(logicalPageNumber)) {
        const currentLogicalPage = logicalPageNumber; // Capture for closure
        // Debug: Log illustration insertion
        console.log(
          `Inserting illustration at logical page ${currentLogicalPage}`
        );

        // Find the illustration for this page
        const illustration = sortedIllustrations.find(
          ill => ill.pageNumber === currentLogicalPage
        );
        if (illustration) {
          // Add new physical page for the illustration
          pdf.addPage();
          const physicalPageNum = pdf.internal.getNumberOfPages();

          // Update page mappings
          logicalToPhysicalPageMap.set(currentLogicalPage, physicalPageNum);
          physicalToLogicalPageMap.set(physicalPageNum, currentLogicalPage);

          // Insert the illustration on this page
          insertIllustrationOnCurrentPage(illustration);

          // Continue to next logical page
          logicalPageNumber++;
        } else {
          // Safety break if illustration not found
          console.error(
            `Illustration not found for reserved page ${currentLogicalPage}`
          );
          break;
        }
      }

      // Add regular content page
      pdf.addPage();
      const physicalPageNum = pdf.internal.getNumberOfPages();
      logicalToPhysicalPageMap.set(logicalPageNumber, physicalPageNum);
      physicalToLogicalPageMap.set(physicalPageNum, logicalPageNumber);

      updateMarginsForPage();
      currentY = topMargin;
    };

    // Function to insert illustration on the current page
    const insertIllustrationOnCurrentPage = illustration => {
      try {
        const pageMargins = getPageMargins(
          template,
          pdf.internal.getNumberOfPages()
        );
        const illustrationWidth =
          pageWidth - pageMargins.left - pageMargins.right;
        const maxIllustrationHeight =
          pageHeight - pageMargins.top - pageMargins.bottom;

        // Use 80% of available space for the illustration (leave some margin)
        const finalWidth = illustrationWidth * 0.8;
        const finalHeight = maxIllustrationHeight * 0.8;

        // Center the illustration on the page
        const illustrationX =
          pageMargins.left + (illustrationWidth - finalWidth) / 2;
        const illustrationY =
          pageMargins.top + (maxIllustrationHeight - finalHeight) / 2;

        // Add the image - jsPDF will handle aspect ratio automatically when we specify both width and height
        pdf.addImage(
          illustration.imageData,
          'JPEG',
          illustrationX,
          illustrationY,
          finalWidth,
          finalHeight
        );

        // Add caption if present
        if (illustration.caption && illustration.caption.trim()) {
          const captionY = illustrationY + finalHeight + 20; // 20pt below image
          if (captionY + 30 < pageHeight - pageMargins.bottom) {
            // Ensure caption fits
            pdf.setFont(mapFontForPDF(template.fontFamily), 'italic');
            pdf.setFontSize(template.fontSize * 0.8);

            const captionLines = pdf.splitTextToSize(
              illustration.caption.trim(),
              illustrationWidth
            );
            let currentCaptionY = captionY;

            captionLines.forEach(line => {
              const lineWidth = pdf.getTextWidth(line);
              const centerX =
                pageMargins.left + (illustrationWidth - lineWidth) / 2;
              safeText(pdf, line, centerX, currentCaptionY);
              currentCaptionY += template.fontSize * template.lineHeight * 0.8;
            });
          }
        }

        // Success: Log illustration completion
        console.log(
          `✓ Illustration inserted on logical page ${illustration.pageNumber} (physical page ${pdf.internal.getNumberOfPages()})`
        );
      } catch (error) {
        console.error('Error inserting illustration:', error);
      }
    };

    // Function to mark a page as a chapter opening (uses physical page numbers)
    const markChapterPage = () => {
      const currentPageNumber = pdf.internal.getNumberOfPages();
      chapterOpeningPages.add(currentPageNumber);
    };

    // Function to mark a page as blank (uses physical page numbers)
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

    // Title Page (skip for manuscript format as it has its own)
    const isManuscript = options.isManuscript;
    const hasTitlePage =
      !isManuscript &&
      ((book.title && book.title.trim()) ||
        (book.author && book.author.trim()));
    if (hasTitlePage) {
      // Initialize page mapping for title page (page 1)
      const titlePhysicalPage = pdf.internal.getNumberOfPages();
      logicalToPhysicalPageMap.set(1, titlePhysicalPage);
      physicalToLogicalPageMap.set(titlePhysicalPage, 1);

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

      // Advance to next logical page for content using the new system
      advanceToNextLogicalPage();

      // If chapters start on new pages, this page will become blank, so mark it
      if (template.chapterHeader.pageBreak) {
        markBlankPage();
      }
    } else {
      // No title page or manuscript format - initialize logical page 1 as the first physical page
      if (isManuscript) {
        // For manuscript, title page is unnumbered, content starts at page 1
        // Physical page 1 = title page (no logical page number)
        // Physical page 2 = content page 1
        logicalPageNumber = 0; // Will be incremented to 1 when content starts
      } else {
        logicalToPhysicalPageMap.set(1, 1);
        physicalToLogicalPageMap.set(1, 1);
      }
    }

    // Set content font
    pdf.setFontSize(fontSize);
    pdf.setFont(pdfFont, 'normal');

    // Front Matter Processing
    if (book.frontMatter && book.frontMatter.length > 0) {
      const { sortFrontMatter } = await import('./frontMatterUtils');
      const sortedFrontMatter = sortFrontMatter(book.frontMatter);
      sortedFrontMatter.forEach(frontMatterItem => {
        if (
          !frontMatterItem.enabled ||
          !frontMatterItem.content ||
          !frontMatterItem.content.trim()
        ) {
          return; // Skip disabled or empty front matter items
        }

        // Handle different front matter for different formats
        if (isManuscript) {
          // Manuscript: only include prologue (content part of the book)
          if (frontMatterItem.type !== 'prologue') {
            return;
          }
        } else {
          // Print-ready: include all front matter except manuscript-title
          if (frontMatterItem.type === 'manuscript-title') {
            return;
          }
        }

        // Use the new page advancement system for front matter
        advanceToNextLogicalPage();

        // Force front matter to start on right-hand (odd) page if needed (not for manuscripts)
        if (!isManuscript) {
          const currentPhysicalPageNumber = pdf.internal.getNumberOfPages();
          if (currentPhysicalPageNumber % 2 === 0) {
            markBlankPage(); // Mark current page as blank
            advanceToNextLogicalPage(); // Add the actual front matter page
          }
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
              advanceToNextLogicalPage();
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
                  advanceToNextLogicalPage();
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
                advanceToNextLogicalPage();
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
                advanceToNextLogicalPage();
                markFrontMatterPage();
                break; // Stop adding line breaks if we hit a new page
              }
            }

            // Check if we need a new page for the front matter header
            if (
              currentY + template.chapterHeader.fontSize * 2 >
              pageHeight - bottomMargin
            ) {
              advanceToNextLogicalPage();
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
                  advanceToNextLogicalPage();
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
                    advanceToNextLogicalPage();
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
                        advanceToNextLogicalPage();
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
                    advanceToNextLogicalPage();
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

    // Helper function to convert numbers to words for manuscript format
    const numberToWord = num => {
      const words = [
        '',
        'ONE',
        'TWO',
        'THREE',
        'FOUR',
        'FIVE',
        'SIX',
        'SEVEN',
        'EIGHT',
        'NINE',
        'TEN',
        'ELEVEN',
        'TWELVE',
        'THIRTEEN',
        'FOURTEEN',
        'FIFTEEN',
        'SIXTEEN',
        'SEVENTEEN',
        'EIGHTEEN',
        'NINETEEN',
        'TWENTY',
        'TWENTY-ONE',
        'TWENTY-TWO',
        'TWENTY-THREE',
        'TWENTY-FOUR',
        'TWENTY-FIVE',
        'TWENTY-SIX',
        'TWENTY-SEVEN',
        'TWENTY-EIGHT',
        'TWENTY-NINE',
        'THIRTY'
      ];
      return words[num] || `${num}`; // Fallback to number if beyond 30
    };

    // Helper function to generate chapter header text
    const generateChapterHeader = (chapter, chapterNumber) => {
      if (isManuscript) {
        // Manuscript format: "CHAPTER ONE" on first line, then blank line, then title on separate line
        const chapterWord = numberToWord(chapterNumber);
        const chapterNumberLine = `CHAPTER ${chapterWord}`;

        if (chapter.title && chapter.title.trim()) {
          // Chapter number, blank line, then title in caps
          return `${chapterNumberLine}\n\n${chapter.title.toUpperCase()}`;
        } else {
          // Just chapter number
          return chapterNumberLine;
        }
      }

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
          // Add part page using the new system
          advanceToNextLogicalPage();

          // Force part to start on right-hand (odd) page (not for manuscripts)
          if (!isManuscript) {
            const currentPageNumber = pdf.internal.getNumberOfPages();
            if (currentPageNumber % 2 === 0) {
              markBlankPage(); // Mark current page as blank
              advanceToNextLogicalPage(); // Add the actual part page
            }
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

          // Add blank page after part page so first chapter starts on odd page (not for manuscripts)
          if (!isManuscript) {
            advanceToNextLogicalPage();
            markBlankPage();
          }

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
          advanceToNextLogicalPage();

          // Force chapter to start on right-hand (odd) page if requested (not for manuscripts)
          if (!isManuscript && template.chapterHeader.startOnRightPage) {
            const currentPageNumber = pdf.internal.getNumberOfPages();

            // If current page is even (left-hand), mark it as blank and add a page for the chapter
            if (currentPageNumber % 2 === 0) {
              markBlankPage(); // Mark current page as blank
              advanceToNextLogicalPage(); // Add the actual chapter page
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
              advanceToNextLogicalPage();
              break; // Stop adding line breaks if we hit a new page
            }
          }
        }

        // Check if we need a new page for the chapter header
        if (
          currentY + template.chapterHeader.fontSize * 2 >
          pageHeight - bottomMargin
        ) {
          advanceToNextLogicalPage();
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
            advanceToNextLogicalPage();
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
                      advanceToNextLogicalPage();
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
                      () => {
                        advanceToNextLogicalPage();
                        return {
                          left: leftMargin,
                          right: rightMargin,
                          top: topMargin,
                          bottom: bottomMargin,
                          contentWidth: contentWidth
                        };
                      },
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
                  advanceToNextLogicalPage();
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
                  () => {
                    advanceToNextLogicalPage();
                    return {
                      left: leftMargin,
                      right: rightMargin,
                      top: topMargin,
                      bottom: bottomMargin,
                      contentWidth: contentWidth
                    };
                  },
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
                  advanceToNextLogicalPage();
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
                  () => {
                    advanceToNextLogicalPage();
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
          }
        }

        // Add scene break if requested and not the last scene in this chapter
        if (
          options.includeSceneBreaks &&
          sceneIndex < chapter.scenes.length - 1
        ) {
          // Check if we're near the bottom of the page (within 3 lines)
          const nearBottomOfPage =
            currentY + lineHeight * 3 > pageHeight - bottomMargin;

          if (nearBottomOfPage) {
            // Near end of page: add scene delimiter and force page break
            currentY += lineHeight;

            const sceneBreak = '* * *';
            const breakWidth = pdf.getTextWidth(sceneBreak);
            const breakX = (pageWidth - breakWidth) / 2;
            safeText(pdf, sceneBreak, breakX, currentY);

            // Force new page for next scene
            advanceToNextLogicalPage();
          } else {
            // Middle of page: just add blank line
            currentY += lineHeight * 2; // One blank line (double-spaced)
          }
        }
      });
    }

    // Back Matter Processing
    if (book.backMatter && book.backMatter.length > 0) {
      const { sortBackMatter } = await import('./frontMatterUtils');
      const sortedBackMatter = sortBackMatter(book.backMatter);
      sortedBackMatter.forEach(backMatterItem => {
        if (
          !backMatterItem.enabled ||
          (!backMatterItem.content && !backMatterItem.imageData)
        ) {
          return; // Skip disabled or empty back matter items
        }

        // Use the new page advancement system for back matter
        advanceToNextLogicalPage();

        // Force back matter to start on right-hand (odd) page (not for manuscripts)
        if (!isManuscript) {
          const currentPageNumber = pdf.internal.getNumberOfPages();
          if (currentPageNumber % 2 === 0) {
            markBlankPage(); // Mark current page as blank
            advanceToNextLogicalPage(); // Add the actual back matter page
          }
        }

        // Mark this as back matter page
        const markBackMatterPage = () => {
          const pageNumber = pdf.internal.getNumberOfPages();
          blankPages.delete(pageNumber); // Remove from blank pages if it was marked as such
        };
        markBackMatterPage();

        // Add heading for back matter items
        if (backMatterItem.title) {
          // Add line breaks before back matter header (similar to chapter headers)
          const lineBreaksBefore = template.chapterHeader.lineBreaksBefore || 0;
          for (let i = 0; i < lineBreaksBefore; i++) {
            currentY += lineHeight;
            // Check if we need a new page
            if (
              currentY + template.chapterHeader.fontSize * 2 >
              pageHeight - bottomMargin
            ) {
              advanceToNextLogicalPage();
              markBackMatterPage();
              break; // Stop adding line breaks if we hit a new page
            }
          }

          // Check if we need a new page for the back matter header
          if (
            currentY + template.chapterHeader.fontSize * 2 >
            pageHeight - bottomMargin
          ) {
            advanceToNextLogicalPage();
            markBackMatterPage();
          }

          // Render back matter header
          pdf.setFont(pdfFont, template.chapterHeader.fontWeight);
          pdf.setFontSize(template.chapterHeader.fontSize);

          const backMatterHeaderLines = pdf.splitTextToSize(
            backMatterItem.title,
            contentWidth
          );

          backMatterHeaderLines.forEach((line, _lineIndex) => {
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

          // Add spacing after back matter header
          currentY +=
            template.chapterHeader.fontSize *
            (template.chapterHeader.spacing - 1.2);

          // Reset to content font
          pdf.setFont(pdfFont, 'normal');
          pdf.setFontSize(fontSize);
        }

        // Handle different types of back matter content
        if (backMatterItem.imageData) {
          // Handle image-based back matter (like author photos)
          try {
            const imgWidth = contentWidth * 0.6; // Use 60% of content width
            const imgHeight = imgWidth * 0.75; // Assume 4:3 aspect ratio, can be adjusted

            // Check if image fits on current page
            if (currentY + imgHeight > pageHeight - bottomMargin) {
              advanceToNextLogicalPage();
              markBackMatterPage();
            }

            // Center the image horizontally
            const imgX = leftMargin + (contentWidth - imgWidth) / 2;

            pdf.addImage(
              backMatterItem.imageData,
              'JPEG',
              imgX,
              currentY,
              imgWidth,
              imgHeight
            );

            currentY += imgHeight + lineHeight;

            // Add image description if there's text content
            if (backMatterItem.content && backMatterItem.content.trim()) {
              currentY += lineHeight; // Extra space before caption

              const paragraphs = backMatterItem.content
                .split('\n')
                .filter(p => p.trim());

              paragraphs.forEach((paragraph, paragraphIndex) => {
                if (paragraph.trim()) {
                  // Check if we need a new page
                  if (currentY + lineHeight > pageHeight - bottomMargin) {
                    advanceToNextLogicalPage();
                    markBackMatterPage();
                  }

                  // Parse markdown BEFORE any text processing
                  const segments = parseMarkdownForPDF(paragraph.trim());

                  // Render the formatted text with center alignment for captions
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
                      advanceToNextLogicalPage();
                      markBackMatterPage();
                      return {
                        left: leftMargin,
                        right: rightMargin,
                        top: topMargin,
                        bottom: bottomMargin,
                        contentWidth: contentWidth
                      };
                    },
                    'center', // Center-align image captions
                    paragraphIndex === 0, // isFirstParagraph
                    'separated', // Use separated style for back matter
                    pdfFont
                  );

                  currentY = newY + lineHeight;

                  // Add paragraph spacing
                  currentY += lineHeight * 0.5;
                }
              });
            }
          } catch (error) {
            console.error('Error adding back matter image:', error);
            // Fall back to text content if image fails
            if (backMatterItem.content && backMatterItem.content.trim()) {
              const segments = parseMarkdownForPDF(backMatterItem.content);
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
                  advanceToNextLogicalPage();
                  markBackMatterPage();
                  return {
                    left: leftMargin,
                    right: rightMargin,
                    top: topMargin,
                    bottom: bottomMargin,
                    contentWidth: contentWidth
                  };
                },
                'left',
                true,
                'separated',
                pdfFont
              );
              currentY = newY + lineHeight;
            }
          }
        } else if (backMatterItem.content && backMatterItem.content.trim()) {
          // Handle text-based back matter
          const paragraphs = backMatterItem.content
            .split('\n')
            .filter(p => p.trim());

          paragraphs.forEach((paragraph, paragraphIndex) => {
            if (paragraph.trim()) {
              // Check if we need a new page
              if (currentY + lineHeight > pageHeight - bottomMargin) {
                advanceToNextLogicalPage();
                markBackMatterPage();
              }

              // Parse markdown BEFORE any text processing
              const segments = parseMarkdownForPDF(paragraph.trim());

              // Use different alignment based on back matter type
              let textAlign = 'justified';
              if (backMatterItem.type === 'about-author') {
                textAlign = 'left'; // Author bios are typically left-aligned
              } else if (backMatterItem.type === 'acknowledgments') {
                textAlign = 'justified'; // Acknowledgments can be justified
              }

              // Render the formatted text with appropriate styling
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
                  advanceToNextLogicalPage();
                  markBackMatterPage();
                  return {
                    left: leftMargin,
                    right: rightMargin,
                    top: topMargin,
                    bottom: bottomMargin,
                    contentWidth: contentWidth
                  };
                },
                textAlign,
                paragraphIndex === 0, // isFirstParagraph
                'separated', // Use separated style for back matter readability
                pdfFont
              );

              currentY = newY + lineHeight;

              // Add paragraph spacing
              currentY += lineHeight * 0.5;
            }
          });
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

      // Add running headers (now including illustration pages)
      // For manuscripts, skip title page (page 1)
      const skipManuscriptTitlePage = isManuscript && i === 1;

      if (
        template.runningHeaders?.enabled &&
        !isFirstPage &&
        !isChapterPage &&
        !isBlankPage &&
        !skipManuscriptTitlePage
      ) {
        const pageMargins = getPageMargins(template, i);
        const pageContentWidth =
          pageWidth - pageMargins.left - pageMargins.right;
        const isLeftPage = i % 2 === 0;

        // Determine header text
        let headerText;
        if (isManuscript) {
          // Manuscript format: Author last name / Title / Page number (right-aligned)
          const authorLastName = book.author
            ? book.author.split(' ').pop()
            : 'Author';
          const shortTitle =
            book.title && book.title.length > 30
              ? book.title.substring(0, 27) + '...'
              : book.title || 'Title';
          // For manuscripts, page numbering starts at 1 for first content page (physical page 2)
          const manuscriptPageNum = i - 1; // Physical page 2 becomes page 1, etc.
          headerText = `${authorLastName} / ${shortTitle} / ${manuscriptPageNum}`;
        } else {
          headerText = isLeftPage ? book.author : book.title;
        }

        if (headerText) {
          // For manuscripts, running headers are same size as body text; otherwise proportional
          const runningHeaderSize = isManuscript
            ? fontSize
            : Math.max(8, Math.min(12, fontSize * 0.75));
          pdf.setFontSize(runningHeaderSize);
          pdf.setFont(pdfFont, 'normal');

          const headerWidth = pdf.getTextWidth(headerText);
          let headerX;

          if (isManuscript) {
            // Manuscript: always right-aligned
            headerX = pageMargins.left + pageContentWidth - headerWidth;
          } else if (template.runningHeaders?.alignment === 'center') {
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

      // Add page numbers (skip on title page and skip for manuscript format since it's in header)
      if (!(i === 1 && hasTitlePage) && !isManuscript) {
        // Use logical page number for display, but physical page for positioning
        const logicalPageNum = physicalToLogicalPageMap.get(i) || i;

        // Show page numbers on all pages including illustration pages
        {
          // For manuscripts, page numbers are same size as body text; otherwise proportional
          const pageNumberSize = isManuscript
            ? fontSize
            : Math.max(8, Math.min(11, fontSize * 0.7));
          pdf.setFontSize(pageNumberSize);
          pdf.setFont(pdfFont, 'normal');
          const pageNumberText = logicalPageNum.toString();
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
    }

    // Save the PDF with proper error handling
    const filename = isManuscript
      ? `${book.title || 'Manuscript'}-Manuscript.pdf`
      : `${book.title || 'Book'}.pdf`;

    // Check if we're in Electron environment and use native save dialog
    const isElectron =
      typeof window !== 'undefined' && typeof window.require === 'function';

    if (isElectron) {
      try {
        const electron = window.require('electron');
        const { ipcRenderer } = electron;

        // Get PDF as data URL for Electron save
        const pdfDataUrl = pdf.output('dataurlstring');

        // Use Electron's native save dialog (this will appear on top)
        const result = await ipcRenderer.invoke(
          'save-pdf-dialog',
          pdfDataUrl,
          filename
        );

        if (result.success) {
          console.log(`✓ PDF export complete: ${result.filePath}`);

          // Show success notification
          ipcRenderer.send('show-notification', {
            title: 'Export Complete',
            body: result.message
          });
        } else if (result.message === 'Save was cancelled') {
          // User canceled the save dialog - this is intentional, not an error
          console.log('PDF export canceled by user');
          return; // Exit without fallback
        } else {
          throw new Error(result.error || result.message || 'Save failed');
        }
      } catch (electronError) {
        console.warn(
          'Electron save failed, falling back to browser save:',
          electronError
        );

        // Check for potential file access issues
        const accessCheck = checkFileAccess(filename);
        if (accessCheck.warning) {
          console.warn(accessCheck.message);
        }

        // Fallback to browser save
        pdf.save(filename);
      }
    } else {
      // Browser environment - use original method
      // Check for potential file access issues
      const accessCheck = checkFileAccess(filename);
      if (accessCheck.warning) {
        console.warn(accessCheck.message);
      }

      pdf.save(filename);
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
