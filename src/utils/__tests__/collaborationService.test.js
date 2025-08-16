/**
 * Test suite for git-based collaboration utilities
 * Following TDD approach - tests first, then implementation
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { CollaborationService } from '../collaborationService';

// Mock temporary directory for git operations
let tempDir;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'collab-test-'));
});

afterEach(() => {
  if (tempDir && fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('CollaborationService - Git Operations', () => {
  describe('initializeRepository', () => {
    test('should initialize a new git repository', async () => {
      const service = new CollaborationService(tempDir);
      await service.initializeRepository();

      // Should create .git directory
      expect(fs.existsSync(path.join(tempDir, '.git'))).toBe(true);
    });
  });

  describe('createCommit', () => {
    test('should create a commit with book content', async () => {
      const service = new CollaborationService(tempDir);
      await service.initializeRepository();

      const bookData = {
        title: 'Test Book',
        scenes: [{ id: '1', title: 'Scene 1', content: 'Test content' }]
      };

      const commitHash = await service.createCommit(bookData, 'Initial commit');

      expect(commitHash).toBeDefined();
      expect(commitHash).toMatch(/^[a-f0-9]{40}$/); // SHA-1 hash format
    });
  });
});

describe('CollaborationService - Conflict Detection', () => {
  describe('detectConflicts', () => {
    test('should detect no conflicts when content is identical', async () => {
      const service = new CollaborationService(tempDir);
      const local = { scenes: [{ id: '1', content: 'same content' }] };
      const remote = { scenes: [{ id: '1', content: 'same content' }] };

      const conflicts = await service.detectConflicts(local, remote);

      expect(conflicts).toEqual([]);
    });

    test('should detect scene content conflicts', async () => {
      const service = new CollaborationService(tempDir);
      const local = { scenes: [{ id: '1', content: 'local content' }] };
      const remote = { scenes: [{ id: '1', content: 'remote content' }] };

      const conflicts = await service.detectConflicts(local, remote);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toMatchObject({
        type: 'scene_content',
        sceneId: '1',
        localContent: 'local content',
        remoteContent: 'remote content'
      });
    });

    test('should detect multiple scene conflicts', async () => {
      const service = new CollaborationService(tempDir);
      const local = {
        scenes: [
          { id: '1', content: 'local content 1' },
          { id: '2', content: 'local content 2' }
        ]
      };
      const remote = {
        scenes: [
          { id: '1', content: 'remote content 1' },
          { id: '2', content: 'remote content 2' }
        ]
      };

      const conflicts = await service.detectConflicts(local, remote);

      expect(conflicts).toHaveLength(2);
      expect(conflicts[0].sceneId).toBe('1');
      expect(conflicts[1].sceneId).toBe('2');
    });

    test('should detect title conflicts', async () => {
      const service = new CollaborationService(tempDir);
      const local = { title: 'Local Title' };
      const remote = { title: 'Remote Title' };

      const conflicts = await service.detectConflicts(local, remote);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toMatchObject({
        type: 'title',
        localContent: 'Local Title',
        remoteContent: 'Remote Title'
      });
    });

    test('should detect character conflicts', async () => {
      const service = new CollaborationService(tempDir);
      const local = {
        characters: [{ id: 'char1', name: 'Local Name', description: 'desc' }]
      };
      const remote = {
        characters: [{ id: 'char1', name: 'Remote Name', description: 'desc' }]
      };

      const conflicts = await service.detectConflicts(local, remote);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toMatchObject({
        type: 'character',
        characterId: 'char1',
        field: 'name',
        localContent: 'Local Name',
        remoteContent: 'Remote Name'
      });
    });

    test('should handle missing scenes gracefully', async () => {
      const service = new CollaborationService(tempDir);
      const local = { scenes: [{ id: '1', content: 'content' }] };
      const remote = { scenes: [] };

      const conflicts = await service.detectConflicts(local, remote);

      expect(conflicts).toEqual([]);
    });
  });
});

describe('CollaborationService - Merge Operations', () => {
  describe('mergeContent', () => {
    test('should merge non-conflicting changes', async () => {
      const service = new CollaborationService(tempDir);
      const base = {
        scenes: [
          { id: '1', content: 'original' },
          { id: '2', content: 'original' }
        ]
      };
      const local = {
        scenes: [
          { id: '1', content: 'local change' },
          { id: '2', content: 'original' }
        ]
      };
      const remote = {
        scenes: [
          { id: '1', content: 'original' },
          { id: '2', content: 'remote change' }
        ]
      };

      const merged = await service.mergeContent(base, local, remote);

      expect(merged.scenes[0].content).toBe('local change');
      expect(merged.scenes[1].content).toBe('remote change');
    });

    test('should identify conflicts for manual resolution', async () => {
      const service = new CollaborationService(tempDir);
      const base = { scenes: [{ id: '1', content: 'original' }] };
      const local = { scenes: [{ id: '1', content: 'local change' }] };
      const remote = { scenes: [{ id: '1', content: 'remote change' }] };

      const result = await service.mergeContent(base, local, remote);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
    });
  });
});
