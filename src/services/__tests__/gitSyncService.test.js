import * as gitSync from '@absolute-scenes/git-sync';
import { syncBook, __resetInFlightGuardForTests } from '../gitSyncService.js';

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
