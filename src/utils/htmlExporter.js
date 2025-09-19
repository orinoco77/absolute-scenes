import { getCssFontFamily } from './fontManager';

// Improved markdown parsing utilities
function parseMarkdownToHTML(text) {
  if (!text) return '';

  return (
    text
      // Handle headings (must be at start of line)
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      // Handle bold (before italic to avoid conflicts)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Handle italic (only single asterisks not part of bold)
      .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')
      // Handle remaining single line breaks as <br>
      .replace(/\n/g, '<br>')
  );
}

// Verse-specific HTML processing - preserves all whitespace and formatting
function parseVerseToHTML(text) {
  if (!text) return '';

  return (
    text
      // Escape HTML characters but preserve formatting
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Still allow basic markdown formatting in verse
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
  );
  // DON'T convert newlines to <br> - let CSS white-space: pre-wrap handle them
}

export async function exportToHTML(book, options = {}) {
  try {
    const htmlContent = generateHTML(book, options);
    const filename = `${book.title || 'Book'}.html`;

    // Check if we're in Electron environment and use native save dialog
    const isElectron =
      typeof window !== 'undefined' && typeof window.require === 'function';

    if (isElectron) {
      try {
        const electron = window.require('electron');
        const { ipcRenderer } = electron;

        // Use Electron's native save dialog (this will appear on top)
        const result = await ipcRenderer.invoke(
          'save-html-dialog',
          htmlContent,
          filename
        );

        if (result.success) {
          console.log(`✓ HTML export complete: ${result.filePath}`);

          // Show success notification
          ipcRenderer.send('show-notification', {
            title: 'Export Complete',
            body: result.message
          });
          return;
        } else if (result.message === 'Save was cancelled') {
          // User canceled the save dialog - this is intentional, not an error
          console.log('HTML export canceled by user');
          return; // Exit without fallback
        } else {
          throw new Error(result.error || result.message || 'Save failed');
        }
      } catch (electronError) {
        console.warn(
          'Electron save failed, falling back to browser save:',
          electronError
        );
        // Continue to browser fallback below
      }
    }

    // Browser environment or Electron fallback - use original method
    console.log(`Attempting to save HTML: ${filename}`);

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    // Add error handling for the download
    a.addEventListener('error', event => {
      console.error('HTML download failed:', event);
      URL.revokeObjectURL(url);

      const userMessage = `Cannot save HTML file - the file "${filename}" may be open in another application. Please close any browsers or editors showing this file and try again.`;
      alert(`Export Failed\n\n${userMessage}`);
    });

    // Trigger download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up the URL after a delay to allow download to start
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    console.log(`✓ HTML export initiated: ${filename}`);
  } catch (error) {
    console.error('HTML generation failed:', error);

    let userMessage = 'Failed to generate HTML file.';

    if (error.message.includes('Blob') || error.message.includes('URL')) {
      userMessage =
        'HTML generation failed due to browser limitations or insufficient memory.';
    } else {
      userMessage = `HTML generation failed: ${error.message || 'Unknown error'}`;
    }

    alert(`Export Failed\n\n${userMessage}`);
    throw error;
  }
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
      background: var(--color-surface);
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
      ${
        template.writingType === 'verse'
          ? 'white-space: pre-wrap; margin: 0; text-indent: 0; text-align: left;'
          : template.paragraphStyle === 'indented'
            ? 'text-indent: 3%; margin: 0;'
            : 'margin: 1em 0; text-indent: 0;'
      }
      ${template.writingType !== 'verse' ? `text-align: ${template.textAlign === 'left' ? 'left' : 'justify'};` : ''}
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
    .illustration { 
      page-break-before: always; 
      text-align: center; 
      margin: 2em 0;
    }
    .illustration img { 
      max-width: 100%; 
      max-height: 80vh; 
      height: auto; 
    }
    .illustration-caption { 
      font-style: italic; 
      margin-top: 1em; 
      font-size: ${template.fontSize * 0.9}pt; 
    }
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
  const hasHtmlTitlePage =
    (book.title && book.title.trim()) || (book.author && book.author.trim());
  if (hasHtmlTitlePage) {
    content += '<div class="title-page">';
    if (book.title) {
      content += `<div class="title">${book.title}</div>`;
    }
    if (book.author) {
      content += `<div class="author">by ${book.author}</div>`;
    }
    content += '</div>';
  }

  // Front Matter Processing
  if (book.frontMatter && book.frontMatter.length > 0) {
    const { sortFrontMatter } = require('./frontMatterUtils');
    const sortedFrontMatter = sortFrontMatter(book.frontMatter);

    sortedFrontMatter.forEach(frontMatterItem => {
      if (!frontMatterItem.content || !frontMatterItem.content.trim()) {
        return; // Skip empty front matter items
      }

      content += `<div class="front-matter ${frontMatterItem.type}">`;
      if (frontMatterItem.title) {
        content += `<div class="front-matter-title">${frontMatterItem.title}</div>`;
      }

      // Handle different front matter types
      if (frontMatterItem.type === 'map' && frontMatterItem.imageData) {
        content += `<div class="front-matter-map">`;
        content += `<img src="${frontMatterItem.imageData}" alt="${frontMatterItem.title || 'Map'}" />`;
        content += `</div>`;
      } else {
        const formattedContent = parseMarkdownToHTML(
          frontMatterItem.content.trim()
        );
        content += `<div class="front-matter-content">${formattedContent}</div>`;
      }

      content += '</div>';
    });
  }

  // Get sorted illustrations for insertion at specific positions
  const sortedIllustrations = (book.illustrations || [])
    .filter(ill => ill.pageNumber !== null && ill.imageData)
    .sort((a, b) => a.pageNumber - b.pageNumber);

  let illustrationIndex = 0;
  let currentPageEstimate = 1; // Rough estimate of current page

  // Helper function to insert illustrations up to a certain page
  const insertIllustrationsUpToPage = targetPage => {
    while (
      illustrationIndex < sortedIllustrations.length &&
      sortedIllustrations[illustrationIndex].pageNumber <= targetPage
    ) {
      const illustration = sortedIllustrations[illustrationIndex];

      content += '<div class="illustration">';
      content += `<img src="${illustration.imageData}" alt="${illustration.altText || illustration.title || 'Illustration'}" />`;

      if (illustration.caption && illustration.caption.trim()) {
        const formattedCaption = parseMarkdownToHTML(
          illustration.caption.trim()
        );
        content += `<div class="illustration-caption">${formattedCaption}</div>`;
      }

      content += '</div>';
      illustrationIndex++;
      currentPageEstimate++;
    }
  };

  // Chapters and content
  book.chapters.forEach((chapter, chapterIndex) => {
    const chapterNumber = chapterIndex + 1;

    // Insert illustrations that should appear before this chapter
    insertIllustrationsUpToPage(currentPageEstimate + 2);

    // Add chapter header
    const chapterHeaderText = generateChapterHeader(chapter, chapterNumber);
    content += `<h1 class="chapter-header">${chapterHeaderText}</h1>`;
    currentPageEstimate++; // Chapter headers typically start new pages

    // Add scenes
    chapter.scenes.forEach((scene, sceneIndex) => {
      if (options.includeSceneTitles && scene.title) {
        content += `<h2 class="scene-title">${scene.title}</h2>`;
      }

      if (scene.content && scene.content.trim()) {
        if (template.writingType === 'verse') {
          // For verse, preserve all formatting including line breaks and whitespace
          console.log('VERSE MODE: Processing verse content');
          // Handle forced line breaks (preserve them as actual line breaks)
          const contentWithForcedBreaks = scene.content.replace(
            /\n<!--FORCED_BREAK-->\n/g,
            '\n\n'
          );
          const formattedContent = parseVerseToHTML(contentWithForcedBreaks);
          content += `<p>${formattedContent}</p>`;
        } else {
          // For prose, use traditional paragraph handling
          // First handle forced line breaks (preserve them as actual line breaks)
          const contentWithForcedBreaks = scene.content.replace(
            /\n<!--FORCED_BREAK-->\n/g,
            '\n\n'
          );
          const paragraphs = contentWithForcedBreaks
            .split('\n')
            .filter(p => p.trim());
          paragraphs.forEach((paragraph, paragraphIndex) => {
            if (paragraph.trim()) {
              // Convert markdown to HTML
              const formattedParagraph = parseMarkdownToHTML(paragraph.trim());
              // Add first-paragraph class to first paragraph in indented style
              const paragraphClass =
                template.paragraphStyle === 'indented' && paragraphIndex === 0
                  ? ' class="first-paragraph"'
                  : '';
              content += `<p${paragraphClass}>${formattedParagraph}</p>`;
            }
          });
        }
      }

      // Estimate page progression (rough calculation)
      if (scene.content) {
        const wordCount = scene.content.split(/\s+/).length;
        const wordsPerPage = 250; // Rough estimate
        currentPageEstimate += Math.ceil(wordCount / wordsPerPage);
      }

      // Check for illustrations that might appear after this scene
      insertIllustrationsUpToPage(currentPageEstimate);

      // Add scene break if not the last scene in the chapter
      if (
        options.includeSceneBreaks &&
        sceneIndex < chapter.scenes.length - 1
      ) {
        content += '<div class="scene-break">* * *</div>';
      }
    });
  });

  // Insert any remaining illustrations
  insertIllustrationsUpToPage(999);

  content += '</body></html>';
  return content;
}
