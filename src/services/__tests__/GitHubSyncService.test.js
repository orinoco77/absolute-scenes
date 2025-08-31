/**
 * Tests for GitHubSyncService
 * Critical service for GitHub synchronization - focusing on core logic
 */

import { GitHubSyncService } from '../GitHubSyncService';

describe('GitHubSyncService', () => {
  let gitHubSyncService;

  beforeEach(() => {
    gitHubSyncService = new GitHubSyncService();
  });

  describe('shouldSyncToGitHub', () => {
    it('returns true when book has valid GitHub repository', () => {
      const bookWithGitHub = {
        github: {
          repository: { name: 'repo', full_name: 'user/repo' }
        }
      };

      expect(gitHubSyncService.shouldSyncToGitHub(bookWithGitHub)).toBe(true);
    });

    it('returns false when book has no GitHub configuration', () => {
      const bookWithoutGitHub = {
        title: 'Book'
      };

      expect(gitHubSyncService.shouldSyncToGitHub(bookWithoutGitHub)).toBe(
        false
      );
    });

    it('returns false when book has empty GitHub configuration', () => {
      const bookWithEmptyGitHub = {
        github: {}
      };

      expect(gitHubSyncService.shouldSyncToGitHub(bookWithEmptyGitHub)).toBe(
        false
      );
    });

    it('returns false when book has null repository', () => {
      const bookWithNullRepo = {
        github: {
          repository: null
        }
      };

      expect(gitHubSyncService.shouldSyncToGitHub(bookWithNullRepo)).toBe(
        false
      );
    });

    it('returns false when book has undefined repository', () => {
      const bookWithUndefinedRepo = {
        github: {
          repository: undefined
        }
      };

      expect(gitHubSyncService.shouldSyncToGitHub(bookWithUndefinedRepo)).toBe(
        false
      );
    });

    it('returns false for null/undefined book data', () => {
      expect(gitHubSyncService.shouldSyncToGitHub(null)).toBe(false);
      expect(gitHubSyncService.shouldSyncToGitHub(undefined)).toBe(false);
    });

    it('returns false for empty string repository', () => {
      const bookWithEmptyStringRepo = {
        github: {
          repository: ''
        }
      };

      expect(
        gitHubSyncService.shouldSyncToGitHub(bookWithEmptyStringRepo)
      ).toBe(false);
    });

    it('returns false for whitespace-only repository', () => {
      const bookWithWhitespaceRepo = {
        github: {
          repository: '   '
        }
      };

      expect(gitHubSyncService.shouldSyncToGitHub(bookWithWhitespaceRepo)).toBe(
        false
      );
    });

    it('returns true for valid repository configurations', () => {
      const validConfigs = [
        { github: { repository: { name: 'repo', full_name: 'user/repo' } } },
        {
          github: {
            repository: {
              name: 'project-name',
              full_name: 'organization/project-name'
            }
          }
        },
        {
          github: {
            repository: {
              name: 'repo-with-dashes_and_underscores',
              full_name: 'user/repo-with-dashes_and_underscores'
            }
          }
        },
        { github: { repository: { name: 'repo', full_name: '  user/repo  ' } } } // Should trim whitespace
      ];

      validConfigs.forEach(config => {
        expect(gitHubSyncService.shouldSyncToGitHub(config)).toBe(true);
      });
    });

    it('handles edge cases gracefully', () => {
      const edgeCases = [
        {}, // Empty object
        { github: null }, // Null github
        { github: { repository: 0 } }, // Number (should be false but won't crash)
        { github: { repository: false } } // Boolean
      ];

      edgeCases.forEach(config => {
        expect(() =>
          gitHubSyncService.shouldSyncToGitHub(config)
        ).not.toThrow();
      });
    });
  });

  describe('service structure', () => {
    it('has syncWithGitHub method', () => {
      expect(typeof gitHubSyncService.syncWithGitHub).toBe('function');
    });

    it('has shouldSyncToGitHub method', () => {
      expect(typeof gitHubSyncService.shouldSyncToGitHub).toBe('function');
    });
  });

  describe('parameter validation for syncWithGitHub', () => {
    it('handles missing parameters gracefully', async () => {
      // This should not throw - it might fail but gracefully
      const result = await gitHubSyncService.syncWithGitHub({});
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
    });

    it('handles minimal valid parameters', async () => {
      const mockParams = {
        bookData: {
          github: { repository: { name: 'repo', full_name: 'user/repo' } }
        },
        filePath: '/test/book.book',
        saveTime: '2023-01-01T12:00:00.000Z'
      };

      const result = await gitHubSyncService.syncWithGitHub(mockParams);
      expect(result).toHaveProperty('success');
      // Will fail due to authentication but shouldn't crash
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });
  });
});
