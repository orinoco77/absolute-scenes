/* eslint-disable no-unused-vars */
/**
 * Electron Helper Functions
 * Extracted from electron.js to make them testable
 */

/**
 * Validates book data before saving
 */
export function validateBookData(bookData) {
  if (!bookData || typeof bookData !== 'object') {
    return { valid: false, error: 'Invalid book data' };
  }
  if (!bookData.title || typeof bookData.title !== 'string') {
    return { valid: false, error: 'Book title is required' };
  }
  if (!Array.isArray(bookData.chapters)) {
    return { valid: false, error: 'Chapters must be an array' };
  }
  return { valid: true };
}

/**
 * Formats book data for file saving
 */
export function formatBookForSaving(bookData, version = '1.3.71') {
  return JSON.stringify(
    {
      ...bookData,
      savedAt: new Date().toISOString(),
      version
    },
    null,
    2
  );
}

/**
 * Gets file extension from path
 */
export function getFileExtension(filePath) {
  if (!filePath) return '.book';
  return filePath.endsWith('.json') ? '.json' : '.book';
}

/**
 * Validates file paths for security
 */
export function validateFilePath(filePath) {
  if (typeof filePath !== 'string') {
    return { valid: false, error: 'Invalid file path' };
  }
  if (filePath.trim().length === 0) {
    return { valid: false, error: 'Empty file path' };
  }
  if (filePath.includes('..')) {
    return { valid: false, error: 'Path traversal not allowed' };
  }
  return { valid: true };
}

/**
 * Handles file system errors with user-friendly messages
 */
export function handleFileSystemError(error) {
  if (error.code === 'EACCES') {
    return {
      success: false,
      error: 'Permission denied - please check file permissions'
    };
  } else if (error.code === 'ENOENT') {
    return {
      success: false,
      error: 'File or directory not found'
    };
  } else if (error.code === 'ENOSPC') {
    return {
      success: false,
      error: 'Not enough disk space'
    };
  } else {
    return {
      success: false,
      error: error.message || 'Unknown file system error'
    };
  }
}

/**
 * Gets save dialog options
 */
export function getSaveDialogOptions(existingFilePath = null) {
  return {
    defaultPath: existingFilePath || undefined,
    filters: [
      { name: 'Book Files', extensions: ['book'] },
      { name: 'JSON Files', extensions: ['json'] }
    ]
  };
}

/**
 * Gets open dialog options
 */
export function getOpenDialogOptions(type = 'book') {
  const options = {
    properties: ['openFile'],
    filters: []
  };

  if (type === 'book') {
    options.filters = [
      { name: 'Book Files', extensions: ['book'] },
      { name: 'JSON Files', extensions: ['json'] }
    ];
  } else if (type === 'scrivener') {
    options.filters = [{ name: 'Scrivener Projects', extensions: ['scriv'] }];
  }

  return options;
}

/**
 * Validates menu message formats
 */
export function isValidMenuMessage(message) {
  return (
    typeof message === 'string' &&
    message.startsWith('menu-') &&
    message.length > 5
  );
}

/**
 * Gets keyboard shortcut mappings
 */
export function getKeyboardShortcuts() {
  return {
    'CmdOrCtrl+S': 'menu-save-book',
    'CmdOrCtrl+Shift+S': 'menu-save-as',
    'CmdOrCtrl+E': 'menu-export-book',
    'CmdOrCtrl+N': 'new-book',
    'CmdOrCtrl+O': 'open-book',
    'CmdOrCtrl+I': 'import-scrivener'
  };
}

/**
 * Manages concurrent operations
 */
export class OperationManager {
  constructor() {
    this.activeOperations = new Set();
  }

  attemptOperation(operationId, operationType = 'save') {
    if (this.activeOperations.size > 0) {
      return {
        success: false,
        error: `Another ${operationType} operation is in progress`
      };
    }

    this.activeOperations.add(operationId);

    return { success: true, operationId };
  }

  completeOperation(operationId) {
    this.activeOperations.delete(operationId);
  }

  isOperationActive() {
    return this.activeOperations.size > 0;
  }

  getActiveOperationCount() {
    return this.activeOperations.size;
  }
}

/**
 * File path utilities
 */
export function getFilePathFromArgs(args) {
  if (!Array.isArray(args)) return null;

  // Look for file arguments that end with .book or .json
  const fileArg = args.find(
    arg =>
      typeof arg === 'string' &&
      (arg.endsWith('.book') || arg.endsWith('.json'))
  );

  return fileArg || null;
}

/**
 * Window management helpers
 */
export function getWindowOptions() {
  return {
    width: 1400,
    height: 940,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false
    }
  };
}

/**
 * About dialog content
 */
export function getAboutDialogOptions() {
  return {
    type: 'info',
    title: 'About Absolute Scenes',
    message: 'Absolute Scenes',
    detail:
      'A scene-based book writing application\n\nVersion: 1.3.71\n\nDeveloped by Adam Short',
    buttons: ['OK']
  };
}

/**
 * New book creation logic
 */
export function createDefaultBook() {
  return {
    title: '',
    author: '',
    chapters: [
      {
        id: 'default',
        title: 'Chapter 1',
        scenes: []
      }
    ],
    frontMatter: [],
    backMatter: [],
    characters: [],
    locations: [],
    backgrounds: [],
    settings: {
      template: 'default'
    }
  };
}

