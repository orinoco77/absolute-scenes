/**
 * ConflictResolution Component
 * User-friendly interface for resolving collaboration conflicts
 */

import { useState, useCallback } from 'react';

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

  // Don't render if no conflicts
  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  const canResolve = conflicts.every((_, index) => resolutions[index]);

  const renderConflict = (conflict, index) => {
    const currentResolution = resolutions[index];

    return (
      <div
        key={index}
        className="conflict-item"
        style={{
          marginBottom: '20px',
          padding: '15px',
          border: '1px solid #ddd',
          borderRadius: '5px'
        }}
      >
        <h4>
          {conflict.type === 'scene_content' && 'Scene Content Conflict'}
          {conflict.type === 'title' && 'Book Title Conflict'}
          {conflict.type === 'character' &&
            `Character ${conflict.field} Conflict`}
        </h4>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <h5>Local Version:</h5>
            <div
              style={{
                padding: '10px',
                backgroundColor: '#f0f8ff',
                border: '1px solid #ccc',
                borderRadius: '3px'
              }}
            >
              {conflict.localContent}
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
                    ? '#007bff'
                    : '#f8f9fa',
                color:
                  currentResolution?.resolution === 'local' ? 'white' : 'black',
                border: '1px solid #ccc',
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
                backgroundColor: '#fff0f0',
                border: '1px solid #ccc',
                borderRadius: '3px'
              }}
            >
              {conflict.remoteContent}
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
                    ? '#007bff'
                    : '#f8f9fa',
                color:
                  currentResolution?.resolution === 'remote'
                    ? 'white'
                    : 'black',
                border: '1px solid #ccc',
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
              handleResolutionChange(index, 'manual', defaultContent);
            }}
            style={{
              padding: '5px 10px',
              backgroundColor:
                currentResolution?.resolution === 'manual'
                  ? '#007bff'
                  : '#f8f9fa',
              color:
                currentResolution?.resolution === 'manual' ? 'white' : 'black',
              border: '1px solid #ccc',
              borderRadius: '3px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            Manual Edit
          </button>

          {currentResolution?.resolution === 'manual' && (
            <textarea
              value={currentResolution.resolvedContent}
              onChange={e => handleManualEdit(index, e.target.value)}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '3px',
                fontFamily: 'monospace'
              }}
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
          backgroundColor: 'white',
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
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleResolveAll}
            disabled={!canResolve}
            style={{
              padding: '10px 20px',
              backgroundColor: canResolve ? '#28a745' : '#e9ecef',
              color: canResolve ? 'white' : '#6c757d',
              border: 'none',
              borderRadius: '5px',
              cursor: canResolve ? 'pointer' : 'not-allowed'
            }}
          >
            Resolve All Conflicts
          </button>
        </div>
      </div>
    </div>
  );
};
