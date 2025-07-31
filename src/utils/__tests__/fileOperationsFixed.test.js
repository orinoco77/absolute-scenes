// Mock DOM methods for browser fallback
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

// Mock window.require for Electron detection
const mockElectron = {
  ipcRenderer: {
    invoke: jest.fn()
  }
};

describe('fileOperations (Fixed)', () => {
  let fileOperations;
  let consoleLogSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Setup console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock DOM methods
    mockCreateElement.mockImplementation(tagName => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: mockClick
        };
      }
      return {};
    });

    // Store original methods
    const originalCreateElement = document.createElement;
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;

    document.createElement = mockCreateElement;

    // Mock document.body properly
    Object.defineProperty(document, 'body', {
      value: { appendChild: mockAppendChild, removeChild: mockRemoveChild },
      writable: true
    });
    URL.createObjectURL = mockCreateObjectURL.mockReturnValue('mock-blob-url');
    URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock Blob
    global.Blob = jest.fn().mockImplementation((content, options) => ({
      content,
      options
    }));
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    delete global.window;
    delete global.Blob;
  });

  describe('Browser environment', () => {
    beforeEach(() => {
      // Set up browser environment - remove require function if it exists
      global.window = {};
      // Make sure window.require is undefined
      delete global.window.require;
      // Also handle the case where Jest sets up window differently
      if (typeof window !== 'undefined') {
        delete window.require;
      }
      // Re-import the module after setting up environment
      delete require.cache[require.resolve('../fileOperations')];
      fileOperations = require('../fileOperations');
    });

    test('saveBook falls back to browser save', async () => {
      const bookData = { title: 'Browser Book', author: 'Browser Author' };

      const result = await fileOperations.saveBook(bookData);

      // Check if other expectations pass first to see if the function actually ran
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-blob-url');
      expect(result).toEqual({ success: true, filePath: 'downloaded' });

      // Now check console.warn - this might be the last failing expectation
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Electron IPC not available - running in browser mode'
      );
    });

    test('saveBookToFile falls back to browser save', async () => {
      const bookData = { title: 'Browser Book' };
      const filePath = '/some/path.book';

      const result = await fileOperations.saveBookToFile(bookData, filePath);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Electron IPC not available - running in browser mode'
      );
      expect(result).toEqual({ success: true, filePath: 'downloaded' });
    });

    test('handles browser save errors', async () => {
      const bookData = { title: 'Test Book' };
      const error = new Error('Browser save failed');

      mockCreateElement.mockImplementation(() => {
        throw error;
      });

      const result = await fileOperations.saveBook(bookData);

      expect(result).toEqual({ success: false, error: 'Browser save failed' });
    });

    test('creates proper blob structure', async () => {
      const bookData = { title: 'Test', chapters: [] };

      await fileOperations.saveBook(bookData);

      expect(global.Blob).toHaveBeenCalledWith(
        [JSON.stringify(bookData, null, 2)],
        { type: 'application/json' }
      );
    });

    test('cleans up DOM elements', async () => {
      const bookData = { title: 'Test' };

      await fileOperations.saveBook(bookData);

      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Electron environment', () => {
    beforeEach(() => {
      // Set up Electron environment
      global.window = {
        require: jest.fn().mockReturnValue(mockElectron)
      };
      // Re-import the module after setting up environment
      delete require.cache[require.resolve('../fileOperations')];
      fileOperations = require('../fileOperations');
    });

    test('successfully saves book', async () => {
      const bookData = { title: 'Test Book', author: 'Test Author' };
      const expectedResult = { success: true, filePath: '/path/to/book.book' };

      mockElectron.ipcRenderer.invoke
        .mockResolvedValueOnce(true) // ipc-ready check
        .mockResolvedValueOnce(expectedResult); // save-book-dialog

      const result = await fileOperations.saveBook(bookData);

      expect(mockElectron.ipcRenderer.invoke).toHaveBeenCalledWith(
        'save-book-dialog',
        bookData,
        null
      );
      expect(result).toEqual(expectedResult);
    });

    test('handles IPC errors', async () => {
      const bookData = { title: 'Test Book' };
      const error = new Error('IPC communication failed');

      mockElectron.ipcRenderer.invoke
        .mockResolvedValueOnce(true) // ipc-ready check
        .mockRejectedValueOnce(error);

      const result = await fileOperations.saveBook(bookData);

      expect(result).toEqual({
        success: false,
        error: 'IPC communication failed'
      });
    });

    test('saveBookToFile with valid path', async () => {
      const bookData = { title: 'Test Book' };
      const filePath = '/path/to/save.book';
      const expectedResult = { success: true, filePath };

      mockElectron.ipcRenderer.invoke
        .mockResolvedValueOnce(true) // ipc-ready check
        .mockResolvedValueOnce(expectedResult);

      const result = await fileOperations.saveBookToFile(bookData, filePath);

      expect(result).toEqual(expectedResult);
    });

    test('saveBookToFile without path returns error', async () => {
      const bookData = { title: 'Test Book' };

      const result = await fileOperations.saveBookToFile(bookData, null);

      expect(result).toEqual({
        success: false,
        error: 'No file path provided'
      });
    });
  });
});
