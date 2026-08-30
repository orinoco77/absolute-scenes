import {
  pushSync,
  detectRepoLayout,
  migrateLegacyRepo,
  bootstrapEmptyRepo,
  getRef,
  getCommit,
  getTree
} from '@absolute-scenes/git-sync';
import { resolveCommitAuthor } from '../utils/commitAuthor.js';
import { createSyncCache } from '../utils/syncCache.js';

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
  return { bookData: result.bookData, conflicts: result.conflicts };
}
