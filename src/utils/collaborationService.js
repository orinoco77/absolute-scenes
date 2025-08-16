/**
 * Git-based collaboration service for book writing
 * Provides safe, conflict-aware synchronization between authors
 */

import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';

export class CollaborationService {
  constructor(workingDirectory) {
    this.workingDir = workingDirectory;
    this.git = simpleGit(workingDirectory);
  }

  /**
   * Initialize a new git repository in the working directory
   * @returns {Promise<void>}
   */
  async initializeRepository() {
    try {
      await this.git.init();

      // Configure git user if not already set
      try {
        await this.git.addConfig(
          'user.email',
          'collaboration@absolute-scenes.app'
        );
        await this.git.addConfig('user.name', 'Absolute Scenes Collaboration');
      } catch (configError) {
        // Config might already exist, continue
      }
    } catch (error) {
      throw new Error(`Failed to initialize repository: ${error.message}`);
    }
  }

  /**
   * Create a commit with book content
   * @param {Object} bookData - The book data to commit
   * @param {string} message - Commit message
   * @returns {Promise<string>} - Commit hash
   */
  async createCommit(bookData, message) {
    try {
      // Write book data to file
      const bookFilePath = path.join(this.workingDir, 'manuscript.book');
      await fs.promises.writeFile(
        bookFilePath,
        JSON.stringify(bookData, null, 2),
        'utf8'
      );

      // Stage and commit
      await this.git.add('manuscript.book');
      const result = await this.git.commit(message);

      return result.commit;
    } catch (error) {
      throw new Error(`Failed to create commit: ${error.message}`);
    }
  }

  /**
   * Detect conflicts between local and remote content
   * @param {Object} localContent - Local book data
   * @param {Object} remoteContent - Remote book data
   * @returns {Promise<Array>} - Array of conflict objects
   */
  async detectConflicts(localContent, remoteContent) {
    const conflicts = [];

    // Check title conflicts
    if (
      localContent.title &&
      remoteContent.title &&
      localContent.title !== remoteContent.title
    ) {
      conflicts.push({
        type: 'title',
        localContent: localContent.title,
        remoteContent: remoteContent.title
      });
    }

    // Check scene content conflicts
    if (localContent.scenes && remoteContent.scenes) {
      for (const localScene of localContent.scenes) {
        const remoteScene = remoteContent.scenes.find(
          s => s.id === localScene.id
        );

        if (remoteScene && localScene.content !== remoteScene.content) {
          conflicts.push({
            type: 'scene_content',
            sceneId: localScene.id,
            localContent: localScene.content,
            remoteContent: remoteScene.content
          });
        }
      }
    }

    // Check character conflicts
    if (localContent.characters && remoteContent.characters) {
      for (const localChar of localContent.characters) {
        const remoteChar = remoteContent.characters.find(
          c => c.id === localChar.id
        );

        if (remoteChar) {
          // Check each field for conflicts
          ['name', 'description', 'notes'].forEach(field => {
            if (
              localChar[field] &&
              remoteChar[field] &&
              localChar[field] !== remoteChar[field]
            ) {
              conflicts.push({
                type: 'character',
                characterId: localChar.id,
                field,
                localContent: localChar[field],
                remoteContent: remoteChar[field]
              });
            }
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Merge content from local and remote sources
   * @param {Object} baseContent - Common ancestor content
   * @param {Object} localContent - Local changes
   * @param {Object} remoteContent - Remote changes
   * @returns {Promise<Object>} - Merge result with conflicts if any
   */
  async mergeContent(baseContent, localContent, remoteContent) {
    const conflicts = [];
    const merged = JSON.parse(JSON.stringify(baseContent)); // Deep clone

    // Simple 3-way merge for scenes
    if (baseContent.scenes && localContent.scenes && remoteContent.scenes) {
      // Ensure merged has scenes array
      if (!merged.scenes) merged.scenes = [];

      for (
        let i = 0;
        i <
        Math.max(
          baseContent.scenes.length,
          localContent.scenes.length,
          remoteContent.scenes.length
        );
        i++
      ) {
        const baseScene = baseContent.scenes[i];
        const localScene = localContent.scenes[i];
        const remoteScene = remoteContent.scenes[i];

        if (!baseScene || !localScene || !remoteScene) continue;

        const localChanged = localScene.content !== baseScene.content;
        const remoteChanged = remoteScene.content !== baseScene.content;

        if (localChanged && remoteChanged) {
          // Both changed - conflict
          conflicts.push({
            type: 'scene_content',
            sceneId: baseScene.id,
            localContent: localScene.content,
            remoteContent: remoteScene.content
          });
        } else if (localChanged) {
          // Only local changed - use local
          merged.scenes[i] = { ...localScene };
        } else if (remoteChanged) {
          // Only remote changed - use remote
          merged.scenes[i] = { ...remoteScene };
        }
        // If neither changed, keep base (already in merged)
      }
    }

    return {
      ...merged,
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }
}
