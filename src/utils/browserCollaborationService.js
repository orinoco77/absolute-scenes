/**
 * Browser-compatible collaboration service for book writing
 * Provides safe, conflict-aware synchronization without Node.js dependencies
 */

export class BrowserCollaborationService {
  constructor() {
    this.conflicts = [];
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
   * @param {Object} baseContent - Common ancestor content (or remote for 2-way merge)
   * @param {Object} localContent - Local changes
   * @param {Object} remoteContent - Remote changes
   * @returns {Promise<Object>} - Merge result with conflicts if any
   */
  async mergeContent(baseContent, localContent, remoteContent) {
    const conflicts = [];
    const merged = JSON.parse(JSON.stringify(baseContent)); // Deep clone

    // Merge simple string fields
    this.mergeSimpleField(
      'title',
      localContent,
      remoteContent,
      merged,
      conflicts
    );
    this.mergeSimpleField(
      'author',
      localContent,
      remoteContent,
      merged,
      conflicts
    );

    // Merge array fields with IDs (scenes, characters, chapters, etc.)
    this.mergeArrayWithIds(
      'scenes',
      localContent,
      remoteContent,
      merged,
      conflicts
    );
    this.mergeArrayWithIds(
      'characters',
      localContent,
      remoteContent,
      merged,
      conflicts
    );
    this.mergeArrayWithIds(
      'chapters',
      localContent,
      remoteContent,
      merged,
      conflicts
    );
    this.mergeArrayWithIds(
      'parts',
      localContent,
      remoteContent,
      merged,
      conflicts
    );
    this.mergeArrayWithIds(
      'locations',
      localContent,
      remoteContent,
      merged,
      conflicts
    );
    this.mergeArrayWithIds(
      'backgroundFolders',
      localContent,
      remoteContent,
      merged,
      conflicts
    );
    this.mergeArrayWithIds(
      'frontMatter',
      localContent,
      remoteContent,
      merged,
      conflicts
    );

    // Merge simple arrays (like blacklists)
    this.mergeSimpleArray(
      'characterDetectionBlacklist',
      localContent,
      remoteContent,
      merged,
      conflicts
    );

    // Merge complex nested objects
    this.mergeObject(
      'template',
      localContent,
      remoteContent,
      merged,
      conflicts
    );
    this.mergeObject('github', localContent, remoteContent, merged, conflicts);
    this.mergeObject(
      'metadata',
      localContent,
      remoteContent,
      merged,
      conflicts
    );
    this.mergeObject(
      'collaboration',
      localContent,
      remoteContent,
      merged,
      conflicts
    );

    // Handle any remaining fields not explicitly handled above
    this.mergeRemainingFields(localContent, remoteContent, merged, conflicts);

    return {
      content: merged,
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }

  mergeSimpleField(fieldName, localContent, remoteContent, merged, conflicts) {
    const localValue = localContent[fieldName];
    const remoteValue = remoteContent[fieldName];

    if (localValue !== remoteValue) {
      if (localValue && remoteValue) {
        // Both have values that differ - conflict
        conflicts.push({
          type: fieldName,
          localContent: localValue,
          remoteContent: remoteValue
        });
        // Default to local value
        merged[fieldName] = localValue;
      } else {
        // One is empty/null - use the non-empty one
        merged[fieldName] = localValue || remoteValue;
      }
    } else {
      // Same value or both empty - use either
      merged[fieldName] = localValue || remoteValue;
    }
  }

  mergeArrayWithIds(fieldName, localContent, remoteContent, merged, conflicts) {
    const localArray = localContent[fieldName] || [];
    const remoteArray = remoteContent[fieldName] || [];

    // Create a map of all unique IDs
    const allIds = new Set([
      ...localArray.map(item => item.id),
      ...remoteArray.map(item => item.id)
    ]);

    merged[fieldName] = [];

    for (const id of allIds) {
      const localItem = localArray.find(item => item.id === id);
      const remoteItem = remoteArray.find(item => item.id === id);

      if (localItem && remoteItem) {
        // Both have the item - check for conflicts
        const itemConflicts = this.compareObjects(
          localItem,
          remoteItem,
          `${fieldName}_${id}`
        );
        if (itemConflicts.length > 0) {
          conflicts.push(...itemConflicts);
          // Use local version as default
          merged[fieldName].push({ ...localItem });
        } else {
          // Same content - use either
          merged[fieldName].push({ ...localItem });
        }
      } else if (localItem) {
        // Only local has it - keep local
        merged[fieldName].push({ ...localItem });
      } else if (remoteItem) {
        // Only remote has it - keep remote
        merged[fieldName].push({ ...remoteItem });
      }
    }
  }

  mergeSimpleArray(fieldName, localContent, remoteContent, merged, conflicts) {
    const localArray = localContent[fieldName] || [];
    const remoteArray = remoteContent[fieldName] || [];

    // For simple arrays, merge as sets (union)
    const mergedSet = new Set([...localArray, ...remoteArray]);
    merged[fieldName] = Array.from(mergedSet);

    // Check if there are any conflicts (items in one but not the other)
    const localSet = new Set(localArray);
    const remoteSet = new Set(remoteArray);
    const localOnly = localArray.filter(item => !remoteSet.has(item));
    const remoteOnly = remoteArray.filter(item => !localSet.has(item));

    if (localOnly.length > 0 || remoteOnly.length > 0) {
      conflicts.push({
        type: `${fieldName}_array`,
        localContent: localArray,
        remoteContent: remoteArray,
        localOnly,
        remoteOnly
      });
    }
  }

  mergeObject(fieldName, localContent, remoteContent, merged, conflicts) {
    const localObj = localContent[fieldName] || {};
    const remoteObj = remoteContent[fieldName] || {};

    // Start with remote object as base
    merged[fieldName] = JSON.parse(JSON.stringify(remoteObj));

    // Compare all fields from both objects
    const allKeys = new Set([
      ...Object.keys(localObj),
      ...Object.keys(remoteObj)
    ]);

    for (const key of allKeys) {
      const localValue = localObj[key];
      const remoteValue = remoteObj[key];

      if (
        typeof localValue === 'object' &&
        typeof remoteValue === 'object' &&
        localValue !== null &&
        remoteValue !== null
      ) {
        // Both are objects - recursive merge
        const subConflicts = this.compareObjects(
          localValue,
          remoteValue,
          `${fieldName}.${key}`
        );
        if (subConflicts.length > 0) {
          conflicts.push(...subConflicts);
          // Use local value as default
          merged[fieldName][key] = localValue;
        } else {
          // No conflicts - use local value (prefer local changes)
          merged[fieldName][key] = localValue;
        }
      } else if (localValue !== remoteValue) {
        if (localValue !== undefined && remoteValue !== undefined) {
          // Both have different values - conflict
          conflicts.push({
            type: `${fieldName}.${key}`,
            localContent: localValue,
            remoteContent: remoteValue
          });
          // Default to local value
          merged[fieldName][key] = localValue;
        } else {
          // One is undefined - use the defined one
          merged[fieldName][key] =
            localValue !== undefined ? localValue : remoteValue;
        }
      } else {
        // Same value - use either
        merged[fieldName][key] =
          localValue !== undefined ? localValue : remoteValue;
      }
    }
  }

  compareObjects(localObj, remoteObj, prefix) {
    const conflicts = [];
    const allKeys = new Set([
      ...Object.keys(localObj),
      ...Object.keys(remoteObj)
    ]);

    for (const key of allKeys) {
      const localValue = localObj[key];
      const remoteValue = remoteObj[key];

      if (
        typeof localValue === 'object' &&
        typeof remoteValue === 'object' &&
        localValue !== null &&
        remoteValue !== null
      ) {
        // Recursive comparison for nested objects
        const subConflicts = this.compareObjects(
          localValue,
          remoteValue,
          `${prefix}.${key}`
        );
        conflicts.push(...subConflicts);
      } else if (localValue !== remoteValue) {
        if (localValue !== undefined && remoteValue !== undefined) {
          conflicts.push({
            type: `${prefix}.${key}`,
            localContent: localValue,
            remoteContent: remoteValue
          });
        }
      }
    }

    return conflicts;
  }

  mergeRemainingFields(localContent, remoteContent, merged, conflicts) {
    const handledFields = new Set([
      'title',
      'author',
      'scenes',
      'characters',
      'chapters',
      'parts',
      'locations',
      'backgroundFolders',
      'frontMatter',
      'characterDetectionBlacklist',
      'template',
      'github',
      'metadata',
      'collaboration'
    ]);

    const allKeys = new Set([
      ...Object.keys(localContent),
      ...Object.keys(remoteContent)
    ]);

    for (const key of allKeys) {
      if (!handledFields.has(key)) {
        // Handle unknown fields with simple merge
        this.mergeSimpleField(
          key,
          localContent,
          remoteContent,
          merged,
          conflicts
        );
      }
    }
  }

  /**
   * Apply user resolutions to conflicts
   * @param {Array} resolutions - Array of conflict resolutions
   * @param {Object} baseContent - Base content to apply resolutions to
   * @param {Array} conflicts - Original conflicts array
   * @returns {Object} - Merged content with resolutions applied
   */
  applyResolutions(resolutions, baseContent, conflicts) {
    const result = JSON.parse(JSON.stringify(baseContent)); // Deep clone

    resolutions.forEach(resolution => {
      const conflict = conflicts[resolution.conflictIndex];

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
   * Create a simple commit-like record for tracking changes
   * @param {Object} bookData - The book data to "commit"
   * @param {string} message - Commit message
   * @returns {Promise<string>} - Commit hash (timestamp-based for browser)
   */
  async createCommit(_bookData, _message) {
    // In browser, we can't use real git, so create a simple timestamp-based hash
    const timestamp = Date.now();
    const hash = `browser-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, you might store this in localStorage or IndexedDB
    // For now, just return the hash
    return hash;
  }

  /**
   * Initialize repository (no-op in browser, but kept for API compatibility)
   * @returns {Promise<void>}
   */
  async initializeRepository() {
    // No-op in browser - no real git repository needed
    return Promise.resolve();
  }
}
