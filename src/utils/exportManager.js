import jsPDF from 'jspdf';
import { getPdfFont, getCssFontFamily } from './fontManager';
import { ensureFontLoaded, preloadBookFonts } from './customFontLoader';

// Page size definitions (width x height in inches)
const PAGE_SIZES = {
  'letter': { width: 8.5, height: 11, name: 'US Letter' },
  'a4': { width: 8.27, height: 11.69, name: 'A4' },
  'digest': { width: 5.5, height: 8.5, name: 'Digest' },
  'trade': { width: 6, height: 9, name: 'Trade Paperback' },
  'mass-market': { width: 4.25, height: 6.87, name: 'Mass Market' },
  'hardcover': { width: 6.14, height: 9.21, name: 'Hardcover' },
  'large-print': { width: 7, height: 10, name: 'Large Print' }
};

// Enhanced font mapping for PDF generation with custom font support
function mapFontForPDF(fontFamily) {
  return getPdfFont(fontFamily);
}

// Get page dimensions for the selected page size
function getPageDimensions(pageSize) {
  const size = PAGE_SIZES[pageSize] || PAGE_SIZES['letter'];
  return {
    width: size.width * 72, // Convert to points (72 points per inch)
    height: size.height * 72,
    widthInches: size.width,
    heightInches: size.height,
    name: size.name
  };
}

// Get margins for a specific page (odd/even)
function getPageMargins(template, pageNumber) {
  const margins = template.pageMargins;
  const topMargin = margins.top * 72;
  const bottomMargin = margins.bottom * 72;
  
  if (template.mirrorMargins) {
    // Use inside/outside margins for book binding
    const insideMargin = (margins.inside || 1.25) * 72;
    const outsideMargin = (margins.outside || 1) * 72;
    
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
    const leftMargin = (margins.left || margins.inside || 1.25) * 72;
    const rightMargin = (margins.right || margins.outside || 1) * 72;
    
    return {
      top: topMargin,
      bottom: bottomMargin,
      left: leftMargin,
      right: rightMargin
    };
  }
}

// Improved markdown parsing utilities
function parseMarkdownToHTML(text) {
  if (!text) return '';
  
  return text
    // Handle headings (must be at start of line)
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    // Handle bold (before italic to avoid conflicts)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Handle italic (only single asterisks not part of bold)
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')
    // Handle remaining single line breaks as <br> (since we're treating each line as a paragraph, we might not need this)
    .replace(/\n/g, '<br>');
}

