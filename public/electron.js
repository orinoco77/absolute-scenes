const fs = require('fs').promises;
const path = require('path');
const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  shell
} = require('electron');

let mainWindow;
let pendingFileToOpen = null; // Store file path to open once app is ready

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

function createWindow() {
  // Register IPC handlers first, before creating the window
  registerIpcHandlers();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 940,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      allowRunningInsecureContent: true
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
    // Try to open any pending file after a short delay
    setTimeout(() => {
      attemptToOpenPendingFile();
    }, 1000);
  });

  createMenu();
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
    openBookFile(pendingFileToOpen);
    pendingFileToOpen = null; // Clear after attempting to open
  }
}

// Enhanced function to open a book file with better error handling and retry logic
async function openBookFile(filePath) {
  if (!filePath) {
    return;
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
          click: () => mainWindow.webContents.send('menu-new-book')
        },
        {
          label: 'Open Book...',
          accelerator: 'CmdOrCtrl+O',
          click: () => openBook()
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
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Book Files', extensions: ['book'] },
        { name: 'JSON Files', extensions: ['json'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      await openBookFile(filePath);
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

        const result = await dialog.showSaveDialog(mainWindow, {
          defaultPath: existingFilePath || undefined,
          filters: [
            { name: 'Book Files', extensions: ['book'] },
            { name: 'JSON Files', extensions: ['json'] }
          ]
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

        const result = await dialog.showSaveDialog(mainWindow, {
          defaultPath: suggestedFilename || 'recovered-book.book',
          filters: [
            { name: 'Book Files', extensions: ['book'] },
            { name: 'JSON Files', extensions: ['json'] }
          ]
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
}

app.whenReady().then(() => {
  createWindow();

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

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Clean up active operations when app is closing
app.on('before-quit', () => {
  activeSaveOperations.clear();
});
