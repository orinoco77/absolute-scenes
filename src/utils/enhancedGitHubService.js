/**
 * Enhanced GitHub Service with git-based collaboration
 * Provides conflict-aware synchronization for collaborative book writing
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { CollaborationService } from './collaborationService';
import GitHubServiceInstance from './gitHubService';

export class EnhancedGitHubService {
  constructor() {
    this.gitHubService = GitHubServiceInstance;
    this.collaborationService = null;
    this.conflicts = [];
    this.workingDir = null;
  }

  /**
   * Initialize the collaboration service with a temporary working directory
   */
  async initializeCollaboration() {
    if (!this.workingDir) {
      this.workingDir = fs.mkdtempSync(path.join(os.tmpdir(), 'collab-sync-'));
      this.collaborationService = new CollaborationService(this.workingDir);
      await this.collaborationService.initializeRepository();
    }
  }

  /**
   * Safely sync with repository, detecting and handling conflicts
   * @param {Object} repository - Repository info {owner, repo}
   * @param {Object} bookData - Local book data
   * @param {string} commitMessage - Commit message
   * @returns {Promise<Object>} - Sync result with conflicts if any
   */
  async safeSyncWithRepository(repository, bookData, commitMessage) {
    try {
      await this.initializeCollaboration();

      // Get remote content
      const remoteBookData = await this.getRemoteBookContent(repository);

      if (!remoteBookData) {
        // No remote content, safe to push
        await this.collaborationService.createCommit(bookData, commitMessage);
        const pushResult = await this.pushToRepository(
          repository,
          bookData,
          commitMessage
        );
        return {
          success: pushResult.success,
          conflicts: [],
          error: pushResult.error
        };
      }

      // Get last sync point (base for 3-way merge)
      const baseContent = await this.getLastSyncCommit(repository);

      // Detect conflicts
      const conflicts = await this.collaborationService.detectConflicts(
        bookData,
        remoteBookData
      );

      if (conflicts.length === 0) {
        // No conflicts, perform automatic merge
        const mergeResult = await this.collaborationService.mergeContent(
          baseContent || remoteBookData,
          bookData,
          remoteBookData
        );

        await this.collaborationService.createCommit(
          mergeResult.content,
          commitMessage
        );
        const pushResult = await this.pushToRepository(
          repository,
          mergeResult.content,
          commitMessage
        );

        return {
          success: pushResult.success,
          conflicts: [],
          mergedContent: mergeResult.content,
          error: pushResult.error
        };
      } else {
        // Conflicts detected, require user resolution
        this.conflicts = conflicts;
        return {
          success: false,
          conflicts,
          requiresResolution: true,
          remoteContent: remoteBookData,
          baseContent
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Resolve conflicts and complete the sync
   * @param {Object} repository - Repository info
   * @param {Array} resolutions - Array of conflict resolutions
   * @param {Object} localBookData - Local book data
   * @param {string} commitMessage - Commit message
   * @returns {Promise<Object>} - Sync result
   */
  async resolveConflictsAndSync(
    repository,
    resolutions,
    localBookData,
    commitMessage
  ) {
    try {
      await this.initializeCollaboration();

      const mergedContent = this.applyResolutions(resolutions, localBookData);

      await this.collaborationService.createCommit(
        mergedContent,
        commitMessage
      );
      const pushResult = await this.pushToRepository(
        repository,
        mergedContent,
        commitMessage
      );

      return {
        success: pushResult.success,
        mergedContent,
        error: pushResult.error
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply user resolutions to conflicts
   * @param {Array} resolutions - Array of conflict resolutions
   * @param {Object} baseContent - Base content to apply resolutions to
   * @returns {Object} - Merged content with resolutions applied
   */
  applyResolutions(resolutions, baseContent) {
    const result = JSON.parse(JSON.stringify(baseContent)); // Deep clone

    resolutions.forEach(resolution => {
      const conflict = this.conflicts[resolution.conflictIndex];

      switch (conflict.type) {
        case 'title':
          result.title = resolution.resolvedContent;
          break;
        case 'scene_content':
          if (result.scenes) {
            const scene = result.scenes.find(s => s.id === conflict.sceneId);
            if (scene) {
              scene.content = resolution.resolvedContent;
            }
          }
          break;
        case 'character':
          if (result.characters) {
            const character = result.characters.find(
              c => c.id === conflict.characterId
            );
            if (character) {
              character[conflict.field] = resolution.resolvedContent;
            }
          }
          break;
        default:
          throw new Error(`Unknown conflict type: ${conflict.type}`);
      }
    });

    return result;
  }

  /**
   * Get remote book content from repository
   * @param {Object} repository - Repository info
   * @returns {Promise<Object|null>} - Remote book data or null if not found
   */
  async getRemoteBookContent(repository) {
    try {
      const bookFile =
        await this.gitHubService.checkRepositoryForBookFile(repository);
      if (bookFile) {
        const result = await this.gitHubService.downloadBookFromRepository(
          repository,
          bookFile
        );
        return result.bookData;
      }
      return null;
    } catch (error) {
      throw new Error(`Failed to get remote content: ${error.message}`);
    }
  }

  /**
   * Get the last sync commit content (for 3-way merge base)
   * @param {Object} repository - Repository info
   * @returns {Promise<Object|null>} - Base content for merge
   */
  async getLastSyncCommit(_repository) {
    // For now, return null to use simple 2-way merge
    // In future, we could track last sync commits in metadata
    return null;
  }

  /**
   * Push content to repository
   * @param {Object} repository - Repository info
   * @param {Object} content - Content to push
   * @param {string} commitMessage - Commit message
   * @returns {Promise<Object>} - Push result
   */
  async pushToRepository(repository, content, commitMessage) {
    try {
      await this.gitHubService.saveBookToRepository(
        repository,
        content,
        commitMessage,
        'manuscript.book'
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup temporary working directory
   */
  cleanup() {
    if (this.workingDir && fs.existsSync(this.workingDir)) {
      fs.rmSync(this.workingDir, { recursive: true, force: true });
      this.workingDir = null;
      this.collaborationService = null;
    }
  }
}
