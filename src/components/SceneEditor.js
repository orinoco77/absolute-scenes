import { useRef } from 'react';

function SceneEditor({ scene, template: _template, onSceneUpdate }) {
  const textareaRef = useRef(null);

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
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert a forced line break that will be visible and preserved in export
      const newContent =
        textarea.value.substring(0, start) +
        '\n<!--FORCED_BREAK-->\n' + // Special marker for forced breaks
        textarea.value.substring(end);

      onSceneUpdate(scene.id, { content: newContent });

      // Move cursor after the marker
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 21, start + 21); // After the full marker
      }, 0);
    }
  };

  const handleNotesChange = e => {
    onSceneUpdate(scene.id, { notes: e.target.value });
  };

  // Text formatting functions for textarea
  const insertMarkdown = (before, after = '') => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      const replacement = before + (selectedText || 'text') + after;

      const newContent =
        textarea.value.substring(0, start) +
        replacement +
        textarea.value.substring(end);
      onSceneUpdate(scene.id, { content: newContent });

      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
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
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newContent =
        textarea.value.substring(0, start) +
        '\n<!--FORCED_BREAK-->\n' +
        textarea.value.substring(end);

      onSceneUpdate(scene.id, { content: newContent });

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 21, start + 21); // After the full marker
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
        <div className="scene-stats">
          Words:{' '}
          {scene.content.split(/\s+/).filter(word => word.length > 0).length}
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
          <div className="format-help">
            <small>
              Markdown: **bold**, *italic*, ## heading | Shift+Enter: forced
              line break
            </small>
          </div>
        </div>

        <div className="scene-editor-textarea">
          <textarea
            ref={textareaRef}
            value={scene.content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Start writing your scene here..."
            spellCheck="true"
          />
        </div>
      </div>

      <div className="scene-notes">
        <h4>Scene Notes</h4>
        <textarea
          value={scene.notes}
          onChange={handleNotesChange}
          placeholder="Notes about this scene..."
          rows="4"
        />
      </div>
    </div>
  );
}

export default SceneEditor;
