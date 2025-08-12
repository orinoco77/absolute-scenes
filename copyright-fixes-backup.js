// Copyright processing fixes - backup for restoration after parts implementation

// 1. Center alignment support in renderMixedFormattedLine function (around line 541):
/*
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
*/

// 2. Preserve center alignment for final lines (around line 451):
/*
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
*/

// 3. Copyright text processing with proper wrapping and centering (around lines 979-1005):
/*
          if (frontMatterItem.type === 'copyright') {
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
*/

// Key fixes implemented:
// 1. Added center alignment support to renderMixedFormattedLine function
// 2. Preserved center alignment for final lines of paragraphs 
// 3. Used pdf.splitTextToSize() for proper text wrapping in copyright pages
// 4. Centered each wrapped line individually
// 5. Preserved original line breaks and blank lines in copyright content