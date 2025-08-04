import jsPDF from 'jspdf';
import JSZip from 'jszip';
import {
  exportToPDF,
  exportToHTML,
  exportToEPUB,
  debugPageSizes
} from '../exportManager';

// Mock jsPDF completely to avoid canvas issues
const mockPdfInstance = {
  internal: {
    pageSize: { width: 612, height: 792 },
    getNumberOfPages: jest.fn(() => 1)
  },
  setFont: jest.fn(),
  setFontSize: jest.fn(),
  getTextWidth: jest.fn(() => 50),
  text: jest.fn(),
  addPage: jest.fn(),
  setPage: jest.fn(),
  splitTextToSize: jest.fn(text => [text]),
  save: jest.fn()
};

jest.mock('jspdf', () => {
  return jest.fn(() => mockPdfInstance);
});

// Mock dependencies
jest.mock('jszip');
jest.mock('../fontManager', () => ({
  getPdfFont: jest.fn(font => (font === 'Custom Font' ? 'times' : 'helvetica')),
  getCssFontFamily: jest.fn(font =>
    font === 'Custom Font' ? '"Custom Font", serif' : 'Arial, sans-serif'
  )
}));
jest.mock('../customFontLoader', () => ({
  ensureFontLoaded: jest.fn(),
  preloadBookFonts: jest.fn()
}));

// Mock URL and Blob for browser environment
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();
global.Blob = jest.fn();

// Mock document methods
document.createElement = jest.fn(() => ({
  href: '',
  download: '',
  click: jest.fn(),
  addEventListener: jest.fn()
}));
document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock navigator
Object.defineProperty(navigator, 'platform', {
  value: 'MacIntel',
  writable: true
});

// Get a fresh mock PDF instance for each test
const getMockPdf = () => {
  return jsPDF();
};

const mockBook = {
  title: 'Test Book',
  author: 'Test Author',
  chapters: [
    {
      title: 'Chapter One',
      scenes: [
        {
          title: 'Scene One',
          content:
            'This is the first scene content with **bold** and *italic* text.\n\nThis is a second paragraph.'
        },
        {
          title: 'Scene Two',
          content: 'This is the second scene content.'
        }
      ]
    },
    {
      title: 'Chapter Two',
      scenes: [
        {
          title: 'Scene Three',
          content:
            '# Heading One\n\n## Heading Two\n\n### Heading Three\n\nRegular paragraph text.'
        }
      ]
    }
  ]
};

const mockTemplate = {
  pageSize: 'letter',
  fontFamily: 'Times New Roman',
  fontSize: 12,
  lineHeight: 1.5,
  textAlign: 'justified',
  paragraphStyle: 'indented',
  pageMargins: {
    top: 1,
    bottom: 1,
    left: 1.25,
    right: 1,
    inside: 1.25,
    outside: 1
  },
  mirrorMargins: false,
  chapterHeader: {
    style: 'numbered',
    fontSize: 16,
    fontWeight: 'bold',
    alignment: 'center',
    pageBreak: true,
    startOnRightPage: false,
    lineBreaksBefore: 2,
    spacing: 2,
    format: 'Chapter {number}: {title}'
  },
  runningHeaders: {
    enabled: true,
    alignment: 'outside',
    skipChapterPages: true
  }
};

