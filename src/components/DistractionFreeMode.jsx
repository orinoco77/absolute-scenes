import { useState, useRef, useEffect } from 'react';
import './DistractionFreeMode.css';
import TextEditor from './TextEditor';

function DistractionFreeMode({ scene, onSceneUpdate, onClose, isOpen }) {
  const textareaRef = useRef(null);
  const [content, setContent] = useState(scene?.content || '');

  // Update content when scene changes
  useEffect(() => {
    setContent(scene?.content || '');
  }, [scene?.content]);

  // Focus textarea when opening
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isOpen]);

  // Handle escape key to exit
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleContentChange = e => {
    const newContent = e.target.value;
    setContent(newContent);

    // Update scene in real-time
    if (scene) {
      onSceneUpdate(scene.id, { content: newContent });
    }
  };

  const handleKeyDown = e => {
    // Handle Shift+Enter for forced line breaks (same as regular editor)
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      const textEditor = textareaRef.current;
      const start = textEditor.selectionStart;
      const end = textEditor.selectionEnd;

      const newContent =
        textEditor.value.substring(0, start) +
        '\n<!--FORCED_BREAK-->\n' +
        textEditor.value.substring(end);

      setContent(newContent);
      if (scene) {
        onSceneUpdate(scene.id, { content: newContent });
      }

      // Move cursor after the marker
      setTimeout(() => {
        textEditor.focus();
        textEditor.setSelectionRange(start + 21, start + 21);
      }, 0);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="distraction-free-overlay">
      {/* Close button - subtle in top-right */}
      <button
        className="distraction-free-close"
        onClick={onClose}
        title="Exit Distraction-Free Mode (Esc)"
      >
        ×
      </button>

      {/* Scene title - subtle at top */}
      <div className="distraction-free-title">
        {scene?.title || 'Untitled Scene'}
      </div>

      {/* Main writing area */}
      <div className="distraction-free-editor">
        <TextEditor
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder={scene ? 'Continue writing...' : 'Start writing...'}
          spellCheck={true}
          className="distraction-free-textarea"
          style={{
            width: '100%',
            maxWidth: '800px',
            height: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#e8e8e8',
            fontSize: '18px',
            lineHeight: '1.6',
            fontFamily: 'inherit',
            resize: 'none',
            padding: '40px'
          }}
        />
      </div>

      {/* Subtle word count at bottom */}
      <div className="distraction-free-stats">
        {
          content
            .trim()
            .split(/\s+/)
            .filter(word => word.length > 0).length
        }{' '}
        words
      </div>
    </div>
  );
}

export default DistractionFreeMode;
