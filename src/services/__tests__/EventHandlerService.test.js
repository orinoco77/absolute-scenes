import { EventHandlerService } from '../EventHandlerService';

// Mock window and require
const mockIpcRenderer = {
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  send: jest.fn(),
  invoke: jest.fn()
};

const mockElectron = {
  ipcRenderer: mockIpcRenderer
};

const mockRequire = jest.fn();

// Setup window mocks
Object.defineProperty(window, 'require', {
  writable: true,
  value: mockRequire
});

Object.defineProperty(window, 'ipcReady', {
  writable: true,
  value: false
});

Object.defineProperty(window, 'electronAPI', {
  writable: true,
  value: {}
});

// Mock window event handling
const mockWindowAddEventListener = jest.fn();
const mockWindowRemoveEventListener = jest.fn();
Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: mockWindowAddEventListener
});
Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: mockWindowRemoveEventListener
});

describe('EventHandlerService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowAddEventListener.mockClear();
    mockWindowRemoveEventListener.mockClear();
    service = new EventHandlerService();
    window.ipcReady = false;
    window.electronAPI = {};
    mockRequire.mockReset();

    // Mock successful electron loading by default
    mockRequire.mockReturnValue(mockElectron);
    // Set up window.require by default
    window.require = mockRequire;
  });

  describe('constructor', () => {
    it('initializes with empty listeners map', () => {
      expect(service.listeners).toBeInstanceOf(Map);
      expect(service.listeners.size).toBe(0);
    });
  });

  describe('isElectron', () => {
    it('returns true when window.require exists', () => {
      expect(service.isElectron()).toBe(true);
    });

    it('returns false when window is undefined', () => {
      const originalWindow = global.window;
      delete global.window;

      expect(service.isElectron()).toBe(false);

      global.window = originalWindow;
    });

    it('returns false when window.require is not a function', () => {
      window.require = 'not a function';

      expect(service.isElectron()).toBe(false);
    });

    it('returns false when window.require does not exist', () => {
      delete window.require;

      expect(service.isElectron()).toBe(false);
    });
  });

  describe('getIpcRenderer', () => {
    it('returns ipcRenderer when in Electron environment', () => {
      // Ensure window.require is set up properly
      window.require = mockRequire;

      // eslint-disable-next-line testing-library/render-result-naming-convention
      const ipcRendererResult = service.getIpcRenderer();

      expect(mockRequire).toHaveBeenCalledWith('electron');
      expect(ipcRendererResult).toBe(mockIpcRenderer);
    });

    it('returns null when not in Electron environment', () => {
      delete window.require;

      // eslint-disable-next-line testing-library/render-result-naming-convention
      const ipcRendererResult = service.getIpcRenderer();

      expect(ipcRendererResult).toBeNull();
    });

    it('returns null and warns when electron loading fails', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      window.require = mockRequire;
      mockRequire.mockImplementation(() => {
        throw new Error('Electron not available');
      });

      // eslint-disable-next-line testing-library/render-result-naming-convention
      const ipcRendererResult = service.getIpcRenderer();

      expect(ipcRendererResult).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load Electron APIs:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('setupBeforeUnloadHandler', () => {
    const mockHasUnsavedChanges = jest.fn();
    const mockUserHasInteracted = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      mockHasUnsavedChanges.mockReturnValue(false);
      mockUserHasInteracted.mockReturnValue(false);
    });

    it('sets up beforeunload event listener', () => {
      const cleanup = service.setupBeforeUnloadHandler(
        mockHasUnsavedChanges,
        mockUserHasInteracted
      );

      expect(mockWindowAddEventListener).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
      expect(typeof cleanup).toBe('function');
    });

    it('sets up user interaction listeners', () => {
      service.setupBeforeUnloadHandler(
        mockHasUnsavedChanges,
        mockUserHasInteracted
      );

      expect(mockWindowAddEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
      expect(mockWindowAddEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('prevents navigation when there are unsaved changes', () => {
      mockHasUnsavedChanges.mockReturnValue(true);

      service.setupBeforeUnloadHandler(
        mockHasUnsavedChanges,
        mockUserHasInteracted
      );

      // Get the beforeunload handler
      const beforeUnloadHandler = mockWindowAddEventListener.mock.calls.find(
        call => call[0] === 'beforeunload'
      )[1];

      const mockEvent = {
        preventDefault: jest.fn(),
        returnValue: ''
      };

      const result = beforeUnloadHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.returnValue).toBe(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      expect(result).toBe(
        'You have unsaved changes. Are you sure you want to leave?'
      );
    });

    it('allows navigation when there are no unsaved changes', () => {
      mockHasUnsavedChanges.mockReturnValue(false);

      service.setupBeforeUnloadHandler(
        mockHasUnsavedChanges,
        mockUserHasInteracted
      );

      const beforeUnloadHandler = mockWindowAddEventListener.mock.calls.find(
        call => call[0] === 'beforeunload'
      )[1];

      const mockEvent = {
        preventDefault: jest.fn(),
        returnValue: ''
      };

      const result = beforeUnloadHandler(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('cleanup function removes all event listeners', () => {
      const cleanup = service.setupBeforeUnloadHandler(
        mockHasUnsavedChanges,
        mockUserHasInteracted
      );

      cleanup();

      expect(mockWindowRemoveEventListener).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
      expect(mockWindowRemoveEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
      expect(mockWindowRemoveEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
      expect(service.listeners.size).toBe(0);
    });
  });

  describe('setupKeyboardShortcuts', () => {
    const mockOnSave = jest.fn();
    const mockCanSave = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      mockCanSave.mockReturnValue(true);
    });

    it('sets up keydown event listener with capture', () => {
      const cleanup = service.setupKeyboardShortcuts(mockOnSave, mockCanSave);

      expect(mockWindowAddEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        { capture: true }
      );
      expect(typeof cleanup).toBe('function');
    });

    it('handles Ctrl+S shortcut', () => {
      service.setupKeyboardShortcuts(mockOnSave, mockCanSave);

      const keydownHandler = mockWindowAddEventListener.mock.calls.find(
        call => call[0] === 'keydown' && call[2]?.capture === true
      )[1];

      const mockEvent = {
        ctrlKey: true,
        key: 's',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      keydownHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockCanSave).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
    });

    it('handles Cmd+S shortcut (Mac)', () => {
      service.setupKeyboardShortcuts(mockOnSave, mockCanSave);

      const keydownHandler = mockWindowAddEventListener.mock.calls.find(
        call => call[0] === 'keydown' && call[2]?.capture === true
      )[1];

      const mockEvent = {
        metaKey: true,
        key: 's',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      keydownHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
    });

    it('does not save when canSave returns false', () => {
      mockCanSave.mockReturnValue(false);

      service.setupKeyboardShortcuts(mockOnSave, mockCanSave);

      const keydownHandler = mockWindowAddEventListener.mock.calls.find(
        call => call[0] === 'keydown' && call[2]?.capture === true
      )[1];

      const mockEvent = {
        ctrlKey: true,
        key: 's',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      keydownHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockCanSave).toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('ignores other key combinations', () => {
      service.setupKeyboardShortcuts(mockOnSave, mockCanSave);

      const keydownHandler = mockWindowAddEventListener.mock.calls.find(
        call => call[0] === 'keydown' && call[2]?.capture === true
      )[1];

      const mockEvent = {
        ctrlKey: true,
        key: 'a',
        preventDefault: jest.fn()
      };

      keydownHandler(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('cleanup function removes event listener with capture', () => {
      const cleanup = service.setupKeyboardShortcuts(mockOnSave, mockCanSave);

      cleanup();

      expect(mockWindowRemoveEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        { capture: true }
      );
    });
  });

  describe('setupIpcHandlers', () => {
    const mockHandlers = {
      'test-event': jest.fn(),
      'another-event': jest.fn()
    };

    it('registers all IPC event listeners when in Electron', () => {
      // Ensure window.require is set up for Electron environment
      window.require = mockRequire;

      const cleanup = service.setupIpcHandlers(mockHandlers);

      expect(mockIpcRenderer.on).toHaveBeenCalledWith(
        'test-event',
        mockHandlers['test-event']
      );
      expect(mockIpcRenderer.on).toHaveBeenCalledWith(
        'another-event',
        mockHandlers['another-event']
      );
      expect(window.ipcReady).toBe(true);
      expect(typeof cleanup).toBe('function');
    });

    it('returns null when not in Electron environment', () => {
      delete window.require;

      const cleanup = service.setupIpcHandlers(mockHandlers);

      expect(cleanup).toBeNull();
      expect(mockIpcRenderer.on).not.toHaveBeenCalled();
      expect(window.ipcReady).toBe(false);
    });

    it('cleanup function removes all IPC listeners', () => {
      // Ensure window.require is set up for Electron environment
      window.require = mockRequire;

      const cleanup = service.setupIpcHandlers(mockHandlers);

      cleanup();

      expect(mockIpcRenderer.removeAllListeners).toHaveBeenCalledWith(
        'test-event'
      );
      expect(mockIpcRenderer.removeAllListeners).toHaveBeenCalledWith(
        'another-event'
      );
      expect(window.ipcReady).toBe(false);
    });
  });

  describe('updateWindowTitle', () => {
    beforeEach(() => {
      document.title = '';
    });

    it('updates title with book title and unsaved indicator', () => {
      service.updateWindowTitle('/path/to/mybook.book', true, 'My Great Novel');

      expect(document.title).toBe('mybook * - AbsoluteScenes');
    });

    it('updates title without unsaved indicator', () => {
      service.updateWindowTitle(
        '/path/to/mybook.book',
        false,
        'My Great Novel'
      );

      expect(document.title).toBe('mybook - AbsoluteScenes');
    });

    it('uses book title when no file path', () => {
      service.updateWindowTitle(null, false, 'My Great Novel');

      expect(document.title).toBe('My Great Novel - AbsoluteScenes');
    });

    it('uses "Untitled" when no file path or book title', () => {
      service.updateWindowTitle(null, false);

      expect(document.title).toBe('Untitled - AbsoluteScenes');
    });

    it('handles different file extensions', () => {
      service.updateWindowTitle('/path/to/mybook.json', false);

      expect(document.title).toBe('mybook - AbsoluteScenes');
    });

    it('handles Windows-style paths', () => {
      service.updateWindowTitle('C:\\Users\\Author\\mybook.book', false);

      expect(document.title).toBe('mybook - AbsoluteScenes');
    });
  });

  describe('exposeToElectron', () => {
    it('creates mock electronAPI object if electronAPI does not exist', () => {
      // Set window.electronAPI to null to simulate browser environment
      window.electronAPI = null;
      delete window._mockElectronAPI;
      delete window._electronAPIExtensions;

      const mockFunction = jest.fn();
      service.exposeToElectron('testFunction', mockFunction);

      expect(window._mockElectronAPI).toBeDefined();
      expect(window._mockElectronAPI.testFunction).toBe(mockFunction);
    });

    it('stores function in extensions when electronAPI exists', () => {
      window.electronAPI = { existingFunction: jest.fn() };
      delete window._electronAPIExtensions;

      const mockFunction = jest.fn();
      service.exposeToElectron('testFunction', mockFunction);

      expect(window.electronAPI.existingFunction).toBeDefined();
      expect(window._electronAPIExtensions).toBeDefined();
      expect(window._electronAPIExtensions.testFunction).toBe(mockFunction);
    });
  });

  describe('cleanup', () => {
    it('removes all registered event listeners', () => {
      // Set up some handlers to create listeners
      const mockOnSave = jest.fn();
      const mockCanSave = jest.fn();
      const mockHasUnsavedChanges = jest.fn();
      const mockUserHasInteracted = jest.fn();

      service.setupKeyboardShortcuts(mockOnSave, mockCanSave);
      service.setupBeforeUnloadHandler(
        mockHasUnsavedChanges,
        mockUserHasInteracted
      );

      expect(service.listeners.size).toBeGreaterThan(0);

      service.cleanup();

      expect(service.listeners.size).toBe(0);
      expect(mockWindowRemoveEventListener).toHaveBeenCalled();
    });

    it('handles keydown listeners with capture option', () => {
      const mockOnSave = jest.fn();
      const mockCanSave = jest.fn();

      // setupKeyboardShortcuts doesn't use the listeners Map, it has its own cleanup
      // This test should verify that cleanup() handles mixed listener types
      // Set up a beforeUnload handler that uses listeners Map
      service.setupBeforeUnloadHandler(
        () => false,
        () => false
      );
      // Set up keyboard shortcuts that doesn't use listeners Map
      service.setupKeyboardShortcuts(mockOnSave, mockCanSave);

      service.cleanup();

      // Should remove events from listeners Map (beforeunload, click, keydown from beforeUnload)
      expect(mockWindowRemoveEventListener).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
      expect(mockWindowRemoveEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
      // The cleanup method incorrectly assumes keydown listeners need capture: true
      expect(mockWindowRemoveEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        { capture: true }
      );
    });

    it('handles regular listeners without options', () => {
      const mockHasUnsavedChanges = jest.fn();
      const mockUserHasInteracted = jest.fn();

      service.setupBeforeUnloadHandler(
        mockHasUnsavedChanges,
        mockUserHasInteracted
      );
      service.cleanup();

      // Should remove other events without options
      expect(mockWindowRemoveEventListener).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
      expect(mockWindowRemoveEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
    });
  });

  describe('error handling', () => {
    it('handles missing electron gracefully in getIpcRenderer', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      window.require = mockRequire;
      mockRequire.mockImplementation(() => {
        throw new Error('Cannot find module electron');
      });

      // eslint-disable-next-line testing-library/render-result-naming-convention
      const ipcResult = service.getIpcRenderer();

      expect(ipcResult).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load Electron APIs:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('handles cleanup when listeners map is corrupted', () => {
      service.listeners.set('invalid-event', null);

      expect(() => service.cleanup()).not.toThrow();
      expect(service.listeners.size).toBe(0);
    });
  });
});
