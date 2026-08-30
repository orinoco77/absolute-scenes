import { resolveCommitAuthor } from '../commitAuthor.js';

function makeBook(currentAuthor) {
  return { github: { collaboration: { currentAuthor } } };
}

test('uses the display name and a public email when available', () => {
  const gitHubService = {
    getUserInfo: () => ({ login: 'alice-writes', email: 'alice@example.com' })
  };
  const result = resolveCommitAuthor(makeBook('Alice'), gitHubService);
  expect(result).toEqual({ name: 'Alice', email: 'alice@example.com' });
});

test('falls back to a noreply-style email when the account email is private', () => {
  const gitHubService = {
    getUserInfo: () => ({ login: 'alice-writes', email: null })
  };
  const result = resolveCommitAuthor(makeBook('Alice'), gitHubService);
  expect(result).toEqual({
    name: 'Alice',
    email: 'alice-writes@users.noreply.github.com'
  });
});

test('falls back to the GitHub login as the name when no display name was ever set', () => {
  const gitHubService = {
    getUserInfo: () => ({ login: 'alice-writes', email: null })
  };
  const result = resolveCommitAuthor(makeBook(null), gitHubService);
  expect(result.name).toBe('alice-writes');
});
