import * as gitSync from '@absolute-scenes/git-sync';
import {
  syncBook,
  pullBook,
  __resetInFlightGuardForTests
} from '../gitSyncService.js';

jest.mock('@absolute-scenes/git-sync');

function makeGitHubService() {
  return {
    isAuthenticated: () => true,
    getUserInfo: () => ({ login: 'alice', email: 'alice@example.com' })
  };
}

function makeBook() {
  return {
    title: 'T',
    github: {
      repository: { full_name: 'owner/repo', default_branch: 'main' },
      lastSyncCommitSha: 'sync-sha',
      collaboration: { currentAuthor: 'Alice' }
    }
  };
}

beforeEach(() => {
  __resetInFlightGuardForTests();
  jest.clearAllMocks();
  window.electron = {
    readSyncCache: jest.fn(async () => ({})),
    writeSyncCache: jest.fn(async () => {})
  };
});

test('calls syncRepo with the resolved repo, branch, base commit, author, and cache', async () => {
  gitSync.syncRepo.mockResolvedValue({
    commitSha: 'new-sha',
    bookData: { title: 'T', github: {} },
    conflicts: []
  });

  await syncBook({
    book: makeBook(),
    filePath: '/x/Book.book',
    gitHubService: makeGitHubService()
  });

  expect(gitSync.syncRepo).toHaveBeenCalledWith(
    expect.objectContaining({
      repo: 'owner/repo',
      branch: 'main',
      lastSyncCommitSha: 'sync-sha',
      author: { name: 'Alice', email: 'alice@example.com' }
    })
  );
});

test('restores github.repository/collaboration onto the returned bookData, since syncRepo/reassembleBook always returns github: {}', async () => {
  gitSync.syncRepo.mockResolvedValue({
    commitSha: 'new-sha',
    bookData: { title: 'T', github: {} },
    conflicts: []
  });

  const book = makeBook();
  const result = await syncBook({
    book,
    filePath: '/x/Book.book',
    gitHubService: makeGitHubService()
  });

  expect(result.bookData.github.repository).toEqual(book.github.repository);
  expect(result.bookData.github.collaboration).toEqual(
    book.github.collaboration
  );
  expect(result.bookData.github.lastSyncCommitSha).toBe('new-sha');
  expect(result.bookData.title).toBe('T');
});

test('surfaces conflicts from syncRepo unchanged', async () => {
  gitSync.syncRepo.mockResolvedValue({
    commitSha: 'new-sha',
    bookData: { title: 'T', github: {} },
    conflicts: [{ sceneId: 'sc1' }]
  });

  const result = await syncBook({
    book: makeBook(),
    filePath: '/x/Book.book',
    gitHubService: makeGitHubService()
  });

  expect(result.conflicts).toEqual([{ sceneId: 'sc1' }]);
});

test('concurrent syncBook calls for the same session share one in-flight syncRepo call', async () => {
  let resolveSync;
  gitSync.syncRepo.mockReturnValue(
    new Promise(resolve => {
      resolveSync = resolve;
    })
  );

  const book = makeBook();
  const call1 = syncBook({
    book,
    filePath: '/x/Book.book',
    gitHubService: makeGitHubService()
  });
  const call2 = syncBook({
    book,
    filePath: '/x/Book.book',
    gitHubService: makeGitHubService()
  });

  resolveSync({
    commitSha: 'sha',
    bookData: { title: 'T', github: {} },
    conflicts: []
  });
  await Promise.all([call1, call2]);

  expect(gitSync.syncRepo).toHaveBeenCalledTimes(1);
});

test('skips entirely when not authenticated', async () => {
  const gitHubService = {
    isAuthenticated: () => false,
    getUserInfo: () => null
  };
  const result = await syncBook({
    book: makeBook(),
    filePath: '/x/Book.book',
    gitHubService
  });
  expect(result).toBeNull();
  expect(gitSync.syncRepo).not.toHaveBeenCalled();
});

describe('pullBook', () => {
  function makeRepo() {
    return { full_name: 'owner/repo', default_branch: 'main' };
  }

  function makePulledBook() {
    return { title: 'Recovered', chapters: [] };
  }

  test('a new-layout repo calls pullSync directly without migration', async () => {
    gitSync.detectRepoLayout.mockResolvedValue('new');
    gitSync.pullSync.mockResolvedValue({ bookData: makePulledBook() });

    const result = await pullBook({
      repo: makeRepo(),
      filePath: '/x/Book.book',
      gitHubService: makeGitHubService()
    });

    expect(gitSync.migrateLegacyRepo).not.toHaveBeenCalled();
    expect(gitSync.pullSync).toHaveBeenCalledWith(
      expect.objectContaining({ repo: 'owner/repo', branch: 'main' })
    );
    expect(result).toEqual(makePulledBook());
  });

  test('a legacy-layout repo is migrated before pullSync is called', async () => {
    gitSync.detectRepoLayout.mockResolvedValue('legacy');
    gitSync.getRef.mockResolvedValue({ sha: 'ref-sha' });
    gitSync.getCommit.mockResolvedValue({ tree: { sha: 'tree-sha' } });
    gitSync.getTree.mockResolvedValue([
      { path: 'Book.book' },
      { path: 'nested/other.book' }
    ]);
    gitSync.migrateLegacyRepo.mockResolvedValue({ commitSha: 'migration-sha' });
    gitSync.pullSync.mockResolvedValue({ bookData: makePulledBook() });

    await pullBook({
      repo: makeRepo(),
      filePath: '/x/Book.book',
      gitHubService: makeGitHubService()
    });

    expect(gitSync.migrateLegacyRepo).toHaveBeenCalledWith(
      expect.objectContaining({ legacyFilePath: 'Book.book' })
    );
    expect(gitSync.pullSync).toHaveBeenCalled();
  });

  test('an empty repo returns null', async () => {
    gitSync.detectRepoLayout.mockResolvedValue('empty');

    const result = await pullBook({
      repo: makeRepo(),
      filePath: '/x/Book.book',
      gitHubService: makeGitHubService()
    });

    expect(result).toBeNull();
    expect(gitSync.pullSync).not.toHaveBeenCalled();
  });

  test('uses in-memory cache when filePath is null (recovery case)', async () => {
    gitSync.detectRepoLayout.mockResolvedValue('new');
    gitSync.pullSync.mockResolvedValue({ bookData: makePulledBook() });

    await pullBook({
      repo: makeRepo(),
      filePath: null,
      gitHubService: makeGitHubService()
    });

    const pullCall = gitSync.pullSync.mock.calls[0][0];
    expect(pullCall.cache).toBeDefined();
    expect(await pullCall.cache.get()).toBeNull();
    await pullCall.cache.set('key', 'value');
    expect(await pullCall.cache.get()).toBeNull();
  });

  test('skips entirely when not authenticated', async () => {
    const gitHubService = { isAuthenticated: () => false };
    const result = await pullBook({
      repo: makeRepo(),
      filePath: '/x/Book.book',
      gitHubService
    });
    expect(result).toBeNull();
    expect(gitSync.pullSync).not.toHaveBeenCalled();
  });
});
