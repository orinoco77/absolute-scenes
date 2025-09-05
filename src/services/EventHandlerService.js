/**
 * Service class to handle browser events and Electron IPC communication
 * Following Single Responsibility Principle
 */
export class EventHandlerService {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Check if we're in Electron environment
   */
  isElectron() {
    return (
      typeof window !== 'undefined' && typeof window.require === 'function'
    );
  }

  /**
   * Get Electron IPC renderer if available
   */
  getIpcRenderer() {
    if (!this.isElectron()) {
      return null;
    }

    try {
      const electron = window.require('electron');
      return electron.ipcRenderer;
    } catch (error) {
      console.warn('Failed to load Electron APIs:', error);
      return null;
    }
  }

  /**
   * Set up beforeunload event listener to prevent accidental window close
   */
  setupBeforeUnloadHandler(hasUnsavedChanges, userHasInteracted) {
    const handleBeforeUnload = event => {
      // Check if user has unsaved changes before allowing navigation
      if (hasUnsavedChanges()) {
        // Prevent navigation and show confirmation dialog
        event.preventDefault();
        // Modern browsers require both preventDefault and returnValue
        event.returnValue =
          'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    // Track user interactions for modern browser beforeunload requirements
    const handleUserInteraction = () => {
      const currentUserInteracted = userHasInteracted();
      if (!currentUserInteracted) {
        // User interaction detected - enables beforeunload prompts in modern browsers
        // This should be handled by the caller
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    // Set up event handlers to prevent data loss

    // Store listeners for cleanup
    this.listeners.set('beforeunload', handleBeforeUnload);
    this.listeners.set('click', handleUserInteraction);
    this.listeners.set('keydown', handleUserInteraction);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      // Clean up event handlers
      this.listeners.clear();
    };
  }

  /**
   * Set up keyboard shortcuts
   */
  setupKeyboardShortcuts(onSave, canSave) {
    const handleKeyDown = e => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          e.stopPropagation();

          if (canSave()) {
            onSave();
          }
        }
      }
    };

    // Use capture phase to ensure we get the event first
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }

  /**
   * Set up Electron IPC event handlers
   */
  setupIpcHandlers(handlers) {
    const ipcRenderer = this.getIpcRenderer();
    if (!ipcRenderer) {
      return null;
    }

    // Register all IPC event listeners
    Object.entries(handlers).forEach(([eventName, handler]) => {
      ipcRenderer.on(eventName, handler);
    });

    // Set IPC ready flag for file association handling
    window.ipcReady = true;

    return () => {
      Object.keys(handlers).forEach(eventName => {
        ipcRenderer.removeAllListeners(eventName);
      });
      // Clear IPC ready flag
      window.ipcReady = false;
    };
  }

  /**
   * Update window title based on book state
   */
  updateWindowTitle(
    currentFilePath,
    hasUnsavedChanges,
    bookTitle = 'Untitled'
  ) {
    let fileName = bookTitle || 'Untitled';
    if (currentFilePath) {
      // Extract just the filename from the full path
      fileName = currentFilePath
        .split(/[\\/]/)
        .pop()
        .replace(/\.(book|json)$/, '');
    }
    const unsavedIndicator = hasUnsavedChanges ? ' *' : '';
    const newTitle = `${fileName}${unsavedIndicator} - AbsoluteScenes`;
    document.title = newTitle;
  }

  /**
   * Expose function to Electron main process
   */
  exposeToElectron(functionName, fn) {
    // Check if we're running in Electron (electronAPI exists)
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Running in Electron context
      if (
        functionName === 'hasUnsavedChanges' &&
        window.electronAPI.setHasUnsavedChanges
      ) {
        // Use the dedicated setter for hasUnsavedChanges
        window.electronAPI.setHasUnsavedChanges(fn);
      } else {
        // For other functions, store in extensions
        // eslint-disable-next-line no-console
        console.log(
          `Storing ${functionName} in extensions due to read-only electronAPI`
        );
        window._electronAPIExtensions = window._electronAPIExtensions || {};
        window._electronAPIExtensions[functionName] = fn;
      }
    } else {
      // Running in browser (Vite dev server) - create fallback API
      if (!window._mockElectronAPI) {
        window._mockElectronAPI = {
          hasUnsavedChanges: null
        };
      }
      window._mockElectronAPI[functionName] = fn;
      // eslint-disable-next-line no-console
      console.log(
        `Mock electronAPI: Set ${functionName} function (running in browser)`
      );
    }
  }

  /**
   * Clean up all event listeners
   */
  cleanup() {
    this.listeners.forEach((listener, eventName) => {
      if (eventName === 'keydown') {
        window.removeEventListener(eventName, listener, { capture: true });
      } else {
        window.removeEventListener(eventName, listener);
      }
    });
    this.listeners.clear();
  }
}
