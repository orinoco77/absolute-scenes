/* eslint-disable jest/no-conditional-expect */
/* eslint-disable no-unused-vars */
/**
 * Electron Main Process Testing
 * Tests the core IPC handlers and menu actions
 */

// Mock all Electron modules before any imports
const mockWindow = {
  isMinimized: jest.fn(() => false),
  restore: jest.fn(),
  focus: jest.fn(),
  isDestroyed: jest.fn(() => false),
  loadFile: jest.fn(),
  webContents: {
    send: jest.fn(),
    session: {
      clearStorageData: jest.fn()
    }
  }
};

const mockApp = {
  requestSingleInstanceLock: jest.fn(() => true),
  on: jest.fn(),
  quit: jest.fn(),
  whenReady: jest.fn(() => Promise.resolve()),
  dock: {
    setMenu: jest.fn()
  }
};

const mockDialog = {
  showSaveDialog: jest.fn(),
  showOpenDialog: jest.fn(),
  showMessageBox: jest.fn()
};

const mockMenu = {
  buildFromTemplate: jest.fn(),
  setApplicationMenu: jest.fn(),
  getApplicationMenu: jest.fn(() => ({
    getMenuItemById: jest.fn()
  }))
};

const mockIpcMain = {
  handle: jest.fn(),
  on: jest.fn()
};

const mockShell = {
  openExternal: jest.fn()
};

// Mock file system
const mockFs = {
  writeFile: jest.fn(() => Promise.resolve()),
  readFile: jest.fn(() => Promise.resolve('{"title": "Test Book"}')),
  access: jest.fn(() => Promise.resolve()),
  constants: { F_OK: 0 }
};

const mockFsSync = {
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => '{"title": "Test Book"}'),
  readdirSync: jest.fn(() => [])
};

const mockPath = {
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn(() => '/test'),
  basename: jest.fn(() => 'test.book'),
  extname: jest.fn(() => '.book')
};

// Mock xmldom
const mockDOMParser = {
  parseFromString: jest.fn(() => ({
    getElementsByTagName: jest.fn(() => [])
  }))
};

// Set up mocks
jest.mock('electron', () => ({
  app: mockApp,
  BrowserWindow: jest.fn(() => mockWindow),
  Menu: mockMenu,
  dialog: mockDialog,
  ipcMain: mockIpcMain,
  shell: mockShell
}));

jest.mock('fs', () => ({
  promises: mockFs
}));

jest.mock('fs', () => mockFsSync, { virtual: true });

jest.mock('path', () => mockPath);

jest.mock('xmldom', () => ({
  DOMParser: jest.fn(() => mockDOMParser)
}));

