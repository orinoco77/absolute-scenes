import { useState, useRef, useEffect } from 'react';
import TextEditor from './TextEditor';

function IllustrationEditor({ illustration, onIllustrationUpdate }) {
  const [title, setTitle] = useState(illustration?.title || '');
  const [pageNumber, setPageNumber] = useState(illustration?.pageNumber || '');
  const [caption, setCaption] = useState(illustration?.caption || '');
  const [altText, setAltText] = useState(illustration?.altText || '');
  const fileInputRef = useRef(null);

  // Update local state when illustration changes
  useEffect(() => {
    if (illustration) {
      setTitle(illustration.title || '');
      setPageNumber(illustration.pageNumber || '');
      setCaption(illustration.caption || '');
      setAltText(illustration.altText || '');
    } else {
      setTitle('');
      setPageNumber('');
      setCaption('');
      setAltText('');
    }
  }, [illustration]);

  if (!illustration) {
    return (
      <div className="no-illustration">
        <h3>🎨 No Illustration Selected</h3>
        <p>
          Select an illustration from the list to edit it, or add a new
          illustration to get started.
        </p>
      </div>
    );
  }

  const handleTitleChange = newTitle => {
    setTitle(newTitle);
    onIllustrationUpdate(illustration.id, {
      ...illustration,
      title: newTitle,
      modified: new Date().toISOString()
    });
  };

  const handlePageNumberChange = newPageNumber => {
    const pageNum = newPageNumber === '' ? null : parseInt(newPageNumber, 10);
    setPageNumber(newPageNumber);
    onIllustrationUpdate(illustration.id, {
      ...illustration,
      pageNumber: pageNum,
      modified: new Date().toISOString()
    });
  };

  const handleImageUpload = event => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('Image file is too large. Please select a file under 50MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const imageData = e.target.result;
      onIllustrationUpdate(illustration.id, {
        ...illustration,
        imageData,
        imageFileName: file.name,
        modified: new Date().toISOString()
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    onIllustrationUpdate(illustration.id, {
      ...illustration,
      imageData: null,
      imageFileName: null,
      modified: new Date().toISOString()
    });
  };

  return (
    <div className="illustration-editor">
      <div className="illustration-header">
        <div className="illustration-title-section">
          <div className="illustration-icon-large">🎨</div>
          <div className="illustration-title-inputs">
            <input
              type="text"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              className="illustration-title-input"
              placeholder="Illustration title..."
            />
            <div className="illustration-type-label">
              Full-Page Illustration
            </div>
          </div>
        </div>

        <div className="illustration-stats">
          {illustration.imageFileName && (
            <span className="stat">📷 {illustration.imageFileName}</span>
          )}
          <span className="stat">
            Modified: {new Date(illustration.modified).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="editor-container">
        {/* Page Number Assignment */}
        <div className="page-assignment-section">
          <label htmlFor="page-number">Page Number</label>
          <input
            id="page-number"
            type="number"
            min="1"
            value={pageNumber}
            onChange={e => handlePageNumberChange(e.target.value)}
            className="page-number-input"
            placeholder="Enter page number..."
          />
        </div>

        {/* SIMPLE IMAGE UPLOAD - No fancy containers */}
        <div
          className="simple-upload-section"
          style={{
            margin: '20px 0',
            padding: '20px',
            border: '2px solid var(--color-border)'
          }}
        >
          <h4>Upload Image</h4>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary btn-lg"
            style={{
              display: 'block',
              margin: '10px 0'
            }}
          >
            📁 Choose Image File
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />

          {illustration.imageData && (
            <div style={{ marginTop: '20px' }}>
              <img
                src={illustration.imageData}
                alt={illustration.title}
                style={{
                  maxWidth: '200px',
                  height: 'auto',
                  border: '1px solid var(--color-border)'
                }}
              />
              <br />
              <button
                onClick={handleRemoveImage}
                className="btn btn-error"
                style={{
                  marginTop: '10px'
                }}
              >
                Remove Image
              </button>
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="caption-section">
          <label htmlFor="caption">Caption (optional)</label>
          <TextEditor
            id="caption"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption..."
            rows={2}
            className="caption-textarea"
            spellCheck={true}
          />
        </div>

        {/* Alt Text */}
        <div className="alt-text-section">
          <label htmlFor="alt-text">Alt Text</label>
          <TextEditor
            id="alt-text"
            value={altText}
            onChange={e => setAltText(e.target.value)}
            placeholder="Describe the illustration for accessibility..."
            rows={2}
            className="alt-text-textarea"
            spellCheck={true}
          />
        </div>
      </div>
    </div>
  );
}

export default IllustrationEditor;
