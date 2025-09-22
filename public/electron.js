/* eslint-disable no-unused-vars */
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');
const {
  app,
  BrowserWindow,
  Menu,
  MenuItem,
  dialog,
  ipcMain,
  shell
} = require('electron');
const rtfParse = require('rtf-parse');

let mainWindow;
let pendingFileToOpen = null; // Store file path to open once app is ready

// RTF Character Conversion Utilities

function convertRtfCharacterEscapes(text) {
  // Convert Windows-1252 RTF escape sequences
  text = text.replace(/\\'91/g, "'"); // Left single quote
  text = text.replace(/\\'92/g, "'"); // Right single quote/apostrophe
  text = text.replace(/\\'93/g, '"'); // Left double quote
  text = text.replace(/\\'94/g, '"'); // Right double quote
  text = text.replace(/\\'96/g, '–'); // En-dash
  text = text.replace(/\\'97/g, '--'); // Em-dash
  text = text.replace(/\\'85/g, '...'); // Ellipsis
  text = text.replace(/\\'a0/g, ' '); // Non-breaking space

  return text;
}

function convertRtfUnicodeEscapes(text) {
  // Clean up Unicode escapes combined with RTF escapes
  text = text.replace(/\\u8220\\'93/g, '"'); // Left double quote
  text = text.replace(/\\u8221\\'94/g, '"'); // Right double quote
  text = text.replace(/\\u8216\\'91/g, "'"); // Left single quote
  text = text.replace(/\\u8217\\'92/g, "'"); // Right single quote/apostrophe
  text = text.replace(/\\u8211\\'96/g, '–'); // En-dash
  text = text.replace(/\\u8212\\'97/g, '--'); // Em-dash
  text = text.replace(/\\u8230\\'85/g, '...'); // Ellipsis
  return text;
}

// Handle single instance - prevent multiple instances of the app
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, _workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    // Handle file opening from second instance (Windows/Linux)
    const filePath = getFilePathFromArgs(commandLine);
    if (filePath) {
      pendingFileToOpen = filePath;
      attemptToOpenPendingFile();
    }
  });
}

async function createWindow() {
  // Register IPC handlers first, before creating the window
  registerIpcHandlers();

  // Load spell check language from storage before creating window
  const { session } = require('electron');

  // Configure the session to allow localStorage
  const ses = session.fromPartition('persist:absolutescenes');
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    // Allow all permissions including localStorage access
    callback(true);
  });

  // Get saved language or default to en-US
  let savedLanguage = 'en-US';
  try {
    const { default: Store } = await import('electron-store');
    const store = new Store();
    savedLanguage = store.get('spellCheckLanguage', 'en-US');
  } catch (error) {
    console.log('Could not load saved language, using en-US');
  }

  console.log('Setting spell checker language at startup:', savedLanguage);

  // Set spell checker language on the configured session BEFORE creating window
  const availableLanguages = ses.availableSpellCheckerLanguages;
  if (availableLanguages.includes(savedLanguage)) {
    ses.setSpellCheckerEnabled(true);
    ses.setSpellCheckerLanguages([savedLanguage]);
    console.log('Spell checker language set to:', savedLanguage);
  } else {
    console.warn('Language not available:', savedLanguage, 'using en-US');
    ses.setSpellCheckerEnabled(true);
    ses.setSpellCheckerLanguages(['en-US']);
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1020,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: true,
      // Additional settings for localStorage access
      partition: 'persist:absolutescenes',
      experimentalFeatures: false
      // preload: path.join(__dirname, 'preload.js') // Disable preload with contextIsolation false
    }
  });

  const isDev = process.env.ELECTRON_IS_DEV === 'true';
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Set up event listeners for when the renderer is ready
  mainWindow.webContents.once('did-finish-load', () => {
    // Spell checker language will be handled through IPC in preload script
    // Try to open any pending file after a short delay
    setTimeout(() => {
      attemptToOpenPendingFile();
    }, 1000);
  });

  // Add spell check context menu
  mainWindow.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();
    const window = mainWindow; // Capture reference to avoid loop warning

    // Add spelling suggestions
    for (const suggestion of params.dictionarySuggestions) {
      menu.append(
        new MenuItem({
          label: suggestion,
          click: () => window.webContents.replaceMisspelling(suggestion)
        })
      );
    }

    // Add separator if there were suggestions
    if (params.dictionarySuggestions.length > 0) {
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Add "Add to dictionary" option
    if (params.misspelledWord) {
      menu.append(
        new MenuItem({
          label: 'Add to dictionary',
          click: () =>
            window.webContents.session.addWordToSpellCheckerDictionary(
              params.misspelledWord
            )
        })
      );
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Add standard context menu options
    if (params.isEditable) {
      menu.append(new MenuItem({ label: 'Cut', role: 'cut' }));
      menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
      menu.append(new MenuItem({ label: 'Paste', role: 'paste' }));
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({ label: 'Select All', role: 'selectAll' }));
    } else {
      menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
    }

    // Only show menu if it has items
    if (menu.items.length > 0) {
      menu.popup({ window });
    }
  });

  // Handle fullscreen events to hide/show menu bar
  mainWindow.on('enter-full-screen', () => {
    mainWindow.setMenuBarVisibility(false);
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow.setMenuBarVisibility(true);
  });

  // Fullscreen handling is now done via preload script

  // Handle manual fullscreen exit
  ipcMain.on('fullscreen-exited', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setMenuBarVisibility(true);
    }
  });

  // Handle distraction-free mode entry (hide menu)
  ipcMain.on('distraction-free-entered', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setMenuBarVisibility(false);
    }
  });

  // Handle distraction-free mode exit (restore menu)
  ipcMain.on('distraction-free-exited', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Use timeouts to ensure menu restoration works properly,
      // especially when transitioning out of fullscreen mode
      setTimeout(() => {
        mainWindow.setMenuBarVisibility(true);

        // Double-check to ensure it takes effect
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.setMenuBarVisibility(true);
          }
        }, 100);
      }, 50);
    }
  });

  // Handle window close event - check for unsaved changes
  mainWindow.on('close', event => {
    event.preventDefault();
    handleWindowClose();
  });

  createMenu();
}

// Handle New Book menu item with unsaved changes check
async function handleNewBook() {
  try {
    // Check if there are unsaved changes in the React app via IPC
    let hasUnsavedChanges = false;
    try {
      hasUnsavedChanges = await mainWindow.webContents.executeJavaScript(`
        (() => {
          // Try electronAPI first (if preload script is working)
          if (window.electronAPI && window.electronAPI.hasUnsavedChanges) {
            return window.electronAPI.hasUnsavedChanges();
          }
          // Fallback to extensions (when nodeIntegration is true)
          if (window._electronAPIExtensions && window._electronAPIExtensions.hasUnsavedChanges) {
            return window._electronAPIExtensions.hasUnsavedChanges();
          }
          // Last resort: check mock API (browser mode)
          if (window._mockElectronAPI && window._mockElectronAPI.hasUnsavedChanges) {
            return window._mockElectronAPI.hasUnsavedChanges();
          }
          return false;
        })()
      `);
    } catch (error) {
      console.log('Could not check unsaved changes, proceeding with new book');
      hasUnsavedChanges = false;
    }

    if (hasUnsavedChanges) {
      const response = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: ['Create New Book', 'Cancel'],
        defaultId: 1,
        cancelId: 1,
        title: 'Unsaved Changes',
        message:
          'You have unsaved changes. Are you sure you want to create a new book?',
        detail: 'All unsaved changes will be lost.'
      });

      if (response.response !== 0) {
        return; // User cancelled
      }
    }

    // Proceed with new book creation
    mainWindow.webContents.send('menu-new-book');
  } catch (error) {
    console.error('Error checking unsaved changes for new book:', error);
    // Fallback: show the dialog anyway
    mainWindow.webContents.send('menu-new-book');
  }
}

