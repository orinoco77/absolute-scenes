// This app disables Electron's contextBridge/preload entirely
// (public/electron.js sets contextIsolation: false, nodeIntegration: true,
// and comments out the preload script) -- window.electronAPI never exists.
// The real, working pattern everywhere else in this codebase
// (fileOperations.js, gitHubService.js) is a direct
// window.require('electron').ipcRenderer.invoke(channel, ...args) call.
function getIpcRenderer() {
  if (typeof window !== 'undefined' && typeof window.require === 'function') {
    return window.require('electron').ipcRenderer;
  }
  return null;
}

export function createSyncCache(bookFilePath) {
  let loaded = null;

  async function load() {
    if (!loaded) {
      const ipcRenderer = getIpcRenderer();
      loaded = ipcRenderer
        ? await ipcRenderer.invoke('sync-cache-read', bookFilePath)
        : {};
    }
    return loaded;
  }

  return {
    async get(path) {
      const data = await load();
      return data[path] ?? null;
    },
    async set(path, entry) {
      const data = await load();
      data[path] = entry;
      loaded = data;
      const ipcRenderer = getIpcRenderer();
      if (ipcRenderer) {
        await ipcRenderer.invoke('sync-cache-write', bookFilePath, data);
      }
    }
  };
}
