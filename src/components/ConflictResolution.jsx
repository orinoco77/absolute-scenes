/**
 * ConflictResolution Component
 * User-friendly interface for resolving collaboration conflicts
 */

import { useState, useCallback } from 'react';
import TextEditor from './TextEditor';

export const ConflictResolution = ({ conflicts, onResolve, onCancel }) => {
  const [resolutions, setResolutions] = useState({});

  const handleResolutionChange = useCallback(
    (conflictIndex, resolution, content) => {
      setResolutions(prev => ({
        ...prev,
        [conflictIndex]: {
          resolution,
          resolvedContent: content
        }
      }));
    },
    []
  );

  const handleManualEdit = useCallback(
    (conflictIndex, content) => {
      handleResolutionChange(conflictIndex, 'manual', content);
    },
    [handleResolutionChange]
  );

  const handleResolveAll = useCallback(() => {
    if (!conflicts) return;
    const canResolve = conflicts.every((_, index) => resolutions[index]);
    if (!canResolve) return;

    const resolutionArray = conflicts.map((_, index) => ({
      conflictIndex: index,
      resolution: resolutions[index].resolution,
      resolvedContent: resolutions[index].resolvedContent
    }));

    onResolve(resolutionArray);
  }, [conflicts, resolutions, onResolve]);

  // Format conflict content for display
  const formatContent = useCallback(content => {
    if (content === null || content === undefined) {
      return '(deleted)';
    }
    if (typeof content === 'string') {
      return content || '(empty)';
    }
    if (typeof content === 'object') {
      return JSON.stringify(content, null, 2);
    }
    return String(content);
  }, []);

  // Get a user-friendly conflict title
  const getConflictTitle = useCallback(conflict => {
    if (conflict.type === 'scene_content') return 'Scene Content Conflict';
    if (conflict.type === 'title') return 'Book Title Conflict';
    if (conflict.type === 'character')
      return `Character ${conflict.field} Conflict`;
    if (conflict.type.endsWith('_deleted')) {
      const itemType = conflict.type.replace('_deleted', '');
      return `${itemType} Item Deleted`;
    }
    if (conflict.type.includes('.')) {
      return `${conflict.type} Conflict`;
    }
    // Capitalize first letter and add spaces before capitals
    const formatted = conflict.type
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
    return `${formatted} Conflict`;
  }, []);

  // Don't render if no conflicts
  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  const canResolve = conflicts.every((_, index) => resolutions[index]);

  const renderConflict = (conflict, index) => {
    const currentResolution = resolutions[index];
    const isTextConflict =
      typeof conflict.localContent === 'string' &&
      typeof conflict.remoteContent === 'string';

    return (
      <div
        key={index}
        className="conflict-item"
        style={{
          marginBottom: '20px',
          padding: '15px',
          border: '1px solid var(--color-border)',
          borderRadius: '5px'
        }}
      >
        <h4>{getConflictTitle(conflict)}</h4>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <h5>Local Version:</h5>
            <div
              style={{
                padding: '10px',
                backgroundColor: 'var(--color-info-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '3px',
                whiteSpace: 'pre-wrap',
                fontFamily: isTextConflict ? 'inherit' : 'monospace, monospace',
                fontSize: isTextConflict ? 'inherit' : '12px',
                maxHeight: '200px',
                overflow: 'auto'
              }}
            >
              {formatContent(conflict.localContent)}
            </div>
            <button
              onClick={() =>
                handleResolutionChange(index, 'local', conflict.localContent)
              }
              style={{
                marginTop: '5px',
                padding: '5px 10px',
                backgroundColor:
                  currentResolution?.resolution === 'local'
                    ? 'var(--color-primary)'
                    : 'var(--color-surface-alt)',
                color:
                  currentResolution?.resolution === 'local' ? 'white' : 'black',
                border: '1px solid var(--color-border)',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Use Local
            </button>
          </div>

          <div style={{ flex: 1 }}>
            <h5>Remote Version:</h5>
            <div
              style={{
                padding: '10px',
                backgroundColor: 'var(--color-error-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '3px',
                whiteSpace: 'pre-wrap',
                fontFamily: isTextConflict ? 'inherit' : 'monospace, monospace',
                fontSize: isTextConflict ? 'inherit' : '12px',
                maxHeight: '200px',
                overflow: 'auto'
              }}
            >
              {formatContent(conflict.remoteContent)}
            </div>
            <button
              onClick={() =>
                handleResolutionChange(index, 'remote', conflict.remoteContent)
              }
              style={{
                marginTop: '5px',
                padding: '5px 10px',
                backgroundColor:
                  currentResolution?.resolution === 'remote'
                    ? 'var(--color-primary)'
                    : 'var(--color-surface-alt)',
                color:
                  currentResolution?.resolution === 'remote'
                    ? 'white'
                    : 'black',
                border: '1px solid var(--color-border)',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Use Remote
            </button>
          </div>
        </div>

        <div>
          <button
            onClick={() => {
              const defaultContent =
                currentResolution?.resolvedContent || conflict.localContent;
              // For manual editing, convert objects to formatted JSON strings
              const editableContent =
                typeof defaultContent === 'object'
                  ? JSON.stringify(defaultContent, null, 2)
                  : defaultContent;
              handleResolutionChange(index, 'manual', editableContent);
            }}
            style={{
              padding: '5px 10px',
              backgroundColor:
                currentResolution?.resolution === 'manual'
                  ? 'var(--color-primary)'
                  : 'var(--color-surface-alt)',
              color:
                currentResolution?.resolution === 'manual' ? 'white' : 'black',
              border: '1px solid var(--color-border)',
              borderRadius: '3px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            Manual Edit
          </button>

          {currentResolution?.resolution === 'manual' && (
            <TextEditor
              value={
                typeof currentResolution.resolvedContent === 'string'
                  ? currentResolution.resolvedContent
                  : JSON.stringify(currentResolution.resolvedContent, null, 2)
              }
              onChange={e => {
                // Try to parse JSON if it looks like JSON, otherwise keep as string
                let value = e.target.value;
                if (
                  value.trim().startsWith('{') ||
                  value.trim().startsWith('[')
                ) {
                  try {
                    value = JSON.parse(value);
                  } catch {
                    // Keep as string if invalid JSON
                  }
                }
                handleManualEdit(index, value);
              }}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '10px',
                border: '1px solid var(--color-border)',
                borderRadius: '3px',
                fontFamily: 'monospace, monospace',
                fontSize: '12px'
              }}
              spellCheck={false}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="conflict-resolution-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          padding: '20px',
          borderRadius: '10px',
          maxWidth: '80%',
          maxHeight: '80%',
          overflow: 'auto',
          minWidth: '600px'
        }}
      >
        <h2>Collaboration Conflicts Detected</h2>
        <p>
          {conflicts.length} conflicts need to be resolved before the sync can
          continue. Please choose how to resolve each conflict below.
        </p>

        {conflicts.map(renderConflict)}

        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end'
          }}
        >
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleResolveAll}
            disabled={!canResolve}
            className={`btn ${canResolve ? 'btn-success' : 'btn'}`}
          >
            Resolve All Conflicts
          </button>
        </div>
      </div>
    </div>
  );
};
