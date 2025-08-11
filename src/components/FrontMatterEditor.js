/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';

function FrontMatterEditor({
  frontMatterItem,
  onFrontMatterUpdate,
  authorName = ''
}) {
  const [title, setTitle] = useState(frontMatterItem?.title || '');
  const [content, setContent] = useState(frontMatterItem?.content || '');
  const fileInputRef = useRef(null);

  // Update local state when frontMatterItem changes
  useEffect(() => {
    if (frontMatterItem) {
      setTitle(frontMatterItem.title || '');
      setContent(frontMatterItem.content || '');
    } else {
      setTitle('');
      setContent('');
    }
  }, [frontMatterItem]);

  if (!frontMatterItem) {
    return (
      <div className="no-front-matter">
        <h3>📄 No Front Matter Selected</h3>
        <p>
          Select a front matter section from the list to edit it, or add a new
          section to get started.
        </p>
        <div className="front-matter-info">
          <h4>Available Front Matter Types:</h4>
          <ul>
            <li>
              <strong>Copyright:</strong> Essential legal information and
              publication details
            </li>
            <li>
              <strong>Dedication:</strong> Personal message to someone special
            </li>
            <li>
              <strong>Acknowledgments:</strong> Thank you messages to
              contributors
            </li>
            <li>
              <strong>Foreword:</strong> Introduction written by another author
            </li>
            <li>
              <strong>Prologue:</strong> Story introduction or opening scene
            </li>
            <li>
              <strong>Map:</strong> Visual maps or illustrations for your world
            </li>
          </ul>
        </div>
      </div>
    );
  }

  const handleTitleChange = newTitle => {
    setTitle(newTitle);
    onFrontMatterUpdate(frontMatterItem.id, {
      ...frontMatterItem,
      title: newTitle,
      modified: new Date().toISOString()
    });
  };

  // Replace [Author Name] placeholder with actual author name in stored content
  const replaceAuthorNamePlaceholder = () => {
    if (
      frontMatterItem.type === 'copyright' &&
      authorName &&
      content.includes('[Author Name]')
    ) {
      const updatedContent = content.replace(/\[Author Name\]/g, authorName);
      setContent(updatedContent);
      onFrontMatterUpdate(frontMatterItem.id, {
        ...frontMatterItem,
        content: updatedContent,
        modified: new Date().toISOString()
      });
    }
  };

  const handleContentChange = newContent => {
    setContent(newContent);
    onFrontMatterUpdate(frontMatterItem.id, {
      ...frontMatterItem,
      content: newContent,
      modified: new Date().toISOString()
    });
  };

  const handleImageUpload = event => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Validate file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file is too large. Please select a file under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const imageData = e.target.result;
      onFrontMatterUpdate(frontMatterItem.id, {
        ...frontMatterItem,
        imageData,
        imageFileName: file.name,
        modified: new Date().toISOString()
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    onFrontMatterUpdate(frontMatterItem.id, {
      ...frontMatterItem,
      imageData: null,
      imageFileName: null,
      modified: new Date().toISOString()
    });
  };

  const getWordCount = () => {
    if (!content) return 0;
    return content.split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharacterCount = () => {
    return content ? content.length : 0;
  };

  const renderImageEditor = () => (
    <div className="map-editor">
      <div className="image-upload-section">
        <div className="image-upload-area">
          {frontMatterItem.imageData ? (
            <div className="image-preview">
              <img
                src={frontMatterItem.imageData}
                alt={frontMatterItem.title}
                className="uploaded-image"
              />
              <div className="image-info">
                <span className="image-filename">
                  {frontMatterItem.imageFileName}
                </span>
                <button
                  className="remove-image-btn"
                  onClick={handleRemoveImage}
                  title="Remove image"
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="image-upload-prompt">
              <div className="upload-icon">🖼️</div>
              <h4>Add Map Image</h4>
              <p>
                Upload an image file for your map. Supported formats: PNG, JPG,
                GIF, WebP
              </p>
              <button
                className="upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                📁 Choose Image
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>

      {frontMatterItem.imageData && (
        <div className="image-options">
          <button
            className="replace-image-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            🔄 Replace Image
          </button>
        </div>
      )}

      <div className="map-description">
        <label htmlFor="map-description">Description (optional):</label>
        <textarea
          id="map-description"
          value={content}
          onChange={e => handleContentChange(e.target.value)}
          placeholder="Add a description or caption for this map..."
          rows={3}
        />
      </div>
    </div>
  );

  const renderTextEditor = () => (
    <div className="front-matter-editor-textarea">
      <div className="editor-toolbar">
        <span className="editor-label">Content</span>
        <div className="format-help">
          Use **bold**, *italic*, and line breaks for formatting
        </div>
      </div>
      <textarea
        value={content}
        onChange={e => handleContentChange(e.target.value)}
        placeholder={getPlaceholderText()}
        className="front-matter-content-textarea"
      />
    </div>
  );

  const getPlaceholderText = () => {
    switch (frontMatterItem.type) {
      case 'copyright':
        return 'Copyright information will be pre-filled. You can customize it as needed...';
      case 'dedication':
        return 'To my family, friends, and everyone who believed in this story...';
      case 'acknowledgments':
        return 'I would like to thank...';
      case 'foreword':
        return 'Write an introduction to the book...';
      case 'prologue':
        return 'Begin your story with a compelling opening...';
      default:
        return 'Enter your content here...';
    }
  };

  return (
    <div className="front-matter-editor">
      <div className="front-matter-header">
        <div className="front-matter-title-section">
          <div className="front-matter-icon-large">
            {getFrontMatterIcon(frontMatterItem.type)}
          </div>
          <div className="front-matter-title-inputs">
            <input
              type="text"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              className="front-matter-title-input"
              placeholder="Section title..."
            />
            <div className="front-matter-type-label">
              {getFrontMatterTypeLabel(frontMatterItem.type)}
            </div>
          </div>
        </div>

        <div className="front-matter-stats">
          {frontMatterItem.type === 'map' ? (
            <div className="image-stats">
              {frontMatterItem.imageFileName && (
                <span className="stat">📷 {frontMatterItem.imageFileName}</span>
              )}
            </div>
          ) : (
            <div className="text-stats">
              <span className="stat">Words: {getWordCount()}</span>
              <span className="stat">Characters: {getCharacterCount()}</span>
            </div>
          )}
          <span className="stat">
            Modified: {new Date(frontMatterItem.modified).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="editor-container">
        {frontMatterItem.type === 'map'
          ? renderImageEditor()
          : renderTextEditor()}
      </div>

      {frontMatterItem.type === 'copyright' && (
        <div className="copyright-help">
          <h4>💡 Copyright Page Tips:</h4>
          <ul>
            <li>Author name is automatically filled from your book details</li>
            <li>Add your email or publisher contact information</li>
            <li>Update the ISBN when you get one assigned</li>
            <li>Specify the country where the book was printed</li>
            <li>Customize the permissions text as needed</li>
          </ul>
          {authorName && content.includes('[Author Name]') && (
            <div
              style={{
                marginTop: '15px',
                padding: '10px',
                background: '#fff3cd',
                borderRadius: '4px',
                border: '1px solid #ffeaa7'
              }}
            >
              <p
                style={{
                  margin: '0 0 10px 0',
                  fontSize: '13px',
                  color: '#856404'
                }}
              >
                Found [Author Name] placeholder in your copyright text. Replace
                it with "{authorName}"?
              </p>
              <button
                onClick={replaceAuthorNamePlaceholder}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => (e.target.style.background = '#218838')}
                onMouseLeave={e => (e.target.style.background = '#28a745')}
              >
                Replace with {authorName}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getFrontMatterIcon(type) {
  const icons = {
    copyright: '©️',
    dedication: '💝',
    acknowledgments: '🙏',
    foreword: '📝',
    prologue: '🎭',
    map: '🗺️'
  };
  return icons[type] || '📄';
}

function getFrontMatterTypeLabel(type) {
  const labels = {
    copyright: 'Copyright Page',
    dedication: 'Dedication Page',
    acknowledgments: 'Acknowledgments',
    foreword: 'Foreword',
    prologue: 'Prologue',
    map: 'Map/Illustration'
  };
  return labels[type] || type;
}

export default FrontMatterEditor;