// Improved markdown parsing for PDF (returns array of text segments with formatting)
function parseMarkdownForPDF(text) {
  if (!text) return [{ type: 'normal', text: '' }];
  
  const segments = [];
  let processedText = text;
  
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
    const isInsideBold = inlineMatches.some(bold => 
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
  const allMatches = [...headingMatches, ...inlineMatches].sort((a, b) => a.start - b.start);
  
  // Remove overlapping matches (priority: headings > bold > italic)
  const filteredMatches = [];
  allMatches.forEach(match => {
    const isOverlapping = filteredMatches.some(existing => {
      return (match.start < existing.end && match.end > existing.start);
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
function renderFormattedTextToPDF(pdf, segments, x, y, maxWidth, fontSize, lineHeight, pageHeight, bottomMargin, topMargin, updateMarginsCallback, textAlign = 'justified', isFirstParagraph = false, paragraphStyle = 'indented', pdfFont = 'times') {
  let currentX = x;
  let currentY = y;
  let currentMaxWidth = maxWidth;
  let isFirstLineOfParagraph = true;
  
  // Apply first-line indent for indented style (except for first paragraph)
  const shouldIndentFirstLine = paragraphStyle === 'indented' && !isFirstParagraph;
  
  segments.forEach(segment => {
    // Set font style based on segment type
    switch (segment.type) {
      case 'bold':
        pdf.setFont(pdfFont, 'bold');
        pdf.setFontSize(fontSize);
        break;
      case 'italic':
        pdf.setFont(pdfFont, 'italic');
        pdf.setFontSize(fontSize);
        break;
      case 'h1':
        pdf.setFont(pdfFont, 'bold');
        pdf.setFontSize(fontSize * 1.8); // 1.8x body text size
        // Headings start on new line
        if (currentX > x) {
          currentY += lineHeight;
          currentX = x;
          isFirstLineOfParagraph = true;
        }
        break;
      case 'h2':
        pdf.setFont(pdfFont, 'bold');
        pdf.setFontSize(fontSize * 1.5); // 1.5x body text size
        // Headings start on new line
        if (currentX > x) {
          currentY += lineHeight;
          currentX = x;
          isFirstLineOfParagraph = true;
        }
        break;
      case 'h3':
        pdf.setFont(pdfFont, 'bold');
        pdf.setFontSize(fontSize * 1.3); // 1.3x body text size
        // Headings start on new line
        if (currentX > x) {
          currentY += lineHeight;
          currentX = x;
          isFirstLineOfParagraph = true;
        }
        break;
      default:
        pdf.setFont(pdfFont, 'normal');
        pdf.setFontSize(fontSize);
    }
    
    // Handle line breaks in the text
    const lines = segment.text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      // Since we're now treating each input line as a paragraph, we don't need to add line breaks here
      // Just process the line as a continuous text segment
      if (lineIndex > 0) {
        // This shouldn't happen much since we're splitting paragraphs on newlines before calling this function
        // But if it does, treat it as a line break within the same paragraph
        currentY += lineHeight;
        currentX = x;
        isFirstLineOfParagraph = false; // Not first line anymore
        
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
      }
      
      // Split line into words for wrapping and justification
      const words = line.split(' ').filter(word => word.length > 0);
      
      if (words.length === 0) return;
      
      // Process words with justification
      let currentLineWords = [];
      let currentLineWidth = 0;
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordWidth = pdf.getTextWidth(word);
        const spaceWidth = pdf.getTextWidth(' ');
        
        // Determine available width and starting position for this line
        let availableWidth = currentMaxWidth;
        let lineStartX = x;
        
        // Apply indentation only to the first line of the paragraph
        if (isFirstLineOfParagraph && shouldIndentFirstLine) {
          // Make indent proportional to page width (3% of content width for smaller pages, min 24pt, max 48pt)
          const indentAmount = Math.max(24, Math.min(48, currentMaxWidth * 0.03));
          availableWidth -= indentAmount;
          lineStartX += indentAmount;
        }
        
        // Check if adding this word would exceed the available line width
        const wouldExceedWidth = currentLineWords.length > 0 && 
          (currentLineWidth + spaceWidth + wordWidth > availableWidth);
        
        if (wouldExceedWidth) {
          // Render current line
          renderJustifiedLine(pdf, currentLineWords, lineStartX, currentY, availableWidth, textAlign, false);
          
          // Move to next line
          currentY += lineHeight;
          currentX = x;
          isFirstLineOfParagraph = false; // No longer first line
          
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
          
          // Start new line with current word
          currentLineWords = [word];
          currentLineWidth = wordWidth;
        } else {
          // Add word to current line
          currentLineWords.push(word);
          currentLineWidth += (currentLineWords.length > 1 ? spaceWidth : 0) + wordWidth;
        }
      }
      
      // Render any remaining words in the line (last line, no justification)
      if (currentLineWords.length > 0) {
        // Determine starting position for this line
        let lineStartX = x;
        let availableWidth = currentMaxWidth;
        
        // Apply indentation only to the first line of the paragraph
        if (isFirstLineOfParagraph && shouldIndentFirstLine) {
          // Make indent proportional to page width (3% of content width for smaller pages, min 24pt, max 48pt)
          const indentAmount = Math.max(24, Math.min(48, availableWidth * 0.03));
          lineStartX += indentAmount;
          availableWidth -= indentAmount;
        }
        
        renderJustifiedLine(pdf, currentLineWords, lineStartX, currentY, availableWidth, 'left', true); // Last line is always left-aligned
        currentX = lineStartX + currentLineWidth;
        isFirstLineOfParagraph = false; // No longer first line
      }
    });
    
    // For headings, add extra space after
    if (segment.type.startsWith('h')) {
      currentY += lineHeight * 0.5;
    }
  });
  
  return currentY;
}

// Helper function to render a justified line of text
function renderJustifiedLine(pdf, words, x, y, maxWidth, textAlign, isLastLine) {
  if (words.length === 0) return;
  
  // Calculate total width of words without spaces
  const totalWordWidth = words.reduce((total, word) => total + pdf.getTextWidth(word), 0);
  const standardSpaceWidth = pdf.getTextWidth(' ');
  
  if (textAlign === 'justified' && words.length > 1 && !isLastLine) {
    // Justified text: distribute extra space evenly between words
    const totalSpaceAvailable = maxWidth - totalWordWidth;
    const spacesNeeded = words.length - 1;
    const spaceWidth = spacesNeeded > 0 ? totalSpaceAvailable / spacesNeeded : standardSpaceWidth;
    
    let currentX = x;
    words.forEach((word, index) => {
      pdf.text(word, currentX, y);
      currentX += pdf.getTextWidth(word);
      if (index < words.length - 1) {
        currentX += spaceWidth;
      }
    });
  } else {
    // Left-aligned text: use standard spacing
    let currentX = x;
    words.forEach((word, index) => {
      pdf.text(word, currentX, y);
      currentX += pdf.getTextWidth(word);
      if (index < words.length - 1) {
        currentX += standardSpaceWidth;
      }
    });
  }
}

export async function exportToPDF(book, options = {}) {
  const { template } = options;
  
  // Get page dimensions for the selected page size
  const pageDimensions = getPageDimensions(template.pageSize || 'letter');
  const pageWidth = pageDimensions.width;
  const pageHeight = pageDimensions.height;
  
  // Create PDF with custom page size
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [pageWidth, pageHeight]
  });
  
  // Get initial margins for page 1
  let currentPageMargins = getPageMargins(template, 1);
  let leftMargin = currentPageMargins.left;
  let rightMargin = currentPageMargins.right;
  let topMargin = currentPageMargins.top;
  let bottomMargin = currentPageMargins.bottom;
  let contentWidth = pageWidth - leftMargin - rightMargin;
  
  // Set font using enhanced font mapping
  const pdfFont = mapFontForPDF(template.fontFamily);
  pdf.setFont(pdfFont, 'normal');
  const fontSize = template.fontSize;
  const lineHeight = fontSize * template.lineHeight;
  
  console.log(`Using font: ${template.fontFamily} -> ${pdfFont}`);
  console.log(`Mirror margins enabled: ${template.mirrorMargins}`);
  if (template.mirrorMargins) {
    console.log(`Inside margin: ${template.pageMargins.inside}in, Outside margin: ${template.pageMargins.outside}in`);
  }
  console.log(`Page 1 (initial): Left margin = ${leftMargin/72}in, Right margin = ${rightMargin/72}in`);
  
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
    
    console.log(`Page ${pageNumber}: Left margin = ${leftMargin/72}in, Right margin = ${rightMargin/72}in`);
    
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
  if (book.title || book.author) {
    currentY = pageHeight / 2 - 100; // Center vertically
    
    if (book.title) {
      pdf.setFontSize(24);
      pdf.setFont(pdfFont, 'bold');
      
      // Center the title
      const titleWidth = pdf.getTextWidth(book.title);
      const titleX = (pageWidth - titleWidth) / 2;
      pdf.text(book.title, titleX, currentY);
      currentY += 48; // 2 line spaces
    }
    
    if (book.author) {
      pdf.setFontSize(18);
      pdf.setFont(pdfFont, 'normal');
      
      const authorText = `by ${book.author}`;
      const authorWidth = pdf.getTextWidth(authorText);
      const authorX = (pageWidth - authorWidth) / 2;
      pdf.text(authorText, authorX, currentY);
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
  
  // Process each chapter
  book.chapters.forEach((chapter, chapterIndex) => {
    const chapterNumber = chapterIndex + 1;
    
    // Add chapter header
    if (chapter.title || template.chapterHeader.style !== 'none') {
      // Determine if we need a page break for this chapter
      let shouldAddPageBreak = false;
      
      if (template.chapterHeader.pageBreak) {
        if (chapterIndex === 0) {
          // First chapter: only add page break if no title page, OR if we need right-hand start
          shouldAddPageBreak = !(book.title || book.author) || template.chapterHeader.startOnRightPage;
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
          if (currentY + template.chapterHeader.fontSize * 2 > pageHeight - bottomMargin) {
            pdf.addPage();
            updateMarginsForPage();
            currentY = topMargin;
            break; // Stop adding line breaks if we hit a new page
          }
        }
      }
      
      // Check if we need a new page for the chapter header
      if (currentY + template.chapterHeader.fontSize * 2 > pageHeight - bottomMargin) {
        pdf.addPage();
        updateMarginsForPage();
        currentY = topMargin;
      }
      
      const chapterHeaderText = generateChapterHeader(chapter, chapterNumber);
      
      pdf.setFont(pdfFont, template.chapterHeader.fontWeight);
      pdf.setFontSize(template.chapterHeader.fontSize);
      
      // Split chapter header text to handle long titles
      const chapterHeaderLines = pdf.splitTextToSize(chapterHeaderText, contentWidth);
      
      chapterHeaderLines.forEach((line, lineIndex) => {
        let headerX = leftMargin;
        if (template.chapterHeader.alignment === 'center') {
          const lineWidth = pdf.getTextWidth(line);
          headerX = leftMargin + (contentWidth - lineWidth) / 2;
        } else if (template.chapterHeader.alignment === 'right') {
          const lineWidth = pdf.getTextWidth(line);
          headerX = leftMargin + contentWidth - lineWidth;
        }
        
        pdf.text(line, headerX, currentY);
        currentY += template.chapterHeader.fontSize * 1.2; // Line spacing for chapter headers
      });
      
      // Add spacing after chapter header
      currentY += template.chapterHeader.fontSize * (template.chapterHeader.spacing - 1.2);
      
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
        
        const sceneTitleLines = pdf.splitTextToSize(scene.title, contentWidth);
        sceneTitleLines.forEach(line => {
          pdf.text(line, leftMargin, currentY);
          currentY += lineHeight * 1.2;
        });
        
        currentY += lineHeight * 0.5; // Extra space after title
        pdf.setFont(pdfFont, 'normal');
        pdf.setFontSize(fontSize);
      }
      
      // Process scene content with markdown support
      if (scene.content && scene.content.trim()) {
        // Split on single newlines to create paragraphs (more intuitive for users)
        const paragraphs = scene.content.split('\n').filter(p => p.trim());
        
        paragraphs.forEach((paragraph, paragraphIndex) => {
          const trimmedParagraph = paragraph.trim();
          
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
      
      // Add scene break if requested and not the last scene in this chapter
      if (options.includeSceneBreaks && sceneIndex < chapter.scenes.length - 1) {
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
        pdf.text(sceneBreak, breakX, currentY);
        currentY += lineHeight * 1.5;
      }
    });
  });
  
  // Add page numbers and running headers
  const pageCount = pdf.internal.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    // Skip running headers on title page
    const isFirstPage = i === 1 && (book.title || book.author);
    
    // Skip running headers on chapter pages if requested
    const isChapterPage = template.runningHeaders?.skipChapterPages && chapterOpeningPages.has(i);
    
    // Skip running headers on blank pages
    const isBlankPage = blankPages.has(i);
    
    // Add running headers
    if (template.runningHeaders?.enabled && !isFirstPage && !isChapterPage && !isBlankPage) {
      const pageMargins = getPageMargins(template, i);
      const pageContentWidth = pageWidth - pageMargins.left - pageMargins.right;
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
        pdf.text(headerText, headerX, headerY);
      }
    }
    
    // Add page numbers (skip on title page)
    if (!(i === 1 && (book.title || book.author))) {
      // Make page number font size proportional to body text (70% of body text, min 8pt, max 11pt)
      const pageNumberSize = Math.max(8, Math.min(11, fontSize * 0.7));
      pdf.setFontSize(pageNumberSize);
      pdf.setFont(pdfFont, 'normal');
      const pageNumberText = i.toString();
      const pageNumberWidth = pdf.getTextWidth(pageNumberText);
      
      // Get margins for this specific page
      const pageMargins = getPageMargins(template, i);
      const pageContentWidth = pageWidth - pageMargins.left - pageMargins.right;
      
      // Center page number within content area and respect bottom margin
      const pageNumberX = pageMargins.left + (pageContentWidth - pageNumberWidth) / 2;
      const pageNumberY = pageHeight - pageMargins.bottom + 18; // Position within bottom margin area
      
      pdf.text(pageNumberText, pageNumberX, pageNumberY);
    }
  }
  
  // Save the PDF
  pdf.save(`${book.title || 'Book'}.pdf`);
}

export async function exportToHTML(book, options = {}) {
  const htmlContent = generateHTML(book, options);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${book.title || 'Book'}.html`;
  a.click();
  
  URL.revokeObjectURL(url);
}

function generateHTML(book, options = {}) {
  const { template } = options;
  
  // Use enhanced font system for HTML preview
  const cssFont = getCssFontFamily(template.fontFamily);
  
  // Simple HTML export for web viewing or basic sharing
  const style = `
    <style>
    body {
      font-family: ${cssFont};
      font-size: ${template.fontSize}pt;
      line-height: ${template.lineHeight};
      max-width: 8.5in;
      margin: 1in auto;
      padding: 1in;
      background: white;
    }
    .title-page {
      text-align: center;
      margin-bottom: 2in;
    }
    .title {
      font-size: ${template.fontSize * 2}pt;
      font-weight: bold;
      margin-bottom: 0.5in;
    }
    .author {
      font-size: ${template.fontSize * 1.2}pt;
      margin-bottom: 2in;
    }
    .chapter-header {
      font-size: ${template.chapterHeader.fontSize}pt;
      font-weight: ${template.chapterHeader.fontWeight};
      text-align: ${template.chapterHeader.alignment};
      margin: 2em 0 1em 0;
      page-break-before: always;
    }
    .scene-title {
      font-size: ${template.fontSize + 2}pt;
      font-weight: bold;
      margin: 2em 0 1em 0;
    }
    .scene-break {
      text-align: center;
      margin: 2em 0;
    }
    p {
      ${template.paragraphStyle === 'indented' 
        ? 'text-indent: 3%; margin: 0;' 
        : 'margin: 1em 0; text-indent: 0;'
      }
      text-align: ${template.textAlign === 'left' ? 'left' : 'justify'};
    }
    .first-paragraph {
      text-indent: 0 !important;
    }
    strong { font-weight: bold; }
    em { font-style: italic; }
    h1, h2, h3 { font-weight: bold; margin: 1.5em 0 0.5em 0; }
    h1 { font-size: ${template.fontSize * 1.8}pt; }
    h2 { font-size: ${template.fontSize * 1.5}pt; }
    h3 { font-size: ${template.fontSize * 1.3}pt; }
    </style>
  `;
  
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
  
  let content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${book.title || 'Book'}</title>
      ${style}
    </head>
    <body>
  `;
  
  // Title page
  if (book.title || book.author) {
    content += '<div class="title-page">';
    if (book.title) {
      content += `<div class="title">${book.title}</div>`;
    }
    if (book.author) {
      content += `<div class="author">by ${book.author}</div>`;
    }
    content += '</div>';
  }
  
  // Chapters and content
  book.chapters.forEach((chapter, chapterIndex) => {
    const chapterNumber = chapterIndex + 1;
    
    // Add chapter header
    const chapterHeaderText = generateChapterHeader(chapter, chapterNumber);
    content += `<h1 class="chapter-header">${chapterHeaderText}</h1>`;
    
    // Add scenes
    chapter.scenes.forEach((scene, sceneIndex) => {
      if (options.includeSceneTitles && scene.title) {
        content += `<h2 class="scene-title">${scene.title}</h2>`;
      }
      
      if (scene.content && scene.content.trim()) {
        const paragraphs = scene.content.split('\n').filter(p => p.trim());
        paragraphs.forEach((paragraph, paragraphIndex) => {
          if (paragraph.trim()) {
            // Convert markdown to HTML
            const formattedParagraph = parseMarkdownToHTML(paragraph.trim());
            // Add first-paragraph class to first paragraph in indented style
            const paragraphClass = (template.paragraphStyle === 'indented' && paragraphIndex === 0) ? 
              ' class="first-paragraph"' : '';
            content += `<p${paragraphClass}>${formattedParagraph}</p>`;
          }
        });
      }
      
      // Add scene break if not the last scene in the chapter
      if (options.includeSceneBreaks && sceneIndex < chapter.scenes.length - 1) {
        content += '<div class="scene-break">* * *</div>';
      }
    });
  });
  
  content += '</body></html>';
  return content;
}