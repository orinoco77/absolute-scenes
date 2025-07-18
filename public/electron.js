const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;

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

  createMenu();
}

function createMenu() {
  const isMac = process.platform === 'darwin';
  
  const template = [
    // App Menu (macOS only)
    ...(isMac ? [{
      label: app.getName(),
      submenu: [
        { label: 'About AbsoluteScenes', click: () => showAboutDialog() },
        { type: 'separator' },
        { label: 'Services', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Hide AbsoluteScenes', accelerator: 'Command+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Command+Shift+H', role: 'hideothers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() }
      ]
    }] : []),

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
        ...(!isMac ? [
          {
            label: 'Exit',
            accelerator: 'Alt+F4',
            click: () => app.quit()
          }
        ] : [])
      ]
    },

    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y', role: 'redo' },
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
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+F5', role: 'forceReload' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' }
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
    ...(isMac ? [{
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' },
        { type: 'separator' },
        { label: 'Bring All to Front', role: 'front' }
      ]
    }] : []),

    // Help Menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: () => shell.openExternal('https://github.com/your-repo/absolutescenes')
        },
        {
          label: 'Report an Issue',
          click: () => shell.openExternal('https://github.com/your-repo/absolutescenes/issues')
        },
        { type: 'separator' },
        ...(!isMac ? [
          {
            label: 'About AbsoluteScenes',
            click: () => showAboutDialog()
          }
        ] : [])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Show About dialog
function showAboutDialog() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'About AbsoluteScenes',
    message: 'AbsoluteScenes Book Writer',
    detail: `Version: 1.0.0\nA scene-based book writing application\n\nBuilt with Electron and React\n\nCopyright © 2024 AbsoluteScenes`,
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
      const content = await fs.readFile(filePath, 'utf8');
      const bookData = JSON.parse(content);
      
      console.log('Book opened successfully, sending to renderer with filePath:', filePath);
      mainWindow.webContents.send('book-loaded', {
        ...bookData,
        filePath: filePath
      });
    }
  } catch (error) {
    console.error('Error opening book file:', error);
    dialog.showErrorBox('Error', 'Failed to load book file: ' + error.message);
  }
}

// Track active save operations to prevent conflicts
let activeSaveOperations = new Set();

// Register all IPC handlers
function registerIpcHandlers() {
  console.log('Registering IPC handlers...');
  
  // Handler for save dialog
  ipcMain.handle('save-book-dialog', async (event, bookData, existingFilePath = null) => {
    const operationId = Date.now() + '-' + Math.random();
    
    try {
      console.log('save-book-dialog handler called, operation:', operationId);
      
      // Check if another save is in progress
      if (activeSaveOperations.size > 0) {
        console.log('Another save operation is in progress, rejecting');
        return { success: false, error: 'Another save operation is in progress' };
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
        await fs.writeFile(result.filePath, JSON.stringify(bookData, null, 2), 'utf8');
        console.log('File saved successfully:', result.filePath);
        return { success: true, filePath: result.filePath };
      }
      
      return { success: false, canceled: true };
    } catch (error) {
      console.error('Error in save-book-dialog:', error);
      return { success: false, error: error.message };
    } finally {
      activeSaveOperations.delete(operationId);
    }
  });

  // Handler for direct file saves (when file path is already known)
  ipcMain.handle('save-book-to-file', async (event, bookData, filePath) => {
    const operationId = Date.now() + '-' + Math.random();
    
    try {
      console.log('save-book-to-file handler called with filePath:', filePath, 'operation:', operationId);
      
      if (!filePath) {
        return { success: false, error: 'No file path provided' };
      }
      
      // Check if another save is in progress
      if (activeSaveOperations.size > 0) {
        console.log('Another save operation is in progress, rejecting');
        return { success: false, error: 'Another save operation is in progress' };
      }
      
      activeSaveOperations.add(operationId);
      
      await fs.writeFile(filePath, JSON.stringify(bookData, null, 2), 'utf8');
      console.log('File saved successfully to:', filePath);
      return { success: true, filePath };
    } catch (error) {
      console.error('Error saving book to file:', error);
      return { success: false, error: error.message };
    } finally {
      activeSaveOperations.delete(operationId);
    }
  });

  // Handler for recovered book saves
  ipcMain.handle('save-recovered-book', async (event, { bookData, suggestedFilename }) => {
    const operationId = Date.now() + '-' + Math.random();
    
    try {
      console.log('save-recovered-book handler called, operation:', operationId);
      
      if (activeSaveOperations.size > 0) {
        console.log('Another save operation is in progress, rejecting');
        return { success: false, error: 'Another save operation is in progress' };
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
        await fs.writeFile(result.filePath, JSON.stringify(bookData, null, 2), 'utf8');
        return { success: true, filePath: result.filePath };
      }
      
      return { success: false, canceled: true };
    } catch (error) {
      console.error('Error in save-recovered-book:', error);
      return { success: false, error: error.message };
    } finally {
      activeSaveOperations.delete(operationId);
    }
  });

  // Simple ping handler to verify IPC is ready
  ipcMain.handle('ipc-ready', () => {
    console.log('IPC ready check called');
    return true;
  });
  
  console.log('All IPC handlers registered successfully');
}

app.whenReady().then(createWindow);

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
