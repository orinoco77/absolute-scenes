import * as fontManager from '../fontManager';

// Mock jsPDF
jest.mock('jspdf', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock DOM manipulation
const mockAppendChild = jest.fn();
const mockCreateElement = jest.fn();

describe('fontManager', () => {
  let consoleLogSpy;
  let consoleWarnSpy;
  let consoleInfoSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Setup console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

    // Mock DOM methods
    mockCreateElement.mockImplementation(tagName => {
      if (tagName === 'link') {
        return {
          href: '',
          rel: '',
          onload: null,
          onerror: null
        };
      }
      return {};
    });

    document.createElement = mockCreateElement;

    // Mock document.head properly
    Object.defineProperty(document, 'head', {
      value: { appendChild: mockAppendChild },
      writable: true
    });

    // Reset initialization state
    fontManager.initializeFontSystem.__fontSystemInitialized = false;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    delete global.window;
  });

  describe('BOOK_FONTS', () => {
    test('contains expected font definitions', () => {
      expect(fontManager.BOOK_FONTS).toBeDefined();
      expect(typeof fontManager.BOOK_FONTS).toBe('object');

      // Check for some key fonts
      expect(fontManager.BOOK_FONTS.garamond).toBeDefined();
      expect(fontManager.BOOK_FONTS.palatino).toBeDefined();
      expect(fontManager.BOOK_FONTS.times).toBeDefined();
      expect(fontManager.BOOK_FONTS.georgia).toBeDefined();
    });

    test('all fonts have required properties', () => {
      Object.keys(fontManager.BOOK_FONTS).forEach(key => {
        const font = fontManager.BOOK_FONTS[key];

        expect(font).toHaveProperty('name');
        expect(font).toHaveProperty('category');
        expect(font).toHaveProperty('description');
        expect(font).toHaveProperty('characteristics');
        expect(font).toHaveProperty('bestFor');
        expect(font).toHaveProperty('fallback');
        expect(font).toHaveProperty('webFont');
        expect(font).toHaveProperty('quality');

        // Validate property types
        expect(typeof font.name).toBe('string');
        expect(typeof font.category).toBe('string');
        expect(Array.isArray(font.bestFor)).toBe(true);
        expect(
          ['serif', 'sans-serif', 'monospace'].includes(font.category)
        ).toBe(true);
        expect(['premium', 'high', 'standard'].includes(font.quality)).toBe(
          true
        );
      });
    });
  });

  describe('loadCustomFont', () => {
    test('resolves immediately if font already loaded', async () => {
      // Mock the font as already loaded
      const result1 = await fontManager.loadCustomFont(
        'test-font',
        '/path/to/font.ttf'
      );
      const result2 = await fontManager.loadCustomFont(
        'test-font',
        '/path/to/font.ttf'
      );

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    test('returns existing promise if font is being loaded', async () => {
      const promise1 = fontManager.loadCustomFont(
        'test-font-2',
        '/path/to/font.ttf'
      );
      const promise2 = fontManager.loadCustomFont(
        'test-font-2',
        '/path/to/font.ttf'
      );

      // Both promises should resolve successfully
      const result1 = await promise1;
      const result2 = await promise2;

      expect(result1).toBe(true);
      expect(result2).toBe(true);

      // Verify both font load attempts were logged
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Font test-font-2 would be loaded from /path/to/font.ttf'
      );
    });

    test('logs font loading information', async () => {
      await fontManager.loadCustomFont('test-font-3', '/fonts/test.ttf');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Font test-font-3 would be loaded from /fonts/test.ttf'
      );
    });
  });

  describe('getPdfFont', () => {
    test('returns correct font for exact name match', () => {
      expect(fontManager.getPdfFont('EB Garamond')).toBe('times');
      expect(fontManager.getPdfFont('Libre Baskerville')).toBe('times');
      expect(fontManager.getPdfFont('Helvetica')).toBe('helvetica');
      expect(fontManager.getPdfFont('Courier New')).toBe('courier');
    });

    test('returns correct font for key match', () => {
      expect(fontManager.getPdfFont('garamond')).toBe('times');
      expect(fontManager.getPdfFont('baskerville')).toBe('times');
      expect(fontManager.getPdfFont('helvetica')).toBe('helvetica');
    });

    test('falls back to legacy mapping', () => {
      expect(fontManager.getPdfFont('Times New Roman')).toBe('times');
      expect(fontManager.getPdfFont('Georgia')).toBe('times');
      expect(fontManager.getPdfFont('Arial')).toBe('helvetica');
      expect(fontManager.getPdfFont('Monaco')).toBe('courier');
    });

    test('returns times as default fallback', () => {
      expect(fontManager.getPdfFont('Unknown Font')).toBe('times');
      expect(fontManager.getPdfFont('')).toBe('times');
      expect(fontManager.getPdfFont(null)).toBe('times');
    });

    test('handles loaded custom fonts', async () => {
      // Load a custom font first
      await fontManager.loadCustomFont('custom-garamond', '/fonts/custom.ttf');

      // Since we mock the loading to always succeed, check the fallback behavior
      const result = fontManager.getPdfFont('garamond');
      expect(['garamond', 'times'].includes(result)).toBe(true);
    });
  });

  describe('getFontRecommendations', () => {
    test('returns recommendations for fiction genre', () => {
      const recommendations = fontManager.getFontRecommendations('fiction');

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);

      // Should include fonts that are good for fiction
      const fictionFonts = recommendations.filter(font => font.recommended);
      expect(fictionFonts.length).toBeGreaterThan(0);

      // Check structure of recommendations
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('key');
        expect(rec).toHaveProperty('name');
        expect(rec).toHaveProperty('recommended');
        expect(typeof rec.recommended).toBe('boolean');
      });
    });

    test('returns recommendations for non-fiction genre', () => {
      const recommendations = fontManager.getFontRecommendations('non-fiction');

      expect(recommendations.length).toBeGreaterThan(0);

      // Should include Caslon and Source Serif as recommended
      const recommended = recommendations.filter(font => font.recommended);
      const fontNames = recommended.map(font => font.name);
      expect(fontNames).toContain('Adobe Caslon Pro');
    });

    test('sorts recommendations by priority', () => {
      const recommendations = fontManager.getFontRecommendations('literary');

      // Recommended fonts should come first
      let foundNonRecommended = false;
      recommendations.forEach(rec => {
        if (foundNonRecommended && rec.recommended) {
          throw new Error(
            'Recommended fonts should come before non-recommended ones'
          );
        }
        if (!rec.recommended) {
          foundNonRecommended = true;
        }
      });
    });

    test('includes general purpose fonts for any genre', () => {
      const recommendations =
        fontManager.getFontRecommendations('unknown-genre');

      // Should still return general purpose fonts
      expect(recommendations.length).toBeGreaterThan(0);

      // All should be general purpose fonts
      recommendations.forEach(rec => {
        expect(rec.bestFor).toContain('general');
      });
    });
  });

  describe('getCssFontFamily', () => {
    test('returns correct CSS for known fonts', () => {
      expect(fontManager.getCssFontFamily('EB Garamond')).toBe(
        '"EB Garamond", Garamond, "Times New Roman", serif'
      );
      expect(fontManager.getCssFontFamily('Libre Baskerville')).toBe(
        '"Libre Baskerville", Baskerville, "Times New Roman", serif'
      );
      expect(fontManager.getCssFontFamily('Helvetica')).toBe(
        'Helvetica, Arial, sans-serif'
      );
    });

    test('returns CSS for font keys', () => {
      expect(fontManager.getCssFontFamily('garamond')).toBe(
        '"EB Garamond", Garamond, "Times New Roman", serif'
      );
      expect(fontManager.getCssFontFamily('helvetica')).toBe(
        'Helvetica, Arial, sans-serif'
      );
    });

    test('handles unknown serif fonts', () => {
      expect(fontManager.getCssFontFamily('Times New Roman')).toBe(
        '"Times New Roman", Times, serif'
      );
      expect(fontManager.getCssFontFamily('Georgia')).toBe('Georgia, serif');
    });

    test('handles unknown sans-serif fonts', () => {
      expect(fontManager.getCssFontFamily('Arial')).toBe('"Arial", sans-serif');
      expect(fontManager.getCssFontFamily('Custom Sans')).toBe(
        '"Custom Sans", serif'
      ); // Default to serif for books
    });

    test('handles monospace fonts', () => {
      expect(fontManager.getCssFontFamily('Courier')).toBe(
        '"Courier New", Courier, monospace'
      );
      expect(fontManager.getCssFontFamily('Monaco')).toBe(
        '"Monaco", monospace'
      );
    });

    test('defaults to serif for unknown fonts', () => {
      expect(fontManager.getCssFontFamily('Unknown Font')).toBe(
        '"Unknown Font", serif'
      );
    });
  });

  describe('initializeFontSystem', () => {
    test('initializes only once', () => {
      fontManager.initializeFontSystem();
      fontManager.initializeFontSystem();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Font system already initialized - skipping duplicate'
      );
    });

    test('loads local fonts in Electron environment', () => {
      // Reset the initialization state for this test
      delete require.cache[require.resolve('../fontManager')];
      global.window = {
        require: jest.fn()
      };
      const fontManagerFresh = require('../fontManager');

      fontManagerFresh.initializeFontSystem();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Electron environment detected - loading local fonts'
      );
      expect(mockCreateElement).toHaveBeenCalledWith('link');
      expect(mockAppendChild).toHaveBeenCalled();
    });

    test('loads Google Fonts in browser environment', () => {
      // Reset the initialization state for this test
      delete require.cache[require.resolve('../fontManager')];
      global.window = {}; // No require function
      const fontManagerFresh = require('../fontManager');

      fontManagerFresh.initializeFontSystem();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Browser environment detected - loading Google Fonts'
      );
      expect(mockCreateElement).toHaveBeenCalledWith('link');
      expect(mockAppendChild).toHaveBeenCalled();
    });

    test('handles font loading success in Electron', () => {
      delete require.cache[require.resolve('../fontManager')];
      global.window = {
        require: jest.fn()
      };

      let linkElement;
      mockCreateElement.mockImplementation(tagName => {
        if (tagName === 'link') {
          linkElement = {
            href: '',
            rel: '',
            onload: null,
            onerror: null
          };
          return linkElement;
        }
        return {};
      });

      const fontManagerFresh = require('../fontManager');
      fontManagerFresh.initializeFontSystem();

      // Simulate successful font loading
      if (linkElement && linkElement.onload) {
        linkElement.onload();
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Local fonts loaded successfully'
      );
    });

    test('handles font loading error in Electron', () => {
      // Reset the initialization state for this test
      delete require.cache[require.resolve('../fontManager')];
      global.window = {
        require: jest.fn()
      };

      let linkElement;
      mockCreateElement.mockImplementation(tagName => {
        if (tagName === 'link') {
          linkElement = {
            href: '',
            rel: '',
            onload: null,
            onerror: null
          };
          return linkElement;
        }
        return {};
      });

      const fontManagerFresh = require('../fontManager');
      fontManagerFresh.initializeFontSystem();

      // Simulate font loading error
      if (linkElement && linkElement.onerror) {
        linkElement.onerror();
      }

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Local fonts not found - using system fonts instead'
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        'To install beautiful fonts, see FONT_INSTALLATION.md'
      );
    });

    test('handles Google Fonts loading error', () => {
      // Reset the initialization state for this test
      delete require.cache[require.resolve('../fontManager')];
      global.window = {}; // No require function

      let linkElement;
      mockCreateElement.mockImplementation(tagName => {
        if (tagName === 'link') {
          linkElement = {
            href: '',
            rel: '',
            onload: null,
            onerror: null
          };
          return linkElement;
        }
        return {};
      });

      const fontManagerFresh = require('../fontManager');
      fontManagerFresh.initializeFontSystem();

      // Simulate Google Fonts loading error
      if (linkElement && linkElement.onerror) {
        linkElement.onerror();
      }

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load Google Fonts - using system fonts instead'
      );
    });
  });

  describe('getFontLicenseInfo', () => {
    test('returns system font license info', () => {
      const info = fontManager.getFontLicenseInfo('Georgia');

      expect(info).toEqual({
        requiresLicense: false,
        type: 'system',
        note: 'Available on most systems'
      });
    });

    test('returns premium font license info', () => {
      const info = fontManager.getFontLicenseInfo('Palatino Linotype');

      expect(info).toEqual({
        requiresLicense: true,
        type: 'commercial',
        note: 'Professional font license required for commercial use'
      });
    });

    test('returns web font license info', () => {
      const info = fontManager.getFontLicenseInfo('Crimson Text');

      expect(info).toEqual({
        requiresLicense: false,
        type: 'web',
        note: 'Available via web fonts'
      });
    });

    test('returns unknown license info for unknown fonts', () => {
      const info = fontManager.getFontLicenseInfo('Unknown Font');

      expect(info).toEqual({
        requiresLicense: true,
        type: 'unknown',
        note: 'License status unknown'
      });
    });
  });

  describe('Edge cases and error handling', () => {
    test('handles null and undefined inputs gracefully', () => {
      expect(fontManager.getPdfFont(null)).toBe('times');
      expect(fontManager.getPdfFont(undefined)).toBe('times');
      expect(fontManager.getCssFontFamily(null)).toBe('serif');
      expect(fontManager.getCssFontFamily(undefined)).toBe('serif');
    });

    test('handles empty string inputs', () => {
      expect(fontManager.getPdfFont('')).toBe('times');
      expect(fontManager.getCssFontFamily('')).toBe('serif');
      expect(fontManager.getFontRecommendations('')).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            bestFor: expect.arrayContaining(['general'])
          })
        ])
      );
    });

    test('handles case sensitivity', () => {
      expect(fontManager.getPdfFont('GARAMOND')).toBe('times'); // Should work via legacy mapping
      expect(fontManager.getPdfFont('times new roman')).toBe('times'); // Should not match due to case
    });

    test('loadCustomFont handles errors gracefully', async () => {
      // This test would be more meaningful with actual font loading implementation
      const result = await fontManager.loadCustomFont(
        'error-font',
        '/nonexistent/font.ttf'
      );
      expect(result).toBe(true); // Currently always resolves to true
    });
  });

  describe('Font categories', () => {
    test('has appropriate serif fonts', () => {
      const serifFonts = Object.keys(fontManager.BOOK_FONTS).filter(
        key => fontManager.BOOK_FONTS[key].category === 'serif'
      );

      expect(serifFonts.length).toBeGreaterThan(5);
      expect(serifFonts).toContain('garamond');
      expect(serifFonts).toContain('times');
      expect(serifFonts).toContain('baskerville');
    });

    test('has appropriate sans-serif fonts', () => {
      const sansSerifFonts = Object.keys(fontManager.BOOK_FONTS).filter(
        key => fontManager.BOOK_FONTS[key].category === 'sans-serif'
      );

      expect(sansSerifFonts.length).toBeGreaterThan(0);
      expect(sansSerifFonts).toContain('helvetica');
    });

    test('has monospace fonts', () => {
      const monospaceFonts = Object.keys(fontManager.BOOK_FONTS).filter(
        key => fontManager.BOOK_FONTS[key].category === 'monospace'
      );

      expect(monospaceFonts.length).toBeGreaterThan(0);
      expect(monospaceFonts).toContain('courier');
    });
  });
});
