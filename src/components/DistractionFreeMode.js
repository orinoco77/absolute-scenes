import { useState, useRef, useEffect } from 'react';
import './DistractionFreeMode.css';

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
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newContent =
        textarea.value.substring(0, start) +
        '\n<!--FORCED_BREAK-->\n' +
        textarea.value.substring(end);

      setContent(newContent);
      if (scene) {
        onSceneUpdate(scene.id, { content: newContent });
      }

      // Move cursor after the marker
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 21, start + 21);
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
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder={scene ? 'Continue writing...' : 'Start writing...'}
          spellCheck="true"
          className="distraction-free-textarea"
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
