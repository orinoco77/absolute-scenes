/**
 * Text Merge Service
 * Provides 3-way text merging using diff-match-patch
 * Handles collaborative editing at the character level rather than object level
 */

import DiffMatchPatch from 'diff-match-patch';

export class TextMergeService {
  constructor() {
    this.dmp = new DiffMatchPatch();
    // Configure for text merging (not patch application)
    this.dmp.Diff_Timeout = 1.0; // 1 second max for diff computation
    this.dmp.Diff_EditCost = 4; // Cost of an empty edit operation
  }

  /**
   * Perform a 3-way merge on text content
   * @param {string} base - Original text (common ancestor)
   * @param {string} remote - Text from remote/GitHub
   * @param {string} local - Text from local edits
   * @returns {Object} - { merged: string, hasConflict: boolean, conflictRegions: Array }
   */
  mergeText(base, remote, local) {
    // Normalize inputs
    base = base || '';
    remote = remote || '';
    local = local || '';

    // Fast path: if all identical, no merge needed
    if (remote === local) {
      return {
        merged: local,
        hasConflict: false,
        conflictRegions: []
      };
    }

    // Fast path: if remote unchanged, use local
    if (base === remote) {
      return {
        merged: local,
        hasConflict: false,
        conflictRegions: []
      };
    }

    // Fast path: if local unchanged, use remote
    if (base === local) {
      return {
        merged: remote,
        hasConflict: false,
        conflictRegions: []
      };
    }

    // Compute diffs
    const baseToRemote = this.dmp.diff_main(base, remote);
    const baseToLocal = this.dmp.diff_main(base, local);

    // Clean up diffs for better merging
    this.dmp.diff_cleanupSemantic(baseToRemote);
    this.dmp.diff_cleanupSemantic(baseToLocal);

    // Attempt to merge the diffs
    const result = this.attemptMerge(base, baseToRemote, baseToLocal);

    return result;
  }

  /**
   * Attempt to merge two sets of diffs
   * @private
   */
  attemptMerge(base, remoteDiffs, localDiffs) {
    // Convert diffs to patch-like operations
    const remoteOps = this.diffsToOperations(remoteDiffs);
    const localOps = this.diffsToOperations(localDiffs);

    // Check for overlapping operations
    const conflicts = this.findConflicts(remoteOps, localOps);

    if (conflicts.length === 0) {
      // No conflicts - apply both sets of operations
      const merged = this.applyOperations(base, remoteOps, localOps);
      return {
        merged,
        hasConflict: false,
        conflictRegions: []
      };
    }

    // Conflicts exist - create conflict markers
    const merged = this.createConflictMarkers(
      base,
      remoteOps,
      localOps,
      conflicts
    );
    return {
      merged,
      hasConflict: true,
      conflictRegions: conflicts
    };
  }

  /**
   * Convert diff array to operations
   * @private
   */
  diffsToOperations(diffs) {
    const operations = [];
    let position = 0;

    for (const [type, text] of diffs) {
      if (type === DiffMatchPatch.DIFF_EQUAL) {
        position += text.length;
      } else if (type === DiffMatchPatch.DIFF_DELETE) {
        operations.push({
          type: 'delete',
          position,
          length: text.length,
          text: ''
        });
      } else if (type === DiffMatchPatch.DIFF_INSERT) {
        operations.push({
          type: 'insert',
          position,
          length: 0,
          text
        });
      }
    }

    return operations;
  }

  /**
   * Find conflicting operations
   * @private
   */
  findConflicts(remoteOps, localOps) {
    const conflicts = [];

    for (const remoteOp of remoteOps) {
      for (const localOp of localOps) {
        if (this.operationsOverlap(remoteOp, localOp)) {
          conflicts.push({
            remoteOp,
            localOp,
            position: Math.min(remoteOp.position, localOp.position),
            end: Math.max(
              remoteOp.position + remoteOp.length,
              localOp.position + localOp.length
            )
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if two operations overlap
   * @private
   */
  operationsOverlap(op1, op2) {
    const op1Start = op1.position;
    const op1End = op1.position + Math.max(op1.length, op1.text.length);
    const op2Start = op2.position;
    const op2End = op2.position + Math.max(op2.length, op2.text.length);

    return op1Start < op2End && op2Start < op1End;
  }

  /**
   * Apply non-conflicting operations
   * @private
   */
  applyOperations(base, remoteOps, localOps) {
    // Sort all operations by position (descending for safe application)
    const allOps = [
      ...remoteOps.map(op => ({ ...op, source: 'remote' })),
      ...localOps.map(op => ({ ...op, source: 'local' }))
    ].sort((a, b) => b.position - a.position);

    let result = base;

    for (const op of allOps) {
      if (op.type === 'insert') {
        result =
          result.slice(0, op.position) + op.text + result.slice(op.position);
      } else if (op.type === 'delete') {
        result =
          result.slice(0, op.position) + result.slice(op.position + op.length);
      }
    }

    return result;
  }

  /**
   * Create conflict markers for manual resolution
   * @private
   */
  createConflictMarkers(base, remoteOps, localOps, conflicts) {
    // Sort conflicts by position
    const sortedConflicts = conflicts.sort((a, b) => a.position - b.position);

    let result = base;
    let offset = 0;

    for (const conflict of sortedConflicts) {
      const pos = conflict.position + offset;
      const end = conflict.end + offset;

      const remoteText = this.extractTextFromOps(result, remoteOps, conflict);
      const localText = this.extractTextFromOps(result, localOps, conflict);

      const marker = `<<<<<<< REMOTE\n${remoteText}=======\n${localText}>>>>>>> LOCAL\n`;

      result = result.slice(0, pos) + marker + result.slice(end);
      offset += marker.length - (end - pos);
    }

    return result;
  }

  /**
   * Extract text affected by operations in a conflict region
   * @private
   */
  extractTextFromOps(base, operations, conflict) {
    // Simplified extraction - in practice, apply just these ops to the region
    return base.slice(conflict.position, conflict.end);
  }
}

export default TextMergeService;