// Handle window close with unsaved changes check
async function handleWindowClose() {
  try {
    // Check if there are unsaved changes in the React app via IPC
    let hasUnsavedChanges = false;
    try {
      hasUnsavedChanges = await mainWindow.webContents.executeJavaScript(`
        (() => {
          // Try electronAPI first (if preload script is working)
          if (window.electronAPI && window.electronAPI.hasUnsavedChanges) {
            return window.electronAPI.hasUnsavedChanges();
          }
          // Fallback to extensions (when nodeIntegration is true)
          if (window._electronAPIExtensions && window._electronAPIExtensions.hasUnsavedChanges) {
            return window._electronAPIExtensions.hasUnsavedChanges();
          }
          // Last resort: check mock API (browser mode)
          if (window._mockElectronAPI && window._mockElectronAPI.hasUnsavedChanges) {
            return window._mockElectronAPI.hasUnsavedChanges();
          }
          return false;
        })()
      `);
    } catch (error) {
      console.log('Could not check unsaved changes, proceeding with close');
      hasUnsavedChanges = false;
    }

    if (hasUnsavedChanges) {
      const response = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: ['Close Without Saving', 'Cancel'],
        defaultId: 1,
        cancelId: 1,
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to close?',
        detail: 'All unsaved changes will be lost.'
      });

      if (response.response !== 0) {
        return; // User cancelled
      }
    }

    // Proceed with closing
    mainWindow.destroy();
    app.quit();
  } catch (error) {
    console.error('Error checking unsaved changes for window close:', error);
    // Fallback: close anyway
    mainWindow.destroy();
    app.quit();
  }
}

// Enhanced function to extract file path from command line arguments
function getFilePathFromArgs(args) {
  // Try different approaches to find the .book file
  const approaches = [
    // Approach 1: Look for .book files in all arguments (skip first 2)
    () => {
      const fileArgs = args.slice(2);
      for (const arg of fileArgs) {
        if (arg.endsWith('.book') && !arg.startsWith('-') && arg.length > 5) {
          return arg;
        }
      }
      return null;
    },

    // Approach 2: Look for .book files in all arguments (including first 2)
    () => {
      for (const arg of args) {
        if (arg.endsWith('.book') && !arg.startsWith('-') && arg.length > 5) {
          return arg;
        }
      }
      return null;
    },

    // Approach 3: Check if the last argument is a .book file
    () => {
      const lastArg = args[args.length - 1];
      if (lastArg && lastArg.endsWith('.book') && !lastArg.startsWith('-')) {
        return lastArg;
      }
      return null;
    },

    // Approach 4: Look for any file with .book extension anywhere in the args
    () => {
      for (const arg of args) {
        if (typeof arg === 'string' && arg.includes('.book')) {
          return arg;
        }
      }
      return null;
    }
  ];

  // Try each approach until we find a file
  for (let i = 0; i < approaches.length; i++) {
    const result = approaches[i]();
    if (result) {
      return result;
    }
  }

  return null;
}

// Function to attempt opening a pending file
function attemptToOpenPendingFile() {
  if (!pendingFileToOpen) {
    return;
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    openBookFile(pendingFileToOpen, true); // Check for unsaved changes when opening from file association
    pendingFileToOpen = null; // Clear after attempting to open
  }
}

// Enhanced function to open a book file with better error handling and retry logic
async function openBookFile(filePath, checkUnsavedChanges = true) {
  if (!filePath) {
    return;
  }

  if (checkUnsavedChanges) {
    // Check if there are unsaved changes in the React app via IPC
    let hasUnsavedChanges = false;
    try {
      hasUnsavedChanges = await mainWindow.webContents.executeJavaScript(`
        (() => {
          // Try electronAPI first (if preload script is working)
          if (window.electronAPI && window.electronAPI.hasUnsavedChanges) {
            return window.electronAPI.hasUnsavedChanges();
          }
          // Fallback to extensions (when nodeIntegration is true)
          if (window._electronAPIExtensions && window._electronAPIExtensions.hasUnsavedChanges) {
            return window._electronAPIExtensions.hasUnsavedChanges();
          }
          // Last resort: check mock API (browser mode)
          if (window._mockElectronAPI && window._mockElectronAPI.hasUnsavedChanges) {
            return window._mockElectronAPI.hasUnsavedChanges();
          }
          return false;
        })()
      `);
    } catch (error) {
      console.log(
        'Could not check unsaved changes, proceeding with open book file'
      );
      hasUnsavedChanges = false;
    }

    if (hasUnsavedChanges) {
      const response = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: ['Open Book', 'Cancel'],
        defaultId: 1,
        cancelId: 1,
        title: 'Unsaved Changes',
        message:
          'You have unsaved changes. Are you sure you want to open another book?',
        detail: 'All unsaved changes will be lost.'
      });

      if (response.response !== 0) {
        return; // User cancelled
      }
    }
  }

  try {
    // Check if file exists and is readable
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      throw new Error('Path is not a file');
    }

    // Read and parse the file
    const content = await fs.readFile(filePath, 'utf8');
    const bookData = JSON.parse(content);

    // Enhanced approach to send book data to renderer
    const bookDataWithPath = {
      ...bookData,
      filePath: filePath
    };

    // Try multiple approaches to ensure the message gets through
    const sendAttempts = [
      // Attempt 1: Try sending immediately
      () => {
        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
          mainWindow.webContents.send('book-loaded', bookDataWithPath);
          return true;
        }
        return false;
      },

      // Attempt 2: Wait for webContents to be ready
      () => {
        return new Promise(resolve => {
          if (
            mainWindow &&
            !mainWindow.isDestroyed() &&
            mainWindow.webContents
          ) {
            if (mainWindow.webContents.isLoading()) {
              mainWindow.webContents.once('did-finish-load', () => {
                mainWindow.webContents.send('book-loaded', bookDataWithPath);
                resolve(true);
              });
            } else {
              mainWindow.webContents.send('book-loaded', bookDataWithPath);
              resolve(true);
            }
          } else {
            resolve(false);
          }
        });
      }
    ];

    // Try the first attempt
    if (!sendAttempts[0]()) {
      await sendAttempts[1]();
    }

    // Also try with a delay to ensure React app is ready
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('book-loaded', bookDataWithPath);
      }
    }, 2000);
  } catch (error) {
    console.error('Error opening book file:', error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog.showErrorBox(
        'Error Opening File',
        `Failed to open book file: ${error.message}\n\nFile: ${filePath}`
      );
    }
  }
}

