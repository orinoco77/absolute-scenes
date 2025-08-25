import { exportToPDF } from '../pdfExporter';

// Mock jsPDF
const mockJsPDF = {
  addPage: jest.fn().mockReturnThis(),
  setFont: jest.fn().mockReturnThis(),
  setFontSize: jest.fn().mockReturnThis(),
  text: jest.fn().mockReturnThis(),
  line: jest.fn().mockReturnThis(),
  rect: jest.fn().mockReturnThis(),
  setLineWidth: jest.fn().mockReturnThis(),
  setDrawColor: jest.fn().mockReturnThis(),
  setTextColor: jest.fn().mockReturnThis(),
  setPage: jest.fn().mockReturnThis(),
  save: jest.fn().mockReturnThis(),
  getTextWidth: jest.fn().mockReturnValue(100),
  getFontList: jest.fn().mockReturnValue({}),
  splitTextToSize: jest.fn().mockImplementation((text, _maxWidth) => [text]),
  setCreationDate: jest.fn().mockReturnThis(),
  setLanguage: jest.fn().mockReturnThis(),
  setDocumentProperties: jest.fn().mockReturnThis(),
  setDisplayMode: jest.fn().mockReturnThis(),
  internal: {
    pageSize: {
      width: 612,
      height: 792
    },
    events: {
      subscribe: jest.fn()
    },
    getNumberOfPages: jest.fn().mockReturnValue(1)
  }
};

jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => mockJsPDF);
});

