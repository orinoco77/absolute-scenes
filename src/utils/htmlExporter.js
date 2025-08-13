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
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const filename = `${book.title || 'Book'}.html`;
    console.log(`Attempting to save HTML: ${filename}`);

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

      // Add scene break if not the last scene in the chapter
      if (
        options.includeSceneBreaks &&
        sceneIndex < chapter.scenes.length - 1
      ) {
        content += '<div class="scene-break">* * *</div>';
      }
    });
  });

  content += '</body></html>';
  return content;
}