// Scrivener Import Implementation for Main Process
async function importScrivenerProjectSync(scrivenerPath) {
  // Initialize book data structure
  const bookData = {
    title: '',
    author: '',
    frontMatter: [],
    parts: [],
    chapters: [],
    characters: [],
    characterDetectionBlacklist: [],
    locations: [],
    backgroundFolders: [
      {
        id: 'default-bg',
        title: 'General Notes',
        documents: []
      }
    ],
    template: {
      fontFamily: 'Times New Roman',
      fontSize: 12,
      lineHeight: 1.6,
      paragraphStyle: 'indented',
      pageSize: 'letter',
      genre: 'general',
      pageMargins: {
        top: 1,
        bottom: 1,
        inside: 1.25,
        outside: 1
      },
      mirrorMargins: false,
      textAlign: 'justified',
      chapterHeader: {
        style: 'numbered',
        format: 'Chapter {number}',
        fontSize: 18,
        fontWeight: 'bold',
        alignment: 'center',
        pageBreak: true,
        spacing: 2,
        lineBreaksBefore: 3,
        startOnRightPage: false
      },
      runningHeaders: {
        enabled: false,
        leftPage: '{title}',
        rightPage: '{author}',
        fontSize: 10,
        alignment: 'outside'
      }
    },
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  // Validate the path
  if (!scrivenerPath.endsWith('.scriv')) {
    throw new Error('Please select a .scriv folder');
  }

  // Find the .scrivx file
  const files = fsSync.readdirSync(scrivenerPath);
  const scrivxFile = files.find(file => file.endsWith('.scrivx'));
  if (!scrivxFile) {
    throw new Error('Could not find .scrivx file in the project');
  }

  const scrivxPath = path.join(scrivenerPath, scrivxFile);

  // Parse the main project file
  const projectXml = fsSync.readFileSync(scrivxPath, 'utf8');
  const parser = new DOMParser();
  const doc = parser.parseFromString(projectXml, 'text/xml');

  // Extract title and author from compile.xml (primary source) with fallbacks
  const compileData = parseCompileSettings(scrivenerPath);

  // Use compile.xml as primary source, with fallbacks
  const title =
    compileData.title || path.basename(scrivenerPath).replace('.scriv', '');
  let author = compileData.author;

  // Fallback to project XML if compile.xml doesn't have author
  if (!author) {
    const projectElement = doc.getElementsByTagName('ScrivenerProject')[0];
    author = projectElement ? projectElement.getAttribute('Author') || '' : '';
  }

  // Update book data with extracted metadata
  bookData.title = title;
  bookData.author = author;

  // Parse the binder structure
  await parseBinder(doc, scrivenerPath, bookData);

  // Convert structure to our format
  convertToBookFormat(bookData);

  return bookData;
}

// Helper functions for Scrivener import
async function parseBinder(doc, scrivenerPath, bookData) {
  const binderElement = doc.getElementsByTagName('Binder')[0];
  if (!binderElement) {
    throw new Error('Invalid Scrivener project: No Binder found');
  }

  // Parse SectionType definitions for hierarchical structure
  const { sectionTypes, levelTypes } = parseSectionTypes(doc);
  bookData.sectionTypes = sectionTypes;
  bookData.levelTypes = levelTypes;

  // Find the manuscript folder (DraftFolder type)
  const manuscriptFolder = findBinderItem(binderElement, 'DraftFolder');
  if (manuscriptFolder) {
    await parseManuscriptStructure(
      manuscriptFolder,
      scrivenerPath,
      bookData,
      sectionTypes,
      levelTypes
    );
  }

  // Find research/character folders
  await parseResearchFolders(binderElement, scrivenerPath, bookData);

  // Find and parse front matter folders
  await parseFrontMatterFolders(binderElement, scrivenerPath, bookData);
}

function findBinderItem(element, type) {
  const items = element.getElementsByTagName('BinderItem');
  for (let i = 0; i < items.length; i++) {
    if (items[i].getAttribute('Type') === type) {
      return items[i];
    }
  }
  return null;
}

async function parseManuscriptStructure(
  manuscriptFolder,
  scrivenerPath,
  bookData,
  sectionTypes,
  levelTypes
) {
  const children = manuscriptFolder.getElementsByTagName('Children')[0];
  if (!children) return;

  const binderItems = children.getElementsByTagName('BinderItem');

  // Determine organizational style based on what File-level types represent
  // Priority: If "Scene" is present in Files, it's scene-based (Fantasy Saga style)
  // Otherwise, if chapter-like types are present, it's chapter-based (Brother's Folly style)
  const hasSceneInFiles = levelTypes.files.some(typeId => {
    const typeName = sectionTypes[typeId]?.toLowerCase() || '';
    return typeName === 'scene';
  });

  const fileTypeRepresentsChapters =
    !hasSceneInFiles &&
    levelTypes.files.some(typeId => {
      const typeName = sectionTypes[typeId]?.toLowerCase() || '';
      return (
        typeName.includes('section') ||
        typeName.includes('chapter') ||
        typeName === 'heading' ||
        typeName === 'sub-heading'
      );
    });

  for (let i = 0; i < binderItems.length; i++) {
    const item = binderItems[i];
    const type = item.getAttribute('Type');
    const uuid = item.getAttribute('UUID');
    const title = getElementText(item, 'Title');
    const sectionTypeId = getSectionTypeId(item);
    const sectionTypeName = sectionTypeId ? sectionTypes[sectionTypeId] : null;

    if (type === 'Folder') {
      if (isPart(sectionTypeName, type, title)) {
        // This is a part
        const part = {
          id: uuid,
          title: title || `Part ${bookData.parts.length + 1}`,
          chapters: []
        };

        // Parse content within this part
        await parsePartContent(
          item,
          scrivenerPath,
          part,
          bookData,
          sectionTypes,
          levelTypes,
          fileTypeRepresentsChapters
        );

        if (part.chapters.length > 0) {
          bookData.parts.push(part);
        }
      } else {
        // This is a chapter folder (Fantasy Saga style)
        const chapter = {
          id: uuid,
          title: title || `Chapter ${bookData.chapters.length + 1}`,
          scenes: []
        };

        // Parse scenes within this chapter
        await parseChapterContent(
          item,
          scrivenerPath,
          chapter,
          bookData,
          sectionTypes,
          levelTypes
        );

        if (chapter.scenes.length > 0) {
          bookData.chapters.push(chapter);
        }
      }
    } else if (type === 'Text') {
      // Check if this is a prologue that should be front matter
      if (isFrontMatterContent(sectionTypeName, type, title)) {
        const frontMatterItem = await parseFrontMatterItem(item, scrivenerPath);
        if (frontMatterItem) {
          bookData.frontMatter.push(frontMatterItem);
        }
      } else if (fileTypeRepresentsChapters) {
        // Brother's Folly style: Text items are chapters
        const chapter = {
          id: uuid,
          title: title || `Chapter ${bookData.chapters.length + 1}`,
          scenes: []
        };

        // Create a single scene with the chapter's content
        const scene = await parseScene(item, scrivenerPath);
        if (scene && scene.content.trim().length > 0) {
          chapter.scenes.push(scene);
          bookData.chapters.push(chapter);
        }
      }
      // For Fantasy Saga style: Text items are NOT processed here
      // They are only processed when encountered within their parent chapter folders
    }
  }
}

// New function to recursively parse part content
async function parsePartContent(
  partItem,
  scrivenerPath,
  part,
  bookData,
  sectionTypes,
  levelTypes,
  fileTypeRepresentsChapters
) {
  const children = partItem.getElementsByTagName('Children')[0];
  if (!children) return;

  const binderItems = children.getElementsByTagName('BinderItem');

  for (let i = 0; i < binderItems.length; i++) {
    const item = binderItems[i];
    const type = item.getAttribute('Type');
    const uuid = item.getAttribute('UUID');
    const title = getElementText(item, 'Title');
    const sectionTypeId = getSectionTypeId(item);
    const sectionTypeName = sectionTypeId ? sectionTypes[sectionTypeId] : null;

    if (type === 'Folder' && !isPart(sectionTypeName, type, title)) {
      // This is a chapter folder within the part (Fantasy Saga style)
      const chapter = {
        id: uuid,
        title: title || `Chapter ${part.chapters.length + 1}`,
        scenes: []
      };

      await parseChapterContent(
        item,
        scrivenerPath,
        chapter,
        bookData,
        sectionTypes,
        levelTypes
      );

      if (chapter.scenes.length > 0) {
        part.chapters.push(chapter);
        bookData.chapters.push(chapter);
      }
    } else if (type === 'Text') {
      if (fileTypeRepresentsChapters) {
        // Brother's Folly style: Text items within parts are chapters
        const chapter = {
          id: uuid,
          title: title || `Chapter ${part.chapters.length + 1}`,
          scenes: []
        };

        // Create a single scene with the chapter's content
        const scene = await parseScene(item, scrivenerPath);
        if (scene && scene.content.trim().length > 0) {
          chapter.scenes.push(scene);
          part.chapters.push(chapter);
          bookData.chapters.push(chapter);
        }
      } else {
        // Fantasy Saga style: Text items within parts are scenes (need implicit chapter)
        if (part.chapters.length === 0) {
          part.chapters.push({
            id: `implicit-${part.id}`,
            title: part.title,
            scenes: []
          });
          bookData.chapters.push(part.chapters[0]);
        }

        const scene = await parseScene(item, scrivenerPath);
        if (scene && scene.content.trim().length > 0) {
          const implicitChapter = part.chapters[0];
          implicitChapter.scenes.push(scene);
        }
      }
    }
  }
}

// Updated function to recursively parse chapter content
async function parseChapterContent(
  folderItem,
  scrivenerPath,
  chapter,
  bookData,
  sectionTypes,
  _levelTypes
) {
  const children = folderItem.getElementsByTagName('Children')[0];
  if (!children) return;

  const binderItems = children.getElementsByTagName('BinderItem');

  for (let i = 0; i < binderItems.length; i++) {
    const item = binderItems[i];
    const type = item.getAttribute('Type');
    const title = getElementText(item, 'Title');
    const sectionTypeId = getSectionTypeId(item);
    const sectionTypeName = sectionTypeId ? sectionTypes[sectionTypeId] : null;

    if (type === 'Text' || isScene(sectionTypeName, type)) {
      // Include scenes that are marked for compile or have content
      const includeInCompile = getElementText(
        item.getElementsByTagName('MetaData')[0],
        'IncludeInCompile'
      );
      if (includeInCompile !== 'No') {
        // Include by default unless explicitly excluded
        const scene = await parseScene(item, scrivenerPath);
        if (scene && scene.content.trim().length > 0) {
          // Only include scenes with content
          chapter.scenes.push(scene);
        }
      }
    } else if (
      type === 'Folder' &&
      !isChapter(sectionTypeName, type) &&
      !isPart(sectionTypeName, type, title)
    ) {
      // Recursively parse nested folders that are not explicitly chapters or parts
      await parseChapterContent(
        item,
        scrivenerPath,
        chapter,
        bookData,
        sectionTypes
      );
    }
  }
}

// Helper function to parse compile.xml settings for title and author
function parseCompileSettings(scrivenerPath) {
  const compileXmlPath = path.join(scrivenerPath, 'Settings', 'compile.xml');

  if (!fsSync.existsSync(compileXmlPath)) {
    return { title: '', author: '' };
  }

  try {
    const compileXml = fsSync.readFileSync(compileXmlPath, 'utf8');
    const parser = new DOMParser();
    const doc = parser.parseFromString(compileXml, 'text/xml');

    // Extract project title
    const projectTitleElement = doc.getElementsByTagName('ProjectTitle')[0];
    const title = projectTitleElement
      ? (
          projectTitleElement.textContent ||
          projectTitleElement.innerText ||
          ''
        ).trim()
      : '';

    // Extract author from Authors section
    const authorElements = doc.getElementsByTagName('Author');
    let author = '';
    if (authorElements.length > 0) {
      // Get the first author's text content
      author = (
        authorElements[0].textContent ||
        authorElements[0].innerText ||
        ''
      ).trim();
    }

    return { title, author };
  } catch (error) {
    console.error('Error parsing compile.xml:', error);
    return { title: '', author: '' };
  }
}

// Helper function to parse SectionType definitions and level types
function parseSectionTypes(doc) {
  const sectionTypes = {};
  const levelTypes = {
    folders: [],
    containers: [],
    files: []
  };

  // Parse type definitions
  const typeDefsElement = doc.getElementsByTagName('TypeDefinitions')[0];
  if (typeDefsElement) {
    const typeElements = typeDefsElement.getElementsByTagName('Type');
    for (let i = 0; i < typeElements.length; i++) {
      const typeElement = typeElements[i];
      const id = typeElement.getAttribute('ID');
      const name = typeElement.textContent || typeElement.innerText || '';
      sectionTypes[id] = name.trim();
    }
  }

  // Parse level types to understand structural hierarchy
  const levelTypesElement = doc.getElementsByTagName('LevelTypes')[0];
  if (levelTypesElement) {
    const foldersElement = levelTypesElement.getElementsByTagName('Folders')[0];
    if (foldersElement) {
      const folderTypes = foldersElement.getElementsByTagName('Type');
      for (let i = 0; i < folderTypes.length; i++) {
        const typeId =
          folderTypes[i].textContent || folderTypes[i].innerText || '';
        levelTypes.folders.push(typeId.trim());
      }
    }

    const containersElement =
      levelTypesElement.getElementsByTagName('Containers')[0];
    if (containersElement) {
      const containerTypes = containersElement.getElementsByTagName('Type');
      for (let i = 0; i < containerTypes.length; i++) {
        const typeId =
          containerTypes[i].textContent || containerTypes[i].innerText || '';
        levelTypes.containers.push(typeId.trim());
      }
    }

    const filesElement = levelTypesElement.getElementsByTagName('Files')[0];
    if (filesElement) {
      const fileTypes = filesElement.getElementsByTagName('Type');
      for (let i = 0; i < fileTypes.length; i++) {
        const typeId = fileTypes[i].textContent || fileTypes[i].innerText || '';
        levelTypes.files.push(typeId.trim());
      }
    }
  }

  return { sectionTypes, levelTypes };
}

// Helper function to get SectionType ID from a binder item
function getSectionTypeId(binderItem) {
  const metaData = binderItem.getElementsByTagName('MetaData')[0];
  if (metaData) {
    const sectionTypeElement = metaData.getElementsByTagName('SectionType')[0];
    if (sectionTypeElement) {
      return (
        sectionTypeElement.textContent || sectionTypeElement.innerText || ''
      );
    }
  }
  return null;
}

// Helper functions to determine item types based on SectionType
function isPart(sectionTypeName, itemType, title) {
  // If no explicit SectionType, use heuristics based on title
  if (!sectionTypeName) {
    if (itemType === 'Folder' && title) {
      const titleLower = title.toLowerCase();
      return (
        titleLower.includes('part ') ||
        titleLower.includes('book ') ||
        /^part \w+/i.test(title) ||
        /^book \w+/i.test(title)
      );
    }
    return false;
  }

  // Check for explicit part-related SectionTypes
  const partKeywords = ['part heading', 'part', 'book', 'heading'];
  return (
    partKeywords.some(keyword =>
      sectionTypeName.toLowerCase().includes(keyword)
    ) ||
    (itemType === 'Folder' && sectionTypeName.toLowerCase() === 'heading')
  );
}

function isChapter(sectionTypeName, itemType) {
  if (!sectionTypeName) return itemType === 'Folder';
  const chapterKeywords = [
    'chapter heading',
    'chapter',
    'prologue',
    'epilogue'
  ];
  return chapterKeywords.some(keyword =>
    sectionTypeName.toLowerCase().includes(keyword)
  );
}

function isScene(sectionTypeName, itemType) {
  if (!sectionTypeName) return itemType === 'Text';
  const sceneKeywords = ['scene', 'section'];
  return (
    sceneKeywords.some(keyword =>
      sectionTypeName.toLowerCase().includes(keyword)
    ) || itemType === 'Text'
  );
}

// Helper function to identify front matter content
function isFrontMatterContent(sectionTypeName, itemType, title) {
  // Check SectionType first
  if (sectionTypeName) {
    const typeName = sectionTypeName.toLowerCase();
    if (
      typeName.includes('prologue') ||
      typeName.includes('epilogue') ||
      typeName.includes('front matter') ||
      typeName.includes('dedication') ||
      typeName.includes('foreword') ||
      typeName.includes('preface')
    ) {
      return true;
    }
  }

  // Check title patterns
  if (title && itemType === 'Text') {
    const titleLower = title.toLowerCase();
    return (
      titleLower === 'prologue' ||
      titleLower === 'epilogue' ||
      titleLower === 'dedication' ||
      titleLower === 'foreword' ||
      titleLower === 'preface' ||
      titleLower.includes('acknowledgments')
    );
  }

  return false;
}

// Function to parse front matter items
async function parseFrontMatterItem(binderItem, scrivenerPath) {
  const uuid = binderItem.getAttribute('UUID');
  const title = getElementText(binderItem, 'Title');

  // Path to the content files
  const dataPath = path.join(scrivenerPath, 'Files', 'Data', uuid);

  let content = '';
  const rtfPath = path.join(dataPath, 'content.rtf');

  if (fsSync.existsSync(rtfPath)) {
    try {
      const rtfContent = fsSync.readFileSync(rtfPath, 'utf8');
      content = await convertRtfToPlainText(rtfContent);
    } catch (error) {
      console.error(
        `Error reading RTF content for front matter ${uuid}:`,
        error
      );
    }
  }

  if (content.trim().length === 0) {
    return null;
  }

  // Determine front matter type based on title/content
  let type = 'dedication'; // default
  const titleLower = title.toLowerCase();

  if (titleLower === 'prologue') type = 'prologue';
  else if (titleLower === 'epilogue') type = 'epilogue';
  else if (titleLower === 'dedication') type = 'dedication';
  else if (titleLower === 'foreword') type = 'foreword';
  else if (titleLower === 'preface') type = 'preface';
  else if (titleLower.includes('acknowledgments')) type = 'acknowledgments';

  return {
    id: uuid,
    type: type,
    title: title || 'Untitled',
    content: content,
    enabled: true,
    created: new Date().toISOString(),
    modified: new Date().toISOString()
  };
}

// Function to parse front matter folders
async function parseFrontMatterFolders(binderElement, scrivenerPath, bookData) {
  const items = binderElement.getElementsByTagName('BinderItem');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const type = item.getAttribute('Type');
    const title = getElementText(item, 'Title');

    if (
      type === 'Folder' &&
      title &&
      (title.toLowerCase().includes('front matter') ||
        title.toLowerCase() === 'front matter')
    ) {
      // Parse all text items within this front matter folder
      const children = item.getElementsByTagName('Children')[0];
      if (children) {
        const childItems = children.getElementsByTagName('BinderItem');

        for (let j = 0; j < childItems.length; j++) {
          const childItem = childItems[j];
          const childType = childItem.getAttribute('Type');

          if (childType === 'Text') {
            const frontMatterItem = await parseFrontMatterItem(
              childItem,
              scrivenerPath
            );
            if (frontMatterItem) {
              bookData.frontMatter.push(frontMatterItem);
            }
          }
        }
      }
    }
  }
}