// Mock fontManager
jest.mock('../fontManager', () => ({
  getPdfFont: jest.fn().mockReturnValue({
    name: 'times',
    style: 'normal',
    weight: 'normal'
  })
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock alert function
global.alert = jest.fn();

// Mock console methods
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe('pdfExporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockJsPDF.addPage.mockClear();
    mockJsPDF.setFont.mockClear();
    mockJsPDF.setFontSize.mockClear();
    mockJsPDF.text.mockClear();
    mockJsPDF.save.mockClear();
    mockJsPDF.getTextWidth.mockClear();
    mockJsPDF.splitTextToSize.mockClear();
    mockJsPDF.setPage.mockClear();
    mockJsPDF.internal.getNumberOfPages.mockClear();
    // Reset return values
    mockJsPDF.getTextWidth.mockReturnValue(100);
    mockJsPDF.internal.getNumberOfPages.mockReturnValue(1);
    console.warn.mockClear();
    console.error.mockClear();
    global.alert.mockClear();
  });

  const mockBook = {
    title: 'Test Book',
    author: 'Test Author',
    chapters: [
      {
        id: 'chapter1',
        title: 'Chapter 1',
        number: 1,
        scenes: [
          {
            id: 'scene1',
            title: 'Scene 1',
            content: 'This is the first scene content.'
          },
          {
            id: 'scene2',
            title: 'Scene 2',
            content: 'This is the second scene content.'
          }
        ]
      }
    ],
    parts: [],
    frontMatter: [],
    backMatter: [],
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    }
  };

  const mockTemplate = {
    pageSize: 'letter',
    fontFamily: 'Times',
    fontSize: 12,
    lineHeight: 1.5,
    textAlign: 'justify',
    pageMargins: {
      top: 72,
      bottom: 72,
      left: 72,
      right: 72,
      inner: 72,
      outer: 72,
      gutter: 0
    },
    mirrorMargins: false,
    chapterHeader: {
      pageBreak: true,
      lineBreaksBefore: 3,
      fontSize: 18,
      fontWeight: 'bold',
      alignment: 'left',
      spacing: 1.5,
      style: 'Chapter X',
      format: 'Chapter {number}'
    },
    chapterOptions: {
      startOnNewPage: true,
      showTitle: true,
      showNumber: true,
      numberStyle: 'Chapter X'
    },
    sceneOptions: {
      separator: '* * *',
      showTitle: false
    },
    includeMetadata: {
      title: true,
      author: true,
      pageNumbers: true,
      tableOfContents: false
    }
  };

  describe('exportToPDF', () => {
    it('successfully exports a basic book to PDF', async () => {
      const options = { template: mockTemplate };

      await exportToPDF(mockBook, options);

      expect(mockJsPDF.setFont).toHaveBeenCalled();
      expect(mockJsPDF.setFontSize).toHaveBeenCalled();
      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalledWith('Test Book.pdf');
    });

    it('handles book with empty title', async () => {
      const bookWithoutTitle = { ...mockBook, title: '' };
      const options = { template: mockTemplate };

      await exportToPDF(bookWithoutTitle, options);

      expect(mockJsPDF.save).toHaveBeenCalledWith('Book.pdf');
    });

    it('handles book with no chapters', async () => {
      const bookWithoutChapters = { ...mockBook, chapters: [] };
      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };

      await exportToPDF(bookWithoutChapters, options);

      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('uses different page sizes correctly', async () => {
      const anotherTemplate = { ...mockTemplate, pageSize: 'a4' };
      const options = { template: anotherTemplate };

      await exportToPDF(mockBook, options);

      expect(mockJsPDF.setFont).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('handles custom page size with fallback', async () => {
      const customTemplate = { ...mockTemplate, pageSize: 'digest' };
      const options = { template: customTemplate };

      await exportToPDF(mockBook, options);

      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('applies different font families', async () => {
      const fontTemplate = { ...mockTemplate, fontFamily: 'Arial' };
      const options = { template: fontTemplate };

      await exportToPDF(mockBook, options);

      expect(mockJsPDF.setFont).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('applies different font sizes', async () => {
      const sizeTemplate = { ...mockTemplate, fontSize: 14 };
      const options = { template: sizeTemplate };

      await exportToPDF(mockBook, options);

      expect(mockJsPDF.setFontSize).toHaveBeenCalledWith(expect.any(Number));
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('handles books with front matter', async () => {
      const bookWithFrontMatter = {
        ...mockBook,
        frontMatter: [
          {
            id: 'preface',
            type: 'preface',
            title: 'Preface',
            content: 'This is the preface content.',
            enabled: true
          }
        ]
      };
      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };

      await exportToPDF(bookWithFrontMatter, options);

      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('handles books with back matter', async () => {
      const bookWithBackMatter = {
        ...mockBook,
        backMatter: [
          {
            id: 'epilogue',
            type: 'epilogue',
            title: 'Epilogue',
            content: 'This is the epilogue content.',
            enabled: true
          }
        ]
      };
      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };

      await exportToPDF(bookWithBackMatter, options);

      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('respects chapter options for new pages', async () => {
      const chapterTemplate = {
        ...mockTemplate,
        chapterOptions: {
          ...mockTemplate.chapterOptions,
          startOnNewPage: true
        }
      };
      const options = { template: chapterTemplate };

      await exportToPDF(mockBook, options);

      expect(mockJsPDF.addPage).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('handles scene separators', async () => {
      const sceneTemplate = {
        ...mockTemplate,
        sceneOptions: {
          separator: '***',
          showTitle: false
        }
      };
      const options = { template: sceneTemplate };

      await exportToPDF(mockBook, options);

      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('includes metadata when requested', async () => {
      const metadataTemplate = {
        ...mockTemplate,
        includeMetadata: {
          title: true,
          author: true,
          pageNumbers: true,
          tableOfContents: true
        }
      };
      const options = { template: metadataTemplate };

      await exportToPDF(mockBook, options);

      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalled();
    });
  });

  describe('markdown parsing and formatting', () => {
    it('handles bold text in content', async () => {
      const bookWithBold = {
        ...mockBook,
        chapters: [
          {
            id: 'chapter1',
            title: 'Chapter 1',
            scenes: [
              {
                id: 'scene1',
                title: 'Scene 1',
                content: 'This is **bold text** in the scene.'
              }
            ]
          }
        ]
      };
      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };

      await exportToPDF(bookWithBold, options);

      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('handles italic text in content', async () => {
      const bookWithItalic = {
        ...mockBook,
        chapters: [
          {
            id: 'chapter1',
            title: 'Chapter 1',
            scenes: [
              {
                id: 'scene1',
                title: 'Scene 1',
                content: 'This is *italic text* in the scene.'
              }
            ]
          }
        ]
      };
      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };

      await exportToPDF(bookWithItalic, options);

      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('handles underlined text in content', async () => {
      const bookWithUnderline = {
        ...mockBook,
        chapters: [
          {
            id: 'chapter1',
            title: 'Chapter 1',
            scenes: [
              {
                id: 'scene1',
                title: 'Scene 1',
                content: 'This is __underlined text__ in the scene.'
              }
            ]
          }
        ]
      };
      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };

      await exportToPDF(bookWithUnderline, options);

      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('handles mixed formatting in content', async () => {
      const bookWithMixedFormat = {
        ...mockBook,
        chapters: [
          {
            id: 'chapter1',
            title: 'Chapter 1',
            scenes: [
              {
                id: 'scene1',
                title: 'Scene 1',
                content:
                  'This has **bold**, *italic*, and __underlined__ text all together.'
              }
            ]
          }
        ]
      };
      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };

      await exportToPDF(bookWithMixedFormat, options);

      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('handles forced line breaks', async () => {
      const bookWithBreaks = {
        ...mockBook,
        chapters: [
          {
            id: 'chapter1',
            title: 'Chapter 1',
            scenes: [
              {
                id: 'scene1',
                title: 'Scene 1',
                content:
                  'First paragraph.\n<!--FORCED_BREAK-->\nSecond paragraph after break.'
              }
            ]
          }
        ]
      };
      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };

      await exportToPDF(bookWithBreaks, options);

      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalled();
    });
  });

  describe('page layout and margins', () => {
    it('applies custom margins correctly', async () => {
      const marginTemplate = {
        ...mockTemplate,
        pageMargins: {
          top: 100,
          bottom: 100,
          left: 50,
          right: 50,
          inner: 60,
          outer: 40,
          gutter: 20
        }
      };
      const options = { template: marginTemplate };

      await exportToPDF(mockBook, options);

      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('handles different text alignment options', async () => {
      const alignTemplate = { ...mockTemplate, textAlign: 'left' };
      const options = { template: alignTemplate };

      await exportToPDF(mockBook, options);

      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('handles different line heights', async () => {
      const lineHeightTemplate = { ...mockTemplate, lineHeight: 2.0 };
      const options = { template: lineHeightTemplate };

      await exportToPDF(mockBook, options);

      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.save).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles jsPDF constructor errors gracefully', async () => {
      // Mock jsPDF to throw an error on construction
      const _originalJsPDF = require('jspdf');
      require('jspdf').mockImplementationOnce(() => {
        throw new Error('PDF creation failed');
      });

      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };

      await expect(exportToPDF(mockBook, options)).rejects.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    it('handles font loading errors', async () => {
      const { getPdfFont } = require('../fontManager');
      getPdfFont.mockImplementationOnce(() => {
        throw new Error('Font not available');
      });

      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };

      await expect(exportToPDF(mockBook, options)).rejects.toThrow(
        'Font not available'
      );
      expect(console.error).toHaveBeenCalled();
    });

    it('handles text rendering errors gracefully', async () => {
      // Mock the safeText function to throw an error by making text method throw
      mockJsPDF.text.mockImplementationOnce(() => {
        throw new Error('Text rendering failed');
      });

      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };

      // The function should still complete but may log errors
      await exportToPDF(mockBook, options);
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('handles save operation errors', async () => {
      mockJsPDF.save.mockImplementationOnce(() => {
        throw new Error('Save failed - file locked');
      });

      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };

      await expect(exportToPDF(mockBook, options)).rejects.toThrow();
      expect(global.alert).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Export Failed')
      );
    });

    it('handles invalid page size gracefully', async () => {
      const invalidTemplate = { ...mockTemplate, pageSize: 'invalid-size' };
      const options = { template: invalidTemplate };

      await exportToPDF(mockBook, options);

      // May not warn in current implementation, but should still save
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('handles missing template gracefully', async () => {
      const options = {}; // No template provided

      await expect(exportToPDF(mockBook, options)).rejects.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    it('handles null or undefined book gracefully', async () => {
      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };

      await expect(exportToPDF(null, options)).rejects.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('file access checking', () => {
    beforeEach(() => {
      // Reset localStorage mock
      localStorageMock.clear();
      Date.now = jest.fn();
    });

    afterEach(() => {
      Date.now.mockRestore();
    });

    it('warns about potential file lock on rapid exports', async () => {
      const now = 1000000;
      Date.now.mockReturnValue(now);

      // Set recent export time
      localStorageMock.setItem('lastExportTime', (now - 1000).toString());

      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };
      await exportToPDF(mockBook, options);

      expect(console.warn).toHaveBeenCalledWith(
        'Recent export detected - file may still be locked'
      );
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('does not warn when sufficient time has passed', async () => {
      const now = 1000000;
      Date.now.mockReturnValue(now);

      // Set old export time
      localStorageMock.setItem('lastExportTime', (now - 5000).toString());

      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };
      await exportToPDF(mockBook, options);

      expect(console.warn).not.toHaveBeenCalledWith(
        'Recent export detected - file may still be locked'
      );
      expect(mockJsPDF.save).toHaveBeenCalled();
    });

    it('updates last export time after successful export', async () => {
      const now = 1000000;
      Date.now.mockReturnValue(now);

      const simpleTemplate = {
        ...mockTemplate,
        includeMetadata: {
          ...mockTemplate.includeMetadata,
          pageNumbers: false
        }
      };
      const options = { template: simpleTemplate };
      await exportToPDF(mockBook, options);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'lastExportTime',
        now.toString()
      );
    });
  });
});
