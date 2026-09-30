import { useState, useEffect, useCallback, useRef } from 'react';
import TextEditor from './TextEditor';

function BackgroundEditor({ document, template, onDocumentUpdate }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const textareaRef = useRef(null);
  const updateTimerRef = useRef(null);

  // Update local state when document prop changes
  useEffect(() => {
    if (document) {
      setTitle(document.title || '');
      setContent(document.content || '');
    } else {
      setTitle('');
      setContent('');
    }
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
    };
  }, [document]);

  // Auto-save function with debouncing
  const debouncedUpdate = useCallback(
    (field, value) => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
      const documentId = document?.id;
      updateTimerRef.current = setTimeout(() => {
        updateTimerRef.current = null;
        if (!documentId) return;
        try {
          onDocumentUpdate(documentId, { [field]: value });
        } catch (error) {
          // A GitHub sync may have removed this document while the
          // debounce was pending — matches the old silent-no-op behavior
          // for that one race instead of surfacing an uncaught error.
          if (!/^Document not found/.test(error.message)) throw error;
        }
      }, 500);
    },
    [document, onDocumentUpdate]
  );

  const handleTitleChange = e => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedUpdate('title', newTitle);
  };

  const handleContentChange = e => {
    const newContent = e.target.value;
    setContent(newContent);
    debouncedUpdate('content', newContent);
  };

  const insertFormatting = (prefix, suffix = '') => {
    const textEditor = textareaRef.current;
    if (!textEditor) return;

    const start = textEditor.selectionStart;
    const end = textEditor.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      content.substring(end);

    setContent(newText);
    debouncedUpdate('content', newText);

    // Restore cursor position
    setTimeout(() => {
      textEditor.focus();
      textEditor.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertSection = () => {
    insertFormatting('\n\n## Section Title\n\n');
  };

  const insertBulletPoint = () => {
    insertFormatting('\n• ');
  };

  const getWordCount = text => {
    return text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
  };

  const getCharCount = text => {
    return text ? text.length : 0;
  };

  if (!document) {
    return (
      <div className="background-editor">
        <div className="no-content-selected">
          <h3>No Document Selected</h3>
          <p>
            Select a background document from the folders to start writing, or
            create a new document.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="background-editor">
      <div className="scene-header">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="scene-title-input"
          placeholder="Document Title"
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: `${Math.max(template.fontSize + 4, 18)}px`
          }}
        />
        <div className="scene-stats">
          Words: {getWordCount(content)} | Characters: {getCharCount(content)}
          {document.modified && (
            <span>
              {' '}
              | Modified: {new Date(document.modified).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="editor-container">
        <div className="fallback-editor">
          <div className="editor-toolbar">
            <button
              onClick={() => insertFormatting('**', '**')}
              className="format-btn"
              title="Bold (Ctrl/Cmd+B)"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => insertFormatting('*', '*')}
              className="format-btn"
              title="Italic (Ctrl/Cmd+I)"
            >
              <em>I</em>
            </button>
            <button
              onClick={insertSection}
              className="format-btn"
              title="Section Heading"
            >
              H2
            </button>
            <button
              onClick={insertBulletPoint}
              className="format-btn"
              title="Bullet Point"
            >
              •
            </button>
            <button
              onClick={() => insertFormatting('\n\n---\n\n')}
              className="format-btn"
              title="Horizontal Rule"
            >
              ─
            </button>
            <span className="format-help">
              Use **bold**, *italic*, ## headings, and • bullet points
            </span>
          </div>

          <div className="background-editor-textarea">
            <TextEditor
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              markdownShortcuts
              className="background-content-textarea"
              placeholder="Write your background information here...

This is your space for:
• World-building details
• Historical context  
• Character backstories
• Plot development notes
• Research and references

Organize your thoughts and keep track of the deeper elements that inform your story."
              spellCheck={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BackgroundEditor;