/**
 * Validates Scrivener project structure
 */
export function validateScrivenerProject(projectPath) {
  if (!projectPath || typeof projectPath !== 'string') {
    return { valid: false, error: 'Invalid project path' };
  }

  if (!projectPath.endsWith('.scriv')) {
    return { valid: false, error: 'Not a Scrivener project file' };
  }

  return { valid: true };
}

/**
 * RTF to plain text conversion (simplified for testing)
 */
export function convertRtfToPlainText(rtfContent) {
  if (!rtfContent || rtfContent.trim() === '') {
    return '';
  }

  // If it's not RTF content, return as-is
  if (!rtfContent.includes('{\\rtf')) {
    return rtfContent.trim();
  }

  // Basic RTF stripping for testing
  let text = rtfContent;

  // Remove RTF control sequences but preserve text
  text = text.replace(/{\\rtf1[^}]*}/g, ''); // Remove RTF header
  text = text.replace(/\\[a-z]+\d*/g, ' '); // Replace control words with space
  text = text.replace(/[{}]/g, ''); // Remove braces
  text = text.replace(/\s+/g, ' '); // Normalize whitespace

  return text.trim();
}

/**
 * Section type validation for Scrivener import
 */
export function isValidSectionType(sectionType, itemType = '', title = '') {
  if (!sectionType || typeof sectionType !== 'string') {
    return false;
  }

  // Basic validation - would be more complex in real implementation
  const validTypes = ['folder', 'text', 'part', 'chapter', 'scene'];
  const normalizedType = sectionType.toLowerCase();

  return validTypes.some(type => normalizedType.includes(type));
}

/**
 * Character folder detection
 */
export function isCharacterFolder(title) {
  if (!title || typeof title !== 'string') return false;

  const characterKeywords = ['character', 'people', 'person', 'cast'];
  const lowerTitle = title.toLowerCase();

  return characterKeywords.some(keyword => lowerTitle.includes(keyword));
}

/**
 * Location folder detection
 */
export function isLocationFolder(title) {
  if (!title || typeof title !== 'string') return false;

  const locationKeywords = ['location', 'place', 'setting', 'world'];
  const lowerTitle = title.toLowerCase();

  return locationKeywords.some(keyword => lowerTitle.includes(keyword));
}

/**
 * Book format validation
 */
export function validateBookFormat(bookData) {
  const validation = { valid: true, warnings: [], errors: [] };

  if (!bookData || typeof bookData !== 'object') {
    validation.valid = false;
    validation.errors.push('Book data must be an object');
    return validation;
  }

  // Check required fields
  if (!bookData.title) {
    validation.warnings.push('Book has no title');
  }

  if (!bookData.chapters || !Array.isArray(bookData.chapters)) {
    validation.valid = false;
    validation.errors.push('Book must have chapters array');
  } else if (bookData.chapters.length === 0) {
    validation.warnings.push('Book has no chapters');
  }

  // Validate chapter structure
  bookData.chapters?.forEach((chapter, index) => {
    if (!chapter.id) {
      validation.errors.push(`Chapter ${index + 1} missing id`);
      validation.valid = false;
    }
    if (!chapter.title) {
      validation.warnings.push(`Chapter ${index + 1} missing title`);
    }
    if (!Array.isArray(chapter.scenes)) {
      validation.errors.push(`Chapter ${index + 1} scenes must be array`);
      validation.valid = false;
    }
  });

  return validation;
}

/**
 * Menu template generation helpers
 */
export function getFileMenuTemplate(isMac = false) {
  return {
    label: 'File',
    submenu: [
      {
        label: 'New Book',
        accelerator: 'CmdOrCtrl+N',
        id: 'file-new'
      },
      {
        label: 'Open Book...',
        accelerator: 'CmdOrCtrl+O',
        id: 'file-open'
      },
      {
        label: 'Import from Scrivener...',
        accelerator: 'CmdOrCtrl+I',
        id: 'file-import'
      },
      { type: 'separator' },
      {
        label: 'Save Book',
        accelerator: 'CmdOrCtrl+S',
        id: 'file-save'
      },
      {
        label: 'Save As...',
        accelerator: 'CmdOrCtrl+Shift+S',
        id: 'file-save-as'
      },
      { type: 'separator' },
      {
        label: 'Export Book...',
        accelerator: 'CmdOrCtrl+E',
        id: 'file-export'
      },
      { type: 'separator' },
      ...(!isMac
        ? [
            {
              label: 'Exit',
              accelerator: 'Alt+F4',
              id: 'file-exit'
            }
          ]
        : [])
    ]
  };
}

/**
 * IPC message validation
 */
export function validateIpcMessage(channel, ...args) {
  const validChannels = [
    'save-book-dialog',
    'save-book-to-file',
    'save-recovered-book',
    'ipc-ready',
    'fullscreen-exited'
  ];

  if (!validChannels.includes(channel)) {
    return { valid: false, error: `Invalid IPC channel: ${channel}` };
  }

  // Channel-specific validation
  if (channel === 'save-book-dialog' || channel === 'save-book-to-file') {
    const [bookData] = args;
    const bookValidation = validateBookData(bookData);
    if (!bookValidation.valid) {
      return {
        valid: false,
        error: `Invalid book data: ${bookValidation.error}`
      };
    }
  }

  return { valid: true };
}