async function parseScene(binderItem, scrivenerPath) {
  const uuid = binderItem.getAttribute('UUID');
  const title = getElementText(binderItem, 'Title');

  // Path to the content files
  const dataPath = path.join(scrivenerPath, 'Files', 'Data', uuid);

  try {
    // Read content.rtf file
    const contentPath = path.join(dataPath, 'content.rtf');
    let content = '';

    if (fsSync.existsSync(contentPath)) {
      const rtfContent = fsSync.readFileSync(contentPath, 'utf8');
      content = await convertRtfToPlainText(rtfContent);
    }

    // Read synopsis if available
    const synopsisPath = path.join(dataPath, 'synopsis.txt');
    let synopsis = '';
    if (fsSync.existsSync(synopsisPath)) {
      synopsis = fsSync.readFileSync(synopsisPath, 'utf8').trim();
    }

    // Read notes if available
    const notesPath = path.join(dataPath, 'notes.rtf');
    let notes = '';
    if (fsSync.existsSync(notesPath)) {
      const rtfNotes = fsSync.readFileSync(notesPath, 'utf8');
      notes = await convertRtfToPlainText(rtfNotes);
    }

    const scene = {
      id: uuid,
      title: title || 'Untitled Scene',
      content: content || '', // Ensure content is never null/undefined
      notes: notes || synopsis || '', // Use synopsis as notes if no separate notes
      assignedAuthor: null,
      customFields: {},
      modified: new Date().toISOString() // Add modified timestamp
    };

    return scene;
  } catch (error) {
    console.error(`Error parsing scene ${uuid}:`, error);
    return null;
  }
}