describe('exportManager', () => {
  let mockPdf;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    global.alert = jest.fn();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    
    // Reset jsPDF mock and shared instance
    jsPDF.mockClear();
    mockPdf = mockPdfInstance;
    
    // Clear all method calls on the mock and reset implementations
    Object.values(mockPdfInstance).forEach(method => {
      if (jest.isMockFunction(method)) {
        method.mockClear();
        method.mockReset();
      }
    });
    Object.values(mockPdfInstance.internal).forEach(method => {
      if (jest.isMockFunction(method)) {
        method.mockClear();
        method.mockReset();
      }
    });
    
    // Restore default return values
    mockPdfInstance.internal.getNumberOfPages.mockReturnValue(1);
    mockPdfInstance.getTextWidth.mockReturnValue(50);
    mockPdfInstance.splitTextToSize.mockImplementation(text => [text]);
  });

  describe('exportToPDF', () => {
    const mockOptions = { template: mockTemplate };

    it('creates PDF with correct page size and format', async () => {
      await exportToPDF(mockBook, mockOptions);

      expect(jsPDF).toHaveBeenCalledWith({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
      });
    });

    it('handles custom page sizes', async () => {
      const customTemplate = { ...mockTemplate, pageSize: 'digest' };
      await exportToPDF(mockBook, { template: customTemplate });

      expect(jsPDF).toHaveBeenCalledWith({
        orientation: 'portrait',
        unit: 'pt',
        format: [396, 612] // 5.5" x 8.5" in points
      });
    });

    it('sets font correctly', async () => {
      await exportToPDF(mockBook, mockOptions);

      expect(mockPdf.setFont).toHaveBeenCalledWith('helvetica', 'normal');
      expect(mockPdf.setFontSize).toHaveBeenCalledWith(12);
    });

    it('renders title page when book has title and author', async () => {
      await exportToPDF(mockBook, mockOptions);

      expect(mockPdf.setFont).toHaveBeenCalledWith('helvetica', 'bold');
      expect(mockPdf.setFontSize).toHaveBeenCalledWith(24);
      expect(mockPdf.text).toHaveBeenCalledWith(
        'Test Book',
        expect.any(Number),
        expect.any(Number)
      );
      expect(mockPdf.text).toHaveBeenCalledWith(
        'by Test Author',
        expect.any(Number),
        expect.any(Number)
      );
      expect(mockPdf.addPage).toHaveBeenCalled();
    });

    it('skips title page when book has no title or author', async () => {
      const bookWithoutTitle = { ...mockBook, title: '', author: '' };
      await exportToPDF(bookWithoutTitle, mockOptions);

      // Should not set title page font size (24pt)
      expect(mockPdf.setFontSize).not.toHaveBeenCalledWith(24);

      // Should still add pages for chapters (since pageBreak: true in template)
      // First chapter gets a page break (no title page), second chapter gets page break
      expect(mockPdf.addPage).toHaveBeenCalledTimes(2);
    });

    it('renders chapter headers correctly', async () => {
      await exportToPDF(mockBook, mockOptions);

      expect(mockPdf.setFont).toHaveBeenCalledWith('helvetica', 'bold');
      expect(mockPdf.setFontSize).toHaveBeenCalledWith(16);
      expect(mockPdf.splitTextToSize).toHaveBeenCalledWith(
        'Chapter 1',
        expect.any(Number)
      );
    });

    it('handles different chapter header styles', async () => {
      const templateWithTitledChapters = {
        ...mockTemplate,
        chapterHeader: { ...mockTemplate.chapterHeader, style: 'titled' }
      };

      await exportToPDF(mockBook, { template: templateWithTitledChapters });

      expect(mockPdf.splitTextToSize).toHaveBeenCalledWith(
        'Chapter One',
        expect.any(Number)
      );
    });

    it('handles both style chapter headers', async () => {
      const templateWithBothStyle = {
        ...mockTemplate,
        chapterHeader: { ...mockTemplate.chapterHeader, style: 'both' }
      };

      await exportToPDF(mockBook, { template: templateWithBothStyle });

      expect(mockPdf.splitTextToSize).toHaveBeenCalledWith(
        'Chapter 1: Chapter One',
        expect.any(Number)
      );
    });

    it('handles custom chapter header format', async () => {
      const templateWithCustomFormat = {
        ...mockTemplate,
        chapterHeader: {
          ...mockTemplate.chapterHeader,
          style: 'custom',
          format: '{title} - Part {number}'
        }
      };

      await exportToPDF(mockBook, { template: templateWithCustomFormat });

      expect(mockPdf.splitTextToSize).toHaveBeenCalledWith(
        'Chapter One - Part 1',
        expect.any(Number)
      );
    });

    it('renders scene content with markdown formatting', async () => {
      await exportToPDF(mockBook, mockOptions);

      // Should set bold font for bold text
      expect(mockPdf.setFont).toHaveBeenCalledWith('helvetica', 'bold');
      // Should set italic font for italic text
      expect(mockPdf.setFont).toHaveBeenCalledWith('helvetica', 'italic');
      // Should render text
      expect(mockPdf.text).toHaveBeenCalled();
    });

    it('handles scene titles when includeSceneTitles is true', async () => {
      const optionsWithSceneTitles = {
        ...mockOptions,
        includeSceneTitles: true
      };
      await exportToPDF(mockBook, optionsWithSceneTitles);

      expect(mockPdf.setFont).toHaveBeenCalledWith('helvetica', 'bold');
      expect(mockPdf.setFontSize).toHaveBeenCalledWith(14); // fontSize + 2
      expect(mockPdf.splitTextToSize).toHaveBeenCalledWith(
        'Scene One',
        expect.any(Number)
      );
    });

    it('handles scene breaks when includeSceneBreaks is true', async () => {
      const optionsWithSceneBreaks = {
        ...mockOptions,
        includeSceneBreaks: true
      };
      await exportToPDF(mockBook, optionsWithSceneBreaks);

      expect(mockPdf.text).toHaveBeenCalledWith(
        '* * *',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('calculates margins correctly for mirrored margins', async () => {
      const mirroredTemplate = { ...mockTemplate, mirrorMargins: true };
      await exportToPDF(mockBook, { template: mirroredTemplate });

      // Should be called with different margins for odd/even pages
      expect(mockPdf.setPage).toHaveBeenCalled();
    });

    it('adds running headers when enabled', async () => {
      mockPdf.internal.getNumberOfPages.mockReturnValue(3);

      await exportToPDF(mockBook, mockOptions);

      expect(mockPdf.setPage).toHaveBeenCalledWith(1);
      expect(mockPdf.setPage).toHaveBeenCalledWith(2);
      expect(mockPdf.setPage).toHaveBeenCalledWith(3);
    });

    it('adds page numbers', async () => {
      mockPdf.internal.getNumberOfPages.mockReturnValue(2);

      await exportToPDF(mockBook, mockOptions);

      expect(mockPdf.text).toHaveBeenCalledWith(
        '2',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('saves PDF with correct filename', async () => {
      await exportToPDF(mockBook, mockOptions);

      expect(mockPdf.save).toHaveBeenCalledWith('Test Book.pdf');
    });

    it('handles PDF save errors gracefully', async () => {
      mockPdf.save.mockImplementation(() => {
        throw new Error('Save failed');
      });

      await expect(exportToPDF(mockBook, mockOptions)).rejects.toThrow();
      expect(global.alert).toHaveBeenCalled();
    });

    it('warns about recent exports', async () => {
      mockLocalStorage.getItem.mockReturnValue((Date.now() - 1000).toString()); // 1 second ago

      await exportToPDF(mockBook, mockOptions);

      expect(console.warn).toHaveBeenCalledWith(
        'Recent export detected - file may still be locked'
      );
    });

    it('falls back to letter format for unsupported page sizes', async () => {
      jsPDF
        .mockImplementationOnce(() => {
          throw new Error('Unsupported format');
        })
        .mockImplementationOnce(() => mockPdf);

      const customTemplate = { ...mockTemplate, pageSize: 'custom-invalid' };
      await exportToPDF(mockBook, { template: customTemplate });

      expect(jsPDF).toHaveBeenCalledTimes(2);
    });
  });

  describe('exportToHTML', () => {
    const mockOptions = { template: mockTemplate };

    beforeEach(() => {
      global.Blob = jest.fn((content, options) => ({ content, options }));
    });

    afterEach(() => {
      // Reset Blob mock after each HTML test to avoid affecting other tests
      global.Blob = jest.fn((content, options) => ({ content, options }));
    });

    it('generates HTML with correct structure', async () => {
      await exportToHTML(mockBook, mockOptions);

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('<!DOCTYPE html>')],
        { type: 'text/html' }
      );
    });

    it('includes book title and author in HTML', async () => {
      await exportToHTML(mockBook, mockOptions);

      const htmlContent = global.Blob.mock.calls[0][0][0];
      expect(htmlContent).toContain('<div class="title">Test Book</div>');
      expect(htmlContent).toContain('<div class="author">by Test Author</div>');
    });

    it('renders chapters with headers', async () => {
      await exportToHTML(mockBook, mockOptions);

      const htmlContent = global.Blob.mock.calls[0][0][0];
      expect(htmlContent).toContain(
        '<h1 class="chapter-header">Chapter 1</h1>'
      );
    });

    it('converts markdown to HTML', async () => {
      await exportToHTML(mockBook, mockOptions);

      const htmlContent = global.Blob.mock.calls[0][0][0];
      expect(htmlContent).toContain('<strong>bold</strong>');
      expect(htmlContent).toContain('<em>italic</em>');
    });

    it('handles scene titles when includeSceneTitles is true', async () => {
      const optionsWithSceneTitles = {
        ...mockOptions,
        includeSceneTitles: true
      };
      await exportToHTML(mockBook, optionsWithSceneTitles);

      const htmlContent = global.Blob.mock.calls[0][0][0];
      expect(htmlContent).toContain('<h2 class="scene-title">Scene One</h2>');
    });

    it('handles scene breaks when includeSceneBreaks is true', async () => {
      const optionsWithSceneBreaks = {
        ...mockOptions,
        includeSceneBreaks: true
      };
      await exportToHTML(mockBook, optionsWithSceneBreaks);

      const htmlContent = global.Blob.mock.calls[0][0][0];
      expect(htmlContent).toContain('<div class="scene-break">* * *</div>');
    });

    it('applies correct CSS for paragraph styles', async () => {
      await exportToHTML(mockBook, mockOptions);

      const htmlContent = global.Blob.mock.calls[0][0][0];
      expect(htmlContent).toContain('text-indent: 3%');
    });

    it('applies separated paragraph style', async () => {
      const separatedTemplate = {
        ...mockTemplate,
        paragraphStyle: 'separated'
      };
      await exportToHTML(mockBook, { template: separatedTemplate });

      const htmlContent = global.Blob.mock.calls[0][0][0];
      expect(htmlContent).toContain('margin: 1em 0; text-indent: 0;');
    });

    it('triggers download with correct filename', async () => {
      const mockA = {
        href: '',
        download: '',
        click: jest.fn(),
        addEventListener: jest.fn()
      };
      document.createElement.mockReturnValue(mockA);

      await exportToHTML(mockBook, mockOptions);

      expect(mockA.download).toBe('Test Book.html');
      expect(mockA.click).toHaveBeenCalled();
    });

    it('handles export errors gracefully', async () => {
      global.Blob.mockImplementation(() => {
        throw new Error('Blob creation failed');
      });

      await expect(exportToHTML(mockBook, mockOptions)).rejects.toThrow();
      expect(global.alert).toHaveBeenCalled();
    });
  });

  describe('exportToEPUB', () => {
    const mockOptions = { template: mockTemplate };
    let mockZip;

    beforeEach(() => {
      // Ensure Blob is working for EPUB tests
      global.Blob = jest.fn((content, options) => ({ content, options }));
      
      mockZip = {
        file: jest.fn(),
        folder: jest.fn(() => mockZip),
        generateAsync: jest.fn(() => Promise.resolve(new Blob()))
      };
      JSZip.mockImplementation(() => mockZip);
    });

    it('creates EPUB structure correctly', async () => {
      await exportToEPUB(mockBook, mockOptions);

      expect(mockZip.file).toHaveBeenCalledWith(
        'mimetype',
        'application/epub+zip',
        expect.any(Object)
      );
      expect(mockZip.folder).toHaveBeenCalledWith('META-INF');
      expect(mockZip.folder).toHaveBeenCalledWith('OEBPS');
    });

    it('generates container.xml', async () => {
      await exportToEPUB(mockBook, mockOptions);

      expect(mockZip.file).toHaveBeenCalledWith(
        'container.xml',
        expect.stringContaining('<rootfile full-path="OEBPS/content.opf"')
      );
    });

    it('generates CSS file', async () => {
      await exportToEPUB(mockBook, mockOptions);

      expect(mockZip.file).toHaveBeenCalledWith(
        'styles.css',
        expect.stringContaining('body {')
      );
    });

    it('generates title page when book has title and author', async () => {
      await exportToEPUB(mockBook, mockOptions);

      expect(mockZip.file).toHaveBeenCalledWith(
        'title.xhtml',
        expect.stringContaining('<h1 class="title">Test Book</h1>')
      );
    });

    it('generates chapter files', async () => {
      await exportToEPUB(mockBook, mockOptions);

      expect(mockZip.file).toHaveBeenCalledWith(
        expect.stringMatching(/chapter-1-.*\.xhtml/),
        expect.stringContaining('<h1 class="chapter-header">Chapter 1</h1>')
      );
    });

    it('generates content.opf manifest', async () => {
      await exportToEPUB(mockBook, mockOptions);

      expect(mockZip.file).toHaveBeenCalledWith(
        'content.opf',
        expect.stringContaining('<dc:title>Test Book</dc:title>')
      );
    });

    it('generates table of contents (toc.ncx)', async () => {
      await exportToEPUB(mockBook, mockOptions);

      expect(mockZip.file).toHaveBeenCalledWith(
        'toc.ncx',
        expect.stringContaining('<navMap>')
      );
    });

    it('handles scene breaks when includeSceneBreaks is true', async () => {
      const optionsWithSceneBreaks = {
        ...mockOptions,
        includeSceneBreaks: true
      };
      await exportToEPUB(mockBook, optionsWithSceneBreaks);

      const chapterFiles = mockZip.file.mock.calls.filter(
        call => call[0].includes('chapter-') && call[0].endsWith('.xhtml')
      );
      expect(chapterFiles[0][1]).toContain(
        '<div class="scene-break">* * *</div>'
      );
    });

    it('converts markdown to HTML in chapters', async () => {
      await exportToEPUB(mockBook, mockOptions);

      const chapterFiles = mockZip.file.mock.calls.filter(
        call => call[0].includes('chapter-') && call[0].endsWith('.xhtml')
      );
      expect(chapterFiles[0][1]).toContain('<strong>bold</strong>');
      expect(chapterFiles[0][1]).toContain('<em>italic</em>');
    });

    it('triggers download with correct filename', async () => {
      const mockA = {
        href: '',
        download: '',
        click: jest.fn(),
        addEventListener: jest.fn()
      };
      document.createElement.mockReturnValue(mockA);

      await exportToEPUB(mockBook, mockOptions);

      expect(mockA.download).toBe('Test Book.epub');
      expect(mockA.click).toHaveBeenCalled();
    });

    it('handles compression errors gracefully', async () => {
      mockZip.generateAsync.mockRejectedValue(new Error('Compression failed'));

      await expect(exportToEPUB(mockBook, mockOptions)).rejects.toThrow();
      expect(global.alert).toHaveBeenCalled();
    });

    it('handles JSZip errors gracefully', async () => {
      JSZip.mockImplementation(() => {
        throw new Error('JSZip failed');
      });

      await expect(exportToEPUB(mockBook, mockOptions)).rejects.toThrow();
      expect(global.alert).toHaveBeenCalled();
    });
  });

  describe('debugPageSizes', () => {
    it('tests all defined page sizes', () => {
      debugPageSizes();

      expect(jsPDF).toHaveBeenCalledTimes(7); // Number of page sizes defined
      expect(console.log).toHaveBeenCalledWith(
        'Testing page size consistency across formats:'
      );
    });

    it('handles page size creation errors', () => {
      jsPDF.mockImplementationOnce(() => {
        throw new Error('Failed to create page size');
      });

      debugPageSizes();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create'),
        'Failed to create page size'
      );
    });
  });

  describe('markdown parsing', () => {
    it('parses headings correctly', async () => {
      const bookWithHeadings = {
        ...mockBook,
        chapters: [
          {
            title: 'Test Chapter',
            scenes: [
              {
                content: '# Heading 1\n## Heading 2\n### Heading 3'
              }
            ]
          }
        ]
      };

      await exportToHTML(bookWithHeadings, { template: mockTemplate });

      const htmlContent = global.Blob.mock.calls[0][0][0];
      expect(htmlContent).toContain('<h1>Heading 1</h1>');
      expect(htmlContent).toContain('<h2>Heading 2</h2>');
      expect(htmlContent).toContain('<h3>Heading 3</h3>');
    });

    it('handles nested formatting correctly', async () => {
      const bookWithNested = {
        ...mockBook,
        chapters: [
          {
            title: 'Test Chapter',
            scenes: [
              {
                content: '**Bold with *italic* inside**'
              }
            ]
          }
        ]
      };

      await exportToHTML(bookWithNested, { template: mockTemplate });

      const htmlContent = global.Blob.mock.calls[0][0][0];
      expect(htmlContent).toContain(
        '<strong>Bold with <em>italic</em> inside</strong>'
      );
    });

    it('preserves line breaks', async () => {
      const bookWithBreaks = {
        ...mockBook,
        chapters: [
          {
            title: 'Test Chapter',
            scenes: [
              {
                content: 'Line one\nLine two'
              }
            ]
          }
        ]
      };

      await exportToHTML(bookWithBreaks, { template: mockTemplate });

      const htmlContent = global.Blob.mock.calls[0][0][0];
      expect(htmlContent).toContain('Line one');
    });
  });

  describe('error scenarios', () => {
    it('handles books without chapters', async () => {
      const emptyBook = { title: 'Empty Book', author: 'Author', chapters: [] };

      await expect(
        exportToPDF(emptyBook, { template: mockTemplate })
      ).resolves.not.toThrow();
    });

    it('handles chapters without scenes', async () => {
      const bookWithEmptyChapter = {
        ...mockBook,
        chapters: [{ title: 'Empty Chapter', scenes: [] }]
      };

      await expect(
        exportToPDF(bookWithEmptyChapter, { template: mockTemplate })
      ).resolves.not.toThrow();
    });

    it('handles scenes without content', async () => {
      const bookWithEmptyScene = {
        ...mockBook,
        chapters: [
          {
            title: 'Chapter',
            scenes: [{ title: 'Empty Scene', content: '' }]
          }
        ]
      };

      await expect(
        exportToPDF(bookWithEmptyScene, { template: mockTemplate })
      ).resolves.not.toThrow();
    });
  });
});
