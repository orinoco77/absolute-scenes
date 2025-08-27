import { useRef, useState, useEffect } from 'react';
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

  // Handle F11 for distraction-free mode with fullscreen
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'F11') {
        e.preventDefault();
        setIsDistractionFree(true);

        // Enter fullscreen mode
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle exiting distraction-free mode
  const handleCloseDistractionFree = () => {
    setIsDistractionFree(false);

    // Exit fullscreen mode - this will trigger the fullscreenchange event
    // which will in turn send the 'fullscreen-exited' IPC message to show the menu
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

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

  const handleContentChange = e => {
    onSceneUpdate(scene.id, { content: e.target.value });
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

      onSceneUpdate(scene.id, { content: newContent });

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
      onSceneUpdate(scene.id, { content: newContent });

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

      onSceneUpdate(scene.id, { content: newContent });

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
            onClick={() => {
              setIsDistractionFree(true);
              // Enter fullscreen mode
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
              }
            }}
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
            value={scene.content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Start writing your scene here..."
            spellCheck={true}
            rows={20}
            style={{ minHeight: '400px' }}
          />
        </div>
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
