/**
 * Browser-compatible Enhanced GitHub Service with collaboration
 * Provides conflict-aware synchronization for collaborative book writing in the browser
 */

import { BrowserCollaborationService } from './browserCollaborationService';
import GitHubServiceInstance from './gitHubService';

export class BrowserEnhancedGitHubService {
  constructor() {
    this.gitHubService = GitHubServiceInstance;
    this.collaborationService = new BrowserCollaborationService();
    this.conflicts = [];
  }

  /**
   * Safely sync with repository, detecting and handling conflicts
   * @param {Object} repository - Repository info {owner, repo}
   * @param {Object} bookData - Local book data
   * @param {string} commitMessage - Commit message
   * @param {string} currentFilePath - Current local file path for filename generation
   * @returns {Promise<Object>} - Sync result with conflicts if any
   */
  async safeSyncWithRepository(
    repository,
    bookData,
    commitMessage,
    currentFilePath = null
  ) {
    try {
      // Get remote content and determine filename
      const remoteResult =
        await this.getRemoteBookContentWithFilename(repository);
      const remoteBookData = remoteResult.bookData;
      const filename =
        remoteResult.filename ||
        this.generateFilename(bookData, currentFilePath);

      if (!remoteBookData) {
        // No remote content, safe to push
        await this.collaborationService.createCommit(bookData, commitMessage);
        const pushResult = await this.pushToRepository(
          repository,
          bookData,
          commitMessage,
          filename
        );
        return {
          success: pushResult.success,
          conflicts: [],
          error: pushResult.error
        };
      }

      // Detect conflicts
      const conflicts = await this.collaborationService.detectConflicts(
        bookData,
        remoteBookData
      );

      if (conflicts.length === 0) {
        // No conflicts, perform automatic merge
        const mergeResult = await this.collaborationService.mergeContent(
          remoteBookData, // Use remote as base for 2-way merge
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
          commitMessage,
          filename
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
          baseContent: remoteBookData, // Use remote as base for browser
          filename
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
   * @param {string} filename - Filename to use for the book file
   * @returns {Promise<Object>} - Sync result
   */
  async resolveConflictsAndSync(
    repository,
    resolutions,
    localBookData,
    commitMessage,
    filename
  ) {
    try {
      const mergedContent = this.collaborationService.applyResolutions(
        resolutions,
        localBookData,
        this.conflicts
      );

      await this.collaborationService.createCommit(
        mergedContent,
        commitMessage
      );
      const pushResult = await this.pushToRepository(
        repository,
        mergedContent,
        commitMessage,
        filename
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
   * Get remote book content from repository
   * @param {Object} repository - Repository info
   * @returns {Promise<Object|null>} - Remote book data or null if not found
   */
  async getRemoteBookContent(repository) {
    const result = await this.getRemoteBookContentWithFilename(repository);
    return result.bookData;
  }

  /**
   * Get remote book content and filename from repository
   * @param {Object} repository - Repository info
   * @returns {Promise<Object>} - {bookData, filename} or {bookData: null, filename: null}
   */
  async getRemoteBookContentWithFilename(repository) {
    try {
      const bookFile =
        await this.gitHubService.checkRepositoryForBookFile(repository);
      if (bookFile) {
        const result = await this.gitHubService.downloadBookFromRepository(
          repository,
          bookFile
        );
        return {
          bookData: result.bookData,
          filename: bookFile.name
        };
      }
      return { bookData: null, filename: null };
    } catch (error) {
      throw new Error(`Failed to get remote content: ${error.message}`);
    }
  }

  /**
   * Generate filename using the same logic as the original code
   * @param {Object} bookData - Book data for title-based generation
   * @param {string} currentFilePath - Current local file path
   * @returns {string} - Generated filename
   */
  generateFilename(bookData, currentFilePath) {
    let filename = 'manuscript.book'; // Default fallback

    if (currentFilePath) {
      // Extract filename from current local file path
      filename = currentFilePath.split(/[\\/]/).pop();
      if (!filename.endsWith('.book')) {
        filename = filename.replace(/\.(book|json)$/, '') + '.book';
      }
      // Sanitize the filename even when extracted from path
      // Remove URL encoding and special characters that might cause API issues
      filename =
        decodeURIComponent(filename)
          .replace(/\.book$/, '') // Remove extension temporarily
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special chars including apostrophes
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') + '.book';
    } else if (bookData.title?.trim()) {
      // Generate filename from book title
      filename =
        bookData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') + '.book';
    }

    return filename;
  }

  /**
   * Push content to repository
   * @param {Object} repository - Repository info
   * @param {Object} content - Content to push
   * @param {string} commitMessage - Commit message
   * @param {string} filename - Filename to use for the book file
   * @returns {Promise<Object>} - Push result
   */
  async pushToRepository(repository, content, commitMessage, filename) {
    try {
      await this.gitHubService.saveBookToRepository(
        repository,
        content,
        commitMessage,
        filename
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup (no-op in browser, but kept for API compatibility)
   */
  cleanup() {
    // No cleanup needed in browser version
    this.conflicts = [];
  }
}
