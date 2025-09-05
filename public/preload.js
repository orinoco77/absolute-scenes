/* eslint-env browser */
const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script starting...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveBookDialog: (bookData, existingFilePath) =>
    ipcRenderer.invoke('save-book-dialog', bookData, existingFilePath),
  saveBookToFile: (bookData, filePath) =>
    ipcRenderer.invoke('save-book-to-file', bookData, filePath),
  saveRecoveredBook: data => ipcRenderer.invoke('save-recovered-book', data),

  // Export operations
  savePdfDialog: (pdfDataUrl, suggestedFilename) =>
    ipcRenderer.invoke('save-pdf-dialog', pdfDataUrl, suggestedFilename),
  saveHtmlDialog: (htmlContent, suggestedFilename) =>
    ipcRenderer.invoke('save-html-dialog', htmlContent, suggestedFilename),
  saveEpubDialog: (epubBlob, suggestedFilename) =>
    ipcRenderer.invoke('save-epub-dialog', epubBlob, suggestedFilename),

  // Spell checker
  getAvailableSpellCheckerLanguages: () =>
    ipcRenderer.invoke('get-available-spell-checker-languages'),
  saveSpellCheckerLanguage: language =>
    ipcRenderer.invoke('save-spell-checker-language', language),

  // Notifications
  showNotification: (title, body) =>
    ipcRenderer.send('show-notification', { title, body }),

  // IPC ready check
  ipcReady: () => ipcRenderer.invoke('ipc-ready'),

  // Listen for menu actions
  onMenuAction: callback => {
    const menuChannels = [
      'menu-new-book',
      'menu-save-book',
      'menu-save-as',
      'menu-export-book',
      'menu-delete',
      'menu-new-chapter',
      'menu-delete-chapter',
      'menu-new-part',
      'menu-delete-part',
      'menu-new-scene',
      'menu-delete-scene',
      'menu-toggle-recycle-bin',
      'menu-template-settings',
      'menu-spell-check-settings',
      'menu-font-settings',
      'menu-github-integration',
      'menu-backup-recovery',
      'menu-empty-recycle-bin'
    ];

    menuChannels.forEach(channel => {
      ipcRenderer.on(channel, callback);
    });

    // Return cleanup function
    return () => {
      menuChannels.forEach(channel => {
        ipcRenderer.removeListener(channel, callback);
      });
    };
  },

  // Listen for book loading
  onBookLoaded: callback => {
    ipcRenderer.on('book-loaded', callback);
    return () => ipcRenderer.removeListener('book-loaded', callback);
  },

  // Listen for Scrivener import results
  onImportScrivenerResult: callback => {
    ipcRenderer.on('import-scrivener-result', callback);
    return () =>
      ipcRenderer.removeListener('import-scrivener-result', callback);
  },

  // Fullscreen handling
  onFullscreenExit: () => {
    ipcRenderer.send('fullscreen-exited');
  },

  // Unsaved changes check - using a mutable container
  _unsavedChangesChecker: { fn: null },
  hasUnsavedChanges: () => {
    const checker =
      window.electronAPI._unsavedChangesChecker.fn ||
      window._electronAPIExtensions?.hasUnsavedChanges;
    return checker ? checker() : false;
  },

  // Allow renderer to set hasUnsavedChanges function
  setHasUnsavedChanges: fn => {
    window.electronAPI._unsavedChangesChecker.fn = fn;
  }
});

// Handle fullscreen changes for distraction-free mode
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      // Exiting fullscreen - notify main process
      window.electronAPI.onFullscreenExit();
    }
  });
});
