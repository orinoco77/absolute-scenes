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
 * Convert Windows-1252 RTF escape sequences to Unicode characters
 */
export function convertRtfCharacterEscapes(text) {
  // Convert Windows-1252 RTF escape sequences
  text = text.replace(/\\'91/g, "'"); // Left single quote
  text = text.replace(/\\'92/g, "'"); // Right single quote/apostrophe
  text = text.replace(/\\'93/g, '"'); // Left double quote
  text = text.replace(/\\'94/g, '"'); // Right double quote
  text = text.replace(/\\'96/g, '–'); // En-dash
  text = text.replace(/\\'97/g, '--'); // Em-dash (as double dash for export conversion)
  text = text.replace(/\\'85/g, '...'); // Ellipsis
  text = text.replace(/\\'a0/g, ' '); // Non-breaking space

  return text;
}

/**
 * Convert Unicode escape sequences combined with RTF escape sequences
 */
export function convertRtfUnicodeEscapes(text) {
  // Clean up Unicode escapes combined with RTF escapes
  text = text.replace(/\\u8220\\'93/g, '"'); // Left double quote
  text = text.replace(/\\u8221\\'94/g, '"'); // Right double quote
  text = text.replace(/\\u8216\\'91/g, "'"); // Left single quote
  text = text.replace(/\\u8217\\'92/g, "'"); // Right single quote/apostrophe
  text = text.replace(/\\u8211\\'96/g, '–'); // En-dash
  text = text.replace(/\\u8212\\'97/g, '--'); // Em-dash (as double dash for export conversion)
  text = text.replace(/\\u8230\\'85/g, '...'); // Ellipsis

  return text;
}

/**
 * RTF to Markdown text conversion with formatting preservation
 */
export function convertRtfToPlainText(rtfContent) {
  if (!rtfContent || rtfContent.trim() === '') {
    return '';
  }

  // If it's not RTF content, return as-is
  if (!rtfContent.includes('{\\rtf')) {
    return rtfContent.trim();
  }

  let text = rtfContent;

  // Remove RTF header and font table
  text = text.replace(/{\\rtf1[^}]*}/g, '');
  text = text.replace(/{\\fonttbl[^}]*}/g, '');
  text = text.replace(/{\\colortbl[^}]*}/g, '');
  text = text.replace(/{\\stylesheet[^}]*}/g, '');

  // Convert RTF formatting to Markdown BEFORE removing control words
  // Handle bold formatting: \b text } -> **text**
  text = text.replace(/\\b\s+([^{}]*?)(?=\s*[{}])/g, '**$1**');
  text = text.replace(/\\b([^{}]*?)(?=\s*[{}])/g, '**$1**');

  // Handle italic formatting: \i text } -> *text*
  text = text.replace(/\\i\s+([^{}]*?)(?=\s*[{}])/g, '*$1*');
  text = text.replace(/\\i([^{}]*?)(?=\s*[{}])/g, '*$1*');

  // Handle underline formatting: \ul text } -> <u>text</u>
  text = text.replace(/\\ul\s+([^{}]*?)(?=\s*[{}])/g, '<u>$1</u>');
  text = text.replace(/\\ul([^{}]*?)(?=\s*[{}])/g, '<u>$1</u>');

  // Remove other RTF control words (font size, etc.)
  text = text.replace(/\\[a-z]+\d*/g, '');
  text = text.replace(/\\[^a-z]/g, '');

  // Handle Unicode characters
  text = text.replace(/\\u(\d+)\?/g, (match, code) => {
    const charCode = parseInt(code, 10);
    if (charCode === 8220 || charCode === 8221) return '"'; // Smart quotes
    if (charCode === 8217) return "'"; // Smart apostrophe
    if (charCode === 8216) return "'"; // Left single quote
    if (charCode === 8212) return '—'; // Em dash
    if (charCode === 8211) return '–'; // En dash
    if (charCode === 8230) return '...'; // Ellipsis
    return String.fromCharCode(charCode);
  });

  // Handle Windows-1252 RTF escape sequences
  text = convertRtfCharacterEscapes(text);

  // Convert paragraph breaks
  text = text.replace(/\\par\b/g, '\n');
  text = text.replace(/\\par/g, '\n');

  // Remove RTF braces
  text = text.replace(/[{}]/g, '');

  // Clean up smart quotes and apostrophes
  text = text.replace(/[""]/g, '"');
  text = text.replace(/['']/g, "'");

  // Clean up whitespace while preserving markdown
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/\n\s+/g, '\n');

  // Clean up markdown formatting
  text = text.replace(/\*\*\s+/g, '**');
  text = text.replace(/\s+\*\*/g, '**');
  text = text.replace(/\*\s+/g, '*');
  text = text.replace(/\s+\*/g, '*');

  // Final cleanup
  text = text.replace(/^[\\*;irnatuldh\s]*/, '');
  text = text.replace(/^[A-Za-z]+-[A-Za-z]+;\s*/, '');
  text = text.replace(/^;;\s*/, '');

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
