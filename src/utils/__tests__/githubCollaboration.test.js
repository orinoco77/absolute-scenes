/**
 * Tests for GitHub Collaboration Features
 * Tests the timestamp-based merging and 3-way merge logic
 */

import { BrowserCollaborationService } from '../browserCollaborationService';
import { BrowserEnhancedGitHubService } from '../browserEnhancedGitHubService';
import GitHubService from '../gitHubService';

// Mock GitHubService
jest.mock('../gitHubService', () => ({
  __esModule: true,
  default: {
    isAuthenticated: jest.fn(),
    saveBookToRepository: jest.fn(),
    checkRepositoryForBookFile: jest.fn(),
    downloadBookFromRepository: jest.fn()
  }
}));

describe('GitHub Collaboration Features', () => {
  describe('BrowserCollaborationService - 3-way merge', () => {
    let service;

    // Helper to create complete book objects
    const createBook = (overrides = {}) => ({
      title: 'Test Book',
      author: 'Test Author',
      chapters: [],
      characters: [],
      locations: [],
      parts: [],
      backgroundFolders: [],
      frontMatter: [],
      characterDetectionBlacklist: [],
      template: {},
      github: {},
      metadata: {},
      collaboration: {},
      ...overrides
    });

    beforeEach(() => {
      service = new BrowserCollaborationService();
    });

    describe('simple field merging', () => {
      it('uses remote value when local unchanged', async () => {
        const base = createBook({ title: 'Original' });
        const local = createBook({ title: 'Original' });
        const remote = createBook({ title: 'Remote Changed' });

        const result = await service.mergeContent(base, remote, local);

        expect(result.content.title).toBe('Remote Changed');
        expect(result.hasConflicts).toBe(false);
      });

      it('uses local value when remote unchanged', async () => {
        const base = createBook({ title: 'Original' });
        const local = createBook({ title: 'Local Changed' });
        const remote = createBook({ title: 'Original' });

        const result = await service.mergeContent(base, remote, local);

        expect(result.content.title).toBe('Local Changed');
        expect(result.hasConflicts).toBe(false);
      });

      it('detects conflict when both changed', async () => {
        const base = createBook({ title: 'Original' });
        const local = createBook({ title: 'Local Changed' });
        const remote = createBook({ title: 'Remote Changed' });

        const result = await service.mergeContent(base, remote, local);

        expect(result.hasConflicts).toBe(true);
        expect(result.conflicts.length).toBeGreaterThan(0);
      });

      it('no conflict when both changed to same value', async () => {
        const base = createBook({ title: 'Original' });
        const local = createBook({ title: 'Same' });
        const remote = createBook({ title: 'Same' });

        const result = await service.mergeContent(base, remote, local);

        expect(result.content.title).toBe('Same');
        expect(result.hasConflicts).toBe(false);
      });
    });

    describe('chapter and scene merging', () => {
      it('merges non-conflicting scene additions', async () => {
        const base = createBook({
          chapters: [
            {
              id: 'ch1',
              title: 'Chapter 1',
              scenes: [{ id: 's1', title: 'Scene 1', content: 'Content 1' }]
            }
          ]
        });
        const local = createBook({
          chapters: [
            {
              id: 'ch1',
              title: 'Chapter 1',
              scenes: [
                { id: 's1', title: 'Scene 1', content: 'Content 1' },
                { id: 's2', title: 'Scene 2', content: 'Local Scene' }
              ]
            }
          ]
        });
        const remote = createBook({
          chapters: [
            {
              id: 'ch1',
              title: 'Chapter 1',
              scenes: [
                { id: 's1', title: 'Scene 1', content: 'Content 1' },
                { id: 's3', title: 'Scene 3', content: 'Remote Scene' }
              ]
            }
          ]
        });

        const result = await service.mergeContent(base, remote, local);

        // Debug output
        if (result.content.chapters[0].scenes.length !== 3) {
          console.log('MERGE FAILED:');
          console.log(
            'Expected 3 scenes, got:',
            result.content.chapters[0].scenes.length
          );
          console.log(
            'Scene IDs:',
            result.content.chapters[0].scenes.map(s => s.id)
          );
          console.log('Has conflicts:', result.hasConflicts);
          console.log('Conflicts:', result.conflicts);
        }

        expect(result.hasConflicts).toBe(false);
        expect(result.content.chapters[0].scenes.length).toBe(3);
        const sceneIds = result.content.chapters[0].scenes.map(s => s.id);
        expect(sceneIds).toContain('s1');
        expect(sceneIds).toContain('s2');
        expect(sceneIds).toContain('s3');
      });

      it('merges field-level changes in same scene', async () => {
        const base = createBook({
          chapters: [
            {
              id: 'ch1',
              title: 'Chapter 1',
              scenes: [
                {
                  id: 's1',
                  title: 'Scene 1',
                  content: 'Original',
                  notes: 'Original notes'
                }
              ]
            }
          ]
        });
        const local = createBook({
          chapters: [
            {
              id: 'ch1',
              title: 'Chapter 1',
              scenes: [
                {
                  id: 's1',
                  title: 'Scene 1',
                  content: 'Local edit',
                  notes: 'Original notes'
                }
              ]
            }
          ]
        });
        const remote = createBook({
          chapters: [
            {
              id: 'ch1',
              title: 'Chapter 1',
              scenes: [
                {
                  id: 's1',
                  title: 'Scene 1',
                  content: 'Original',
                  notes: 'Remote notes'
                }
              ]
            }
          ]
        });

        const result = await service.mergeContent(base, remote, local);

        expect(result.hasConflicts).toBe(false);
        const scene = result.content.chapters[0].scenes[0];
        expect(scene.content).toBe('Local edit');
        expect(scene.notes).toBe('Remote notes');
      });
    });

    describe('character merging', () => {
      it('merges character additions from both sides', async () => {
        const base = createBook({ characters: [] });
        const local = createBook({
          characters: [{ id: 'c1', name: 'Local Character', description: '' }]
        });
        const remote = createBook({
          characters: [{ id: 'c2', name: 'Remote Character', description: '' }]
        });

        const result = await service.mergeContent(base, remote, local);

        expect(result.hasConflicts).toBe(false);
        expect(result.content.characters.length).toBe(2);
        const names = result.content.characters.map(c => c.name);
        expect(names).toContain('Local Character');
        expect(names).toContain('Remote Character');
      });
    });
  });

  describe('BrowserEnhancedGitHubService - timestamp-based sync', () => {
    let service;
    const mockRepository = { full_name: 'user/test-book', name: 'test-book' };

    beforeEach(() => {
      jest.clearAllMocks();
      service = new BrowserEnhancedGitHubService();
      GitHubService.isAuthenticated.mockReturnValue(true);
    });

    describe('when remote is newer than local', () => {
      it('performs merge integrating remote changes', async () => {
        const localBook = {
          title: 'Test Book',
          chapters: [],
          metadata: { modified: '2024-01-01T10:00:00.000Z' }
        };

        const remoteBook = {
          title: 'Test Book Updated',
          chapters: [],
          metadata: { modified: '2024-01-01T12:00:00.000Z' }
        };

        GitHubService.checkRepositoryForBookFile.mockResolvedValue({
          name: 'book.book'
        });
        GitHubService.downloadBookFromRepository.mockResolvedValue({
          bookData: remoteBook,
          filename: 'book.book'
        });
        GitHubService.saveBookToRepository.mockResolvedValue({});

        // Mock the merge to return remote (which means we pulled remote changes)
        service.collaborationService.mergeContent = jest
          .fn()
          .mockResolvedValue({
            content: remoteBook,
            hasConflicts: false,
            conflicts: []
          });

        const result = await service.safeSyncWithRepository(
          mockRepository,
          localBook,
          'Test commit',
          '/path/to/book.book'
        );

        expect(result.success).toBe(true);
        expect(service.collaborationService.mergeContent).toHaveBeenCalled();
        // When merge result = remote, no push needed (optimization)
        expect(GitHubService.saveBookToRepository).not.toHaveBeenCalled();
        expect(result.wasPushed).toBe(false);
      });

      it('returns conflicts when merge detects them', async () => {
        const localBook = {
          title: 'Local Title',
          chapters: [],
          metadata: { modified: '2024-01-01T10:00:00.000Z' }
        };

        const remoteBook = {
          title: 'Remote Title',
          chapters: [],
          metadata: { modified: '2024-01-01T12:00:00.000Z' }
        };

        GitHubService.checkRepositoryForBookFile.mockResolvedValue({
          name: 'book.book'
        });
        GitHubService.downloadBookFromRepository.mockResolvedValue({
          bookData: remoteBook,
          filename: 'book.book'
        });

        // Mock merge with conflicts
        service.collaborationService.mergeContent = jest
          .fn()
          .mockResolvedValue({
            content: {},
            hasConflicts: true,
            conflicts: [
              {
                type: 'title',
                localContent: 'Local Title',
                remoteContent: 'Remote Title'
              }
            ]
          });

        const result = await service.safeSyncWithRepository(
          mockRepository,
          localBook,
          'Test commit',
          '/path/to/book.book'
        );

        expect(result.success).toBe(false);
        expect(result.requiresResolution).toBe(true);
        expect(result.conflicts.length).toBeGreaterThan(0);
        expect(GitHubService.saveBookToRepository).not.toHaveBeenCalled();
      });
    });

    describe('when local is newer than remote', () => {
      it('checks for conflicts and pushes local if none', async () => {
        const localBook = {
          title: 'Test Book',
          chapters: [],
          metadata: { modified: '2024-01-01T12:00:00.000Z' }
        };

        const remoteBook = {
          title: 'Test Book',
          chapters: [],
          metadata: { modified: '2024-01-01T10:00:00.000Z' }
        };

        GitHubService.checkRepositoryForBookFile.mockResolvedValue({
          name: 'book.book'
        });
        GitHubService.downloadBookFromRepository.mockResolvedValue({
          bookData: remoteBook,
          filename: 'book.book'
        });
        GitHubService.saveBookToRepository.mockResolvedValue({});

        // Mock the merge to return no conflicts
        service.collaborationService.mergeContent = jest
          .fn()
          .mockResolvedValue({
            content: localBook,
            hasConflicts: false,
            conflicts: []
          });

        const result = await service.safeSyncWithRepository(
          mockRepository,
          localBook,
          'Test commit',
          '/path/to/book.book'
        );

        expect(result.success).toBe(true);
        // Now uses 3-way merge instead of detectConflicts
        expect(service.collaborationService.mergeContent).toHaveBeenCalled();
        expect(GitHubService.saveBookToRepository).toHaveBeenCalled();
      });
    });

    describe('when no remote exists', () => {
      it('pushes local directly', async () => {
        const localBook = {
          title: 'Test Book',
          chapters: [],
          metadata: { modified: '2024-01-01T12:00:00.000Z' }
        };

        GitHubService.checkRepositoryForBookFile.mockResolvedValue(null);
        GitHubService.saveBookToRepository.mockResolvedValue({});

        const result = await service.safeSyncWithRepository(
          mockRepository,
          localBook,
          'Test commit',
          '/path/to/book.book'
        );

        expect(result.success).toBe(true);
        expect(result.conflicts).toHaveLength(0);
        expect(GitHubService.saveBookToRepository).toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('handles missing metadata gracefully', async () => {
        const localBook = { title: 'Test Book', chapters: [] };
        const remoteBook = {
          title: 'Test Book',
          chapters: [],
          metadata: { modified: '2024-01-01T12:00:00.000Z' }
        };

        GitHubService.checkRepositoryForBookFile.mockResolvedValue({
          name: 'book.book'
        });
        GitHubService.downloadBookFromRepository.mockResolvedValue({
          bookData: remoteBook,
          filename: 'book.book'
        });
        GitHubService.saveBookToRepository.mockResolvedValue({});

        service.collaborationService.mergeContent = jest
          .fn()
          .mockResolvedValue({
            content: remoteBook,
            hasConflicts: false,
            conflicts: []
          });

        const result = await service.safeSyncWithRepository(
          mockRepository,
          localBook,
          'Test commit',
          '/path/to/book.book'
        );

        // Should treat missing timestamp as very old and merge with remote
        expect(result.success).toBe(true);
      });

      it('handles API errors gracefully', async () => {
        const localBook = {
          title: 'Test Book',
          chapters: [],
          metadata: { modified: '2024-01-01T12:00:00.000Z' }
        };

        GitHubService.checkRepositoryForBookFile.mockRejectedValue(
          new Error('API Error')
        );

        const result = await service.safeSyncWithRepository(
          mockRepository,
          localBook,
          'Test commit',
          '/path/to/book.book'
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('API Error');
      });
    });
  });

  describe('Real-world collaboration scenarios', () => {
    let service;

    beforeEach(() => {
      service = new BrowserCollaborationService();
    });

    const createBook = (overrides = {}) => ({
      title: 'Test Book',
      author: 'Test Author',
      chapters: [],
      characters: [],
      locations: [],
      parts: [],
      backgroundFolders: [],
      frontMatter: [],
      characterDetectionBlacklist: [],
      template: {},
      github: {},
      metadata: {},
      collaboration: {},
      ...overrides
    });

    it('mobile edits scene 1, desktop edits scene 2 - auto merge', async () => {
      const base = createBook({
        chapters: [
          {
            id: 'ch1',
            title: 'Chapter 1',
            scenes: [
              { id: 's1', title: 'Scene 1', content: 'Original 1' },
              { id: 's2', title: 'Scene 2', content: 'Original 2' }
            ]
          }
        ]
      });

      const local = createBook({
        chapters: [
          {
            id: 'ch1',
            title: 'Chapter 1',
            scenes: [
              { id: 's1', title: 'Scene 1', content: 'Original 1' },
              { id: 's2', title: 'Scene 2', content: 'Desktop edited' }
            ]
          }
        ]
      });

      const remote = createBook({
        chapters: [
          {
            id: 'ch1',
            title: 'Chapter 1',
            scenes: [
              { id: 's1', title: 'Scene 1', content: 'Mobile edited' },
              { id: 's2', title: 'Scene 2', content: 'Original 2' }
            ]
          }
        ]
      });

      const result = await service.mergeContent(base, remote, local);

      expect(result.hasConflicts).toBe(false);
      expect(result.content.chapters[0].scenes[0].content).toBe(
        'Mobile edited'
      );
      expect(result.content.chapters[0].scenes[1].content).toBe(
        'Desktop edited'
      );
    });

    it('mobile adds character, desktop adds location - auto merge', async () => {
      const base = createBook({
        characters: [],
        locations: []
      });

      const local = createBook({
        characters: [],
        locations: [{ id: 'l1', name: 'Desktop Location', description: '' }]
      });

      const remote = createBook({
        characters: [{ id: 'c1', name: 'Mobile Character', description: '' }],
        locations: []
      });

      const result = await service.mergeContent(base, remote, local);

      expect(result.hasConflicts).toBe(false);
      expect(result.content.characters.length).toBe(1);
      expect(result.content.characters[0].name).toBe('Mobile Character');
      expect(result.content.locations.length).toBe(1);
      expect(result.content.locations[0].name).toBe('Desktop Location');
    });

    it('both edit same scene - conflict detected', async () => {
      const base = createBook({
        chapters: [
          {
            id: 'ch1',
            title: 'Chapter 1',
            scenes: [{ id: 's1', title: 'Scene 1', content: 'Original' }]
          }
        ]
      });

      const local = createBook({
        chapters: [
          {
            id: 'ch1',
            title: 'Chapter 1',
            scenes: [{ id: 's1', title: 'Scene 1', content: 'Desktop edit' }]
          }
        ]
      });

      const remote = createBook({
        chapters: [
          {
            id: 'ch1',
            title: 'Chapter 1',
            scenes: [{ id: 's1', title: 'Scene 1', content: 'Mobile edit' }]
          }
        ]
      });

      const result = await service.mergeContent(base, remote, local);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });
  });
});
