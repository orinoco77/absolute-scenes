import {
  pushSync,
  pullSync,
  detectRepoLayout,
  migrateLegacyRepo,
  bootstrapEmptyRepo,
  getRef,
  getCommit,
  getTree
} from '@absolute-scenes/git-sync';
import { resolveCommitAuthor } from '../utils/commitAuthor.js';
import { createSyncCache } from '../utils/syncCache.js';

export { reconcilePostSyncState } from './postSyncReconciliation.js';

let inFlight = null;

export function __resetInFlightGuardForTests() {
  inFlight = null;
}

export async function syncBook({ book, filePath, gitHubService }) {
  if (!gitHubService.isAuthenticated()) return null;
  if (inFlight) return inFlight;

  inFlight = runSync({ book, filePath, gitHubService }).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runSync({ book, filePath, gitHubService }) {
  const repo = book.github.repository.full_name;
  const branch = book.github.repository.default_branch || 'main';
  const token = gitHubService.token;
  const author = resolveCommitAuthor(book, gitHubService);
  const cache = createSyncCache(filePath);

  let lastSyncCommitSha = book.github.lastSyncCommitSha;
  const layout = await detectRepoLayout({ repo, token, branch });

  if (layout === 'empty') {
    const bootstrap = await bootstrapEmptyRepo({
      repo,
      token,
      branch,
      path: '_bootstrap.txt',
      content: 'AbsoluteScenes sync bootstrap'
    });
    lastSyncCommitSha = bootstrap.commitSha;
  } else if (layout === 'legacy') {
    // detectRepoLayout only reports the layout kind, not the legacy file's
    // path, so we walk the tree ourselves to find the single root
    // `.book`-suffixed file before handing it to migrateLegacyRepo.
    const ref = await getRef({ repo, token, branch });
    const commit = await getCommit({ repo, token, sha: ref.sha });
    const tree = await getTree({ repo, token, sha: commit.tree.sha });
    const legacyEntry = tree.find(
      e => !e.path.includes('/') && e.path.endsWith('.book')
    );
    const migration = await migrateLegacyRepo({
      repo,
      token,
      branch,
      legacyFilePath: legacyEntry.path,
      author
    });
    lastSyncCommitSha = migration.commitSha;
  }

  const result = await pushSync({
    repo,
    token,
    branch,
    bookData: book,
    lastSyncCommitSha,
    cache,
    author
  });

  // reassembleBook (inside pushSync) always returns github: {} -- the
  // git-sync package's own tests document that "github.* local bookkeeping"
  // (repository, collaboration, authorName, ...) is deliberately not part of
  // the projected file set and is the sync orchestration layer's
  // responsibility to restore. Overlay the original book's github settings
  // back on, refreshing only the fields this sync actually changed.
  const bookData = {
    ...result.bookData,
    github: {
      ...book.github,
      lastSyncCommitSha: result.commitSha,
      lastSyncTime: new Date().toISOString()
    }
  };

  return { bookData, conflicts: result.conflicts };
}

export async function pullBook({ repo, filePath, gitHubService }) {
  if (!gitHubService.isAuthenticated()) return null;

  const repoFullName = repo.full_name;
  const branch = repo.default_branch || 'main';
  const token = gitHubService.token;

  // For recovery operations (filePath: null), use an in-memory-only cache
  // since there's no local file to sync against
  const cache = filePath
    ? createSyncCache(filePath)
    : {
        get: () => Promise.resolve(null),
        set: () => Promise.resolve()
      };

  const layout = await detectRepoLayout({ repo: repoFullName, token, branch });
  if (layout === 'empty') return null;

  if (layout === 'legacy') {
    // Migrate the legacy single-file layout to the new decomposed format
    const ref = await getRef({ repo: repoFullName, token, branch });
    const commit = await getCommit({ repo: repoFullName, token, sha: ref.sha });
    const tree = await getTree({
      repo: repoFullName,
      token,
      sha: commit.tree.sha
    });
    const legacyEntry = tree.find(
      e => !e.path.includes('/') && e.path.endsWith('.book')
    );
    await migrateLegacyRepo({
      repo: repoFullName,
      token,
      branch,
      legacyFilePath: legacyEntry.path,
      author: {
        name: 'AbsoluteScenes Recovery',
        email: 'recovery@users.noreply.github.com'
      }
    });
  }

  const result = await pullSync({ repo: repoFullName, token, branch, cache });
  return result.bookData;
}