describe('Electron Main Process', () => {
  let electronModule;
  let ipcHandlers;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the handlers collection
    ipcHandlers = {};

    // Capture IPC handlers when they're registered
    mockIpcMain.handle.mockImplementation((channel, handler) => {
      ipcHandlers[channel] = handler;
    });

    // Mock successful save dialog
    mockDialog.showSaveDialog.mockResolvedValue({
      canceled: false,
      filePath: '/test/book.book'
    });
  });

  describe('IPC Handlers', () => {
    beforeEach(async () => {
      // Import and initialize electron main process
      // This will register the IPC handlers
      delete require.cache[require.resolve('../electron.js')];
      electronModule = require('../electron.js');
    });

    describe('save-book-dialog', () => {
      it('successfully saves a book with dialog', async () => {
        const mockBookData = {
          title: 'Test Book',
          author: 'Test Author',
          chapters: []
        };

        const handler = ipcHandlers['save-book-dialog'];
        expect(handler).toBeDefined();

        const result = await handler({}, mockBookData);

        expect(mockDialog.showSaveDialog).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            filters: expect.arrayContaining([
              { name: 'Book Files', extensions: ['book'] }
            ])
          })
        );

        expect(mockFs.writeFile).toHaveBeenCalledWith(
          '/test/book.book',
          expect.stringContaining('"title":"Test Book"'),
          'utf8'
        );

        expect(result).toEqual({
          success: true,
          filePath: '/test/book.book'
        });
      });

      it('handles user canceling save dialog', async () => {
        mockDialog.showSaveDialog.mockResolvedValue({ canceled: true });

        const handler = ipcHandlers['save-book-dialog'];
        const result = await handler({}, { title: 'Test' });

        expect(result).toEqual({
          success: false,
          error: 'Save canceled by user'
        });
      });

      it('handles file write errors', async () => {
        mockFs.writeFile.mockRejectedValue(new Error('Permission denied'));

        const handler = ipcHandlers['save-book-dialog'];
        const result = await handler({}, { title: 'Test' });

        expect(result).toEqual({
          success: false,
          error: 'Permission denied'
        });
      });

      it('prevents concurrent save operations', async () => {
        const handler = ipcHandlers['save-book-dialog'];

        // Start first save (don't await)
        const firstSave = handler({}, { title: 'Test 1' });

        // Try second save while first is in progress
        const result = await handler({}, { title: 'Test 2' });

        expect(result).toEqual({
          success: false,
          error: 'Another save operation is in progress'
        });

        // Wait for first save to complete
        await firstSave;
      });
    });

    describe('save-book-to-file', () => {
      it('saves book to specified file path', async () => {
        const mockBookData = { title: 'Direct Save Test' };
        const filePath = '/test/direct.book';

        const handler = ipcHandlers['save-book-to-file'];
        const result = await handler({}, mockBookData, filePath);

        expect(mockFs.writeFile).toHaveBeenCalledWith(
          filePath,
          expect.stringContaining('"title":"Direct Save Test"'),
          'utf8'
        );

        expect(result).toEqual({
          success: true,
          filePath: filePath
        });
      });
    });

    describe('save-recovered-book', () => {
      it('saves recovered book with suggested filename', async () => {
        mockDialog.showSaveDialog.mockResolvedValue({
          canceled: false,
          filePath: '/test/recovered.book'
        });

        const handler = ipcHandlers['save-recovered-book'];
        const result = await handler(
          {},
          {
            bookData: { title: 'Recovered Book' },
            suggestedFilename: 'recovered.book'
          }
        );

        expect(mockDialog.showSaveDialog).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            defaultPath: 'recovered.book'
          })
        );

        expect(result.success).toBe(true);
      });
    });

    describe('ipc-ready', () => {
      it('responds to IPC ready check', async () => {
        const handler = ipcHandlers['ipc-ready'];
        const result = await handler();

        expect(result).toBe(true);
      });
    });
  });

  describe('Menu Actions', () => {
    beforeEach(async () => {
      // Import electron module to build menu
      delete require.cache[require.resolve('../electron.js')];
      electronModule = require('../electron.js');
    });

    it('builds application menu with correct structure', () => {
      expect(mockMenu.buildFromTemplate).toHaveBeenCalled();

      const menuTemplate = mockMenu.buildFromTemplate.mock.calls[0][0];

      // Check File menu exists
      const fileMenu = menuTemplate.find(menu => menu.label === 'File');
      expect(fileMenu).toBeDefined();
      expect(fileMenu.submenu).toBeDefined();

      // Check specific menu items
      const saveItem = fileMenu.submenu.find(
        item => item.label === 'Save Book'
      );
      expect(saveItem).toBeDefined();
      expect(saveItem.accelerator).toBe('CmdOrCtrl+S');
      expect(typeof saveItem.click).toBe('function');

      const exportItem = fileMenu.submenu.find(
        item => item.label === 'Export Book...'
      );
      expect(exportItem).toBeDefined();
      expect(exportItem.accelerator).toBe('CmdOrCtrl+E');
    });

    it('menu actions send correct IPC messages', () => {
      const menuTemplate = mockMenu.buildFromTemplate.mock.calls[0][0];
      const fileMenu = menuTemplate.find(menu => menu.label === 'File');

      // Test Save Book menu action
      const saveItem = fileMenu.submenu.find(
        item => item.label === 'Save Book'
      );
      saveItem.click();

      expect(mockWindow.webContents.send).toHaveBeenCalledWith(
        'menu-save-book'
      );

      // Test Export Book menu action
      const exportItem = fileMenu.submenu.find(
        item => item.label === 'Export Book...'
      );
      exportItem.click();

      expect(mockWindow.webContents.send).toHaveBeenCalledWith(
        'menu-export-book'
      );
    });

    it('quit action calls app.quit', () => {
      const menuTemplate = mockMenu.buildFromTemplate.mock.calls[0][0];
      const fileMenu = menuTemplate.find(menu => menu.label === 'File');

      // Find Exit/Quit item (varies by platform)
      const quitItem = fileMenu.submenu.find(
        item => item.label === 'Exit' || item.label === 'Quit'
      );

      if (quitItem) {
        quitItem.click();
        expect(mockApp.quit).toHaveBeenCalled();
      }
    });
  });

  describe('App Lifecycle', () => {
    it('handles single instance lock correctly', () => {
      expect(mockApp.requestSingleInstanceLock).toHaveBeenCalled();
    });

    it('registers second-instance handler', () => {
      expect(mockApp.on).toHaveBeenCalledWith(
        'second-instance',
        expect.any(Function)
      );
    });

    it('focuses window when second instance is attempted', () => {
      const secondInstanceHandler = mockApp.on.mock.calls.find(
        call => call[0] === 'second-instance'
      )[1];

      secondInstanceHandler({}, [], '');

      expect(mockWindow.focus).toHaveBeenCalled();
    });
  });
});