async function parseResearchFolders(binderElement, scrivenerPath, bookData) {
  // Look for folders that might contain characters, locations, etc.
  const allItems = binderElement.getElementsByTagName('BinderItem');

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const title = getElementText(item, 'Title');

    // Look for common research folder names
    if (isCharacterFolder(title)) {
      await parseCharacterFolder(item, scrivenerPath, bookData);
    } else if (isLocationFolder(title)) {
      await parseLocationFolder(item, scrivenerPath, bookData);
    }
  }
}

function isCharacterFolder(title) {
  const characterKeywords = [
    'character',
    'people',
    'cast',
    'protagonist',
    'person'
  ];
  return characterKeywords.some(keyword =>
    title.toLowerCase().includes(keyword)
  );
}

function isLocationFolder(title) {
  const locationKeywords = [
    'location',
    'place',
    'setting',
    'world',
    'geography'
  ];
  return locationKeywords.some(keyword =>
    title.toLowerCase().includes(keyword)
  );
}

async function parseCharacterFolder(folder, scrivenerPath, bookData) {
  const children = folder.getElementsByTagName('Children')[0];
  if (!children) return;

  const items = children.getElementsByTagName('BinderItem');
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.getAttribute('Type') === 'Text') {
      const character = await parseCharacter(item, scrivenerPath);
      if (character) {
        bookData.characters.push(character);
      }
    }
  }
}

async function parseLocationFolder(folder, scrivenerPath, bookData) {
  const children = folder.getElementsByTagName('Children')[0];
  if (!children) return;

  const items = children.getElementsByTagName('BinderItem');
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.getAttribute('Type') === 'Text') {
      const location = await parseLocation(item, scrivenerPath);
      if (location) {
        bookData.locations.push(location);
      }
    }
  }
}

async function parseCharacter(binderItem, scrivenerPath) {
  const uuid = binderItem.getAttribute('UUID');
  const name = getElementText(binderItem, 'Title');

  const dataPath = path.join(scrivenerPath, 'Files', 'Data', uuid);
  const contentPath = path.join(dataPath, 'content.rtf');

  let description = '';
  if (fsSync.existsSync(contentPath)) {
    const rtfContent = fsSync.readFileSync(contentPath, 'utf8');
    description = await convertRtfToPlainText(rtfContent);
  }

  return {
    id: uuid,
    name: name || 'Unnamed Character',
    description: description,
    appearance: '',
    personality: '',
    backstory: '',
    notes: '',
    relationships: []
  };
}

async function parseLocation(binderItem, scrivenerPath) {
  const uuid = binderItem.getAttribute('UUID');
  const name = getElementText(binderItem, 'Title');

  const dataPath = path.join(scrivenerPath, 'Files', 'Data', uuid);
  const contentPath = path.join(dataPath, 'content.rtf');

  let description = '';
  if (fsSync.existsSync(contentPath)) {
    const rtfContent = fsSync.readFileSync(contentPath, 'utf8');
    description = await convertRtfToPlainText(rtfContent);
  }

  return {
    id: uuid,
    name: name || 'Unnamed Location',
    description: description,
    notes: ''
  };
}

function getElementText(parent, tagName) {
  const element = parent.getElementsByTagName(tagName)[0];
  return element ? element.textContent.trim() : '';
}

function convertRtfToPlainText(rtfContent) {
  if (!rtfContent || rtfContent.trim() === '') {
    return Promise.resolve('');
  }

  // If it's not RTF content, return as-is
  if (!rtfContent.includes('{\\rtf')) {
    return Promise.resolve(rtfContent.trim());
  }

  // Use proper RTF parser
  return rtfParse
    .parseString(rtfContent)
    .then(doc => {
      const result = convertRtfDocumentToMarkdown(doc);

      return result;
    })
    .catch(error => {
      console.error('RTF parsing failed:', error);
      throw error; // Don't fall back, let the error bubble up
    });
}

