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

test('an already-new-layout repo skips migration and calls pushSync directly', async () => {
  gitSync.detectRepoLayout.mockResolvedValue('new');
  gitSync.pushSync.mockResolvedValue({
    commitSha: 'new-sha',
    bookData: makeBook(),
    conflicts: []
  });

  const result = await syncBook({
    book: makeBook(),
    filePath: '/x/Book.book',
    gitHubService: makeGitHubService()
  });

  expect(gitSync.migrateLegacyRepo).not.toHaveBeenCalled();
  expect(gitSync.pushSync).toHaveBeenCalledWith(
    expect.objectContaining({
      repo: 'owner/repo',
      branch: 'main',
      lastSyncCommitSha: 'sync-sha',
      author: { name: 'Alice', email: 'alice@example.com' }
    })
  );
  expect(result.conflicts).toEqual([]);
});

test('a legacy-layout repo is migrated before the first pushSync call', async () => {
  gitSync.detectRepoLayout.mockResolvedValue('legacy');
  gitSync.getRef.mockResolvedValue({ sha: 'ref-sha' });
  gitSync.getCommit.mockResolvedValue({ tree: { sha: 'tree-sha' } });
  gitSync.getTree.mockResolvedValue([
    { path: 'Book.book' },
    { path: 'nested/other.book' }
  ]);
  gitSync.migrateLegacyRepo.mockResolvedValue({ commitSha: 'migration-sha' });
  gitSync.pushSync.mockResolvedValue({
    commitSha: 'new-sha',
    bookData: makeBook(),
    conflicts: []
  });

  await syncBook({
    book: makeBook(),
    filePath: '/x/Book.book',
    gitHubService: makeGitHubService()
  });

  expect(gitSync.migrateLegacyRepo).toHaveBeenCalledWith(
    expect.objectContaining({
      legacyFilePath: 'Book.book'
    })
  );
  const pushCall = gitSync.pushSync.mock.calls[0][0];
  expect(pushCall.lastSyncCommitSha).toBe('migration-sha');
});

test('an empty repo is bootstrapped, then migration is skipped (nothing to migrate), then pushed', async () => {
  gitSync.detectRepoLayout.mockResolvedValue('empty');
  gitSync.bootstrapEmptyRepo.mockResolvedValue({ commitSha: 'bootstrap-sha' });
  gitSync.pushSync.mockResolvedValue({
    commitSha: 'new-sha',
    bookData: makeBook(),
    conflicts: []
  });

  await syncBook({
    book: makeBook(),
    filePath: '/x/Book.book',
    gitHubService: makeGitHubService()
  });

  expect(gitSync.bootstrapEmptyRepo).toHaveBeenCalled();
  expect(gitSync.migrateLegacyRepo).not.toHaveBeenCalled();
});

test('concurrent syncBook calls for the same session share one in-flight pushSync call', async () => {
  gitSync.detectRepoLayout.mockResolvedValue('new');
  let resolvePush;
  gitSync.pushSync.mockReturnValue(
    new Promise(resolve => {
      resolvePush = resolve;
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

  resolvePush({ commitSha: 'sha', bookData: book, conflicts: [] });
  await Promise.all([call1, call2]);

  expect(gitSync.pushSync).toHaveBeenCalledTimes(1);
});

test('restores github.repository/collaboration onto the returned bookData, since pushSync/reassembleBook always returns github: {}', async () => {
  gitSync.detectRepoLayout.mockResolvedValue('new');
  gitSync.pushSync.mockResolvedValue({
    commitSha: 'new-sha',
    // Mirrors the real @absolute-scenes/git-sync behavior: reassembleBook
    // never restores github.* (see its own test: "reassembleBook fills
    // github.* with empty defaults (caller is responsible for local sync
    // bookkeeping)").
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
  expect(gitSync.pushSync).not.toHaveBeenCalled();
});

describe('pullBook', () => {
  function makeRepo() {
    return {
      full_name: 'owner/repo',
      default_branch: 'main'
    };
  }

  function makePulledBook() {
    return {
      title: 'Recovered',
      chapters: []
    };
  }

  test('a new-layout repo calls pullSync directly without migration', async () => {
    gitSync.detectRepoLayout.mockResolvedValue('new');
    gitSync.pullSync.mockResolvedValue({
      bookData: makePulledBook()
    });

    const result = await pullBook({
      repo: makeRepo(),
      filePath: '/x/Book.book',
      gitHubService: makeGitHubService()
    });

    expect(gitSync.migrateLegacyRepo).not.toHaveBeenCalled();
    expect(gitSync.pullSync).toHaveBeenCalledWith(
      expect.objectContaining({
        repo: 'owner/repo',
        branch: 'main'
      })
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
    gitSync.pullSync.mockResolvedValue({
      bookData: makePulledBook()
    });

    await pullBook({
      repo: makeRepo(),
      filePath: '/x/Book.book',
      gitHubService: makeGitHubService()
    });

    expect(gitSync.migrateLegacyRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        legacyFilePath: 'Book.book'
      })
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
    gitSync.pullSync.mockResolvedValue({
      bookData: makePulledBook()
    });

    await pullBook({
      repo: makeRepo(),
      filePath: null,
      gitHubService: makeGitHubService()
    });

    // pullSync should have been called with a cache that does nothing
    const pullCall = gitSync.pullSync.mock.calls[0][0];
    expect(pullCall.cache).toBeDefined();
    // Verify in-memory cache works
    expect(await pullCall.cache.get()).toBeNull();
    await pullCall.cache.set('key', 'value');
    expect(await pullCall.cache.get()).toBeNull(); // In-memory only, no persistence
  });

  test('skips entirely when not authenticated', async () => {
    const gitHubService = {
      isAuthenticated: () => false
    };
    const result = await pullBook({
      repo: makeRepo(),
      filePath: '/x/Book.book',
      gitHubService
    });
    expect(result).toBeNull();
    expect(gitSync.pullSync).not.toHaveBeenCalled();
  });
});
