/**
 * Test suite for enhanced GitHub service with git-based collaboration
 * Following TDD approach - tests first, then implementation
 */

import { CollaborationService } from '../collaborationService';
import { EnhancedGitHubService } from '../enhancedGitHubService';

// Mock the CollaborationService
jest.mock('../collaborationService');

describe('EnhancedGitHubService', () => {
  let service;
  let mockCollaborationService;
  let mockRepository;
  let mockBookData;

  beforeEach(() => {
    mockRepository = {
      owner: 'testowner',
      repo: 'testrepo'
    };

    mockBookData = {
      title: 'Test Book',
      scenes: [{ id: '1', title: 'Scene 1', content: 'Scene 1 content' }]
    };

    mockCollaborationService = {
      initializeRepository: jest.fn(),
      createCommit: jest.fn(),
      detectConflicts: jest.fn(),
      mergeContent: jest.fn()
    };

    CollaborationService.mockImplementation(() => mockCollaborationService);
    service = new EnhancedGitHubService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('safeSyncWithRepository', () => {
    test('should sync without conflicts when no remote changes exist', async () => {
      // Mock no remote file exists
      service.getRemoteBookContent = jest.fn().mockResolvedValue(null);
      service.pushToRepository = jest.fn().mockResolvedValue({ success: true });

      mockCollaborationService.createCommit.mockResolvedValue('abc123');

      const result = await service.safeSyncWithRepository(
        mockRepository,
        mockBookData,
        'Test sync'
      );

      expect(result.success).toBe(true);
      expect(result.conflicts).toEqual([]);
      expect(mockCollaborationService.createCommit).toHaveBeenCalledWith(
        mockBookData,
        'Test sync'
      );
    });

    test('should detect conflicts when both local and remote have changes', async () => {
      const remoteBookData = {
        title: 'Remote Title',
        scenes: [{ id: '1', title: 'Scene 1', content: 'Remote scene content' }]
      };

      service.getRemoteBookContent = jest
        .fn()
        .mockResolvedValue(remoteBookData);
      service.getLastSyncCommit = jest.fn().mockResolvedValue({
        title: 'Original Title',
        scenes: [{ id: '1', title: 'Scene 1', content: 'Original content' }]
      });

      const mockConflicts = [
        {
          type: 'scene_content',
          sceneId: '1',
          localContent: 'Scene 1 content',
          remoteContent: 'Remote scene content'
        }
      ];

      mockCollaborationService.detectConflicts.mockResolvedValue(mockConflicts);

      const result = await service.safeSyncWithRepository(
        mockRepository,
        mockBookData,
        'Test sync'
      );

      expect(result.success).toBe(false);
      expect(result.conflicts).toEqual(mockConflicts);
      expect(result.requiresResolution).toBe(true);
    });

    test('should handle error conditions gracefully', async () => {
      service.getRemoteBookContent = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));

      const result = await service.safeSyncWithRepository(
        mockRepository,
        mockBookData,
        'Test sync'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('resolveConflictsAndSync', () => {
    test('should apply resolutions and complete sync', async () => {
      const resolutions = [
        {
          conflictIndex: 0,
          resolution: 'local',
          resolvedContent: 'Scene 1 content'
        }
      ];

      const mergedContent = {
        title: 'Test Book',
        scenes: [{ id: '1', title: 'Scene 1', content: 'Scene 1 content' }]
      };

      service.applyResolutions = jest.fn().mockReturnValue(mergedContent);
      service.pushToRepository = jest.fn().mockResolvedValue({ success: true });
      mockCollaborationService.createCommit.mockResolvedValue('def456');

      // Mock initializeCollaboration
      service.initializeCollaboration = jest.fn().mockResolvedValue();
      service.collaborationService = mockCollaborationService;

      const result = await service.resolveConflictsAndSync(
        mockRepository,
        resolutions,
        mockBookData,
        'Sync with conflict resolutions'
      );

      expect(result.success).toBe(true);
      expect(service.applyResolutions).toHaveBeenCalledWith(
        resolutions,
        mockBookData
      );
      expect(mockCollaborationService.createCommit).toHaveBeenCalledWith(
        mergedContent,
        'Sync with conflict resolutions'
      );
    });

    test('should handle resolution errors', async () => {
      const resolutions = [
        {
          conflictIndex: 0,
          resolution: 'invalid',
          resolvedContent: 'content'
        }
      ];

      service.applyResolutions = jest.fn().mockImplementation(() => {
        throw new Error('Invalid resolution type');
      });

      const result = await service.resolveConflictsAndSync(
        mockRepository,
        resolutions,
        mockBookData,
        'Test sync'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid resolution type');
    });
  });

  describe('applyResolutions', () => {
    test('should apply local resolution correctly', () => {
      const resolutions = [
        {
          conflictIndex: 0,
          resolution: 'local',
          resolvedContent: 'Local content'
        }
      ];

      const conflicts = [
        {
          type: 'scene_content',
          sceneId: '1'
        }
      ];

      service.conflicts = conflicts;

      const result = service.applyResolutions(resolutions, mockBookData);

      expect(result.scenes[0].content).toBe('Local content');
    });

    test('should apply manual resolution correctly', () => {
      const resolutions = [
        {
          conflictIndex: 0,
          resolution: 'manual',
          resolvedContent: 'Manually edited content'
        }
      ];

      const conflicts = [
        {
          type: 'title'
        }
      ];

      service.conflicts = conflicts;

      const result = service.applyResolutions(resolutions, mockBookData);

      expect(result.title).toBe('Manually edited content');
    });
  });
});