function convertRtfDocumentToMarkdown(doc) {
  const paragraphs = [];
  let currentParagraph = '';
  const formatState = { italic: false, bold: false };
  let pendingItalicText = '';
  let pendingBoldText = '';

  function flushFormattedText() {
    if (pendingItalicText.trim()) {
      const trimmedText = pendingItalicText.trim();
      const beforeSpace = shouldAddSpaceBefore(
        pendingItalicText,
        currentParagraph
      );
      const afterSpace = shouldAddSpaceAfter(pendingItalicText);
      currentParagraph += `${beforeSpace}*${trimmedText}*${afterSpace}`;
      pendingItalicText = '';
    }
    if (pendingBoldText.trim()) {
      const trimmedText = pendingBoldText.trim();
      const beforeSpace = shouldAddSpaceBefore(
        pendingBoldText,
        currentParagraph
      );
      const afterSpace = shouldAddSpaceAfter(pendingBoldText);
      currentParagraph += `${beforeSpace}**${trimmedText}**${afterSpace}`;
      pendingBoldText = '';
    }
  }

  function shouldAddSpaceBefore(formattedText, currentParagraph) {
    // If the formatted text doesn't start with space, don't add one
    if (!formattedText.match(/^\s+/)) {
      return '';
    }

    // If there's nothing before this in the paragraph, don't add space
    if (!currentParagraph) {
      return '';
    }

    // Get the last character of what's already in the paragraph
    const lastChar = currentParagraph.slice(-1);

    // Don't add space after these characters
    const noSpaceAfter = ['"', "'", '—', '–', '(', '[', '{'];
    if (noSpaceAfter.includes(lastChar)) {
      return '';
    }

    // Add space if the paragraph doesn't already end with whitespace
    return lastChar.match(/\s/) ? '' : ' ';
  }

  function shouldAddSpaceAfter(formattedText) {
    // Add trailing space if the original formatted text had trailing space
    // OR if we need to maintain proper spacing between formatted and unformatted text
    if (formattedText.match(/\s+$/)) {
      return ' ';
    }

    // For now, conservatively add a space after formatting to prevent text concatenation
    // This will be cleaned up later if not needed
    return ' ';
  }

  function addText(text) {
    // Skip font names and RTF junk BEFORE character conversion
    if (
      text.includes('PalatinoLinotype') ||
      text.includes('Cochin') ||
      text.match(/^[A-Za-z-]+;$/) ||
      text.trim() === ''
    ) {
      return;
    }

    // Convert smart quotes and special characters AFTER filtering
    text = convertRtfCharacterEscapes(text);

    // Skip pure RTF artifacts but preserve converted characters
    //if (text.match(/^[;*\\]+$/)) {
    //  return;
    //}

    // Remove trailing backslashes
    text = text.replace(/\\+$/, '');

    if (formatState.italic) {
      pendingItalicText += text;
    } else if (formatState.bold) {
      pendingBoldText += text;
    } else {
      // Regular text - flush any pending formatted text first
      flushFormattedText();
      currentParagraph += text;
    }
  }

  function walkTree(node) {
    if (node.constructor.name === 'Command') {
      // Handle formatting commands
      if (node.name === 'i1' || node.name === 'i') {
        // Starting italic - flush any pending text first
        flushFormattedText();
        formatState.italic = true;
      } else if (node.name === 'i0') {
        // Ending italic - flush the italic text
        flushFormattedText();
        formatState.italic = false;
      } else if (node.name === 'b1' || node.name === 'b') {
        flushFormattedText();
        formatState.bold = true;
      } else if (node.name === 'b0') {
        flushFormattedText();
        formatState.bold = false;
      } else if (node.name === 'emdash') {
        // Em-dash command
        addText('--');
      } else if (node.name === 'par' || node.name === 'pard') {
        // Paragraph break - flush everything and start new paragraph
        flushFormattedText();
        const beforeClean = currentParagraph.trim();
        const cleanParagraph = beforeClean
          .replace(/^(\*;;|[;\\])+/, '') // Remove *;; patterns, ;, and \ from beginning
          .replace(/\\+$/, '') // Remove trailing backslashes
          .trim();

        if (cleanParagraph) {
          paragraphs.push(cleanParagraph);
          currentParagraph = '';
        } else {
          currentParagraph = '';
        }
      }
    } else if (node.constructor.name === 'Text' && node.value) {
      // Handle text nodes
      if (node.value.trim()) {
        // Check if text contains paragraph breaks (double newlines)
        if (node.value.includes('\n\n')) {
          const parts = node.value.split('\n\n');
          for (let i = 0; i < parts.length; i++) {
            if (parts[i].trim()) {
              addText(parts[i]);
            }
            // Add paragraph break after each part except the last
            if (i < parts.length - 1) {
              flushFormattedText();
              const cleanParagraph = currentParagraph
                .trim()
                .replace(/^(\*;;|[;\\])+/, '') // Remove *;; patterns, ;, and \ from beginning
                .replace(/\\+$/, '') // Remove trailing backslashes
                .trim();
              if (cleanParagraph) {
                paragraphs.push(cleanParagraph);
              }
              currentParagraph = '';
            }
          }
        } else {
          addText(node.value);
        }
      } else if (node.value.includes('\n')) {
        // Newline-only text nodes can indicate paragraph breaks
        flushFormattedText();
        const cleanParagraph = currentParagraph
          .trim()
          .replace(/^(\*;;|[;\\])+/, '') // Remove *;; patterns, ;, and \ from beginning
          .replace(/\\+$/, '') // Remove trailing backslashes
          .trim();
        if (cleanParagraph) {
          paragraphs.push(cleanParagraph);
        }
        currentParagraph = '';
      }
    } else if (node.children) {
      // Recursively walk child nodes
      for (const child of node.children) {
        walkTree(child);
      }
    }
  }

  // Walk the entire document tree
  walkTree(doc);

  // Flush any remaining text and add final paragraph
  flushFormattedText();
  const finalParagraph = currentParagraph
    .trim()
    .replace(/^(\*;;|[;\\])+/, '') // Remove *;; patterns, ;, and \ from beginning
    .replace(/\\+$/, '') // Remove trailing backslashes
    .trim();
  if (finalParagraph) {
    paragraphs.push(finalParagraph);
  }

  // Join paragraphs with double newlines
  let result = paragraphs.join('\n\n');

  // Final cleanup - remove trailing backslashes from all paragraphs
  result = result.replace(/\\+$/gm, ''); // Remove trailing backslashes from each line
  result = result.replace(/\\+\n/g, '\n'); // Remove backslashes before newlines

  const finalResult = result;

  return finalResult;
}

function convertToBookFormat(bookData) {
  // Convert parts from containing chapter objects to containing chapter IDs
  if (bookData.parts && bookData.parts.length > 0) {
    bookData.parts = bookData.parts.map(part => ({
      id: part.id,
      title: part.title,
      chapterIds: part.chapters ? part.chapters.map(ch => ch.id) : []
    }));
  }

  // Ensure we have at least one chapter if none exist
  if (bookData.chapters.length === 0) {
    // Create a default chapter
    bookData.chapters.push({
      id: 'default-chapter',
      title: 'Chapter 1',
      scenes: []
    });
  }

  // Add some default background documents if none were found
  if (bookData.backgroundFolders[0].documents.length === 0) {
    bookData.backgroundFolders[0].documents = [
      {
        id: 'default-bg-doc-1',
        title: 'World Building',
        content: 'General world building notes and background information.'
      }
    ];
  }
}

async function importScrivenerProject() {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Scrivener Project (.scriv folder)',
      properties: ['openDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return;
    }

    const scrivenerPath = result.filePaths[0];

    // Validate that it's a .scriv folder
    if (!scrivenerPath.endsWith('.scriv')) {
      dialog.showErrorBox(
        'Invalid Selection',
        'Please select a .scriv folder (Scrivener project)'
      );
      return;
    }

    // Import the project in the main process and send result to renderer
    try {
      const bookData = await importScrivenerProjectSync(scrivenerPath);
      mainWindow.webContents.send('import-scrivener-result', {
        success: true,
        bookData
      });
    } catch (importError) {
      console.error('Error importing Scrivener project:', importError);
      mainWindow.webContents.send('import-scrivener-result', {
        success: false,
        error: importError.message
      });
    }
  } catch (error) {
    console.error('Error opening Scrivener import dialog:', error);
    dialog.showErrorBox(
      'Import Error',
      `Failed to open import dialog: ${error.message}`
    );
  }
}

function createMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    // App Menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.getName(),
            submenu: [
              { label: 'About AbsoluteScenes', click: () => showAboutDialog() },
              { type: 'separator' },
              { label: 'Services', role: 'services', submenu: [] },
              { type: 'separator' },
              {
                label: 'Hide AbsoluteScenes',
                accelerator: 'Command+H',
                role: 'hide'
              },
              {
                label: 'Hide Others',
                accelerator: 'Command+Shift+H',
                role: 'hideothers'
              },
              { label: 'Show All', role: 'unhide' },
              { type: 'separator' },
              {
                label: 'Quit',
                accelerator: 'Command+Q',
                click: () => app.quit()
              }
            ]
          }
        ]
      : []),

    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Book',
          accelerator: 'CmdOrCtrl+N',
          click: () => handleNewBook()
        },
        {
          label: 'Open Book...',
          accelerator: 'CmdOrCtrl+O',
          click: () => openBook()
        },
        {
          label: 'Import from Scrivener...',
          accelerator: 'CmdOrCtrl+I',
          click: () => importScrivenerProject()
        },
        { type: 'separator' },
        {
          label: 'Save Book',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-save-book')
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.send('menu-save-as')
        },
        { type: 'separator' },
        {
          label: 'Export Book...',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow.webContents.send('menu-export-book')
        },
        { type: 'separator' },
        ...(!isMac
          ? [
              {
                label: 'Exit',
                accelerator: 'Alt+F4',
                click: () => app.quit()
              }
            ]
          : [])
      ]
    },

    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        {
          label: 'Redo',
          accelerator: isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y',
          role: 'redo'
        },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectall' },
        { type: 'separator' },
        {
          label: 'Delete',
          accelerator: 'Delete',
          click: () => mainWindow.webContents.send('menu-delete')
        }
      ]
    },

    // Chapter Menu
    {
      label: 'Chapter',
      submenu: [
        {
          label: 'New Chapter',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => mainWindow.webContents.send('menu-new-chapter')
        },
        {
          label: 'Delete Chapter',
          accelerator: 'CmdOrCtrl+Shift+Delete',
          click: () => mainWindow.webContents.send('menu-delete-chapter')
        }
      ]
    },

    // Part Menu
    {
      label: 'Part',
      submenu: [
        {
          label: 'New Part',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => mainWindow.webContents.send('menu-new-part')
        },
        {
          label: 'Delete Part',
          accelerator: 'CmdOrCtrl+Shift+Alt+Delete',
          click: () => mainWindow.webContents.send('menu-delete-part')
        }
      ]
    },

    // Scene Menu
    {
      label: 'Scene',
      submenu: [
        {
          label: 'New Scene',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => mainWindow.webContents.send('menu-new-scene')
        },
        {
          label: 'Delete Scene',
          accelerator: 'CmdOrCtrl+Delete',
          click: () => mainWindow.webContents.send('menu-delete-scene')
        }
      ]
    },

    // View Menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Recycle Bin',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => mainWindow.webContents.send('menu-toggle-recycle-bin')
        },
        {
          label: 'Toggle Theme',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => mainWindow.webContents.send('menu-toggle-theme')
        },
        { type: 'separator' },
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+F5',
          role: 'forceReload'
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          role: 'toggleDevTools'
        },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          role: 'togglefullscreen'
        }
      ]
    },

    // Tools Menu
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Template Settings...',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow.webContents.send('menu-template-settings')
        },
        {
          label: 'Spell Check Settings...',
          click: () => mainWindow.webContents.send('menu-spell-check-settings')
        },
        {
          label: 'Font Settings...',
          click: () => mainWindow.webContents.send('menu-font-settings')
        },
        {
          label: 'GitHub Integration...',
          accelerator: 'CmdOrCtrl+G',
          click: () => mainWindow.webContents.send('menu-github-integration')
        },
        {
          label: 'Backup Recovery...',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow.webContents.send('menu-backup-recovery')
        },
        { type: 'separator' },
        {
          label: 'Empty Recycle Bin',
          click: () => mainWindow.webContents.send('menu-empty-recycle-bin')
        }
      ]
    },

    // Window Menu (macOS)
    ...(isMac
      ? [
          {
            label: 'Window',
            submenu: [
              {
                label: 'Minimize',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
              },
              { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' },
              { type: 'separator' },
              { label: 'Bring All to Front', role: 'front' }
            ]
          }
        ]
      : []),

    // Help Menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: () =>
            shell.openExternal('https://github.com/orinoco77/absolute-scenes')
        },
        {
          label: 'Report an Issue',
          click: () =>
            shell.openExternal(
              'https://github.com/orinoco77/absolute-scenes/issues'
            )
        },
        { type: 'separator' },
        ...(!isMac
          ? [
              {
                label: 'About AbsoluteScenes',
                click: () => showAboutDialog()
              }
            ]
          : [])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Show About dialog
function showAboutDialog() {
  // Read version from package.json
  const packageJsonPath = path.join(__dirname, '../package.json');
  let version = '1.0.0'; // fallback version

  try {
    const packageJson = require(packageJsonPath);
    version = packageJson.version;
  } catch (error) {
    console.error('Error reading version from package.json:', error);
  }

  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'About AbsoluteScenes',
    message: 'AbsoluteScenes Book Writer',
    detail: `Version: ${version}\nA scene-based book writing application\n\nBuilt with Electron and React\n\nCopyright © 2025 Adam Short <ajs@shiny.org.uk>`,
    buttons: ['OK']
  });
}

async function openBook() {
  try {
    // Check if there are unsaved changes BEFORE showing file picker
    let hasUnsavedChanges = false;
    try {
      hasUnsavedChanges = await mainWindow.webContents.executeJavaScript(`
        (() => {
          // Try electronAPI first (if preload script is working)
          if (window.electronAPI && window.electronAPI.hasUnsavedChanges) {
            return window.electronAPI.hasUnsavedChanges();
          }
          // Fallback to extensions (when nodeIntegration is true)
          if (window._electronAPIExtensions && window._electronAPIExtensions.hasUnsavedChanges) {
            return window._electronAPIExtensions.hasUnsavedChanges();
          }
          // Last resort: check mock API (browser mode)
          if (window._mockElectronAPI && window._mockElectronAPI.hasUnsavedChanges) {
            return window._mockElectronAPI.hasUnsavedChanges();
          }
          return false;
        })()
      `);
    } catch (error) {
      console.log('Could not check unsaved changes, proceeding with open book');
      hasUnsavedChanges = false;
    }

    if (hasUnsavedChanges) {
      const response = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: ['Open Book', 'Cancel'],
        defaultId: 1,
        cancelId: 1,
        title: 'Unsaved Changes',
        message:
          'You have unsaved changes. Are you sure you want to open another book?',
        detail: 'All unsaved changes will be lost.'
      });

      if (response.response !== 0) {
        return; // User cancelled - don't show file picker
      }
    }

    // Show file picker only if user confirmed or no unsaved changes
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Book Files', extensions: ['book'] },
        { name: 'JSON Files', extensions: ['json'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      // Skip unsaved changes check since we already did it
      await openBookFile(filePath, false);
    }
  } catch (error) {
    console.error('Error opening book file:', error);
    dialog.showErrorBox('Error', 'Failed to load book file: ' + error.message);
  }
}

// Track active save operations to prevent conflicts
const activeSaveOperations = new Set();

