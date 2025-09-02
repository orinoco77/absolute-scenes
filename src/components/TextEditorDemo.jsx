import { useState, useRef } from 'react';
import TextEditor from './TextEditor';

/**
 * Demo component to showcase TextEditor functionality
 * This can be used for testing and demonstration purposes
 */
function TextEditorDemo() {
  const [text, setText] =
    useState(`This is a sample text for testing the TextEditor component.

You can try the following features:
- Press Ctrl+F or Ctrl+H to open find and replace
- Press Ctrl+Z to undo changes
- Press Ctrl+Shift+Z or Ctrl+Y to redo changes
- Type some text and use the find/replace functionality
- Try searching for "test" or "sample"
- The editor supports spell checking (try typing "spellling")

This editor is designed to replace all textareas in the application with a consistent editing experience that includes undo/redo and find/replace functionality.

Try typing some text here, then use Ctrl+Z to undo your changes.`);

  const editorRef = useRef(null);

  const handleChange = e => {
    setText(e.target.value);
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.redo();
    }
  };

  const handleShowFind = () => {
    if (editorRef.current) {
      editorRef.current.showFindReplace();
    }
  };

  const handleFocus = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>TextEditor Demo</h2>

      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={handleUndo}
          style={{
            marginRight: '8px',
            padding: '8px 16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: 'white',
            cursor: 'pointer'
          }}
        >
          Undo (Ctrl+Z)
        </button>

        <button
          onClick={handleRedo}
          style={{
            marginRight: '8px',
            padding: '8px 16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: 'white',
            cursor: 'pointer'
          }}
        >
          Redo (Ctrl+Y)
        </button>

        <button
          onClick={handleShowFind}
          style={{
            marginRight: '8px',
            padding: '8px 16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: 'white',
            cursor: 'pointer'
          }}
        >
          Find/Replace (Ctrl+F)
        </button>

        <button
          onClick={handleFocus}
          style={{
            padding: '8px 16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: 'white',
            cursor: 'pointer'
          }}
        >
          Focus Editor
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label
          style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
        >
          Enhanced Text Editor:
        </label>
        <TextEditor
          ref={editorRef}
          value={text}
          onChange={handleChange}
          rows={12}
          placeholder="Start typing here..."
          spellCheck={true}
          style={{
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ fontSize: '12px', color: '#666' }}>
        <p>
          <strong>Keyboard Shortcuts:</strong>
        </p>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>
            <code>Ctrl+Z</code> - Undo
          </li>
          <li>
            <code>Ctrl+Shift+Z</code> or <code>Ctrl+Y</code> - Redo
          </li>
          <li>
            <code>Ctrl+F</code> or <code>Ctrl+H</code> - Find/Replace
          </li>
          <li>
            <code>Escape</code> - Close Find/Replace panel
          </li>
        </ul>
        <p>
          <strong>Character count:</strong> {text.length}
        </p>
      </div>
    </div>
  );
}

export default TextEditorDemo;
