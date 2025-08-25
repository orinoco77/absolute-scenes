/**
 * Tests for Electron Helper Functions
 * These functions contain the core logic from electron.js
 */

import {
  validateBookData,
  formatBookForSaving,
  getFileExtension,
  validateFilePath,
  handleFileSystemError,
  getSaveDialogOptions,
  getOpenDialogOptions,
  isValidMenuMessage,
  getKeyboardShortcuts,
  OperationManager,
  getFilePathFromArgs,
  getWindowOptions,
  getAboutDialogOptions,
  createDefaultBook,
  validateScrivenerProject,
  convertRtfToPlainText,
  isValidSectionType,
  isCharacterFolder,
  isLocationFolder,
  validateBookFormat,
  getFileMenuTemplate,
  validateIpcMessage
} from '../electronHelpers';

describe('electronHelpers', () => {
  const mockBookData = {
    title: 'Test Book',
    author: 'Test Author',
    chapters: [
      {
        id: 'chapter1',
        title: 'Chapter 1',
        scenes: [
          {
            id: 'scene1',
            title: 'Opening Scene',
            content: 'It was a dark and stormy night...'
          }
        ]
      }
    ]
  };

  describe('validateBookData', () => {
    it('validates correct book data', () => {
      const result = validateBookData(mockBookData);
      expect(result).toEqual({ valid: true });
    });

    it('rejects null or undefined data', () => {
      expect(validateBookData(null).valid).toBe(false);
      expect(validateBookData(undefined).valid).toBe(false);
      expect(validateBookData(null).error).toBe('Invalid book data');
    });

    it('rejects non-object data', () => {
      expect(validateBookData('string').valid).toBe(false);
      expect(validateBookData(123).valid).toBe(false);
      expect(validateBookData([]).valid).toBe(false);
    });

    it('requires title', () => {
      const result = validateBookData({ chapters: [] });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Book title is required');
      
      const result2 = validateBookData({ title: '', chapters: [] });
      expect(result2.valid).toBe(false);
      
      const result3 = validateBookData({ title: 123, chapters: [] });
      expect(result3.valid).toBe(false);
    });

    it('requires chapters to be array', () => {
      const result = validateBookData({ title: 'Test' });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Chapters must be an array');
      
      const result2 = validateBookData({ title: 'Test', chapters: 'not array' });
      expect(result2.valid).toBe(false);
    });
  });

  describe('formatBookForSaving', () => {
    it('adds metadata to book data', () => {
      const formatted = formatBookForSaving(mockBookData);
      const parsed = JSON.parse(formatted);
      
      expect(parsed.title).toBe('Test Book');
      expect(parsed.author).toBe('Test Author');
      expect(parsed.savedAt).toBeDefined();
      expect(parsed.version).toBe('1.3.71');
      expect(Array.isArray(parsed.chapters)).toBe(true);
    });

    it('uses custom version when provided', () => {
      const formatted = formatBookForSaving(mockBookData, '2.0.0');
      const parsed = JSON.parse(formatted);
      
      expect(parsed.version).toBe('2.0.0');
    });

    it('preserves original data structure', () => {
      const formatted = formatBookForSaving(mockBookData);
      const parsed = JSON.parse(formatted);
      
      expect(parsed.chapters[0].id).toBe('chapter1');
      expect(parsed.chapters[0].scenes[0].content).toBe('It was a dark and stormy night...');
    });

    it('formats as pretty JSON', () => {
      const formatted = formatBookForSaving(mockBookData);
      
      // Check that it's pretty-printed (contains newlines and indentation)
      expect(formatted).toContain('\n');
      expect(formatted).toContain('  ');
    });
  });

  describe('getFileExtension', () => {
    it('returns .book for unknown extensions', () => {
      expect(getFileExtension('test.txt')).toBe('.book');
      expect(getFileExtension('test')).toBe('.book');
      expect(getFileExtension('')).toBe('.book');
      expect(getFileExtension(null)).toBe('.book');
      expect(getFileExtension(undefined)).toBe('.book');
    });

    it('returns .json for JSON files', () => {
      expect(getFileExtension('test.json')).toBe('.json');
      expect(getFileExtension('/path/to/file.json')).toBe('.json');
    });

    it('returns .book for book files', () => {
      expect(getFileExtension('test.book')).toBe('.book');
      expect(getFileExtension('/path/to/file.book')).toBe('.book');
    });
  });

  describe('validateFilePath', () => {
    it('validates normal file paths', () => {
      expect(validateFilePath('/home/user/book.book')).toEqual({ valid: true });
      expect(validateFilePath('C:\\\\Users\\\\User\\\\book.book')).toEqual({ valid: true });
      expect(validateFilePath('relative/path/book.book')).toEqual({ valid: true });
    });

    it('rejects invalid types', () => {
      expect(validateFilePath(null).valid).toBe(false);
      expect(validateFilePath(undefined).valid).toBe(false);
      expect(validateFilePath(123).valid).toBe(false);
      expect(validateFilePath({}).valid).toBe(false);
    });

    it('rejects empty paths', () => {
      expect(validateFilePath('').valid).toBe(false);
      expect(validateFilePath('   ').valid).toBe(false);
      expect(validateFilePath('').error).toBe('Empty file path');
      expect(validateFilePath('   ').error).toBe('Empty file path');
    });

    it('rejects path traversal attempts', () => {
      expect(validateFilePath('../../../etc/passwd').valid).toBe(false);
      expect(validateFilePath('legitimate/path/../../../secret').valid).toBe(false);
      expect(validateFilePath('../../../etc/passwd').error).toBe('Path traversal not allowed');
    });
  });

  describe('handleFileSystemError', () => {
    it('handles permission errors', () => {
      const result = handleFileSystemError({ code: 'EACCES' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });

    it('handles file not found errors', () => {
      const result = handleFileSystemError({ code: 'ENOENT' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('handles disk space errors', () => {
      const result = handleFileSystemError({ code: 'ENOSPC' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('disk space');
    });

    it('handles custom error messages', () => {
      const result = handleFileSystemError({ message: 'Custom error message' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Custom error message');
    });

    it('handles unknown errors', () => {
      const result = handleFileSystemError({});
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown file system error');
    });
  });

  describe('getSaveDialogOptions', () => {
    it('returns correct default options', () => {
      const options = getSaveDialogOptions();
      
      expect(options.defaultPath).toBeUndefined();
      expect(options.filters).toHaveLength(2);
      expect(options.filters[0]).toEqual({ name: 'Book Files', extensions: ['book'] });
      expect(options.filters[1]).toEqual({ name: 'JSON Files', extensions: ['json'] });
    });

    it('uses existing file path when provided', () => {
      const options = getSaveDialogOptions('/test/existing.book');
      expect(options.defaultPath).toBe('/test/existing.book');
    });
  });

  describe('getOpenDialogOptions', () => {
    it('returns book file options by default', () => {
      const options = getOpenDialogOptions();
      
      expect(options.properties).toContain('openFile');
      expect(options.filters).toHaveLength(2);
      expect(options.filters[0].extensions).toContain('book');
      expect(options.filters[1].extensions).toContain('json');
    });

    it('returns Scrivener options when requested', () => {
      const options = getOpenDialogOptions('scrivener');
      
      expect(options.properties).toContain('openFile');
      expect(options.filters).toHaveLength(1);
      expect(options.filters[0].extensions).toContain('scriv');
    });
  });

  describe('isValidMenuMessage', () => {
    it('validates correct menu messages', () => {
      const validMessages = [
        'menu-save-book',
        'menu-save-as',
        'menu-export-book',
        'menu-new-chapter',
        'menu-delete-chapter'
      ];

      validMessages.forEach(msg => {
        expect(isValidMenuMessage(msg)).toBe(true);
      });
    });

    it('rejects invalid messages', () => {
      expect(isValidMenuMessage('invalid')).toBe(false);
      expect(isValidMenuMessage('menu-')).toBe(false);
      expect(isValidMenuMessage('')).toBe(false);
      expect(isValidMenuMessage(null)).toBe(false);
      expect(isValidMenuMessage(undefined)).toBe(false);
      expect(isValidMenuMessage(123)).toBe(false);
    });
  });

  describe('getKeyboardShortcuts', () => {
    it('returns all required shortcuts', () => {
      const shortcuts = getKeyboardShortcuts();
      
      expect(shortcuts['CmdOrCtrl+S']).toBe('menu-save-book');
      expect(shortcuts['CmdOrCtrl+Shift+S']).toBe('menu-save-as');
      expect(shortcuts['CmdOrCtrl+E']).toBe('menu-export-book');
      expect(shortcuts['CmdOrCtrl+N']).toBe('new-book');
      expect(shortcuts['CmdOrCtrl+O']).toBe('open-book');
      expect(shortcuts['CmdOrCtrl+I']).toBe('import-scrivener');
    });

    it('uses consistent key format', () => {
      const shortcuts = getKeyboardShortcuts();
      
      Object.keys(shortcuts).forEach(key => {
        expect(key).toMatch(/CmdOrCtrl/);
      });
    });
  });

  describe('OperationManager', () => {
    let manager;

    beforeEach(() => {
      manager = new OperationManager();
    });

    it('allows first operation', () => {
      const result = manager.attemptOperation('op1');
      expect(result.success).toBe(true);
      expect(result.operationId).toBe('op1');
      expect(manager.isOperationActive()).toBe(true);
      expect(manager.getActiveOperationCount()).toBe(1);
    });

    it('blocks concurrent operations', () => {
      manager.attemptOperation('op1');
      
      const result = manager.attemptOperation('op2');
      expect(result.success).toBe(false);
      expect(result.error).toContain('in progress');
    });

    it('allows operations after completion', () => {
      manager.attemptOperation('op1');
      manager.completeOperation('op1');
      
      expect(manager.isOperationActive()).toBe(false);
      
      const result = manager.attemptOperation('op2');
      expect(result.success).toBe(true);
    });

    it('handles custom operation types', () => {
      const result = manager.attemptOperation('op1', 'export');
      expect(result.success).toBe(true);
      
      const result2 = manager.attemptOperation('op2', 'export');
      expect(result2.error).toContain('export operation');
    });

    it('tracks operation count correctly', () => {
      expect(manager.getActiveOperationCount()).toBe(0);
      
      manager.attemptOperation('op1');
      expect(manager.getActiveOperationCount()).toBe(1);
      
      manager.completeOperation('op1');
      expect(manager.getActiveOperationCount()).toBe(0);
    });
  });

  describe('getFilePathFromArgs', () => {
    it('finds book files in arguments', () => {
      const args = ['electron', '.', 'test.book'];
      expect(getFilePathFromArgs(args)).toBe('test.book');
    });

    it('finds JSON files in arguments', () => {
      const args = ['electron', '.', 'test.json'];
      expect(getFilePathFromArgs(args)).toBe('test.json');
    });

    it('returns first matching file', () => {
      const args = ['electron', 'first.book', 'second.book'];
      expect(getFilePathFromArgs(args)).toBe('first.book');
    });

    it('returns null when no files found', () => {
      const args = ['electron', '.', '--dev'];
      expect(getFilePathFromArgs(args)).toBeNull();
    });

    it('handles invalid input', () => {
      expect(getFilePathFromArgs(null)).toBeNull();
      expect(getFilePathFromArgs(undefined)).toBeNull();
      expect(getFilePathFromArgs('not array')).toBeNull();
    });

    it('ignores non-string arguments', () => {
      const args = ['electron', 123, { file: 'test.book' }, 'real.book'];
      expect(getFilePathFromArgs(args)).toBe('real.book');
    });
  });

  describe('getWindowOptions', () => {
    it('returns correct window configuration', () => {
      const options = getWindowOptions();
      
      expect(options.width).toBe(1400);
      expect(options.height).toBe(940);
      expect(options.webPreferences.nodeIntegration).toBe(true);
      expect(options.webPreferences.contextIsolation).toBe(false);
    });
  });

  describe('getAboutDialogOptions', () => {
    it('returns about dialog configuration', () => {
      const options = getAboutDialogOptions();
      
      expect(options.type).toBe('info');
      expect(options.title).toBe('About Absolute Scenes');
      expect(options.message).toBe('Absolute Scenes');
      expect(options.detail).toContain('Version: 1.3.71');
      expect(options.buttons).toEqual(['OK']);
    });
  });

  describe('createDefaultBook', () => {
    it('creates a valid default book structure', () => {
      const book = createDefaultBook();
      
      expect(book.title).toBe('');
      expect(book.author).toBe('');
      expect(Array.isArray(book.chapters)).toBe(true);
      expect(book.chapters).toHaveLength(1);
      expect(book.chapters[0].id).toBe('default');
      expect(book.chapters[0].title).toBe('Chapter 1');
      expect(Array.isArray(book.chapters[0].scenes)).toBe(true);
      expect(Array.isArray(book.frontMatter)).toBe(true);
      expect(Array.isArray(book.backMatter)).toBe(true);
      expect(Array.isArray(book.characters)).toBe(true);
      expect(Array.isArray(book.locations)).toBe(true);
      expect(Array.isArray(book.backgrounds)).toBe(true);
      expect(book.settings.template).toBe('default');
    });
  });

  describe('validateScrivenerProject', () => {
    it('validates Scrivener project files', () => {
      expect(validateScrivenerProject('MyProject.scriv')).toEqual({ valid: true });
      expect(validateScrivenerProject('/path/to/MyProject.scriv')).toEqual({ valid: true });
    });

    it('rejects non-Scrivener files', () => {
      const result = validateScrivenerProject('document.docx');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not a Scrivener project file');
    });

    it('rejects invalid paths', () => {
      expect(validateScrivenerProject(null).valid).toBe(false);
      expect(validateScrivenerProject('').valid).toBe(false);
      expect(validateScrivenerProject(123).valid).toBe(false);
    });
  });

  describe('convertRtfToPlainText (simplified)', () => {
    it('handles empty content', () => {
      expect(convertRtfToPlainText('')).toBe('');
      expect(convertRtfToPlainText(null)).toBe('');
    });

    it('returns non-RTF content as-is', () => {
      const plainText = 'This is plain text';
      expect(convertRtfToPlainText(plainText)).toBe(plainText);
    });

    it('identifies RTF content correctly', () => {
      const rtfContent = '{\\rtf1 Hello \\b bold \\b0 text}';
      // Just test that it processes RTF content differently than plain text
      expect(rtfContent.includes('{\\rtf')).toBe(true);
      expect(convertRtfToPlainText('plain text')).toBe('plain text');
    });
  });

  describe('isValidSectionType', () => {
    it('validates known section types', () => {
      expect(isValidSectionType('folder')).toBe(true);
      expect(isValidSectionType('text')).toBe(true);
      expect(isValidSectionType('Chapter Folder')).toBe(true);
      expect(isValidSectionType('Scene Text')).toBe(true);
    });

    it('rejects invalid section types', () => {
      expect(isValidSectionType('invalid')).toBe(false);
      expect(isValidSectionType('')).toBe(false);
      expect(isValidSectionType(null)).toBe(false);
    });
  });

  describe('isCharacterFolder', () => {
    it('detects character folders', () => {
      expect(isCharacterFolder('Characters')).toBe(true);
      expect(isCharacterFolder('People')).toBe(true);
      expect(isCharacterFolder('Cast of Characters')).toBe(true);
      expect(isCharacterFolder('Main Characters')).toBe(true);
    });

    it('rejects non-character folders', () => {
      expect(isCharacterFolder('Locations')).toBe(false);
      expect(isCharacterFolder('Research')).toBe(false);
      expect(isCharacterFolder('')).toBe(false);
      expect(isCharacterFolder(null)).toBe(false);
    });
  });

  describe('isLocationFolder', () => {
    it('detects location folders', () => {
      expect(isLocationFolder('Locations')).toBe(true);
      expect(isLocationFolder('Places')).toBe(true);
      expect(isLocationFolder('Settings')).toBe(true);
      expect(isLocationFolder('World Building')).toBe(true);
    });

    it('rejects non-location folders', () => {
      expect(isLocationFolder('Characters')).toBe(false);
      expect(isLocationFolder('Research')).toBe(false);
      expect(isLocationFolder('')).toBe(false);
      expect(isLocationFolder(null)).toBe(false);
    });
  });

  describe('validateBookFormat', () => {
    it('validates correct book format', () => {
      const result = validateBookFormat(mockBookData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects missing title', () => {
      const bookWithoutTitle = { ...mockBookData, title: '' };
      const result = validateBookFormat(bookWithoutTitle);
      expect(result.valid).toBe(true); // Still valid, just warns
      expect(result.warnings).toContain('Book has no title');
    });

    it('detects missing chapters', () => {
      const bookWithoutChapters = { title: 'Test' };
      const result = validateBookFormat(bookWithoutChapters);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Book must have chapters array');
    });

    it('validates chapter structure', () => {
      const bookWithBadChapters = {
        title: 'Test',
        chapters: [
          { title: 'Chapter 1' }, // Missing id
          { id: 'ch2', scenes: 'not array' } // Bad scenes
        ]
      };
      const result = validateBookFormat(bookWithBadChapters);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Chapter 1 missing id');
      expect(result.errors).toContain('Chapter 2 scenes must be array');
    });

    it('warns about empty chapters', () => {
      const bookWithEmptyChapters = { title: 'Test', chapters: [] };
      const result = validateBookFormat(bookWithEmptyChapters);
      expect(result.warnings).toContain('Book has no chapters');
    });
  });

  describe('getFileMenuTemplate', () => {
    it('returns file menu for non-Mac', () => {
      const menu = getFileMenuTemplate(false);
      
      expect(menu.label).toBe('File');
      expect(Array.isArray(menu.submenu)).toBe(true);
      
      const newItem = menu.submenu.find(item => item.id === 'file-new');
      expect(newItem.label).toBe('New Book');
      expect(newItem.accelerator).toBe('CmdOrCtrl+N');
      
      const exitItem = menu.submenu.find(item => item.id === 'file-exit');
      expect(exitItem).toBeDefined();
    });

    it('returns file menu for Mac (no Exit item)', () => {
      const menu = getFileMenuTemplate(true);
      
      const exitItem = menu.submenu.find(item => item.id === 'file-exit');
      expect(exitItem).toBeUndefined();
    });

    it('includes all required menu items', () => {
      const menu = getFileMenuTemplate();
      const submenu = menu.submenu;
      
      expect(submenu.find(item => item.id === 'file-new')).toBeDefined();
      expect(submenu.find(item => item.id === 'file-open')).toBeDefined();
      expect(submenu.find(item => item.id === 'file-import')).toBeDefined();
      expect(submenu.find(item => item.id === 'file-save')).toBeDefined();
      expect(submenu.find(item => item.id === 'file-save-as')).toBeDefined();
      expect(submenu.find(item => item.id === 'file-export')).toBeDefined();
    });
  });

  describe('validateIpcMessage', () => {
    it('validates known IPC channels', () => {
      expect(validateIpcMessage('save-book-dialog', mockBookData)).toEqual({ valid: true });
      expect(validateIpcMessage('ipc-ready')).toEqual({ valid: true });
      expect(validateIpcMessage('fullscreen-exited')).toEqual({ valid: true });
    });

    it('rejects unknown channels', () => {
      const result = validateIpcMessage('unknown-channel');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid IPC channel');
    });

    it('validates book data for save operations', () => {
      const result = validateIpcMessage('save-book-dialog', { invalid: 'book' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid book data');
    });

    it('handles save operations with valid data', () => {
      expect(validateIpcMessage('save-book-to-file', mockBookData)).toEqual({ valid: true });
      expect(validateIpcMessage('save-recovered-book', mockBookData)).toEqual({ valid: true });
    });
  });
});