// Register all IPC handlers
function registerIpcHandlers() {
  // Handler for save dialog
  ipcMain.handle(
    'save-book-dialog',
    async (event, bookData, existingFilePath = null) => {
      const operationId = Date.now() + '-' + Math.random();

      try {
        // Check if another save is in progress
        if (activeSaveOperations.size > 0) {
          return {
            success: false,
            error: 'Another save operation is in progress'
          };
        }

        activeSaveOperations.add(operationId);

        // Ensure window is focused for dialog
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus();
        }

        // Bring window to front and ensure it's focused before showing dialog
        if (mainWindow) {
          mainWindow.moveTop();
          mainWindow.focus();
          mainWindow.show();
        }

        const result = await dialog.showSaveDialog(mainWindow, {
          defaultPath: existingFilePath || undefined,
          filters: [
            { name: 'Book Files', extensions: ['book'] },
            { name: 'JSON Files', extensions: ['json'] }
          ],
          properties: ['createDirectory'] // Allow creating directories if needed
        });

        if (!result.canceled && result.filePath) {
          await fs.writeFile(
            result.filePath,
            JSON.stringify(bookData, null, 2),
            'utf8'
          );
          return { success: true, filePath: result.filePath };
        }

        return { success: false, canceled: true };
      } catch (error) {
        console.error('Error in save-book-dialog:', error);
        return { success: false, error: error.message };
      } finally {
        activeSaveOperations.delete(operationId);
      }
    }
  );

  // Handler for direct file saves (when file path is already known)
  ipcMain.handle('save-book-to-file', async (event, bookData, filePath) => {
    const operationId = Date.now() + '-' + Math.random();

    try {
      if (!filePath) {
        return { success: false, error: 'No file path provided' };
      }

      // Check if another save is in progress
      if (activeSaveOperations.size > 0) {
        return {
          success: false,
          error: 'Another save operation is in progress'
        };
      }

      activeSaveOperations.add(operationId);

      await fs.writeFile(filePath, JSON.stringify(bookData, null, 2), 'utf8');
      return { success: true, filePath };
    } catch (error) {
      console.error('Error saving book to file:', error);
      return { success: false, error: error.message };
    } finally {
      activeSaveOperations.delete(operationId);
    }
  });

  // Handler for recovered book saves
  ipcMain.handle(
    'save-recovered-book',
    async (event, { bookData, suggestedFilename }) => {
      const operationId = Date.now() + '-' + Math.random();

      try {
        if (activeSaveOperations.size > 0) {
          return {
            success: false,
            error: 'Another save operation is in progress'
          };
        }

        activeSaveOperations.add(operationId);

        // Ensure window is focused for dialog
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus();
        }

        // Bring window to front and ensure it's focused before showing dialog
        if (mainWindow) {
          mainWindow.moveTop();
          mainWindow.focus();
          mainWindow.show();
        }

        const result = await dialog.showSaveDialog(mainWindow, {
          defaultPath: suggestedFilename || 'recovered-book.book',
          filters: [
            { name: 'Book Files', extensions: ['book'] },
            { name: 'JSON Files', extensions: ['json'] }
          ],
          properties: ['createDirectory'] // Allow creating directories if needed
        });

        if (!result.canceled && result.filePath) {
          await fs.writeFile(
            result.filePath,
            JSON.stringify(bookData, null, 2),
            'utf8'
          );
          return { success: true, filePath: result.filePath };
        }

        return { success: false, canceled: true };
      } catch (error) {
        console.error('Error in save-recovered-book:', error);
        return { success: false, error: error.message };
      } finally {
        activeSaveOperations.delete(operationId);
      }
    }
  );

  // Simple ping handler to verify IPC is ready
  ipcMain.handle('ipc-ready', () => {
    return true;
  });

  // Spell checker language handlers
  ipcMain.handle('get-available-spell-checker-languages', () => {
    if (
      mainWindow &&
      mainWindow.webContents &&
      mainWindow.webContents.session
    ) {
      return (
        mainWindow.webContents.session.availableSpellCheckerLanguages || []
      );
    }
    return [];
  });

  // Save spell checker language to electron-store for next app startup
  ipcMain.handle('save-spell-checker-language', async (event, language) => {
    try {
      const { default: Store } = await import('electron-store');
      const store = new Store();
      store.set('spellCheckLanguage', language);
      console.log('Spell checker language saved to store:', language);
      return true;
    } catch (error) {
      console.error('Error saving spell checker language:', error);
      return false;
    }
  });

  // Handler for PDF export with proper save dialog
  ipcMain.handle(
    'save-pdf-dialog',
    async (event, pdfDataUrl, suggestedFilename) => {
      try {
        // Bring window to front and ensure it's focused before showing dialog
        if (mainWindow) {
          mainWindow.moveTop();
          mainWindow.focus();
          mainWindow.show();
        }

        const result = await dialog.showSaveDialog(mainWindow, {
          defaultPath: suggestedFilename || 'book.pdf',
          filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
          properties: ['createDirectory'] // Allow creating directories if needed
        });

        if (!result.canceled && result.filePath) {
          // Convert the base64 data URL to buffer and write to file
          let base64Data;
          if (pdfDataUrl.startsWith('data:')) {
            // Handle data URL format (data:application/pdf;base64,...)
            base64Data = pdfDataUrl.split(',')[1];
          } else {
            // Handle direct base64 data
            base64Data = pdfDataUrl;
          }

          const buffer = Buffer.from(base64Data, 'base64');
          await fs.writeFile(result.filePath, buffer);

          return {
            success: true,
            filePath: result.filePath,
            message: `PDF saved successfully to ${result.filePath}`
          };
        }

        return { success: false, message: 'Save was cancelled' };
      } catch (error) {
        console.error('Error in save-pdf-dialog:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Handler for HTML export with proper save dialog
  ipcMain.handle(
    'save-html-dialog',
    async (event, htmlContent, suggestedFilename) => {
      try {
        // Bring window to front and ensure it's focused before showing dialog
        if (mainWindow) {
          mainWindow.moveTop();
          mainWindow.focus();
          mainWindow.show();
        }

        const result = await dialog.showSaveDialog(mainWindow, {
          defaultPath: suggestedFilename || 'book.html',
          filters: [{ name: 'HTML Files', extensions: ['html', 'htm'] }],
          properties: ['createDirectory']
        });

        if (!result.canceled && result.filePath) {
          await fs.writeFile(result.filePath, htmlContent, 'utf8');

          return {
            success: true,
            filePath: result.filePath,
            message: `HTML saved successfully to ${result.filePath}`
          };
        }

        return { success: false, message: 'Save was cancelled' };
      } catch (error) {
        console.error('Error in save-html-dialog:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Handler for EPUB export with proper save dialog
  ipcMain.handle(
    'save-epub-dialog',
    async (event, epubBlob, suggestedFilename) => {
      try {
        // Bring window to front and ensure it's focused before showing dialog
        if (mainWindow) {
          mainWindow.moveTop();
          mainWindow.focus();
          mainWindow.show();
        }

        const result = await dialog.showSaveDialog(mainWindow, {
          defaultPath: suggestedFilename || 'book.epub',
          filters: [{ name: 'EPUB Files', extensions: ['epub'] }],
          properties: ['createDirectory']
        });

        if (!result.canceled && result.filePath) {
          // Convert base64 blob data to buffer
          const buffer = Buffer.from(epubBlob, 'base64');
          await fs.writeFile(result.filePath, buffer);

          return {
            success: true,
            filePath: result.filePath,
            message: `EPUB saved successfully to ${result.filePath}`
          };
        }

        return { success: false, message: 'Save was cancelled' };
      } catch (error) {
        console.error('Error in save-epub-dialog:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Handler for showing notifications
  ipcMain.on('show-notification', (event, { title, body }) => {
    const { Notification } = require('electron');

    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    } else {
      console.log(`Notification: ${title} - ${body}`);
    }
  });
}

app.whenReady().then(async () => {
  await createWindow();

  // Enhanced file opening from command line
  const filePath = getFilePathFromArgs(process.argv);

  if (filePath) {
    pendingFileToOpen = filePath;
  }
});

// Handle command line arguments for direct execution
// This allows: absolute-scenes file.book
if (process.argv.length >= 3) {
  const potentialFile = process.argv[process.argv.length - 1];
  if (
    potentialFile &&
    potentialFile.endsWith('.book') &&
    !potentialFile.startsWith('-')
  ) {
    // If app is already running, this will be handled by second-instance event
    // If app is not running, this will be handled in app.whenReady()
  }
}

// Handle file opening on macOS
app.on('open-file', (event, filePath) => {
  event.preventDefault();

  if (filePath.endsWith('.book')) {
    pendingFileToOpen = filePath;
    if (mainWindow && !mainWindow.isDestroyed()) {
      attemptToOpenPendingFile();
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

// Clean up active operations when app is closing
app.on('before-quit', () => {
  activeSaveOperations.clear();
});
