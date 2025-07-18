// Improved fileOperations.js with better error handling and timing

// Check if we're in Electron environment
const isElectron = () => {
  return typeof window !== 'undefined' && typeof window.require === 'function';
};

let ipcRenderer = null;
if (isElectron()) {
  try {
    const electron = window.require('electron');
    ipcRenderer = electron.ipcRenderer;
  } catch (error) {
    console.warn('Failed to load Electron APIs:', error);
  }
}

// Add a small delay to prevent rapid-fire calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function saveBook(bookData, existingFilePath = null) {
  console.log('saveBook called with:', { hasBookData: !!bookData, existingFilePath });
  
  if (!ipcRenderer) {
    console.warn('Electron IPC not available - running in browser mode');
    return browserFallbackSave(bookData);
  }

  // Add a small delay to prevent UI glitches from rapid calls
  await delay(50);

  try {
    console.log('Invoking save-book-dialog IPC...');
    
    // Wait for IPC to be ready if needed
    await ensureIpcReady();
    
    const result = await ipcRenderer.invoke('save-book-dialog', bookData, existingFilePath);
    console.log('save-book-dialog result:', result);
    
    // Validate the result
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response from save dialog');
    }
    
    return result;
  } catch (error) {
    console.error('save-book-dialog IPC error:', error);
    return { success: false, error: error.message };
  }
}

// Direct file save (when file path is already known)
export async function saveBookToFile(bookData, filePath) {
  console.log('saveBookToFile called:', { filePath, hasBookData: !!bookData });
  
  if (!ipcRenderer) {
    console.warn('Electron IPC not available - running in browser mode');
    return browserFallbackSave(bookData);
  }

  if (!filePath) {
    console.error('No file path provided for saveBookToFile');
    return { success: false, error: 'No file path provided' };
  }

  // Add a small delay to prevent UI glitches
  await delay(50);

  // Retry logic for timing issues with better backoff
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Invoking save-book-to-file IPC (attempt ${attempt}/${maxRetries})...`);
      
      // Wait for IPC to be ready
      await ensureIpcReady();
      
      const result = await ipcRenderer.invoke('save-book-to-file', bookData, filePath);
      console.log('save-book-to-file result:', result);
      
      // Validate the result
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from save operation');
      }
      
      return result;
    } catch (error) {
      lastError = error;
      console.error(`save-book-to-file IPC error (attempt ${attempt}/${maxRetries}):`, error);
      
      // If this is a "no handler" error and not the last attempt, wait and retry
      if (error.message.includes('No handler registered') && attempt < maxRetries) {
        const waitTime = attempt * 100; // Progressive backoff
        console.log(`Waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
        continue;
      }
      
      // For other errors or final attempt, break out of retry loop
      break;
    }
  }
  
  return { success: false, error: lastError.message };
}

// Helper function to ensure IPC is ready
async function ensureIpcReady() {
  if (!ipcRenderer) {
    throw new Error('IPC renderer not available');
  }
  
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await ipcRenderer.invoke('ipc-ready');
      return; // IPC is ready
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw new Error('IPC not ready after maximum attempts');
      }
      await delay(50);
    }
  }
}

// Browser fallback for saving files
function browserFallbackSave(bookData) {
  try {
    const dataStr = JSON.stringify(bookData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookData.title || 'book'}.book`;
    document.body.appendChild(a); // Ensure it's in DOM
    a.click();
    document.body.removeChild(a); // Clean up
    
    URL.revokeObjectURL(url);
    return { success: true, filePath: 'downloaded' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function loadBook() {
  // This would be handled by the menu system
  // but could also be called programmatically
}

export async function saveRecoveredBook(bookData, suggestedFilename) {
  console.log('saveRecoveredBook called with:', { hasBookData: !!bookData, suggestedFilename });
  
  if (!ipcRenderer) {
    console.warn('Electron IPC not available - running in browser mode');
    return browserFallbackSave(bookData);
  }

  await delay(50);

  try {
    console.log('Invoking save-recovered-book IPC...');
    await ensureIpcReady();
    
    const result = await ipcRenderer.invoke('save-recovered-book', {
      bookData,
      suggestedFilename
    });
    console.log('save-recovered-book result:', result);
    
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response from recovered book save');
    }
    
    return result;
  } catch (error) {
    console.error('save-recovered-book IPC error:', error);
    return { success: false, error: error.message };
  }
}
