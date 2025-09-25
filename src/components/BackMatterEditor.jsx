import { useState, useRef, useEffect } from 'react';
import TextEditor from './TextEditor';

function BackMatterEditor({
  backMatterItem,
  onBackMatterUpdate,
  authorName = ''
}) {
  const [title, setTitle] = useState(backMatterItem?.title || '');
  const [content, setContent] = useState(backMatterItem?.content || '');
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Update local state when backMatterItem changes
  useEffect(() => {
    if (backMatterItem) {
      setTitle(backMatterItem.title || '');
      setContent(backMatterItem.content || '');
    } else {
      setTitle('');
      setContent('');
    }
  }, [backMatterItem]);

  if (!backMatterItem) {
    return (
      <div className="no-content-selected">
        <h3>📑 No Back Matter Selected</h3>
        <p>
          Select a back matter section from the list to edit it, or add a new
          section to get started.
        </p>
        <div className="back-matter-info">
          <h4>Available Back Matter Types:</h4>
          <ul>
            <li>
              <strong>Epilogue:</strong> Concluding section that ties up loose
              ends
            </li>
            <li>
              <strong>Acknowledgments:</strong> Thank you messages to
              contributors
            </li>
            <li>
              <strong>Appendix:</strong> Supplementary information and data
            </li>
            <li>
              <strong>Glossary:</strong> Definitions of terms used in the book
            </li>
            <li>
              <strong>Bibliography:</strong> List of sources and references
            </li>
            <li>
              <strong>Index:</strong> Alphabetical list of topics and page
              numbers
            </li>
            <li>
              <strong>About the Author:</strong> Author biography and
              credentials
            </li>
          </ul>
        </div>
      </div>
    );
  }

  const handleTitleChange = newTitle => {
    setTitle(newTitle);
    onBackMatterUpdate(backMatterItem.id, {
      ...backMatterItem,
      title: newTitle,
      modified: new Date().toISOString()
    });
  };

  // Replace [Author Name] placeholder with actual author name in stored content
  const replaceAuthorNamePlaceholder = () => {
    if (
      backMatterItem.type === 'about-author' &&
      authorName &&
      content.includes('[Author Name]')
    ) {
      const updatedContent = content.replace(/\[Author Name\]/g, authorName);
      setContent(updatedContent);
      onBackMatterUpdate(backMatterItem.id, {
        ...backMatterItem,
        content: updatedContent,
        modified: new Date().toISOString()
      });
    }
  };

  const handleContentChange = e => {
    const newContent = e.target.value;
    setContent(newContent);
    onBackMatterUpdate(backMatterItem.id, {
      ...backMatterItem,
      content: newContent,
      modified: new Date().toISOString()
    });
  };

  const handleKeyDown = e => {
    // Handle Shift+Enter for forced line breaks (only for epilogue)
    if (e.key === 'Enter' && e.shiftKey && backMatterItem.type === 'epilogue') {
      e.preventDefault();
      const textEditor = textareaRef.current;
      const start = textEditor.selectionStart;
      const end = textEditor.selectionEnd;
      const newContent =
        content.substring(0, start) + '\n' + content.substring(end);
      setContent(newContent);
      onBackMatterUpdate(backMatterItem.id, {
        ...backMatterItem,
        content: newContent,
        modified: new Date().toISOString()
      });
      // Set cursor position after the inserted newline
      setTimeout(() => {
        textEditor.setSelectionRange(start + 1, start + 1);
      }, 0);
    }
  };

  const handleImageUpload = event => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        alert('Image file is too large. Please choose an image under 50MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        const imageData = e.target.result;
        onBackMatterUpdate(backMatterItem.id, {
          ...backMatterItem,
          imageData,
          imageFileName: file.name,
          content: `[Image: ${file.name}]`,
          modified: new Date().toISOString()
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    onBackMatterUpdate(backMatterItem.id, {
      ...backMatterItem,
      imageData: null,
      imageFileName: null,
      content: '',
      modified: new Date().toISOString()
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const typeConfig = getTypeConfig(backMatterItem.type);

  const getWordCount = () => {
    if (!content) return 0;
    return content.split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = () => {
    return content ? content.length : 0;
  };

  const renderImageEditor = () => (
    <div className="back-matter-image-section">
      <div className="image-upload-area">
        {backMatterItem.imageData ? (
          <div className="image-preview">
            <img
              src={backMatterItem.imageData}
              alt={backMatterItem.title}
              className="uploaded-image"
            />
            <div className="image-info">
              <span className="image-filename">
                {backMatterItem.imageFileName}
              </span>
              <button
                className="remove-image-btn"
                onClick={clearImage}
                title="Remove image"
              >
                🗑️ Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="image-upload-placeholder">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <button
              className="upload-image-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📁 Choose Image
            </button>
            <p>Upload an image for this section</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTextEditor = () => (
    <div className="back-matter-editor-textarea">
      <div className="editor-toolbar">
        <span className="editor-label">Content</span>
        <div className="editor-actions">
          {backMatterItem.type === 'about-author' &&
            authorName &&
            content.includes('[Author Name]') && (
              <button
                type="button"
                onClick={replaceAuthorNamePlaceholder}
                className="replace-author-button"
                title={`Replace [Author Name] with ${authorName}`}
              >
                🔄 Replace Author Name
              </button>
            )}
        </div>
        <div className="format-help">
          Use **bold**, *italic*, and line breaks for formatting
          {backMatterItem.type === 'epilogue' &&
            ' | Shift+Enter: forced line break'}
        </div>
      </div>
      <TextEditor
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown}
        placeholder={typeConfig.placeholder}
        className="back-matter-content-textarea"
        spellCheck={true}
      />
    </div>
  );

  return (
    <div className="back-matter-editor" data-type={backMatterItem.type}>
      <div className="back-matter-header">
        <div className="back-matter-title-section">
          <div className="back-matter-icon-large">{typeConfig.icon}</div>
          <div className="back-matter-title-inputs">
            <input
              type="text"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              className="back-matter-title-input"
              placeholder="Section title..."
            />
            <div className="back-matter-type-label">{typeConfig.title}</div>
          </div>
        </div>

        <div className="back-matter-stats">
          {typeConfig.isImage ? (
            <div className="image-stats">
              {backMatterItem.imageFileName && (
                <span className="stat">📷 {backMatterItem.imageFileName}</span>
              )}
            </div>
          ) : (
            <div className="text-stats">
              <span className="stat">Words: {getWordCount()}</span>
              <span className="stat">Characters: {getCharacterCount()}</span>
            </div>
          )}
          <span className="stat">
            Modified: {new Date(backMatterItem.modified).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="back-matter-content-container">
        {typeConfig.isImage ? renderImageEditor() : renderTextEditor()}
      </div>
    </div>
  );
}

function getTypeConfig(type) {
  const configs = {
    epilogue: {
      title: 'Epilogue',
      icon: '🎬',
      placeholder: 'Write your epilogue here...'
    },
    acknowledgments: {
      title: 'Acknowledgments',
      icon: '🙏',
      placeholder: 'Thank the people who helped make this book possible...'
    },
    appendix: {
      title: 'Appendix',
      icon: '📋',
      placeholder:
        'Add supplementary information, data, or additional material...'
    },
    glossary: {
      title: 'Glossary',
      icon: '📖',
      placeholder:
        'Define key terms and specialized vocabulary used in your book...'
    },
    bibliography: {
      title: 'Bibliography',
      icon: '📚',
      placeholder: 'List your sources, references, and citations...'
    },
    index: {
      title: 'Index',
      icon: '🔍',
      placeholder: 'Create an alphabetical list of topics with page numbers...'
    },
    'about-author': {
      title: 'About the Author',
      icon: '👤',
      placeholder: 'Write your author biography and credentials...'
    }
  };
  return configs[type] || configs.appendix;
}

export default BackMatterEditor;
