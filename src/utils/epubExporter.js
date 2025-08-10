import JSZip from 'jszip';
import { getCssFontFamily } from './fontManager';

// EPUB export function
export async function exportToEPUB(book, options = {}) {
  try {
    console.log('Starting EPUB export...');

    const zip = new JSZip();
    const { template } = options;

    // Helper function to generate unique IDs
    const generateId = (prefix, index) => `${prefix}-${index}`;

    // Helper function to create safe filenames
    const createSafeFilename = (title, index, extension = '.xhtml') => {
      const safe = title
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
      return `chapter-${index + 1}-${safe}${extension}`;
    };

    // Generate EPUB-specific CSS (no page breaks, responsive design)
    const generateEbookCSS = () => {
      const cssFont = getCssFontFamily(template.fontFamily);

      return `
/* EPUB Stylesheet */
body {
  font-family: ${cssFont};
  font-size: 1em; /* Let readers control font size */
  line-height: ${template.lineHeight};
  margin: 0;
  padding: 1em;
  text-align: ${template.textAlign === 'left' ? 'left' : 'justify'};
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-weight: bold;
  margin: 1.5em 0 0.75em 0;
  line-height: 1.2;
  page-break-after: avoid;
  -webkit-column-break-after: avoid;
  break-after: avoid;
}

h1 {
  font-size: 1.8em;
  text-align: center;
  margin-top: 2em;
  margin-bottom: 1.5em;
}

h2 {
  font-size: 1.5em;
}

h3 {
  font-size: 1.3em;
}

/* Chapter headers */
.chapter-header {
  font-size: 1.6em;
  font-weight: bold;
  text-align: center;
  margin: 2em 0 1.5em 0;
  page-break-before: always;
  -webkit-column-break-before: always;
  break-before: page;
}

/* Paragraphs */
p {
  margin: 0;
  orphans: 2;
  widows: 2;
  ${
    template.writingType === 'verse'
      ? 'white-space: pre-wrap; margin: 0; text-indent: 0; text-align: left;'
      : template.paragraphStyle === 'indented'
        ? 'text-indent: 1.5em;'
        : 'margin: 1em 0; text-indent: 0;'
  }
}

.first-paragraph {
  text-indent: 0 !important;
}

/* Scene breaks */
.scene-break {
  text-align: center;
  margin: 2em 0;
  font-size: 1.2em;
}

/* Text formatting */
strong, b {
  font-weight: bold;
}

em, i {
  font-style: italic;
}

/* Ensure good line breaking */
p, div {
  word-wrap: break-word;
  -webkit-hyphens: auto;
  hyphens: auto;
}

/* Title page */
.title-page {
  text-align: center;
  margin: 3em 0;
  page-break-after: always;
  -webkit-column-break-after: always;
  break-after: page;
}

.title {
  font-size: 2.5em;
  font-weight: bold;
  margin-bottom: 1em;
  line-height: 1.1;
}

.author {
  font-size: 1.4em;
  margin-top: 2em;
}

/* Responsive adjustments */
@media screen and (max-width: 600px) {
  body {
    padding: 0.5em;
  }
  
  .title {
    font-size: 2em;
  }
  
  h1 {
    font-size: 1.6em;
  }
}
`;
    };

    // Generate chapter header text
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

    // Convert markdown to HTML for ebooks
    const parseMarkdownToHTML = text => {
      if (!text) return '';

      return (
        text
          // Handle headings
          .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
          .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
          .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
          // Handle bold (before italic)
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          // Handle italic
          .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')
          // Convert line breaks
          .replace(/\n/g, '<br>')
      );
    };

    // 1. Create mimetype file (must be first, uncompressed)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    // 2. Create META-INF/container.xml
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

    zip.folder('META-INF').file('container.xml', containerXml);

    // 3. Create OEBPS folder structure
    const oebps = zip.folder('OEBPS');

    // 4. Generate CSS file
    const cssContent = generateEbookCSS();
    oebps.file('styles.css', cssContent);

    // 5. Generate title page
    let titlePageContent = '';
    const hasEpubTitlePage =
      (book.title && book.title.trim()) || (book.author && book.author.trim());
    if (hasEpubTitlePage) {
      titlePageContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Title Page</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <div class="title-page">
    ${book.title ? `<h1 class="title">${book.title}</h1>` : ''}
    ${book.author ? `<p class="author">by ${book.author}</p>` : ''}
  </div>
</body>
</html>`;

      oebps.file('title.xhtml', titlePageContent);
    }

    // 6. Generate chapter files
    const chapterFiles = [];
    const manifestItems = [];
    const spineItems = [];
    const navItems = [];

    // Add title page to spine if it exists
    if (titlePageContent) {
      manifestItems.push(
        `    <item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>`
      );
      spineItems.push(`    <itemref idref="title"/>`);
    }

    // Process each chapter
    book.chapters.forEach((chapter, chapterIndex) => {
      const chapterNumber = chapterIndex + 1;
      const chapterHeaderText = generateChapterHeader(chapter, chapterNumber);
      const filename = createSafeFilename(chapter.title, chapterIndex);
      const chapterId = generateId('chapter', chapterIndex);

      // Generate chapter content
      let chapterContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapterHeaderText}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1 class="chapter-header">${chapterHeaderText}</h1>`;

      // Add scenes
      chapter.scenes.forEach((scene, sceneIndex) => {
        // Note: Scene titles are not included in EPUB format for better reading flow

        if (scene.content && scene.content.trim()) {
          if (template.writingType === 'verse') {
            // For verse, preserve all formatting including line breaks and whitespace
            const formattedContent = parseMarkdownToHTML(scene.content);
            chapterContent += `\n  <p>${formattedContent}</p>`;
          } else {
            // For prose, use traditional paragraph handling
            const paragraphs = scene.content.split('\n').filter(p => p.trim());
            paragraphs.forEach((paragraph, paragraphIndex) => {
              if (paragraph.trim()) {
                const formattedParagraph = parseMarkdownToHTML(
                  paragraph.trim()
                );
                const paragraphClass =
                  template.paragraphStyle === 'indented' && paragraphIndex === 0
                    ? ' class="first-paragraph"'
                    : '';
                chapterContent += `\n  <p${paragraphClass}>${formattedParagraph}</p>`;
              }
            });
          }
        }

        // Add scene break if not the last scene
        if (
          options.includeSceneBreaks &&
          sceneIndex < chapter.scenes.length - 1
        ) {
          chapterContent += '\n  <div class="scene-break">* * *</div>';
        }
      });

      chapterContent += '\n</body>\n</html>';

      // Save chapter file
      oebps.file(filename, chapterContent);
      chapterFiles.push({ filename, chapterId, title: chapterHeaderText });

      // Add to manifest and spine
      manifestItems.push(
        `    <item id="${chapterId}" href="${filename}" media-type="application/xhtml+xml"/>`
      );
      spineItems.push(`    <itemref idref="${chapterId}"/>`);

      // Add to navigation
      navItems.push(`    <navPoint id="${chapterId}-nav" playOrder="${chapterIndex + 1}">
      <navLabel><text>${chapterHeaderText}</text></navLabel>
      <content src="${filename}"/>
    </navPoint>`);
    });

    // 7. Generate content.opf (main metadata file)
    const currentDate = new Date().toISOString().split('T')[0];
    const uniqueId = `urn:uuid:${Date.now()}`;

    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${book.title || 'Untitled Book'}</dc:title>
    <dc:creator opf:role="aut">${book.author || 'Unknown Author'}</dc:creator>
    <dc:identifier id="bookid">${uniqueId}</dc:identifier>
    <dc:language>en</dc:language>
    <dc:date>${currentDate}</dc:date>
    <meta name="cover" content="cover"/>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
${manifestItems.join('\n')}
  </manifest>
  <spine toc="ncx">
${spineItems.join('\n')}
  </spine>
</package>`;

    oebps.file('content.opf', contentOpf);

    // 8. Generate toc.ncx (table of contents)
    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uniqueId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${book.title || 'Untitled Book'}</text>
  </docTitle>
  <navMap>
${navItems.join('\n')}
  </navMap>
</ncx>`;

    oebps.file('toc.ncx', tocNcx);

    // 9. Generate the EPUB file
    console.log('Generating EPUB file...');
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });

    // 10. Download the file
    const filename = `${book.title || 'Book'}.epub`;
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    // Add error handling
    a.addEventListener('error', event => {
      console.error('EPUB download failed:', event);
      URL.revokeObjectURL(url);

      const userMessage = `Cannot save EPUB file - the file "${filename}" may be open in another application. Please close any ebook readers showing this file and try again.`;
      alert(`Export Failed\n\n${userMessage}`);
    });

    // Trigger download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    console.log(`✓ EPUB exported successfully: ${filename}`);
  } catch (error) {
    console.error('EPUB export failed:', error);

    let userMessage = 'Failed to export EPUB.';

    if (error.message.includes('JSZip') || error.message.includes('zip')) {
      userMessage =
        'EPUB generation failed due to compression issues. Please try again.';
    } else if (
      error.message.includes('memory') ||
      error.message.includes('size')
    ) {
      userMessage =
        'EPUB generation failed due to insufficient memory. Try reducing book size or closing other applications.';
    } else {
      userMessage = `EPUB export failed: ${error.message || 'Unknown error'}`;
    }

    alert(`Export Failed\n\n${userMessage}`);
    throw error;
  }
}
