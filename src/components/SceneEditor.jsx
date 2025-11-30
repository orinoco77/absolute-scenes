import { useRef, useState, useEffect, useCallback } from 'react';
import DistractionFreeMode from './DistractionFreeMode';
import TextEditor from './TextEditor';

function SceneEditor({
  scene,
  template: _template,
  onSceneUpdate,
  collaboration = null // Optional collaboration settings
}) {
  const textareaRef = useRef(null);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [localContent, setLocalContent] = useState(scene?.content || '');
  const contentUpdateTimerRef = useRef(null);
  const lastSentContentRef = useRef(scene?.content || '');
  const lastSentTimeRef = useRef(0);

  // Sync local content when scene ID changes (switching scenes)
  useEffect(() => {
    if (scene?.id) {
      setLocalContent(scene?.content || '');
      lastSentContentRef.current = scene?.content || '';
      lastSentTimeRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.id]); // Intentionally only watching scene ID, not content

  // Handle external content updates (like GitHub sync)
  // Only update if it's truly external, not just echoing our own changes
  useEffect(() => {
    const sceneContent = scene?.content || '';

    // Don't update if user is actively typing
    if (contentUpdateTimerRef.current) {
      return;
    }

    // If content hasn't changed, nothing to do
    if (sceneContent === localContent) {
      return;
    }

    // Check if this might be an auto-save echo:
    // If we sent an update recently (within 5 seconds) and the incoming content
    // matches what we sent, it's probably just an echo from auto-save
    const timeSinceLastSent = Date.now() - lastSentTimeRef.current;
    const isLikelyEcho =
      timeSinceLastSent < 5000 && sceneContent === lastSentContentRef.current;

    if (!isLikelyEcho) {
      // This is a true external update (e.g., from GitHub sync)
      // or enough time has passed that we should accept it
      setLocalContent(sceneContent);
      lastSentContentRef.current = sceneContent;
    }
  }, [scene?.content, localContent]);

  // Helper function to enter distraction-free mode
  const enterDistractionFree = () => {
    setIsDistractionFree(true);

    // Hide the menu when entering distraction-free mode
    try {
      // Since nodeIntegration is true, we can access electron directly
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('distraction-free-entered');
    } catch (error) {
      // In browser environment, electron APIs won't be available
      console.warn('Could not hide menu: electron APIs not available');
    }

    // Try to enter fullscreen mode (this might fail or be rejected by user)
    // Note: We rely on our own IPC for menu control, not fullscreen events
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen request failed, but we're still in distraction-free mode
        // Menu is handled by our IPC call above
      });
    }
  };

  // Handle F11 for distraction-free mode with fullscreen
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'F11') {
        e.preventDefault();
        enterDistractionFree();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle exiting distraction-free mode
  const handleCloseDistractionFree = () => {
    setIsDistractionFree(false);

    // Always restore the menu when exiting distraction-free mode
    try {
      // Since nodeIntegration is true, we can access electron directly
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('distraction-free-exited');
    } catch (error) {
      // In browser environment, electron APIs won't be available
      console.warn('Could not restore menu: electron APIs not available');
    }

    // If we're in fullscreen mode, also exit it
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  // Debounced content update (must be before early return)
  const handleContentChange = useCallback(
    e => {
      const newContent = e.target.value;
      setLocalContent(newContent); // Update local state immediately for responsive typing

      // Clear any existing timer
      if (contentUpdateTimerRef.current) {
        clearTimeout(contentUpdateTimerRef.current);
      }

      // Debounce the actual book state update
      contentUpdateTimerRef.current = setTimeout(() => {
        onSceneUpdate(scene.id, { content: newContent });
        lastSentContentRef.current = newContent; // Track what we sent
        lastSentTimeRef.current = Date.now(); // Track when we sent it
      }, 300); // Update book state 300ms after user stops typing
    },
    [scene?.id, onSceneUpdate]
  );

  // Cleanup timer on unmount (must be before early return)
  useEffect(() => {
    return () => {
      if (contentUpdateTimerRef.current) {
        clearTimeout(contentUpdateTimerRef.current);
      }
    };
  }, []);

  if (!scene) {
    return (
      <div className="scene-editor">
        <div className="no-scene">
          Select a scene to start writing, or create a new one.
        </div>
      </div>
    );
  }

  const handleTitleChange = e => {
    onSceneUpdate(scene.id, { title: e.target.value });
  };

  const handleKeyDown = e => {
    // Handle Shift+Enter for forced line breaks
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      const textEditor = textareaRef.current;
      const start = textEditor.selectionStart;
      const end = textEditor.selectionEnd;

      // Insert a forced line break that will be visible and preserved in export
      const newContent =
        textEditor.value.substring(0, start) +
        '\n<!--FORCED_BREAK-->\n' + // Special marker for forced breaks
        textEditor.value.substring(end);

      setLocalContent(newContent); // Update local state
      onSceneUpdate(scene.id, { content: newContent });
      lastSentContentRef.current = newContent; // Track what we sent
      lastSentTimeRef.current = Date.now(); // Track when we sent it

      // Move cursor after the marker
      setTimeout(() => {
        textEditor.focus();
        textEditor.setSelectionRange(start + 21, start + 21); // After the full marker
      }, 0);
    }
  };

  const handleNotesChange = e => {
    onSceneUpdate(scene.id, { notes: e.target.value });
  };

  const handleAssignedAuthorChange = e => {
    const assignedAuthor = e.target.value || null;
    onSceneUpdate(scene.id, { assignedAuthor });
  };

  // Collaboration data available for scene assignment

  // Text formatting functions for TextEditor
  const insertMarkdown = (before, after = '') => {
    const textEditor = textareaRef.current;
    if (textEditor) {
      const start = textEditor.selectionStart;
      const end = textEditor.selectionEnd;
      const selectedText = textEditor.value.substring(start, end);
      const replacement = before + (selectedText || 'text') + after;

      const newContent =
        textEditor.value.substring(0, start) +
        replacement +
        textEditor.value.substring(end);
      setLocalContent(newContent); // Update local state
      onSceneUpdate(scene.id, { content: newContent });
      lastSentContentRef.current = newContent; // Track what we sent
      lastSentTimeRef.current = Date.now(); // Track when we sent it

      // Restore cursor position
      setTimeout(() => {
        textEditor.focus();
        textEditor.setSelectionRange(
          start + before.length,
          start + before.length + (selectedText || 'text').length
        );
      }, 0);
    }
  };

  const makeBold = () => insertMarkdown('**', '**');
  const makeItalic = () => insertMarkdown('*', '*');
  const makeHeading = () => insertMarkdown('## ', '');
  const insertLineBreak = () => insertMarkdown('\n\n', '');
  const insertForcedLineBreak = () => {
    const textEditor = textareaRef.current;
    if (textEditor) {
      const start = textEditor.selectionStart;
      const end = textEditor.selectionEnd;

      const newContent =
        textEditor.value.substring(0, start) +
        '\n<!--FORCED_BREAK-->\n' +
        textEditor.value.substring(end);

      setLocalContent(newContent); // Update local state
      onSceneUpdate(scene.id, { content: newContent });
      lastSentContentRef.current = newContent; // Track what we sent
      lastSentTimeRef.current = Date.now(); // Track when we sent it

      setTimeout(() => {
        textEditor.focus();
        textEditor.setSelectionRange(start + 21, start + 21); // After the full marker
      }, 0);
    }
  };

  return (
    <div className="scene-editor">
      <div className="scene-header">
        <input
          type="text"
          value={scene.title}
          onChange={handleTitleChange}
          className="scene-title-input"
          placeholder="Scene Title"
        />
        <div className="scene-meta">
          {/* Collaboration assignment - only show if collaboration is enabled */}
          {(() => {
            // Check if collaboration controls should be shown
            return collaboration?.enabled && collaboration?.authors?.length > 1;
          })() && (
            <div className="scene-assignment">
              <label htmlFor="scene-author">Assigned to:</label>
              <select
                id="scene-author"
                value={scene.assignedAuthor || ''}
                onChange={handleAssignedAuthorChange}
                className="scene-author-select"
              >
                <option value="">Unassigned</option>
                {collaboration.authors.map(author => (
                  <option key={author} value={author}>
                    {author}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="scene-stats">
            Words:{' '}
            {
              (scene.content || '').split(/\s+/).filter(word => word.length > 0)
                .length
            }
          </div>
        </div>
      </div>

      <div className="editor-container">
        <div className="editor-toolbar">
          <button
            onClick={makeBold}
            className="format-btn"
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={makeItalic}
            className="format-btn"
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button onClick={makeHeading} className="format-btn" title="Heading">
            H
          </button>
          <button
            onClick={insertLineBreak}
            className="format-btn"
            title="Paragraph Break"
          >
            ¶
          </button>
          <button
            onClick={insertForcedLineBreak}
            className="format-btn"
            title="Forced Line Break (Shift+Enter)"
          >
            ↵
          </button>
          <div className="toolbar-separator" />
          <button
            onClick={enterDistractionFree}
            className="format-btn distraction-free-btn"
            title="Distraction-Free Mode (F11)"
          >
            🎯
          </button>
          <div className="format-help">
            <small>
              Markdown: **bold**, *italic*, ## heading | Shift+Enter: forced
              line break
            </small>
          </div>
        </div>

        <div className="scene-editor-textarea">
          <TextEditor
            ref={textareaRef}
            value={localContent}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Start writing your scene here..."
            spellCheck={true}
            rows={20}
          />
        </div>

        <div className="scene-notes">
          <h4>Scene Notes</h4>
          <TextEditor
            value={scene.notes || ''}
            onChange={handleNotesChange}
            placeholder="Notes about this scene..."
            rows={4}
            spellCheck={true}
          />
        </div>
      </div>

      {/* Distraction-Free Mode Overlay */}
      <DistractionFreeMode
        scene={scene}
        onSceneUpdate={onSceneUpdate}
        onClose={handleCloseDistractionFree}
        isOpen={isDistractionFree}
      />
    </div>
  );
}

export default SceneEditor;
