import { createSyncCache } from '../syncCache.js';

describe('createSyncCache', () => {
  let store;
  beforeEach(() => {
    store = {};
    // Real global exposed by public/preload.js is `window.electronAPI`
    // (contextBridge.exposeInMainWorld('electronAPI', {...})) -- not
    // `window.electron`, which doesn't exist anywhere in this app. Mocking
    // the wrong name here previously let this whole test suite pass while
    // the real app crashed with "Cannot read properties of undefined
    // (reading 'readSyncCache')" the first time it ran for real.
    if (!window.electronAPI) {
      window.electronAPI = {};
    }
    window.electronAPI.readSyncCache = jest.fn(async () => store);
    window.electronAPI.writeSyncCache = jest.fn(async (path, data) => {
      store = data;
    });
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

  test('set persists via writeSyncCache using the same book file path for every call', async () => {
    const cache = createSyncCache('/path/to/My Book.book');
    await cache.set('book.json', {
      sha: 's1',
      content: '{}',
      encoding: 'utf-8'
    });
    expect(window.electronAPI.writeSyncCache).toHaveBeenCalledWith(
      '/path/to/My Book.book',
      expect.any(Object)
    );
  });
});
