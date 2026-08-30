export function createSyncCache(bookFilePath) {
  let loaded = null;

  async function load() {
    if (!loaded) loaded = await window.electron.readSyncCache(bookFilePath);
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
      await window.electron.writeSyncCache(bookFilePath, data);
    }
  };
}
