import { createSyncCache } from '../syncCache.js';

describe('createSyncCache', () => {
  let store;
  let mockInvoke;

  beforeEach(() => {
    store = {};
    // Real IPC pattern this app actually uses (public/electron.js sets
    // contextIsolation: false, nodeIntegration: true, and preload is
    // commented out entirely -- window.electronAPI/contextBridge is dead
    // code that never runs). The working pattern, matching
    // fileOperations.js/gitHubService.js, is a direct
    // window.require('electron').ipcRenderer.invoke(channel, ...args)
    // call. Mocking window.electronAPI here previously let this whole
    // test suite pass while the real app crashed every time
    // ("Cannot read properties of undefined (reading 'readSyncCache')"),
    // because window.electronAPI never exists in the real running app.
    mockInvoke = jest.fn(async (channel, ...args) => {
      if (channel === 'sync-cache-read') return store;
      if (channel === 'sync-cache-write') {
        store = args[1];
        return undefined;
      }
      throw new Error(`Unexpected IPC channel: ${channel}`);
    });
    global.window.require = jest.fn(() => ({
      ipcRenderer: { invoke: mockInvoke }
    }));
  });

  afterEach(() => {
    delete global.window.require;
  });

  test('get returns null for a path never cached', async () => {
    const cache = createSyncCache('/path/to/My Book.book');
    expect(await cache.get('book.json')).toBeNull();
  });

  test('set then get round-trips an entry', async () => {
    const cache = createSyncCache('/path/to/My Book.book');
    await cache.set('scenes/sc1.md', {
      sha: 'abc',
      content: 'prose',
      encoding: 'utf-8'
    });
    expect(await cache.get('scenes/sc1.md')).toEqual({
      sha: 'abc',
      content: 'prose',
      encoding: 'utf-8'
    });
  });

  test('set persists via ipcRenderer.invoke("sync-cache-write", ...) using the same book file path for every call', async () => {
    const cache = createSyncCache('/path/to/My Book.book');
    await cache.set('book.json', {
      sha: 's1',
      content: '{}',
      encoding: 'utf-8'
    });
    expect(mockInvoke).toHaveBeenCalledWith(
      'sync-cache-write',
      '/path/to/My Book.book',
      expect.any(Object)
    );
  });

  test('get reads via ipcRenderer.invoke("sync-cache-read", bookFilePath)', async () => {
    const cache = createSyncCache('/path/to/My Book.book');
    await cache.get('book.json');
    expect(mockInvoke).toHaveBeenCalledWith(
      'sync-cache-read',
      '/path/to/My Book.book'
    );
  });

  test('degrades gracefully with no persistence when not running in Electron (no window.require)', async () => {
    delete global.window.require;
    const cache = createSyncCache('/path/to/My Book.book');
    expect(await cache.get('book.json')).toBeNull();
    await expect(
      cache.set('book.json', { sha: 's1', content: '{}', encoding: 'utf-8' })
    ).resolves.not.toThrow();
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
